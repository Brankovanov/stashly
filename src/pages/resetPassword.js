import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import '../styles/main.css';
import { createNavbar } from '../components/navbar.js';
import { getSession, updatePassword } from '../services/authService.js';

document.querySelector('#site-header').append(createNavbar());

const form = document.querySelector('#reset-form');
const message = document.querySelector('#form-message');
const loadingState = document.querySelector('#loading-state');
const invalidState = document.querySelector('#invalid-state');
const submitButton = form.querySelector('button[type="submit"]');

// The recovery link signs the user in; no session means the link was invalid or expired.
let hasSession = false;
try {
  hasSession = Boolean(await getSession());
} catch {
  hasSession = false;
}
loadingState.hidden = true;
form.hidden = !hasSession;
invalidState.hidden = hasSession;

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';

  const { password, confirmPassword } = form.elements;
  confirmPassword.setCustomValidity(
    confirmPassword.value === password.value ? '' : 'Passwords do not match.',
  );
  if (!form.reportValidity()) return;

  submitButton.disabled = true;
  try {
    await updatePassword(password.value);
    window.location.replace('/');
  } catch (error) {
    message.textContent = error.message;
    submitButton.disabled = false;
  }
});

form.elements.confirmPassword.addEventListener('input', () => {
  form.elements.confirmPassword.setCustomValidity('');
});
