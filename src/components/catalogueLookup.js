import { loadCatalogue } from '../services/catalogueService.js';
import { searchCatalogue } from '../utils/catalogueSearch.js';
import { CATALOGUES, resolveCatalogueId } from '../utils/catalogues.js';

/**
 * Wires the "find a color in a catalogue" block of the supply form. Picking a
 * result fills brand, code, swatch and (if empty) name; every field stays
 * editable, and editing a color field by hand clears the stored catalogue.
 */
export function setupCatalogueLookup(form, initialCatalogueId) {
  const select = form.elements.lookup_catalogue;
  const queryInput = form.elements.lookup_query;
  const results = form.querySelector('#lookup-results');
  const status = form.querySelector('#lookup-status');
  let catalogue = null;
  let loadToken = 0;

  for (const item of CATALOGUES) select.append(new Option(item.label, item.id));
  select.value = resolveCatalogueId(initialCatalogueId);

  select.addEventListener('change', () => void switchCatalogue());
  queryInput.addEventListener('input', renderResults);
  for (const name of ['color_code', 'color_hex']) {
    form.elements[name].addEventListener('input', () => {
      form.elements.color_catalogue.value = '';
    });
  }

  void switchCatalogue();

  async function switchCatalogue() {
    const token = ++loadToken;
    catalogue = null;
    results.replaceChildren();
    status.textContent = 'Loading catalogue…';
    try {
      const loaded = await loadCatalogue(select.value);
      if (token !== loadToken) return;
      catalogue = loaded;
      status.textContent = `${loaded.colors.length} colors available.`;
      renderResults();
    } catch (error) {
      if (token === loadToken) status.textContent = error.message;
    }
  }

  function renderResults() {
    results.replaceChildren();
    if (!catalogue) return;

    const query = queryInput.value.trim();
    if (!query) {
      status.textContent = `${catalogue.colors.length} colors available.`;
      return;
    }

    const matches = searchCatalogue(catalogue.colors, query);
    status.textContent = matches.length
      ? `${matches.length} match${matches.length === 1 ? '' : 'es'} — choose one to fill the form.`
      : 'No catalogue match. You can still enter the color manually.';
    for (const color of matches) results.append(createResultButton(color));
  }

  function createResultButton(color) {
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
    results.replaceChildren();
    queryInput.value = '';
    status.textContent = `Applied ${catalogue.brand} ${color.code} ${color.name}. You can adjust any field.`;
    form.elements.color_hex.classList.remove('is-invalid');
  }
}
