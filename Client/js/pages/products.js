import { fetchProducts, fetchCategories, fetchBrands } from '../services/product.js';
import { createProductCard } from '../components/productCard.js';
import { renderProductGridSkeleton } from '../components/skeletons.js';
import state from '../state.js';

export const renderProducts = async (container, params, query) => {
  // Pre-load categories and brands
  let categories = [];
  let brands = [];
  try {
    categories = await fetchCategories();
    brands = await fetchBrands();
  } catch (e) {
    console.error('Failed to load filter metadata:', e);
  }

  // Draw basic layout structure
  container.innerHTML = `
    <div class="container py-5">
      <div class="row">
        <!-- Sidebar Filters Column -->
        <div class="col-lg-3 mb-4">
          <div class="glass-panel p-4 border-color sticky-top" style="top: 100px; z-index: 10;">
            <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
              <h5 class="fw-bold mb-0">Filters</h5>
              <button id="clear-filters-btn" class="btn btn-sm btn-link text-primary text-decoration-none fw-semibold p-0">Clear All</button>
            </div>

            <!-- Sort By -->
            <div class="mb-4">
              <label class="form-label fw-bold small text-uppercase">Sort By</label>
              <select id="sort-select" class="form-select bg-light border-color">
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>

            <!-- Category Filter -->
            <div class="mb-4">
              <label class="form-label fw-bold small text-uppercase">Category</label>
              <div id="categories-filter-list" class="max-height-180 overflow-y-auto pe-1" style="max-height: 180px; overflow-y: auto;">
                ${categories.map(cat => `
                  <div class="form-check mb-2">
                    <input class="form-check-input category-checkbox" type="checkbox" value="${cat._id}" id="cat-${cat._id}">
                    <label class="form-check-label text-muted" for="cat-${cat._id}">${cat.name}</label>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Brand Filter -->
            <div class="mb-4">
              <label class="form-label fw-bold small text-uppercase">Brand</label>
              <div id="brands-filter-list" class="max-height-180 overflow-y-auto pe-1" style="max-height: 180px; overflow-y: auto;">
                ${brands.map(brand => `
                  <div class="form-check mb-2">
                    <input class="form-check-input brand-checkbox" type="checkbox" value="${brand._id}" id="brand-${brand._id}">
                    <label class="form-check-label text-muted" for="brand-${brand._id}">${brand.name}</label>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Price Bounds -->
            <div class="mb-4">
              <label class="form-label fw-bold small text-uppercase">Price Range</label>
              <div class="row g-2">
                <div class="col-6">
                  <input type="number" id="price-min" class="form-control bg-light border-color" placeholder="Min $" min="0">
                </div>
                <div class="col-6">
                  <input type="number" id="price-max" class="form-control bg-light border-color" placeholder="Max $" min="0">
                </div>
              </div>
              <button id="apply-price-btn" class="btn btn-outline-primary btn-sm w-100 mt-2 rounded-pill fw-semibold">Apply Price</button>
            </div>

            <!-- Star Ratings -->
            <div class="mb-4">
              <label class="form-label fw-bold small text-uppercase">Rating</label>
              <div class="d-flex flex-column gap-2">
                ${[4, 3, 2, 1].map(stars => `
                  <div class="form-check">
                    <input class="form-check-input rating-radio" type="radio" name="rating-filter" value="${stars}" id="rating-${stars}">
                    <label class="form-check-label text-muted" for="rating-${stars}">
                      ${stars}+ Stars (${stars}.0 & up)
                    </label>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Availability -->
            <div class="mb-2">
              <label class="form-label fw-bold small text-uppercase">Availability</label>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="in-stock-checkbox">
                <label class="form-check-label text-muted" for="in-stock-checkbox">In Stock Only</label>
              </div>
            </div>

          </div>
        </div>

        <!-- Products List Column -->
        <div class="col-lg-9">
          <!-- Active Search / Header -->
          <div class="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
            <div>
              <h2 id="catalog-title" class="fw-bold mb-1">Our Catalog</h2>
              <p id="catalog-results-count" class="text-muted mb-0">Showing products...</p>
            </div>
            
            <!-- History terms if available -->
            <div id="search-history-container" class="d-flex align-items-center gap-2" style="display: none;">
              <small class="text-muted">History:</small>
              <div id="search-history-list" class="d-flex gap-1 flex-wrap"></div>
            </div>
          </div>

          <!-- Product Cards Grid -->
          <div id="catalog-products-grid" class="row">
            <!-- Loading Skeletons -->
          </div>

          <!-- Pagination Controls -->
          <nav aria-label="Catalog pagination" class="mt-5">
            <ul id="catalog-pagination-list" class="pagination justify-content-center">
              <!-- Rendered dynamically -->
            </ul>
          </nav>
        </div>
      </div>

      <!-- Recently Viewed Rows -->
      <div id="recently-viewed-section" class="mt-5 pt-5 border-top" style="display: none;">
        <h3 class="fw-bold mb-4">Recently Viewed Products</h3>
        <div id="recently-viewed-grid" class="row"></div>
      </div>
    </div>
  `;

  // Dynamic filter state values
  const filterState = {
    search: query.search || '',
    category: query.category || '',
    brand: query.brand || '',
    priceMin: '',
    priceMax: '',
    ratingMin: '',
    availability: '',
    sort: 'newest',
    page: 1,
    limit: 8
  };

  // Pre-fill filter inputs from URL query params
  if (query.category) {
    const check = document.getElementById(`cat-${query.category}`);
    if (check) check.checked = true;
  }
  if (query.search) {
    document.getElementById('catalog-title').innerText = `Search results for "${query.search}"`;
  }

  // Draw Recently Viewed row
  const drawRecentlyViewed = () => {
    const rvSec = document.getElementById('recently-viewed-section');
    const rvGrid = document.getElementById('recently-viewed-grid');
    const recentlyViewed = state.get('recentlyViewed');
    
    if (recentlyViewed && recentlyViewed.length > 0) {
      rvSec.style.display = 'block';
      rvGrid.innerHTML = '';
      recentlyViewed.forEach(prod => {
        rvGrid.appendChild(createProductCard(prod));
      });
    } else {
      rvSec.style.display = 'none';
    }
  };

  // Draw search history chips
  const drawSearchHistory = () => {
    const historySec = document.getElementById('search-history-container');
    const historyList = document.getElementById('search-history-list');
    const history = state.get('searchHistory');

    if (history && history.length > 0) {
      historySec.style.style = 'flex';
      historyList.innerHTML = '';
      history.slice(0, 4).forEach((term) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-light border rounded-pill px-2 py-0 fs-8';
        btn.innerText = term;
        btn.style.fontSize = '0.75rem';
        btn.addEventListener('click', () => {
          document.getElementById('catalog-title').innerText = `Search results for "${term}"`;
          filterState.search = term;
          filterState.page = 1;
          const navInput = document.getElementById('nav-search-input');
          if (navInput) navInput.value = term;
          loadProducts();
        });
        historyList.appendChild(btn);
      });
    } else {
      historySec.style.display = 'none';
    }
  };

  // Main fetch call wrapper
  const loadProducts = async () => {
    const grid = document.getElementById('catalog-products-grid');
    renderProductGridSkeleton(grid, 4);

    try {
      const response = await fetchProducts(filterState);
      grid.innerHTML = '';
      
      const countEl = document.getElementById('catalog-results-count');
      countEl.innerText = `Showing ${response.data.length} of ${response.total} products`;

      if (response.data.length > 0) {
        response.data.forEach(prod => {
          grid.appendChild(createProductCard(prod));
        });
        renderPagination(response.total, response.pagination);
      } else {
        grid.innerHTML = `
          <div class="col-12 text-center py-5">
            <i class="bi bi-search text-muted display-4 mb-3"></i>
            <h4 class="fw-bold">No Products Found</h4>
            <p class="text-muted">Try adjusting your active filters or clear search term queries.</p>
          </div>
        `;
        document.getElementById('catalog-pagination-list').innerHTML = '';
      }
    } catch (e) {
      grid.innerHTML = `<div class="alert alert-danger col-12">Failed to load product feeds: ${e.message}</div>`;
    }
  };

  // Pagination Builder
  const renderPagination = (totalItems, paginationInfo) => {
    const pagList = document.getElementById('catalog-pagination-list');
    pagList.innerHTML = '';

    const totalPages = Math.ceil(totalItems / filterState.limit);
    const currentPage = filterState.page;

    // Previous Button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<button class="page-link"><i class="bi bi-chevron-left"></i></button>`;
    prevLi.addEventListener('click', () => {
      if (currentPage > 1) {
        filterState.page = currentPage - 1;
        loadProducts();
      }
    });
    pagList.appendChild(prevLi);

    // Number Buttons
    for (let i = 1; i <= totalPages; i++) {
      const pageLi = document.createElement('li');
      pageLi.className = `page-item ${currentPage === i ? 'active' : ''}`;
      pageLi.innerHTML = `<button class="page-link">${i}</button>`;
      pageLi.addEventListener('click', () => {
        filterState.page = i;
        loadProducts();
      });
      pagList.appendChild(pageLi);
    }

    // Next Button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<button class="page-link"><i class="bi bi-chevron-right"></i></button>`;
    nextLi.addEventListener('click', () => {
      if (currentPage < totalPages) {
        filterState.page = currentPage + 1;
        loadProducts();
      }
    });
    pagList.appendChild(nextLi);
  };

  // Wire up filter event listeners
  
  // Sorting Change
  document.getElementById('sort-select').addEventListener('change', (e) => {
    filterState.sort = e.target.value;
    filterState.page = 1;
    loadProducts();
  });

  // Category selection changes
  const bindCategories = () => {
    const list = document.getElementById('categories-filter-list');
    list.addEventListener('change', () => {
      const selected = [];
      list.querySelectorAll('.category-checkbox:checked').forEach(cb => {
        selected.push(cb.value);
      });
      filterState.category = selected.join(',');
      filterState.page = 1;
      loadProducts();
    });
  };

  // Brand selection changes
  const bindBrands = () => {
    const list = document.getElementById('brands-filter-list');
    list.addEventListener('change', () => {
      const selected = [];
      list.querySelectorAll('.brand-checkbox:checked').forEach(cb => {
        selected.push(cb.value);
      });
      filterState.brand = selected.join(',');
      filterState.page = 1;
      loadProducts();
    });
  };

  // Price applying
  document.getElementById('apply-price-btn').addEventListener('click', () => {
    filterState.priceMin = document.getElementById('price-min').value;
    filterState.priceMax = document.getElementById('price-max').value;
    filterState.page = 1;
    loadProducts();
  });

  // Star Ratings selection
  document.querySelectorAll('.rating-radio').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      filterState.ratingMin = e.target.value;
      filterState.page = 1;
      loadProducts();
    });
  });

  // Availability check
  document.getElementById('in-stock-checkbox').addEventListener('change', (e) => {
    filterState.availability = e.target.checked ? 'in-stock' : '';
    filterState.page = 1;
    loadProducts();
  });

  // Clear all button clicks
  document.getElementById('clear-filters-btn').addEventListener('click', () => {
    // Reset HTML inputs
    document.querySelectorAll('.category-checkbox:checked').forEach(cb => cb.checked = false);
    document.querySelectorAll('.brand-checkbox:checked').forEach(cb => cb.checked = false);
    document.querySelectorAll('.rating-radio:checked').forEach(rb => rb.checked = false);
    document.getElementById('in-stock-checkbox').checked = false;
    document.getElementById('price-min').value = '';
    document.getElementById('price-max').value = '';
    document.getElementById('sort-select').value = 'newest';
    
    const navInput = document.getElementById('nav-search-input');
    if (navInput) navInput.value = '';

    // Clear filters payload
    filterState.search = '';
    filterState.category = '';
    filterState.brand = '';
    filterState.priceMin = '';
    filterState.priceMax = '';
    filterState.ratingMin = '';
    filterState.availability = '';
    filterState.sort = 'newest';
    filterState.page = 1;
    
    document.getElementById('catalog-title').innerText = 'Our Catalog';

    loadProducts();
  });

  // Initial loads
  bindCategories();
  bindBrands();
  drawRecentlyViewed();
  drawSearchHistory();
  await loadProducts();
};
