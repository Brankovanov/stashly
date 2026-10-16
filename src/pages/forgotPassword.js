import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import '../styles/main.css';
import { mountLoaders } from '../components/loaders.js';
import { createNavbar } from '../components/navbar.js';
import { requestPasswordReset } from '../services/authService.js';

document.querySelector('#site-header').append(createNavbar());
mountLoaders();

const form = document.querySelector('#forgot-form');
const message = document.querySelector('#form-message');
const submitButton = form.querySelector('button[type="submit"]');

function showMessage(text, isError) {
  message.textContent = text;
  message.classList.toggle('text-danger', isError);
  message.classList.toggle('text-success', !isError);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage('', true);
  if (!form.reportValidity()) return;

  submitButton.disabled = true;
  try {
    await requestPasswordReset(form.elements.email.value.trim());
    showMessage(
      'If an account exists for that email, a reset link is on its way. Check your inbox.',
      false,
    );
    form.reset();
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    submitButton.disabled = false;
  }
});
