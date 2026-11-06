import assert from 'node:assert/strict';
import {register} from 'node:module';
import test from 'node:test';

register(new URL('./download-queue-test-loader.mjs', import.meta.url), import.meta.url);
const {createDownloadQueue} = await import('./download-queue.js');

// A source that answers HTTP 429 (rate-limited) or 5xx (busy) still has the file: the queue waits it
// out by itself — 3 minutes, then 10 — and only a third refusal fails the job for the player to pick
// another source. The waits are injected here in milliseconds so the test runs in a second.
const ROOT = '/data';
const DESTINATION = ROOT + '/downloads/files/game.pkg';

function harness({answers, delays = [60, 90], bytes = 4096}) {
  const files = new Map();
  const dirs = new Set([ROOT, ROOT + '/downloads', ROOT + '/downloads/files']);
  const fs = {
    exists: path => dirs.has(path) || files.has(path),
    stat: path => dirs.has(path) ? {isDirectory: true, device: 'dev1', inode: 'root', modified: 0} :
      files.has(path) ? {isFile: true, size: String(files.get(path)).length, modified: 0} : null,
    diskUsage: () => ({free: 1024 ** 4}),
    mkdir: path => { dirs.add(path); },
    writeFile: (path, data) => { files.set(path, data); },
    readFile: path => files.get(path) ?? '',
    rename: (source, target) => { if (files.has(source)) { files.set(target, files.get(source)); files.delete(source); } },
    readDir: () => [],
    remove: path => { files.delete(path); },
    removeAsync: async path => { files.delete(path); dirs.delete(path); },
  };
  let attempts = 0;
  const downloads = {
    enqueue({destination}) {
      const answer = answers[Math.min(attempts++, answers.length - 1)];
      if (answer === 'busy')
        return {done: Promise.reject(new Error('HTTP 429 Too Many Requests')), snapshot: {state: 'failed'},
          subscribe: () => () => {}, cancel: () => {}};
      files.set(destination, 'x'.repeat(bytes));
      return {done: Promise.resolve({written: bytes}), snapshot: {state: 'completed'},
        subscribe: () => () => {}, cancel: () => {}};
    },
  };
  const formats = {artifact: (release, where) => ({
    directory: where + '/downloads/files',
    destination: where + '/downloads/files/' + release.filename,
    nextAction: 'downloaded',
  })};
  const queue = createDownloadQueue({
    fs, downloads, formats, dataDir: ROOT, platform: 'desktop',
    busyRetryDelays: delays,
    notifications: {show() {}}, power: {keepAwake() {}},
    sources: {resolve: async () => ({url: 'https://filekeeper.net/file/abc'})},
  });
  return {queue, files, attempts: () => attempts};
}

const release = {id: 'source-1', filename: 'game.pkg', url: 'https://filekeeper.net/file/abc', format: 'pkg', sizeBytes: 4096};
const game = {id: 'PPSA28000', title: 'Demo'};

