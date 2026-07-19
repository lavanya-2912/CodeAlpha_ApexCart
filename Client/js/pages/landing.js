import { fetchLandingProducts, fetchCategories } from '../services/product.js';
import { createProductCard } from '../components/productCard.js';
import { renderProductGridSkeleton } from '../components/skeletons.js';

export const renderLanding = async (container) => {
  // Set up container base html
  container.innerHTML = `
    <!-- Hero Section -->
    <section class="gradient-hero py-5 mb-5">
      <div class="container py-5">
        <div class="row align-items-center">
          <div class="col-lg-6 mb-5 mb-lg-0 text-center text-lg-start">
            <span class="badge bg-primary-subtle text-primary rounded-pill px-3 py-2 mb-3 fw-bold fs-7">
              <i class="bi bi-fire me-1"></i>SUMMER FLASH SALE - UP TO 50% OFF
            </span>
            <h1 class="display-3 fw-extrabold text-heading mb-3" style="line-height: 1.15;">
              Next Gen <span class="gradient-text">E-Commerce</span> Experience
            </h1>
            <p class="lead text-muted mb-4">
              Explore the latest releases in technology, modern fashion wear, custom home accessories, and classic reading materials at ApexCart.
            </p>
            <div class="d-flex flex-wrap justify-content-center justify-content-lg-start gap-3">
              <a href="#/products" class="btn btn-premium btn-primary px-5 py-3">
                <i class="bi bi-bag-heart me-2"></i>Shop Catalog
              </a>
              <a href="#/products?sort=popularity" class="btn btn-premium btn-outline-secondary px-5 py-3 bg-white">
                View Hot Deals
              </a>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="position-relative max-width-500 mx-auto">
              <!-- Visual Mockup Image -->
              <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&h=400&q=80" alt="Apex Showcase" class="img-fluid rounded-4 shadow-lg border" style="transform: rotate(-3deg);">
              <div class="position-absolute bottom-0 start-0 translate-middle-y bg-white rounded-3 shadow-lg p-3 border d-flex align-items-center gap-3" style="border-radius:12px; margin-left: 20px;">
                <div class="bg-success-subtle text-success rounded-circle p-2 fs-4 d-flex align-items-center justify-content-center" style="width:48px; height:48px;">
                  <i class="bi bi-shield-check"></i>
                </div>
                <div>
                  <h6 class="mb-0 fw-bold">100% Secure Checkout</h6>
                  <small class="text-muted">Stripe Verified Gates</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories Grid -->
    <section class="container mb-5 py-3">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 class="fw-bold mb-1">Browse Categories</h2>
          <p class="text-muted mb-0">Select a category to view matched products</p>
        </div>
      </div>
      <div id="landing-categories-list" class="row g-4">
        <!-- Rendered dynamically -->
      </div>
    </section>

    <!-- Flash Sale Special Offer Banner -->
    <section class="container mb-5">
      <div class="glass-panel p-5 gradient-primary text-white text-center position-relative overflow-hidden" style="border-radius:24px;">
        <div class="position-relative z-index-2">
          <span class="badge bg-warning text-dark px-3 py-2 mb-3 fw-bold">FLASH DEAL OF THE MONTH</span>
          <h2 class="display-5 fw-extrabold mb-3">Save 10% on Everything!</h2>
          <p class="lead mb-4 max-width-600 mx-auto">Use coupon code <strong class="bg-dark text-warning px-3 py-1 rounded fs-4 border border-warning">SAVE10</strong> at checkout to apply a 10% discount across all products.</p>
          <a href="#/products" class="btn btn-warning text-dark fw-bold btn-premium px-5 py-3 rounded-pill">Shop Flash Sale Items</a>
        </div>
      </div>
    </section>

    <!-- Featured Products section -->
    <section class="container mb-5 py-3">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 class="fw-bold mb-1">Featured Products</h2>
          <p class="text-muted mb-0">Handpicked premium products chosen for you</p>
        </div>
      </div>
      <div id="featured-products-container" class="row">
        <!-- Product card skeletons -->
      </div>
    </section>

    <!-- Latest Arrivals section -->
    <section class="container mb-5 py-3">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 class="fw-bold mb-1">Latest Arrivals</h2>
          <p class="text-muted mb-0">Browse recently added stock products</p>
        </div>
      </div>
      <div id="latest-products-container" class="row">
        <!-- Product card skeletons -->
      </div>
    </section>

    <!-- Trending Products section -->
    <section class="container mb-5 py-3">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 class="fw-bold mb-1">Trending Products</h2>
          <p class="text-muted mb-0">Hot releases currently in high demand</p>
        </div>
      </div>
      <div id="trending-products-container" class="row">
        <!-- Product card skeletons -->
      </div>
    </section>

    <!-- Customer Testimonials -->
    <section class="bg-light py-5 mb-5 border-top border-bottom">
      <div class="container py-3">
        <div class="text-center mb-5">
          <h2 class="fw-bold">What Our Customers Say</h2>
          <p class="text-muted">Over 10,000+ satisfied checkouts and counting</p>
        </div>
        <div class="row g-4">
          <div class="col-md-4">
            <div class="glass-panel p-4 h-100 bg-white border-0 shadow-sm">
              <div class="text-warning mb-3">
                <i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i>
              </div>
              <p class="text-secondary italic mb-4">"The checkout was incredibly fast. I ordered the iPhone 15 Pro Max, and it was delivered with tracking timelines matching perfectly. The invoice PDF download was super convenient."</p>
              <div class="d-flex align-items-center gap-3">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&h=80&q=80" alt="Customer" class="rounded-circle border" style="width: 48px; height: 48px; object-fit: cover;">
                <div>
                  <h6 class="mb-0 fw-bold">Sarah Jenkins</h6>
                  <small class="text-muted">Verified Buyer</small>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="glass-panel p-4 h-100 bg-white border-0 shadow-sm">
              <div class="text-warning mb-3">
                <i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-half"></i>
              </div>
              <p class="text-secondary italic mb-4">"Fantastic selection of items. The specifications map let me check the bluetooth details. The responsive design works seamlessly on my Android mobile."</p>
              <div class="d-flex align-items-center gap-3">
                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&h=80&q=80" alt="Customer" class="rounded-circle border" style="width: 48px; height: 48px; object-fit: cover;">
                <div>
                  <h6 class="mb-0 fw-bold">David Chen</h6>
                  <small class="text-muted">Verified Buyer</small>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="glass-panel p-4 h-100 bg-white border-0 shadow-sm">
              <div class="text-warning mb-3">
                <i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i>
              </div>
              <p class="text-secondary italic mb-4">"The dark theme looks exceptionally clean! Finding items by discount percentage and sorting by lowest price is so intuitive. Returning items was processed instantly."</p>
              <div class="d-flex align-items-center gap-3">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80" alt="Customer" class="rounded-circle border" style="width: 48px; height: 48px; object-fit: cover;">
                <div>
                  <h6 class="mb-0 fw-bold">Emily Rodriguez</h6>
                  <small class="text-muted">Verified Buyer</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  // Draw skeletons
  renderProductGridSkeleton(document.getElementById('featured-products-container'), 4);
  renderProductGridSkeleton(document.getElementById('latest-products-container'), 4);
  renderProductGridSkeleton(document.getElementById('trending-products-container'), 4);

  try {
    // Load lists data
    const lists = await fetchLandingProducts();
    const categories = await fetchCategories();

    // Draw Categories
    const categoriesContainer = document.getElementById('landing-categories-list');
    categoriesContainer.innerHTML = '';
    categories.slice(0, 4).forEach((cat) => {
      const col = document.createElement('div');
      col.className = 'col-sm-6 col-md-3';
      col.innerHTML = `
        <a href="#/products?category=${cat._id}" class="text-decoration-none">
          <div class="category-card">
            <img src="${cat.image || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=300&q=80'}" alt="${cat.name}">
            <h3 class="category-title">${cat.name}</h3>
          </div>
        </a>
      `;
      categoriesContainer.appendChild(col);
    });

    // Populate Featured
    const featuredContainer = document.getElementById('featured-products-container');
    featuredContainer.innerHTML = '';
    if (lists.featured.length > 0) {
      lists.featured.forEach(prod => {
        featuredContainer.appendChild(createProductCard(prod));
      });
    } else {
      featuredContainer.innerHTML = '<div class="text-center py-4 text-muted w-100">No featured products available.</div>';
    }

    // Populate Latest
    const latestContainer = document.getElementById('latest-products-container');
    latestContainer.innerHTML = '';
    if (lists.latest.length > 0) {
      lists.latest.forEach(prod => {
        latestContainer.appendChild(createProductCard(prod));
      });
    } else {
      latestContainer.innerHTML = '<div class="text-center py-4 text-muted w-100">No arrivals available.</div>';
    }

    // Populate Trending
    const trendingContainer = document.getElementById('trending-products-container');
    trendingContainer.innerHTML = '';
    if (lists.trending.length > 0) {
      lists.trending.forEach(prod => {
        trendingContainer.appendChild(createProductCard(prod));
      });
    } else {
      trendingContainer.innerHTML = '<div class="text-center py-4 text-muted w-100">No trending products available.</div>';
    }

  } catch (err) {
    console.error(err);
    document.getElementById('featured-products-container').innerHTML = '<div class="alert alert-danger w-100">Failed to load catalog feeds.</div>';
    document.getElementById('latest-products-container').innerHTML = '<div class="alert alert-danger w-100">Failed to load catalog feeds.</div>';
    document.getElementById('trending-products-container').innerHTML = '<div class="alert alert-danger w-100">Failed to load catalog feeds.</div>';
  }
};
