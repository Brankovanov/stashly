import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import '../styles/main.css';
import { createNavbar } from '../components/navbar.js';
import { deleteProject, getProjects } from '../services/projectsService.js';
import { requireAuth } from '../utils/guards.js';

document.querySelector('#site-header').append(createNavbar());

const statusFilter = document.querySelector('#status-filter');
const projectList = document.querySelector('#project-list');
const projectCount = document.querySelector('#project-count');
const loadingState = document.querySelector('#loading-state');
const errorState = document.querySelector('#error-state');
const emptyState = document.querySelector('#empty-state');
const noResultsState = document.querySelector('#no-results-state');
let projects = [];

showActionNotice();
projectList.addEventListener('click', handleProjectAction);

try {
  const user = await requireAuth();
  if (user) {
    projects = await getProjects();
    loadingState.hidden = true;
    statusFilter.addEventListener('change', renderProjects);
    document.querySelector('#clear-filter').addEventListener('click', () => {
      statusFilter.value = '';
      renderProjects();
    });
    renderProjects();
  }
} catch (error) {
  loadingState.hidden = true;
  errorState.textContent = error.message;
  errorState.hidden = false;
}

function renderProjects() {
  const visibleProjects = projects.filter(
    (project) => !statusFilter.value || project.status === statusFilter.value,
  );
  projectList.replaceChildren(...visibleProjects.map(createProjectCard));
  projectCount.textContent = `${visibleProjects.length} of ${projects.length} ${
    projects.length === 1 ? 'project' : 'projects'
  }`;
  emptyState.hidden = projects.length > 0;
  noResultsState.hidden = projects.length === 0 || visibleProjects.length > 0;
  projectList.hidden = visibleProjects.length === 0;
}

function createProjectCard(project) {
  const column = document.createElement('div');
  column.className = 'col-12 col-sm-6 col-lg-4';

  const card = document.createElement('article');
  card.className = 'card project-card h-100';
  const body = document.createElement('div');
  body.className = 'card-body d-flex flex-column';

  if (project.cover_url) {
    const cover = document.createElement('img');
    cover.className = 'project-cover mb-3';
    cover.src = project.cover_url;
    cover.alt = `${project.title} cover`;
    cover.loading = 'lazy';
    body.append(cover);
  }

  const heading = document.createElement('div');
  heading.className = 'd-flex align-items-start justify-content-between gap-2';
  const title = document.createElement('h2');
  title.className = 'h5 card-title';
  title.textContent = project.title;
  heading.append(title, createStatusBadge(project.status));
  body.append(heading);

  if (project.description) {
    const description = document.createElement('p');
    description.className = 'small text-muted project-description';
    description.textContent = project.description;
    body.append(description);
  }
  if (project.pattern_url) {
    const patternLink = document.createElement('a');
    patternLink.className = 'small mb-3';
    patternLink.href = project.pattern_url;
    patternLink.target = '_blank';
    patternLink.rel = 'noopener';
    patternLink.textContent = 'Open pattern file';
    body.append(patternLink);
  }

  const editLink = document.createElement('a');
  editLink.className = 'btn btn-sm btn-outline-secondary mt-auto align-self-start';
  editLink.href = `/pages/project-form.html?id=${encodeURIComponent(project.id)}`;
  editLink.textContent = 'Edit project';
  editLink.setAttribute('aria-label', `Edit ${project.title}`);
  body.append(editLink);
  const detailLink = document.createElement('a');
  detailLink.className = 'btn btn-sm btn-outline-primary mt-2 align-self-start';
  detailLink.href = `/pages/project-detail.html?id=${encodeURIComponent(project.id)}`;
  detailLink.textContent = 'Project supplies';
  detailLink.setAttribute('aria-label', `View supplies for ${project.title}`);
  body.append(detailLink);
  const deleteButton = document.createElement('button');
  deleteButton.className = 'btn btn-sm btn-outline-danger mt-2 align-self-start';
  deleteButton.type = 'button';
  deleteButton.dataset.deleteProject = project.id;
  deleteButton.textContent = 'Delete project';
  deleteButton.setAttribute('aria-label', `Delete ${project.title}`);
  body.append(deleteButton);

  card.append(body);
  column.append(card);
  return column;
}

function createStatusBadge(status) {
  const labels = {
    planned: ['Planned', 'text-bg-secondary'],
    in_progress: ['In progress', 'text-bg-primary'],
    completed: ['Completed', 'text-bg-success'],
  };
  const [label, badgeClass] = labels[status] ?? ['Unknown', 'text-bg-secondary'];
  const badge = document.createElement('span');
  badge.className = `badge ${badgeClass} flex-shrink-0`;
  badge.textContent = label;
  return badge;
}

function showActionNotice() {
  const params = new URLSearchParams(window.location.search);
  const action = ['created', 'updated', 'deleted'].find((key) => params.has(key));
  const cleanupPaths = params.get('fileCleanup')?.split(',').filter(Boolean) ?? [];
  if (!action && cleanupPaths.length === 0) return;

  const notice = document.createElement('div');
  notice.className = cleanupPaths.length ? 'alert alert-warning' : 'alert alert-success';
  notice.setAttribute('role', cleanupPaths.length ? 'alert' : 'status');
  notice.textContent = cleanupPaths.length
    ? `Project saved, but these old files could not be removed: ${cleanupPaths.join(', ')}.`
    : action === 'created'
      ? 'Project created.'
      : action === 'deleted'
        ? 'Project deleted.'
        : 'Project changes saved.';
  document.querySelector('main').prepend(notice);
  window.history.replaceState({}, '', window.location.pathname);
}

async function handleProjectAction(event) {
  const button = event.target.closest('button[data-delete-project]');
  if (!button || !projectList.contains(button)) return;

  const project = projects.find((item) => item.id === button.dataset.deleteProject);
  if (!project) return;
  if (!window.confirm(`Delete "${project.title}" and its project items?`)) return;

  button.disabled = true;
  button.textContent = 'Deleting…';
  errorState.hidden = true;
  try {
    const { cleanupFailures } = await deleteProject(project.id);
    projects = projects.filter((item) => item.id !== project.id);
    renderProjects();
    showInventoryNotice('Project deleted.', 'success');
    for (const failure of cleanupFailures) {
      showInventoryNotice(
        `The project was deleted, but this file could not be removed: ${failure.path}. ${failure.message}`,
        'warning',
      );
    }
  } catch (error) {
    errorState.textContent = error.message;
    errorState.hidden = false;
    button.disabled = false;
    button.textContent = 'Delete project';
  }
}

function showInventoryNotice(text, kind) {
  const notice = document.createElement('div');
  notice.className = `alert alert-${kind}`;
  notice.setAttribute('role', kind === 'warning' ? 'alert' : 'status');
  notice.textContent = text;
  document.querySelector('main').prepend(notice);
}
