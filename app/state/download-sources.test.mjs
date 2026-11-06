import assert from 'node:assert/strict';
import test from 'node:test';

import { BrowserRequired, RESOLVED_KINDS, createSourceResolver, sourceKind } from './download-sources.js';
import { pausedFilter, pausedSource } from './paused-hosts.js';

// Rootz's page only sends the browser to its proxy address, which redirects straight to the CDN
// file: the resolver asks for it, so a Rootz source never waits for a browser check.
const release = { url: 'https://www.rootz.so/d/1UOSVE', requiresBrowser: true, provider: 'Rootz' };

function mockHttp(routes) {
  const asked = [];
  return {
    asked,
    async request(url, options = {}) {
      asked.push([options.method || 'GET', url, options.followRedirects, options.headers?.Referer]);
      const route = routes.find((entry) => (entry.match instanceof RegExp ? entry.match.test(url) : entry.match === url));
      if (!route) return { status: 404, ok: false, url, headers: {} };
      return { status: route.status, ok: route.status >= 200 && route.status < 300, url, headers: route.headers || {} };
    },
  };
}

test('a Rootz source is a resolved kind, not a browser one', () => {
  assert.equal(sourceKind(release), 'rootz');
  assert.ok(RESOLVED_KINDS.has('rootz'));
  assert.equal(pausedSource(release), false, 'the resolver reaches its file, so it is never paused');
  assert.equal(pausedFilter('rootz.so'), false, 'Rootz stays in the host filter');
});

test('Rootz resolves to the CDN file without the browser', async () => {
  const http = mockHttp([
    { match: 'https://www.rootz.so/api/files/proxy-download/1UOSVE', status: 302, headers: { location: 'https://cdn-files.alcyone.so/users/u/1-PPSA21564.rar?filename=PPSA21564.rar' } },
    { match: /^https:\/\/cdn-files\.alcyone\.so\//, status: 200, headers: { 'content-type': 'application/x-compressed', 'content-length': '39992984669' } },
  ]);
  const out = await createSourceResolver({ http }).resolve(release, {});
  assert.equal(out.url, 'https://cdn-files.alcyone.so/users/u/1-PPSA21564.rar?filename=PPSA21564.rar');
  assert.equal(out.expectedBytes, 39992984669);
  assert.equal(out.rejectHtml, true);
  assert.deepEqual(http.asked[0], ['GET', 'https://www.rootz.so/api/files/proxy-download/1UOSVE', false, release.url]);
  assert.equal(http.asked[1][0], 'HEAD', 'the file itself is checked before the download starts');
});

test('a Rootz file the host no longer has is unavailable, not a browser check', async () => {
  const http = mockHttp([]);
  await assert.rejects(createSourceResolver({ http }).resolve({ url: 'https://rootz.so/d/GONE00' }, {}), /Source unavailable: HTTP 404/);
});

test('a Rootz burst answered 429 is asked once more before the browser takes over', async () => {
  let asks = 0;
  const http = {
    async request(url, options = {}) {
      if (url.startsWith('https://www.rootz.so/api/files/proxy-download/')) {
        asks += 1;
        return asks === 1
          ? { status: 429, ok: false, url, headers: {} }
          : { status: 302, ok: false, url, headers: { location: 'https://cdn-files.alcyone.so/users/u/1-PPSA00001.rar' } };
      }
      if (url.startsWith('https://cdn-files.alcyone.so/')) return { status: 200, ok: true, url, headers: { 'content-type': 'application/x-compressed', 'content-length': '1024' } };
      return { status: 404, ok: false, url, headers: {} };
    },
  };
  const out = await createSourceResolver({ http }).resolve(release, {});
  assert.equal(asks, 2, 'the rate-limited ask is repeated');
  assert.equal(out.url, 'https://cdn-files.alcyone.so/users/u/1-PPSA00001.rar');
});

test('Rootz with no id in its address opens the browser check', async () => {
  await assert.rejects(createSourceResolver({ http: mockHttp([]) }).resolve({ url: 'https://www.rootz.so/files' }, {}), (error) => error instanceof BrowserRequired);
});

test('Rootz behind a DDoS-Guard challenge (403) falls back to the browser check', async () => {
  const http = mockHttp([{ match: /^https:\/\/www\.rootz\.so\/api\/files\/proxy-download\//, status: 403 }]);
  await assert.rejects(createSourceResolver({ http }).resolve(release, {}), (error) => error instanceof BrowserRequired);
});
