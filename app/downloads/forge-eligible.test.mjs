import assert from 'node:assert/strict';
import {register} from 'node:module';
import test from 'node:test';

register(new URL('../state/download-queue-test-loader.mjs', import.meta.url), import.meta.url);
const {compressibleFolder, eligibleFolder, own} = await import('./forge-eligible.js');

// A disk that knows only the markers the check looks for: a path whose last segment has no dot
// is a directory, anything else is a file. `titles` maps a folder to the title id its own
// param.json carries, so titleIn reads the same answers the queue's own titleIn would.
function fakeFs(present = [], titles = {}) {
  const files = new Set(present);
  const directory = path => !path.slice(path.lastIndexOf("/") + 1).includes(".");
  return {
    exists: path => files.has(path),
    readFile: path => {
      if (!files.has(path)) throw new Error("no such file");
      const folder = path.replace(/\/sce_sys\/param\.json$/, "");
      return JSON.stringify({ titleId: titles[folder] });
    },
    readDir: path => {
      const seen = new Set();
      const entries = [];
      for (const file of files) {
        if (!file.startsWith(`${path}/`)) continue;
        const rest = file.slice(path.length + 1);
        const slash = rest.indexOf("/");
        const name = slash < 0 ? rest : rest.slice(0, slash);
        if (slash < 0 && !directory(file)) continue;
        if (seen.has(name)) continue;
        seen.add(name);
        entries.push({name, isDirectory: true});
      }
      return entries;
    },
  };
}

const FOLDER = '/data/ps5-react/PPSA99059/downloads/extracted/CUSA12345';
const GAME_FILES = [`${FOLDER}/eboot.bin`, `${FOLDER}/sce_sys/param.json`];
const finished = (over = {}) => ({
  state: 'downloaded',
  output: FOLDER,
  artifact: {destination: FOLDER, nextAction: 'shadowmount'},
  ...over,
});

test('a finished game folder is the one that gets compressed', () => {
  assert.equal(compressibleFolder(finished(), fakeFs(GAME_FILES)), FOLDER);
});

test('a download the console installed itself is never offered', () => {
  const fs = fakeFs(GAME_FILES);
  assert.equal(compressibleFolder(finished({packages: ['/data/packages/CUSA12345.pkg']}), fs), '');
  assert.equal(compressibleFolder(finished({artifact: {destination: FOLDER, nextAction: 'installer-required'}}), fs), '');
  assert.equal(compressibleFolder(finished({output: `${FOLDER}.pkg`}), fs), '');
});

test('a job that is still running is not a candidate', () => {
  const fs = fakeFs(GAME_FILES);
  for (const state of ['queued', 'downloading', 'extracting', 'installing']) {
    assert.equal(compressibleFolder(finished({state}), fs), '', state);
  }
  assert.equal(compressibleFolder(null, fs), '');
});

test('only a folder on the console or a plugged drive counts', () => {
  const fs = fakeFs(GAME_FILES);
  assert.equal(own('/mnt/usb0/downloads/x'), true);
  assert.equal(own('/mnt/ext12/homebrew/x'), true);
  assert.equal(own('/data/ps5-react/PPSA99059/x'), true);
  assert.equal(own('/update/payload.elf'), false);
  assert.equal(own('/system_data/thing'), false);
  assert.equal(compressibleFolder(finished({output: '/update/downloads/extracted/CUSA12345'}), fs), '');
});

test('a folder without a game in it is left alone', () => {
  assert.equal(compressibleFolder(finished(), fakeFs([])), '');
  // The markers must both be there: an eboot.bin alone is not a launchable folder.
  assert.equal(compressibleFolder(finished(), fakeFs([`${FOLDER}/eboot.bin`])), '');
});

// The queue's finder (findGame) resolves this the same way: a folder beside the game does not
// break the choice, only a folder that is itself a game competes with it.
test('the game one folder down is found even with a second folder beside it', () => {
  const nested = `${FOLDER}/CUSA12345`;
  const withGame = fakeFs([`${nested}/eboot.bin`, `${nested}/sce_sys/param.json`, `${FOLDER}/other`]);
  assert.equal(compressibleFolder(finished(), withGame), nested);

  const alone = fakeFs([`${nested}/eboot.bin`, `${nested}/sce_sys/param.json`]);
  assert.equal(compressibleFolder(finished(), alone), nested);
});

