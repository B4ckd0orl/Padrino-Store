import assert from 'node:assert/strict';
import test from 'node:test';

const {PRESETS, levelValid, outputFor, rootOf, stepLevel} = await import('./options.js');
const {validLevel} = await import('../state/forge.js');

// The dialog only ever offers levels the engine accepts, and the pad can only walk to another
// one of those: an invalid level can never be picked, so none can reach the request.
test('every offered preset is inside the engine’s ranges', () => {
  for (const preset of PRESETS) assert.equal(validLevel(preset.mode, preset.level), true, `${preset.mode} ${preset.level}`);
  assert.equal(PRESETS.filter((preset) => preset.recommended).length, 1);
  assert.deepEqual(
    PRESETS.find((preset) => preset.recommended),
    {mode: 'zstd', level: 9, name: 'balanced', recommended: true},
  );
  const seen = new Set(PRESETS.map((preset) => `${preset.mode}:${preset.level}`));
  assert.equal(seen.size, PRESETS.length);
});

test('the pad steps within the ranges and never lands on a hole', () => {
  // zstd runs 1-22 end to end.
  let level = 1;
  for (let i = 0; i < 30; i++) level = stepLevel('zstd', level, 1);
  assert.equal(level, 22);
  for (let i = 0; i < 30; i++) level = stepLevel('zstd', level, -1);
  assert.equal(level, 1);
  // LZ4 is 0 or 3-12: 1 and 2 are stepped over in both directions.
  assert.equal(stepLevel('lz4', 0, -1), 0);
  assert.equal(stepLevel('lz4', 0, 1), 3);
  assert.equal(stepLevel('lz4', 3, -1), 0);
  assert.equal(stepLevel('lz4', 12, 1), 12);
  assert.equal(stepLevel('lz4', 12, -1), 11);
  for (const mode of ['zstd', 'lz4']) {
    for (let seed = 1; seed <= 22; seed++) {
      for (const delta of [-1, 1]) {
        const next = stepLevel(mode, seed, delta);
        assert.equal(validLevel(mode, next), true, `${mode} ${seed} ${delta} -> ${next}`);
      }
    }
  }
});

test('the packed game goes beside its source, never over it', () => {
  const folder = '/data/ps5-react/PPSA99059/downloads/extracted/CUSA12345';
  const output = outputFor(folder);
  assert.notEqual(output, folder);
  assert.equal(output, `${folder}.packed`);
  assert.ok(output.startsWith(`${folder.slice(0, folder.lastIndexOf("/"))}/`));
});

test('the drive under a path is where the free space is read', () => {
  assert.equal(rootOf('/data/ps5-react/PPSA99059/downloads/x'), '/data');
  assert.equal(rootOf('/mnt/usb0/games/x'), '/mnt/usb0');
  assert.equal(rootOf('/mnt/ext12/homebrew/x'), '/mnt/ext12');
  assert.equal(rootOf('/update/payload.elf'), '');
  assert.equal(rootOf('relative/path'), '');
});
