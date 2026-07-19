import { 
  updateProfileDetails, 
  uploadProfileAvatar, 
  getAddressesList, 
  addNewAddress, 
  removeAddress, 
  changeUserPassword 
} from '../services/auth.js';
import { fetchMyOrders, cancelOrderById, requestOrderReturn } from '../services/order.js';
import { fetchWishlist, removeWishlistItem } from '../services/wishlist.js';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notification.js';
import { createProductCard } from '../components/productCard.js';
import { showToast } from '../components/toast.js';
import state from '../state.js';

export const renderDashboard = async (container, params, query) => {
  const user = state.get('user');
  if (!user) {
    window.location.hash = '#/login';
    return;
  }

  // Active Tab resolve (defaults to profile)
  const activeTab = query.tab || 'profile';

  container.innerHTML = `
    <div class="container py-5">
      <div class="row">
        <!-- Sidebar Navigation -->
        <div class="col-lg-3 mb-4">
          <div class="glass-panel p-4 border-color sticky-top" style="top: 100px;">
            <div class="text-center mb-4">
              <div class="position-relative d-inline-block mx-auto mb-3" style="width: 100px; height: 100px;">
                <img id="dash-avatar" src="${user.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}" alt="Avatar" class="rounded-circle border" style="width: 100px; height: 100px; object-fit: cover;">
                <label for="avatar-input" class="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2 d-flex align-items-center justify-content-center cursor-pointer shadow-sm border border-white" style="width: 32px; height: 32px; cursor: pointer;" title="Upload Avatar">
                  <i class="bi bi-camera-fill small"></i>
                </label>
                <input type="file" id="avatar-input" accept="image/*" class="d-none">
              </div>
              <h5 class="fw-bold mb-0 text-heading">${user.name}</h5>
              <small class="text-muted">${user.email}</small>
            </div>
            
            <div class="nav flex-column nav-pills gap-2">
              <a class="nav-link rounded-3 fw-semibold ${activeTab === 'profile' ? 'active bg-primary' : 'text-secondary'}" href="#/dashboard?tab=profile"><i class="bi bi-person-gear me-2"></i>My Profile</a>
              <a class="nav-link rounded-3 fw-semibold ${activeTab === 'orders' ? 'active bg-primary' : 'text-secondary'}" href="#/dashboard?tab=orders"><i class="bi bi-bag-check me-2"></i>My Orders</a>
              <a class="nav-link rounded-3 fw-semibold ${activeTab === 'wishlist' ? 'active bg-primary' : 'text-secondary'}" href="#/dashboard?tab=wishlist"><i class="bi bi-heart me-2"></i>Wishlist</a>
              <a class="nav-link rounded-3 fw-semibold ${activeTab === 'notifications' ? 'active bg-primary' : 'text-secondary'}" href="#/dashboard?tab=notifications"><i class="bi bi-bell me-2"></i>Notifications</a>
            </div>
          </div>
        </div>

        <!-- Dynamic Content Viewport -->
        <div class="col-lg-9">
          <div class="glass-panel p-4 p-md-5 border-color" id="dashboard-viewport">
            <!-- Loader -->
            <div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind avatar file uploads
  const avatarInput = document.getElementById('avatar-input');
  avatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      showToast('Uploading profile image...');
      const updatedUser = await uploadProfileAvatar(formData);
      document.getElementById('dash-avatar').src = updatedUser.profilePicture;
      showToast('Avatar image updated!');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });

  const viewport = document.getElementById('dashboard-viewport');

  // Dispatch renderer based on active tab
  if (activeTab === 'profile') {
    await renderProfileTab(viewport);
  } else if (activeTab === 'orders') {
    await renderOrdersTab(viewport);
  } else if (activeTab === 'wishlist') {
    await renderWishlistTab(viewport);
  } else if (activeTab === 'notifications') {
    await renderNotificationsTab(viewport);
  }
};


// --- PROFILE & ADDRESS BOOK TAB ---
const renderProfileTab = async (container) => {
  const user = state.get('user');
  
  let addresses = [];
  try {
    addresses = await getAddressesList();
  } catch (e) {
    console.error(e);
  }

  container.innerHTML = `
    <h3 class="fw-bold mb-4">Account Settings</h3>
    
    <!-- Profile Edit Form -->
    <form id="profile-details-form" class="mb-5 pb-4 border-bottom">
      <h5 class="fw-bold mb-3">Edit Details</h5>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label for="prof-name" class="form-label small fw-bold">Full Name</label>
          <input type="text" id="prof-name" class="form-control bg-light border-color" value="${user.name}" required>
        </div>
        <div class="col-md-6 mb-3">
          <label for="prof-email" class="form-label small fw-bold">Email Address</label>
          <input type="email" id="prof-email" class="form-control bg-light border-color" value="${user.email}" required>
        </div>
      </div>
      <button type="submit" id="btn-save-profile" class="btn btn-primary rounded-pill px-4 py-2 fw-semibold btn-premium">Save Details</button>
    </form>

    <!-- Change Password Form -->
    <form id="profile-password-form" class="mb-5 pb-4 border-bottom">
      <h5 class="fw-bold mb-3">Change Password</h5>
      <div class="row">
        <div class="col-md-4 mb-3">
          <label for="pwd-curr" class="form-label small fw-bold">Current Password</label>
          <input type="password" id="pwd-curr" class="form-control bg-light border-color" required minlength="6">
        </div>
        <div class="col-md-4 mb-3">
          <label for="pwd-new" class="form-label small fw-bold">New Password</label>
          <input type="password" id="pwd-new" class="form-control bg-light border-color" required minlength="6">
        </div>
        <div class="col-md-4 mb-3">
          <label for="pwd-conf" class="form-label small fw-bold">Confirm New Password</label>
          <input type="password" id="pwd-conf" class="form-control bg-light border-color" required minlength="6">
        </div>
      </div>
      <button type="submit" id="btn-save-pwd" class="btn btn-outline-primary rounded-pill px-4 py-2 fw-semibold">Update Password</button>
    </form>

    <!-- Saved Addresses List -->
    <div>
      <div class="d-flex align-items-center justify-content-between mb-3">
        <h5 class="fw-bold mb-0">Saved Address Book</h5>
        <button id="btn-add-address-modal" class="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold" data-bs-toggle="collapse" data-bs-target="#new-address-collapse"><i class="bi bi-plus-lg me-1"></i>New Address</button>
      </div>

      <!-- Add Address Collapse Form -->
      <div class="collapse mb-4" id="new-address-collapse">
        <form id="new-address-form" class="bg-light p-4 rounded border">
          <h6 class="fw-bold mb-3">Add Delivery Address</h6>
          <div class="mb-3">
            <label for="addr-title" class="form-label small fw-bold">Address Label</label>
            <input type="text" id="addr-title" class="form-control border-color" placeholder="e.g. Home, Office" required>
          </div>
          <div class="mb-3">
            <label for="addr-street" class="form-label small fw-bold">Street Address</label>
            <input type="text" id="addr-street" class="form-control border-color" required>
          </div>
          <div class="row">
            <div class="col-sm-6 mb-3">
              <label for="addr-city" class="form-label small fw-bold">City</label>
              <input type="text" id="addr-city" class="form-control border-color" required>
            </div>
            <div class="col-sm-6 mb-3">
              <label for="addr-state" class="form-label small fw-bold">State</label>
              <input type="text" id="addr-state" class="form-control border-color" required>
            </div>
          </div>
          <div class="row">
            <div class="col-sm-6 mb-3">
              <label for="addr-zip" class="form-label small fw-bold">ZIP Code</label>
              <input type="text" id="addr-zip" class="form-control border-color" required>
            </div>
            <div class="col-sm-6 mb-3">
              <label for="addr-country" class="form-label small fw-bold">Country</label>
              <input type="text" id="addr-country" class="form-control border-color" value="United States" required>
            </div>
          </div>
          <div class="mb-3">
            <label for="addr-phone" class="form-label small fw-bold">Contact Phone</label>
            <input type="tel" id="addr-phone" class="form-control border-color" required>
          </div>
          <div class="form-check mb-3">
            <input class="form-check-input" type="checkbox" id="addr-default">
            <label class="form-check-label text-muted" for="addr-default">Set as default shipping address</label>
          </div>
          <button type="submit" class="btn btn-primary rounded-pill px-4 btn-premium">Add Address</button>
        </form>
      </div>

      <!-- Grid list of saved addresses -->
      <div class="row g-3" id="address-grid-list">
        ${
          addresses.length > 0
            ? addresses.map((addr) => `
              <div class="col-md-6">
                <div class="card bg-light border p-3 h-100 position-relative" style="border-radius:12px;">
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <h6 class="fw-bold mb-0">${addr.title}</h6>
                    ${addr.isDefault ? `<span class="badge bg-success-subtle text-success border border-success rounded-pill" style="font-size:0.65rem">Default</span>` : ''}
                  </div>
                  <p class="text-secondary small mb-2">${addr.street}<br>${addr.city}, ${addr.state} ${addr.zipCode}<br>${addr.country}</p>
                  <small class="text-muted d-block mb-3">Phone: ${addr.phone}</small>
                  
                  <button class="btn btn-outline-danger btn-sm border-0 position-absolute bottom-0 end-0 m-2 btn-delete-address" data-id="${addr._id}" title="Remove Address">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            `).join('')
            : '<div class="text-muted p-2">No saved addresses found.</div>'
        }
      </div>
    </div>
  `;

  // Bind Details save
  const profileForm = document.getElementById('profile-details-form');
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-profile');
    btn.disabled = true;
    
    try {
      const name = document.getElementById('prof-name').value.trim();
      const email = document.getElementById('prof-email').value.trim();
      await updateProfileDetails(name, email);
      showToast('Profile details updated!');
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      btn.disabled = false;
    }
  });

  // Bind Password update
  const pwdForm = document.getElementById('profile-password-form');
  pwdForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const curr = document.getElementById('pwd-curr').value;
    const newPwd = document.getElementById('pwd-new').value;
    const conf = document.getElementById('pwd-conf').value;

    if (newPwd !== conf) {
      showToast('New passwords do not match', 'warning');
      return;
    }

    const btn = document.getElementById('btn-save-pwd');
    btn.disabled = true;

    try {
      await changeUserPassword(curr, newPwd);
      showToast('Password changed successfully!');
      pwdForm.reset();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      btn.disabled = false;
    }
  });

  // Bind Address Submission
  const addressForm = document.getElementById('new-address-form');
  addressForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const addressData = {
      title: document.getElementById('addr-title').value.trim(),
      street: document.getElementById('addr-street').value.trim(),
      city: document.getElementById('addr-city').value.trim(),
      state: document.getElementById('addr-state').value.trim(),
      zipCode: document.getElementById('addr-zip').value.trim(),
      country: document.getElementById('addr-country').value.trim(),
      phone: document.getElementById('addr-phone').value.trim(),
      isDefault: document.getElementById('addr-default').checked,
    };

    try {
      await addNewAddress(addressData);
      showToast('New address added!');
      // Redraw tab
      await renderProfileTab(container);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });

  // Bind Address Delete buttons
  container.querySelectorAll('.btn-delete-address').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (confirm('Are you sure you want to delete this address?')) {
        try {
          await removeAddress(id);
          showToast('Address removed!');
          await renderProfileTab(container);
        } catch (err) {
          showToast(err.message, 'danger');
        }
      }
    });
  });
};


// --- ORDERS HISTORY TAB & TRACKING TIMELINE ---
const renderOrdersTab = async (container) => {
  try {
    const orders = await fetchMyOrders();
    
    container.innerHTML = `
      <h3 class="fw-bold mb-4">My Orders History</h3>
      
      <div id="orders-accordion" class="accordion accordion-flush">
        ${
          orders.length > 0
            ? orders.map((order, idx) => {
              const orderId = order._id;
              const dateStr = new Date(order.createdAt).toLocaleDateString();
              const statusClass = order.orderStatus === 'delivered' ? 'bg-success' : 
                                  order.orderStatus === 'cancelled' ? 'bg-danger' : 'bg-warning text-dark';
                                  
              return `
                <div class="accordion-item border rounded-3 mb-3 bg-light border-color" style="border-radius: 12px; overflow:hidden;">
                  <h2 class="accordion-header">
                    <button class="accordion-button collapsed d-flex justify-content-between align-items-center bg-transparent py-3" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${orderId}" aria-expanded="false" aria-controls="collapse-${orderId}">
                      <div class="d-flex flex-wrap align-items-center gap-2 gap-sm-4 w-100">
                        <div>
                          <small class="text-muted d-block">ORDER ID</small>
                          <strong class="text-heading text-uppercase" style="font-size:0.9rem">#${orderId.slice(-6)}</strong>
                        </div>
                        <div>
                          <small class="text-muted d-block">DATE PLACED</small>
                          <strong class="text-heading" style="font-size:0.9rem">${dateStr}</strong>
                        </div>
                        <div>
                          <small class="text-muted d-block">TOTAL PRICE</small>
                          <strong class="text-primary" style="font-size:0.9rem">$${order.totalPrice.toFixed(2)}</strong>
                        </div>
                        <div class="ms-sm-auto">
                          <span class="badge ${statusClass} rounded-pill px-3 py-2 fw-semibold" style="font-size:0.75rem">${order.orderStatus.toUpperCase()}</span>
                        </div>
                      </div>
                    </button>
                  </h2>
                  <div id="collapse-${orderId}" class="accordion-collapse collapse" data-bs-parent="#orders-accordion">
                    <div class="accordion-body bg-white p-4">
                      
                      <!-- 1. Order Tracking Timeline -->
                      <h6 class="fw-bold mb-4"><i class="bi bi-clock-history me-2 text-primary"></i>Delivery Tracking Timeline</h6>
                      <div class="timeline-steps py-2 mb-5">
                        ${['pending', 'processing', 'shipped', 'delivered'].map((step, sIdx) => {
                          const currentStatusIdx = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.orderStatus);
                          
                          let timelineClass = '';
                          let stepIcon = 'bi-circle';

                          if (order.orderStatus === 'cancelled') {
                            timelineClass = sIdx === 0 ? 'completed' : '';
                            if (sIdx === 0) stepIcon = 'bi-check-lg';
                          } else if (order.orderStatus === 'returned') {
                            timelineClass = 'completed';
                            stepIcon = 'bi-arrow-counterclockwise';
                          } else {
                            if (currentStatusIdx >= sIdx) {
                              timelineClass = 'completed';
                              stepIcon = 'bi-check-lg';
                            }
                            if (currentStatusIdx === sIdx) {
                              timelineClass = 'active';
                              stepIcon = 'bi-truck';
                            }
                          }

                          return `
                            <div class="timeline-step ${timelineClass}">
                              <div class="timeline-step-icon">
                                <i class="bi ${stepIcon}"></i>
                              </div>
                              <small class="fw-bold text-uppercase d-block text-truncate" style="font-size: 0.65rem;">${step}</small>
                            </div>
                          `;
                        }).join('')}
                      </div>

                      <!-- 2. Ordered Items list -->
                      <h6 class="fw-bold mb-3"><i class="bi bi-box-seam me-2 text-primary"></i>Items Ordered</h6>
                      <div class="mb-4">
                        ${order.orderItems.map(item => `
                          <div class="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                            <div class="d-flex align-items-center gap-2">
                              <img src="${item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=80&q=80'}" alt="${item.name}" class="rounded border" style="width: 42px; height: 42px; object-fit: cover;">
                              <div>
                                <h6 class="mb-0 fw-semibold text-truncate" style="max-width: 250px;">${item.name}</h6>
                                <small class="text-muted">Qty: ${item.quantity} × $${item.price.toFixed(2)}</small>
                              </div>
                            </div>
                            <span class="fw-bold">$${(item.quantity * item.price).toFixed(2)}</span>
                          </div>
                        `).join('')}
                      </div>

                      <!-- 3. Address details -->
                      <div class="row mb-4 bg-light p-3 rounded" style="border-radius:12px;">
                        <div class="col-md-6 mb-3 mb-md-0">
                          <strong class="small text-muted text-uppercase d-block mb-1">Shipping Address</strong>
                          <p class="mb-0 small text-secondary">${order.shippingAddress.street}<br>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
                        </div>
                        <div class="col-md-6">
                          <strong class="small text-muted text-uppercase d-block mb-1">Billing Address</strong>
                          <p class="mb-0 small text-secondary">${order.billingAddress.street}<br>${order.billingAddress.city}, ${order.billingAddress.state} ${order.billingAddress.zipCode}</p>
                        </div>
                      </div>

                      <!-- 4. Action buttons -->
                      <div class="d-flex flex-wrap gap-2 justify-content-between">
                        <button class="btn btn-outline-primary btn-sm rounded-pill px-3 py-2 btn-dash-invoice" data-id="${orderId}">
                          <i class="bi bi-file-earmark-pdf me-1"></i>Download Invoice
                        </button>
                        
                        <div>
                          ${order.orderStatus === 'pending' || order.orderStatus === 'processing' ? `
                            <button class="btn btn-outline-danger btn-sm rounded-pill px-3 py-2 btn-dash-cancel" data-id="${orderId}">Cancel Order</button>
                          ` : ''}
                          
                          ${order.orderStatus === 'delivered' ? `
                            <button class="btn btn-outline-warning btn-sm rounded-pill px-3 py-2 text-dark btn-dash-return" data-id="${orderId}">Request Return</button>
                          ` : ''}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              `;
            }).join('')
            : '<div class="text-center py-5"><i class="bi bi-box2 text-muted display-4 mb-2"></i><h6>No Orders Placed Yet</h6><p class="text-muted">Once you buy products, details show here.</p></div>'
        }
      </div>
    `;

    // Bind Invoice PDF downloads
    container.querySelectorAll('.btn-dash-invoice').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        btn.disabled = true;
        try {
          const token = localStorage.getItem('apexcart_token');
          const response = await fetch(`/api/v1/orders/${id}/invoice`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice_${id.slice(-6)}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        } catch (e) {
          showToast('Failed to download invoice PDF', 'danger');
        } finally {
          btn.disabled = false;
        }
      });
    });

    // Bind Order Cancellations
    container.querySelectorAll('.btn-dash-cancel').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm('Are you sure you want to cancel this order? This will restock items.')) {
          try {
            await cancelOrderById(id);
            showToast('Order cancelled successfully');
            await renderOrdersTab(container);
          } catch (e) {
            showToast(e.message, 'danger');
          }
        }
      });
    });

    // Bind Order Returns
    container.querySelectorAll('.btn-dash-return').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm('Are you sure you want to return items in this order?')) {
          try {
            await requestOrderReturn(id);
            showToast('Return request processed successfully!');
            await renderOrdersTab(container);
          } catch (e) {
            showToast(e.message, 'danger');
          }
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Failed to fetch order history: ${err.message}</div>`;
  }
};


