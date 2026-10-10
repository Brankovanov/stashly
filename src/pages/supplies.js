import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import '../styles/main.css';
import { createNavbar } from '../components/navbar.js';
import { deleteSupply, getSupplyBrowseData } from '../services/suppliesService.js';
import { requireAuth } from '../utils/guards.js';

document.querySelector('#site-header').append(createNavbar());

const searchInput = document.querySelector('#supply-search');
const categoryFilter = document.querySelector('#category-filter');
const sortSelect = document.querySelector('#sort-supplies');
const supplyList = document.querySelector('#supply-list');
const supplyCount = document.querySelector('#supply-count');
const loadingState = document.querySelector('#loading-state');
const errorState = document.querySelector('#error-state');
const emptyState = document.querySelector('#empty-state');
const noResultsState = document.querySelector('#no-results-state');
let allSupplies = [];

showActionNotice();
supplyList.addEventListener('click', handleSupplyAction);

try {
  const user = await requireAuth();
  if (user) {
    const { supplies, categories } = await getSupplyBrowseData();
    allSupplies = supplies;
    populateCategories(categories);
    loadingState.hidden = true;
    searchInput.addEventListener('input', renderSupplies);
    categoryFilter.addEventListener('change', renderSupplies);
    sortSelect.addEventListener('change', renderSupplies);
    document
      .querySelector('#clear-filters')
      .addEventListener('click', clearFilters);
    renderSupplies();
  }
} catch (error) {
  loadingState.hidden = true;
  errorState.textContent = error.message;
  errorState.hidden = false;
}

function populateCategories(categories) {
  for (const category of categories) {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    categoryFilter.append(option);
  }
}

