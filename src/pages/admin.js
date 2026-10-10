import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import '../styles/main.css';
import { createNavbar } from '../components/navbar.js';
import {
  deleteAdminCategory,
  getAdminCategories,
  getAdminOverview,
  saveAdminCategory,
} from '../services/adminService.js';
import { requireAdmin } from '../utils/guards.js';

document.querySelector('#site-header').append(createNavbar());

const loadingState = document.querySelector('#loading-state');
const errorState = document.querySelector('#error-state');
const content = document.querySelector('#admin-content');
const categoryForm = document.querySelector('#category-form');
const categoryList = document.querySelector('#category-list');
const categoryMessage = document.querySelector('#category-message');
const categoryName = categoryForm.elements.name;
const categoryIcon = categoryForm.elements.icon;
const saveCategoryButton = document.querySelector('#save-category');
const cancelCategoryButton = document.querySelector('#cancel-category-edit');
let categories = [];
let editingCategoryId = null;

try {
  const admin = await requireAdmin();
  if (admin) {
    await loadAdminData();
    loadingState.hidden = true;
    content.hidden = false;
  }
} catch (error) {
  loadingState.hidden = true;
  errorState.textContent = error.message;
  errorState.hidden = false;
}

categoryForm.addEventListener('submit', handleCategorySubmit);
cancelCategoryButton.addEventListener('click', resetCategoryForm);
categoryList.addEventListener('click', handleCategoryAction);

async function loadAdminData() {
  const [overview, loadedCategories] = await Promise.all([
    getAdminOverview(),
    getAdminCategories(),
  ]);
  categories = loadedCategories;
  document.querySelector('#user-total').textContent = String(overview.users);
  document.querySelector('#supply-total').textContent = String(overview.supplies);
  document.querySelector('#project-total').textContent = String(overview.projects);
  renderCategories();
}

function renderCategories() {
  categoryList.replaceChildren(...categories.map(createCategoryRow));
  document.querySelector('#category-empty').hidden = categories.length > 0;
  document.querySelector('#category-table').hidden = categories.length === 0;
}

function createCategoryRow(category) {
  const row = document.createElement('tr');
  const nameCell = document.createElement('th');
  nameCell.scope = 'row';
  nameCell.textContent = category.name;
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
  const editButton = document.createElement('button');
  editButton.className = 'btn btn-sm btn-outline-secondary';
  editButton.type = 'button';
  editButton.dataset.editCategory = category.id;
  editButton.textContent = 'Edit';
  const deleteButton = document.createElement('button');
  deleteButton.className = 'btn btn-sm btn-outline-danger';
  deleteButton.type = 'button';
  deleteButton.dataset.deleteCategory = category.id;
  deleteButton.textContent = 'Delete';
  deleteButton.setAttribute('aria-label', `Delete ${category.name}`);
  actions.append(editButton, deleteButton);
  row.append(nameCell, iconCell, actions);
  return row;
}

async function handleCategorySubmit(event) {
  event.preventDefault();
  categoryMessage.textContent = '';
  categoryName.value = categoryName.value.trim();
  if (!categoryForm.checkValidity()) {
    categoryForm.classList.add('was-validated');
    categoryName.classList.add('is-invalid');
    categoryName.focus();
    return;
  }

  const isEditing = Boolean(editingCategoryId);
  saveCategoryButton.disabled = true;
  try {
    await saveAdminCategory(editingCategoryId, {
      name: categoryName.value,
      icon: categoryIcon.value,
    });
    await refreshCategories();
    resetCategoryForm();
    showCategoryMessage(isEditing ? 'Category updated.' : 'Category added.', 'success');
  } catch (error) {
    showCategoryMessage(error.message, 'danger');
  } finally {
    saveCategoryButton.disabled = false;
  }
}

async function handleCategoryAction(event) {
  const editButton = event.target.closest('button[data-edit-category]');
  if (editButton) {
    const category = categories.find((item) => item.id === editButton.dataset.editCategory);
    if (!category) return;
    editingCategoryId = category.id;
    categoryName.value = category.name;
    categoryIcon.value = category.icon ?? '';
    saveCategoryButton.textContent = 'Save changes';
    cancelCategoryButton.hidden = false;
    categoryName.focus();
    return;
  }

  const deleteButton = event.target.closest('button[data-delete-category]');
  if (!deleteButton) return;
  const category = categories.find((item) => item.id === deleteButton.dataset.deleteCategory);
  if (!category || !window.confirm(`Delete the "${category.name}" category? Supplies and project needs will be kept.`)) {
    return;
  }
  deleteButton.disabled = true;
  try {
    await deleteAdminCategory(category.id);
    await refreshCategories();
    showCategoryMessage('Category deleted.', 'success');
  } catch (error) {
    deleteButton.disabled = false;
    showCategoryMessage(error.message, 'danger');
  }
}

async function refreshCategories() {
  categories = await getAdminCategories();
  renderCategories();
}

function resetCategoryForm() {
  categoryForm.reset();
  categoryForm.classList.remove('was-validated');
  categoryName.classList.remove('is-invalid');
  editingCategoryId = null;
  saveCategoryButton.textContent = 'Add category';
  cancelCategoryButton.hidden = true;
}

function showCategoryMessage(text, kind) {
  categoryMessage.className = `small mb-3 text-${kind}`;
  categoryMessage.textContent = text;
}
