import './petLoader.js';
import './petPlayLoader.js';
import './stitchLoader.js';

const VARIANTS = [
  { tag: 'pet-play-loader', attrs: { pet: 'dog' } },
  { tag: 'pet-play-loader', attrs: { pet: 'cat' } },
  { tag: 'pet-loader', attrs: {} },
  { tag: 'stitch-loader', attrs: { pet: 'samoyed' } },
  { tag: 'stitch-loader', attrs: { pet: 'cat' } },
];

/**
 * Gives every `.craft-loader` element a random pet animation. The element's
 * own text stays as the accessible loading message, so the animation is
 * hidden from assistive technology.
 */
export function mountLoaders(root = document) {
  // Reveals the page that the inline head style keeps hidden until styles are loaded.
  document.documentElement.classList.add('app-ready');

  for (const loader of root.querySelectorAll('.craft-loader')) {
    const { tag, attrs } = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
    const animation = document.createElement(tag);
    animation.setAttribute('hide-label', '');
    animation.setAttribute('aria-hidden', 'true');
    animation.setAttribute('role', 'presentation');
    for (const [name, value] of Object.entries(attrs)) animation.setAttribute(name, value);
    loader.prepend(animation);
  }
}
