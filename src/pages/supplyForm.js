import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import '../styles/main.css';
import { createNavbar } from '../components/navbar.js';
import {
  createSupply,
  getSupplyById,
  getSupplyCategories,
  updateSupply,
} from '../services/suppliesService.js';
import {
  deleteSupplyPhoto,
  getSupplyPhotoUrls,
  uploadSupplyPhoto,
  validateSupplyPhoto,
} from '../services/storageService.js';
import { requireAuth } from '../utils/guards.js';
import { validateSupplyInput } from '../utils/supplyValidation.js';

document.querySelector('#site-header').append(createNavbar());

const form = document.querySelector('#supply-form');
const loading = document.querySelector('#form-loading');
const error = document.querySelector('#form-error');
const message = document.querySelector('#form-message');
const submitButton = form.querySelector('button[type="submit"]');
const categorySelect = form.elements.category_id;
const photoInput = form.elements.photo;
const photoPreview = document.querySelector('#photo-preview');
const removePhotoOption = document.querySelector('#remove-photo-option');
const supplyId = new URLSearchParams(window.location.search).get('id');
const isEditing = Boolean(supplyId);
let existingPhotoPath = null;
let existingPhotoUrl = null;
let previewObjectUrl = null;

try {
  const user = await requireAuth();
  if (user) {
    const [categories, supply] = await Promise.all([
      getSupplyCategories(),
      isEditing ? getSupplyById(supplyId) : Promise.resolve(null),
    ]);
    existingPhotoPath = supply?.photo_path ?? null;
    populateCategories(categories);
    if (supply) {
      const photoUrls = await getSupplyPhotoUrls([existingPhotoPath]);
      existingPhotoUrl = photoUrls.get(existingPhotoPath) ?? null;
      populateForm(supply, existingPhotoUrl);
    }

    function showPhotoPreviewAfterInvalidSelection(errorMessage) {
      if (form.elements.remove_photo.checked) photoPreview.hidden = true;
      else if (existingPhotoUrl) showPhotoPreview(existingPhotoUrl, 'Current photo');
      else photoPreview.hidden = true;
      showMessage(errorMessage, 'danger');
    }
    loading.hidden = true;
    form.hidden = false;
    if (isEditing) {
      document.title = 'Edit supply — Stashly';
      document.querySelector('#form-title').textContent = 'Edit supply';
      submitButton.textContent = 'Save changes';
    }
    if (categories.length === 0) {
      error.textContent = 'No categories are available yet. Apply the category seed migration or ask an administrator to add categories.';
      error.hidden = false;
      submitButton.disabled = true;
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

  const { errors, value } = validateSupplyInput(readFormValues());
  showValidationErrors(errors);
  if (Object.keys(errors).length > 0) return;
  try {
    validateSupplyPhoto(photoInput.files[0]);
  } catch (photoError) {
    showMessage(photoError.message, 'danger');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Saving…';
  let uploadedPhotoPath = null;
  let saved = false;
  try {
    const selectedPhoto = photoInput.files[0];
    if (selectedPhoto) uploadedPhotoPath = await uploadSupplyPhoto(selectedPhoto);
    const photoPath =
      uploadedPhotoPath ??
      (form.elements.remove_photo.checked ? null : existingPhotoPath);
    const supply = { ...value, photo_path: photoPath };

    if (isEditing) await updateSupply(supplyId, supply);
    else await createSupply(supply);
    saved = true;
  } catch (saveError) {
    if (uploadedPhotoPath) {
      try {
        await deleteSupplyPhoto(uploadedPhotoPath);
      } catch (cleanupError) {
        showMessage(
          `${saveError.message} The uploaded photo could not be cleaned up (${cleanupError.message}); stored path: ${uploadedPhotoPath}`,
          'danger',
        );
      }
    }
    if (!message.textContent) showMessage(saveError.message, 'danger');
  }

  if (saved) {
    let cleanupWarning = false;
    const photoChanged = existingPhotoPath && existingPhotoPath !==
      (uploadedPhotoPath ?? (form.elements.remove_photo.checked ? null : existingPhotoPath));
    if (photoChanged) {
      try {
        await deleteSupplyPhoto(existingPhotoPath);
      } catch {
        cleanupWarning = true;
      }
    }
    const result = isEditing ? 'updated' : 'created';
    const cleanupParam = cleanupWarning ? '&photoCleanup=1' : '';
    window.location.assign(
      `/pages/supplies.html?${result}=1${cleanupParam}`,
    );
    return;
  }

  submitButton.disabled = false;
  submitButton.textContent = isEditing ? 'Save changes' : 'Save supply';
});

photoInput.addEventListener('change', () => {
  message.textContent = '';
  const file = photoInput.files[0];
  if (!file) {
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
    photoPreview.hidden = true;
    return;
  }

  try {
    validateSupplyPhoto(file);
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = URL.createObjectURL(file);
    form.elements.remove_photo.checked = false;
    showPhotoPreview(previewObjectUrl, file.name);
  } catch (photoError) {
    photoInput.value = '';
    showPhotoPreviewAfterInvalidSelection(photoError.message);
  }
});

form.elements.remove_photo.addEventListener('change', () => {
  if (photoInput.files[0]) return;
  if (form.elements.remove_photo.checked) {
    photoPreview.hidden = true;
  } else if (existingPhotoUrl) {
    showPhotoPreview(existingPhotoUrl, 'Current photo');
  }
});

window.addEventListener('pagehide', () => {
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
});

function showMessage(text, kind) {
  message.className = `alert alert-${kind} mt-3`;
  message.textContent = text;
}

function populateCategories(items) {
  for (const category of items) {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.append(option);
  }
}

function readFormValues() {
  return {
    category_id: form.elements.category_id.value,
    name: form.elements.name.value,
    brand: form.elements.brand.value,
    color_code: form.elements.color_code.value,
    color_hex: form.elements.color_hex.value,
    quantity: form.elements.quantity.value,
    unit: form.elements.unit.value,
    notes: form.elements.notes.value,
  };
}

function populateForm(supply, photoUrl) {
  form.elements.category_id.value = supply.category_id ?? '';
  form.elements.name.value = supply.name;
  form.elements.brand.value = supply.brand ?? '';
  form.elements.color_code.value = supply.color_code ?? '';
  form.elements.color_hex.value = supply.color_hex ?? '';
  form.elements.quantity.value = supply.quantity;
  form.elements.unit.value = supply.unit ?? '';
  form.elements.notes.value = supply.notes ?? '';
  if (supply.photo_path) {
    removePhotoOption.hidden = false;
    if (photoUrl) showPhotoPreview(photoUrl, 'Current photo');
  }
}

function showPhotoPreview(url, caption) {
  const image = photoPreview.querySelector('img');
  image.src = url;
  image.alt = caption === 'Current photo' ? 'Current supply photo' : 'Selected supply photo preview';
  photoPreview.querySelector('[data-preview-caption]').textContent = caption;
  photoPreview.hidden = false;
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
