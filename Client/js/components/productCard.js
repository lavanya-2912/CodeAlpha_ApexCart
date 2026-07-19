import state from '../state.js';
import { addItemToCart } from '../services/cart.js';
import { addItemToWishlist, removeWishlistItem } from '../services/wishlist.js';
import { showToast } from './toast.js';

export const createProductCard = (product) => {
  const card = document.createElement('div');
  card.className = 'col-sm-6 col-md-4 col-lg-3 mb-4';

  const inWishlist = state.get('wishlist').some(
    (p) => (p._id || p) === product._id
  );

  const discountPercent = product.discountPrice > 0 
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100) 
    : 0;

  const originalPrice = `$${product.price.toFixed(2)}`;
  const finalPrice = product.discountPrice > 0 
    ? `$${product.discountPrice.toFixed(2)}` 
    : originalPrice;

  // Star ratings builder
  let starsHtml = '';
  const rating = product.ratingsAverage || 0;
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      starsHtml += '<i class="bi bi-star-fill text-warning me-1"></i>';
    } else if (rating >= i - 0.5) {
      starsHtml += '<i class="bi bi-star-half text-warning me-1"></i>';
    } else {
      starsHtml += '<i class="bi bi-star text-secondary me-1"></i>';
    }
  }

  card.innerHTML = `
    <div class="product-card h-100 d-flex flex-column">
      ${discountPercent > 0 ? `<span class="product-badge bg-danger text-white">${discountPercent}% OFF</span>` : ''}
      
      <!-- Wishlist Heart Toggle Button -->
      <button class="wishlist-btn ${inWishlist ? 'active' : ''}" aria-label="Toggle wishlist">
        <i class="bi ${inWishlist ? 'bi-heart-fill' : 'bi-heart'} fs-5"></i>
      </button>

      <!-- Clickable Card Body -->
      <div class="card-clickable cursor-pointer flex-grow-1" style="cursor: pointer;">
        <div class="img-container">
          <img src="${product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'}" alt="${product.name}" loading="lazy">
        </div>
        <div class="p-3 d-flex flex-column h-auto">
          <div class="d-flex align-items-center mb-1 text-muted fs-7">
            <span class="text-uppercase font-weight-bold" style="font-size:0.75rem">${product.brand ? (product.brand.name || product.brand) : 'Brand'}</span>
          </div>
          <h5 class="card-title text-truncate mb-2" title="${product.name}">${product.name}</h5>
          
          <div class="d-flex align-items-center mb-2">
            <div class="d-flex text-warning fs-8">${starsHtml}</div>
            <span class="text-muted ms-2 fs-7" style="font-size:0.8rem">(${product.ratingsQuantity || 0})</span>
          </div>

          <div class="mt-auto pt-2 d-flex align-items-center justify-content-between">
            <div>
              ${product.discountPrice > 0 
                ? `<span class="text-danger fw-bold fs-5 me-2">${finalPrice}</span><span class="text-muted text-decoration-line-through fs-7">${originalPrice}</span>` 
                : `<span class="text-heading fw-bold fs-5">${finalPrice}</span>`
              }
            </div>
            <span class="badge ${product.quantityInStock > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill" style="font-size:0.75rem">
              ${product.quantityInStock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>
      </div>

      <!-- Add to Cart Button Footer -->
      <div class="p-3 pt-0 border-0 bg-transparent mt-auto">
        <button class="btn btn-outline-primary w-100 btn-add-cart rounded-pill d-flex align-items-center justify-content-center gap-2 py-2" ${product.quantityInStock <= 0 ? 'disabled' : ''}>
          <i class="bi bi-cart-plus"></i>
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  `;

  // Bind navigation to Details
  const clickableArea = card.querySelector('.card-clickable');
  clickableArea.addEventListener('click', () => {
    window.location.hash = `#/product/${product._id}`;
  });

  // Bind Wishlist toggle
  const wishlistBtn = card.querySelector('.wishlist-btn');
  wishlistBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      const activeWishlist = state.get('wishlist');
      const isFav = activeWishlist.some(p => (p._id || p) === product._id);

      if (isFav) {
        await removeWishlistItem(product._id);
        wishlistBtn.classList.remove('active');
        wishlistBtn.querySelector('i').className = 'bi bi-heart fs-5';
        showToast('Removed from wishlist');
      } else {
        await addItemToWishlist(product);
        wishlistBtn.classList.add('active');
        wishlistBtn.querySelector('i').className = 'bi bi-heart-fill fs-5';
        showToast('Added to wishlist');
      }
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });

  // Bind Add to Cart
  const addCartBtn = card.querySelector('.btn-add-cart');
  addCartBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      await addItemToCart(product, 1);
      showToast(`Added ${product.name} to cart`);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });

  return card;
};