// --- WISHLIST TAB ---
const renderWishlistTab = async (container) => {
  try {
    const products = await fetchWishlist();
    
    container.innerHTML = `
      <h3 class="fw-bold mb-4">My Wishlist</h3>
      <div class="row" id="wishlist-grid">
        <!-- Loaded dynamically -->
      </div>
    `;

    const grid = document.getElementById('wishlist-grid');
    if (products.length > 0) {
      products.forEach(prod => {
        // Render card
        grid.appendChild(createProductCard(prod));
      });
    } else {
      grid.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-heart text-muted display-4 mb-3"></i>
          <h5 class="fw-bold">No Wishlist Items</h5>
          <p class="text-muted">Start bookmarking your favorite items to see them here.</p>
        </div>
      `;
    }

  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Failed to load wishlist items.</div>`;
  }
};


// --- NOTIFICATIONS HUB TAB ---
const renderNotificationsTab = async (container) => {
  try {
    const response = await fetchNotifications();
    const notifications = response.data;
    
    container.innerHTML = `
      <div class="d-flex align-items-center justify-content-between mb-4">
        <h3 class="fw-bold mb-0">Notifications</h3>
        ${notifications.length > 0 ? `<button id="btn-read-all" class="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold">Mark All Read</button>` : ''}
      </div>
      
      <div class="list-group" id="notifications-list">
        ${
          notifications.length > 0
            ? notifications.map((notif) => {
              const bgClass = notif.isRead ? 'bg-light' : 'bg-primary-subtle';
              const iconClass = notif.type === 'order' ? 'bi-bag-heart text-primary' : 
                                notif.type === 'inventory' ? 'bi-exclamation-triangle text-danger' : 'bi-info-circle text-info';
                                
              return `
                <div class="list-group-item d-flex gap-3 align-items-start border-color p-3 mb-2 rounded-3 ${bgClass} btn-notif-row" data-id="${notif._id}" style="cursor: pointer; border-radius:12px;">
                  <div class="rounded-circle p-2 bg-white d-flex align-items-center justify-content-center border" style="width: 40px; height: 40px; flex-shrink: 0;">
                    <i class="bi ${iconClass} fs-5"></i>
                  </div>
                  <div class="flex-grow-1">
                    <div class="d-flex align-items-center justify-content-between">
                      <h6 class="mb-1 fw-bold ${notif.isRead ? 'text-secondary' : 'text-dark'}">${notif.title}</h6>
                      <small class="text-muted" style="font-size:0.75rem">${new Date(notif.createdAt).toLocaleDateString()}</small>
                    </div>
                    <p class="mb-0 text-muted small">${notif.message}</p>
                  </div>
                </div>
              `;
            }).join('')
            : '<div class="text-center py-5 text-muted"><i class="bi bi-bell-slash display-4 mb-2"></i><h6>No Notifications</h6></div>'
        }
      </div>
    `;

    // Mark single notification as read on click
    container.querySelectorAll('.btn-notif-row').forEach(row => {
      row.addEventListener('click', async () => {
        const id = row.dataset.id;
        try {
          await markNotificationAsRead(id);
          row.classList.remove('bg-primary-subtle');
          row.classList.add('bg-light');
          row.querySelector('h6').className = 'mb-1 fw-bold text-secondary';
        } catch (e) {
          console.error(e);
        }
      });
    });

    // Mark all as read
    const readAllBtn = document.getElementById('btn-read-all');
    if (readAllBtn) {
      readAllBtn.addEventListener('click', async () => {
        try {
          await markAllNotificationsAsRead();
          showToast('All notifications marked as read');
          await renderNotificationsTab(container);
        } catch (e) {
          showToast(e.message, 'danger');
        }
      });
    }

  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Failed to load notifications hub.</div>`;
  }
};
