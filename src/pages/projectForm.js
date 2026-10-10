import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import '../styles/main.css';
import { createNavbar } from '../components/navbar.js';
import {
  createProject,
  getProjectById,
  updateProject,
} from '../services/projectsService.js';
import {
  deleteProjectFile,
  uploadProjectFile,
  validateProjectFile,
} from '../services/storageService.js';
import { requireAuth } from '../utils/guards.js';
import { validateProjectInput } from '../utils/projectValidation.js';

document.querySelector('#site-header').append(createNavbar());

const form = document.querySelector('#project-form');
const loading = document.querySelector('#form-loading');
const error = document.querySelector('#form-error');
const message = document.querySelector('#form-message');
const submitButton = form.querySelector('button[type="submit"]');
const coverInput = form.elements.cover_file;
const patternInput = form.elements.pattern_file;
const projectId = new URLSearchParams(window.location.search).get('id');
const isEditing = Boolean(projectId);
const fileState = {
  cover: { existingPath: null, objectUrl: null },
  pattern: { existingPath: null, objectUrl: null },
};
let currentUser;
let projectOwnerId;

try {
  currentUser = await requireAuth();
  if (currentUser) {
    const project = isEditing ? await getProjectById(projectId) : null;
    projectOwnerId = project?.user_id ?? currentUser.id;
    if (project) await populateForm(project);
    loading.hidden = true;
    form.hidden = false;
    if (isEditing) {
      document.title = 'Edit project — Stashly';
      document.querySelector('#form-title').textContent = 'Edit project';
      submitButton.textContent = 'Save changes';
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

  const { errors, value } = validateProjectInput({
    title: form.elements.title.value,
    description: form.elements.description.value,
    status: form.elements.status.value,
  });
  showValidationErrors(errors);
  if (Object.keys(errors).length > 0) return;
  try {
    validateProjectFile(coverInput.files[0], 'cover');
    validateProjectFile(patternInput.files[0], 'pattern');
  } catch (fileError) {
    showMessage(fileError.message, 'danger');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Saving…';
  const targetProjectId = isEditing ? projectId : crypto.randomUUID();
  const uploadedPaths = [];
  let saved = false;
  try {
    const coverPath = await uploadSelectedFile(
      coverInput.files[0],
      'cover',
      targetProjectId,
      uploadedPaths,
    );
    const patternPath = await uploadSelectedFile(
      patternInput.files[0],
      'pattern',
      targetProjectId,
      uploadedPaths,
    );
    const updatedProject = {
      ...value,
      ...(isEditing ? {} : { id: targetProjectId }),
      cover_path: coverPath ?? (form.elements.remove_cover.checked ? null : fileState.cover.existingPath),
      pattern_path: patternPath ?? (form.elements.remove_pattern.checked ? null : fileState.pattern.existingPath),
    };

    if (isEditing) await updateProject(targetProjectId, updatedProject);
    else await createProject(updatedProject);
    saved = true;
  } catch (saveError) {
    const cleanupFailures = await cleanupUploadedFiles(uploadedPaths);
    const cleanupDetails = cleanupFailures.length
      ? ` Uploaded files could not be cleaned up: ${cleanupFailures.join(', ')}. ${cleanupFailures.map((path) => `Path: ${path}`).join('; ')}`
      : '';
    showMessage(`${saveError.message}${cleanupDetails}`, 'danger');
  }

  if (saved) {
    const newPaths = new Set(uploadedPaths);
    const removedPaths = ['cover', 'pattern']
      .map((kind) => fileState[kind].existingPath)
      .filter((path) => path && !newPaths.has(path))
      .filter((path) =>
        path === fileState.cover.existingPath
          ? updatedFileChanged('cover', path)
          : updatedFileChanged('pattern', path),
      );
    const cleanupFailures = [];
    for (const path of removedPaths) {
      try {
        await deleteProjectFile(path);
      } catch {
        cleanupFailures.push(path);
      }
    }
    const action = isEditing ? 'updated' : 'created';
    const params = new URLSearchParams({ [action]: '1' });
    if (cleanupFailures.length) params.set('fileCleanup', cleanupFailures.join(','));
    window.location.assign(`/pages/projects.html?${params}`);
    return;
  }

  submitButton.disabled = false;
  submitButton.textContent = isEditing ? 'Save changes' : 'Save project';
});

coverInput.addEventListener('change', () =>
  handleFileSelection(coverInput.files[0], 'cover'),
);
patternInput.addEventListener('change', () =>
  handleFileSelection(patternInput.files[0], 'pattern'),
);

for (const kind of ['cover', 'pattern']) {
  form.elements[`remove_${kind}`].addEventListener('change', () => {
    if (form.elements[`remove_${kind}`].checked) {
      document.querySelector(`#${kind}-preview`).hidden = true;
    } else if (fileState[kind].existingPath) {
      renderExistingFile(kind, fileState[kind].url);
    }
  });
}

window.addEventListener('pagehide', () => {
  for (const { objectUrl } of Object.values(fileState)) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
});

async function populateForm(project) {
  form.elements.title.value = project.title;
  form.elements.description.value = project.description ?? '';
  form.elements.status.value = project.status;
  for (const [kind, path, url] of [
    ['cover', project.cover_path, project.cover_url],
    ['pattern', project.pattern_path, project.pattern_url],
  ]) {
    fileState[kind].existingPath = path;
    fileState[kind].url = url;
    if (path) {
      document.querySelector(`#remove-${kind}-option`).hidden = false;
      renderExistingFile(kind, url);
    }
  }
}

async function uploadSelectedFile(file, kind, targetProjectId, uploadedPaths) {
  if (!file) return null;
  const path = await uploadProjectFile(
    file,
    projectOwnerId,
    targetProjectId,
    kind,
  );
  uploadedPaths.push(path);
  return path;
}

async function cleanupUploadedFiles(paths) {
  const failures = [];
  for (const path of paths) {
    try {
      await deleteProjectFile(path);
    } catch {
      failures.push(path);
    }
  }
  return failures;
}

function updatedFileChanged(kind, oldPath) {
  const selected = kind === 'cover' ? coverInput.files[0] : patternInput.files[0];
  return Boolean(selected || form.elements[`remove_${kind}`].checked || !oldPath);
}

function handleFileSelection(file, kind) {
  message.textContent = '';
  const preview = document.querySelector(`#${kind}-preview`);
  if (!file) {
    if (fileState[kind].objectUrl) URL.revokeObjectURL(fileState[kind].objectUrl);
    fileState[kind].objectUrl = null;
    if (fileState[kind].existingPath && !form.elements[`remove_${kind}`].checked) {
      renderExistingFile(kind, fileState[kind].url);
    } else {
      preview.hidden = true;
    }
    return;
  }

  try {
    validateProjectFile(file, kind);
    if (fileState[kind].objectUrl) URL.revokeObjectURL(fileState[kind].objectUrl);
    fileState[kind].objectUrl = URL.createObjectURL(file);
    form.elements[`remove_${kind}`].checked = false;
    renderProjectFile(kind, fileState[kind].objectUrl, file.name, file.type);
  } catch (fileError) {
    if (kind === 'cover') coverInput.value = '';
    else patternInput.value = '';
    showMessage(fileError.message, 'danger');
    if (fileState[kind].existingPath) renderExistingFile(kind, fileState[kind].url);
    else preview.hidden = true;
  }
}

function renderExistingFile(kind, url) {
  const path = fileState[kind].existingPath;
  const filename = path?.split('/').at(-1) ?? `${kind} file`;
  const type = filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/*';
  renderProjectFile(kind, url, filename, type);
}

function renderProjectFile(kind, url, label, type) {
  if (!url) return;
  const preview = document.querySelector(`#${kind}-preview`);
  const image = preview.querySelector('img');
  const link = preview.querySelector('a');
  if (kind === 'pattern' && type === 'application/pdf') {
    image.hidden = true;
    link.href = url;
    link.textContent = `Open ${label}`;
    link.hidden = false;
  } else {
    link.hidden = true;
    image.src = url;
    image.alt = `${kind === 'cover' ? 'Project cover' : 'Pattern'}: ${label}`;
    image.hidden = false;
  }
  preview.querySelector('[data-preview-caption]').textContent = label;
  preview.hidden = false;
}

function showMessage(text, kind) {
  message.className = `alert alert-${kind} mt-3`;
  message.textContent = text;
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
