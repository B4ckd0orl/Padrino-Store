import assert from 'node:assert/strict';
import test from 'node:test';

const {createAutoStart} = await import('./auto-start.js');

// The engine's own program as the feed pins it: the name the release asset must carry and the
// digest the download has to match before anything runs.
const SHA = 'a'.repeat(64);
const ELF = '/download0/padrino-store/dumpfolder.elf';
const FEED = 'https://api.github.com/repos/B4ckd0orl/Padrino-Store/releases/latest';

function release(overrides = {}) {
  return {
    tag_name: 'v1.37',
    assets: [{
      name: 'dumpfolder.elf',
      browser_download_url: 'https://example.invalid/dumpfolder.elf',
      size: 18,
      digest: `sha256:${SHA}`,
      ...overrides,
    }],
  };
}

// Everything the auto-start touches, recorded: probes and their answers in order, waits, feed
// requests, downloads, the hand-over to the loader, and every file operation.
function world({
  probeStates = ['up'],
  os = 'ps5',
  feed = release(),
  seed = {},
  downloadError = null,
  sendError = null,
  argsWriteFails = false,
} = {}) {
  const log = {
    probes: 0, waits: [], sends: [], enqueued: [], requests: [],
    written: [], mkdirs: [], removed: [], events: [],
  };
  const files = new Map(Object.entries(seed));
  const fs = {
    dataDir: '/download0',
    exists: (path) => files.has(path),
    readFile: (path) => {
      if (!files.has(path)) throw new Error(`missing ${path}`);
      return files.get(path);
    },
    writeFile: (path, data) => {
      if (argsWriteFails && path === '/data/dumpforge/args') throw new Error('EACCES');
      log.written.push([path, data]);
      log.events.push(`write:${path}`);
      files.set(path, data);
    },
    mkdir: (path) => {
      log.mkdirs.push(path);
      log.events.push(`mkdir:${path}`);
    },
    remove: (path) => {
      log.removed.push(path);
      log.events.push(`remove:${path}`);
      files.delete(path);
    },
    stat: (path) => files.has(path) ? {size: String(files.get(path)).length} : null,
  };
  const http = {
    async request(url, options) {
      log.requests.push({url, options});
      log.events.push('feed');
      if (feed === null) throw new Error('Http.request: Could not connect');
      return {ok: true, json: async () => feed};
    },
  };
  const downloads = {
    enqueue(options) {
      log.enqueued.push(options);
      log.events.push('enqueue');
      return {
        done: (async () => {
          if (downloadError) throw downloadError;
          files.set(options.destination, 'x'.repeat(Number(options.expectedBytes) || 0));
          log.events.push('downloaded');
          return {destination: options.destination};
        })(),
      };
    },
  };
  const payloads = {
    send(options) {
      log.sends.push(options);
      log.events.push('send');
      if (sendError) throw sendError;
    },
  };
  const engine = {
    async probe() {
      const state = probeStates[Math.min(log.probes, probeStates.length - 1)];
      log.probes += 1;
      log.events.push('probe');
      return typeof state === 'string' ? {state} : state;
    },
  };
  const auto = createAutoStart({
    engine,
    fs,
    downloads,
    http,
    platform: {OS: os},
    payloads,
    wait: async (ms) => {
      log.waits.push(ms);
      log.events.push(`wait:${ms}`);
    },
  });
  return {auto, log, files};
}

test('an engine that already answers is left alone', async () => {
  const {auto, log} = world({probeStates: ['up']});
  let preparing = 0;
  assert.equal(await auto.ensureEngine({preparing: () => preparing++}), null);
  assert.equal(preparing, 0, 'nothing is prepared when the engine is already up');
  assert.deepEqual(log.waits, []);
  assert.equal(log.requests.length, 0);
  assert.equal(log.enqueued.length, 0);
  assert.equal(log.sends.length, 0);
});

test('the preview has no loader to hand a program to', async () => {
  const {auto, log} = world({os: 'desktop', probeStates: ['down']});
  assert.equal(await auto.ensureEngine(), 'noPayload');
  assert.equal(log.requests.length, 0, 'the feed is not even read');
  assert.equal(log.sends.length, 0);
});

test('a shutting-down engine and a stranger on the port are never started over', async () => {
  const stopping = world({probeStates: ['stopping']});
  assert.equal(await stopping.auto.ensureEngine(), 'stopping');

  const other = world({probeStates: ['other']});
  assert.equal(await other.auto.ensureEngine(), 'down');
  assert.equal(other.log.sends.length, 0);
  assert.equal(other.log.requests.length, 0);
});

test('a down engine gets the program the feed pins, starts it, and only then waits for the answer', async () => {
  const {auto, log, files} = world({probeStates: ['down', 'up']});
  let preparing = 0;
  assert.equal(await auto.ensureEngine({preparing: () => preparing++}), null);
  assert.equal(preparing, 1);

  // The feed is read first, its digest goes into the download, and the bytes are verified
  // before the loader ever sees the program.
  assert.equal(log.requests[0].url, FEED);
  assert.deepEqual(log.enqueued[0], {
    url: 'https://example.invalid/dumpfolder.elf',
    destination: ELF,
    sha256: SHA,
    expectedBytes: 18,
    rejectHtml: true,
    unlimited: true,
  });
  const sidecar = JSON.parse(files.get(`${ELF}.json`));
  assert.deepEqual(sidecar, {sha256: SHA, size: 18});
  assert.equal(files.get('/data/dumpforge/args'), 'serve\n');

  // Order: feed -> download -> sidecar -> args -> hand-over -> backoff probe.
  const at = (event) => log.events.indexOf(event);
  assert.ok(at('feed') < at('enqueue'), 'the feed is read before anything is downloaded');
  assert.ok(at('downloaded') < at(`write:${ELF}.json`), 'the sidecar lands only after the verified download');
  assert.ok(at(`write:${ELF}.json`) < at('write:/data/dumpforge/args'));
  assert.ok(at('write:/data/dumpforge/args') < at('send'));
  assert.ok(at('send') < at('wait:500'), 'the wait starts after the hand-over');
  assert.deepEqual(log.waits, [500], 'one probe was enough');
  assert.deepEqual(log.sends, [{program: ELF, request: ''}]);
});

