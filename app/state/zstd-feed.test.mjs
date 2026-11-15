import assert from 'node:assert/strict';
import {register} from 'node:module';
import test from 'node:test';

register(new URL('./download-queue-test-loader.mjs', import.meta.url), import.meta.url);
const {applyZstdFeed, fetchZstdFeed, itemsOf, loadZstdFeed, valid} = await import('./zstd-feed.js');
const {FileSystem, Http} = await import('@ps5-react/core');

// The published page, reduced: unquoted keys, a trailing comma, an apostrophe in a title, a
// #fragment on a link and a comment holding a bracket, all of which the parser has to step over.
const PAGE = `<!doctype html>
<html><body><script>
const ITEMS = [

  { title: "Marvel's Spider-Man: Remastered", id: "PPSA01467", version: "v01.008.001", size: "66.6 GB",
    image: "Covers/spiderman-remastered.avif", links: ["https://vik1ngfile.site/f/Ms9VvjacNM#PPSA01467"], ampr: "v0.3.3", firmware: "1.00+", credits: "@yared_cf", notes: "" },

  { title: "ASTRO BOT", id: "PPSA21567", version: "v01.005", size: "8.0 GB",
    image: "Covers/astrobot.jpg", links: ["https://vik1ngfile.site/f/AAAAAAAAAA", "https://vik1ngfile.site/f/BBBBBBBBBB"], ampr: "v0.3.3", firmware: "4.00+", credits: "", notes: "" },

  /* a ] bracket and a [ one in a comment inside the array, plus a colon: none of it is data */

  { title: "Gofile Only", id: "PPSA99991", version: "v01.000", size: "1.0 GB",
    image: "Covers/gofile-only.jpg", links: ["https://gofile.io/d/moHevfwy"], ampr: "v0.3.3", firmware: "4.00+", credits: "", notes: "" },

  { title: "Welinkly Only", id: "PPSA99992", version: "v01.000", size: "1.0 GB",
    image: "Covers/welinkly-only.jpg", links: ["https://welinkly.com/yaredcf/borderlands4"], ampr: "v0.3.3", firmware: "10.xx+", credits: "", notes: "" },

  { title: "Ratatan", id: "PPSA34884", version: "v01.000.006", size: "1.77 GB",
    image: "Covers/PPSA34884.jpg", links: ["https://vik1ngfile.site/f/VeDCiL9iAK"], ampr: "v0.3.3", firmware: "4.xx+", credits: "AxlFuy", notes: "" },
];
</script></body></html>`;

const feed = (items) => ({format: 1, generated: '2026-11-14T00:00:00Z', items});

test('the ITEMS array of the published page parses, punctuation and comments included', () => {
  const items = itemsOf(PAGE);
  assert.equal(items.length, 5);
  assert.equal(items[0].title, "Marvel's Spider-Man: Remastered");
  assert.deepEqual(items[1].links, [
    'https://vik1ngfile.site/f/AAAAAAAAAA',
    'https://vik1ngfile.site/f/BBBBBBBBBB',
  ]);
  assert.equal(items[2].title, 'Gofile Only');
  assert.equal(items[4].credits, 'AxlFuy');
  assert.equal(valid(feed(items)), true);
});

test('an item a merge could trip on is refused', () => {
  const good = itemsOf(PAGE)[0];
  const broken = [
    feed([{...good, id: 'nope'}]),
    feed([{...good, title: ''}]),
    feed([{...good, links: []}]),
    feed([{...good, links: 'https://vik1ngfile.site/f/AAAAAAAAAA'}]),
    feed([{...good, links: [1]}]),
    feed([{...good, version: 7}]),
    feed([{...good, ampr: {}}]),
    feed([{...good, links: new Array(65).fill('https://gofile.io/d/x'.padEnd(22, '1'))}]),
    feed([]),
    {format: 2, generated: '2026-11-14T00:00:00Z', items: [good]},
    {format: 1, items: [good]},
  ];
  for (const item of broken) assert.equal(valid(item), false, JSON.stringify(item).slice(0, 140));
});

// The rows a merge wrote, or the file as it was on disk when the merge left it alone.
const rows = (file, updated, read) => JSON.parse(updated.has(file) ? updated.get(file) : read(file));

