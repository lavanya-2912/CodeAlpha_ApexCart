import {
  fetchProducts,
  fetchCategories,
  fetchBrands,
  createNewProduct,
  editProductById,
  removeProductById,
  createCategoryAdmin,
  removeCategoryAdmin,
  createBrandAdmin,
  removeBrandAdmin
} from '../services/product.js';
import { fetchAllOrdersAdmin, updateOrderStatusAdmin, fetchAdminDashboardStats } from '../services/order.js';
import { fetchCouponsAdmin, createCouponAdmin, deleteCouponAdmin } from '../services/coupon.js';
import { getAdminUsers, removeUserAdmin, promoteUserAdmin } from '../services/auth.js';
import { showToast } from '../components/toast.js';
import state from '../state.js';

export const renderAdmin = async (container, params, query) => {
  const activeTab = query.tab || 'dashboard';

  container.innerHTML = `
    <div class="container py-5">
      <div class="d-flex align-items-center justify-content-between mb-5">
        <div>
          <h1 class="fw-bold mb-1"><i class="bi bi-shield-lock text-primary me-2"></i>Admin Control Panel</h1>
          <p class="text-muted mb-0">Manage system inventory, orders, discount coupons, and customers</p>
        </div>
        <a href="#/dashboard" class="btn btn-outline-secondary rounded-pill px-4 bg-white"><i class="bi bi-arrow-left me-1"></i>Client Dashboard</a>
      </div>

      <div class="row">
        <!-- Control Tabs Nav -->
        <div class="col-lg-3 mb-4">
          <div class="glass-panel p-3 border-color">
            <div class="nav flex-column nav-pills gap-2">
              <a class="nav-link rounded-3 fw-semibold ${activeTab === 'dashboard' ? 'active bg-primary' : 'text-secondary'}" href="#/admin?tab=dashboard"><i class="bi bi-speedometer2 me-2"></i>Statistics Report</a>
              <a class="nav-link rounded-3 fw-semibold ${activeTab === 'products' ? 'active bg-primary' : 'text-secondary'}" href="#/admin?tab=products"><i class="bi bi-box-seam me-2"></i>Inventory (Products)</a>
              <a class="nav-link rounded-3 fw-semibold ${activeTab === 'categories' ? 'active bg-primary' : 'text-secondary'}" href="#/admin?tab=categories"><i class="bi bi-grid-3x3-gap me-2"></i>Categories & Brands</a>
              <a class="nav-link rounded-3 fw-semibold ${activeTab === 'orders' ? 'active bg-primary' : 'text-secondary'}" href="#/admin?tab=orders"><i class="bi bi-receipt me-2"></i>Orders Registry</a>
              <a class="nav-link rounded-3 fw-semibold ${activeTab === 'coupons' ? 'active bg-primary' : 'text-secondary'}" href="#/admin?tab=coupons"><i class="bi bi-tags me-2"></i>Promo Coupons</a>
              <a class="nav-link rounded-3 fw-semibold ${activeTab === 'users' ? 'active bg-primary' : 'text-secondary'}" href="#/admin?tab=users"><i class="bi bi-people me-2"></i>User Management</a>
            </div>
          </div>
        </div>

        <!-- Dynamic Content Window -->
        <div class="col-lg-9">
          <div class="glass-panel p-4 p-md-5 border-color" id="admin-viewport">
            <div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>
          </div>
        </div>
      </div>
    </div>
  `;

  const viewport = document.getElementById('admin-viewport');

  // Route viewport renderer
  if (activeTab === 'dashboard') {
    await renderStatsDashboard(viewport);
  } else if (activeTab === 'products') {
    await renderProductManager(viewport);
  } else if (activeTab === 'categories') {
    await renderCategoryBrandManager(viewport);
  } else if (activeTab === 'orders') {
    await renderOrderManager(viewport);
  } else if (activeTab === 'coupons') {
    await renderCouponManager(viewport);
  } else if (activeTab === 'users') {
    await renderUserManager(viewport);
  }
};


