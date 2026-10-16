import { getCatalogueInfo } from '../utils/catalogues.js';

// Lazy glob: each chart becomes its own chunk, loaded only when selected.
const loaders = import.meta.glob('../data/catalogues/*.json', { import: 'default' });
const cache = new Map();

/**
 * Loads one catalogue's colors.
 * @param {string} id A supported catalogue id.
 * @returns {Promise<{id: string, label: string, brand: string, colors: object[]}>}
 */
export async function loadCatalogue(id) {
  const info = getCatalogueInfo(id);
  if (!info) throw new Error('That color catalogue is not supported.');

  if (!cache.has(id)) {
    const load = loaders[`../data/catalogues/${info.file}`];
    if (!load) throw new Error(`The ${info.label} catalogue could not be found.`);
    cache.set(
      id,
      load()
        .then((data) => ({ id, label: info.label, brand: data.brand, colors: data.colors }))
        .catch((error) => {
          cache.delete(id);
          throw new Error(`Unable to load the ${info.label} catalogue: ${error.message}`);
        }),
    );
  }
  return cache.get(id);
}
