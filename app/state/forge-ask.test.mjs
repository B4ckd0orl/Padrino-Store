import assert from 'node:assert/strict';
import {register} from 'node:module';
import test from 'node:test';

register(new URL('../state/download-queue-test-loader.mjs', import.meta.url), import.meta.url);
const {ASKS, forgeAsk, forgeDeleteOriginal, forgeLevel, setForgeAsk, setForgeDeleteOriginal, setForgeLevel} = await import('./forge-ask.js');

// The answers a finished download gets: ask first, remove the original unless the player turned
// that off, and remember the format and level last used for the next game.
test('the defaults: ask, remove the original, zstd 9', () => {
  assert.deepEqual(ASKS, ['ask', 'zstd', 'lz4', 'never']);
  assert.equal(forgeAsk(), 'ask');
  assert.equal(forgeDeleteOriginal(), true);
  assert.deepEqual(forgeLevel(), {mode: 'zstd', level: 9});
});

test('the answer is remembered, and anything else falls back to asking', () => {
  for (const value of ['zstd', 'lz4', 'never']) {
    setForgeAsk(value);
    assert.equal(forgeAsk(), value);
  }
  setForgeAsk('sometimes');
  assert.equal(forgeAsk(), 'never');
  setForgeAsk('ask');
  assert.equal(forgeAsk(), 'ask');
});

test('the original stays until the player says otherwise', () => {
  setForgeDeleteOriginal(false);
  assert.equal(forgeDeleteOriginal(), false);
  setForgeDeleteOriginal(true);
  assert.equal(forgeDeleteOriginal(), true);
  // Anything but an explicit off keeps it: a stray value must never delete a game.
  setForgeDeleteOriginal(undefined);
  assert.equal(forgeDeleteOriginal(), true);
});

test('the last format used is offered first, invalid levels are refused', () => {
  setForgeLevel('zstd', 19);
  assert.deepEqual(forgeLevel(), {mode: 'zstd', level: 19});
  setForgeLevel('lz4', 0);
  assert.deepEqual(forgeLevel(), {mode: 'lz4', level: 0});
  // The engine's own ranges, checked before the value is kept.
  setForgeLevel('zstd', 0);
  assert.deepEqual(forgeLevel(), {mode: 'lz4', level: 0});
  setForgeLevel('zstd', 23);
  assert.deepEqual(forgeLevel(), {mode: 'lz4', level: 0});
  setForgeLevel('lz4', 2);
  assert.deepEqual(forgeLevel(), {mode: 'lz4', level: 0});
  setForgeLevel('gzip', 5);
  assert.deepEqual(forgeLevel(), {mode: 'lz4', level: 0});
  setForgeLevel('lz4', 9.5);
  assert.deepEqual(forgeLevel(), {mode: 'lz4', level: 0});
});
