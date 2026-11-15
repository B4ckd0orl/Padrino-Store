import assert from 'node:assert/strict';
import {register} from 'node:module';
import test from 'node:test';

register(new URL('./download-queue-test-loader.mjs', import.meta.url), import.meta.url);
const {FileSystem} = await import('@ps5-react/core');
const {games} = await import('../data/catalog.js');
const {getGame, mergeZstdNow} = await import('./catalog.js');

// catalog.js applies the shipped snapshot on import (no feed was kept in this process), so the
// merge here is the one a fetch while the store runs performs: the feed it just kept joins the
// session's lists, and reading the same feed again changes nothing.
test('a feed kept while the store runs merges into this session, and a second time changes nothing', () => {
  const files = new Map();
  Object.assign(FileSystem, {
    exists: (path) => files.has(path),
    readFile: (path) => files.get(path),
    writeFile: (path, text) => { files.set(path, text); },
    rename: (from, to) => { files.set(to, files.get(from)); files.delete(from); },
    mkdir: () => {},
  });
  // One game of the catalog's own (not one the snapshot already marked) gains a live row, and one
  // game the build lacks is added — what a community feed published mid-session looks like.
  const target = games.find((game) => !game.zstd && !game.homebrew);
  assert.ok(target, 'the catalog holds a game no feed has marked');
  const feed = {
    format: 1,
    generated: '2999-01-01T00:00:00.000Z',
    items: [
      {title: target.title, id: target.id, version: 'v01.000', size: '1.0 GB', image: '',
        links: ['https://gofile.io/d/mergenow'], ampr: 'v0.3.3', firmware: '1.00+', credits: '', notes: ''},
      {title: 'A Game The Build Lacks', id: 'QQQQ11111', version: 'v01.000', size: '2.0 GB', image: '',
        links: ['https://gofile.io/d/newgame'], ampr: 'v0.3.3', firmware: '1.00+', credits: '', notes: ''},
    ],
  };
  files.set('/data/padrino-store/zstd-feed.json', JSON.stringify(feed));

  assert.deepEqual(mergeZstdNow(), {written: 2, files: 2, made: 1, flagged: 2});

  // The game already in the catalog is marked, and its row reaches its release file — read here
  // through the entry getter the game page itself uses, over the caches the merge made again.
  assert.equal(target.zstd, true);
  assert.ok(target.releases.some((row) => row.url === 'https://gofile.io/d/mergenow'),
    'the merged row is in its release file');

  // The game the feed added is whole: the entry getters its own page reads through, its platforms
  // for the badge on its card, and the lookup every screen opens it with.
  const made = games.find((game) => game.id === 'QQQQ11111');
  assert.ok(made, 'the game is added to the catalog');
  assert.equal(made.zstd, true);
  assert.deepEqual(made.platforms, ['ps5']);
  assert.equal(made.releases.length, 1, 'the releases getter reads the row just merged');
  assert.deepEqual(made.about, [], 'a page the feed holds no page for says nothing');
  assert.equal(getGame('QQQQ11111'), made, 'the lookup finds it');

  // The same feed read again writes nothing, adds nothing, marks nothing: no list is redrawn.
  assert.equal(mergeZstdNow(), null);
});
