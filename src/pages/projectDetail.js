import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import '../styles/main.css';
import { createNavbar } from '../components/navbar.js';
import {
  createProjectItem,
  getProjectSupplyData,
} from '../services/projectItemsService.js';
import { getSupplyCategories } from '../services/suppliesService.js';
import { requireAuth } from '../utils/guards.js';
import { validateProjectItemInput } from '../utils/projectItemValidation.js';

document.querySelector('#site-header').append(createNavbar());

const loadingState = document.querySelector('#loading-state');
const errorState = document.querySelector('#error-state');
const content = document.querySelector('#project-content');
const form = document.querySelector('#project-item-form');
const supplyChoice = form.elements.supply_id;
const categoryChoice = form.elements.category_id;
const submitButton = form.querySelector('button[type="submit"]');
const projectId = new URLSearchParams(window.location.search).get('id');
let projectData;

try {
  const user = await requireAuth();
  if (user) {
    if (!projectId) throw new Error('Choose a project to view its supplies.');
    const [data, categories] = await Promise.all([
      getProjectSupplyData(projectId),
      getSupplyCategories(),
    ]);
    projectData = data;
    renderCategoryOptions(categories);
    renderSupplyOptions(data.supplies);
    renderProject(data);
    loadingState.hidden = true;
    content.hidden = false;
  }
} catch (error) {
  loadingState.hidden = true;
  errorState.textContent = error.message;
  errorState.hidden = false;
}

supplyChoice.addEventListener('change', populateSupplyFields);
form.addEventListener('submit', handleAddItem);

function renderProject(data) {
  document.title = `${data.project.title} supplies — Stashly`;
  document.querySelector('#project-title').textContent = data.project.title;
  document.querySelector('#project-description').textContent =
    data.project.description ?? '';
  const links = document.querySelector('#project-file-links');
  links.replaceChildren();
  if (data.project.pattern_url) {
    const link = document.createElement('a');
    link.className = 'btn btn-sm btn-outline-secondary';
    link.href = data.project.pattern_url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Open pattern';
    links.append(link);
  }
  if (data.project.cover_url) {
    const link = document.createElement('a');
    link.className = 'btn btn-sm btn-outline-secondary';
    link.href = data.project.cover_url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'View cover';
    links.append(link);
  }

  const { total, owned, percent } = data.progress;
  const progressBar = document.querySelector('#progress-bar');
  progressBar.setAttribute('aria-valuenow', String(percent));
  document.querySelector('#progress-value').style.width = `${percent}%`;
  document.querySelector('#progress-label').textContent = `${owned} of ${total} items owned`;
  document.querySelector('#missing-summary').textContent =
    total === 0 ? 'Add supplies to start a shopping list.' : `${total - owned} items still need supplies.`;

  const groups = {
    owned: document.querySelector('#owned-items'),
    partial: document.querySelector('#partial-items'),
    missing: document.querySelector('#missing-items'),
  };
  for (const list of Object.values(groups)) list.replaceChildren();
  for (const item of data.items) {
    groups[item.ownership_status].append(createItemRow(item));
  }
  for (const [status, list] of Object.entries(groups)) {
    if (list.childElementCount === 0) {
      const empty = document.createElement('li');
      empty.className = 'list-group-item text-muted small px-0';
      empty.textContent = status === 'owned' ? 'No fully owned items yet.' : 'Nothing here yet.';
      list.append(empty);
    }
  }
}

function renderCategoryOptions(categories) {
  const placeholder = categoryChoice.options[0];
  categoryChoice.replaceChildren(placeholder);
  for (const category of categories) {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    categoryChoice.append(option);
  }
}

function renderSupplyOptions(supplies) {
  const linkedSupplyIds = new Set(projectData.items.map((item) => item.supply_id).filter(Boolean));
  const firstOption = supplyChoice.options[0];
  supplyChoice.replaceChildren(firstOption);
  for (const supply of supplies.filter((item) => !linkedSupplyIds.has(item.id))) {
    const option = document.createElement('option');
    option.value = supply.id;
    option.textContent = `${supply.name}${supply.color_code ? ` (${supply.color_code})` : ''} — ${supply.quantity} ${supply.unit ?? ''}`;
    supplyChoice.append(option);
  }
}

function populateSupplyFields() {
  const supply = projectData.supplies.find((item) => item.id === supplyChoice.value);
  for (const name of ['category_id', 'name', 'brand', 'color_code', 'unit']) {
    const field = form.elements[name];
    field.value = supply ? (name === 'category_id' ? supply.category_id ?? '' : supply[name] ?? '') : '';
    field.disabled = Boolean(supply);
  }
}

function createItemRow(item) {
  const row = document.createElement('li');
  row.className = 'list-group-item px-0';
  const name = document.createElement('p');
  name.className = 'fw-semibold mb-1';
  name.textContent = `${item.name}${item.color_code ? ` · ${item.color_code}` : ''}`;
  const quantities = document.createElement('p');
  quantities.className = 'small text-muted mb-0';
  quantities.textContent =
    item.ownership_status === 'owned'
      ? `${item.quantity_needed} ${item.unit ?? ''} owned`
      : `${item.quantity_owned} owned · ${item.quantity_missing} ${item.unit ?? ''} to buy`;
  row.append(name, quantities);
  if (item.unit_mismatch) {
    const warning = document.createElement('p');
    warning.className = 'small text-warning-emphasis mb-0';
    warning.textContent = `Linked inventory unit differs (${item.supplies.unit ?? 'unspecified'}).`;
    row.append(warning);
  }
  return row;
}

async function handleAddItem(event) {
  event.preventDefault();
  clearErrors();
  const { errors, value } = validateProjectItemInput({
    name: form.elements.name.value,
    category_id: categoryChoice.value,
    supply_id: supplyChoice.value,
    brand: form.elements.brand.value,
    color_code: form.elements.color_code.value,
    quantity_needed: form.elements.quantity_needed.value,
    unit: form.elements.unit.value,
  });
  showErrors(errors);
  if (Object.keys(errors).length) return;

  submitButton.disabled = true;
  submitButton.textContent = 'Adding…';
  try {
    await createProjectItem(projectId, value);
    projectData = await getProjectSupplyData(projectId);
    renderSupplyOptions(projectData.supplies);
    renderProject(projectData);
    form.reset();
    form.elements.quantity_needed.value = '1';
    populateSupplyFields();
    showFormMessage('Supply added to this project.', 'success');
  } catch (error) {
    showFormMessage(error.message, 'danger');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Add to project';
  }
}

function clearErrors() {
  for (const field of form.querySelectorAll('.is-invalid')) {
    field.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');
  }
}

function showErrors(errors) {
  for (const [name, text] of Object.entries(errors)) {
    const field = form.elements[name];
    field.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');
    const feedback = field.parentElement.querySelector('.invalid-feedback');
    if (feedback) feedback.textContent = text;
  }
}

function showFormMessage(text, kind) {
  const message = document.querySelector('#item-form-message');
  message.className = `alert alert-${kind} mt-3`;
  message.textContent = text;
}
