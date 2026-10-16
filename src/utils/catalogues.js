/** Supported color catalogues. `file` is the JSON name under src/data/catalogues/. */
export const CATALOGUES = [
  { id: 'anchor', label: 'Anchor', file: 'Anchor_color_chart.json' },
  { id: 'appleton', label: 'Appleton (wool)', file: 'Appleton_wool_color_chart.json' },
  { id: 'artkal', label: 'Artkal S beads', file: 'Artkal_S_bead_color_chart.json' },
  { id: 'bernat', label: 'Bernat Super Value', file: 'Bernat_Super_Value_color_chart.json' },
  { id: 'caron', label: 'Caron One Pound', file: 'Caron_One_Pound_color_chart.json' },
  { id: 'classic-colorworks', label: 'Classic Colorworks', file: 'Classic_Colorworks_color_chart.json' },
  { id: 'cosmo', label: 'Cosmo', file: 'Cosmo_color_chart.json' },
  { id: 'cxc', label: 'CXC', file: 'CXC_color_chart.json' },
  { id: 'diamond-dotz', label: 'Diamond Dotz', file: 'Diamond_Dotz_color_chart.json' },
  { id: 'diamond-painting', label: 'Diamond painting', file: 'Diamond_painting_color_chart.json' },
  { id: 'dmc', label: 'DMC', file: 'DMC_color_chart.json' },
  { id: 'hama', label: 'Hama beads', file: 'Hama_bead_color_chart.json' },
  { id: 'jp-coats', label: 'J&P Coats', file: 'J_P_Coats_color_chart.json' },
  { id: 'kreinik', label: 'Kreinik metallic', file: 'Kreinik_metallic_thread_color_chart.json' },
  { id: 'madeira', label: 'Madeira', file: 'Madeira_color_chart.json' },
  { id: 'needlepoint-silks', label: 'Needlepoint silks', file: 'Needlepoint_silk_color_charts.json' },
  { id: 'perler', label: 'Perler beads', file: 'Perler_bead_color_chart.json' },
  { id: 'presencia', label: 'Presencia Finca', file: 'Presencia_Finca_color_chart.json' },
  { id: 'red-heart', label: 'Red Heart Super Saver', file: 'Red_Heart_Super_Saver.json' },
  { id: 'sullivans', label: "Sullivans", file: 'Sullivans_color_chart.json' },
  { id: 'gentle-art', label: 'The Gentle Art', file: 'The_Gentle_Art_color_chart.json' },
  { id: 'unitas', label: 'Unitas', file: 'Unitas_Ljubica_color_chart.json' },
  { id: 'weeks-dye-works', label: 'Weeks Dye Works', file: 'Weeks_Dye_Works_color_chart.json' },
];

export const DEFAULT_CATALOGUE_ID = 'dmc';

export function isSupportedCatalogue(id) {
  return CATALOGUES.some((catalogue) => catalogue.id === id);
}

export function getCatalogueInfo(id) {
  return CATALOGUES.find((catalogue) => catalogue.id === id) ?? null;
}

/** Returns a supported catalogue id, falling back to the default. */
export function resolveCatalogueId(id) {
  return isSupportedCatalogue(id) ? id : DEFAULT_CATALOGUE_ID;
}
