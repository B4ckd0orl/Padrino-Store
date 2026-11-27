import assert from 'node:assert/strict';
import {register} from 'node:module';
import test from 'node:test';

register(new URL('./download-queue-test-loader.mjs', import.meta.url), import.meta.url);
const {createDownloadQueue} = await import('./download-queue.js');

// A USB drive's root answers another device number after every boot, so a download paused on it
// has to recognise the drive by something the drive itself keeps.
const ROOT = '/mnt/usb0';

function console_() {
  const files = new Map();
  const dirs = new Set(['/data', ROOT]);
  const drive = {device: 'dev1'};
  const fs = {
    exists: path => dirs.has(path) || files.has(path),
    stat: path => dirs.has(path) ? {isDirectory: true, device: drive.device, inode: 'root', modified: 0} :
      files.has(path) ? {isFile: true, size: 4096, modified: 0} : null,
    diskUsage: () => ({free: 1024 ** 4}),
    mkdir: path => { dirs.add(path); },
    writeFile: (path, data) => { files.set(path, data); },
    readFile: path => files.get(path) ?? '',
    rename: (source, target) => { if (files.has(source)) { files.set(target, files.get(source)); files.delete(source); } },
    readDir: () => [],
    remove: path => { files.delete(path); },
    removeAsync: async path => { files.delete(path); dirs.delete(path); },
  };
  return {files, dirs, drive, fs};
}

// One boot of the app: its first transfer hangs until paused, the next one finishes.
function boot(machine, storage = {}) {
  let transfers = 0;
  const downloads = {
    enqueue({destination}) {
      if (machine.hang && transfers++ === 0) {
        machine.files.set(destination + '.part', 'half');
        let fail;
        return {
          done: new Promise((resolve, reject) => { fail = reject; }),
          snapshot: {state: 'downloading'},
          subscribe: () => () => {},
          cancel: () => fail(new Error('cancelled')),
        };
      }
      machine.files.delete(destination + '.part');
      machine.files.set(destination, 'game bytes');
      return {done: Promise.resolve({written: 4096}), snapshot: {state: 'completed'}, subscribe: () => () => {}, cancel: () => {}};
    },
  };
  const formats = {artifact: (release, where) => ({
    directory: where + '/downloads/files',
    destination: where + '/downloads/files/' + release.filename,
    nextAction: 'downloaded',
  })};
  return createDownloadQueue({
    fs: machine.fs, downloads, formats, dataDir: '/data', platform: 'desktop',
    notifications: {show() {}}, power: {keepAwake() {}},
    ...storage,
    sources: {resolve: async () => ({url: 'https://example.com/game.pkg'})},
  });
}

