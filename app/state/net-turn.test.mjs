import assert from 'node:assert/strict';
import test from 'node:test';

const { backgroundHold, backgroundRelease, turnBegin, turnBusy, turnEnd } = await import('./net-turn.js');

test('a resolution holds the turn and gives up the background fetches registered for it', () => {
  const events = [];
  const first = () => events.push('first');
  const second = () => events.push('second');
  assert.equal(turnBusy(), false);
  assert.equal(backgroundHold(first), true, 'a fetch registers while nothing runs');
  assert.equal(backgroundHold(second), true);
  turnBegin();
  assert.equal(turnBusy(), true);
  assert.deepEqual(events, ['first', 'second'], 'the resolution cancels both the moment it begins');
  const late = () => events.push('late');
  assert.equal(backgroundHold(late), false, 'no fetch starts while a resolution holds the turn');
  turnEnd();
  assert.equal(turnBusy(), false);
  assert.equal(backgroundHold(late), true, 'once it settles a fetch may hold the turn again');
  backgroundRelease(late);
  events.length = 0;
  turnBegin();
  assert.deepEqual(events, [], 'a released fetch is not cancelled by a later resolution');
  turnEnd();
  assert.equal(turnBusy(), false);
});

test('two resolutions at once end one at a time, and an extra end is harmless', () => {
  turnBegin();
  turnBegin();
  assert.equal(turnBusy(), true);
  turnEnd();
  assert.equal(turnBusy(), true, 'the second resolution still holds the turn');
  turnEnd();
  assert.equal(turnBusy(), false);
  turnEnd();
  assert.equal(turnBusy(), false, 'ending more than began never goes negative');
});
