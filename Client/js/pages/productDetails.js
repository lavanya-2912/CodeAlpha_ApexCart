import { fetchProductById, fetchRelatedProducts } from '../services/product.js';
import { fetchProductReviews, submitReview } from '../services/review.js';
import { addItemToCart } from '../services/cart.js';
import { addItemToWishlist, removeWishlistItem } from '../services/wishlist.js';
import { createProductCard } from '../components/productCard.js';
import { createReviewCard } from '../components/reviewCard.js';
import { renderProductDetailSkeleton } from '../components/skeletons.js';
import { showToast } from '../components/toast.js';
import state from '../state.js';

export const renderProductDetails = async (container, params) => {
  const productId = params.id;
  renderProductDetailSkeleton(container);

  try {
    const product = await fetchProductById(productId);
    
    // Add to recently viewed state list
    state.addRecentlyViewed(product);

    const relatedProducts = await fetchRelatedProducts(productId);
    const reviews = await fetchProductReviews(productId);

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

    // Draw main HTML template
    container.innerHTML = `
      <div class="container py-5">
        
        <!-- Breadcrumbs -->
        <nav aria-label="breadcrumb" class="mb-4">
          <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="#/">Home</a></li>
            <li class="breadcrumb-item"><a href="#/products">Shop</a></li>
            <li class="breadcrumb-item"><a href="#/products?category=${product.category._id}">${product.category.name}</a></li>
            <li class="breadcrumb-item active" aria-current="page">${product.name}</li>
          </ol>
        </nav>

        <div class="row mb-5">
          <!-- Image Gallery Column -->
          <div class="col-lg-6 mb-4">
            <div class="glass-panel p-3 border-color h-100 d-flex flex-column justify-content-center">
              <div class="main-image-container mb-3 border rounded text-center bg-light" style="height: 400px; overflow: hidden; border-radius: 12px;">
                <img id="main-product-img" src="${product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'}" alt="${product.name}" class="img-fluid h-100 w-100" style="object-fit: contain;">
              </div>
              <div class="row g-2 justify-content-start">
                ${product.images.map((img, idx) => `
                  <div class="col-3 col-sm-2">
                    <div class="thumbnail-wrapper border rounded cursor-pointer ${idx === 0 ? 'border-primary border-2' : ''}" style="height: 60px; overflow:hidden; cursor:pointer;" data-src="${img}">
                      <img src="${img}" alt="${product.name} Thumbnail ${idx}" class="img-fluid w-100 h-100" style="object-fit: cover;">
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Product Details Column -->
          <div class="col-lg-6">
            <div class="d-flex align-items-center gap-2 mb-2">
              <span class="badge bg-secondary-subtle text-secondary rounded-pill px-3 py-1 fw-bold text-uppercase">${product.brand ? product.brand.name : 'Premium Brand'}</span>
              ${discountPercent > 0 ? `<span class="badge bg-danger text-white px-3 py-1 rounded-pill fw-bold">${discountPercent}% OFF</span>` : ''}
            </div>
            
            <h1 class="fw-bold display-5 mb-2">${product.name}</h1>
            
            <div class="d-flex align-items-center mb-4">
              <div class="text-warning me-2" id="detail-stars">
                <!-- Stars rendered via js helper -->
              </div>
              <span class="text-muted text-decoration-none small">(${product.ratingsQuantity || 0} reviews)</span>
              <span class="mx-3 text-muted">|</span>
              <span class="badge ${product.quantityInStock > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill">
                ${product.quantityInStock > 0 ? `In Stock (${product.quantityInStock} left)` : 'Out of Stock'}
              </span>
            </div>

            <!-- Price -->
            <div class="mb-4 p-3 rounded bg-light border-start border-primary border-3">
              ${product.discountPrice > 0
                ? `<span class="text-danger fw-bold display-6 me-3">${finalPrice}</span>
                   <span class="text-muted text-decoration-line-through fs-5">${originalPrice}</span>`
                : `<span class="text-heading fw-bold display-6">${finalPrice}</span>`
              }
            </div>

            <p class="text-muted mb-4 lead" style="font-size: 1rem;">${product.description}</p>

            <!-- Quantity & Actions -->
            <div class="d-flex align-items-center gap-3 mb-4 border-top border-bottom py-4">
              <div class="d-flex align-items-center border rounded-pill bg-light p-1">
                <button id="qty-minus" class="btn btn-sm btn-light rounded-circle border-0" style="width:36px; height:36px;"><i class="bi bi-dash fs-5"></i></button>
                <input type="number" id="qty-input" class="form-control text-center border-0 bg-transparent fw-bold p-0" value="1" min="1" max="${product.quantityInStock}" style="width: 50px; outline: none; box-shadow: none;">
                <button id="qty-plus" class="btn btn-sm btn-light rounded-circle border-0" style="width:36px; height:36px;"><i class="bi bi-plus fs-5"></i></button>
              </div>

              <button id="btn-details-add-cart" class="btn btn-primary btn-premium px-5 py-3 rounded-pill d-flex align-items-center gap-2" ${product.quantityInStock <= 0 ? 'disabled' : ''}>
                <i class="bi bi-cart3 fs-5"></i>
                <span>Add to Shopping Cart</span>
              </button>

              <button id="btn-details-wishlist" class="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center" style="width: 52px; height: 52px;" title="Wishlist">
                <i class="bi ${inWishlist ? 'bi-heart-fill text-danger' : 'bi-heart'} fs-4"></i>
              </button>
            </div>

            <!-- Specifications Table -->
            <div class="mt-4">
              <h5 class="fw-bold mb-3"><i class="bi bi-grid-3x3-gap text-primary me-2"></i>Specifications</h5>
              <div class="glass-panel p-3 border-color">
                <table class="table table-borderless mb-0">
                  <tbody>
                    ${
                      product.specifications && Object.keys(product.specifications).length > 0
                        ? Object.entries(product.specifications).map(([key, value]) => `
                          <tr>
                            <td class="fw-bold text-muted ps-0 py-1" style="width: 150px;">${key}</td>
                            <td class="text-secondary py-1">${value}</td>
                          </tr>
                        `).join('')
                        : '<tr><td class="text-muted ps-0">No technical specifications provided for this product.</td></tr>'
                    }
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        <!-- Product Reviews Section -->
        <div class="row mt-5 pt-4 border-top">
          <div class="col-lg-7">
            <h3 class="fw-bold mb-4">Customer Reviews</h3>
            <div id="reviews-list-container">
              <!-- Loaded dynamically -->
            </div>
          </div>
          
          <div class="col-lg-5">
            <div class="glass-panel p-4 border-color mb-4">
              <h4 class="fw-bold mb-3">Submit a Review</h4>
              
              ${
                state.get('user')
                  ? `
                  <form id="submit-review-form">
                    <div class="mb-3">
                      <label class="form-label fw-bold">Star Rating</label>
                      <div class="d-flex text-warning fs-3 gap-2" id="star-selector">
                        <i class="bi bi-star cursor-pointer star-select" data-rating="1" style="cursor:pointer"></i>
                        <i class="bi bi-star cursor-pointer star-select" data-rating="2" style="cursor:pointer"></i>
                        <i class="bi bi-star cursor-pointer star-select" data-rating="3" style="cursor:pointer"></i>
                        <i class="bi bi-star cursor-pointer star-select" data-rating="4" style="cursor:pointer"></i>
                        <i class="bi bi-star cursor-pointer star-select" data-rating="5" style="cursor:pointer"></i>
                      </div>
                      <input type="hidden" id="selected-rating" name="rating" value="0">
                    </div>
                    <div class="mb-3">
                      <label for="review-comment" class="form-label fw-bold">Your Review</label>
                      <textarea class="form-control bg-light border-color" id="review-comment" rows="4" placeholder="Write comments about your experience..." required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary w-100 btn-premium py-2 rounded-pill">Submit Review</button>
                  </form>
                `
                  : `
                  <div class="text-center py-4">
                    <p class="text-muted">You must be logged in to submit product reviews.</p>
                    <a href="#/login" class="btn btn-outline-primary rounded-pill px-4">Sign In Now</a>
                  </div>
                `
              }
            </div>
          </div>
        </div>

        <!-- Related Products Section -->
        <div id="related-products-section" class="mt-5 pt-5 border-top" style="display: none;">
          <h3 class="fw-bold mb-4">Related Products</h3>
          <div id="related-products-grid" class="row">
            <!-- Loaded dynamically -->
          </div>
        </div>

      </div>
    `;

    // Render static stars
    const detailStars = document.getElementById('detail-stars');
    const starsCount = product.ratingsAverage || 0;
    for (let i = 1; i <= 5; i++) {
      if (starsCount >= i) {
        detailStars.insertAdjacentHTML('beforeend', '<i class="bi bi-star-fill text-warning me-1"></i>');
      } else if (starsCount >= i - 0.5) {
        detailStars.insertAdjacentHTML('beforeend', '<i class="bi bi-star-half text-warning me-1"></i>');
      } else {
        detailStars.insertAdjacentHTML('beforeend', '<i class="bi bi-star text-secondary me-1"></i>');
      }
    }

    // Bind Image Gallery clicks
    const thumbnails = container.querySelectorAll('.thumbnail-wrapper');
    const mainImg = document.getElementById('main-product-img');
    thumbnails.forEach(thumb => {
      thumb.addEventListener('click', () => {
        thumbnails.forEach(t => t.classList.remove('border-primary', 'border-2'));
        thumb.classList.add('border-primary', 'border-2');
        mainImg.src = thumb.dataset.src;
      });
    });

    // Qty Increment Buttons
    const qtyInput = document.getElementById('qty-input');
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');
    
    qtyMinus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val > 1) {
        qtyInput.value = val - 1;
      }
    });

    qtyPlus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val < product.quantityInStock) {
        qtyInput.value = val + 1;
      }
    });

    // Add to Cart click
    const addCartBtn = document.getElementById('btn-details-add-cart');
    addCartBtn.addEventListener('click', async () => {
      try {
        const qty = parseInt(qtyInput.value, 10) || 1;
        await addItemToCart(product, qty);
        showToast(`Added ${qty} unit(s) of ${product.name} to cart`);
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });

    // Wishlist Button click
    const wishlistBtn = document.getElementById('btn-details-wishlist');
    wishlistBtn.addEventListener('click', async () => {
      try {
        const activeWishlist = state.get('wishlist');
        const isFav = activeWishlist.some(p => (p._id || p) === product._id);
        
        if (isFav) {
          await removeWishlistItem(product._id);
          wishlistBtn.querySelector('i').className = 'bi bi-heart fs-4';
          showToast('Removed from wishlist');
        } else {
          await addItemToWishlist(product);
          wishlistBtn.querySelector('i').className = 'bi bi-heart-fill text-danger fs-4';
          showToast('Added to wishlist');
        }
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });

    // Related Products draw
    const relatedSec = document.getElementById('related-products-section');
    const relatedGrid = document.getElementById('related-products-grid');
    if (relatedProducts && relatedProducts.length > 0) {
      relatedSec.style.display = 'block';
      relatedProducts.forEach(prod => {
        relatedGrid.appendChild(createProductCard(prod));
      });
    }

    // Reviews list drawing
    const renderReviewsList = (reviewsList) => {
      const listContainer = document.getElementById('reviews-list-container');
      listContainer.innerHTML = '';
      
      if (reviewsList.length > 0) {
        reviewsList.forEach(rev => {
          listContainer.appendChild(createReviewCard(rev, () => {
            // Callback when user review is deleted, decrement totals
            product.ratingsQuantity = Math.max(0, product.ratingsQuantity - 1);
            document.querySelector('.text-muted.text-decoration-none.small').innerText = `(${product.ratingsQuantity} reviews)`;
          }));
        });
      } else {
        listContainer.innerHTML = `
          <div class="text-center py-5 border rounded bg-light">
            <i class="bi bi-chat-left-text text-muted display-4 mb-3"></i>
            <h5 class="fw-bold">No Reviews Yet</h5>
            <p class="text-muted">Be the first to review this product!</p>
          </div>
        `;
      }
    };
    renderReviewsList(reviews);

    // Star Selector for submitting reviews
    const starSelector = document.getElementById('star-selector');
    const ratingInput = document.getElementById('selected-rating');
    if (starSelector) {
      const stars = starSelector.querySelectorAll('.star-select');
      stars.forEach(star => {
        // Hover effects
        star.addEventListener('mouseover', () => {
          const ratingVal = parseInt(star.dataset.rating, 10);
          stars.forEach(s => {
            const val = parseInt(s.dataset.rating, 10);
            s.className = val <= ratingVal ? 'bi bi-star-fill cursor-pointer star-select' : 'bi bi-star cursor-pointer star-select';
          });
        });

        // Click selection
        star.addEventListener('click', () => {
          const ratingVal = parseInt(star.dataset.rating, 10);
          ratingInput.value = ratingVal;
          stars.forEach(s => {
            const val = parseInt(s.dataset.rating, 10);
            s.className = val <= ratingVal ? 'bi bi-star-fill cursor-pointer star-select' : 'bi bi-star cursor-pointer star-select';
          });
        });

        // Mouse out reset
        starSelector.addEventListener('mouseleave', () => {
          const activeRating = parseInt(ratingInput.value, 10);
          stars.forEach(s => {
            const val = parseInt(s.dataset.rating, 10);
            s.className = val <= activeRating ? 'bi bi-star-fill cursor-pointer star-select' : 'bi bi-star cursor-pointer star-select';
          });
        });
      });

      // Submit review form listener
      const reviewForm = document.getElementById('submit-review-form');
      reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rating = ratingInput.value;
        const comment = document.getElementById('review-comment').value.trim();

        if (rating === '0') {
          showToast('Please select a star rating first', 'warning');
          return;
        }

        try {
          await submitReview(productId, rating, comment);
          showToast('Review submitted successfully! Refreshing reviews...');
          
          // Re-fetch reviews to redraw list
          const updatedReviews = await fetchProductReviews(productId);
          renderReviewsList(updatedReviews);

          // Reset Form
          ratingInput.value = '0';
          document.getElementById('review-comment').value = '';
          stars.forEach(s => s.className = 'bi bi-star cursor-pointer star-select');
        } catch (err) {
          showToast(err.message, 'danger');
        }
      });
    }

  } catch (err) {
    showToast(err.message, 'danger');
    container.innerHTML = `
      <div class="container py-5 text-center">
        <div class="alert alert-danger max-width-600 mx-auto">
          <h4 class="fw-bold"><i class="bi bi-exclamation-triangle-fill me-2"></i>Product Fetch Error</h4>
          <p class="mb-0">${err.message}</p>
        </div>
      </div>
    `;
  }
};
