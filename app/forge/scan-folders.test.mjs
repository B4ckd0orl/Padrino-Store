import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

register(new URL('../state/download-queue-test-loader.mjs', import.meta.url), import.meta.url);
const { FOLDER_KINDS, rowsFor } = await import('./scan-folders.js');
const { scanDrive } = await import('../files/scan.js');

// A disk built from the paths given: files are listed, directories are implied by their
// children, and a path named like a directory with nothing under it is an empty folder. Every
// file counts 10 bytes, so folderSize over a resolved game folder has a number to add up.
function fakeFs(files = [], titles = {}) {
  const present = new Set(files);
  const directory = path => !path.slice(path.lastIndexOf('/') + 1).includes('.');
  return {
    exists: path => present.has(path),
    readFile: path => {
      if (!present.has(path)) throw new Error('no such file');
      const folder = path.replace(/\/sce_sys\/param\.json$/, '');
      return JSON.stringify({ titleId: titles[folder] });
    },
    readDir: path => {
      const seen = new Set();
      const entries = [];
      for (const file of present) {
        if (!file.startsWith(`${path}/`)) continue;
        const rest = file.slice(path.length + 1);
        const slash = rest.indexOf('/');
        const name = slash < 0 ? rest : rest.slice(0, slash);
        const isDirectory = slash >= 0 || directory(file);
        if (seen.has(name)) continue;
        seen.add(name);
        entries.push({ name, isDirectory, size: isDirectory ? 0 : 10 });
      }
      return entries;
    },
  };
}

const ROOT = '/mnt/ext12';
const HOME = `${ROOT}/homebrew`;
const EXTRACTED = `${ROOT}/downloads/extracted`;

// What files/scan.js hands over for one thing it found on disk.
const entry = (path, over = {}) => ({
  kind: 'extracted',
  path,
  name: path.slice(path.lastIndexOf('/') + 1),
  isDirectory: true,
  size: 4000,
  titleId: null,
  ...over,
});

test('the list reads exactly the two trees a finished game can be in', () => {
  assert.deepEqual(FOLDER_KINDS, ['extracted', 'images']);
});

test('a finished game the queue published under homebrew is a row', () => {
  const folder = `${HOME}/PPSA28000-app`;
  const fs = fakeFs([`${folder}/eboot.bin`, `${folder}/sce_sys/param.json`]);
  const rows = rowsFor([entry(folder, { kind: 'images', titleId: 'PPSA28000' })], fs, {});
  assert.equal(rows.length, 1);
  assert.equal(rows[0].path, folder);
  assert.equal(rows[0].name, 'PPSA28000-app');
  assert.equal(rows[0].titleId, 'PPSA28000');
  assert.equal(rows[0].size, 4000);
});

test('a file, a folder with no game in it, and a kind that is not judged never reach the list', () => {
  const image = `${HOME}/game.ffpfs`;
  const loose = `${HOME}/LooseFolder`;
  const release = `${EXTRACTED}/release`;
  const installed = `${ROOT}/downloads/packages/PPSA28000-app`;
  const fs = fakeFs([
    image,
    `${loose}/notes.txt`,
    `${release}/readme.txt`,
    `${installed}/eboot.bin`, `${installed}/sce_sys/param.json`,
  ]);
  const rows = rowsFor([
    entry(image, { kind: 'images', isDirectory: false, size: 999 }),
    entry(loose, { kind: 'images' }),
    entry(release, { kind: 'extracted' }),
    entry(installed, { kind: 'packages', titleId: 'PPSA28000' }),
  ], fs, {});
  assert.deepEqual(rows, []);
});

test('an extraction that still holds the game is a row at the game folder', () => {
  const release = `${EXTRACTED}/release`;
  const game = `${release}/CUSA12345`;
  const fs = fakeFs([`${game}/eboot.bin`, `${game}/sce_sys/param.json`]);
  const rows = rowsFor([entry(release)], fs, {});
  assert.equal(rows.length, 1);
  assert.equal(rows[0].path, game);
  // Not the extraction's own size: the game folder's, summed from the disk.
  assert.equal(rows[0].size, 20);
});

test('the catalog name for the id wins, the queue download name follows it', () => {
  const folder = `${HOME}/PPSA28000-app`;
  const fs = fakeFs([`${folder}/eboot.bin`, `${folder}/sce_sys/param.json`]);
  const found = entry(folder, { kind: 'images', titleId: 'PPSA28000' });
  const titles = new Map([[folder, 'Download Name']]);
  const named = rowsFor([found], fs, { titles, gameTitle: id => (id === 'PPSA28000' ? 'Catalog Name' : null) });
  assert.equal(named[0].title, 'Catalog Name');
  const missed = rowsFor([found], fs, { titles, gameTitle: () => null });
  assert.equal(missed[0].title, 'Download Name');
});

test('a folder whose packs are already inside it is a row of its own', () => {
  const folder = `${HOME}/PackedGame-app`;
  const fs = fakeFs([`${folder}/ampr_zstd.index`]);
  const rows = rowsFor([entry(folder, { kind: 'images' })], fs, {});
  assert.equal(rows.length, 1);
  assert.equal(rows[0].path, folder);
  assert.equal(rows[0].packed, 'zstd');
  assert.equal(rows[0].size, 4000);
});

