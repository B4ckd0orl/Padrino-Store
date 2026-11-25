import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

register(new URL('../state/download-queue-test-loader.mjs', import.meta.url), import.meta.url);
const { describeSource, preferredRelease, sourceSections } = await import('./sources.js');

// Two sources every safety check passes (state/game/sources.js ranked) — same host, same group,
// same health — the plain one first in the list, so only the format can move the recommendation.
const plain = {
  id: 'plain',
  provider: 'Padrino CDN',
  url: 'https://cdn.padrino.example/games/Fixture.zip',
  label: 'USA 10.xx',
  version: 'v1.00',
  sizeBytes: 1073741824,
};
const image = {
  id: 'image',
  provider: 'Padrino CDN',
  url: 'https://cdn.padrino.example/games/Fixture.exfat',
  label: 'USA 10.xx',
  version: 'v1.00',
  sizeBytes: 1073741824,
};

test('an exFAT image is the recommended source over a plain download of the same host', () => {
  assert.equal(describeSource(image).exfat, true, 'the row knows it carries an image');
  assert.equal(describeSource(plain).exfat, false);
  assert.equal(preferredRelease([plain, image]), 1, 'the exFAT row wins from second place');
});

test('the recommendation never crosses a safety gate for the format', () => {
  // A dead exFAT link is dead first: unavailable loses to a live source whatever its format.
  const dead = { ...image, id: 'dead', unavailableReason: 'Removed by the host' };
  assert.equal(preferredRelease([plain, dead]), 0);
  // A backport of the game, or only its files to copy over an install, stays behind the game.
  const backport = { ...image, id: 'backport', label: 'USA 10.xx BackPort 4.xx' };
  assert.equal(preferredRelease([plain, backport]), 0);
});

test('sections list exFAT images first and leave the rest in their own order', () => {
  const third = { ...plain, id: 'third', url: 'https://cdn.padrino.example/games/Other.rar' };
  const direct = sourceSections([plain, image, third]).find((section) => section.group === 'direct');
  assert.deepEqual(direct.items.map((item) => item.index), [1, 0, 2],
    'the image first, the others where the list had them');
});

test('browser rows keep their parts order behind an exFAT image', () => {
  const many = { id: 'many', provider: 'Vikingfile', url: 'https://vikingfile.com/f/many', parts: [{ sources: [{}] }, { sources: [{}] }] };
  const few = { id: 'few', provider: 'Vikingfile', url: 'https://vikingfile.com/f/few' };
  const mirror = { id: 'mirror', provider: 'Vikingfile', url: 'https://vikingfile.com/f/mirror.exfat' };
  const browser = sourceSections([many, few, mirror]).find((section) => section.group === 'browser');
  assert.deepEqual(browser.items.map((item) => item.index), [2, 1, 0],
    'the image first, then the fewest parts, then the place each row had');
});
