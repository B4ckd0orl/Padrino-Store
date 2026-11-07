import assert from 'node:assert/strict';
import test from 'node:test';

const {createForge, deletionGate, forgeRequest, normalizeJob, unpackRequest, validLevel} = await import('./forge.js');

// A fake console disk: forge.json appears under the state directory and survives a second client.
// readDir walks the same map, so a job's source can have files (and a size) under it.
function fakeFs(seed = {}, {removeError} = {}) {
  const files = new Map(Object.entries(seed));
  const under = (path) => [...files.keys()].filter((key) => key.startsWith(`${path}/`));
  return {
    dataDir: '/data',
    files,
    // A directory is there when anything sits under it, which is how the real host answers.
    exists: path => files.has(path) || under(path).length > 0,
    readFile: path => {
      if (!files.has(path)) throw new Error(`missing ${path}`);
      return files.get(path);
    },
    writeFile: (path, data) => files.set(path, data),
    mkdir() {},
    rename: (from, to) => {
      if (!files.has(from)) throw new Error(`missing ${from}`);
      files.set(to, files.get(from));
      files.delete(from);
    },
    // Resolves once the path is gone, or if it never existed; the caller can make it refuse.
    removeAsync: async path => {
      if (removeError && path === removeError.path) throw new Error(removeError.message);
      for (const key of under(path)) files.delete(key);
      files.delete(path);
    },
    readDir: path => {
      const entries = [];
      const folders = new Set();
      for (const [key, value] of files) {
        if (!key.startsWith(`${path}/`)) continue;
        const rest = key.slice(path.length + 1);
        const slash = rest.indexOf("/");
        if (slash < 0) {
          entries.push({ name: rest, isDirectory: false, size: String(value).length, modified: 0 });
        } else if (!folders.has(rest.slice(0, slash))) {
          folders.add(rest.slice(0, slash));
          entries.push({ name: rest.slice(0, slash), isDirectory: true, size: 0, modified: 0 });
        }
      }
      return entries;
    },
  };
}

// The engine over HTTP: every call is recorded, and the handler decides the answer. A handler
// that never resolves stands for a silent engine.
function fakeHttp(handler) {
  const calls = [];
  return {
    calls,
    http: {
      async request(url, options = {}) {
        calls.push({url, ...options});
        return handler(url, options, calls.length);
      },
    },
  };
}

const ok = data => ({status: 200, json: async () => data});
const refused = (status, error) => ({status, json: async () => ({error})});

function world({seed, handler, activeDownloads = () => false, power, removeError, wait} = {}) {
  const fs = fakeFs(seed, {removeError});
  const {http, calls} = fakeHttp(handler);
  const awake = [];
  const forge = createForge({
    fs,
    http,
    power: power ?? {keepAwake: value => awake.push(value)},
    stateDir: '/data/ps5-react/PPSA99059/queue',
    activeDownloads,
    now: () => 1700000000000,
    wait: wait ?? (async () => {}),
  });
  return {forge, fs, calls, awake, saved: () => fs.files.get('/data/ps5-react/PPSA99059/queue/forge.json')};
}