test('the title id in the folder own param.json is what the row carries', () => {
  // A game folder renamed by hand: no id in the name, so param.json is the only one that knows.
  const folder = `${HOME}/MyRenamedGame-app`;
  const fs = fakeFs([`${folder}/eboot.bin`, `${folder}/sce_sys/param.json`], { [folder]: 'PPSA44444' });
  const rows = rowsFor([entry(folder, { kind: 'images' })], fs, { gameTitle: id => (id === 'PPSA44444' ? 'Real Name' : null) });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].titleId, 'PPSA44444');
  assert.equal(rows[0].title, 'Real Name');
});

test('the queue title id for the path decides which of two games inside is the row', () => {
  const release = `${EXTRACTED}/release`;
  const one = `${release}/PPSA11111-app`;
  const two = `${release}/PPSA22222-app`;
  const fs = fakeFs([
    `${one}/eboot.bin`, `${one}/sce_sys/param.json`,
    `${two}/eboot.bin`, `${two}/sce_sys/param.json`,
  ], { [one]: 'PPSA11111', [two]: 'PPSA22222' });
  const rows = rowsFor([entry(release)], fs, {
    titles: new Map([[one, 'First Game']]),
    titleIds: new Map([[release, 'PPSA11111']]),
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].path, one);
  assert.equal(rows[0].titleId, 'PPSA11111');
  assert.equal(rows[0].title, 'First Game');
  // The queue not knowing the path leaves the ambiguity alone: two games, nothing guessed.
  const alone = rowsFor([entry(release)], fs, {});
  assert.deepEqual(alone, []);
});

// The screen's own chain over a real scanDrive: the reported symptom is a finished game that
// lives in homebrew/<name>-app, where the queue publishes it, and never showed up in the list.
test('the real scan over both roots: old homebrew games are rows, everything else is not', () => {
  const disk = [
    // The symptom: finished games under homebrew, an old one whose name carries the id and one
    // renamed by hand (only its param.json knows the id).
    '/mnt/ext12/homebrew/PPSA28000-app/eboot.bin',
    '/mnt/ext12/homebrew/PPSA28000-app/sce_sys/param.json',
    '/mnt/ext12/homebrew/OldRenamed-app/eboot.bin',
    '/mnt/ext12/homebrew/OldRenamed-app/sce_sys/param.json',
    // An image file beside them: the game is inside it, never a row.
    '/mnt/ext12/homebrew/SomeImage.ffpfs',
    // An extraction the queue emptied: leftovers only, no game, no row.
    '/mnt/ext12/downloads/extracted/leftovers/readme.txt',
    // An extraction still holding the game among supplements: the row is the game folder.
    '/mnt/ext12/downloads/extracted/full/CUSA12345/eboot.bin',
    '/mnt/ext12/downloads/extracted/full/CUSA12345/sce_sys/param.json',
    '/mnt/ext12/downloads/extracted/full/CUSA12345-Update1.03/eboot.bin',
    '/mnt/ext12/downloads/extracted/full/CUSA12345-Update1.03/sce_sys/param.json',
    // A folder the console installed: the packages kind, never judged.
    '/mnt/ext12/downloads/packages/PPSA28000-app/eboot.bin',
    '/mnt/ext12/downloads/packages/PPSA28000-app/sce_sys/param.json',
    // The console's own data holds homebrew too.
    '/data/homebrew/Another-app/eboot.bin',
    '/data/homebrew/Another-app/sce_sys/param.json',
  ];
  const fs = fakeFs(disk, { '/mnt/ext12/homebrew/OldRenamed-app': 'PPSA77777' });
  const entries = [...scanDrive(fs, '/mnt/ext12'), ...scanDrive(fs, '/data')];
  const rows = rowsFor(entries, fs, { gameTitle: id => (id === 'PPSA77777' ? 'Old Renamed' : null) });
  assert.deepEqual(rows.map(row => row.path).sort(), [
    '/data/homebrew/Another-app',
    '/mnt/ext12/downloads/extracted/full/CUSA12345',
    '/mnt/ext12/homebrew/OldRenamed-app',
    '/mnt/ext12/homebrew/PPSA28000-app',
  ]);
  // Every row is a folder whose size came off the disk, biggest first.
  assert.ok(rows.every(row => row.size > 0));
  assert.deepEqual(rows.map(row => row.path), [...rows].sort((a, b) => b.size - a.size || a.name.localeCompare(b.name)).map(row => row.path));
  // The renamed folder's id comes from its own param.json, and the catalog name follows it.
  const renamed = rows.find(row => row.path.endsWith('OldRenamed-app'));
  assert.equal(renamed.titleId, 'PPSA77777');
  assert.equal(renamed.title, 'Old Renamed');
  // The name's id is what the row carries for the folder named after it.
  assert.equal(rows.find(row => row.path.endsWith('PPSA28000-app')).titleId, 'PPSA28000');
});
