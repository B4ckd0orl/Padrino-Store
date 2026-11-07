import assert from 'node:assert/strict';
import test from 'node:test';

const {createRecovery} = await import('./recovery.js');

// The engine as recovery sees it: the records of what was started, and the two ways a job goes
// away again -- startJob for a pack, unpackJob for writing a folder back. The fs only answers
// whether something exists and clears the one path it is asked to clear.
function world({records = [], files = [], removeFailure = null} = {}) {
  const log = {removed: [], started: [], unpacked: [], order: []};
  const existing = new Set(files);
  const state = {startFailure: null};
  const fs = {
    exists: (path) => existing.has(path),
    removeAsync: async (path) => {
      if (removeFailure) throw removeFailure;
      log.removed.push(path);
      log.order.push(`remove:${path}`);
      existing.delete(path);
    },
  };
  const engine = {
    records: () => records.map((record) => ({...record})),
    startJob: async (request) => {
      if (state.startFailure) throw state.startFailure;
      log.started.push(request);
      log.order.push('start');
    },
    unpackJob: async (request) => {
      log.unpacked.push(request);
      log.order.push('unpack');
    },
  };
  return {recovery: createRecovery({fs, engine}), log, existing, state};
}

const pack = (overrides = {}) => ({
  id: 'job-1',
  action: 'pack',
  state: 'interrupted',
  source: '/games/A',
  output: '/games/A.packed',
  mode: 'zstd',
  level: 9,
  deleteAfter: true,
  ...overrides,
});

test('a pack whose source is intact and whose output never appeared is resumed', async () => {
  const {recovery, log} = world({records: [pack()], files: ['/games/A']});
  const {resumed, notices} = await recovery.recover();
  assert.equal(resumed.length, 1);
  assert.deepEqual(notices, []);
  assert.deepEqual(log.started, [{
    source: '/games/A',
    output: '/games/A.packed',
    mode: 'zstd',
    level: 9,
    deleteAfter: true,
  }]);
  assert.deepEqual(log.removed, [], 'nothing is cleared when the output is not there');
});

test('a partial output is cleared -- only it, and only before the job starts over it', async () => {
  const {recovery, log, existing} = world({
    records: [pack()],
    files: ['/games/A', '/games/A/eboot.bin', '/games/A.packed', '/games/A.packed/ampr_zstd-000.pak'],
  });
  const {resumed} = await recovery.recover();
  assert.equal(resumed.length, 1);
  assert.deepEqual(log.removed, ['/games/A.packed'], 'only the output folder goes');
  assert.equal(log.order.indexOf('remove:/games/A.packed') < log.order.indexOf('start'), true);
  assert.equal(existing.has('/games/A'), true, 'the source is untouched');
  assert.equal(existing.has('/games/A/eboot.bin'), true, 'every file under the source is untouched');
  assert.equal(existing.has('/games/A.packed'), false);
});

test('an output that already carries its pack index is a finished result and stays', async () => {
  const {recovery, log, existing} = world({
    records: [pack()],
    files: ['/games/A', '/games/A.packed', '/games/A.packed/ampr_zstd.index'],
  });
  const {resumed, notices} = await recovery.recover();
  assert.deepEqual(resumed, []);
  assert.equal(notices.length, 1, 'the screen is told instead');
  assert.deepEqual(log.removed, [], 'a finished result is never cleared');
  assert.equal(log.started.length, 0, 'and never packed over');
  assert.equal(existing.has('/games/A.packed/ampr_zstd.index'), true);
  const again = await recovery.recover();
  assert.deepEqual(again, {resumed: [], notices: []});
});

test('a source that is gone is only reported', async () => {
  const {recovery, log} = world({records: [pack()], files: []});
  const {resumed, notices} = await recovery.recover();
  assert.deepEqual(resumed, []);
  assert.deepEqual(notices.map((record) => record.source), ['/games/A']);
  assert.equal(log.started.length, 0);
  assert.deepEqual(log.removed, []);
});

test('an unpack writes back into its own folder and never clears anything', async () => {
  const record = pack({action: 'unpack', source: '/games/A.packed', output: '/games/A.packed', deleteAfter: false});
  const {recovery, log, existing} = world({records: [record], files: ['/games/A.packed']});
  const {resumed, notices} = await recovery.recover();
  assert.equal(resumed.length, 1);
  assert.deepEqual(notices, []);
  assert.deepEqual(log.removed, [], 'an unpack’s folder is also its source');
  assert.deepEqual(log.unpacked, [{source: '/games/A.packed', output: '/games/A.packed', mode: 'zstd'}]);
  assert.equal(existing.has('/games/A.packed'), true);
});

test('the same route is tried once per session, however often the poll comes', async () => {
  const {recovery, log} = world({records: [pack()], files: ['/games/A']});
  await recovery.recover();
  const second = await recovery.recover();
  assert.equal(log.started.length, 1, 'one resume, not one per poll');
  assert.deepEqual(second, {resumed: [], notices: []});
});

test('a refusal that passes on its own is tried again by the next poll', async () => {
  const {recovery, log, state} = world({records: [pack()], files: ['/games/A']});
  state.startFailure = Object.assign(new Error('A download is running'), {code: 'downloads-active'});
  const first = await recovery.recover();
  assert.equal(first.notices.length, 1, 'the screen is told now');
  assert.equal(log.started.length, 0);

  state.startFailure = null;
  const second = await recovery.recover();
  assert.equal(second.resumed.length, 1, 'the next poll picks it up again');
  assert.equal(log.started.length, 1);
});

test('a refusal of the engine’s own marks the record so no poll loops on it', async () => {
  const {recovery, log, state} = world({records: [pack({level: 99})], files: ['/games/A']});
  state.startFailure = Object.assign(new Error('zstd levels run from 1 to 22.'), {code: 'level'});
  const first = await recovery.recover();
  assert.equal(first.notices.length, 1);
  const second = await recovery.recover();
  assert.deepEqual(second, {resumed: [], notices: []});
  assert.equal(log.started.length, 0);
});

test('an output that cannot be cleared is reported and the job is left alone', async () => {
  const {recovery, log} = world({
    records: [pack()],
    files: ['/games/A', '/games/A.packed'],
    removeFailure: new Error('removals: EBUSY'),
  });
  const {resumed, notices} = await recovery.recover();
  assert.deepEqual(resumed, []);
  assert.equal(notices.length, 1);
  assert.equal(log.started.length, 0, 'a partial output is never packed over');
  const again = await recovery.recover();
  assert.deepEqual(again, {resumed: [], notices: []});
});

test('records the engine already knows, or ones this code cannot place, are ignored', async () => {
  const {recovery, log} = world({
    records: [
      pack({state: 'running'}),
      pack({state: 'done'}),
      pack({action: 'something-else'}),
      {state: 'interrupted', source: '/games/B'},
    ],
    files: ['/games/A', '/games/B'],
  });
  const {resumed, notices} = await recovery.recover();
  assert.deepEqual(resumed, []);
  assert.deepEqual(notices, []);
  assert.equal(log.started.length, 0);
  assert.deepEqual(log.removed, []);
});
