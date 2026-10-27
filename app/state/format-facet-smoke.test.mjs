import { register } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

register(new URL('./download-queue-test-loader.mjs', import.meta.url), import.meta.url);

const { FACETS, NO_FILTERS, activeCount, facetLabel, facetSummary, facetTitle, filterGames } = await import('./catalog.js');
const { GROUPS, UNKNOWN, formatsOf, groupOf } = await import('./formats.js');
const { configure, t } = await import('../i18n/core.js');
const fs = await import('node:fs');

// The app wires i18n in app/i18n/index.js: the packaged English catalog as the source, every other
// language read from disk. Node can't import the JSON statically (the bundler adds the attribute),
// so the same wiring is done here by hand.
const localesDir = new URL('../i18n/locales/', import.meta.url);
const english = JSON.parse(fs.readFileSync(new URL('en.json', localesDir), 'utf8'));
configure((code) => JSON.parse(fs.readFileSync(new URL(`${code}.json`, localesDir), 'utf8')), english);

test('la facet format existe, es OR y va tras provider', () => {
  const keys = FACETS.map((facet) => facet.key);
  console.log('  FACETS:', keys.join(', '));
  assert.equal(keys.includes('format'), true);
  assert.equal(keys.indexOf('format') > keys.indexOf('provider'), true);
  assert.equal(keys.indexOf('format'), keys.length - 1);
  assert.equal(FACETS.find((facet) => facet.key === 'format').any, true);
});

test('sus opciones y etiquetas resuelven en los 19 idiomas', () => {
  const facet = FACETS.find((item) => item.key === 'format');
  const values = facet.options.map((option) => option.value);
  assert.deepEqual(values, ['pkg', 'exfat', 'ffpfs', 'archive', 'unknown']);

  // In English (the packaged source): the title and every option are real words, never the raw key.
  assert.equal(facetTitle('format'), 'File format');
  assert.equal(t('filters.facet.format'), 'File format');
  for (const value of values) {
    const label = facetLabel('format', value);
    assert.notEqual(label, `filters.format.${value}`, `${value} no resuelve`);
    console.log(`  ${value.padEnd(8)} -> ${label}`);
  }

  // Every locale file carries the six keys, so no language falls back mid-sentence.
  const dir = new URL('../i18n/locales/', import.meta.url);
  const locales = fs.readdirSync(dir).filter((file) => file.endsWith('.json'));
  const keys = ['filters.facet.format', ...values.map((value) => `filters.format.${value}`)];
  for (const file of locales) {
    const catalog = JSON.parse(fs.readFileSync(new URL(file, dir), 'utf8'));
    for (const key of keys) assert.equal(typeof catalog[key], 'string', `${file} falta ${key}`);
  }
  console.log(`  ${locales.length} idiomas completos`);
});

test('NO_FILTERS lo deja vacío y activeCount lo cuenta', () => {
  assert.deepEqual(NO_FILTERS.format, []);
  assert.equal(activeCount(NO_FILTERS), 0);
  assert.equal(activeCount({ ...NO_FILTERS, format: ['pkg'] }), 1);
});

test('el filtro reparte el catálogo: cada juego cae en algún grupo', () => {
  const summary = facetSummary({ filters: NO_FILTERS, query: '', wishlist: [] });
  const counts = summary.counts.format;
  console.log('  total:', summary.total, '| counts:', JSON.stringify(counts));
  for (const [value, count] of Object.entries(counts)) {
    const filtered = filterGames({ filters: { ...NO_FILTERS, format: [value] }, query: '', wishlist: [] });
    assert.equal(filtered.length, count, `conteo de ${value}`);
  }
  // A game offering two formats matches both options (that's what "any" means), so the counts
  // overlap; every game must still land in at least one group.
  const union = new Set();
  for (const value of Object.keys(counts)) {
    for (const game of filterGames({ filters: { ...NO_FILTERS, format: [value] }, query: '', wishlist: [] })) union.add(game.id);
  }
  assert.equal(union.size, summary.total, 'los grupos cubren todo el catálogo');
  const sum = Object.values(counts).reduce((total, count) => total + count, 0);
  console.log(`  suma con solape: ${sum} | union: ${union.size} | total: ${summary.total}`);
});

test('formatsOf agrupa como GROUPS, y sin formato conocido devuelve unknown', () => {
  assert.deepEqual(formatsOf([{ format: 'pkg' }]), ['pkg']);
  assert.deepEqual(formatsOf([{ format: 'ffpkg' }]), ['pkg'], 'ffpkg instala como pkg');
  assert.deepEqual(formatsOf([{ format: 'zip' }]), ['archive']);
  assert.deepEqual(formatsOf([{ format: 'exfat' }, { format: 'ffpfs' }]), ['exfat', 'ffpfs'], 'en el orden de GROUPS');
  assert.deepEqual(formatsOf([]), [UNKNOWN]);
  assert.deepEqual(formatsOf([{ format: 'binary' }]), [UNKNOWN]);
  assert.equal(groupOf('RAR'), 'archive', 'groupOf no distingue mayúsculas');
  assert.equal(groupOf('desconocido'), '');
  assert.deepEqual(GROUPS.map((group) => group.value), ['pkg', 'exfat', 'ffpfs', 'archive']);
});

test('el índice no nombra a ningún juego que falte en el catálogo', () => {
  const source = fs.readFileSync(new URL('../data/catalog.js', import.meta.url), 'utf8');
  const catalogIds = new Set([...source.matchAll(/"id": "([A-Z]{4}\d{5})"/g)].map((match) => match[1]));
  const index = fs.readFileSync(new URL('../data/formats.js', import.meta.url), 'utf8');
  const ids = Object.keys(JSON.parse(index.match(/var formats = (\{.*?\});/s)[1]));
  const orphans = ids.filter((id) => !catalogIds.has(id));
  console.log(`  índice: ${ids.length} | catálogo: ${catalogIds.size} | huérfanos: ${orphans.length}`);
  assert.deepEqual(orphans, []);
});