// --- 1. STATISTICS DASHBOARD PANEL & CHART.JS ---
const renderStatsDashboard = async (container) => {
  try {
    const stats = await fetchAdminDashboardStats();
    
    container.innerHTML = `
      <h3 class="fw-bold mb-4">Analytics Dashboard</h3>
      
      <!-- Key Stats widgets -->
      <div class="row g-3 mb-5">
        <div class="col-sm-6 col-md-3">
          <div class="card border bg-light p-3 rounded h-100" style="border-radius: 12px;">
            <small class="text-muted d-block text-uppercase fw-bold fs-8">Total Revenue</small>
            <h3 class="fw-bold text-primary mb-0 mt-1">$${stats.totalRevenue.toFixed(2)}</h3>
          </div>
        </div>
        <div class="col-sm-6 col-md-3">
          <div class="card border bg-light p-3 rounded h-100" style="border-radius: 12px;">
            <small class="text-muted d-block text-uppercase fw-bold fs-8">Total Orders</small>
            <h3 class="fw-bold text-dark mb-0 mt-1">${stats.totalOrders}</h3>
          </div>
        </div>
        <div class="col-sm-6 col-md-3">
          <div class="card border bg-light p-3 rounded h-100" style="border-radius: 12px;">
            <small class="text-muted d-block text-uppercase fw-bold fs-8">Active Customers</small>
            <h3 class="fw-bold text-dark mb-0 mt-1">${stats.totalCustomers}</h3>
          </div>
        </div>
        <div class="col-sm-6 col-md-3">
          <div class="card border bg-light p-3 rounded h-100" style="border-radius: 12px;">
            <small class="text-muted d-block text-uppercase fw-bold fs-8">Stock Products</small>
            <h3 class="fw-bold text-dark mb-0 mt-1">${stats.totalProductsCount}</h3>
          </div>
        </div>
      </div>

      <!-- Canvas Charts Row -->
      <div class="row mb-5">
        <div class="col-md-6 mb-4 mb-md-0">
          <h5 class="fw-bold mb-3 text-center">Category Revenue Distribution</h5>
          <div style="position: relative; height:250px; width:100%">
            <canvas id="category-chart"></canvas>
          </div>
        </div>
        <div class="col-md-6">
          <h5 class="fw-bold mb-3 text-center">Orders Status Breakdown</h5>
          <div style="position: relative; height:250px; width:100%">
            <canvas id="status-chart"></canvas>
          </div>
        </div>
      </div>

      <!-- Low Stock Warnings -->
      <div>
        <h5 class="fw-bold mb-3 text-danger"><i class="bi bi-exclamation-triangle-fill me-2"></i>Low Stock Inventory Alert</h5>
        <div class="table-responsive">
          <table class="table table-bordered align-middle">
            <thead class="table-light">
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Qty in Stock</th>
              </tr>
            </thead>
            <tbody>
              ${
                stats.lowStock.length > 0
                  ? stats.lowStock.map((prod) => `
                    <tr>
                      <td class="fw-bold">${prod.name}</td>
                      <td>${prod.category ? prod.category.name : 'Unknown'}</td>
                      <td>${prod.brand ? prod.brand.name : 'Unknown'}</td>
                      <td class="text-danger fw-bold"><span class="badge bg-danger-subtle text-danger px-2">${prod.quantityInStock} left</span></td>
                    </tr>
                  `).join('')
                  : '<tr><td colspan="4" class="text-center text-muted">All products have sufficient stock levels (>5 units).</td></tr>'
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Draw charts using Chart.js library
    const catCanvas = document.getElementById('category-chart');
    const statusCanvas = document.getElementById('status-chart');

    // 1. Draw Category Pie Chart
    const categoryNames = stats.categoryRevenue.map(c => c.name);
    const categoryValues = stats.categoryRevenue.map(c => c.value);
    
    new Chart(catCanvas, {
      type: 'doughnut',
      data: {
        labels: categoryNames.length > 0 ? categoryNames : ['Empty'],
        datasets: [{
          data: categoryValues.length > 0 ? categoryValues : [0],
          backgroundColor: ['#6366f1', '#38bdf8', '#34d399', '#f43f5e', '#fbbf24', '#a78bfa'],
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });

    // 2. Draw Orders Status Bar Chart
    const statusLabels = Object.keys(stats.orderStats);
    const statusValues = Object.values(stats.orderStats);

    new Chart(statusCanvas, {
      type: 'bar',
      data: {
        labels: statusLabels.map(s => s.toUpperCase()),
        datasets: [{
          label: 'Orders Count',
          data: statusValues,
          backgroundColor: ['#e2e8f0', '#fbbf24', '#38bdf8', '#34d399', '#f43f5e'],
          borderRadius: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
        },
      },
    });

  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Failed to render dashboard reports: ${err.message}</div>`;
  }
};