// Fail a test that never gets its answer instead of hanging the run.
async function within(promise, ms = 2000) {
  let handle;
  const timeout = new Promise((_, reject) => {
    handle = setTimeout(() => reject(new Error('no answer in time')), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(handle);
  }
}

const SESSION = {app: 'ps5-dump-forge', stopping: false, url: 'http://127.0.0.1:8095', version: '0.5.3'};

test('probe reports the engine that answers', async () => {
  const {forge, calls} = world({handler: () => ok(SESSION)});
  assert.deepEqual(await forge.probe(), {state: 'up', version: '0.5.3'});
  assert.equal(calls[0].url, 'http://127.0.0.1:8095/api/session');
  assert.equal(calls[0].method, 'GET');
});

test('probe distinguishes shutting down, a stranger on the port, and nothing there', async () => {
  const stopping = world({handler: () => ok({...SESSION, stopping: true})});
  assert.deepEqual(await stopping.forge.probe(), {state: 'stopping', version: '0.5.3'});

  const stranger = world({handler: () => ok({app: 'something-else', version: '9'})});
  assert.deepEqual(await stranger.forge.probe(), {state: 'other', version: '9'});

  const gone = world({handler: () => {
    throw new Error('Http.request: Could not connect');
  }});
  assert.deepEqual(await gone.forge.probe(), {state: 'down', reason: 'unreachable'});

  const refusedProbe = world({handler: () => refused(404, 'nope')});
  assert.deepEqual(await refusedProbe.forge.probe(), {state: 'down', reason: 'HTTP 404'});
});

test('probe times out quietly and aborts the request it gave up on', async () => {
  const {forge, calls} = world({handler: () => new Promise(() => {})});
  const answer = await within(forge.probe({timeoutMs: 5}), 2000);
  assert.equal(answer.state, 'down');
  assert.equal(answer.reason, 'timeout');
  assert.equal(calls[0].signal.aborted, true);
});

test('the engine’s own refusals become codes the screen can translate', async () => {
  const cases = [
    [refused(409, 'server is stopping'), 'stopping'],
    [refused(413, 'payload too large'), 'body'],
    [refused(429, 'too many jobs'), 'saturated'],
    [refused(400, '2 games are being read'), 'reading'],
    [refused(400, 'a job is already queued or running'), 'busy'],
    // A message that names the situation wins over the status it arrived with: the 409 that
    // means "shutting down" is still a busy engine when the engine says "already queued", and
    // a disk out of room is space whatever status carried it.
    [refused(409, 'a job is already queued'), 'busy'],
    [refused(500, 'No space left on device'), 'space'],
    [refused(404, 'nothing here'), 'http'],
  ];
  for (const [response, code] of cases) {
    const {forge} = world({handler: () => response});
    await assert.rejects(
      forge.startJob({source: '/games/A', output: '/games/A.fpkg', mode: 'zstd', level: 15}),
      error => error.code === code,
      `expected ${code}`,
    );
  }
});

test('startJob sends the request the engine’s own UI sends', async () => {
  const {forge, calls, awake, saved} = world({seed: {'/games/A/eboot.bin': 'abcdefghij'}, handler: () => ok({id: 'job-7'})});
  const {id, request} = await forge.startJob({
    source: '/games/A',
    output: '/games/A.fpkg',
    mode: 'zstd',
    level: 19,
    deleteAfter: true,
  });
  assert.equal(id, 'job-7');
  assert.deepEqual(request, {
    source: '/games/A',
    format: 'folder',
    output: '/games/A.fpkg',
    compression_threads: null,
    inner: null,
    remove_backport: false,
    full_verify: false,
    lz4: null,
    delete_source: true,
    zstd_pack: true,
    zstd_level: 19,
  });
  const body = JSON.parse(calls[0].body);
  assert.deepEqual(body, {request});
  assert.deepEqual(awake, [true]);
  // The job lands on disk, and a second client over the same state directory finds it again.
  const stored = JSON.parse(saved());
  assert.equal(stored.version, 1);
  assert.equal(stored.jobs[0].id, 'job-7');
  assert.equal(stored.jobs[0].state, 'running');
  // The source's own size is kept with the job: the screen's before -> after -> freed line.
  assert.equal(stored.jobs[0].size, 10);
  const reopened = createForge({
    fs: fakeFs({'/data/ps5-react/PPSA99059/queue/forge.json': saved()}),
    http: fakeHttp(() => ok({})).http,
    stateDir: '/data/ps5-react/PPSA99059/queue',
  });
  assert.equal(reopened.records()[0].source, '/games/A');
  assert.equal(reopened.records()[0].state, 'interrupted');
});

test('an LZ4 job uses the LZ4 flags, and delete_source only when accepted', async () => {
  assert.deepEqual(forgeRequest({source: '/a', output: '/a.fpkg', mode: 'lz4', level: 9}), {
    source: '/a',
    format: 'folder',
    output: '/a.fpkg',
    compression_threads: null,
    inner: null,
    remove_backport: false,
    full_verify: false,
    lz4: 'pack',
    lz4_level: 9,
    lz4_runtime: 'ng',
  });
  assert.equal('delete_source' in forgeRequest({source: '/a', output: '/a.fpkg', mode: 'lz4', level: 0}), false);
  assert.equal(forgeRequest({source: '/a', output: '/a.fpkg', mode: 'zstd', level: 5, fullVerify: true}).full_verify, true);
});

test('an unpack job runs the same request backwards and never removes anything', () => {
  const base = {
    source: '/games/A.packed',
    format: 'folder',
    output: '/games/A',
    compression_threads: null,
    inner: null,
    remove_backport: false,
    full_verify: false,
    lz4: null,
  };
  assert.deepEqual(unpackRequest({source: '/games/A.packed', output: '/games/A', mode: 'zstd'}), {
    ...base,
    zstd_unpack: true,
  });
  assert.deepEqual(unpackRequest({source: '/games/A.packed', output: '/games/A', mode: 'lz4'}), {
    ...base,
    lz4: 'unpack',
  });
  // Undoing a pack only adds files back: no flag that could ever delete a source exists here.
  for (const mode of ['zstd', 'lz4']) {
    const request = unpackRequest({source: '/a', output: '/b', mode, fullVerify: true});
    assert.equal('delete_source' in request, false, mode);
    assert.equal('zstd_pack' in request, false, mode);
    assert.equal(request.full_verify, true, mode);
  }
});

test('unpacking follows the same guards as packing', async () => {
  const busy = world({handler: () => ok({id: 'job-1'}), activeDownloads: () => true});
  await assert.rejects(
    busy.forge.unpackJob({source: '/games/A.packed', output: '/games/A', mode: 'zstd'}),
    error => error.code === 'downloads-active',
  );
  assert.equal(busy.calls.length, 0);

  const stranger = world({handler: () => ok({id: 'job-1'})});
  await assert.rejects(
    stranger.forge.unpackJob({source: '/games/A.packed', output: '/games/A', mode: 'gzip'}),
    error => error.code === 'level',
  );
  assert.equal(stranger.calls.length, 0);

  await stranger.forge.startJob({source: '/games/A', output: '/games/A.packed', mode: 'zstd', level: 15});
  await assert.rejects(
    stranger.forge.unpackJob({source: '/games/A.packed', output: '/games/A', mode: 'zstd'}),
    error => error.code === 'duplicate',
  );
  assert.equal(stranger.calls.length, 1);
});

test('unpackJob sends the reverse request and keeps it in the record', async () => {
  const {forge, calls, saved} = world({handler: () => ok({id: 'job-9'})});
  const {id, request} = await forge.unpackJob({
    source: '/games/A.packed',
    output: '/games/A',
    mode: 'lz4',
  });
  assert.equal(id, 'job-9');
  assert.equal(request.lz4, 'unpack');
  assert.equal('delete_source' in request, false);
  assert.deepEqual(JSON.parse(calls[0].body), {request});
  const record = JSON.parse(saved()).jobs[0];
  assert.equal(record.action, 'unpack');
  assert.equal(record.source, '/games/A.packed');
  assert.equal(record.deleteAfter, false);
});

test('levels outside the engine’s ranges never leave the app', async () => {
  assert.equal(validLevel('zstd', 1), true);
  assert.equal(validLevel('zstd', 22), true);
  assert.equal(validLevel('zstd', 0), false);
  assert.equal(validLevel('zstd', 23), false);
  assert.equal(validLevel('zstd', 19.5), false);
  assert.equal(validLevel('lz4', 0), true);
  assert.equal(validLevel('lz4', 3), true);
  assert.equal(validLevel('lz4', 12), true);
  assert.equal(validLevel('lz4', 2), false);
  assert.equal(validLevel('lz4', 13), false);
  assert.equal(validLevel('gzip', 5), false);

  const {forge, calls} = world({handler: () => ok({id: 'job-1'})});
  await assert.rejects(
    forge.startJob({source: '/games/A', output: '/games/A.fpkg', mode: 'zstd', level: 23}),
    error => error.code === 'level',
  );
  await assert.rejects(
    forge.startJob({source: '/games/A', output: '/games/A.fpkg', mode: 'lz4', level: 2}),
    error => error.code === 'level',
  );
  assert.equal(calls.length, 0);
});

test('a download in flight keeps compression waiting', async () => {
  const {forge, calls} = world({handler: () => ok({id: 'job-1'}), activeDownloads: () => true});
  await assert.rejects(
    forge.startJob({source: '/games/A', output: '/games/A.fpkg', mode: 'zstd', level: 15}),
    error => error.code === 'downloads-active',
  );
  assert.equal(calls.length, 0);
});

test('one job per route: a second start over the same folder is refused', async () => {
  const {forge, calls} = world({handler: () => ok({id: 'job-1'})});
  await forge.startJob({source: '/games/A', output: '/games/A.fpkg', mode: 'zstd', level: 15});
  await assert.rejects(
    forge.startJob({source: '/games/A', output: '/games/other.fpkg', mode: 'zstd', level: 15}),
    error => error.code === 'duplicate',
  );
  await assert.rejects(
    forge.startJob({source: '/games/B', output: '/games/A.fpkg', mode: 'zstd', level: 15}),
    error => error.code === 'duplicate',
  );
  assert.equal(calls.length, 1);
});

test('a second start that leaves before the first one is recorded is refused', async () => {
  // An engine slow to answer: the first start sits between its guard and its record while the
  // second one arrives. The route is owned from the first instant, so only the first goes out.
  const {forge, calls} = world({
    handler: () => new Promise(resolve => setTimeout(() => resolve(ok({id: 'job-1'})), 5)),
  });
  const first = forge.startJob({source: '/games/A', output: '/games/A.packed', mode: 'zstd', level: 15});
  await assert.rejects(
    forge.startJob({source: '/games/A', output: '/games/other.packed', mode: 'zstd', level: 15}),
    error => error.code === 'duplicate',
  );
  await first;
  assert.equal(calls.length, 1, 'only the first start reached the engine');
  // The reservation is given back: the next start over the route goes once the record is there.
  await forge.startJob({source: '/games/B', output: '/games/B.packed', mode: 'zstd', level: 15});
  assert.equal(calls.length, 2);
});

test('starting a route over again replaces its interrupted record instead of duplicating it', async () => {
  const seed = {
    '/data/ps5-react/PPSA99059/queue/forge.json': JSON.stringify({
      version: 1,
      jobs: [{id: 'job-1', action: 'pack', source: '/games/A', output: '/games/A.packed', state: 'interrupted', startedAt: 1}],
    }),
  };
  const {forge, saved} = world({seed, handler: () => ok({id: 'job-2'})});
  await forge.startJob({source: '/games/A', output: '/games/A.packed', mode: 'zstd', level: 15});
  const stored = JSON.parse(saved()).jobs;
  assert.equal(stored.length, 1, 'the old record is replaced, not kept beside the new one');
  assert.equal(stored[0].id, 'job-2');
  assert.equal(stored[0].state, 'running');
});

test('a record binds to its own route even when the engine hands its id to another job', async () => {
  const seed = {
    '/data/ps5-react/PPSA99059/queue/forge.json': JSON.stringify({
      version: 1,
      jobs: [{id: 'job-1', action: 'pack', source: '/games/A', output: '/games/A.packed', state: 'running', startedAt: 1}],
    }),
  };
  const {forge} = world({
    seed,
    // The engine restarted and gave job-1 to a folder of its own; ours came back as job-5.
    handler: () => ok({instance: 'forge', jobs: [
      {id: 'job-1', done: {result: {Ok: {}}}, progress: {}, request: {source: '/games/Other', output: '/games/Other.packed'}},
      {id: 'job-5', done: null, progress: {stage: 'pack', done: 2, total: 10}, request: {source: '/games/A', output: '/games/A.packed'}},
    ]}),
  });
  assert.equal(forge.records()[0].state, 'interrupted');
  await forge.jobs();
  // The id-first match would have claimed the other job's finished result for this record.
  assert.equal(forge.records()[0].state, 'running');
});

test('a job the engine reports without a route still matches its record by id', async () => {
  const seed = {
    '/data/ps5-react/PPSA99059/queue/forge.json': JSON.stringify({
      version: 1,
      jobs: [{id: 'job-1', action: 'pack', source: '/games/A', output: '/games/A.packed', state: 'running', startedAt: 1}],
    }),
  };
  const {forge} = world({
    seed,
    handler: () => ok({instance: 'forge', jobs: [{id: 'job-1', done: null, progress: {stage: 'pack', done: 2, total: 10}}]}),
  });
  await forge.jobs();
  assert.equal(forge.records()[0].state, 'running');
});

test('polling settles the record and lets the console sleep again', async () => {
  let polls = 0;
  const {forge, awake, saved} = world({
    handler: url => {
      if (url.endsWith('/api/start_job')) return ok({id: 'job-1'});
      polls += 1;
      return polls === 1
        ? ok({instance: 'forge', jobs: [{id: 'job-1', done: null, progress: {stage: 'pack', done: 4, total: 10}, request: {source: '/games/A', output: '/games/A.fpkg'}}]})
        : ok({instance: 'forge', jobs: [{id: 'job-1', done: {result: {Ok: {}}}, progress: {stage: 'verify', done: 10, total: 10}, request: {source: '/games/A', output: '/games/A.fpkg'}}]});
    },
  });
  await forge.startJob({source: '/games/A', output: '/games/A.fpkg', mode: 'zstd', level: 15});

  const running = await forge.jobs();
  assert.equal(running.length, 1);
  assert.equal(running[0].state, 'running');
  assert.equal(running[0].progress.stage, 'pack');
  assert.equal(running[0].progress.done, 4);
  assert.deepEqual(awake, [true]);
  assert.equal(JSON.parse(saved()).jobs[0].state, 'running');

  const finished = await forge.jobs();
  assert.equal(finished[0].state, 'done');
  assert.deepEqual(finished[0].result, {Ok: {}});
  assert.deepEqual(awake, [true, false]);
  const record = JSON.parse(saved()).jobs[0];
  assert.equal(record.state, 'done');
  assert.equal(record.finishedAt, 1700000000000);
});

test('a job the engine no longer knows is interrupted, never deleted', async () => {
  const seed = {
    '/data/ps5-react/PPSA99059/queue/forge.json': JSON.stringify({
      version: 1,
      jobs: [{id: 'job-1', source: '/games/A', output: '/games/A.fpkg', state: 'running', startedAt: 1}],
    }),
  };
  const {forge, saved} = world({seed, handler: () => ok({instance: 'forge', jobs: []})});
  assert.equal(forge.records()[0].state, 'interrupted');
  assert.equal((await forge.jobs()).length, 0);
  assert.equal(JSON.parse(saved()).jobs[0].state, 'interrupted');
  assert.equal(forge.records()[0].source, '/games/A');
});

test('a job still packing after a restart is running again', async () => {
  const seed = {
    '/data/ps5-react/PPSA99059/queue/forge.json': JSON.stringify({
      version: 1,
      jobs: [{id: 'job-1', source: '/games/A', output: '/games/A.fpkg', state: 'running', startedAt: 1}],
    }),
  };
  const {forge, awake} = world({
    seed,
    handler: () => ok({instance: 'forge', jobs: [{id: 'job-1', done: null, progress: {stage: 'pack', done: 2, total: 10}, request: {source: '/games/A', output: '/games/A.fpkg'}}]}),
  });
  assert.equal(forge.records()[0].state, 'interrupted');
  await forge.jobs();
  assert.equal(forge.records()[0].state, 'running');
  assert.deepEqual(awake, [true]);
});

test('watch hands over each poll and stops on demand', async () => {
  const {forge} = world({handler: () => ok({instance: 'forge', jobs: []})});
  const seen = [];
  let stop;
  const first = new Promise(resolve => {
    stop = forge.watch((list, error) => {
      seen.push(error ? error.code : list.length);
      stop();
      resolve();
    }, {intervalMs: 1});
  });
  await within(first);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(seen, [0]);
});

test('subscribe runs one loop for every listener and stops with the last', async () => {
  const {forge} = world({
    handler: () => ok({instance: 'forge', jobs: []}),
    // A real timer between polls: this test waits on timers of its own between assertions.
    wait: ms => new Promise(resolve => setTimeout(resolve, ms)),
  });
  const first = [];
  const second = [];
  const stopFirst = forge.subscribe(list => first.push(list.length), {intervalMs: 1});
  const stopSecond = forge.subscribe(list => second.push(list.length), {intervalMs: 1});
  const stopBad = forge.subscribe(() => {
    throw new Error('a listener that blows up');
  }, {intervalMs: 1});
  await within(new Promise(resolve => {
    const until = setInterval(() => {
      if (first.length > 0 && second.length > 0) {
        clearInterval(until);
        resolve();
      }
    }, 1);
  }));
  // The second subscriber keeps its polls after the first one leaves: one loop, many readers,
  // and a listener that throws never takes the others down with it.
  stopFirst();
  stopBad();
  const seen = second.length;
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.ok(second.length > seen, 'the shared loop is still running');
  stopSecond();
  const settled = first.length + second.length;
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(first.length + second.length, settled, 'the loop stops with the last subscriber');
});

test('the double gate: only an accepted, verified result may remove the original', () => {
  const job = {state: 'done', result: {Ok: {}}};
  assert.equal(deletionGate({accepted: true, job, indexes: true}), true);
  // Not accepted: the player said keep the folder.
  assert.equal(deletionGate({accepted: false, job, indexes: true}), false);
  // Still packing.
  assert.equal(deletionGate({accepted: true, job: {state: 'running', result: null}, indexes: true}), false);
  // The engine reported a failure.
  assert.equal(deletionGate({accepted: true, job: {state: 'failed', result: {Err: 'boom'}}, indexes: true}), false);
  // No record of the job at all.
  assert.equal(deletionGate({accepted: true, job: null, indexes: true}), false);
  // The packed output never appeared on disk.
  assert.equal(deletionGate({accepted: true, job, indexes: false}), false);
});

test('normalizeJob reads the engine’s shapes', () => {
  assert.equal(normalizeJob({id: 'a', done: null}).state, 'running');
  assert.equal(normalizeJob({id: 'a', done: {result: {Ok: {}}}}).state, 'done');
  assert.equal(normalizeJob({id: 'a', done: {result: {Err: 'nope'}}}).state, 'failed');
  assert.equal(normalizeJob({}).id, null);
  assert.deepEqual(normalizeJob({}).progress, {stage: '', done: 0, total: 0});
});

// A pack driven all the way to its own decision about the original: started, polled to the end,
// then given its one pass over the records. What is left on disk is what the gate allowed.
async function packedWorld({deleteAfter = true, index = 'ampr_zstd.index', state = 'done', removeError} = {}) {
  const source = '/games/A';
  const output = '/games/A.packed';
  const seed = {'/games/A/eboot.bin': 'abcdefghij'};
  if (index) seed[`${output}/${index}`] = 'index';
  const result = state === 'failed' ? {Err: 'boom'} : {Ok: {}};
  const created = world({
    seed,
    removeError,
    handler: url => {
      if (url.endsWith('/api/start_job')) return ok({id: 'job-1'});
      return ok({
        instance: 'forge',
        jobs: [{
          id: 'job-1',
          done: state === 'running' ? null : {result},
          progress: {stage: 'pack', done: 10, total: 10},
          request: {source, output},
        }],
      });
    },
  });
  await created.forge.startJob({source, output, mode: 'zstd', level: 9, deleteAfter});
  await created.forge.jobs();
  await created.forge.settleOriginals();
  return {...created, source, record: () => JSON.parse(created.saved()).jobs[0]};
}

test('an accepted pack the engine verified takes the original off the disk and records it', async () => {
  const {fs, forge, source, record} = await packedWorld();
  assert.equal(fs.exists(source), false);
  const stored = record();
  assert.equal(stored.deletion.state, 'removed');
  // The bytes it freed and the moment it happened, both in forge.json beside the job.
  assert.equal(stored.deletion.bytes, 10);
  assert.equal(stored.deletion.at, 1700000000000);
  assert.deepEqual(forge.takeNotices(), ['originalRemoved']);
});

test('a pack the player did not accept keeps the original', async () => {
  const {fs, source, record, forge} = await packedWorld({deleteAfter: false});
  assert.equal(fs.exists(source), true);
  assert.equal(record().deletion, undefined);
  assert.deepEqual(forge.takeNotices(), []);
});

test('a job that failed, or has not settled with an Ok, keeps the original', async () => {
  for (const state of ['failed', 'running']) {
    const {fs, source, record} = await packedWorld({state});
    assert.equal(fs.exists(source), true, state);
    assert.equal(record().deletion, undefined, state);
  }
});

test('a finished job whose output never got its index keeps the original', async () => {
  const {fs, source, record} = await packedWorld({index: null});
  assert.equal(fs.exists(source), true);
  assert.equal(record().deletion.state, 'held');
});

test('a removal that refuses warns the screen and changes nothing', async () => {
  const {fs, source, record, forge} = await packedWorld({removeError: {path: '/games/A', message: 'Permission denied'}});
  assert.equal(fs.exists(source), true);
  assert.equal(record().deletion.state, 'failed');
  assert.equal(record().deletion.attempts, 1);
  assert.deepEqual(forge.takeNotices(), ['deleteFailed']);
});

test('only the source this app sent is ever removed, and never a package file', async () => {
  const seed = {
    '/games/A.pkg': 'PKGDATA',
    '/games/A.packed/ampr_zstd.index': 'index',
    '/data/ps5-react/PPSA99059/queue/forge.json': JSON.stringify({
      version: 1,
      jobs: [{id: 'job-1', action: 'pack', source: '/games/A.pkg', output: '/games/A.packed', mode: 'zstd', level: 9, deleteAfter: true, size: 7, startedAt: 1, state: 'done', result: {Ok: {}}}],
    }),
  };
  const {forge, fs} = world({seed, handler: () => ok({instance: 'forge', jobs: []})});
  await forge.jobs();
  await forge.settleOriginals();
  assert.equal(fs.exists('/games/A.pkg'), true);
  assert.equal(forge.records()[0].deletion.state, 'held');
});

test('a source the engine already took away is still recorded as removed', async () => {
  const seed = {
    '/games/A.packed/ampr_zstd.index': 'index',
    '/data/ps5-react/PPSA99059/queue/forge.json': JSON.stringify({
      version: 1,
      jobs: [{id: 'job-1', action: 'pack', source: '/games/Gone', output: '/games/A.packed', mode: 'zstd', level: 9, deleteAfter: true, size: 42, startedAt: 1, state: 'done', result: {Ok: {}}}],
    }),
  };
  const {forge} = world({seed, handler: () => ok({instance: 'forge', jobs: []})});
  await forge.jobs();
  await forge.settleOriginals();
  const record = forge.records()[0];
  assert.equal(record.deletion.state, 'removed');
  assert.equal(record.deletion.bytes, 42);
  assert.deepEqual(forge.takeNotices(), ['originalRemoved']);
});
