import { deleteProject, getProjects } from '../services/projectsService.js';
import { deleteSupply, getSupplyBrowseData } from '../services/suppliesService.js';

const supplyList = document.querySelector('#admin-supply-list');
const projectList = document.querySelector('#admin-project-list');
const message = document.querySelector('#moderation-message');
let users = [];
let supplies = [];
let projects = [];

export async function initializeAdminModeration(adminUsers, onContentChanged) {
  users = adminUsers;
  const [supplyData, projectData] = await Promise.all([
    getSupplyBrowseData(),
    getProjects(),
  ]);
  supplies = supplyData.supplies;
  projects = projectData;
  renderSupplies();
  renderProjects();
  supplyList.addEventListener('click', (event) => handleSupplyAction(event, onContentChanged));
  projectList.addEventListener('click', (event) => handleProjectAction(event, onContentChanged));
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
  const name = document.createElement('th');
  name.scope = 'row';
  name.textContent = supply.name;
  if (supply.categories?.name) {
    const category = document.createElement('div');
    category.className = 'small text-muted';
    category.textContent = supply.categories.name;
    name.append(category);
  }
  const owner = document.createElement('td');
  owner.className = 'small text-muted text-break';
  owner.textContent = ownerLabel(supply.user_id);
  const quantity = document.createElement('td');
  quantity.textContent = `${supply.quantity} ${supply.unit ?? ''}`.trim();
  const actions = document.createElement('td');
  actions.className = 'd-flex flex-wrap gap-2';
  actions.append(
    editLink(`/pages/supply-form.html?id=${encodeURIComponent(supply.id)}`, `Edit ${supply.name}`),
    deleteButton('delete-supply', supply.id, `Delete ${supply.name}`),
  );
  row.append(name, owner, quantity, actions);
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
  const title = document.createElement('th');
  title.scope = 'row';
  title.textContent = project.title;
  const owner = document.createElement('td');
  owner.className = 'small text-muted text-break';
  owner.textContent = ownerLabel(project.user_id);
  const status = document.createElement('td');
  status.textContent = project.status.replace('_', ' ');
  const actions = document.createElement('td');
  actions.className = 'd-flex flex-wrap gap-2';
  actions.append(
    editLink(`/pages/project-form.html?id=${encodeURIComponent(project.id)}`, `Edit ${project.title}`),
    deleteButton('delete-project', project.id, `Delete ${project.title}`),
  );
  row.append(title, owner, status, actions);
  return row;
}

function editLink(href, label) {
  const link = document.createElement('a');
  link.className = 'btn btn-sm btn-outline-secondary';
  link.href = href;
  link.textContent = 'Edit';
  link.setAttribute('aria-label', label);
  return link;
}

function deleteButton(action, id, label) {
  const button = document.createElement('button');
  button.className = 'btn btn-sm btn-outline-danger';
  button.type = 'button';
  button.setAttribute(`data-${action}`, id);
  button.textContent = 'Delete';
  button.setAttribute('aria-label', label);
  return button;
}

function ownerLabel(userId) {
  const owner = users.find((user) => user.user_id === userId);
  return owner ? `${owner.email || owner.display_name || 'Account'} (${userId})` : userId;
}

async function handleSupplyAction(event, onContentChanged) {
  const button = event.target.closest('button[data-delete-supply]');
  if (!button) return;
  const supply = supplies.find((item) => item.id === button.dataset.deleteSupply);
  if (!supply || !window.confirm(`Delete "${supply.name}" from its owner's inventory?`)) return;
  button.disabled = true;
  try {
    const cleanup = await deleteSupply(supply.id);
    supplies = supplies.filter((item) => item.id !== supply.id);
    renderSupplies();
    let refreshWarning = '';
    try {
      await onContentChanged();
    } catch (error) {
      refreshWarning = ` Platform totals could not refresh: ${error.message}`;
    }
    showMessage(
      `${cleanup.photoCleanupError
        ? `Supply deleted, but its photo could not be removed: ${cleanup.photoCleanupError}`
        : 'Supply deleted.'}${refreshWarning}`,
      cleanup.photoCleanupError || refreshWarning ? 'warning' : 'success',
    );
  } catch (error) {
    button.disabled = false;
    showMessage(error.message, 'danger');
  }
}

async function handleProjectAction(event, onContentChanged) {
  const button = event.target.closest('button[data-delete-project]');
  if (!button) return;
  const project = projects.find((item) => item.id === button.dataset.deleteProject);
  if (!project || !window.confirm(`Delete "${project.title}" and its project items?`)) return;
  button.disabled = true;
  try {
    const { cleanupFailures } = await deleteProject(project.id);
    projects = projects.filter((item) => item.id !== project.id);
    renderProjects();
    let refreshWarning = '';
    try {
      await onContentChanged();
    } catch (error) {
      refreshWarning = ` Platform totals could not refresh: ${error.message}`;
    }
    showMessage(
      `${cleanupFailures.length
        ? `Project deleted, but file cleanup failed: ${cleanupFailures.map((item) => item.path).join(', ')}.`
        : 'Project deleted.'}${refreshWarning}`,
      cleanupFailures.length || refreshWarning ? 'warning' : 'success',
    );
  } catch (error) {
    button.disabled = false;
    showMessage(error.message, 'danger');
  }
}

function showMessage(text, kind) {
  message.className = `small mt-3 text-${kind}`;
  message.textContent = text;
}