// --- 2. PRODUCT INVENTORY CRUD MANAGER ---
const renderProductManager = async (container) => {
  let products = [];
  try {
    const response = await fetchProducts({ limit: 100 }); // pull large list
    products = response.data;
  } catch (e) {
    console.error(e);
  }

  container.innerHTML = `
    <div class="d-flex align-items-center justify-content-between mb-4">
      <h3 class="fw-bold mb-0">Inventory Products</h3>
      <button id="btn-add-product-form" class="btn btn-primary rounded-pill px-4 py-2 btn-premium"><i class="bi bi-plus-lg me-1"></i>Create Product</button>
    </div>

    <!-- Product CRUD viewport container -->
    <div id="product-crud-viewport">
      <div class="table-responsive">
        <table class="table table-striped align-middle border">
          <thead class="table-light">
            <tr>
              <th>Image</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              products.length > 0
                ? products.map((prod) => `
                  <tr>
                    <td><img src="${prod.images && prod.images.length > 0 ? prod.images[0] : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=60&q=80'}" alt="${prod.name}" class="rounded border" style="width: 50px; height: 50px; object-fit: cover;"></td>
                    <td class="fw-bold text-heading">${prod.name}</td>
                    <td>${prod.category ? prod.category.name : 'Category'}</td>
                    <td><strong class="text-primary">$${(prod.discountPrice > 0 ? prod.discountPrice : prod.price).toFixed(2)}</strong></td>
                    <td><span class="badge ${prod.quantityInStock > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-2">${prod.quantityInStock} units</span></td>
                    <td>
                      <button class="btn btn-sm btn-outline-secondary btn-edit-prod rounded-circle me-1" data-id="${prod._id}" title="Edit"><i class="bi bi-pencil"></i></button>
                      <button class="btn btn-sm btn-outline-danger btn-delete-prod rounded-circle" data-id="${prod._id}" title="Delete"><i class="bi bi-trash"></i></button>
                    </td>
                  </tr>
                `).join('')
                : '<tr><td colspan="6" class="text-center text-muted">No products found. Create some stock.</td></tr>'
            }
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Bind deletion clicks
  container.querySelectorAll('.btn-delete-prod').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (confirm('Are you sure you want to delete this product?')) {
        try {
          await removeProductById(id);
          showToast('Product deleted from inventory');
          await renderProductManager(container);
        } catch (err) {
          showToast(err.message, 'danger');
        }
      }
    });
  });

  // Bind Create/Edit Form opening clicks
  const crudViewport = document.getElementById('product-crud-viewport');
  
  const showProductForm = async (productId = null) => {
    let product = null;
    let categories = [];
    let brands = [];
    
    try {
      categories = await fetchCategories();
      brands = await fetchBrands();
      if (productId) {
        // Edit mode
        const pResponse = await fetch(`/api/v1/products/${productId}`);
        const pData = await pResponse.json();
        product = pData.data;
      }
    } catch (e) {
      showToast(e.message, 'danger');
      return;
    }

    // Specifications string compiler
    let specsListHtml = '';
    if (product && product.specifications) {
      // product.specifications is a Mapped Object
      Object.entries(product.specifications).forEach(([key, val]) => {
        specsListHtml += `
          <div class="row g-2 mb-2 spec-row-item">
            <div class="col-5"><input type="text" class="form-control spec-key" value="${key}" placeholder="Key (e.g. Color)" required></div>
            <div class="col-5"><input type="text" class="form-control spec-value" value="${val}" placeholder="Value (e.g. Red)" required></div>
            <div class="col-2"><button type="button" class="btn btn-outline-danger btn-remove-spec-row w-100"><i class="bi bi-dash"></i></button></div>
          </div>
        `;
      }
      );
    }

    crudViewport.innerHTML = `
      <div class="glass-panel p-4 border bg-light" style="border-radius:12px;">
        <h5 class="fw-bold mb-4">${product ? 'Edit Product Details' : 'Create New Inventory Product'}</h5>
        
        <form id="product-upsert-form" enctype="multipart/form-data">
          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="prod-form-name" class="form-label small fw-bold">Product Name</label>
              <input type="text" id="prod-form-name" class="form-control bg-white" value="${product ? product.name : ''}" required>
            </div>
            <div class="col-md-3 mb-3">
              <label for="prod-form-price" class="form-label small fw-bold">Original Price ($)</label>
              <input type="number" id="prod-form-price" class="form-control bg-white" value="${product ? product.price : ''}" required min="0" step="0.01">
            </div>
            <div class="col-md-3 mb-3">
              <label for="prod-form-discount" class="form-label small fw-bold">Discount Price ($)</label>
              <input type="number" id="prod-form-discount" class="form-control bg-white" value="${product ? product.discountPrice : ''}" min="0" step="0.01">
            </div>
          </div>

          <div class="row">
            <div class="col-md-4 mb-3">
              <label for="prod-form-category" class="form-label small fw-bold">Category</label>
              <select id="prod-form-category" class="form-select bg-white" required>
                <option value="">-- Choose Category --</option>
                ${categories.map(c => `
                  <option value="${c._id}" ${product && product.category._id === c._id ? 'selected' : ''}>${c.name}</option>
                `).join('')}
              </select>
            </div>
            <div class="col-md-4 mb-3">
              <label for="prod-form-brand" class="form-label small fw-bold">Brand</label>
              <select id="prod-form-brand" class="form-select bg-white" required>
                <option value="">-- Choose Brand --</option>
                ${brands.map(b => `
                  <option value="${b._id}" ${product && product.brand._id === b._id ? 'selected' : ''}>${b.name}</option>
                `).join('')}
              </select>
            </div>
            <div class="col-md-4 mb-3">
              <label for="prod-form-qty" class="form-label small fw-bold">Stock Quantity</label>
              <input type="number" id="prod-form-qty" class="form-control bg-white" value="${product ? product.quantityInStock : '10'}" required min="0">
            </div>
          </div>

          <div class="mb-3">
            <label for="prod-form-desc" class="form-label small fw-bold">Product Description</label>
            <textarea id="prod-form-desc" class="form-control bg-white" rows="4" required>${product ? product.description : ''}</textarea>
          </div>

          <!-- Product Images uploads -->
          <div class="mb-4">
            <label for="prod-form-images" class="form-label small fw-bold">Upload Product Images (Max 5 files)</label>
            <input type="file" id="prod-form-images" class="form-control bg-white" multiple accept="image/*">
            ${product && product.images && product.images.length > 0 ? `
              <div class="d-flex gap-2 mt-2">
                ${product.images.map(img => `
                  <img src="${img}" alt="Preview" class="border rounded" style="width: 60px; height: 60px; object-fit: cover;">
                `).join('')}
              </div>
              <div class="form-check mt-2 text-danger">
                <input class="form-check-input" type="checkbox" id="replace-images-check">
                <label class="form-check-label small" for="replace-images-check">Replace existing images on save (otherwise appends)</label>
              </div>
            ` : ''}
          </div>

          <!-- Specs Map builder -->
          <div class="mb-4 border p-3 rounded bg-white">
            <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
              <h6 class="fw-bold mb-0">Technical Specifications Map</h6>
              <button type="button" id="btn-add-spec-row" class="btn btn-sm btn-outline-primary rounded-pill"><i class="bi bi-plus"></i>Add Row</button>
            </div>
            <div id="specs-list-wrapper">
              ${specsListHtml}
            </div>
          </div>

          <!-- Highlight settings -->
          <div class="row mb-4">
            <div class="col-6 col-sm-4">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="prod-form-featured" ${product && product.isFeatured ? 'checked' : ''}>
                <label class="form-check-label fw-bold text-muted small" for="prod-form-featured">Featured Product</label>
              </div>
            </div>
            <div class="col-6 col-sm-4">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="prod-form-trending" ${product && product.isTrending ? 'checked' : ''}>
                <label class="form-check-label fw-bold text-muted small" for="prod-form-trending">Trending Product</label>
              </div>
            </div>
          </div>

          <div class="d-flex gap-3 justify-content-end border-top pt-3">
            <button type="button" id="btn-cancel-upsert" class="btn btn-outline-secondary rounded-pill px-4">Cancel</button>
            <button type="submit" id="btn-save-prod-submit" class="btn btn-primary btn-premium rounded-pill px-5">Save Product</button>
          </div>
        </form>
      </div>
    `;

    // Add spec row clicker
    document.getElementById('btn-add-spec-row').addEventListener('click', () => {
      const wrapper = document.getElementById('specs-list-wrapper');
      const row = document.createElement('div');
      row.className = 'row g-2 mb-2 spec-row-item';
      row.innerHTML = `
        <div class="col-5"><input type="text" class="form-control spec-key" placeholder="Key" required></div>
        <div class="col-5"><input type="text" class="form-control spec-value" placeholder="Value" required></div>
        <div class="col-2"><button type="button" class="btn btn-outline-danger btn-remove-spec-row w-100"><i class="bi bi-dash"></i></button></div>
      `;
      
      row.querySelector('.btn-remove-spec-row').addEventListener('click', () => row.remove());
      wrapper.appendChild(row);
    });

    // Delegate spec row removals for initial items
    crudViewport.querySelectorAll('.btn-remove-spec-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        btn.closest('.spec-row-item').remove();
      });
    });

    // Form cancel
    document.getElementById('btn-cancel-upsert').addEventListener('click', () => {
      renderProductManager(container);
    });

    // Upsert Form submission
    const form = document.getElementById('product-upsert-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById('btn-save-prod-submit');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

      // Reassemble specifications maps
      const specsObj = {};
      crudViewport.querySelectorAll('.spec-row-item').forEach(row => {
        const key = row.querySelector('.spec-key').value.trim();
        const val = row.querySelector('.spec-value').value.trim();
        if (key && val) {
          specsObj[key] = val;
        }
      });

      // Construct FormData to support image uploads
      const formData = new FormData();
      formData.append('name', document.getElementById('prod-form-name').value.trim());
      formData.append('price', document.getElementById('prod-form-price').value);
      formData.append('discountPrice', document.getElementById('prod-form-discount').value || 0);
      formData.append('category', document.getElementById('prod-form-category').value);
      formData.append('brand', document.getElementById('prod-form-brand').value);
      formData.append('quantityInStock', document.getElementById('prod-form-qty').value);
      formData.append('description', document.getElementById('prod-form-desc').value.trim());
      formData.append('isFeatured', document.getElementById('prod-form-featured').checked);
      formData.append('isTrending', document.getElementById('prod-form-trending').checked);
      formData.append('specifications', JSON.stringify(specsObj));

      // Append upload images
      const imagesInput = document.getElementById('prod-form-images');
      if (imagesInput.files.length > 0) {
        for (let i = 0; i < imagesInput.files.length; i++) {
          formData.append('images', imagesInput.files[i]);
        }
      }

      // Check replace flag
      const replaceCheck = document.getElementById('replace-images-check');
      if (replaceCheck && replaceCheck.checked) {
        formData.append('replaceImages', 'true');
      }

      try {
        if (productId) {
          await editProductById(productId, formData);
          showToast('Product updated in database successfully!');
        } else {
          await createNewProduct(formData);
          showToast('New product added to inventory successfully!');
        }
        await renderProductManager(container);
      } catch (err) {
        showToast(err.message, 'danger');
        submitBtn.disabled = false;
        submitBtn.innerText = 'Save Product';
      }
    });
  };

  // Add click listeners to show forms
  document.getElementById('btn-add-product-form').addEventListener('click', () => showProductForm());
  container.querySelectorAll('.btn-edit-prod').forEach(btn => {
    btn.addEventListener('click', () => showProductForm(btn.dataset.id));
  });
};


// --- 3. CATEGORIES & BRANDS MANAGEMENT ---
const renderCategoryBrandManager = async (container) => {
  let categories = [];
  let brands = [];
  try {
    categories = await fetchCategories();
    brands = await fetchBrands();
  } catch (e) {
    console.error(e);
  }

  container.innerHTML = `
    <h3 class="fw-bold mb-5">Categories & Brands</h3>

    <div class="row">
      <!-- Categories Management -->
      <div class="col-md-6 mb-4 mb-md-0">
        <div class="card p-3 border mb-4" style="border-radius:12px;">
          <h5 class="fw-bold mb-3">Add Category</h5>
          <form id="add-category-form">
            <div class="mb-3">
              <label for="cat-name-input" class="form-label small fw-bold">Category Name</label>
              <input type="text" id="cat-name-input" class="form-control bg-light" required placeholder="e.g. Sports">
            </div>
            <div class="mb-3">
              <label for="cat-img-input" class="form-label small fw-bold">Image URL (Optional)</label>
              <input type="url" id="cat-img-input" class="form-control bg-light" placeholder="https://...">
            </div>
            <button type="submit" class="btn btn-primary btn-sm rounded-pill px-4 py-2">Create Category</button>
          </form>
        </div>

        <h6 class="fw-bold mb-2">Category List</h6>
        <ul class="list-group border border-color" style="border-radius: 12px; overflow:hidden">
          ${categories.map(c => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
              <span>${c.name}</span>
              <button class="btn btn-sm btn-link text-danger p-0 btn-delete-cat" data-id="${c._id}"><i class="bi bi-trash"></i></button>
            </li>
          `).join('')}
        </ul>
      </div>

      <!-- Brands Management -->
      <div class="col-md-6">
        <div class="card p-3 border mb-4" style="border-radius:12px;">
          <h5 class="fw-bold mb-3">Add Brand</h5>
          <form id="add-brand-form">
            <div class="mb-3">
              <label for="brand-name-input" class="form-label small fw-bold">Brand Name</label>
              <input type="text" id="brand-name-input" class="form-control bg-light" required placeholder="e.g. Sony">
            </div>
            <button type="submit" class="btn btn-primary btn-sm rounded-pill px-4 py-2">Create Brand</button>
          </form>
        </div>

        <h6 class="fw-bold mb-2">Brand List</h6>
        <ul class="list-group border border-color" style="border-radius: 12px; overflow:hidden">
          ${brands.map(b => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
              <span>${b.name}</span>
              <button class="btn btn-sm btn-link text-danger p-0 btn-delete-brand" data-id="${b._id}"><i class="bi bi-trash"></i></button>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `;

  // Bind category add
  const catForm = document.getElementById('add-category-form');
  catForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('cat-name-input').value.trim();
    const image = document.getElementById('cat-img-input').value.trim();
    
    try {
      await createCategoryAdmin({ name, image });
      showToast('Category created!');
      await renderCategoryBrandManager(container);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });

  // Bind brand add
  const brandForm = document.getElementById('add-brand-form');
  brandForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('brand-name-input').value.trim();
    
    try {
      await createBrandAdmin({ name });
      showToast('Brand created!');
      await renderCategoryBrandManager(container);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });

  // Bind category deletes
  container.querySelectorAll('.btn-delete-cat').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (confirm('Delete category?')) {
        try {
          await removeCategoryAdmin(id);
          showToast('Category deleted');
          await renderCategoryBrandManager(container);
        } catch (err) {
          showToast(err.message, 'danger');
        }
      }
    });
  });

  // Bind brand deletes
  container.querySelectorAll('.btn-delete-brand').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (confirm('Delete brand?')) {
        try {
          await removeBrandAdmin(id);
          showToast('Brand deleted');
          await renderCategoryBrandManager(container);
        } catch (err) {
          showToast(err.message, 'danger');
        }
      }
    });
  });
};


