import { changePassword } from '../services/authService.js';

/** Wires the "Change password" form on the profile page. */
export function initPasswordForm(form) {
  const { currentPassword, newPassword, confirmPassword } = form.elements;
  const message = form.querySelector('#password-message');
  const submit = form.querySelector('button[type="submit"]');

  const showMessage = (text, kind) => {
    message.className = `small mb-3 text-${kind}`;
    message.textContent = text;
  };

  confirmPassword.addEventListener('input', () => confirmPassword.setCustomValidity(''));
  form.addEventListener('input', () => {
    message.textContent = '';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    confirmPassword.setCustomValidity(
      confirmPassword.value === newPassword.value ? '' : 'Passwords do not match.',
    );
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    submit.disabled = true;
    showMessage('Changing your password…', 'muted');
    try {
      await changePassword({
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      });
      form.reset();
      form.classList.remove('was-validated');
      showMessage('Your password has been changed.', 'success');
    } catch (error) {
      showMessage(error.message, 'danger');
    } finally {
      submit.disabled = false;
    }
  });
}
