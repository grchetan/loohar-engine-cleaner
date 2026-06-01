/**
 * Lohar Auto Garage — Product Search and Filtering
 * Dynamically loads products with search, sorting, and category filters
 */

let productsState = [];
let activeFilters = {
  category: '',
  search: '',
  sort: 'featured',
  priceRange: 'all'
};

// Parse URL parameters on load
const parseQueryParams = () => {
  const params = new URLSearchParams(window.location.search);
  activeFilters.category = params.get('category') || '';
  activeFilters.search = params.get('search') || '';
  activeFilters.sort = params.get('sort') || 'featured';
  activeFilters.priceRange = params.get('price') || 'all';
};

// Update URL parameters
const updateQueryParams = () => {
  const params = new URLSearchParams();
  if (activeFilters.category) params.set('category', activeFilters.category);
  if (activeFilters.search) params.set('search', activeFilters.search);
  if (activeFilters.sort) params.set('sort', activeFilters.sort);
  if (activeFilters.priceRange) params.set('price', activeFilters.priceRange);
  
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState({}, '', newUrl);
};

// Render Products Grid
const renderProducts = (products) => {
  const container = document.getElementById('productsGrid');
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--white-3);">
        <span style="font-size: 3rem; opacity: 0.6;">🔍</span>
        <h3 style="color: var(--white); margin-top: 15px; margin-bottom: 8px;">No Products Found</h3>
        <p style="font-size: 0.9rem;">Try adjusting your filters or search keywords.</p>
        <button class="btn-primary btn-sm" onclick="resetFilters()" style="margin-top: 20px;">Clear Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(p => {
    const originalText = 'Add to Cart';
    const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
    
    return `
      <div class="d2c-card fade-in" data-id="${p._id}">
        <div class="d2c-card-media">
          ${discount > 0 ? `<span class="d2c-badge-discount">-${discount}%</span>` : ''}
          <button class="wishlist-toggle-btn" onclick="toggleWishlist('${p._id}', this)" data-id="${p._id}">
            ♡
          </button>
          <a href="/pages/product-detail.html?slug=${p.slug}" class="d2c-img-wrap">
            <img src="${p.images[0] || '/assets/images/hero_bottle.png'}" alt="${p.name}" class="d2c-img" onerror="this.src='/assets/images/hero_bottle.png'">
          </a>
        </div>
        
        <div class="d2c-card-content">
          <div class="d2c-category-row">
            <span class="d2c-category">${p.category}</span>
            <span class="d2c-stock-status ${p.stock > 0 ? 'in-stock' : 'out-of-stock'}">
              ${p.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          
          <h3 class="d2c-title">
            <a href="/pages/product-detail.html?slug=${p.slug}">${p.name}</a>
          </h3>
          
          <div class="d2c-rating-row">
            <span class="d2c-stars">
              ${'★'.repeat(Math.round(p.rating?.avg || 0))}${'☆'.repeat(5 - Math.round(p.rating?.avg || 0))}
            </span>
            <span class="d2c-rating-val">${p.rating?.avg !== undefined ? p.rating.avg.toFixed(1) : '0.0'}</span>
            <span class="d2c-rating-count">(${p.rating?.count !== undefined ? p.rating.count : 0} reviews)</span>
          </div>
          
          <div class="d2c-price-row">
            <div class="d2c-price-box">
              <span class="d2c-price">₹${p.price}</span>
              ${p.mrp > p.price ? `<span class="d2c-mrp">₹${p.mrp}</span>` : ''}
            </div>
          </div>
          
          <div class="d2c-actions">
            <button 
              class="d2c-btn-cart" 
              data-add-cart="${p._id}" 
              data-original-text="${originalText}"
              onclick="addToCart('${p._id}', 1, ${JSON.stringify(p).replace(/"/g, '&quot;')})"
              ${p.stock === 0 ? 'disabled' : ''}
            >
              ${p.stock > 0 ? originalText : 'Out of Stock'}
            </button>
            ${p.stock > 0 ? `
            <button 
              class="d2c-btn-buy" 
              onclick="buyNowDirect('${p._id}', ${JSON.stringify(p).replace(/"/g, '&quot;')})"
            >
              Buy Now
            </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Update wishlist icons for stored wishlist items
  updateWishlistIcons();
};

// Fetch and Apply Filters
window.loadProducts = async () => {
  const loader = document.getElementById('productsLoader');
  if (loader) loader.style.display = 'block';

  try {
    const params = {};
    if (activeFilters.category) params.category = activeFilters.category;
    if (activeFilters.search) params.search = activeFilters.search;
    if (activeFilters.sort) params.sort = activeFilters.sort;

    const res = await ProductsAPI.list(params);
    productsState = res.products || [];

    // Client-side Price Range Filtering
    let filtered = [...productsState];
    if (activeFilters.priceRange === 'under-300') {
      filtered = filtered.filter(p => p.price < 300);
    } else if (activeFilters.priceRange === '300-500') {
      filtered = filtered.filter(p => p.price >= 300 && p.price <= 500);
    }

    renderProducts(filtered);
    updateFilterUI();
  } catch (err) {
    toast.error('Failed to load products');
  } finally {
    if (loader) loader.style.display = 'none';
  }
};

// UI Filter Event Handlers
window.filterCategory = (cat) => {
  activeFilters.category = cat;
  updateQueryParams();
  loadProducts();
};

window.filterSort = (sortVal) => {
  activeFilters.sort = sortVal;
  updateQueryParams();
  loadProducts();
};

window.filterPrice = (range) => {
  activeFilters.priceRange = range;
  updateQueryParams();
  loadProducts();
};

window.resetFilters = () => {
  activeFilters = { category: '', search: '', sort: 'featured', priceRange: 'all' };
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  updateQueryParams();
  loadProducts();
};

// Update Filter Buttons Styling
const updateFilterUI = () => {
  // Update Category Pills / Sidebar Options
  document.querySelectorAll('.filter-pill, .filter-option').forEach(btn => {
    const cat = btn.getAttribute('data-category');
    btn.classList.toggle('active', cat === activeFilters.category);
  });

  // Update Select Dropdowns if they exist
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.value = activeFilters.sort;

  const priceSelect = document.getElementById('priceFilterSelect');
  if (priceSelect) priceSelect.value = activeFilters.priceRange;
};

// Initialize on Dom Loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('productsGrid')) {
    parseQueryParams();
    
    // Set search input value if search param is present
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = activeFilters.search;
      searchInput.addEventListener('input', (e) => {
        // Debounce search
        clearTimeout(window.searchDebounce);
        window.searchDebounce = setTimeout(() => {
          activeFilters.search = e.target.value;
          updateQueryParams();
          loadProducts();
        }, 400);
      });
    }

    loadProducts();
  }
});
