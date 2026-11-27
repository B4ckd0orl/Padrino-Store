import assert from 'node:assert/strict';
import test from 'node:test';
import { checkpointProgress } from './checkpoint-progress.js';

function sidecar(total, rangeBytes, completed) {
  const count = Math.ceil(total / rangeBytes);
  const bytes = new Uint8Array(96 + count);
  bytes.set(new TextEncoder().encode('P5RDL001'));
  const view = new DataView(bytes.buffer);
  view.setBigUint64(8, BigInt(total), true);
  view.setBigUint64(16, BigInt(rangeBytes), true);
  view.setUint32(24, count, true);
  for (const index of completed) bytes[96 + index] = 1;
  return bytes;
}

test('counts only durable ranges, including a shorter final range', () => {
  const bytes = sidecar(10, 4, [0, 2]);
  const fs = {
    stat: path => path.endsWith('.part') ? { isFile: true, size: 10 } : { isFile: true, size: bytes.length },
    readBytes: () => [...bytes]
  };
  assert.deepEqual(checkpointProgress(fs, '/data/downloads/packages/game.pkg'),
    { written: 6, total: 10, rangeBytes: 4 });
});

test('does not report progress from a malformed or truncated checkpoint', () => {
  const bytes = sidecar(10, 4, [0, 2]);
  const fs = {
    stat: path => path.endsWith('.part') ? { isFile: true, size: 8 } : { isFile: true, size: bytes.length },
    readBytes: () => [...bytes]
  };
  assert.equal(checkpointProgress(fs, '/data/downloads/packages/game.pkg'), null);
  fs.stat = path => ({ isFile: true, size: path.endsWith('.part') ? 10 : bytes.length });
  bytes[96] = 2;
  assert.equal(checkpointProgress(fs, '/data/downloads/packages/game.pkg'), null);
});
