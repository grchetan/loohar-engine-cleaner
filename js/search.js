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
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.4);">
        <span style="font-size: 3rem; opacity: 0.6;">🔍</span>
        <h3 style="color: #fff; margin-top: 15px; margin-bottom: 8px;">No Products Found</h3>
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
      <div class="product-card premium-border" data-id="${p._id}" style="padding: 16px;">
        ${discount > 0 ? `<div class="product-discount-badge">-${discount}%</div>` : ''}
        <button class="wishlist-toggle-btn" onclick="toggleWishlist('${p._id}', this)" data-id="${p._id}">
          🤍
        </button>
        <a href="/pages/product-detail.html?slug=${p.slug}" class="product-img-link">
          <img src="${p.images[0] || '/assets/images/hero_bottle.png'}" alt="${p.name}" class="product-card-img" style="max-height: 200px; width: 100%; object-fit: contain; margin-bottom: 12px;" onerror="this.src='/assets/images/hero_bottle.png'">
        </a>
        <div class="product-card-info">
          <span class="product-card-category" style="font-size: 0.8rem; font-weight:700; color:#f5c518;">${p.category}</span>
          <h3 class="product-card-title" style="font-size: 1.1rem; margin-top: 4px; margin-bottom: 8px;">
            <a href="/pages/product-detail.html?slug=${p.slug}" style="color: #fff; text-decoration: none;">${p.name}</a>
          </h3>
          <div class="product-card-rating" style="margin-bottom: 10px; font-size: 0.85rem;">
            <span class="star-rating" style="color: #f5c518;">★</span>
            <span class="rating-value" style="color: #fff; font-weight:700;">${p.rating?.avg?.toFixed(1) || '4.8'}</span>
            <span class="rating-count" style="color: rgba(255,255,255,0.5);">(${p.rating?.count || '12'} ratings)</span>
          </div>
          <div class="product-card-price-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <div class="price-box">
              <span class="current-price" style="font-size: 1.3rem; font-weight: 800; color: #f5c518;">₹${p.price}</span>
              ${p.mrp > p.price ? `<span class="original-price" style="font-size: 0.9rem; color: rgba(255,255,255,0.4); text-decoration: line-through; margin-left: 8px;">₹${p.mrp}</span>` : ''}
            </div>
            <span class="stock-status ${p.stock > 0 ? 'in-stock' : 'out-of-stock'}" style="font-size: 0.8rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; background: ${p.stock > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${p.stock > 0 ? '#10b981' : '#ef4444'};">
              ${p.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          <div class="product-card-actions" style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
            <button 
              class="btn-primary btn-sm btn-add-cart" 
              data-add-cart="${p._id}" 
              data-original-text="${originalText}"
              onclick="addToCart('${p._id}', 1, ${JSON.stringify(p).replace(/"/g, '&quot;')})"
              style="width: 100%; padding: 12px; font-size: 0.95rem; font-weight: 800; border-radius: 8px; cursor: pointer; background: var(--yellow); border-color: var(--yellow); color: var(--black);"
              ${p.stock === 0 ? 'disabled' : ''}
            >
              ${p.stock > 0 ? originalText : 'Out of Stock'}
            </button>
            ${p.stock > 0 ? `
            <button 
              class="btn-primary btn-sm" 
              onclick="buyNowDirect('${p._id}', ${JSON.stringify(p).replace(/"/g, '&quot;')})"
              style="width: 100%; padding: 12px; font-size: 0.95rem; font-weight: 800; border-radius: 8px; cursor: pointer; background: #10b981; border-color: #10b981; color: #fff; box-shadow: 0 4px 12px rgba(16,185,129,0.2);"
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
  // Update Category Pills
  document.querySelectorAll('.filter-pill').forEach(btn => {
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