// --- 4. SECURE ORDER REGISTRY MANAGER ---
const renderOrderManager = async (container) => {
  let orders = [];
  try {
    orders = await fetchAllOrdersAdmin();
  } catch (e) {
    console.error(e);
  }

  container.innerHTML = `
    <h3 class="fw-bold mb-4">Orders Registry</h3>
    
    <div class="table-responsive">
      <table class="table table-bordered align-middle text-nowrap">
        <thead class="table-light">
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Placed Date</th>
            <th>Grand Total</th>
            <th>Order Status</th>
            <th>Adjust Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            orders.length > 0
              ? orders.map((order) => {
                const dateStr = new Date(order.createdAt).toLocaleDateString();
                return `
                  <tr>
                    <td class="fw-bold text-uppercase">#${order._id.toString().slice(-6)}</td>
                    <td>
                      <div class="fw-bold">${order.user ? order.user.name : 'Guest'}</div>
                      <small class="text-muted">${order.user ? order.user.email : ''}</small>
                    </td>
                    <td>${dateStr}</td>
                    <td class="fw-bold text-primary">$${order.totalPrice.toFixed(2)}</td>
                    <td>
                      <span class="badge ${order.orderStatus === 'delivered' ? 'bg-success' : order.orderStatus === 'cancelled' ? 'bg-danger' : 'bg-warning text-dark'} px-2 py-1">
                        ${order.orderStatus.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <form class="d-flex gap-2 btn-status-update-form" data-id="${order._id}">
                        <select class="form-select form-select-sm status-select" style="width: 130px;">
                          <option value="pending" ${order.orderStatus === 'pending' ? 'selected' : ''}>Pending</option>
                          <option value="processing" ${order.orderStatus === 'processing' ? 'selected' : ''}>Processing</option>
                          <option value="shipped" ${order.orderStatus === 'shipped' ? 'selected' : ''}>Shipped</option>
                          <option value="delivered" ${order.orderStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
                          <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                        <button type="submit" class="btn btn-sm btn-primary py-1"><i class="bi bi-check-lg"></i></button>
                      </form>
                    </td>
                  </tr>
                `;
              }).join('')
              : '<tr><td colspan="6" class="text-center text-muted">No orders found in database.</td></tr>'
          }
        </tbody>
      </table>
    </div>
  `;

  // Bind status changes
  container.querySelectorAll('.btn-status-update-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = form.dataset.id;
      const status = form.querySelector('.status-select').value;

      try {
        await updateOrderStatusAdmin(id, { orderStatus: status });
        showToast('Order status updated!');
        await renderOrderManager(container);
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });
  });
};


