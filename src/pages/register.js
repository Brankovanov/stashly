import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import '../styles/main.css';
import { createNavbar } from '../components/navbar.js';
import { getSession, signUp } from '../services/authService.js';

document.querySelector('#site-header').append(createNavbar());

const form = document.querySelector('#register-form');
const message = document.querySelector('#form-message');
const submitButton = form.querySelector('button[type="submit"]');

try {
  if (await getSession()) window.location.replace('/');
} catch (error) {
  message.textContent = error.message;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';

  const password = form.elements.password;
  const confirmation = form.elements.confirmPassword;
  confirmation.setCustomValidity(
    confirmation.value === password.value ? '' : 'Passwords do not match.',
  );
  if (!form.reportValidity()) return;

  submitButton.disabled = true;
  try {
    const { session } = await signUp({
      email: form.elements.email.value.trim(),
      password: password.value,
      displayName: form.elements.displayName.value.trim(),
    });

    if (session) {
      window.location.replace('/');
      return;
    }

    message.classList.remove('text-danger');
    message.classList.add('text-success');
    message.textContent = 'Account created. Check your email to confirm your address, then log in.';
    form.reset();
  } catch (error) {
    message.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

form.elements.confirmPassword.addEventListener('input', () => {
  form.elements.confirmPassword.setCustomValidity('');
  message.classList.remove('text-success');
  message.classList.add('text-danger');
});
