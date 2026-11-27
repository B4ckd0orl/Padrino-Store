import assert from 'node:assert/strict';
import test from 'node:test';
import { recoverPackageJobs, refreshPackageJobs } from './recover-packages.js';

const folder = '/data/downloads/packages';
const total = 216513692961;
const release = { id: 'r-gtavi-vikingfile', filename: 'GrandTheft Auto VI [PPSA38500] [v01.002].pkg',
  format: 'pkg', url: 'https://example.com/game', sizeBytes: total };
const game = { id: 'PPSA38500', title: 'Grand Theft Auto VI' };

function fixture(names = ['PPSA38500.pkg.part']) {
  const files = new Map();
  for (const name of names) {
    files.set(`${folder}/${name}`, { isFile: true, size: 1024 ** 3 });
    files.set(`${folder}/${name.slice(0, -5)}.resume`, { isFile: true, size: 96 + Math.ceil(total / (4 * 1024 ** 2)) });
  }
  const fs = {
    readDir: () => names.map(name => ({ name, isFile: true })),
    stat: path => files.get(path) ?? null,
    exists: path => files.has(path)
  };
  const input = {
    fs, jobs: [], gameOf: id => id === game.id ? game : null,
    releasesOf: () => [release],
    formats: { artifact: (item, root) => ({ directory: `${root}/downloads/packages`,
      destination: `${root}/downloads/packages/${item.filename}`, nextAction: 'installer-required' }) }
  };
  return { files, input };
}

test('recovers an interrupted PKG named by title ID without touching its sidecars', () => {
  const { files, input } = fixture();
  const jobs = recoverPackageJobs(input);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].id, 'PPSA38500/r-gtavi-vikingfile');
  assert.equal(jobs[0].downloadDestination, `${folder}/PPSA38500.pkg`);
  assert.equal(jobs[0].state, 'paused');
  assert.equal(jobs[0].checkpointRangeBytes, 4 * 1024 ** 2);
  assert.equal(jobs[0].adopted, true);
  assert.equal(files.size, 2);
});

test('ignores missing checkpoints, final files, and already known jobs', () => {
  const { files, input } = fixture();
  const destination = `${folder}/PPSA38500.pkg`;
  files.delete(`${destination}.resume`);
  assert.deepEqual(recoverPackageJobs(input), []);
  files.set(`${destination}.resume`, { isFile: true, size: 100 });
  files.set(destination, { isFile: true, size: total });
  assert.deepEqual(recoverPackageJobs(input), []);
  files.delete(destination);
  input.jobs = [{ gameId: game.id, downloadDestination: destination }];
  assert.deepEqual(recoverPackageJobs(input), []);
});

test('does not guess between multiple releases of the same title', () => {
  const { input } = fixture();
  input.releasesOf = () => [release, { ...release, id: 'other', filename: 'Other.pkg' }];
  assert.deepEqual(recoverPackageJobs(input), []);
  const exact = fixture([`${release.filename}.part`]);
  exact.input.releasesOf = input.releasesOf;
  assert.equal(recoverPackageJobs(exact.input)[0].requestedId, release.id);
});

test('identifies a 16 MiB checkpoint from its range count', () => {
  const { files, input } = fixture();
  files.set(`${folder}/PPSA38500.pkg.resume`, { isFile: true,
    size: 96 + Math.ceil(total * 1.02 / (16 * 1024 ** 2)) });
  assert.equal(recoverPackageJobs(input)[0].checkpointRangeBytes, 16 * 1024 ** 2);
});

test('shows completed bytes when rebuilding a queue entry', () => {
  const { files, input } = fixture([`${release.filename}.part`]);
  const destination = `${folder}/${release.filename}`;
  const rangeBytes = 4 * 1024 ** 2;
  const bytes = new Uint8Array(96 + Math.ceil(total / rangeBytes));
  bytes.set(new TextEncoder().encode('P5RDL001'));
  const view = new DataView(bytes.buffer);
  view.setBigUint64(8, BigInt(total), true);
  view.setBigUint64(16, BigInt(rangeBytes), true);
  view.setUint32(24, bytes.length - 96, true);
  bytes[96] = bytes[97] = bytes[98] = 1;
  files.set(`${destination}.resume`, { isFile: true, size: bytes.length });
  input.fs.readBytes = () => [...bytes];
  const [job] = recoverPackageJobs(input);
  assert.equal(job.written, 3 * rangeBytes);
  assert.equal(job.total, total);
  job.written = 0;
  job.state = 'awaiting-browser';
  input.fs.exists = () => false;
  assert.equal(refreshPackageJobs(input.fs, [job]), true);
  assert.equal(job.written, 3 * rangeBytes);
});

test('refreshes a saved package from its sidecars even with stale row metadata', () => {
  const { files, input } = fixture([`${release.filename}.part`]);
  const destination = `${folder}/${release.filename}`;
  const rangeBytes = 4 * 1024 ** 2;
  const bytes = new Uint8Array(96 + Math.ceil(total / rangeBytes));
  bytes.set(new TextEncoder().encode('P5RDL001'));
  const view = new DataView(bytes.buffer);
  view.setBigUint64(8, BigInt(total), true);
  view.setBigUint64(16, BigInt(rangeBytes), true);
  view.setUint32(24, bytes.length - 96, true);
  bytes[96] = 1;
  files.set(`${destination}.resume`, { isFile: true, size: bytes.length });
  input.fs.readBytes = () => [...bytes];
  const job = { release: { id: release.id }, state: 'interrupted',
    downloadDestination: destination, artifact: { destination }, written: 0, total: null };
  assert.equal(refreshPackageJobs(input.fs, [job]), true);
  assert.equal(job.written, rangeBytes);
  assert.equal(job.total, total);
});
