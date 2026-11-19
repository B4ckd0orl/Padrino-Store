// The app's own check for a generated catalog update: state/catalog-update.js's valid(), the
// exact function a console runs before it keeps a published file. The publisher calls this
// before anything goes to the catalog branch, because one entry the check refuses would make
// every console refuse the whole file.
//
//   validate-update.mjs <update.json>            exit 0 when valid, 1 when not
//   validate-update.mjs <update.json> --pinpoint  print the entries that fail on their own:
//                                                {"games":[indices],"removed":[ids],
//                                                 "releases":[ids],"pages":[ids]}
// The checks are per entry (no constraint spans two of them), so testing one at a time finds
// exactly the ones to drop while the rest of the update still ships.

import { readFileSync } from 'node:fs';
import { register } from 'node:module';

register(new URL('../app/state/download-queue-test-loader.mjs', import.meta.url), import.meta.url);
const { valid } = await import('../app/state/catalog-update.js');

const [file, mode] = process.argv.slice(2);
if (!file) {
  console.error('usage: validate-update.mjs <update.json> [--pinpoint]');
  process.exit(2);
}
const update = JSON.parse(readFileSync(file, 'utf8'));

if (mode !== '--pinpoint') {
  if (!valid(update)) {
    console.error('the update failed the checks of state/catalog-update.js');
    process.exit(1);
  }
  console.log(`valid: ${update.games.length} entries, ${update.removed.length} removed, ` +
    `${Object.keys(update.releases).length} releases, ${Object.keys(update.pages).length} pages`);
  process.exit(0);
}

const alone = (patch) => valid({ ...update, games: [], removed: [], releases: {}, pages: {}, ...patch });
const bad = { games: [], removed: [], releases: [], pages: [] };
update.games.forEach((entry, index) => {
  if (!alone({ games: [entry] })) bad.games.push(index);
});
update.removed.forEach((id) => {
  if (!alone({ removed: [id] })) bad.removed.push(id);
});
for (const [id, value] of Object.entries(update.releases)) {
  if (!alone({ releases: { [id]: value } })) bad.releases.push(id);
}
for (const [id, value] of Object.entries(update.pages)) {
  if (!alone({ pages: { [id]: value } })) bad.pages.push(id);
}
console.log(JSON.stringify(bad));
