import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import '../styles/main.css';
import { createNavbar } from '../components/navbar.js';
import { getCurrentProfile, updateCurrentProfile } from '../services/profileService.js';
import { requireAuth } from '../utils/guards.js';

document.querySelector('#site-header').append(createNavbar());

const loadingState = document.querySelector('#loading-state');
const errorState = document.querySelector('#error-state');
const form = document.querySelector('#profile-form');
const displayNameInput = form.elements.display_name;
const submitButton = form.querySelector('button[type="submit"]');
const message = document.querySelector('#profile-message');

try {
  const user = await requireAuth();
  if (user) {
    const profile = await getCurrentProfile();
    document.querySelector('#profile-email').value = profile.email;
    displayNameInput.value = profile.display_name ?? '';
    loadingState.hidden = true;
    form.hidden = false;
  }
} catch (error) {
  loadingState.hidden = true;
  errorState.textContent = error.message;
  errorState.hidden = false;
}

displayNameInput.addEventListener('input', () => {
  displayNameInput.classList.remove('is-invalid');
  message.textContent = '';
});
form.addEventListener('submit', handleProfileSubmit);

async function handleProfileSubmit(event) {
  event.preventDefault();
  displayNameInput.value = displayNameInput.value.trim();
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    displayNameInput.classList.add('is-invalid');
    displayNameInput.focus();
    return;
  }

  submitButton.disabled = true;
  message.className = 'small mb-3';
  message.textContent = 'Saving your profile…';
  try {
    const profile = await updateCurrentProfile({
      displayName: displayNameInput.value,
    });
    displayNameInput.value = profile.display_name;
    message.classList.add('text-success');
    message.textContent = 'Your profile has been updated.';
  } catch (error) {
    message.classList.add('text-danger');
    message.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
}
