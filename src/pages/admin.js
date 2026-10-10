import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import '../styles/main.css';
import { createNavbar } from '../components/navbar.js';
import {
  deleteAdminCategory,
  getAdminCategories,
  getAdminOverview,
  getAdminUsers,
  saveAdminCategory,
  setAdminUserRole,
} from '../services/adminService.js';
import {
  deleteSupply,
  getSupplyBrowseData,
} from '../services/suppliesService.js';
import { deleteProject, getProjects } from '../services/projectsService.js';
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
const userList = document.querySelector('#user-list');
const userMessage = document.querySelector('#user-message');
const moderationMessage = document.querySelector('#moderation-message');
const supplyList = document.querySelector('#admin-supply-list');
const projectList = document.querySelector('#admin-project-list');
let categories = [];
let users = [];
let supplies = [];
let projects = [];
let editingCategoryId = null;
let currentAdminId;

try {
  const admin = await requireAdmin();
  if (admin) {
    currentAdminId = admin.id;
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
userList.addEventListener('click', handleUserAction);
supplyList.addEventListener('click', handleSupplyAction);
projectList.addEventListener('click', handleProjectAction);

async function loadAdminData() {
  const [overview, loadedCategories, loadedUsers, supplyData, loadedProjects] = await Promise.all([
    getAdminOverview(),
    getAdminCategories(),
    getAdminUsers(),
    getSupplyBrowseData(),
    getProjects(),
  ]);
  categories = loadedCategories;
  users = loadedUsers;
  supplies = supplyData.supplies;
  projects = loadedProjects;
  document.querySelector('#user-total').textContent = String(overview.users);
  document.querySelector('#supply-total').textContent = String(overview.supplies);
  document.querySelector('#project-total').textContent = String(overview.projects);
  renderCategories();
  renderUsers();
  renderSupplies();
  renderProjects();
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

function renderUsers() {
  userList.replaceChildren(...users.map(createUserRow));
  document.querySelector('#user-list-count').textContent =
    `${users.length} ${users.length === 1 ? 'account' : 'accounts'}`;
  document.querySelector('#user-empty').hidden = users.length > 0;
  document.querySelector('#user-table').hidden = users.length === 0;
}

function createUserRow(user) {
  const row = document.createElement('tr');
  const accountCell = document.createElement('td');
  const email = document.createElement('div');
  email.className = 'fw-semibold';
  email.textContent = user.email || 'Email unavailable';
  const displayName = document.createElement('div');
  displayName.className = 'small text-muted';
  displayName.textContent = user.display_name || 'No display name';
  accountCell.append(email, displayName);

  const joinedCell = document.createElement('td');
  joinedCell.textContent = new Date(user.created_at).toLocaleDateString();

  const roleCell = document.createElement('td');
  const roleSelect = document.createElement('select');
  roleSelect.className = 'form-select form-select-sm admin-role-select';
  roleSelect.dataset.roleForUser = user.user_id;
  for (const [value, label] of [['user', 'User'], ['admin', 'Admin']]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    option.selected = user.role === value;
    roleSelect.append(option);
  }
  roleCell.append(roleSelect);

  const actionCell = document.createElement('td');
  const saveButton = document.createElement('button');
  saveButton.className = 'btn btn-sm btn-outline-primary';
  saveButton.type = 'button';
  saveButton.dataset.saveRole = user.user_id;
  saveButton.textContent = 'Save role';
  actionCell.append(saveButton);

  row.append(accountCell, joinedCell, roleCell, actionCell);
  return row;
}

async function handleUserAction(event) {
  const button = event.target.closest('button[data-save-role]');
  if (!button) return;
  const user = users.find((item) => item.user_id === button.dataset.saveRole);
  const roleSelect = button.closest('tr').querySelector('select[data-role-for-user]');
  if (!user || !roleSelect || roleSelect.value === user.role) return;

  if (
    user.role === 'admin' &&
    roleSelect.value === 'user' &&
    !window.confirm(`Remove administrator access from ${user.email || 'this account'}?`)
  ) {
    roleSelect.value = user.role;
    return;
  }

  button.disabled = true;
  try {
    await setAdminUserRole(user.user_id, roleSelect.value);
    if (user.user_id === currentAdminId && roleSelect.value === 'user') {
      window.location.assign('/');
      return;
    }
    users = await getAdminUsers();
    renderUsers();
    showUserMessage('User role updated.', 'success');
  } catch (error) {
    button.disabled = false;
    showUserMessage(error.message, 'danger');
  }
}

function renderSupplies() {
  supplyList.replaceChildren(...supplies.map(createSupplyRow));
  document.querySelector('#admin-supply-count').textContent =
    `${supplies.length} ${supplies.length === 1 ? 'supply' : 'supplies'}`;
  document.querySelector('#supply-moderation-empty').hidden = supplies.length > 0;
  document.querySelector('#admin-supply-table').hidden = supplies.length === 0;
}

function createSupplyRow(supply) {
  const row = document.createElement('tr');
  const nameCell = document.createElement('th');
  nameCell.scope = 'row';
  nameCell.textContent = supply.name;
  if (supply.categories?.name) {
    const category = document.createElement('div');
    category.className = 'small text-muted';
    category.textContent = supply.categories.name;
    nameCell.append(category);
  }

  const ownerCell = document.createElement('td');
  ownerCell.className = 'small text-muted text-break';
  ownerCell.textContent = supply.user_id;
  const quantityCell = document.createElement('td');
  quantityCell.textContent = `${supply.quantity} ${supply.unit ?? ''}`.trim();
  const actions = document.createElement('td');
  actions.className = 'd-flex flex-wrap gap-2';
  actions.append(
    createEditLink(`/pages/supply-form.html?id=${encodeURIComponent(supply.id)}`, `Edit ${supply.name}`),
    createDeleteButton('delete-supply', supply.id, `Delete ${supply.name}`),
  );
  row.append(nameCell, ownerCell, quantityCell, actions);
  return row;
}

function renderProjects() {
  projectList.replaceChildren(...projects.map(createProjectRow));
  document.querySelector('#admin-project-count').textContent =
    `${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`;
  document.querySelector('#project-moderation-empty').hidden = projects.length > 0;
  document.querySelector('#admin-project-table').hidden = projects.length === 0;
}

function createProjectRow(project) {
  const row = document.createElement('tr');
  const titleCell = document.createElement('th');
  titleCell.scope = 'row';
  titleCell.textContent = project.title;
  const ownerCell = document.createElement('td');
  ownerCell.className = 'small text-muted text-break';
  ownerCell.textContent = project.user_id;
  const statusCell = document.createElement('td');
  statusCell.textContent = project.status.replace('_', ' ');
  const actions = document.createElement('td');
  actions.className = 'd-flex flex-wrap gap-2';
  actions.append(
    createEditLink(`/pages/project-form.html?id=${encodeURIComponent(project.id)}`, `Edit ${project.title}`),
    createDeleteButton('delete-project', project.id, `Delete ${project.title}`),
  );
  row.append(titleCell, ownerCell, statusCell, actions);
  return row;
}

function createEditLink(href, label) {
  const link = document.createElement('a');
  link.className = 'btn btn-sm btn-outline-secondary';
  link.href = href;
  link.textContent = 'Edit';
  link.setAttribute('aria-label', label);
  return link;
}

function createDeleteButton(action, id, label) {
  const button = document.createElement('button');
  button.className = 'btn btn-sm btn-outline-danger';
  button.type = 'button';
  button.dataset[action] = id;
  button.textContent = 'Delete';
  button.setAttribute('aria-label', label);
  return button;
}

async function handleSupplyAction(event) {
  const button = event.target.closest('button[data-delete-supply]');
  if (!button) return;
  const supply = supplies.find((item) => item.id === button.dataset.deleteSupply);
  if (!supply || !window.confirm(`Delete "${supply.name}" from its owner's inventory?`)) return;
  button.disabled = true;
  try {
    const cleanup = await deleteSupply(supply.id);
    supplies = supplies.filter((item) => item.id !== supply.id);
    renderSupplies();
    await refreshOverview();
    showModerationMessage(
      cleanup.photoCleanupError
        ? `Supply deleted, but its photo could not be removed: ${cleanup.photoCleanupError}`
        : 'Supply deleted.',
      cleanup.photoCleanupError ? 'warning' : 'success',
    );
  } catch (error) {
    button.disabled = false;
    showModerationMessage(error.message, 'danger');
  }
}

async function handleProjectAction(event) {
  const button = event.target.closest('button[data-delete-project]');
  if (!button) return;
  const project = projects.find((item) => item.id === button.dataset.deleteProject);
  if (!project || !window.confirm(`Delete "${project.title}" and its project items?`)) return;
  button.disabled = true;
  try {
    const { cleanupFailures } = await deleteProject(project.id);
    projects = projects.filter((item) => item.id !== project.id);
    renderProjects();
    await refreshOverview();
    showModerationMessage(
      cleanupFailures.length
        ? `Project deleted, but file cleanup failed: ${cleanupFailures.map((item) => item.path).join(', ')}.`
        : 'Project deleted.',
      cleanupFailures.length ? 'warning' : 'success',
    );
  } catch (error) {
    button.disabled = false;
    showModerationMessage(error.message, 'danger');
  }
}

async function refreshOverview() {
  const overview = await getAdminOverview();
  document.querySelector('#user-total').textContent = String(overview.users);
  document.querySelector('#supply-total').textContent = String(overview.supplies);
  document.querySelector('#project-total').textContent = String(overview.projects);
}

function showUserMessage(text, kind) {
  userMessage.className = `small mb-3 text-${kind}`;
  userMessage.textContent = text;
}

function showModerationMessage(text, kind) {
  moderationMessage.className = `small mt-3 text-${kind}`;
  moderationMessage.textContent = text;
}