test('merging appends rows once, strips fragments, keeps the labels credit-free and marks live games', () => {
  const existing = [{
    id: 'rold00000001', format: 'rar', filename: 'PPSA01467-game-unknown-rold00000001.rar',
    url: 'https://vik1ngfile.site/f/Ms9VvjacNM#PPSA01467', browserUrl: 'https://vik1ngfile.site/f/Ms9VvjacNM#PPSA01467',
    requiresBrowser: true, sizeBytes: null, version: '', category: 'game', provider: 'VikingFile',
    source: 'pegasus-0', flow: 'vikingfile', label: 'USA 10.xx Base - Vikingfile', platform: 'ps5', record: 'pegasus-0-1',
  }];
  const onDisk = new Map([['data/releases/PPSA01467.json', JSON.stringify(existing)]]);
  const read = (path) => {
    if (onDisk.has(path)) return onDisk.get(path);
    throw new Error('no such file');
  };
  const games = [
    {id: 'PPSA01467', title: 'Spider-Man'},
    {id: 'PPSA21567', title: 'ASTRO BOT'},
    {id: 'PPSA99992', title: 'Welinkly Game'},
    {id: 'CUSA00001', title: 'Untouched'},
  ];
  const updated = new Map();
  applyZstdFeed(feed(itemsOf(PAGE)), games, [], read, updated);

  // The feed's link is already in the file (with a fragment): no second row for it, and the row
  // already there is left exactly as it was.
  const merged = rows('data/releases/PPSA01467.json', updated, read);
  assert.equal(merged.length, 1, 'the shared link is not added twice');
  assert.equal(merged[0].source, 'pegasus-0');
  assert.equal(merged[0].url, 'https://vik1ngfile.site/f/Ms9VvjacNM#PPSA01467');
  assert.equal(existing.length, 1, 'the file read is never mutated in place');

  // Multi-link labels count within one host, and no row carries the feed's credits or its fragment.
  const astro = rows('data/releases/PPSA21567.json', updated, read);
  assert.equal(astro.length, 2);
  assert.equal(astro[0].label, 'ZSTD 4.00+ ampr-emu-ng v0.3.3 (1/2) - VikingFile');
  assert.equal(astro[1].label, 'ZSTD 4.00+ ampr-emu-ng v0.3.3 (2/2) - VikingFile');
  for (const row of astro) {
    assert.equal(row.source, 'zstd-catalog');
    assert.equal(row.format, 'rar');
    assert.equal(row.record, 'zstd-PPSA21567');
    assert.equal(row.platform, 'ps5');
    assert.equal(row.requiresBrowser, true);
    assert.equal(row.browserUrl, row.url);
    assert.ok(!row.url.includes('#'), 'the fragment is cut for the capture');
    assert.ok(!/@/.test(row.label), 'no credits in the label');
    assert.match(row.id, /^r[0-9a-f]{12}$/);
    assert.equal(row.filename, `PPSA21567-game-01.005-${row.id}.rar`);
  }

  // A Gofile row of the feed is live (the scoped exception), so its game is created and marked.
  const gofile = games.find((game) => game.id === 'PPSA99991');
  assert.ok(gofile, 'the game is added');
  assert.equal(gofile.zstd, true);
  assert.deepEqual(gofile.providers, ['gofile']);
  assert.equal(gofile.art.cover, 'https://francovoid9.github.io/zstd-catalog/Covers/gofile-only.jpg');
  const gofileRow = rows('data/releases/PPSA99991.json', updated, read)[0];
  assert.equal(gofileRow.provider, 'gofile.io');
  assert.equal(gofileRow.requiresBrowser, true);
  assert.equal(gofileRow.browserUrl, 'https://gofile.io/d/moHevfwy');
  assert.equal(gofileRow.filename, `PPSA99991-game-01.000-${gofileRow.id}.rar`);
  assert.match(gofileRow.id, /^r[0-9a-f]{12}$/);

  // A Welinkly row is imported but stays paused: written, never marked, its game never added.
  const welinkly = rows('data/releases/PPSA99992.json', updated, read);
  assert.equal(welinkly.length, 1);
  assert.equal(welinkly[0].provider, 'Welinkly');
  assert.equal(games.find((game) => game.id === 'PPSA99992').zstd, undefined);

  // Live rows mark the games that already existed; the untouched one stays out of it.
  assert.equal(games.find((game) => game.id === 'PPSA01467').zstd, true);
  assert.equal(games.find((game) => game.id === 'PPSA21567').zstd, true);
  assert.equal(games.find((game) => game.id === 'CUSA00001').zstd, undefined);

  // A game the build lacks comes with the store's own metadata and a page to describe it.
  const ratatan = games.find((game) => game.id === 'PPSA34884');
  assert.equal(ratatan.developer, 'Ratata Arts');
  assert.equal(ratatan.publisher, 'Game Source Entertainment');
  assert.equal(ratatan.releaseDate, '2026-10-15');
  assert.equal(ratatan.year, 2026);
  assert.deepEqual(ratatan.genres, ['Action']);
  assert.equal(ratatan.added, '2026-11-14');
  assert.equal(ratatan.sizeGb, 1.77);
  assert.equal(ratatan.art.cover, 'https://raw.githubusercontent.com/B4ckd0orl/Padrino-Store/main/covers/PPSA34884.jpg');
  const page = JSON.parse(updated.get('data/pages/PPSA34884.json'));
  assert.ok(page.summary.length > 80);
  assert.ok(Array.isArray(page.about) && page.shots.length === 0);
});