function renderSupplies() {
  const rows = allSupplies;
  const query = searchInput.value.trim().toLocaleLowerCase();
  const selectedCategory = categoryFilter.value;
  const visibleSupplies = rows
    .filter((supply) => !selectedCategory || supply.category_id === selectedCategory)
    .filter((supply) => {
      const searchable = [
        supply.name,
        supply.brand,
        supply.color_code,
        supply.categories?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase();
      return searchable.includes(query);
    })
    .sort(getSortComparator(sortSelect.value));

  supplyList.replaceChildren(...visibleSupplies.map(createSupplyCard));
  supplyCount.textContent = `${visibleSupplies.length} of ${rows.length} ${
    rows.length === 1 ? 'supply' : 'supplies'
  }`;
  emptyState.hidden = rows.length > 0;
  noResultsState.hidden = rows.length === 0 || visibleSupplies.length > 0;
  supplyList.hidden = visibleSupplies.length === 0;
}

function clearFilters() {
  searchInput.value = '';
  categoryFilter.value = '';
  sortSelect.value = 'name';
  renderSupplies();
}

function getSortComparator(sortBy) {
  if (sortBy === 'recent') {
    return (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at);
  }
  if (sortBy === 'category') {
    return (a, b) =>
      compareText(a.categories?.name, b.categories?.name) ||
      compareText(a.name, b.name);
  }
  return (a, b) => compareText(a.name, b.name);
}

function compareText(a = '', b = '') {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

function createSupplyCard(supply) {
  const column = document.createElement('div');
  column.className = 'col-12 col-sm-6 col-lg-4';

  const card = document.createElement('article');
  card.className = 'card supply-card h-100';
  const body = document.createElement('div');
  body.className = 'card-body';

  const heading = document.createElement('div');
  heading.className = 'd-flex align-items-start justify-content-between gap-3';
  const title = document.createElement('h2');
  title.className = 'h5 card-title mb-1';
  title.textContent = supply.name;
  heading.append(title);

  if (supply.color_hex) {
    const swatch = document.createElement('span');
    swatch.className = 'color-swatch flex-shrink-0';
    swatch.style.backgroundColor = supply.color_hex;
    swatch.setAttribute('role', 'img');
    swatch.setAttribute(
      'aria-label',
      supply.color_code ? `Color ${supply.color_code}` : 'Supply color',
    );
    heading.append(swatch);
  }

  body.append(heading);
  if (supply.photo_url) {
    const photo = document.createElement('img');
    photo.className = 'supply-photo mb-3';
    photo.src = supply.photo_url;
    photo.alt = `${supply.name} photo`;
    photo.loading = 'lazy';
    body.prepend(photo);
  }
  if (supply.brand) body.append(createDetail(supply.brand, 'text-muted'));
  if (supply.color_code) body.append(createDetail(`Color: ${supply.color_code}`));

  const category = document.createElement('span');
  category.className = 'badge rounded-pill text-bg-light border mt-2';
  category.textContent = supply.categories?.name ?? 'Uncategorized';
  body.append(category);

  const quantity = document.createElement('p');
  quantity.className = 'mb-0 mt-3';
  quantity.textContent = `Quantity: ${supply.quantity} ${supply.unit ?? ''}`.trim();
  body.append(quantity);

  if (supply.notes) {
    const notes = document.createElement('p');
    notes.className = 'small text-muted mt-2 mb-0 supply-notes';
    notes.textContent = supply.notes;
    body.append(notes);
  }

  const actions = document.createElement('div');
  actions.className = 'd-flex gap-2 mt-3';
  const editLink = document.createElement('a');
  editLink.className = 'btn btn-sm btn-outline-secondary';
  editLink.href = `/pages/supply-form.html?id=${encodeURIComponent(supply.id)}`;
  editLink.textContent = 'Edit';
  editLink.setAttribute('aria-label', `Edit ${supply.name}`);

  const deleteButton = document.createElement('button');
  deleteButton.className = 'btn btn-sm btn-outline-danger';
  deleteButton.type = 'button';
  deleteButton.dataset.deleteSupply = supply.id;
  deleteButton.textContent = 'Delete';
  deleteButton.setAttribute('aria-label', `Delete ${supply.name}`);
  actions.append(editLink, deleteButton);
  body.append(actions);

  card.append(body);
  column.append(card);
  return column;
}

function createDetail(text, className = '') {
  const detail = document.createElement('p');
  detail.className = `small mb-1 ${className}`.trim();
  detail.textContent = text;
  return detail;
}

function showActionNotice() {
  const params = new URLSearchParams(window.location.search);
  const messages = {
    created: 'Supply added to your inventory.',
    updated: 'Supply changes saved.',
    deleted: 'Supply removed from your inventory.',
  };
  const action = Object.keys(messages).find((key) => params.has(key));
  if (!action && !params.has('photoCleanup')) return;

  const notice = document.createElement('div');
  notice.className = params.has('photoCleanup')
    ? 'alert alert-warning'
    : 'alert alert-success';
  notice.setAttribute('role', 'status');
  notice.textContent = params.has('photoCleanup')
    ? `${messages[action] ?? 'Supply changes saved.'} The previous photo could not be removed; contact an administrator to clean up the orphaned file.`
    : messages[action];
  document.querySelector('main').prepend(notice);
  window.history.replaceState({}, '', window.location.pathname);
}

async function handleSupplyAction(event) {
  const button = event.target.closest('button[data-delete-supply]');
  if (!button || !supplyList.contains(button)) return;

  const supply = allSupplies.find((item) => item.id === button.dataset.deleteSupply);
  if (!supply) return;

  const confirmed = window.confirm(`Delete "${supply.name}" from your inventory?`);
  if (!confirmed) return;

  button.disabled = true;
  button.textContent = 'Deleting…';
  errorState.hidden = true;
  try {
    await deleteSupply(supply.id);
    allSupplies = allSupplies.filter((item) => item.id !== supply.id);
    renderSupplies();
    const notice = new URLSearchParams(window.location.search);
    notice.set('deleted', '1');
    window.history.replaceState({}, '', `${window.location.pathname}?${notice}`);
    showActionNotice();
  } catch (error) {
    errorState.textContent = error.message;
    errorState.hidden = false;
    button.disabled = false;
    button.textContent = 'Delete';
  }
}