test('a program already verified against this feed is run as it is', async () => {
  const program = 'ELF-program-bytes!';
  const {auto, log} = world({
    probeStates: ['down', 'up'],
    seed: {
      [ELF]: program,
      [`${ELF}.json`]: JSON.stringify({sha256: SHA, size: program.length}),
    },
  });
  assert.equal(await auto.ensureEngine(), null);
  assert.equal(log.enqueued.length, 0, 'the verified copy is not fetched again');
  assert.deepEqual(log.removed, []);
  assert.deepEqual(log.sends, [{program: ELF, request: ''}]);
});

test('a local program this feed does not account for is replaced, never run as it stands', async () => {
  const {auto, log} = world({
    probeStates: ['down', 'up'],
    seed: {[ELF]: 'an older program', '/games/A/eboot.bin': 'game bytes'},
  });
  assert.equal(await auto.ensureEngine(), null);
  assert.deepEqual(log.removed, [ELF], 'only the program goes');
  assert.equal(log.enqueued.length, 1);
  assert.ok(log.events.indexOf(`remove:${ELF}`) < log.events.indexOf('send'));
});

test('no feed answers with a pinned program and nothing is fetched or run', async () => {
  const {auto, log} = world({probeStates: ['down'], feed: null});
  assert.equal(await auto.ensureEngine(), 'feed');
  assert.equal(log.requests.length, 2, 'the release feed and its mirror both tried');
  assert.equal(log.enqueued.length, 0);
  assert.equal(log.sends.length, 0);
  assert.deepEqual(log.waits, []);
});

test('bytes that do not match the feed’s SHA-256 never run', async () => {
  const {auto, log, files} = world({
    probeStates: ['down'],
    downloadError: new Error(`Downloads.enqueue ${ELF}: SHA-256 mismatch`),
  });
  assert.equal(await auto.ensureEngine(), 'integrity');
  assert.equal(log.sends.length, 0);
  assert.equal(files.has(`${ELF}.json`), false, 'no sidecar vouches for bytes that failed');
  assert.deepEqual(log.waits, [], 'there is nothing to wait for');
});

test('a download that fails for any other reason reports the download', async () => {
  const {auto, log} = world({probeStates: ['down'], downloadError: new Error('Http.request: Could not connect')});
  assert.equal(await auto.ensureEngine(), 'download');
  assert.equal(log.sends.length, 0);
});

test('a console without a loader on port 9021 says so plainly', async () => {
  const {auto, log} = world({
    probeStates: ['down'],
    sendError: new Error('payloads.send: the payload loader on port 9021 did not answer; load an ELF loader and retry'),
  });
  assert.equal(await auto.ensureEngine(), 'noPayload');
  assert.deepEqual(log.waits, [], 'a refused hand-over is not retried blind');
});

test('a hand-over that fails for another reason reports the start', async () => {
  const {auto, log} = world({probeStates: ['down'], sendError: new Error(`payloads.send: ${ELF} could not be sent`)});
  assert.equal(await auto.ensureEngine(), 'start');
  assert.deepEqual(log.waits, []);
});

test('the engine that never binds the port uses up its backoff window and gives up', async () => {
  const {auto, log} = world({probeStates: ['down']});
  assert.equal(await auto.ensureEngine(), 'start');
  assert.deepEqual(log.waits, [500, 1000, 2000, 4000]);
  assert.equal(log.probes, 5, 'one first probe and one after each wait');
  assert.equal(log.sends.length, 1);
});

test('two screens asking together start one engine', async () => {
  const {auto, log} = world({probeStates: ['down']});
  const first = auto.ensureEngine();
  const second = auto.ensureEngine();
  assert.equal(first, second, 'the second caller joins the flight already in the air');
  assert.equal(await first, 'start');
  assert.equal(log.sends.length, 1, 'one hand-over, not two');
  assert.equal(log.probes, 5, 'one probe sequence, not two');
});

test('a console that refuses the args file still gets the program', async () => {
  const {auto, log, files} = world({probeStates: ['down', 'up'], argsWriteFails: true});
  assert.equal(await auto.ensureEngine(), null);
  assert.equal(files.has('/data/dumpforge/args'), false);
  assert.deepEqual(log.sends, [{program: ELF, request: ''}], 'the program defaults to the same command');
});

test('a local override file names the feed that is read', async () => {
  const {auto, log} = world({
    probeStates: ['up'],
    seed: {'/download0/padrino-store/update-feed': 'https://mirror.example/release.json'},
  });
  assert.equal(await auto.ensureEngine(), null);
  assert.equal(log.requests.length, 0, 'the engine is up: no feed is read at all');
  const {auto: second, log: secondLog} = world({
    probeStates: ['down', 'up'],
    seed: {'/download0/padrino-store/update-feed': 'https://mirror.example/release.json'},
  });
  assert.equal(await second.ensureEngine(), null);
  assert.equal(secondLog.requests[0].url, 'https://mirror.example/release.json');
});
