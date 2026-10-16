const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

/** Largest CIE76 distance still offered as a suggestion (about "clearly similar"). */
export const MAX_SUGGESTION_DISTANCE = 15;

/** Converts #RRGGBB to CIELAB (D65), or null for invalid input. */
export function hexToLab(hex) {
  if (typeof hex !== 'string' || !HEX_PATTERN.test(hex)) return null;

  const [r, g, b] = [1, 3, 5].map((index) => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);

  return { l: 116 * f(y) - 16, a: 500 * (f(x) - f(y)), b: 200 * (f(y) - f(z)) };
}

/** CIE76 color difference: the Euclidean distance between two Lab colors. */
export function colorDistance(first, second) {
  return Math.hypot(first.l - second.l, first.a - second.a, first.b - second.b);
}

/** Plain-language label for a distance, so users are not shown raw numbers only. */
export function describeDistance(distance) {
  if (distance < 1) return 'Exact';
  if (distance < 5) return 'Very close';
  if (distance < 10) return 'Close';
  return 'Similar';
}

const labCache = new WeakMap();

function getLabs(colors) {
  if (!labCache.has(colors)) {
    labCache.set(colors, colors.map((color) => hexToLab(color.hex)));
  }
  return labCache.get(colors);
}

/**
 * Ranks catalogue colors by closeness to a hex value. Returns an empty list
 * for invalid input or when nothing is within `maxDistance`; never guesses.
 */
export function findClosestColors(
  colors,
  hex,
  { limit = 5, maxDistance = MAX_SUGGESTION_DISTANCE } = {},
) {
  const target = hexToLab(hex);
  if (!target) return [];

  const labs = getLabs(colors);
  const matches = [];
  colors.forEach((color, index) => {
    if (!labs[index]) return;
    const distance = colorDistance(target, labs[index]);
    if (distance <= maxDistance) matches.push({ color, distance });
  });

  matches.sort((a, b) => a.distance - b.distance);
  return matches.slice(0, limit);
}
