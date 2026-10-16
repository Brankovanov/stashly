import { loadCatalogue } from '../services/catalogueService.js';
import { CATALOGUES, resolveCatalogueId } from '../utils/catalogues.js';
import { describeDistance, findClosestColors } from '../utils/colorMatch.js';

/**
 * Wires the "find a color in a catalogue" block of the supply form. Choosing a
 * color fills brand, code, swatch and (if empty) name; every field stays
 * editable, and editing a color field by hand clears the stored catalogue.
 */
export function setupCatalogueLookup(form, initialCatalogueId) {
  const catalogueSelect = form.elements.lookup_catalogue;
  const colorInput = form.elements.lookup_color;
  const colorList = form.querySelector('#lookup-color-list');
  const status = form.querySelector('#lookup-status');
  const suggestions = form.querySelector('#color-suggestions');
  const suggestionsHeading = form.querySelector('#suggestions-heading');
  const suggestionsList = form.querySelector('#suggestions-list');
  let catalogue = null;
  let loadToken = 0;

  for (const item of CATALOGUES) catalogueSelect.append(new Option(item.label, item.id));
  catalogueSelect.value = resolveCatalogueId(initialCatalogueId);

  catalogueSelect.addEventListener('change', () => void switchCatalogue());
  // Commit on 'change' so typing "31" on the way to "310" isn't hijacked.
  colorInput.addEventListener('change', () => {
    const color = findColor(colorInput.value);
    if (color) applyColor(color);
  });
  for (const name of ['color_code', 'color_hex']) {
    form.elements[name].addEventListener('input', () => {
      form.elements.color_catalogue.value = '';
      colorInput.value = '';
      renderSuggestions();
    });
  }

  void switchCatalogue();

  async function switchCatalogue() {
    const token = ++loadToken;
    catalogue = null;
    colorInput.disabled = true;
    colorList.replaceChildren();
    renderSuggestions();
    status.textContent = 'Loading catalogue…';
    try {
      const loaded = await loadCatalogue(catalogueSelect.value);
      if (token !== loadToken) return;
      catalogue = loaded;
      populateColors();
      status.textContent = `${loaded.colors.length} colors available.`;
      renderSuggestions();
    } catch (error) {
      if (token !== loadToken) return;
      colorList.replaceChildren();
      status.textContent = error.message;
    }
  }

  // Accepts the datalist label ("310 — Black"), a bare code, or an exact name.
  function findColor(text) {
    const query = text.trim().toLowerCase();
    if (!catalogue || !query) return null;
    return catalogue.colors.find((c) => `${c.code} — ${c.name}`.toLowerCase() === query)
      ?? catalogue.colors.find((c) => c.code.toLowerCase() === query)
      ?? catalogue.colors.find((c) => c.name.toLowerCase() === query);
  }

  function populateColors() {
    colorList.replaceChildren();
    for (const color of catalogue.colors) {
      colorList.append(new Option(`${color.code} — ${color.name}`));
    }
    colorInput.disabled = false;

    // Re-select the saved color when editing a supply picked from this catalogue.
    if (form.elements.color_catalogue.value === catalogue.id) {
      const saved = form.elements.color_code.value;
      if (catalogue.colors.some((color) => color.code === saved)) colorInput.value = `${saved} — ${catalogue.colors.find((color) => color.code === saved).name}`;
    }
  }

  function renderSuggestions() {
    suggestions.hidden = true;
    suggestionsList.replaceChildren();
    if (!catalogue || form.elements.color_catalogue.value) return;

    const matches = findClosestColors(catalogue.colors, form.elements.color_hex.value.trim());
    if (matches.length === 0) return;

    suggestionsHeading.textContent = `Closest ${catalogue.label} colors (approximate, nothing is changed until you choose one):`;
    for (const { color, distance } of matches) {
      const button = createSuggestionButton(color);
      const hint = document.createElement('span');
      hint.className = 'ms-auto small text-muted';
      hint.textContent = describeDistance(distance);
      button.append(hint);
      suggestionsList.append(button);
    }
    suggestions.hidden = false;
  }

  function createSuggestionButton(color) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'list-group-item list-group-item-action d-flex align-items-center gap-2';

    const swatch = document.createElement('span');
    swatch.className = 'color-swatch flex-shrink-0';
    swatch.style.backgroundColor = color.hex;
    swatch.setAttribute('aria-hidden', 'true');

    const code = document.createElement('strong');
    code.textContent = color.code;
    const name = document.createElement('span');
    name.className = 'text-muted';
    name.textContent = color.name;

    button.append(swatch, code, name);
    button.addEventListener('click', () => applyColor(color));
    return button;
  }

  function applyColor(color) {
    form.elements.brand.value = catalogue.brand;
    form.elements.color_code.value = color.code;
    form.elements.color_hex.value = color.hex.toUpperCase();
    form.elements.color_catalogue.value = catalogue.id;
    if (!form.elements.name.value.trim()) {
      form.elements.name.value = `${catalogue.brand} ${color.code} ${color.name}`;
    }
    colorInput.value = `${color.code} — ${color.name}`;
    status.textContent = `Applied ${catalogue.brand} ${color.code} ${color.name}. You can adjust any field.`;
    form.elements.color_hex.classList.remove('is-invalid');
    renderSuggestions();
  }
}
