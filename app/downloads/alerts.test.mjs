import assert from 'node:assert/strict';
import {register} from 'node:module';
import test from 'node:test';

register(new URL('../state/download-queue-test-loader.mjs', import.meta.url), import.meta.url);
const {alertsBetween} = await import('./alerts.js');

// The same disk the eligibility tests use: only the markers the check looks for exist, and a
// path whose last segment has no dot is a directory.
function fakeFs(present = []) {
  const files = new Set(present);
  const directory = path => !path.slice(path.lastIndexOf("/") + 1).includes(".");
  return {
    exists: path => files.has(path),
    readDir: path => {
      const seen = new Set();
      const entries = [];
      for (const file of files) {
        if (!file.startsWith(`${path}/`)) continue;
        const rest = file.slice(path.length + 1);
        const slash = rest.indexOf("/");
        const name = slash < 0 ? rest : rest.slice(0, slash);
        if (slash < 0 && !directory(file)) continue;
        if (seen.has(name)) continue;
        seen.add(name);
        entries.push({name, isDirectory: true});
      }
      return entries;
    },
  };
}

const FOLDER = '/data/ps5-react/PPSA99059/downloads/extracted/CUSA12345';
const fs = fakeFs([`${FOLDER}/eboot.bin`, `${FOLDER}/sce_sys/param.json`]);
const job = (state, over = {}) => ({
  id: 'job-1',
  title: 'A Game',
  gameId: 'CUSA12345',
  state,
  release: {},
  output: FOLDER,
  artifact: {destination: FOLDER, nextAction: 'shadowmount'},
  ...over,
});

test('the extraction finishing offers the folder to compress', () => {
  const alerts = alertsBetween([job('extracting')], [job('extracted')], fs);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].kind, 'complete');
  assert.equal(alerts[0].folder, FOLDER);
});

test('arriving at extracted from another complete state still offers the folder', () => {
  // The queue can land on "extracted" while the job already counted as complete ("downloaded",
  // "extraction-required"): no active state was ever seen in between, so the ordinary complete
  // branch stays silent and this one has to speak.
  for (const was of ['downloaded', 'extraction-required', 'file-downloaded']) {
    const alerts = alertsBetween([job(was)], [job('extracted')], fs);
    assert.equal(alerts.length, 1, was);
    assert.equal(alerts[0].kind, 'complete', was);
    assert.equal(alerts[0].folder, FOLDER, was);
  }
});

test('one jump to extracted is one alert, never two', () => {
  const alerts = alertsBetween([job('downloading')], [job('extracted')], fs);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].folder, FOLDER);
});

test('a state change between two complete states stays silent', () => {
  assert.equal(alertsBetween([job('downloaded')], [job('installed')], fs).length, 0);
});

test('a failure is still reported on its own', () => {
  const alerts = alertsBetween([job('extracting')], [job('failed', {error: 'network unreachable'})], fs);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].kind, 'failed');
  assert.ok(alerts[0].title);
});