async function settled(queue, id, states) {
  for (const until = Date.now() + 5000; Date.now() < until;) {
    const job = queue.snapshot().find(item => item.id === id);
    if (states.includes(job?.state)) return job;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  throw new Error('Queue did not settle: ' + JSON.stringify(queue.snapshot().find(item => item.id === id)));
}

async function pausedOnUsb(machine) {
  machine.hang = true;
  const queue = boot(machine);
  const release = {id: 'source-1', filename: 'game.pkg', url: 'https://example.com/game.pkg', format: 'pkg'};
  const id = queue.enqueue({id: 'PPSA28000', title: 'Demo'}, release, ROOT);
  for (const until = Date.now() + 5000; !machine.files.has(ROOT + '/downloads/files/game.pkg.part') && Date.now() < until;)
    await new Promise(resolve => setTimeout(resolve, 5));
  queue.pause(id);
  await settled(queue, id, ['paused']);
  machine.hang = false;
  return id;
}

test('a download paused on a USB drive resumes after a reboot gives the drive another device number', async () => {
  const machine = console_();
  const id = await pausedOnUsb(machine);
  machine.drive.device = 'dev2';
  const queue = boot(machine);
  queue.resume(id);
  const job = await settled(queue, id, ['file-downloaded', 'failed', 'paused']);
  assert.equal(job.state, 'file-downloaded', job.error);
});

test('another drive in the same port is still refused', async () => {
  const machine = console_();
  const id = await pausedOnUsb(machine);
  machine.files.delete(ROOT + '/downloads/.drive-id');
  const queue = boot(machine);
  queue.resume(id);
  const job = await settled(queue, id, ['file-downloaded', 'failed', 'paused']);
  assert.notEqual(job.state, 'file-downloaded');
  assert.match(job.error, /Storage changed/);
});

test('a task saved before the id file resumes on its drive and takes the id', async () => {
  const machine = console_();
  const id = await pausedOnUsb(machine);
  const state = '/data/padrino-store/downloads.json';
  const saved = JSON.parse(machine.files.get(state));
  saved.jobs[0].rootIdentity = 'dev1:root';
  machine.files.set(state, JSON.stringify(saved));
  machine.files.delete(ROOT + '/downloads/.drive-id');
  machine.drive.device = 'dev2';
  const queue = boot(machine);
  queue.resume(id);
  const job = await settled(queue, id, ['file-downloaded', 'failed', 'paused']);
  assert.equal(job.state, 'file-downloaded', job.error);
  assert.match(machine.files.get(ROOT + '/downloads/.drive-id'), /^drive:/);
});

test('a queue stranded in app data migrates to writable console storage and keeps its partial', async () => {
  const machine = console_();
  const id = await pausedOnUsb(machine);
  const sandbox = '/download0/padrino-store/downloads.json';
  const preferred = '/data/ps5-react/PPSA99059/queue';
  const fallback = '/data/ps5-react-PPSA99059/queue';
  machine.files.set(sandbox, machine.files.get('/data/padrino-store/downloads.json'));
  machine.files.set(sandbox + '.tmp', '');
  const mkdir = machine.fs.mkdir;
  machine.fs.mkdir = path => {
    if (path === preferred) throw new Error('Permission denied');
    mkdir(path);
  };
  const writeFile = machine.fs.writeFile;
  machine.fs.writeFile = (path, data) => {
    if (path.startsWith('/download0/')) throw new Error('No space left on device');
    writeFile(path, data);
  };
  const storage = {dataDir: '/download0', stateDir: preferred, fallbackStateDir: fallback};
  const queue = boot(machine, storage);
  const migrated = machine.files.get(fallback + '/downloads.json');
  assert.ok(migrated, 'the queue was saved outside the full app volume during startup');
  assert.equal(JSON.parse(migrated).jobs[0].id, id);
  assert.ok(machine.files.has(ROOT + '/downloads/files/game.pkg.part'));
  queue.resume(id);
  const job = await settled(queue, id, ['file-downloaded', 'failed']);
  assert.equal(job.state, 'file-downloaded', job.error);
  assert.equal(boot(machine, storage).snapshot().find(job => job.id === id)?.state, 'file-downloaded');
});

test('migration recovers the older console data path when the preferred queue save is refused', async () => {
  const machine = console_();
  const id = await pausedOnUsb(machine);
  const previous = '/data/ps5-react/PPSA99059/padrino-store';
  const preferred = '/data/ps5-react/PPSA99059/queue';
  const fallback = '/data/ps5-react-PPSA99059/queue';
  machine.files.set(previous + '/downloads.json', machine.files.get('/data/padrino-store/downloads.json'));
  const rename = machine.fs.rename;
  machine.fs.rename = (source, target) => {
    if (target === preferred + '/downloads.json') throw new Error('Permission denied');
    rename(source, target);
  };
  const queue = boot(machine, {
    dataDir: '/download0', stateDir: preferred, fallbackStateDir: fallback, previousStateDirs: [previous],
  });
  assert.equal(queue.snapshot().find(job => job.id === id)?.state, 'paused');
  assert.equal(JSON.parse(machine.files.get(fallback + '/downloads.json')).jobs[0].id, id);
  assert.ok(machine.files.has(ROOT + '/downloads/files/game.pkg.part'));
});
