const MAX_RESULTS = 100;

/**
 * Text input with a filterable dropdown whose rows show a swatch of each
 * color's hex. Typing filters by code or name; picking (click, Enter) calls
 * onSelect. A native <datalist> can't render swatches, hence this component.
 */
export function createColorCombobox(input, list, onSelect) {
  let colors = [];
  let visible = [];
  let active = -1;

  input.addEventListener('focus', render);
  input.addEventListener('input', render);
  input.addEventListener('blur', close);
  input.addEventListener('keydown', handleKey);
  // mousedown (not click) fires before the input's blur closes the list.
  list.addEventListener('mousedown', (event) => {
    const row = event.target.closest('[data-index]');
    if (!row) return;
    event.preventDefault();
    choose(visible[Number(row.dataset.index)]);
  });

  function setColors(next) {
    colors = next;
    close();
  }

  function render() {
    const query = input.value.trim().toLowerCase();
    const matches = colors.filter(
      (color) => !query || color.code.toLowerCase().includes(query) || color.name.toLowerCase().includes(query),
    );
    visible = matches.slice(0, MAX_RESULTS);
    active = -1;
    list.replaceChildren(...visible.map(createRow));
    if (matches.length > visible.length) {
      const more = document.createElement('li');
      more.className = 'list-group-item small text-muted';
      more.textContent = `${matches.length - visible.length} more, keep typing to narrow down…`;
      list.append(more);
    }
    if (visible.length === 0 && colors.length > 0) {
      const empty = document.createElement('li');
      empty.className = 'list-group-item small text-muted';
      empty.textContent = 'No matching colors.';
      list.append(empty);
    }
    list.hidden = list.childElementCount === 0;
    input.setAttribute('aria-expanded', String(!list.hidden));
  }

  function createRow(color, index) {
    const row = document.createElement('li');
    row.className = 'color-option list-group-item list-group-item-action d-flex align-items-center gap-2';
    row.dataset.index = String(index);
    row.setAttribute('role', 'option');

    const swatch = document.createElement('span');
    swatch.className = 'color-swatch flex-shrink-0';
    swatch.style.backgroundColor = color.hex;
    swatch.setAttribute('aria-hidden', 'true');

    const code = document.createElement('strong');
    code.textContent = color.code;
    const name = document.createElement('span');
    name.className = 'text-muted text-truncate';
    name.textContent = color.name;

    row.append(swatch, code, name);
    return row;
  }

  function handleKey(event) {
    if (event.key === 'Escape') return close();
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (list.hidden) render();
      if (visible.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((active + step + visible.length) % visible.length);
    } else if (event.key === 'Enter') {
      // Always keep Enter from submitting the form while the lookup is in use.
      event.preventDefault();
      const exact = findExact(input.value);
      const color = visible[active] ?? exact ?? (visible.length === 1 ? visible[0] : null);
      if (color) choose(color);
    }
  }

  function setActive(index) {
    list.querySelector('.active')?.classList.remove('active');
    active = index;
    const row = list.querySelector(`[data-index="${index}"]`);
    row?.classList.add('active');
    row?.scrollIntoView({ block: 'nearest' });
  }

  function findExact(text) {
    const query = text.trim().toLowerCase();
    if (!query) return null;
    return colors.find((c) => c.code.toLowerCase() === query)
      ?? colors.find((c) => c.name.toLowerCase() === query);
  }

  function choose(color) {
    input.value = `${color.code} — ${color.name}`;
    close();
    onSelect(color);
  }

  function close() {
    list.hidden = true;
    active = -1;
    input.setAttribute('aria-expanded', 'false');
  }

  return { setColors };
}
