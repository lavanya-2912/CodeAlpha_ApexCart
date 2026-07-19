import { getAddressesList } from '../services/auth.js';
import { fetchCart } from '../services/cart.js';
import { validateCouponCode } from '../services/coupon.js';
import { createCheckoutSession, fetchPaymentStatus } from '../services/payment.js';
import { placeOrder } from '../services/order.js';
import { showToast } from '../components/toast.js';
import state from '../state.js';

// --- 1. MAIN CHECKOUT RENDERER ---
export const renderCheckout = async (container, params, query) => {
  const user = state.get('user');
  if (!user) {
    window.location.hash = '#/login';
    return;
  }

  // Load addresses & cart
  let savedAddresses = [];
  try {
    savedAddresses = await getAddressesList();
  } catch (e) {
    console.error('Error fetching addresses:', e);
  }

  const cart = await fetchCart();
  const activeItems = cart.items ? cart.items.filter(item => !item.saveForLater) : [];

  if (activeItems.length === 0) {
    showToast('Your cart is empty', 'warning');
    window.location.hash = '#/cart';
    return;
  }

  // Calculate prices
  let subtotal = 0;
  activeItems.forEach(item => {
    const price = item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price;
    subtotal += price * item.quantity;
  });

  // Calculate active coupon if present in query
  let couponCode = query.coupon || '';
  let discountAmount = 0;
  let discountPercent = 0;

  if (couponCode) {
    try {
      const coupon = await validateCouponCode(couponCode);
      discountPercent = coupon.discountPercentage;
      discountAmount = subtotal * (discountPercent / 100);
    } catch (e) {
      couponCode = '';
    }
  }

  const netSubtotal = subtotal - discountAmount;
  const taxPrice = netSubtotal * 0.15;
  const shippingPrice = netSubtotal > 100 ? 0 : 15;
  const totalPrice = netSubtotal + taxPrice + shippingPrice;

  container.innerHTML = `
    <div class="container py-5">
      <h1 class="fw-bold mb-5"><i class="bi bi-shield-check text-primary me-2"></i>Checkout</h1>
      
      <div class="row">
        <!-- Billing/Shipping details -->
        <div class="col-lg-7 mb-4">
          <form id="checkout-address-form">
            <!-- Address Book dropdown -->
            ${savedAddresses.length > 0 ? `
              <div class="glass-panel p-4 border-color mb-4">
                <label for="address-select" class="form-label fw-bold">Select Saved Address</label>
                <select id="address-select" class="form-select bg-light border-color">
                  <option value="">-- Enter Address Manually --</option>
                  ${savedAddresses.map((addr, idx) => `
                    <option value="${idx}">${addr.title}: ${addr.street}, ${addr.city}</option>
                  `).join('')}
                </select>
              </div>
            ` : ''}

            <!-- Address Form Fields -->
            <div class="glass-panel p-4 border-color">
              <h4 class="fw-bold mb-4">Shipping Information</h4>
              
              <div class="mb-3">
                <label for="ship-street" class="form-label small fw-bold">Street Address</label>
                <input type="text" id="ship-street" class="form-control bg-light border-color" placeholder="123 Main St, Apt 4" required>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="ship-city" class="form-label small fw-bold">City</label>
                  <input type="text" id="ship-city" class="form-control bg-light border-color" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="ship-state" class="form-label small fw-bold">State / Province</label>
                  <input type="text" id="ship-state" class="form-control bg-light border-color" required>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="ship-zip" class="form-label small fw-bold">ZIP / Postal Code</label>
                  <input type="text" id="ship-zip" class="form-control bg-light border-color" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="ship-country" class="form-label small fw-bold">Country</label>
                  <input type="text" id="ship-country" class="form-control bg-light border-color" value="United States" required>
                </div>
              </div>

              <div class="mb-3">
                <label for="ship-phone" class="form-label small fw-bold">Contact Phone Number</label>
                <input type="tel" id="ship-phone" class="form-control bg-light border-color" placeholder="+1 (555) 019-2834" required>
              </div>

              <div class="form-check mt-3">
                <input class="form-check-input" type="checkbox" id="billing-same-check" checked>
                <label class="form-check-label text-muted" for="billing-same-check">Billing Address matches Shipping Address</label>
              </div>
            </div>

            <!-- Billing Address Fields (Toggled) -->
            <div class="glass-panel p-4 border-color mt-4" id="billing-address-container" style="display: none;">
              <h4 class="fw-bold mb-4">Billing Information</h4>
              
              <div class="mb-3">
                <label for="bill-street" class="form-label small fw-bold">Street Address</label>
                <input type="text" id="bill-street" class="form-control bg-light border-color" placeholder="123 Billing St">
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="bill-city" class="form-label small fw-bold">City</label>
                  <input type="text" id="bill-city" class="form-control bg-light border-color">
                </div>
                <div class="col-md-6 mb-3">
                  <label for="bill-state" class="form-label small fw-bold">State / Province</label>
                  <input type="text" id="bill-state" class="form-control bg-light border-color">
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="bill-zip" class="form-label small fw-bold">ZIP / Postal Code</label>
                  <input type="text" id="bill-zip" class="form-control bg-light border-color">
                </div>
                <div class="col-md-6 mb-3">
                  <label for="bill-country" class="form-label small fw-bold">Country</label>
                  <input type="text" id="bill-country" class="form-control bg-light border-color" value="United States">
                </div>
              </div>
            </div>

            <!-- Payment Method choices -->
            <div class="glass-panel p-4 border-color mt-4">
              <h4 class="fw-bold mb-4">Payment Method</h4>
              
              <div class="form-check mb-3">
                <input class="form-check-input payment-radio" type="radio" name="payment-method" id="pay-stripe" value="stripe" checked>
                <label class="form-check-label d-flex align-items-center gap-2" for="pay-stripe">
                  <i class="bi bi-credit-card-2-front text-primary fs-5"></i>
                  <span class="fw-semibold">Credit/Debit Card (Stripe Secure)</span>
                </label>
              </div>

              <div class="form-check">
                <input class="form-check-input payment-radio" type="radio" name="payment-method" id="pay-cod" value="cod">
                <label class="form-check-label d-flex align-items-center gap-2" for="pay-cod">
                  <i class="bi bi-cash-coin text-success fs-5"></i>
                  <span class="fw-semibold">Cash on Delivery (COD)</span>
                </label>
              </div>
            </div>

            <div class="mt-4 text-end">
              <button type="submit" id="btn-place-order" class="btn btn-primary btn-premium px-5 py-3 rounded-pill fw-bold">
                Place Order ($${totalPrice.toFixed(2)})
              </button>
            </div>
          </form>
        </div>

        <!-- Checkout Summary Column -->
        <div class="col-lg-5">
          <div class="glass-panel p-4 border-color sticky-top" style="top: 100px;">
            <h4 class="fw-bold mb-4 border-bottom pb-2">Order Items</h4>
            
            <div class="max-height-250 overflow-y-auto mb-4" style="max-height: 250px; overflow-y: auto;">
              ${activeItems.map(item => `
                <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                  <div class="d-flex align-items-center gap-2">
                    <img src="${item.product.images[0]}" alt="${item.product.name}" class="rounded border" style="width: 48px; height: 48px; object-fit: cover;">
                    <div>
                      <h6 class="mb-0 fw-semibold text-truncate" style="max-width: 180px;">${item.product.name}</h6>
                      <small class="text-muted">Qty: ${item.quantity}</small>
                    </div>
                  </div>
                  <span class="fw-bold text-heading">$${((item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price) * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>

            <h5 class="fw-bold mb-3 border-bottom pb-2">Summary</h5>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Subtotal</span>
              <span class="fw-semibold text-heading">$${subtotal.toFixed(2)}</span>
            </div>
            ${discountAmount > 0 ? `
              <div class="d-flex justify-content-between mb-2 text-danger">
                <span>Discount (${discountPercent}%)</span>
                <span class="fw-semibold">-$${discountAmount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Est. Tax (15%)</span>
              <span class="fw-semibold text-heading">$${taxPrice.toFixed(2)}</span>
            </div>
            <div class="d-flex justify-content-between mb-3">
              <span class="text-muted">Shipping</span>
              <span class="fw-semibold text-heading">${shippingPrice === 0 ? 'FREE' : `$${shippingPrice.toFixed(2)}`}</span>
            </div>
            <hr class="border-color">
            <div class="d-flex justify-content-between">
              <span class="fw-bold text-heading fs-5">Grand Total</span>
              <span class="fw-bold text-primary fs-5">$${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Autocomplete address inputs on dropdown select
  const addressSelect = document.getElementById('address-select');
  if (addressSelect) {
    addressSelect.addEventListener('change', (e) => {
      const idx = e.target.value;
      if (idx !== '') {
        const addr = savedAddresses[idx];
        document.getElementById('ship-street').value = addr.street;
        document.getElementById('ship-city').value = addr.city;
        document.getElementById('ship-state').value = addr.state;
        document.getElementById('ship-zip').value = addr.zipCode;
        document.getElementById('ship-country').value = addr.country;
        document.getElementById('ship-phone').value = addr.phone;
      } else {
        document.getElementById('checkout-address-form').reset();
      }
    });
  }

  // Toggle Billing Address container visibility based on checkbox
  const sameCheck = document.getElementById('billing-same-check');
  const billingContainer = document.getElementById('billing-address-container');
  sameCheck.addEventListener('change', (e) => {
    billingContainer.style.display = e.target.checked ? 'none' : 'block';
    
    // Toggle required fields
    const billingInputs = billingContainer.querySelectorAll('input');
    billingInputs.forEach(input => {
      input.required = !e.target.checked;
    });
  });

  // Handle Checkout submission
  const checkoutForm = document.getElementById('checkout-address-form');
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const paymentMethod = document.querySelector('.payment-radio:checked').value;
    
    // Ship address package
    const shippingAddress = {
      street: document.getElementById('ship-street').value.trim(),
      city: document.getElementById('ship-city').value.trim(),
      state: document.getElementById('ship-state').value.trim(),
      zipCode: document.getElementById('ship-zip').value.trim(),
      country: document.getElementById('ship-country').value.trim(),
      phone: document.getElementById('ship-phone').value.trim(),
    };

    // Bill address package
    let billingAddress = { ...shippingAddress };
    if (!sameCheck.checked) {
      billingAddress = {
        street: document.getElementById('bill-street').value.trim(),
        city: document.getElementById('bill-city').value.trim(),
        state: document.getElementById('bill-state').value.trim(),
        zipCode: document.getElementById('bill-zip').value.trim(),
        country: document.getElementById('bill-country').value.trim(),
        phone: document.getElementById('ship-phone').value.trim(), // fallback to main contact
      };
    }

    const orderItemsPayload = activeItems.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
    }));

    if (paymentMethod === 'cod') {
      // Cash on Delivery - direct order creation
      const placeBtn = document.getElementById('btn-place-order');
      placeBtn.disabled = true;
      placeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Placing Order...';
      
      try {
        const orderData = {
          orderItems: orderItemsPayload,
          shippingAddress,
          billingAddress,
          paymentMethod: 'cod',
          couponCode,
        };
        const orderResponse = await placeOrder(orderData);
        showToast('Order placed successfully via COD!');
        window.location.hash = `#/checkout-success?order_id=${orderResponse.data._id}`;
      } catch (err) {
        showToast(err.message, 'danger');
        placeBtn.disabled = false;
        placeBtn.innerText = 'Place Order';
      }
    } else {
      // Credit Card Payment (Stripe Checkout API)
      const placeBtn = document.getElementById('btn-place-order');
      placeBtn.disabled = true;
      placeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Redirecting to Stripe...';

      try {
        const checkoutPayload = {
          items: orderItemsPayload,
          couponCode,
          shippingAddress,
          billingAddress,
        };

        const sessionResponse = await createCheckoutSession(checkoutPayload);
        
        // Cache checkout info temporarily in session storage to rebuild order post-success
        sessionStorage.setItem('apexcart_checkout_cache', JSON.stringify({
          shippingAddress,
          billingAddress,
          couponCode,
          orderItems: orderItemsPayload,
        }));

        // Redirect to Stripe checkout page (or mock payment panel)
        window.location.href = sessionResponse.url;
      } catch (err) {
        showToast(err.message, 'danger');
        placeBtn.disabled = false;
        placeBtn.innerText = 'Place Order';
      }
    }
  });
};


