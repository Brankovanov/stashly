import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import '../styles/main.css';
import { createNavbar } from '../components/navbar.js';
import { createSupply, getSupplyCategories } from '../services/suppliesService.js';
import { requireAuth } from '../utils/guards.js';
import { validateSupplyInput } from '../utils/supplyValidation.js';

document.querySelector('#site-header').append(createNavbar());

const form = document.querySelector('#supply-form');
const loading = document.querySelector('#form-loading');
const error = document.querySelector('#form-error');
const message = document.querySelector('#form-message');
const submitButton = form.querySelector('button[type="submit"]');
const categorySelect = form.elements.category_id;
let categories = [];

try {
  const user = await requireAuth();
  if (user) {
    categories = await getSupplyCategories();
    populateCategories(categories);
    loading.hidden = true;
    form.hidden = false;
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

  submitButton.disabled = true;
  submitButton.textContent = 'Saving…';
  try {
    await createSupply(value);
    window.location.assign('/pages/supplies.html?created=1');
  } catch (saveError) {
    message.className = 'alert alert-danger mt-3';
    message.textContent = saveError.message;
    submitButton.disabled = false;
    submitButton.textContent = 'Save supply';
  }
});

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
