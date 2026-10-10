import {
  getSession,
  getUserRole,
  hasSupabaseConfig,
  onAuthStateChange,
  signOut,
} from '../services/authService.js';

export function createNavbar() {
  const nav = document.createElement('nav');
  nav.className = 'navbar navbar-expand-lg bg-white border-bottom';
  nav.setAttribute('aria-label', 'Main navigation');

  nav.innerHTML = `
    <div class="container">
      <a class="navbar-brand d-flex align-items-center gap-2 fw-semibold" href="/">
        <span class="brand-icon" aria-hidden="true"><i class="bi bi-flower1"></i></span>
        Stashly
      </a>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#primary-navigation"
        aria-controls="primary-navigation"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="primary-navigation">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <a class="nav-link active" aria-current="page" href="/">Home</a>
          </li>
          <li class="nav-item" data-supplies-link hidden>
            <a class="nav-link" href="/pages/supplies.html">My supplies</a>
          </li>
          <li class="nav-item" data-projects-link hidden>
            <a class="nav-link" href="/pages/projects.html">My projects</a>
          </li>
          <li class="nav-item" data-admin-link hidden>
            <a class="nav-link" href="/pages/admin.html">Admin</a>
          </li>
          <li class="nav-item" data-guest-links>
            <a class="nav-link" href="/pages/login.html">Log in</a>
          </li>
          <li class="nav-item" data-guest-links>
            <a class="nav-link" href="/pages/register.html">Register</a>
          </li>
          <li class="nav-item d-flex align-items-center gap-3" data-account-links hidden>
            <a class="nav-link" href="/pages/profile.html">My profile</a>
            <span class="small text-muted" data-account-email></span>
            <button class="btn btn-sm btn-outline-secondary" type="button" data-sign-out>
              Sign out
            </button>
          </li>
        </ul>
        <span
          class="small text-danger ms-3"
          role="alert"
          aria-live="polite"
          data-account-status
        ></span>
      </div>
    </div>
  `;

  for (const link of nav.querySelectorAll('.nav-link')) {
    const isCurrentPage =
      new URL(link.href, window.location.origin).pathname ===
      window.location.pathname;
    link.classList.toggle('active', isCurrentPage);
    if (isCurrentPage) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }

  if (hasSupabaseConfig()) {
    void updateAccountNavigation(nav);
    const subscription = onAuthStateChange(() => {
      window.setTimeout(() => {
        void updateAccountNavigation(nav);
      }, 0);
    });
    window.addEventListener('pagehide', () => subscription.unsubscribe(), {
      once: true,
    });
  }

  return nav;
}

async function updateAccountNavigation(nav) {
  const status = nav.querySelector('[data-account-status]');
  const accountLinks = nav.querySelector('[data-account-links]');
  const email = nav.querySelector('[data-account-email]');
  const adminLink = nav.querySelector('[data-admin-link]');
  const suppliesLink = nav.querySelector('[data-supplies-link]');
  const projectsLink = nav.querySelector('[data-projects-link]');
  const guestLinks = nav.querySelectorAll('[data-guest-links]');
  const signOutButton = nav.querySelector('[data-sign-out]');

  try {
    const session = await getSession();
    status.textContent = '';
    if (!session) {
      guestLinks.forEach((item) => {
        item.hidden = false;
      });
      accountLinks.hidden = true;
      adminLink.hidden = true;
      suppliesLink.hidden = true;
      projectsLink.hidden = true;
      return;
    }

    guestLinks.forEach((item) => {
      item.hidden = true;
    });
    accountLinks.hidden = false;
    suppliesLink.hidden = false;
    projectsLink.hidden = false;
    email.textContent = session.user.email ?? '';
    adminLink.hidden = (await getUserRole(session.user.id)) !== 'admin';

    signOutButton.onclick = async () => {
      signOutButton.disabled = true;
      try {
        await signOut();
        window.location.assign('/');
      } catch (error) {
        status.textContent = `Unable to sign out: ${error.message}`;
        signOutButton.disabled = false;
      }
    };
  } catch (error) {
    status.textContent = `Unable to load account: ${error.message}`;
  }
}