// --- 2. MOCK STRIPE GATEWAY RENDERER ---
export const renderMockStripe = async (container, params, query) => {
  const sessionId = query.session_id;
  const total = query.total;

  container.innerHTML = `
    <div class="container py-5 text-center">
      <div class="glass-panel p-5 max-width-600 mx-auto border-color" style="max-width: 500px;">
        <div class="d-flex align-items-center justify-content-center gap-2 mb-4">
          <i class="bi bi-shield-lock-fill text-primary display-5"></i>
          <h2 class="fw-bold mb-0">Mock Stripe Portal</h2>
        </div>
        
        <div class="alert alert-info py-2 fs-7 mb-4">
          This is a simulated payment screen because no Stripe Key was found in the environment.
        </div>

        <div class="text-start mb-4 bg-light border p-3 rounded" style="border-radius: 12px;">
          <div class="d-flex justify-content-between mb-1">
            <span class="text-muted">Merchant:</span>
            <span class="fw-bold">ApexCart E-Commerce</span>
          </div>
          <div class="d-flex justify-content-between">
            <span class="text-muted">Total Charge:</span>
            <span class="fw-bold text-primary">$${total}</span>
          </div>
        </div>

        <form id="mock-stripe-form">
          <div class="mb-3 text-start">
            <label for="mock-card-name" class="form-label small fw-bold">Name on Card</label>
            <input type="text" class="form-control bg-light border-color" id="mock-card-name" placeholder="John Doe" required>
          </div>

          <div class="mb-3 text-start">
            <label for="mock-card-num" class="form-label small fw-bold">Card Number</label>
            <div class="input-group">
              <input type="text" class="form-control bg-light border-color" id="mock-card-num" placeholder="4242 4242 4242 4242" required maxlength="19">
              <span class="input-group-text"><i class="bi bi-credit-card"></i></span>
            </div>
          </div>

          <div class="row">
            <div class="col-6 mb-3 text-start">
              <label for="mock-card-exp" class="form-label small fw-bold">Expiry Date</label>
              <input type="text" class="form-control bg-light border-color" id="mock-card-exp" placeholder="MM/YY" required maxlength="5">
            </div>
            <div class="col-6 mb-3 text-start">
              <label for="mock-card-cvv" class="form-label small fw-bold">CVV</label>
              <input type="password" class="form-control bg-light border-color" id="mock-card-cvv" placeholder="•••" required maxlength="3">
            </div>
          </div>

          <button type="submit" id="btn-pay-submit" class="btn btn-primary btn-premium w-100 py-3 rounded-pill fw-bold mt-3">
            Simulate Payment Success
          </button>
        </form>
      </div>
    </div>
  `;

  // Autospace card number inputs
  const cardInput = document.getElementById('mock-card-num');
  cardInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let matches = value.match(/\d{4,16}/g);
    let match = matches && matches[0] || '';
    let parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      e.target.value = parts.join(' ');
    } else {
      e.target.value = value;
    }
  });

  const form = document.getElementById('mock-stripe-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-pay-submit');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Processing simulated transaction...';
    
    setTimeout(() => {
      window.location.hash = `#/checkout-success?session_id=${sessionId}`;
    }, 1500);
  });
};


