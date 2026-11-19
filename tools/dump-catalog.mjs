// A catalog module (app/data/catalog.js) as JSON on stdout: {games, twins}. The publisher
// (catalog-update.py) reads the baseline release's copy and the working tree's copy the same
// way the app does, by importing the module itself, so no reimplementation of its shape can
// drift from the real data. The file is copied to a .mjs first: the catalog is data, but its
// extension decides how Node parses it.

import { copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = process.argv[2];
if (!source) {
  console.error('usage: dump-catalog.mjs <path to catalog.js>');
  process.exit(2);
}
const target = join(mkdtempSync(join(tmpdir(), 'catalog-dump-')), 'catalog.mjs');
copyFileSync(source, target);
const { games, twins } = await import(pathToFileURL(target).href);
if (!Array.isArray(games) || !Array.isArray(twins)) {
  console.error('the catalog exports no games/twins arrays');
  process.exit(1);
}
process.stdout.write(JSON.stringify({ games, twins }));
