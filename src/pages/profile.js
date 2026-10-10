import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import '../styles/main.css';
import { createNavbar } from '../components/navbar.js';
import {
  getCurrentProfile,
  removeCurrentProfileAvatar,
  replaceCurrentProfileAvatar,
  updateCurrentProfile,
} from '../services/profileService.js';
import {
  getProfileAvatarUrl,
  validateProfileAvatar,
} from '../services/storageService.js';
import { requireAuth } from '../utils/guards.js';

document.querySelector('#site-header').append(createNavbar());

const loadingState = document.querySelector('#loading-state');
const errorState = document.querySelector('#error-state');
const form = document.querySelector('#profile-form');
const displayNameInput = form.elements.display_name;
const submitButton = form.querySelector('button[type="submit"]');
const message = document.querySelector('#profile-message');
const avatarSection = document.querySelector('.profile-avatar-section');
const avatarForm = document.querySelector('#avatar-form');
const avatarFileInput = avatarForm.elements.avatar;
const avatarPreview = document.querySelector('#avatar-preview');
const avatarMessage = document.querySelector('#avatar-message');
const saveAvatarButton = document.querySelector('#save-avatar');
const removeAvatarButton = document.querySelector('#remove-avatar');
let currentProfile;
let previewObjectUrl;
let currentAvatarUrl = null;

try {
  const user = await requireAuth();
  if (user) {
    currentProfile = await getCurrentProfile();
    document.querySelector('#profile-email').value = currentProfile.email;
    displayNameInput.value = currentProfile.display_name ?? '';
    loadingState.hidden = true;
    form.hidden = false;
    avatarSection.hidden = false;
    removeAvatarButton.hidden = !currentProfile.avatar_path;
    if (currentProfile.avatar_path) {
      try {
        currentAvatarUrl = await getProfileAvatarUrl(currentProfile.avatar_path);
        avatarPreview.src = currentAvatarUrl;
        avatarPreview.hidden = false;
      } catch (error) {
        showAvatarMessage(error.message, 'danger');
      }
    }
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
avatarFileInput.addEventListener('change', handleAvatarSelection);
avatarForm.addEventListener('submit', handleAvatarSubmit);
removeAvatarButton.addEventListener('click', handleAvatarRemoval);
window.addEventListener('pagehide', clearPreviewObjectUrl, { once: true });

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

function handleAvatarSelection() {
  avatarMessage.textContent = '';
  restoreCurrentAvatarPreview();
  const [file] = avatarFileInput.files;
  if (!file) return;

  try {
    validateProfileAvatar(file);
    previewObjectUrl = URL.createObjectURL(file);
    avatarPreview.src = previewObjectUrl;
    avatarPreview.hidden = false;
  } catch (error) {
    avatarFileInput.value = '';
    showAvatarMessage(error.message, 'danger');
  }
}

async function handleAvatarSubmit(event) {
  event.preventDefault();
  const [file] = avatarFileInput.files;
  saveAvatarButton.disabled = true;
  removeAvatarButton.disabled = true;
  showAvatarMessage('Uploading your profile photo…', 'muted');
  try {
    const result = await replaceCurrentProfileAvatar(file, currentProfile.avatar_path);
    currentProfile = { ...currentProfile, ...result.profile };
    removeAvatarButton.hidden = false;
    avatarFileInput.value = '';
    clearPreviewObjectUrl();
    const warnings = [];
    if (result.cleanupError) {
      warnings.push(`The previous photo could not be removed: ${result.cleanupError}`);
    }
    try {
      currentAvatarUrl = await getProfileAvatarUrl(currentProfile.avatar_path);
      avatarPreview.src = currentAvatarUrl;
      avatarPreview.hidden = false;
    } catch (error) {
      currentAvatarUrl = null;
      avatarPreview.removeAttribute('src');
      avatarPreview.hidden = true;
      warnings.push(`The new photo was saved, but its preview could not be loaded: ${error.message}`);
    }
    showAvatarMessage(
      warnings.length
        ? `Your profile photo was updated with a warning. ${warnings.join(' ')}`
        : 'Your profile photo has been updated.',
      warnings.length ? 'warning' : 'success',
    );
  } catch (error) {
    showAvatarMessage(error.message, 'danger');
  } finally {
    saveAvatarButton.disabled = false;
    removeAvatarButton.disabled = !currentProfile.avatar_path;
  }
}

async function handleAvatarRemoval() {
  if (!currentProfile.avatar_path) return;
  saveAvatarButton.disabled = true;
  removeAvatarButton.disabled = true;
  showAvatarMessage('Removing your profile photo…', 'muted');
  try {
    const result = await removeCurrentProfileAvatar(currentProfile.avatar_path);
    currentProfile = { ...currentProfile, ...result.profile };
    currentAvatarUrl = null;
    avatarPreview.removeAttribute('src');
    avatarPreview.hidden = true;
    removeAvatarButton.hidden = true;
    showAvatarMessage(
      result.cleanupError
        ? `Your photo was removed from the profile, but its file could not be deleted: ${result.cleanupError}`
        : 'Your profile photo has been removed.',
      result.cleanupError ? 'warning' : 'success',
    );
  } catch (error) {
    showAvatarMessage(error.message, 'danger');
  } finally {
    saveAvatarButton.disabled = false;
    removeAvatarButton.disabled = !currentProfile.avatar_path;
  }
}

function showAvatarMessage(text, kind) {
  avatarMessage.className = `small mt-2 text-${kind}`;
  avatarMessage.textContent = text;
}

function clearPreviewObjectUrl() {
  if (!previewObjectUrl) return;
  URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = null;
}

function restoreCurrentAvatarPreview() {
  clearPreviewObjectUrl();
  if (currentAvatarUrl) {
    avatarPreview.src = currentAvatarUrl;
    avatarPreview.hidden = false;
  } else {
    avatarPreview.removeAttribute('src');
    avatarPreview.hidden = true;
  }
}
