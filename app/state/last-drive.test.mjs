import assert from 'node:assert/strict';
import {register} from 'node:module';
import test from 'node:test';

register(new URL('./download-queue-test-loader.mjs', import.meta.url), import.meta.url);
const {driveIndex, lastDrive, setLastDrive} = await import('./last-drive.js');

// The Files tab opens on the drive it last showed: with three drives plugged the player had to pick
// the right one again on every visit. A drive that is unplugged (or never chosen) falls back to the
// first one there is, so a gone drive never selects itself.
const ROOTS = ['/data', '/mnt/usb0', '/mnt/ext1'];

test('the drive last looked at is the one the tab opens on', () => {
  setLastDrive('/mnt/ext1');
  assert.equal(lastDrive(), '/mnt/ext1');
  assert.equal(driveIndex(ROOTS, lastDrive()), 2);
});

test('a drive that is gone falls back to the first one', () => {
  setLastDrive('/mnt/usb9');
  assert.equal(driveIndex(ROOTS, lastDrive()), 0);
});

test('no choice at all starts on the first drive', () => {
  setLastDrive(null);
  assert.equal(lastDrive(), null);
  assert.equal(driveIndex(ROOTS, lastDrive()), 0);
});
