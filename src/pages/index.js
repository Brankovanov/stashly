import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import '../styles/main.css';
import { createNavbar } from '../components/navbar.js';
import { getDashboardData } from '../services/dashboardService.js';
import { requireAuth } from '../utils/guards.js';

document.querySelector('#site-header').append(createNavbar());

const loadingState = document.querySelector('#loading-state');
const errorState = document.querySelector('#error-state');
const dashboardContent = document.querySelector('#dashboard-content');

try {
  const user = await requireAuth();
  if (user) {
    const data = await getDashboardData();
    document.querySelector('#dashboard-name').textContent = data.displayName
      ? `, ${data.displayName}`
      : '';
    document.querySelector('#supply-count').textContent = String(data.supplyCount);
    document.querySelector('#project-count').textContent = String(data.projectCount);
    document.querySelector('#items-to-buy-count').textContent = String(data.itemsToBuyCount);
    const recentProjects = document.querySelector('#recent-projects');
    recentProjects.replaceChildren(...data.recentProjects.map(createRecentProject));
    document.querySelector('#no-projects-state').hidden = data.projectCount > 0;
    loadingState.hidden = true;
    dashboardContent.hidden = false;
  }
} catch (error) {
  loadingState.hidden = true;
  errorState.textContent = error.message;
  errorState.hidden = false;
}

function createRecentProject(project) {
  const column = document.createElement('div');
  column.className = 'col-12 col-md-6 col-lg-4';

  const card = document.createElement('article');
  card.className = 'dashboard-project p-3 h-100';

  const status = document.createElement('span');
  status.className = `badge ${getStatusClass(project.status)} mb-2`;
  status.textContent = getStatusLabel(project.status);

  const title = document.createElement('h3');
  title.className = 'h5';
  const link = document.createElement('a');
  link.href = `/pages/project-detail.html?id=${encodeURIComponent(project.id)}`;
  link.textContent = project.title;
  title.append(link);

  const updated = document.createElement('p');
  updated.className = 'small text-muted mb-0';
  updated.textContent = `Updated ${new Date(project.updated_at).toLocaleDateString()}`;

  card.append(status, title, updated);
  column.append(card);
  return column;
}

function getStatusLabel(status) {
  return {
    planned: 'Planned',
    in_progress: 'In progress',
    completed: 'Completed',
  }[status] ?? 'Unknown';
}

function getStatusClass(status) {
  return {
    planned: 'text-bg-secondary',
    in_progress: 'text-bg-primary',
    completed: 'text-bg-success',
  }[status] ?? 'text-bg-secondary';
}