test('a patch, update or backport folder is not the game', () => {
  const fs = fakeFs([`${FOLDER}-Backport/eboot.bin`, `${FOLDER}-Backport/sce_sys/param.json`]);
  assert.equal(compressibleFolder(finished({output: `${FOLDER}-Backport`}), fs), '');
  assert.equal(compressibleFolder(finished({output: `${FOLDER}-Patch`}), fakeFs([`${FOLDER}-Patch/eboot.bin`, `${FOLDER}-Patch/sce_sys/param.json`])), '');
});

test('a supplemental folder beside the game does not hide it', () => {
  const nested = `${FOLDER}/CUSA12345`;
  const update = `${FOLDER}/CUSA12345-Update1.03`;
  const fs = fakeFs([
    `${nested}/eboot.bin`, `${nested}/sce_sys/param.json`,
    `${update}/eboot.bin`, `${update}/sce_sys/param.json`,
  ]);
  assert.equal(compressibleFolder(finished(), fs), nested);
});

test('a supplemental folder alone under the extraction is not the game', () => {
  const patch = `${FOLDER}/CUSA12345-Patch1.02`;
  const fs = fakeFs([`${patch}/eboot.bin`, `${patch}/sce_sys/param.json`]);
  assert.equal(compressibleFolder(finished(), fs), '');
});

test('several supplemental folders around the game still leave it found', () => {
  const nested = `${FOLDER}/CUSA12345`;
  const update = `${FOLDER}/CUSA12345-Update1.03`;
  const backport = `${FOLDER}/CUSA12345-Backport`;
  const fs = fakeFs([
    `${nested}/eboot.bin`, `${nested}/sce_sys/param.json`,
    `${update}/eboot.bin`, `${update}/sce_sys/param.json`,
    `${backport}/eboot.bin`, `${backport}/sce_sys/param.json`,
  ]);
  assert.equal(compressibleFolder(finished(), fs), nested);
});

test('a folder found on disk is judged by the same rules', () => {
  assert.equal(eligibleFolder(fakeFs(GAME_FILES), FOLDER), FOLDER);
  // Not a game folder, a package, or somewhere outside the console's own roots.
  assert.equal(eligibleFolder(fakeFs([]), FOLDER), '');
  assert.equal(eligibleFolder(fakeFs([`${FOLDER}/eboot.bin`, `${FOLDER}/sce_sys/param.json`]), `${FOLDER}.pkg`), '');
  const elsewhere = '/update/games/CUSA12345';
  assert.equal(eligibleFolder(fakeFs([`${elsewhere}/eboot.bin`, `${elsewhere}/sce_sys/param.json`]), elsewhere), '');
  assert.equal(eligibleFolder(fakeFs(GAME_FILES), ''), '');
});

// Parity with the queue's findGame: a wrapper merely NAMED a backport is the box the game came
// in, not a supplemental folder, so the game inside it is the one taken.
test('a wrapper named for a backport gives up the game inside it', () => {
  const inner = `${FOLDER}/Dawnwalker 4.xx Backport/PPSA28000-app`;
  const fs = fakeFs([`${inner}/eboot.bin`, `${inner}/sce_sys/param.json`]);
  assert.equal(eligibleFolder(fs, FOLDER), inner);
});

test('two games side by side are never guessed between', () => {
  const one = `${FOLDER}/PPSA11111-app`;
  const two = `${FOLDER}/PPSA22222-app`;
  const files = [`${one}/eboot.bin`, `${one}/sce_sys/param.json`, `${two}/eboot.bin`, `${two}/sce_sys/param.json`];
  const fs = fakeFs(files, {[one]: 'PPSA11111', [two]: 'PPSA22222'});
  assert.equal(eligibleFolder(fs, FOLDER), '');
  // The title id the download was for is what decides, and one that matches neither changes
  // nothing: two left, nothing guessed.
  assert.equal(eligibleFolder(fs, FOLDER, 'PPSA11111'), one);
  assert.equal(eligibleFolder(fs, FOLDER, 'PPSA99999'), '');
});

// The queue's finder walks a one-child chain deeper than the breadth-first search ever reaches,
// so the same game far down a narrow extraction is taken here too.
test('a game seven folders down a single chain is still found', () => {
  const deep = `${FOLDER}/a/b/c/d/e/f/PPSA12345`;
  const fs = fakeFs([`${deep}/eboot.bin`, `${deep}/sce_sys/param.json`]);
  assert.equal(eligibleFolder(fs, FOLDER), deep);
  // The chain never widens: a second folder at any level stops it, and the breadth-first search
  // cannot reach that deep either -- so nothing is guessed, the same as the queue's own finder.
  const wide = fakeFs([`${deep}/eboot.bin`, `${deep}/sce_sys/param.json`, `${FOLDER}/a/twin`]);
  assert.equal(eligibleFolder(fs, wide), '');
});
