// Export / import de favoritos, recientes y búsquedas a un archivo JSON único.
// Lógica pura: sin React ni contexts. El UI pasa fs/roots y aplica los resultados.

import { isStringList } from './read-json.js';

var BACKUP_KIND = 'padrino-store/backup';
var BACKUP_VERSION = 1;
var BACKUP_PREFIX = 'padrino-backup';
var BACKUP_NAME_RE = /^padrino-backup.*\.json$/i;
var MAX_BYTES = 1024 * 1024;

function pad2(n) {
  return String(n).padStart(2, '0');
}

function stamp(now) {
  const d = now instanceof Date ? now : new Date(now);
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}

function isoNow(now) {
  const d = now instanceof Date ? now : new Date(now);
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
}

function buildBackup(data, now) {
  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    app: 'Padrino Store',
    titleId: 'PPSA99059',
    exportedAt: isoNow(now),
    data: {
      wishlist: (data?.wishlist ?? []).slice(),
      recent: (data?.recent ?? []).slice(),
      searches: (data?.searches ?? []).slice()
    }
  };
}

function uniquePath(fs, dir, base) {
  let path = `${dir}/${base}.json`;
  let n = 2;
  while (fs.exists(path)) {
    path = `${dir}/${base}-${n}.json`;
    n += 1;
  }
  return path;
}

function exportBackup({ fs, roots, data, now = Date.now() }) {
  const root = roots[0];
  if (!root) throw new Error('no writable storage root');
  const dir = `${root}/downloads/files`;
  fs.mkdir(dir, { recursive: true });
  const name = `${BACKUP_PREFIX}-${stamp(now)}.json`;
  const path = uniquePath(fs, dir, name.replace(/\.json$/, ''));
  const text = JSON.stringify(buildBackup(data, now), null, 2);
  fs.writeFile(path, text, { sync: true });
  return { path, name: path.slice(path.lastIndexOf('/') + 1), bytes: text.length };
}

function listBackups({ fs, roots }) {
  const seen = new Set();
  const out = [];
  for (const root of roots) {
    let entries;
    try {
      entries = fs.readDir(`${root}/downloads/files`);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.isDirectory || !BACKUP_NAME_RE.test(entry.name)) continue;
      const path = `${root}/downloads/files/${entry.name}`;
      if (seen.has(path)) continue;
      seen.add(path);
      out.push({ path, name: entry.name, size: entry.size || 0, modified: entry.modified || 0 });
    }
  }
  out.sort((a, b) => b.modified - a.modified || a.name.localeCompare(b.name));
  return out;
}

function parseBackup(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    throw new Error(`not valid JSON (${error.message})`);
  }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('not a backup object');
  if (raw.kind !== BACKUP_KIND) throw new Error('not a Padrino Store backup');
  if (typeof raw.version !== 'number' || raw.version > BACKUP_VERSION) throw new Error(`backup version ${raw.version} is newer than this app`);
  const data = raw.data;
  if (data === null || typeof data !== 'object' || Array.isArray(data)) throw new Error('missing data section');
  const out = { wishlist: null, recent: null, searches: null };
  for (const key of ['wishlist', 'recent', 'searches']) {
    if (data[key] === undefined) continue;
    if (!isStringList(data[key])) throw new Error(`${key} is not a list of strings`);
    out[key] = data[key].slice();
  }
  if (out.wishlist === null && out.recent === null && out.searches === null) throw new Error('backup has no lists');
  return out;
}

function readBackup({ fs, path }) {
  let stat = null;
  try {
    stat = fs.stat(path);
  } catch {
    stat = null;
  }
  if (!stat) throw new Error('file not found');
  if (stat.size > MAX_BYTES) throw new Error('file is too large');
  let text;
  try {
    text = fs.readFile(path);
  } catch (error) {
    throw new Error(`could not read (${error.message})`);
  }
  return parseBackup(text);
}

export { BACKUP_KIND, BACKUP_NAME_RE, BACKUP_PREFIX, BACKUP_VERSION, buildBackup, exportBackup, listBackups, parseBackup, readBackup, stamp };
