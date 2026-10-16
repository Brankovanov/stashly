/**
 * Finds catalogue colors whose code or name matches the query, best matches
 * first: exact code, code prefix, name prefix, then any substring.
 */
export function searchCatalogue(colors, query, limit = 8) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const ranked = [];
  for (const color of colors) {
    const code = color.code.toLowerCase();
    const name = color.name.toLowerCase();
    let rank = null;
    if (code === needle) rank = 0;
    else if (code.startsWith(needle)) rank = 1;
    else if (name.startsWith(needle)) rank = 2;
    else if (code.includes(needle) || name.includes(needle)) rank = 3;
    if (rank !== null) ranked.push({ color, rank });
  }

  ranked.sort((a, b) => a.rank - b.rank);
  return ranked.slice(0, limit).map((entry) => entry.color);
}
