import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import '../styles/main.css';
import { createNavbar } from '../components/navbar.js';
import { getAdminOverview, getAdminUsers } from '../services/adminService.js';
import { requireAdmin } from '../utils/guards.js';
import { initializeAdminCategories } from './adminCategories.js';
import { initializeAdminModeration } from './adminModeration.js';
import { initializeAdminUsers } from './adminUsers.js';

document.querySelector('#site-header').append(createNavbar());

const loadingState = document.querySelector('#loading-state');
const errorState = document.querySelector('#error-state');
const content = document.querySelector('#admin-content');
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

async function loadAdminData() {
  const [overview, users] = await Promise.all([
    getAdminOverview(),
    getAdminUsers(),
  ]);
  document.querySelector('#user-total').textContent = String(overview.users);
  document.querySelector('#supply-total').textContent = String(overview.supplies);
  document.querySelector('#project-total').textContent = String(overview.projects);

  await Promise.all([
    initializeAdminCategories(),
    initializeAdminUsers(users, currentAdminId),
    initializeAdminModeration(users, refreshOverview),
  ]);
}

async function refreshOverview() {
  const overview = await getAdminOverview();
  document.querySelector('#user-total').textContent = String(overview.users);
  document.querySelector('#supply-total').textContent = String(overview.supplies);
  document.querySelector('#project-total').textContent = String(overview.projects);
}
