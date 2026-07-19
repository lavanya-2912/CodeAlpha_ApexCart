import { fetchCart, updateCartItemQty, removeCartItem, toggleCartItemSaveForLater } from '../services/cart.js';
import { validateCouponCode } from '../services/coupon.js';
import { showToast } from '../components/toast.js';
import state from '../state.js';

export const renderCart = async (container) => {
  container.innerHTML = `
    <div class="container py-5">
      <h1 class="fw-bold mb-4"><i class="bi bi-cart3 text-primary me-2"></i>Shopping Cart</h1>
      
      <div class="row">
        <!-- Cart Items List -->
        <div class="col-lg-8 mb-4">
          <div class="glass-panel p-4 border-color">
            <h5 class="fw-bold mb-3 border-bottom pb-2">Active Items</h5>
            <div id="cart-items-container">
              <!-- Loaded dynamically -->
            </div>
          </div>

          <!-- Saved for Later List -->
          <div class="glass-panel p-4 border-color mt-4">
            <h5 class="fw-bold mb-3 border-bottom pb-2">Saved for Later</h5>
            <div id="saved-items-container">
              <!-- Loaded dynamically -->
            </div>
          </div>
        </div>

        <!-- Order Summary Card -->
        <div class="col-lg-4">
          <div class="glass-panel p-4 border-color sticky-top" style="top: 100px;">
            <h4 class="fw-bold mb-4 border-bottom pb-2">Order Summary</h4>
            
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Subtotal</span>
              <span class="fw-semibold text-heading" id="summary-subtotal">$0.00</span>
            </div>

            <!-- Coupon discount row -->
            <div class="d-flex justify-content-between mb-2 text-danger" id="summary-discount-row" style="display: none !important;">
              <span>Discount</span>
              <span class="fw-semibold" id="summary-discount">-$0.00</span>
            </div>

            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Est. Tax (15%)</span>
              <span class="fw-semibold text-heading" id="summary-tax">$0.00</span>
            </div>
            
            <div class="d-flex justify-content-between mb-3">
              <span class="text-muted">Shipping Charges</span>
              <span class="fw-semibold text-heading" id="summary-shipping">$0.00</span>
            </div>

            <hr class="border-color">

            <div class="d-flex justify-content-between mb-4">
              <span class="fw-bold fs-5 text-heading">Estimated Total</span>
              <span class="fw-bold fs-5 text-primary" id="summary-total">$0.00</span>
            </div>

            <!-- Coupon Applying Form -->
            <div class="mb-4">
              <label for="coupon-code" class="form-label fw-bold small text-uppercase text-muted">Promo Code</label>
              <form id="coupon-form" class="input-group">
                <input type="text" id="coupon-code" class="form-control bg-light border-color" placeholder="Code..." required>
                <button type="submit" class="btn btn-outline-primary fw-semibold" id="btn-apply-coupon">Apply</button>
              </form>
              <div id="active-coupon-badge" class="mt-2" style="display:none;"></div>
            </div>

            <button id="btn-checkout-proceed" class="btn btn-primary btn-premium w-100 py-3 rounded-pill fw-bold">
              Proceed to Checkout
              <i class="bi bi-arrow-right ms-2"></i>
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  // Apply Coupon code caching (stored in memory for this rendering)
  let activeCoupon = null;

  // Main drawing engine
  const drawCart = async () => {
    const activeContainer = document.getElementById('cart-items-container');
    const savedContainer = document.getElementById('saved-items-container');
    
    // Clear loaders
    activeContainer.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></div>';
    savedContainer.innerHTML = '';

    const cart = await fetchCart();
    
    activeContainer.innerHTML = '';
    
    const activeItems = cart.items ? cart.items.filter(item => !item.saveForLater) : [];
    const savedItems = cart.items ? cart.items.filter(item => item.saveForLater) : [];

    // Active Items Render
    if (activeItems.length > 0) {
      activeItems.forEach(item => {
        const prod = item.product;
        if (!prod) return; // safety
        
        const price = prod.discountPrice > 0 ? prod.discountPrice : prod.price;
        const subTotal = (price * item.quantity).toFixed(2);
        const itemEl = document.createElement('div');
        itemEl.className = 'row align-items-center mb-3 pb-3 border-bottom border-color';
        itemEl.innerHTML = `
          <div class="col-3 col-md-2">
            <img src="${prod.images && prod.images.length > 0 ? prod.images[0] : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=80'}" alt="${prod.name}" class="img-fluid rounded border bg-light">
          </div>
          <div class="col-9 col-md-4">
            <h6 class="fw-bold text-truncate mb-1"><a href="#/product/${prod._id}" class="text-decoration-none text-heading">${prod.name}</a></h6>
            <small class="text-muted d-block">${prod.brand ? (prod.brand.name || prod.brand) : 'Brand'}</small>
            <small class="fw-semibold text-primary">$${price.toFixed(2)} each</small>
          </div>
          
          <div class="col-6 col-md-3 mt-3 mt-md-0">
            <div class="d-flex align-items-center border rounded-pill bg-light p-1" style="max-width: 110px;">
              <button class="btn btn-sm btn-light rounded-circle border-0 btn-qty-minus" style="width:28px; height:28px;"><i class="bi bi-dash"></i></button>
              <input type="number" class="form-control text-center border-0 bg-transparent fw-bold p-0 input-qty" value="${item.quantity}" min="1" max="${prod.quantityInStock}" style="width: 35px; font-size: 0.85rem; pointer-events:none;">
              <button class="btn btn-sm btn-light rounded-circle border-0 btn-qty-plus" style="width:28px; height:28px;"><i class="bi bi-plus"></i></button>
            </div>
          </div>
          
          <div class="col-6 col-md-3 mt-3 mt-md-0 text-end">
            <div class="fw-bold text-heading fs-6">$${subTotal}</div>
            <div class="mt-2 d-flex gap-2 justify-content-end">
              <button class="btn btn-sm btn-light border btn-save-later rounded-pill px-2 py-1 fs-8" style="font-size:0.75rem" title="Save for Later">Save for Later</button>
              <button class="btn btn-sm btn-light border text-danger btn-remove rounded-circle d-flex align-items-center justify-content-center" style="width:28px; height:28px;" title="Remove Item"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        `;

        // Event bindings
        const quantityInput = itemEl.querySelector('.input-qty');
        itemEl.querySelector('.btn-qty-minus').addEventListener('click', async () => {
          let qty = parseInt(quantityInput.value, 10);
          if (qty > 1) {
            await updateCartItemQty(item._id || prod._id, qty - 1);
            drawCart();
          }
        });
        itemEl.querySelector('.btn-qty-plus').addEventListener('click', async () => {
          let qty = parseInt(quantityInput.value, 10);
          if (qty < prod.quantityInStock) {
            await updateCartItemQty(item._id || prod._id, qty + 1);
            drawCart();
          } else {
            showToast('Insufficient stock remaining', 'warning');
          }
        });
        itemEl.querySelector('.btn-save-later').addEventListener('click', async () => {
          await toggleCartItemSaveForLater(item._id || prod._id);
          drawCart();
          showToast('Item saved for later');
        });
        itemEl.querySelector('.btn-remove').addEventListener('click', async () => {
          await removeCartItem(item._id || prod._id);
          drawCart();
          showToast('Removed from cart');
        });

        activeContainer.appendChild(itemEl);
      });
    } else {
      activeContainer.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-cart-x text-muted display-3 mb-3"></i>
          <h5 class="fw-bold">Your Cart is Empty</h5>
          <p class="text-muted mb-4">Add products from our catalog to get started.</p>
          <a href="#/products" class="btn btn-primary rounded-pill btn-premium px-4">Browse Catalog</a>
        </div>
      `;
    }

    // Saved Items Render
    if (savedItems.length > 0) {
      savedItems.forEach(item => {
        const prod = item.product;
        if (!prod) return;

        const price = prod.discountPrice > 0 ? prod.discountPrice : prod.price;
        const itemEl = document.createElement('div');
        itemEl.className = 'row align-items-center mb-3 pb-3 border-bottom border-color';
        itemEl.innerHTML = `
          <div class="col-3 col-md-2">
            <img src="${prod.images && prod.images.length > 0 ? prod.images[0] : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=80'}" alt="${prod.name}" class="img-fluid rounded border bg-light" style="filter:grayscale(30%)">
          </div>
          <div class="col-9 col-md-5">
            <h6 class="fw-semibold text-truncate mb-1"><a href="#/product/${prod._id}" class="text-decoration-none text-heading">${prod.name}</a></h6>
            <small class="text-muted d-block">${prod.brand ? (prod.brand.name || prod.brand) : 'Brand'}</small>
            <small class="fw-semibold text-secondary">$${price.toFixed(2)}</small>
          </div>
          
          <div class="col-12 col-md-5 mt-3 mt-md-0 text-end">
            <button class="btn btn-outline-primary btn-sm btn-move-cart rounded-pill px-3 py-1 fw-semibold me-2">Move to Cart</button>
            <button class="btn btn-sm btn-light border text-danger btn-remove rounded-circle d-flex align-items-center justify-content-center" style="width:28px; height:28px; display:inline-flex !important;" title="Remove Item"><i class="bi bi-trash"></i></button>
          </div>
        `;

        // Event bindings
        itemEl.querySelector('.btn-move-cart').addEventListener('click', async () => {
          await toggleCartItemSaveForLater(item._id || prod._id);
          drawCart();
          showToast('Moved item to active cart');
        });
        itemEl.querySelector('.btn-remove').addEventListener('click', async () => {
          await removeCartItem(item._id || prod._id);
          drawCart();
          showToast('Removed item');
        });

        savedContainer.appendChild(itemEl);
      });
    } else {
      savedContainer.innerHTML = '<div class="text-center text-muted py-3">No saved items currently.</div>';
    }

    calculateTotals(activeItems);
  };

  // Compile calculations and totals display
  const calculateTotals = (items) => {
    let subtotal = 0;
    
    items.forEach(item => {
      const prod = item.product;
      if (prod) {
        const price = prod.discountPrice > 0 ? prod.discountPrice : prod.price;
        subtotal += price * item.quantity;
      }
    });

    let discount = 0;
    if (activeCoupon) {
      discount = subtotal * (activeCoupon.discountPercentage / 100);
      document.getElementById('summary-discount-row').setAttribute('style', 'display: flex !important;');
      document.getElementById('summary-discount').innerText = `-$${discount.toFixed(2)}`;
    } else {
      document.getElementById('summary-discount-row').setAttribute('style', 'display: none !important;');
    }

    const netSubtotal = subtotal - discount;
    const tax = netSubtotal * 0.15; // 15% tax
    const shipping = netSubtotal > 100 || subtotal === 0 ? 0 : 15; // free over $100
    const total = netSubtotal + tax + shipping;

    document.getElementById('summary-subtotal').innerText = `$${subtotal.toFixed(2)}`;
    document.getElementById('summary-tax').innerText = `$${tax.toFixed(2)}`;
    document.getElementById('summary-shipping').innerText = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    document.getElementById('summary-total').innerText = `$${total.toFixed(2)}`;
    
    // Disable proceed button if cart empty
    document.getElementById('btn-checkout-proceed').disabled = items.length === 0;
  };

  // Bind coupon codes submissions
  const couponForm = document.getElementById('coupon-form');
  const couponInput = document.getElementById('coupon-code');
  const couponBadge = document.getElementById('active-coupon-badge');
  const couponBtn = document.getElementById('btn-apply-coupon');

  couponForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = couponInput.value.trim().toUpperCase();
    if (!code) return;

    // Check user auth since checkout requires auth for coupons
    if (!state.get('user')) {
      showToast('You must be signed in to apply promo codes', 'warning');
      return;
    }

    couponBtn.disabled = true;
    try {
      const coupon = await validateCouponCode(code);
      activeCoupon = coupon;
      
      couponInput.value = '';
      couponBadge.style.display = 'block';
      couponBadge.innerHTML = `
        <span class="badge bg-success text-white px-3 py-2 rounded-pill d-flex align-items-center gap-2" style="width:fit-content;">
          <i class="bi bi-tag-fill"></i>
          <span>${coupon.code} (${coupon.discountPercentage}% OFF)</span>
          <i class="bi bi-x-circle cursor-pointer ms-1 fs-6" id="remove-coupon-btn" style="cursor:pointer"></i>
        </span>
      `;

      // Remove coupon listener
      document.getElementById('remove-coupon-btn').addEventListener('click', () => {
        activeCoupon = null;
        couponBadge.style.display = 'none';
        drawCart();
      });

      drawCart();
      showToast(`Coupon "${code}" applied successfully!`);
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      couponBtn.disabled = false;
    }
  });

  // Proceed checkout navigation
  document.getElementById('btn-checkout-proceed').addEventListener('click', () => {
    const user = state.get('user');
    if (!user) {
      showToast('Please sign in to proceed with checkout', 'warning');
      window.location.hash = '#/login?redirect=checkout';
    } else {
      // Pass coupon details in url hash if applied
      const couponQuery = activeCoupon ? `?coupon=${activeCoupon.code}` : '';
      window.location.hash = `#/checkout${couponQuery}`;
    }
  });

  await drawCart();
};