test('merging the same feed again adds nothing', () => {
  const read = (path) => {
    if (path === 'data/releases/PPSA01467.json') return '[]';
    throw new Error('no such file');
  };
  const first = new Map();
  const one = [{id: 'PPSA01467', title: 'Spider-Man'}];
  applyZstdFeed(feed(itemsOf(PAGE)), one, [], read, first);
  const second = new Map();
  const two = [{id: 'PPSA01467', title: 'Spider-Man'}];
  applyZstdFeed(feed(itemsOf(PAGE)), two, [], (path) => first.get(path) ?? read(path), second);
  assert.equal(second.has('data/releases/PPSA01467.json'), false, 'a row already there is never added again');
  assert.equal(one[0].zstd, true);
  assert.equal(two[0].zstd, true, 'the mark does not depend on a row being written again');
});

test('the published page is fetched within the native limit, kept, and read the next launch', async () => {
  const files = new Map();
  Object.assign(FileSystem, {
    exists: (path) => files.has(path),
    readFile: (path) => files.get(path),
    writeFile: (path, text) => { files.set(path, text); },
    rename: (from, to) => { files.set(to, files.get(from)); files.delete(from); },
    mkdir: () => {},
  });
  const asked = [];
  Http.request = async (url, options) => {
    if (!(options.maxBytes >= 1 && options.maxBytes <= 4 * 1024 * 1024)) throw new TypeError('network.request: invalid maxBytes');
    asked.push(options.headers['If-None-Match']);
    if (options.headers['If-None-Match'] === '"v1"') return {status: 304, ok: false, headers: {}, text: async () => ''};
    return {status: 200, ok: true, headers: {etag: '"v1"'}, text: async () => PAGE};
  };
  const logs = [];
  const log = console.log;
  console.log = (line) => logs.push(String(line));
  try {
    await fetchZstdFeed();
    await fetchZstdFeed();
  } finally {
    console.log = log;
  }
  assert.deepEqual(asked, [undefined, '"v1"'], logs.join('\n'));
  assert.match(logs[0], /kept 5 items/);
  assert.match(logs[1], /no change since the kept feed/);
  const kept = loadZstdFeed();
  assert.equal(valid(kept), true);
  assert.equal(kept.items.length, 5);
});

test('a page without a readable ITEMS array is not kept', async () => {
  const files = new Map();
  Object.assign(FileSystem, {
    exists: (path) => files.has(path),
    readFile: (path) => files.get(path),
    writeFile: (path, text) => { files.set(path, text); },
    rename: (from, to) => { files.set(to, files.get(from)); files.delete(from); },
    mkdir: () => {},
  });
  Http.request = async () => ({status: 200, ok: true, headers: {etag: '"v2"'}, text: async () => '<html>no array here</html>'});
  const logs = [];
  const log = console.log;
  console.log = (line) => logs.push(String(line));
  try {
    await fetchZstdFeed();
  } finally {
    console.log = log;
  }
  assert.match(logs[0], /not read/);
  assert.equal(files.has('/data/padrino-store/zstd-feed.json'), false);
});
