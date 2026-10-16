import './petLoader.js';
import './petPlayLoader.js';
import './stitchLoader.js';

// cycleMs is one full loop of the animation (the stitch loader reports its own).
const VARIANTS = [
  { tag: 'pet-play-loader', attrs: { pet: 'dog' }, cycleMs: 3600 },
  { tag: 'pet-play-loader', attrs: { pet: 'cat' }, cycleMs: 2800 },
  { tag: 'pet-loader', attrs: {}, cycleMs: 2400 },
  { tag: 'stitch-loader', attrs: { pet: 'samoyed' } },
  { tag: 'stitch-loader', attrs: { pet: 'cat' } },
];

const mounted = new WeakMap();

/**
 * Gives every `.craft-loader` element a random pet animation. The element's
 * own text stays as the accessible loading message, so the animation is
 * hidden from assistive technology.
 */
export function mountLoaders(root = document) {
  // Reveals the page that the inline head style keeps hidden until styles are loaded.
  document.documentElement.classList.add('app-ready');

  for (const loader of root.querySelectorAll('.craft-loader')) {
    const { tag, attrs, cycleMs } = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
    const animation = document.createElement(tag);
    animation.setAttribute('hide-label', '');
    animation.setAttribute('aria-hidden', 'true');
    animation.setAttribute('role', 'presentation');
    for (const [name, value] of Object.entries(attrs)) animation.setAttribute(name, value);
    loader.prepend(animation);
    mounted.set(loader, { animation, cycleMs, start: performance.now() });
  }
}

/**
 * Hides a loading element, but lets its animation finish the first cycle so
 * fast loads don't cut it off mid-loop. Await it before showing the content.
 */
export async function hideLoader(loader) {
  const info = mounted.get(loader);
  if (info && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const cycle = info.cycleMs ?? info.animation.cycleMs;
    const remaining = cycle - (performance.now() - info.start);
    if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
  }
  loader.hidden = true;
}
