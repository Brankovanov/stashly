import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateProjectItemStatus, validateProjectItemInput } from '../src/utils/projectItemValidation.js';
import { validateProjectInput } from '../src/utils/projectValidation.js';
import { validateSupplyInput } from '../src/utils/supplyValidation.js';

const supply = (overrides = {}) => ({
  name: 'Blue floss',
  category_id: 'cat-1',
  brand: '',
  color_code: '',
  color_hex: '',
  color_catalogue: '',
  quantity: '2',
  unit: '',
  notes: '',
  ...overrides,
});

test('supply: a valid supply has no errors and empty optionals become null', () => {
  const { errors, value } = validateSupplyInput(supply());
  assert.deepEqual(errors, {});
  assert.equal(value.brand, null);
  assert.equal(value.color_hex, null);
  assert.equal(value.color_catalogue, null);
  assert.equal(value.quantity, 2);
});

test('supply: required fields and quantity rules', () => {
  const { errors } = validateSupplyInput(supply({ name: '  ', category_id: '', quantity: '-1' }));
  assert.ok(errors.name && errors.category_id && errors.quantity);
  assert.equal(validateSupplyInput(supply({ quantity: '' })).errors.quantity !== undefined, true);
  assert.equal(validateSupplyInput(supply({ quantity: 'abc' })).errors.quantity !== undefined, true);
  assert.deepEqual(validateSupplyInput(supply({ quantity: '0' })).errors, {});
  assert.deepEqual(validateSupplyInput(supply({ quantity: '1.5' })).errors, {});
});

test('supply: hex must be six digits with a leading #', () => {
  for (const hex of ['#4A6B52', '#4a6b52']) {
    assert.deepEqual(validateSupplyInput(supply({ color_hex: hex })).errors, {});
  }
  for (const hex of ['4A6B52', '#FFF', '#GGGGGG', '#4A6B522']) {
    assert.ok(validateSupplyInput(supply({ color_hex: hex })).errors.color_hex, hex);
  }
});

test('supply: only supported catalogue ids are kept', () => {
  assert.equal(validateSupplyInput(supply({ color_catalogue: 'dmc' })).value.color_catalogue, 'dmc');
  assert.equal(validateSupplyInput(supply({ color_catalogue: 'nope' })).value.color_catalogue, null);
});

test('project: title and status are validated', () => {
  assert.deepEqual(validateProjectInput({ title: 'Quilt', description: '', status: 'planned' }).errors, {});
  const { errors } = validateProjectInput({ title: ' ', description: '', status: 'done' });
  assert.ok(errors.title && errors.status);
  assert.equal(validateProjectInput({ title: 'A', description: ' ', status: 'completed' }).value.description, null);
});

const item = (overrides = {}) => ({
  name: 'Floss',
  category_id: 'cat-1',
  supply_id: '',
  brand: '',
  color_code: '',
  quantity_needed: '3',
  unit: 'skeins',
  ...overrides,
});

test('project item: quantity must be greater than zero', () => {
  assert.deepEqual(validateProjectItemInput(item()).errors, {});
  assert.ok(validateProjectItemInput(item({ quantity_needed: '0' })).errors.quantity_needed);
  assert.ok(validateProjectItemInput(item({ quantity_needed: '' })).errors.quantity_needed);
});

test('project item: a category is only required when no supply is linked', () => {
  assert.ok(validateProjectItemInput(item({ category_id: '' })).errors.category_id);
  assert.deepEqual(validateProjectItemInput(item({ category_id: '', supply_id: 's1' })).errors, {});
});

test('ownership: unlinked items are missing', () => {
  const result = calculateProjectItemStatus({ quantity_needed: 3, unit: 'skeins', supplies: null });
  assert.equal(result.ownership_status, 'missing');
  assert.equal(result.quantity_missing, 3);
});

test('ownership: enough stock is owned, less is partial with the shortfall', () => {
  const owned = calculateProjectItemStatus({ quantity_needed: 3, unit: 'skeins', supplies: { quantity: 5, unit: 'skeins' } });
  assert.equal(owned.ownership_status, 'owned');
  assert.equal(owned.quantity_missing, 0);

  const exact = calculateProjectItemStatus({ quantity_needed: 3, unit: 'skeins', supplies: { quantity: 3, unit: 'skeins' } });
  assert.equal(exact.ownership_status, 'owned');

  const partial = calculateProjectItemStatus({ quantity_needed: 3, unit: 'skeins', supplies: { quantity: 1, unit: 'skeins' } });
  assert.equal(partial.ownership_status, 'partial');
  assert.equal(partial.quantity_owned, 1);
  assert.equal(partial.quantity_missing, 2);
});

test('ownership: units are compared case-insensitively and a mismatch counts as missing', () => {
  const same = calculateProjectItemStatus({ quantity_needed: 2, unit: 'Skeins ', supplies: { quantity: 2, unit: 'skeins' } });
  assert.equal(same.ownership_status, 'owned');

  const mismatch = calculateProjectItemStatus({ quantity_needed: 2, unit: 'meters', supplies: { quantity: 9, unit: 'skeins' } });
  assert.equal(mismatch.ownership_status, 'missing');
  assert.equal(mismatch.unit_mismatch, true);
});
