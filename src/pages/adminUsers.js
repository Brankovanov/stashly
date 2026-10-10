import { getAdminUsers, setAdminUserRole } from '../services/adminService.js';

const list = document.querySelector('#user-list');
const message = document.querySelector('#user-message');
let users = [];

export function initializeAdminUsers(loadedUsers, adminId) {
  users = loadedUsers;
  renderUsers();
  list.addEventListener('click', (event) => handleAction(event, adminId));
}

function renderUsers() {
  list.replaceChildren(...users.map(createUserRow));
  document.querySelector('#user-list-count').textContent =
    `${users.length} ${users.length === 1 ? 'account' : 'accounts'}`;
  document.querySelector('#user-empty').hidden = users.length > 0;
  document.querySelector('#user-table').hidden = users.length === 0;
}

function createUserRow(user) {
  const row = document.createElement('tr');
  const account = document.createElement('td');
  const email = document.createElement('div');
  email.className = 'fw-semibold';
  email.textContent = user.email || 'Email unavailable';
  const displayName = document.createElement('div');
  displayName.className = 'small text-muted';
  displayName.textContent = user.display_name || 'No display name';
  account.append(email, displayName);

  const joined = document.createElement('td');
  joined.textContent = new Date(user.created_at).toLocaleDateString();
  const roleCell = document.createElement('td');
  const select = document.createElement('select');
  select.className = 'form-select form-select-sm admin-role-select';
  select.dataset.roleForUser = user.user_id;
  for (const [value, label] of [['user', 'User'], ['admin', 'Admin']]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    option.selected = user.role === value;
    select.append(option);
  }
  roleCell.append(select);

  const actions = document.createElement('td');
  const save = document.createElement('button');
  save.className = 'btn btn-sm btn-outline-primary';
  save.type = 'button';
  save.dataset.saveRole = user.user_id;
  save.textContent = 'Save role';
  actions.append(save);
  row.append(account, joined, roleCell, actions);
  return row;
}

async function handleAction(event, adminId) {
  const button = event.target.closest('button[data-save-role]');
  if (!button) return;
  const user = users.find((item) => item.user_id === button.dataset.saveRole);
  const select = button.closest('tr').querySelector('select[data-role-for-user]');
  if (!user || !select || select.value === user.role) return;

  const actionLabel = select.value === 'admin' ? 'Grant administrator access to' : 'Remove administrator access from';
  if (
    !window.confirm(`${actionLabel} ${user.email || 'this account'}?`) &&
    (user.role === 'admin' || select.value === 'admin')
  ) {
    select.value = user.role;
    return;
  }

  button.disabled = true;
  try {
    await setAdminUserRole(user.user_id, select.value);
    if (user.user_id === adminId && select.value === 'user') {
      window.location.assign('/');
      return;
    }
    try {
      users = await getAdminUsers();
      renderUsers();
      showMessage('User role updated.', 'success');
    } catch (error) {
      button.disabled = false;
      showMessage(`User role updated, but the account list could not refresh: ${error.message}`, 'warning');
    }
  } catch (error) {
    button.disabled = false;
    select.value = user.role;
    showMessage(error.message, 'danger');
  }
}

function showMessage(text, kind) {
  message.className = `small mb-3 text-${kind}`;
  message.textContent = text;
}
