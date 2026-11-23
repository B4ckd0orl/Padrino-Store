import assert from 'node:assert/strict';
import test from 'node:test';

const {createUpdater} = await import('./updater.js');

const IMAGE = '/data/PadrinoStore.exfat';
const WORK = '/data/work';
const MARKER = '/data/pending-image.json';
const EXTRACTED = `${WORK}/1.47`;
const PUBLISHED = 665845760; // the size the release publishes for PadrinoStore.exfat

// In-memory stand-in for the host filesystem: just the calls createUpdater makes, plus a list
// of every rename so a test can prove which moves happened (and which never did).
function fakeFs({oldImageSize = 655360000} = {}) {
  const files = new Map([[IMAGE, {size: oldImageSize, modified: 1111}]]);
  const dirs = new Set(['/data', WORK]);
  const renames = [];
  return {
    files,
    renames,
    exists: (path) => files.has(path) || dirs.has(path),
    stat: (path) => {
      const file = files.get(path);
      return file ? {name: path.split('/').pop(), size: file.size, modified: file.modified} : null;
    },
    readDir: (path) => {
      const prefix = path.endsWith('/') ? path : `${path}/`;
      const out = [];
      for (const [name, file] of files)
        if (name.startsWith(prefix) && !name.slice(prefix.length).includes('/'))
          out.push({name: name.slice(prefix.length), isFile: true, isDirectory: false, size: file.size, modified: file.modified});
      for (const dir of dirs)
        if (dir.startsWith(prefix) && dir !== path && !dir.slice(prefix.length).includes('/'))
          out.push({name: dir.slice(prefix.length), isFile: false, isDirectory: true});
      return out;
    },
    chmod: () => {},
    writeFile: (path, text) => files.set(path, {size: text.length, modified: 2222, text}),
    mkdir: (path) => dirs.add(path),
    rename: (from, to) => {
      const file = files.get(from);
      if (!file) throw new Error(`no such file ${from}`);
      files.delete(from);
      files.set(to, file);
      renames.push([from, to]);
    },
    remove: (path) => {
      files.delete(path);
      dirs.delete(path);
    },
    removeAsync: async (path) => {
      for (const name of [...files.keys()])
        if (name === path || name.startsWith(`${path}/`)) files.delete(name);
      dirs.delete(path);
    },
    readFile: (path) => files.get(path)?.text ?? null,
    diskUsage: () => ({total: 1024 ** 4, free: 64 * 1024 ** 3}),
  };
}

// The feed as api.github.com answers it: the zip the updater installs plus, normally, the
// loose image of the same build.
function releaseWith({withImageAsset = true} = {}) {
  const assets = [
    {name: 'update.zip', size: 42709423, digest: `sha256:${'a'.repeat(64)}`, browser_download_url: 'https://example/update.zip'},
  ];
  if (withImageAsset)
    assets.push({name: 'PadrinoStore.exfat', size: PUBLISHED, digest: `sha256:${'b'.repeat(64)}`, browser_download_url: 'https://example/PadrinoStore.exfat'});
  return {tag_name: 'v1.47', body: '- UPDATE DE EMERGENCIA', assets};
}

function harness({release = releaseWith(), extractedSize} = {}) {
  const fs = fakeFs();
  const published = release.assets.find((item) => item.name === 'PadrinoStore.exfat')?.size ?? 700000256;
  const downloads = {
    queued: [],
    enqueue(options) {
      this.queued.push(options);
      return {subscribe: () => () => {}, done: Promise.resolve()};
    },
  };
  const archives = {
    extract({destination}) {
      fs.files.set(`${destination}/PadrinoStore.exfat`, {size: extractedSize ?? published, modified: 3333});
      return {done: Promise.resolve()};
    },
  };
  const http = {request: async () => ({ok: true, json: async () => release})};
  const updater = createUpdater({
    http,
    downloads,
    archives,
    fs,
    version: '1.44.0',
    feed: 'https://example/feed',
    asset: 'update.zip',
    installDir: '/app',
    image: IMAGE,
    workDir: WORK,
    marker: MARKER,
  });
  return {updater, fs, downloads};
}

test('check() carries the published image size so the install can prove the extract is whole', async () => {
  const {updater} = harness();
  const update = await updater.check();
  assert.equal(update.version, '1.47');
  assert.equal(update.size, 42709423);
  assert.equal(update.sha256, 'a'.repeat(64));
  assert.equal(update.imageSize, PUBLISHED);
});

test('an extract that does not match the published size is refused before the installed image is touched', async () => {
  const {updater, fs} = harness({extractedSize: PUBLISHED - 512});
  const update = await updater.check();
  await assert.rejects(() => updater.install(update), /the release publishes 665845760/);
  assert.deepEqual(fs.renames, [], 'nothing was moved over the installed image');
  assert.equal(fs.files.get(IMAGE).size, 655360000, 'the installed image keeps its bytes');
  assert.equal(fs.files.has(MARKER), false, 'no marker is written for an image that failed');
});

test('a whole image replaces the installed one and the update reports no relaunch', async () => {
  const {updater, fs} = harness();
  const update = await updater.check();
  const result = await updater.install(update);
  assert.deepEqual(result, {relaunch: false});
  assert.deepEqual(fs.renames, [[`${EXTRACTED}/PadrinoStore.exfat`, IMAGE]]);
  assert.equal(fs.files.get(IMAGE).size, PUBLISHED);
  assert.ok(fs.files.has(MARKER), 'the marker records what was installed');
  const marker = JSON.parse(fs.files.get(MARKER).text);
  assert.equal(marker.version, '1.47');
  assert.equal(marker.size, PUBLISHED);
});

test('a release that publishes no image keeps the old behaviour and installs anyway', async () => {
  const {updater, fs} = harness({release: releaseWith({withImageAsset: false}), extractedSize: 700000256});
  const update = await updater.check();
  assert.equal(update.imageSize, null);
  const result = await updater.install(update);
  assert.deepEqual(result, {relaunch: false});
  assert.equal(fs.files.get(IMAGE).size, 700000256);
});
