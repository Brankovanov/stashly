import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import '../styles/main.css';
import { createNavbar } from '../components/navbar.js';
import { getSession, signIn } from '../services/authService.js';

document.querySelector('#site-header').append(createNavbar());

const form = document.querySelector('#login-form');
const message = document.querySelector('#form-message');
const submitButton = form.querySelector('button[type="submit"]');
const returnTo = getSafeReturnPath(new URLSearchParams(window.location.search).get('next'));

try {
  if (await getSession()) window.location.replace(returnTo);
} catch (error) {
  message.textContent = error.message;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  if (!form.reportValidity()) return;

  submitButton.disabled = true;
  try {
    await signIn({
      email: form.elements.email.value.trim(),
      password: form.elements.password.value,
    });
    window.location.replace(returnTo);
  } catch (error) {
    message.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

function getSafeReturnPath(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/';
  }
  return value;
}