// --- 3. CHECKOUT SUCCESS / CALLBACK RENDERER ---
export const renderCheckoutSuccess = async (container, params, query) => {
  const sessionId = query.session_id;
  const orderIdDirect = query.order_id; // direct placement from COD

  container.innerHTML = `
    <div class="container py-5 text-center">
      <div class="glass-panel p-5 max-width-600 mx-auto border-color" id="success-message-panel" style="max-width: 600px;">
        <div class="spinner-border text-primary display-4 mb-4" role="status" id="success-loader"></div>
        <h4 id="success-status-text">Verifying Payment Transaction...</h4>
        <p class="text-muted">Please wait while we finalize your order.</p>
      </div>
    </div>
  `;

  const loader = document.getElementById('success-loader');
  const statusText = document.getElementById('success-status-text');
  const panel = document.getElementById('success-message-panel');

  try {
    // If order was placed directly via COD, render completion screen immediately
    if (orderIdDirect) {
      renderSuccessComplete(panel, orderIdDirect);
      return;
    }

    if (!sessionId) {
      throw new Error('Missing payment transaction session identifier');
    }

    // 1. Verify transaction status via backend
    const statusResult = await fetchPaymentStatus(sessionId);
    
    if (statusResult.success && (statusResult.status === 'paid' || statusResult.status === 'no_payment_required')) {
      // 2. Fetch checkout parameters from local session cache
      const cachedData = JSON.parse(sessionStorage.getItem('apexcart_checkout_cache'));
      if (!cachedData) {
        throw new Error('Checkout context expired. Please check your Dashboard Orders history to see if the order was created.');
      }

      // 3. Post transaction order to DB
      const orderPayload = {
        orderItems: cachedData.orderItems,
        shippingAddress: cachedData.shippingAddress,
        billingAddress: cachedData.billingAddress,
        paymentMethod: 'stripe',
        paymentStatus: 'paid',
        paymentIntentId: statusResult.paymentIntent || 'mock_intent_' + Date.now(),
        couponCode: cachedData.couponCode,
      };

      const orderResponse = await placeOrder(orderPayload);
      
      // Wipe session caches
      sessionStorage.removeItem('apexcart_checkout_cache');
      
      // Render checkout success details
      renderSuccessComplete(panel, orderResponse.data._id);
    } else {
      throw new Error('Transaction was cancelled or declined by your card bank.');
    }
  } catch (err) {
    loader.remove();
    statusText.innerText = 'Checkout Process Interrupted';
    panel.insertAdjacentHTML('beforeend', `
      <div class="alert alert-danger mt-3 mb-4">
        <i class="bi bi-x-circle-fill me-2"></i>${err.message}
      </div>
      <div class="d-flex justify-content-center gap-3">
        <a href="#/cart" class="btn btn-primary rounded-pill btn-premium px-4">Go to Cart</a>
        <a href="#/" class="btn btn-outline-secondary rounded-pill px-4 bg-white">Go Home</a>
      </div>
    `);
  }
};

