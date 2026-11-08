import assert from 'node:assert/strict';
import {register} from 'node:module';
import test from 'node:test';

register(new URL('../state/download-queue-test-loader.mjs', import.meta.url), import.meta.url);
const {compressibleFolder, eligibleFolder, own} = await import('./forge-eligible.js');

// A disk that knows only the markers the check looks for: a path whose last segment has no dot
// is a directory, anything else is a file.
function fakeFs(present = []) {
  const files = new Set(present);
  const directory = path => !path.slice(path.lastIndexOf("/") + 1).includes(".");
  return {
    exists: path => files.has(path),
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

test('the game one folder down is found, and a second folder beside it is not guessed', () => {
  const nested = `${FOLDER}/CUSA12345`;
  const withGame = fakeFs([`${nested}/eboot.bin`, `${nested}/sce_sys/param.json`, `${FOLDER}/other`]);
  assert.equal(compressibleFolder(finished(), withGame), '');

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
