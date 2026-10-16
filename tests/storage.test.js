import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  validateProfileAvatar,
  validateProjectFile,
  validateSupplyPhoto,
} from '../src/services/storageService.js';

const MB = 1024 * 1024;
const file = (type, size) => ({ type, size });

test('supply photo: accepts jpg/png/webp up to 5 MB and no file', () => {
  assert.doesNotThrow(() => validateSupplyPhoto(undefined));
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    assert.doesNotThrow(() => validateSupplyPhoto(file(type, 5 * MB)));
  }
});

test('supply photo: rejects other types, empty and oversized files', () => {
  assert.throws(() => validateSupplyPhoto(file('image/gif', 100)), /JPG, PNG, or WebP/);
  assert.throws(() => validateSupplyPhoto(file('application/pdf', 100)), /JPG, PNG, or WebP/);
  assert.throws(() => validateSupplyPhoto(file('image/png', 0)), /larger than 0/);
  assert.throws(() => validateSupplyPhoto(file('image/png', 5 * MB + 1)), /5 MB/);
});

test('avatar: requires a file and applies the same limits', () => {
  assert.throws(() => validateProfileAvatar(undefined), /Choose a profile photo/);
  assert.doesNotThrow(() => validateProfileAvatar(file('image/webp', MB)));
  assert.throws(() => validateProfileAvatar(file('image/svg+xml', 100)), /JPG, PNG, or WebP/);
  assert.throws(() => validateProfileAvatar(file('image/png', 5 * MB + 1)), /5 MB/);
});

test('project cover: images only, 5 MB', () => {
  assert.doesNotThrow(() => validateProjectFile(file('image/jpeg', MB), 'cover'));
  assert.throws(() => validateProjectFile(file('application/pdf', MB), 'cover'), /cover/);
  assert.throws(() => validateProjectFile(file('image/png', 5 * MB + 1), 'cover'), /5 MB/);
});

test('project pattern: images or PDF, 10 MB', () => {
  assert.doesNotThrow(() => validateProjectFile(file('application/pdf', 10 * MB), 'pattern'));
  assert.doesNotThrow(() => validateProjectFile(file('image/png', 6 * MB), 'pattern'));
  assert.throws(() => validateProjectFile(file('application/pdf', 10 * MB + 1), 'pattern'), /10 MB/);
  assert.throws(() => validateProjectFile(file('text/html', 100), 'pattern'), /pattern/);
  assert.throws(() => validateProjectFile(file('application/pdf', 0), 'pattern'), /larger than 0/);
});
