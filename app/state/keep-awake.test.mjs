import assert from 'node:assert/strict';
import test from 'node:test';

const {requestAwake, releaseAwake} = await import('./keep-awake.js');

// A fake Power: every write to the console's stay-awake switch lands in the list.
function fakePower() {
  const writes = [];
  return {writes, power: {keepAwake: value => writes.push(value)}};
}

test('the switch stays on while any reason is outstanding', () => {
  const {writes, power} = fakePower();
  requestAwake('forge', power);
  assert.deepEqual(writes, [true]);
  // Asking again for the same reason, or for a second one, writes nothing new.
  requestAwake('forge', power);
  requestAwake('downloads', power);
  assert.deepEqual(writes, [true]);
  // The first release leaves the console awake for the reason still holding it.
  releaseAwake('forge', power);
  assert.deepEqual(writes, [true]);
  releaseAwake('downloads', power);
  assert.deepEqual(writes, [true, false]);
});

test('a subsystem finishing never sleeps the console under another one', () => {
  const {writes, power} = fakePower();
  requestAwake('forge', power); // a pack starts
  requestAwake('move', power); // a file move starts beside it
  // The move ends first: the raw flag would go off here and sleep the console mid-pack.
  releaseAwake('move', power);
  assert.deepEqual(writes, [true], 'the pack still holds the switch');
  releaseAwake('forge', power);
  assert.deepEqual(writes, [true, false]);
});

test('releasing a reason nobody holds is quiet, and each handle keeps its own book', () => {
  const first = fakePower();
  const second = fakePower();
  releaseAwake('downloads', first.power);
  assert.deepEqual(first.writes, [], 'nothing was ever taken, nothing is given back');
  requestAwake('downloads', first.power);
  assert.deepEqual(first.writes, [true]);
  requestAwake('downloads', second.power);
  assert.deepEqual(second.writes, [true], 'another handle starts from its own state');
  releaseAwake('downloads', second.power);
  assert.deepEqual(second.writes, [true, false]);
  assert.deepEqual(first.writes, [true], 'and the first handle is untouched');
});

test('a handle without the switch is left alone', () => {
  requestAwake('forge', undefined);
  releaseAwake('forge', null);
  requestAwake('forge', {});
  assert.ok(true, 'no throw');
});
