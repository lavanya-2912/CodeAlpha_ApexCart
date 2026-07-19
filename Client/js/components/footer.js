import { showToast } from './toast.js';

export const renderFooter = (container) => {
  if (!container) return;

  const footerHtml = `
    <footer class="bg-dark text-white pt-5 pb-4 mt-auto border-top border-secondary">
      <div class="container text-md-left">
        <div class="row text-md-left">
          
          <div class="col-md-3 col-lg-3 col-xl-3 mx-auto mt-3">
            <h5 class="text-uppercase mb-4 font-weight-bold text-primary">
              <i class="bi bi-rocket-takeoff-fill me-2"></i>ApexCart
            </h5>
            <p class="text-muted">
              ApexCart is a high-performance premium e-commerce platform offering state-of-the-art products, seamless checkout gates, and responsive interfaces.
            </p>
          </div>

          <div class="col-md-2 col-lg-2 col-xl-2 mx-auto mt-3">
            <h5 class="text-uppercase mb-4 font-weight-bold text-warning">Quick Shop</h5>
            <p><a href="#/products?category=Electronics" class="text-muted text-decoration-none">Electronics</a></p>
            <p><a href="#/products?category=Fashion" class="text-muted text-decoration-none">Fashion Wear</a></p>
            <p><a href="#/products?category=Home" class="text-muted text-decoration-none">Home & Living</a></p>
            <p><a href="#/products?category=Books" class="text-muted text-decoration-none">Book Store</a></p>
          </div>

          <div class="col-md-3 col-lg-2 col-xl-2 mx-auto mt-3">
            <h5 class="text-uppercase mb-4 font-weight-bold text-warning">Links</h5>
            <p><a href="#/dashboard" class="text-muted text-decoration-none">Your Account</a></p>
            <p><a href="#/dashboard?tab=orders" class="text-muted text-decoration-none">Track Orders</a></p>
            <p><a href="#/dashboard?tab=wishlist" class="text-muted text-decoration-none">Your Wishlist</a></p>
            <p><a href="#/" class="text-muted text-decoration-none">Home Base</a></p>
          </div>

          <div class="col-md-4 col-lg-3 col-xl-3 mx-auto mt-3">
            <h5 class="text-uppercase mb-4 font-weight-bold text-warning">Newsletter</h5>
            <p class="text-muted mb-3">Subscribe to get notifications of special deals and flash sales.</p>
            <form id="newsletter-form">
              <div class="input-group mb-3">
                <input type="email" id="newsletter-email" class="form-control rounded-start bg-transparent text-white border-secondary" placeholder="Your Email..." aria-label="Subscriber Email" required>
                <button class="btn btn-primary" type="submit">Join</button>
              </div>
            </form>
            <div class="mt-3">
              <a href="#" class="btn btn-outline-light btn-sm rounded-circle me-2"><i class="bi bi-facebook"></i></a>
              <a href="#" class="btn btn-outline-light btn-sm rounded-circle me-2"><i class="bi bi-twitter-x"></i></a>
              <a href="#" class="btn btn-outline-light btn-sm rounded-circle me-2"><i class="bi bi-instagram"></i></a>
              <a href="#" class="btn btn-outline-light btn-sm rounded-circle"><i class="bi bi-linkedin"></i></a>
            </div>
          </div>
          
        </div>

        <hr class="mb-4 mt-4 border-secondary">

        <div class="row align-items-center">
          <div class="col-md-7 col-lg-8">
            <p class="text-muted mb-0">
              © 2026 Copyright: <strong class="text-primary">ApexCart Inc.</strong> All rights reserved.
            </p>
          </div>
          <div class="col-md-5 col-lg-4 text-end">
            <img src="https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=80&q=80" alt="Secure Gateway" style="height: 30px; filter: grayscale(100%) brightness(1.5);">
          </div>
        </div>
      </div>
    </footer>
  `;

  container.innerHTML = footerHtml;

  const newsletterForm = document.getElementById('newsletter-form');
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('newsletter-email').value;
    if (email) {
      showToast('Thank you for subscribing to our newsletter!', 'success');
      document.getElementById('newsletter-email').value = '';
    }
  });
};
