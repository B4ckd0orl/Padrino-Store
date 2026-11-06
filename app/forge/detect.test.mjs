import assert from 'node:assert/strict';
import test from 'node:test';

const {packedFormat} = await import('./detect.js');

// A disk that knows only the marker files the check looks for.
function fakeFs(present = []) {
  const files = new Set(present);
  return { exists: path => files.has(path) };
}

const FOLDER = '/data/ps5-react/PPSA99059/downloads/extracted/CUSA12345';

test('the index beside the files says which format packed them', () => {
  assert.equal(packedFormat(fakeFs(), FOLDER), '');
  assert.equal(packedFormat(fakeFs([`${FOLDER}/ampr_zstd.index`, `${FOLDER}/ampr_zstd-000.pak`]), FOLDER), 'zstd');
  assert.equal(packedFormat(fakeFs([`${FOLDER}/ampr_assets.index`, `${FOLDER}/ampr_assets-000.pak`]), FOLDER), 'lz4');
  // zstd wins when both indexes are somehow there: its packs are the ones holding the files.
  assert.equal(packedFormat(fakeFs([`${FOLDER}/ampr_zstd.index`, `${FOLDER}/ampr_assets.index`]), FOLDER), 'zstd');
});

test('an index under sce_sys counts the same, and nothing else does', () => {
  assert.equal(packedFormat(fakeFs([`${FOLDER}/sce_sys/ampr_assets.index`]), FOLDER), 'lz4');
  // The decoder's own index is a runtime, not a pack: the folder is still plain.
  assert.equal(packedFormat(fakeFs([`${FOLDER}/ampr_emu.index`]), FOLDER), '');
  assert.equal(packedFormat(fakeFs([`${FOLDER}/eboot.bin`]), FOLDER), '');
  assert.equal(packedFormat(fakeFs([`${FOLDER}/ampr_zstd.index`]), ''), '');
});
