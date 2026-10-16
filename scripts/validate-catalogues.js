import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const catalogueDirectory = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'data',
  'catalogues',
);
const files = (await readdir(catalogueDirectory))
  .filter((file) => file.endsWith('.json'))
  .sort();

if (files.length === 0) {
  throw new Error(`No catalogue JSON files found in ${catalogueDirectory}.`);
}

let totalColors = 0;
let hasErrors = false;

for (const file of files) {
  const filePath = join(catalogueDirectory, file);
  const errors = [];
  let catalogue;

  try {
    catalogue = JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    console.error(`${file}: invalid JSON (${error.message})`);
    hasErrors = true;
    continue;
  }

  if (!catalogue || typeof catalogue !== 'object' || Array.isArray(catalogue)) {
    console.error(`${file}: expected a JSON object.`);
    hasErrors = true;
    continue;
  }

  for (const field of ['brand', 'source_file', 'code_field']) {
    if (typeof catalogue[field] !== 'string' || !catalogue[field].trim()) {
      errors.push(`"${field}" must be a non-empty string`);
    }
  }

  if (!Array.isArray(catalogue.colors)) {
    errors.push('"colors" must be an array');
  }
  if (!Number.isSafeInteger(catalogue.count) || catalogue.count < 0) {
    errors.push('"count" must be a non-negative integer');
  } else if (Array.isArray(catalogue.colors) && catalogue.count !== catalogue.colors.length) {
    errors.push(`"count" is ${catalogue.count}, but "colors" has ${catalogue.colors.length} entries`);
  }

  const seenCodes = new Set();
  for (const [index, color] of (Array.isArray(catalogue.colors) ? catalogue.colors : []).entries()) {
    const label = `colors[${index}]`;
    if (!color || typeof color !== 'object' || Array.isArray(color)) {
      errors.push(`${label} must be an object`);
      continue;
    }

    if (typeof color.code !== 'string' || !color.code.trim()) {
      errors.push(`${label}.code must be a non-empty string`);
    } else {
      const normalizedCode = color.code.trim().toLocaleLowerCase('en-US');
      if (seenCodes.has(normalizedCode)) {
        errors.push(`${label}.code duplicates "${color.code}" (codes must be unique ignoring case)`);
      }
      seenCodes.add(normalizedCode);
    }

    if (typeof color.name !== 'string' || !color.name.trim()) {
      errors.push(`${label}.name must be a non-empty string`);
    }

    if (typeof color.hex !== 'string' || !/^#[\da-f]{6}$/i.test(color.hex)) {
      errors.push(`${label}.hex must be a six-digit hex color`);
      continue;
    }

    if (!color.rgb || typeof color.rgb !== 'object' || Array.isArray(color.rgb)) {
      errors.push(`${label}.rgb must contain red, green, and blue channels`);
      continue;
    }

    const channels = ['r', 'g', 'b'];
    const expectedRgb = channels.map((channel, channelIndex) =>
      Number.parseInt(color.hex.slice(1 + channelIndex * 2, 3 + channelIndex * 2), 16),
    );
    const actualRgb = channels.map((channel) => color.rgb[channel]);
    if (
      actualRgb.some(
        (value) => !Number.isInteger(value) || value < 0 || value > 255,
      )
    ) {
      errors.push(`${label}.rgb channels must be integers between 0 and 255`);
    } else if (actualRgb.some((value, channelIndex) => value !== expectedRgb[channelIndex])) {
      errors.push(`${label}.rgb values do not match "${color.hex}"`);
    }
  }

  if (Array.isArray(catalogue.colors)) totalColors += catalogue.colors.length;
  if (errors.length) {
    hasErrors = true;
    console.error(`${file}: ${errors.join('; ')}`);
  } else {
    console.log(`${file}: ${catalogue.colors.length} colors valid`);
  }
}

if (hasErrors) {
  process.exitCode = 1;
} else {
  console.log(`Validated ${files.length} catalogues (${totalColors} colors).`);
}