async function settled(queue, id, states, until = 5000) {
  for (const end = Date.now() + until; Date.now() < end;) {
    const job = queue.snapshot().find(item => item.id === id);
    if (states.includes(job?.state)) return job;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  throw new Error('Queue did not settle: ' + JSON.stringify(queue.snapshot().find(item => item.id === id)));
}

// The wait itself, seen as the player sees it: still queued, with the countdown in the error line.
async function waiting(queue, id) {
  for (const end = Date.now() + 3000; Date.now() < end;) {
    const job = queue.snapshot().find(item => item.id === id);
    if (job?.state === 'queued' && job.retryAt) return job;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  throw new Error('The job never waited for the busy host: ' + JSON.stringify(queue.snapshot().find(item => item.id === id)));
}

test('a source that answers 429 is asked again by itself and then finishes', async () => {
  const {queue, attempts} = harness({answers: ['busy', 'ok'], delays: [60, 90]});
  const id = queue.enqueue(game, release, ROOT);
  const wait = await waiting(queue, id);
  assert.match(wait.error, /HTTP 429/);
  assert.match(wait.error, /Asking again in 1 second\./);
  const job = await settled(queue, id, ['file-downloaded', 'failed']);
  assert.equal(job.state, 'file-downloaded', job.error);
  assert.equal(job.error, '');
  assert.equal(attempts(), 2, 'it asked the source again without the player');
  assert.equal(job.busyRetries, undefined, 'the count of waits ends with the wait');
});

test('a third refusal in a row fails the job instead of waiting forever', async () => {
  const {queue, attempts} = harness({answers: ['busy'], delays: [40, 40]});
  const id = queue.enqueue(game, release, ROOT);
  const job = await settled(queue, id, ['failed'], 5000);
  assert.equal(job.state, 'failed');
  assert.match(job.error, /HTTP 429/, 'the source`s own words stay, without the countdown');
  assert.doesNotMatch(job.error, /Asking again/);
  assert.equal(attempts(), 3, 'the two waits, then the refusal that fails');
});

test('pausing a job that waits for a busy host stops its wait', async () => {
  const {queue, attempts} = harness({answers: ['busy', 'ok'], delays: [120, 120]});
  const id = queue.enqueue(game, release, ROOT);
  const wait = await waiting(queue, id);
  queue.pause(id);
  await new Promise(resolve => setTimeout(resolve, 300));
  const job = queue.snapshot().find(item => item.id === id);
  assert.equal(job.state, 'paused');
  assert.equal(job.retryAt, undefined, 'no clock of a wait outlives the pause');
  assert.equal(attempts(), 1, 'nothing asked the source again while paused');
  // The player's Resume goes at once and starts the count of waits again.
  queue.resume(id);
  const done = await settled(queue, id, ['file-downloaded', 'failed']);
  assert.equal(done.state, 'file-downloaded', done.error);
  assert.equal(attempts(), 2);
});

test('a source that sends under 1 KB fails with what it sent', async () => {
  const {queue} = harness({answers: ['ok'], bytes: 10});
  const id = queue.enqueue(game, release, ROOT);
  const job = await settled(queue, id, ['failed']);
  assert.equal(job.state, 'failed');
  assert.equal(job.error, 'The source sent 10 bytes instead of the file (under 1 KB). Choose another source.');
});

test('a set whose volume comes back under 1 KB fails the same way', async () => {
  const files = new Map();
  const dirs = new Set([ROOT, ROOT + '/downloads', ROOT + '/downloads/sets']);
  const fs = {
    exists: path => dirs.has(path) || files.has(path),
    stat: path => dirs.has(path) ? {isDirectory: true, device: 'dev1', inode: 'root', modified: 0} :
      files.has(path) ? {isFile: true, size: String(files.get(path)).length, modified: 0} : null,
    diskUsage: () => ({free: 1024 ** 4}),
    mkdir: path => { dirs.add(path); },
    writeFile: (path, data) => { files.set(path, data); },
    readFile: path => files.get(path) ?? '',
    rename: (source, target) => { if (files.has(source)) { files.set(target, files.get(source)); files.delete(source); } },
    readDir: () => [],
    remove: path => { files.delete(path); },
    removeAsync: async path => { files.delete(path); dirs.delete(path); },
  };
  const downloads = {
    enqueue({destination}) {
      files.set(destination, 'tiny');
      return {done: Promise.resolve({written: 4}), snapshot: {state: 'completed'},
        subscribe: () => () => {}, cancel: () => {}};
    },
  };
  const queue = createDownloadQueue({
    fs, downloads, dataDir: ROOT, platform: 'desktop',
    notifications: {show() {}}, power: {keepAwake() {}},
    sources: {resolve: async entry => ({url: entry.url})},
  });
  const set = {
    id: 'source-1', filename: 'multi.rar', format: 'rar',
    parts: [1, 2].map(number => ({number, sources: [{url: 'https://filekeeper.net/file/part' + number}]})),
  };
  const id = queue.enqueue(game, set, ROOT);
  const job = await settled(queue, id, ['failed']);
  assert.equal(job.state, 'failed');
  assert.equal(job.error, 'The source sent 4 bytes instead of the file (under 1 KB). Choose another source.');
});