// --- 5. PROMO COUPONS MANAGER ---
const renderCouponManager = async (container) => {
  let coupons = [];
  try {
    coupons = await fetchCouponsAdmin();
  } catch (e) {
    console.error(e);
  }

  container.innerHTML = `
    <h3 class="fw-bold mb-4">Promo Coupons Management</h3>
    
    <div class="row">
      <!-- Create coupon form -->
      <div class="col-md-5 mb-4 mb-md-0">
        <div class="card p-4 border" style="border-radius: 12px;">
          <h5 class="fw-bold mb-3 border-bottom pb-2">Create Coupon</h5>
          <form id="create-coupon-form">
            <div class="mb-3">
              <label for="cp-code" class="form-label small fw-bold">Coupon Code</label>
              <input type="text" id="cp-code" class="form-control bg-light text-uppercase" placeholder="e.g. WELCOME20" required>
            </div>
            
            <div class="mb-3">
              <label for="cp-percent" class="form-label small fw-bold">Discount Percentage (%)</label>
              <input type="number" id="cp-percent" class="form-control bg-light" min="1" max="100" placeholder="20" required>
            </div>

            <div class="mb-4">
              <label for="cp-expiry" class="form-label small fw-bold">Expiry Date</label>
              <input type="date" id="cp-expiry" class="form-control bg-light" required>
            </div>

            <button type="submit" class="btn btn-primary btn-premium w-100 py-2 rounded-pill fw-bold">Generate Coupon</button>
          </form>
        </div>
      </div>

      <!-- Coupons list -->
      <div class="col-md-7">
        <div class="glass-panel p-4 border-color">
          <h5 class="fw-bold mb-3 border-bottom pb-2">Active Coupons</h5>
          <div class="table-responsive">
            <table class="table table-bordered align-middle">
              <thead class="table-light">
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Expiry</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${
                  coupons.length > 0
                    ? coupons.map((cp) => {
                      const expDate = new Date(cp.expiryDate).toLocaleDateString();
                      return `
                        <tr>
                          <td class="fw-bold text-primary">${cp.code}</td>
                          <td><span class="badge bg-success-subtle text-success border border-success rounded-pill">${cp.discountPercentage}% OFF</span></td>
                          <td>${expDate}</td>
                          <td>
                            <button class="btn btn-sm btn-outline-danger border-0 btn-delete-coupon" data-id="${cp._id}"><i class="bi bi-trash"></i></button>
                          </td>
                        </tr>
                      `;
                    }).join('')
                    : '<tr><td colspan="4" class="text-center text-muted">No coupons found. Create some.</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind coupon creation
  const form = document.getElementById('create-coupon-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const couponData = {
      code: document.getElementById('cp-code').value.trim().toUpperCase(),
      discountPercentage: parseInt(document.getElementById('cp-percent').value, 10),
      expiryDate: new Date(document.getElementById('cp-expiry').value),
    };

    try {
      await createCouponAdmin(couponData);
      showToast('Promo Coupon created successfully!');
      await renderCouponManager(container);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });

  // Bind deletions
  container.querySelectorAll('.btn-delete-coupon').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (confirm('Delete coupon code?')) {
        try {
          await deleteCouponAdmin(id);
          showToast('Coupon deleted');
          await renderCouponManager(container);
        } catch (err) {
          showToast(err.message, 'danger');
        }
      }
    });
  });
};


// --- 6. USER MANAGEMENT ---
const renderUserManager = async (container) => {
  let users = [];
  try {
    users = await getAdminUsers();
  } catch (e) {
    console.error(e);
  }

  container.innerHTML = `
    <h3 class="fw-bold mb-4">Registered Accounts</h3>
    
    <div class="table-responsive">
      <table class="table table-bordered align-middle">
        <thead class="table-light">
          <tr>
            <th>User Info</th>
            <th>Registration Date</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${
            users.length > 0
              ? users.map((u) => {
                const dateStr = new Date(u.createdAt).toLocaleDateString();
                const isSelf = u._id === state.get('user')._id;
                
                return `
                  <tr>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <img src="${u.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=60&h=60&q=80'}" class="rounded-circle border" style="width:36px; height:36px; object-fit:cover;">
                        <div>
                          <div class="fw-bold">${u.name}</div>
                          <small class="text-muted">${u.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>${dateStr}</td>
                    <td>
                      <span class="badge ${u.role === 'admin' ? 'bg-primary' : 'bg-secondary'} rounded-pill px-2">
                        ${u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      ${!isSelf && u.role !== 'admin' ? `
                        <button class="btn btn-sm btn-outline-primary btn-promote-user rounded-pill px-2 py-0 fs-8 me-1" data-id="${u._id}" style="font-size:0.75rem">Promote Admin</button>
                        <button class="btn btn-sm btn-outline-danger btn-delete-user rounded-circle" data-id="${u._id}"><i class="bi bi-trash"></i></button>
                      ` : isSelf ? '<small class="text-muted italic">Active Account (You)</small>' : '<small class="text-muted">Administrator</small>'}
                    </td>
                  </tr>
                `;
              }).join('')
              : '<tr><td colspan="4" class="text-center text-muted">No registered users found.</td></tr>'
          }
        </tbody>
      </table>
    </div>
  `;

  // Bind promotions
  container.querySelectorAll('.btn-promote-user').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (confirm('Promote user to administrator? This is irreversible.')) {
        try {
          await promoteUserAdmin(id);
          showToast('User promoted to Administrator role!');
          await renderUserManager(container);
        } catch (err) {
          showToast(err.message, 'danger');
        }
      }
    });
  });

  // Bind deletions (account deactivations)
  container.querySelectorAll('.btn-delete-user').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (confirm('Permanently deactivate this user account?')) {
        try {
          await removeUserAdmin(id);
          showToast('User account deactivated and deleted.');
          await renderUserManager(container);
        } catch (err) {
          showToast(err.message, 'danger');
        }
      }
    });
  });
};
