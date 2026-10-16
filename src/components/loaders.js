import './petLoader.js';

const VARIANTS = ['yarn', 'pets-samoyed', 'pets-brown'];

/**
 * Gives every `.craft-loader` element a random animation: the CSS yarn ball
 * or the cat-and-dog pet loader (one of two dogs). The element's own text
 * stays as the accessible loading message; the pet animation is decorative.
 */
export function mountLoaders(root = document) {
  for (const loader of root.querySelectorAll('.craft-loader')) {
    const variant = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
    if (variant === 'yarn') continue;

    const pets = document.createElement('pet-loader');
    pets.setAttribute('hide-label', '');
    pets.setAttribute('size', '160');
    pets.setAttribute('aria-hidden', 'true');
    pets.setAttribute('role', 'presentation');
    if (variant === 'pets-brown') pets.setAttribute('dog', 'brown');

    loader.classList.add('craft-loader--pets');
    loader.prepend(pets);
  }
}
