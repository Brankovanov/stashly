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
        </ul>
      </div>
    </div>
  `;

  return nav;
}
