import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import '../styles/main.css';
import { createNavbar } from '../components/navbar.js';
import {
  createProject,
  getProjectById,
  updateProject,
} from '../services/projectsService.js';
import { requireAuth } from '../utils/guards.js';
import { validateProjectInput } from '../utils/projectValidation.js';

document.querySelector('#site-header').append(createNavbar());

const form = document.querySelector('#project-form');
const loading = document.querySelector('#form-loading');
const error = document.querySelector('#form-error');
const message = document.querySelector('#form-message');
const submitButton = form.querySelector('button[type="submit"]');
const projectId = new URLSearchParams(window.location.search).get('id');
const isEditing = Boolean(projectId);

try {
  const user = await requireAuth();
  if (user) {
    const project = isEditing ? await getProjectById(projectId) : null;
    if (project) populateForm(project);
    loading.hidden = true;
    form.hidden = false;
    if (isEditing) {
      document.title = 'Edit project — Stashly';
      document.querySelector('#form-title').textContent = 'Edit project';
      submitButton.textContent = 'Save changes';
    }
  }
} catch (loadError) {
  loading.hidden = true;
  error.textContent = loadError.message;
  error.hidden = false;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  clearValidationErrors();

  const { errors, value } = validateProjectInput({
    title: form.elements.title.value,
    description: form.elements.description.value,
    status: form.elements.status.value,
  });
  showValidationErrors(errors);
  if (Object.keys(errors).length > 0) return;

  submitButton.disabled = true;
  submitButton.textContent = 'Saving…';
  try {
    if (isEditing) await updateProject(projectId, value);
    else await createProject(value);
    const action = isEditing ? 'updated' : 'created';
    window.location.assign(`/pages/projects.html?${action}=1`);
  } catch (saveError) {
    message.className = 'alert alert-danger mt-3';
    message.textContent = saveError.message;
    submitButton.disabled = false;
    submitButton.textContent = isEditing ? 'Save changes' : 'Save project';
  }
});

function populateForm(project) {
  form.elements.title.value = project.title;
  form.elements.description.value = project.description ?? '';
  form.elements.status.value = project.status;
}

function clearValidationErrors() {
  for (const field of form.querySelectorAll('.is-invalid')) {
    field.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');
  }
}

function showValidationErrors(errors) {
  for (const [fieldName, description] of Object.entries(errors)) {
    const field = form.elements[fieldName];
    field.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');
    const feedback = field.parentElement.querySelector('.invalid-feedback');
    if (feedback) feedback.textContent = description;
  }
}
