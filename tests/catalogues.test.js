import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { searchCatalogue } from '../src/utils/catalogueSearch.js';
import { CATALOGUES, DEFAULT_CATALOGUE_ID, resolveCatalogueId } from '../src/utils/catalogues.js';
import { describeDistance, findClosestColors, hexToLab } from '../src/utils/colorMatch.js';

const dmc = JSON.parse(readFileSync('src/data/catalogues/DMC_color_chart.json', 'utf8')).colors;

test('catalogue registry matches data files and the default exists', () => {
  const files = readdirSync('src/data/catalogues');
  assert.equal(CATALOGUES.length, files.length);
  for (const { file } of CATALOGUES) assert.ok(existsSync(`src/data/catalogues/${file}`), file);
  assert.equal(new Set(CATALOGUES.map((c) => c.id)).size, CATALOGUES.length);
  assert.equal(resolveCatalogueId(DEFAULT_CATALOGUE_ID), DEFAULT_CATALOGUE_ID);
  assert.equal(resolveCatalogueId('nope'), DEFAULT_CATALOGUE_ID);
});

test('migration allowlists contain exactly the registry ids', () => {
  for (const name of [
    '20261016160000_add_profile_color_catalogue.sql',
    '20261016170000_add_supply_color_catalogue.sql',
  ]) {
    const sql = readFileSync(`supabase/migrations/${name}`, 'utf8');
    const ids = [...sql.slice(sql.indexOf('in (')).matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
    assert.deepEqual([...ids].sort(), CATALOGUES.map((c) => c.id).sort(), name);
  }
});

test('searchCatalogue ranks exact code first and ignores blank queries', () => {
  assert.equal(searchCatalogue(dmc, '310')[0].code, '310');
  assert.deepEqual(searchCatalogue(dmc, '   '), []);
  assert.deepEqual(searchCatalogue(dmc, 'zzzzzz'), []);
});

test('findClosestColors prefers exact matches and rejects invalid or distant input', () => {
  const [best] = findClosestColors(dmc, dmc[0].hex);
  assert.equal(best.color.code, dmc[0].code);
  assert.ok(best.distance < 1);
  assert.equal(describeDistance(best.distance), 'Exact');
  assert.deepEqual(findClosestColors(dmc, 'not-a-color'), []);
  assert.deepEqual(findClosestColors(dmc, '#FF00FF'), []);
  assert.equal(hexToLab('#12345'), null);
});

test('findClosestColors orders results by distance and respects the limit', () => {
  const matches = findClosestColors(dmc, '#4A6B52', { limit: 3 });
  assert.equal(matches.length, 3);
  assert.ok(matches[0].distance <= matches[1].distance);
  assert.ok(matches[1].distance <= matches[2].distance);
});
