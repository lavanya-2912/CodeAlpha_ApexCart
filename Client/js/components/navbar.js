import state from '../state.js';
import { logoutUser } from '../services/auth.js';
import { showToast } from './toast.js';

export const renderNavbar = (container) => {
  if (!container) return;

  const user = state.get('user');
  const cart = state.get('cart');
  const cartItemsCount = cart && cart.items ? cart.items.reduce((acc, item) => acc + (item.saveForLater ? 0 : item.quantity), 0) : 0;
  const currentTheme = state.get('theme');

  const navbarHtml = `
    <nav class="navbar navbar-expand-lg navbar-custom sticky-top py-3">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center fw-bold fs-3 text-primary" href="#/">
          <i class="bi bi-rocket-takeoff-fill me-2"></i>
          <span>ApexCart</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link nav-link-custom ${window.location.hash === '#/' || window.location.hash === '' ? 'active' : ''}" href="#/">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link nav-link-custom ${window.location.hash.startsWith('#/products') ? 'active' : ''}" href="#/products">Shop Products</a>
            </li>
          </ul>
          
          <!-- Instant Search Bar -->
          <form id="nav-search-form" class="d-flex mx-lg-3 my-2 my-lg-0 position-relative" style="max-width: 400px; width: 100%;">
            <div class="input-group">
              <input id="nav-search-input" class="form-control border-end-0 rounded-start-pill bg-light border-color" type="search" placeholder="Search products..." aria-label="Search" required autocomplete="off">
              <button class="btn btn-light border border-start-0 rounded-end-pill text-muted bg-light border-color" type="submit">
                <i class="bi bi-search"></i>
              </button>
            </div>
            <div id="nav-search-suggestions" class="dropdown-menu w-100 p-2 shadow" style="display: none; position: absolute; top: 40px; left: 0; z-index: 1000;"></div>
          </form>

          <div class="d-flex align-items-center gap-3">
            <!-- Theme Toggle Button -->
            <button id="theme-toggle-btn" class="btn btn-outline-secondary rounded-circle border-0 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;" aria-label="Toggle theme">
              <i class="bi ${currentTheme === 'dark' ? 'bi-sun-fill text-warning' : 'bi-moon-fill'} fs-5"></i>
            </button>

            <!-- Wishlist Link -->
            <a href="#/dashboard?tab=wishlist" class="btn btn-outline-secondary rounded-circle border-0 d-flex align-items-center justify-content-center position-relative" style="width: 40px; height: 40px;" title="Wishlist">
              <i class="bi bi-heart fs-5"></i>
            </a>

            <!-- Cart Trigger Badge -->
            <a href="#/cart" class="btn btn-outline-primary rounded-circle border-0 d-flex align-items-center justify-content-center position-relative" style="width: 40px; height: 40px;" title="Shopping Cart">
              <i class="bi bi-cart3 fs-5"></i>
              ${cartItemsCount > 0 ? `<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size: 0.7rem;">${cartItemsCount}</span>` : ''}
            </a>

            <!-- Authentication Dropdown / Buttons -->
            ${
              user
                ? `
                <div class="dropdown">
                  <button class="btn btn-light rounded-pill border d-flex align-items-center gap-2 p-1 pe-3" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <img src="${user.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'}" alt="Avatar" class="rounded-circle" style="width: 32px; height: 32px; object-fit: cover;">
                    <span class="fw-semibold text-truncate" style="max-width: 80px;">${user.name.split(' ')[0]}</span>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2 p-2" style="border-radius: 12px;">
                    ${user.role === 'admin' ? `<li><a class="dropdown-item rounded-3 text-primary" href="#/admin"><i class="bi bi-shield-lock me-2"></i>Admin Panel</a></li><li><hr class="dropdown-divider"></li>` : ''}
                    <li><a class="dropdown-item rounded-3" href="#/dashboard"><i class="bi bi-person me-2"></i>My Dashboard</a></li>
                    <li><a class="dropdown-item rounded-3" href="#/dashboard?tab=orders"><i class="bi bi-bag-check me-2"></i>My Orders</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button id="logout-btn" class="dropdown-item rounded-3 text-danger"><i class="bi bi-box-arrow-right me-2"></i>Sign Out</button></li>
                  </ul>
                </div>
              `
                : `
                <a href="#/login" class="btn btn-outline-primary rounded-pill px-4 fw-semibold">Sign In</a>
                <a href="#/register" class="btn btn-primary rounded-pill px-4 fw-semibold">Sign Up</a>
              `
            }
          </div>
        </div>
      </div>
    </nav>
  `;

  container.innerHTML = navbarHtml;

  // Add search autocomplete and submissions listeners
  const searchForm = document.getElementById('nav-search-form');
  const searchInput = document.getElementById('nav-search-input');
  
  // Prefill search input if query exists in url
  if (window.location.hash.startsWith('#/products')) {
    const query = new URLSearchParams(window.location.hash.split('?')[1] || '').get('search');
    if (query) searchInput.value = query;
  }

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      state.addSearchQuery(query);
      window.location.hash = `#/products?search=${encodeURIComponent(query)}`;
    }
  });

  // Theme Toggler
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  themeToggleBtn.addEventListener('click', () => {
    const newTheme = state.get('theme') === 'dark' ? 'light' : 'dark';
    state.set('theme', newTheme);
  });

  // Logout Trigger
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logoutUser();
      showToast('Signed out successfully');
      window.location.hash = '#/';
    });
  }
};
