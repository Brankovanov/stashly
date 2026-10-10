import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import '../styles/main.css';
import { createNavbar } from '../components/navbar.js';
import { getProjects } from '../services/projectsService.js';
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

  const editLink = document.createElement('a');
  editLink.className = 'btn btn-sm btn-outline-secondary mt-auto align-self-start';
  editLink.href = `/pages/project-form.html?id=${encodeURIComponent(project.id)}`;
  editLink.textContent = 'Edit project';
  editLink.setAttribute('aria-label', `Edit ${project.title}`);
  body.append(editLink);

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
  const action = ['created', 'updated'].find((key) => params.has(key));
  if (!action) return;

  const notice = document.createElement('div');
  notice.className = 'alert alert-success';
  notice.setAttribute('role', 'status');
  notice.textContent =
    action === 'created' ? 'Project created.' : 'Project changes saved.';
  document.querySelector('main').prepend(notice);
  window.history.replaceState({}, '', window.location.pathname);
}
