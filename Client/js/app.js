import state from './state.js';
import { loadCurrentUser } from './services/auth.js';
import { syncGuestCartOnLogin } from './services/cart.js';
import { fetchWishlist } from './services/wishlist.js';
import { renderNavbar } from './components/navbar.js';
import { renderFooter } from './components/footer.js';

// Route imports
import { renderLanding } from './pages/landing.js';
import { renderProducts } from './pages/products.js';
import { renderProductDetails } from './pages/productDetails.js';
import { renderCart } from './pages/cart.js';
import { renderCheckout, renderMockStripe, renderCheckoutSuccess } from './pages/checkout.js';
import { renderLogin, renderRegister, renderForgotPassword, renderResetPassword, renderVerifyEmail } from './pages/login.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderAdmin } from './pages/admin.js';

const routes = {
  '#/': renderLanding,
  '#/products': renderProducts,
  '#/product/:id': renderProductDetails,
  '#/cart': renderCart,
  '#/checkout': renderCheckout,
  '#/mock-stripe-checkout': renderMockStripe,
  '#/checkout-success': renderCheckoutSuccess,
  '#/login': renderLogin,
  '#/register': renderRegister,
  '#/forgot-password': renderForgotPassword,
  '#/reset-password': renderResetPassword,
  '#/verify-email': renderVerifyEmail,
  '#/dashboard': renderDashboard,
  '#/admin': renderAdmin,
};

// Route matching engine
const router = async () => {
  const appContainer = document.getElementById('app');
  appContainer.innerHTML = ''; // Clear viewport

  // Smooth scroll to top on page transition
  window.scrollTo({ top: 0, behavior: 'instant' });

  const hash = window.location.hash || '#/';
  
  // Parse query parameters
  const [pathWithParams, queryString] = hash.split('?');
  const query = {};
  if (queryString) {
    queryString.split('&').forEach(param => {
      const [key, val] = param.split('=');
      query[key] = decodeURIComponent(val || '');
    });
  }

  // Route matching with parameters (e.g. #/product/64b07f...)
  let activeRenderer = null;
  let params = {};

  for (const routePattern of Object.keys(routes)) {
    // Convert e.g. #/product/:id to regex
    const routeRegexString = routePattern.replace(/:[a-zA-Z0-9]+/g, '([a-zA-Z0-9]+)');
    const regex = new RegExp(`^${routeRegexString}$`);
    const match = pathWithParams.match(regex);

    if (match) {
      activeRenderer = routes[routePattern];
      
      // Extract route parameters
      const paramNames = (routePattern.match(/:[a-zA-Z0-9]+/g) || []).map(p => p.slice(1));
      paramNames.forEach((name, idx) => {
        params[name] = match[idx + 1];
      });
      break;
    }
  }

  // Guard routes based on roles
  const user = state.get('user');
  
  if (pathWithParams === '#/admin' && (!user || user.role !== 'admin')) {
    window.location.hash = '#/login';
    return;
  }
  
  if (pathWithParams === '#/dashboard' && !user) {
    window.location.hash = '#/login';
    return;
  }

  if (activeRenderer) {
    try {
      // Add loading skeleton or class transitions
      appContainer.classList.remove('fade-in-content');
      void appContainer.offsetWidth; // Trigger reflow for animation reset
      appContainer.classList.add('fade-in-content');
      
      await activeRenderer(appContainer, params, query);
    } catch (err) {
      console.error('Routing render error:', err);
      appContainer.innerHTML = `
        <div class="container py-5 text-center">
          <div class="glass-panel p-5 max-width-600 mx-auto">
            <i class="bi bi-exclamation-triangle text-danger display-1 mb-3"></i>
            <h3 class="mb-3">Render Error</h3>
            <p class="text-muted mb-4">${err.message || 'Unable to build page content. Please refresh or try again later.'}</p>
            <a href="#/" class="btn btn-premium btn-primary">Go to Home</a>
          </div>
        </div>
      `;
    }
  } else {
    // 404 Route Fallback
    appContainer.innerHTML = `
      <div class="container py-5 text-center">
        <div class="glass-panel p-5 max-width-600 mx-auto">
          <i class="bi bi-compass text-warning display-1 mb-3"></i>
          <h3 class="mb-3">Page Not Found</h3>
          <p class="text-muted mb-4">The page you are looking for does not exist or has been relocated.</p>
          <a href="#/" class="btn btn-premium btn-primary">Go to Home</a>
        </div>
      </div>
    `;
  }
};

// Listeners and Initialization
const init = async () => {
  // Set up theme on load
  const currentTheme = state.get('theme');
  document.documentElement.setAttribute('data-bs-theme', currentTheme);

  // Authenticate user check
  const user = await loadCurrentUser();
  if (user) {
    // Sync guest cart to database if items exist
    await syncGuestCartOnLogin();
    // Load wishlist
    await fetchWishlist();
  } else {
    // Load guest states
    state.set('cart', JSON.parse(localStorage.getItem('apexcart_guest_cart')) || { items: [] });
    state.set('wishlist', JSON.parse(localStorage.getItem('apexcart_guest_wishlist')) || []);
  }

  // Draw Shared Elements
  renderNavbar(document.getElementById('navbar-container'));
  renderFooter(document.getElementById('footer-container'));

  // Subscribe navigation nodes to state updates
  state.subscribe('user', () => {
    renderNavbar(document.getElementById('navbar-container'));
  });
  state.subscribe('cart', () => {
    renderNavbar(document.getElementById('navbar-container'));
  });

  // Watch URL changes
  window.addEventListener('hashchange', router);
  
  // First route invocation
  await router();
};

document.addEventListener('DOMContentLoaded', init);
export { router };
