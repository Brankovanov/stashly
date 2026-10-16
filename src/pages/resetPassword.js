import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import '../styles/main.css';
import { hideLoader, mountLoaders } from '../components/loaders.js';
import { createNavbar } from '../components/navbar.js';
import { getSession, updatePassword } from '../services/authService.js';

document.querySelector('#site-header').append(createNavbar());
mountLoaders();

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
await hideLoader(loadingState);
form.hidden = !hasSession;
invalidState.hidden = hasSession;

if (!hasSession) {
  // Supabase reports link problems (e.g. otp_expired) in the URL fragment or query.
  const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search);
  const reason = params.get('error_description');
  if (reason) {
    const detail = document.createElement('p');
    detail.className = 'mb-0 mt-2 small';
    detail.textContent = `Reason: ${reason.replaceAll('+', ' ')}`;
    invalidState.append(detail);
  }
}

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
