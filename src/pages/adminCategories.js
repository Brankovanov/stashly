import {
  deleteAdminCategory,
  getAdminCategories,
  saveAdminCategory,
} from '../services/adminService.js';

const form = document.querySelector('#category-form');
const list = document.querySelector('#category-list');
const message = document.querySelector('#category-message');
const nameInput = form.elements.name;
const iconInput = form.elements.icon;
const saveButton = document.querySelector('#save-category');
const cancelButton = document.querySelector('#cancel-category-edit');
let categories = [];
let editingId = null;

export async function initializeAdminCategories() {
  categories = await getAdminCategories();
  renderCategories();
  form.addEventListener('submit', handleSubmit);
  cancelButton.addEventListener('click', resetForm);
  list.addEventListener('click', handleAction);
}

function renderCategories() {
  list.replaceChildren(...categories.map(createCategoryRow));
  document.querySelector('#category-empty').hidden = categories.length > 0;
  document.querySelector('#category-table').hidden = categories.length === 0;
}

function createCategoryRow(category) {
  const row = document.createElement('tr');
  const name = document.createElement('th');
  name.scope = 'row';
  name.textContent = category.name;
  const iconCell = document.createElement('td');
  if (category.icon) {
    const icon = document.createElement('i');
    icon.className = `bi ${category.icon}`;
    icon.setAttribute('aria-hidden', 'true');
    iconCell.append(icon, document.createTextNode(` ${category.icon}`));
  } else {
    iconCell.textContent = '—';
  }

  const actions = document.createElement('td');
  actions.className = 'd-flex flex-wrap gap-2';
  actions.append(
    createButton('edit-category', category.id, 'Edit'),
    createButton('delete-category', category.id, 'Delete', category.name),
  );
  row.append(name, iconCell, actions);
  return row;
}

function createButton(action, id, text, name) {
  const button = document.createElement('button');
  button.className = `btn btn-sm btn-outline-${action.startsWith('delete') ? 'danger' : 'secondary'}`;
  button.type = 'button';
  button.setAttribute(`data-${action}`, id);
  button.textContent = text;
  if (name) button.setAttribute('aria-label', `${text} ${name}`);
  return button;
}

async function handleSubmit(event) {
  event.preventDefault();
  message.textContent = '';
  nameInput.value = nameInput.value.trim();
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    nameInput.classList.add('is-invalid');
    nameInput.focus();
    return;
  }

  const editing = Boolean(editingId);
  saveButton.disabled = true;
  try {
    await saveAdminCategory(editingId, { name: nameInput.value, icon: iconInput.value });
    resetForm();
    await refreshCategories(
      editing ? 'Category updated.' : 'Category added.',
      editing ? 'Category updated' : 'Category added',
    );
  } catch (error) {
    showMessage(error.message, 'danger');
  } finally {
    saveButton.disabled = false;
  }
}

async function handleAction(event) {
  const editButton = event.target.closest('button[data-edit-category]');
  if (editButton) {
    const category = categories.find((item) => item.id === editButton.dataset.editCategory);
    if (!category) return;
    editingId = category.id;
    nameInput.value = category.name;
    iconInput.value = category.icon ?? '';
    saveButton.textContent = 'Save changes';
    cancelButton.hidden = false;
    nameInput.focus();
    return;
  }

  const deleteButton = event.target.closest('button[data-delete-category]');
  if (!deleteButton) return;
  const category = categories.find((item) => item.id === deleteButton.dataset.deleteCategory);
  if (
    !category ||
    !window.confirm(`Delete the "${category.name}" category? Supplies and project needs will be kept.`)
  ) return;

  deleteButton.disabled = true;
  try {
    await deleteAdminCategory(category.id);
    await refreshCategories('Category deleted.', 'Category deleted');
  } catch (error) {
    deleteButton.disabled = false;
    showMessage(error.message, 'danger');
  }
}

async function refreshCategories(successMessage, actionLabel) {
  try {
    categories = await getAdminCategories();
    renderCategories();
    showMessage(successMessage, 'success');
  } catch (error) {
    showMessage(
      `${actionLabel}, but the category list could not refresh: ${error.message}`,
      'warning',
    );
  }
}

function resetForm() {
  form.reset();
  form.classList.remove('was-validated');
  nameInput.classList.remove('is-invalid');
  editingId = null;
  saveButton.textContent = 'Add category';
  cancelButton.hidden = true;
}

function showMessage(text, kind) {
  message.className = `small mb-3 text-${kind}`;
  message.textContent = text;
}
