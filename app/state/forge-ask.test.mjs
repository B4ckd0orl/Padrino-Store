import assert from 'node:assert/strict';
import {register} from 'node:module';
import test from 'node:test';

register(new URL('../state/download-queue-test-loader.mjs', import.meta.url), import.meta.url);
const {ASKS, ORIGINAL, forgeAsk, forgeDeleteOriginal, forgeLevel, forgeOriginal, normalizeOriginal, setForgeAsk, setForgeLevel, setForgeOriginal} = await import('./forge-ask.js');

// The answers a finished download gets: ask first, remove the original unless the player turned
// that off, and remember the format and level last used for the next game.
test('the defaults: ask, remove the original, zstd 9', () => {
  assert.deepEqual(ASKS, ['ask', 'zstd', 'lz4', 'never']);
  assert.deepEqual(ORIGINAL, ['on', 'off', 'ask']);
  assert.equal(forgeAsk(), 'ask');
  assert.equal(forgeOriginal(), 'on');
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

test('the original has three answers: on, off and ask', () => {
  setForgeOriginal('off');
  assert.equal(forgeOriginal(), 'off');
  assert.equal(forgeDeleteOriginal(), false);
  setForgeOriginal('ask');
  assert.equal(forgeOriginal(), 'ask');
  // "ask" has no answer of its own yet, so the question still opens with the tick on.
  assert.equal(forgeDeleteOriginal(), true);
  setForgeOriginal('on');
  assert.equal(forgeOriginal(), 'on');
  assert.equal(forgeDeleteOriginal(), true);
  // Anything outside the three is refused outright, never stored as a fourth state.
  setForgeOriginal('sometimes');
  assert.equal(forgeOriginal(), 'on');
});

test('a stored answer older or stranger than the three still means what it said', () => {
  assert.equal(normalizeOriginal('on'), 'on');
  assert.equal(normalizeOriginal('off'), 'off');
  assert.equal(normalizeOriginal('ask'), 'ask');
  // The plain tick an older build saved: false was the only answer that ever kept the folder.
  assert.equal(normalizeOriginal(false), 'off');
  assert.equal(normalizeOriginal(true), 'on');
  assert.equal(normalizeOriginal(undefined), 'on');
  assert.equal(normalizeOriginal('sometimes'), 'on');
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