// UI complete renderer helper
const renderSuccessComplete = (panel, orderId) => {
  panel.innerHTML = `
    <i class="bi bi-check-circle-fill text-success display-1 mb-4"></i>
    <h2 class="fw-bold text-heading mb-2">Order Confirmed!</h2>
    <p class="text-muted mb-4">Thank you for your purchase. Your order has been placed successfully. An email confirmation has been sent.</p>
    
    <div class="bg-light p-3 border rounded text-start mb-4" style="border-radius:12px;">
      <div class="d-flex justify-content-between mb-2">
        <span class="text-muted">Order ID:</span>
        <strong class="text-dark">${orderId}</strong>
      </div>
      <div class="d-flex justify-content-between mb-2">
        <span class="text-muted">Estimated Delivery:</span>
        <strong class="text-dark">3 - 5 Business Days</strong>
      </div>
    </div>

    <div class="d-flex flex-wrap justify-content-center gap-3">
      <button class="btn btn-primary btn-premium px-4 py-2 rounded-pill d-flex align-items-center gap-2 btn-download-pdf" data-id="${orderId}">
        <i class="bi bi-file-earmark-pdf fs-5"></i>
        <span>Download PDF Invoice</span>
      </button>
      
      <a href="#/dashboard?tab=orders" class="btn btn-outline-secondary bg-white px-4 py-2 rounded-pill">
        Track Your Order
      </a>
    </div>
  `;

  // Bind invoice downloader click
  panel.querySelector('.btn-download-pdf').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    const oldText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Downloading...';

    try {
      const token = localStorage.getItem('apexcart_token');
      const response = await fetch(`/api/v1/orders/${orderId}/invoice`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Invoice file not found');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${orderId.slice(-6)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast('Failed to download invoice PDF', 'danger');
    } finally {
      btn.disabled = false;
      btn.innerHTML = oldText;
    }
  });
};
