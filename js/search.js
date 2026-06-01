/**
 * Lohar Auto Garage — Product Search and Filtering (Premium D2C Implementation)
 * Dynamically loads products with search, sorting, category, double range slider, offers, and layout toggles.
 */

let productsState = [];
let activeFilters = {
  category: '',
  search: '',
  sort: 'featured',
  minPrice: 100,
  maxPrice: 2000,
  offers: [] // Array of selected discount thresholds: 10, 20, 30
};
let currentLayout = 'grid'; // 'grid' or 'list'

// Parse URL parameters on load
const parseQueryParams = () => {
  const params = new URLSearchParams(window.location.search);
  activeFilters.category = params.get('category') || '';
  activeFilters.search = params.get('search') || '';
  activeFilters.sort = params.get('sort') || 'featured';
  activeFilters.minPrice = parseInt(params.get('minPrice')) || 100;
  activeFilters.maxPrice = parseInt(params.get('maxPrice')) || 2000;
  const offersParam = params.get('offers');
  activeFilters.offers = offersParam ? offersParam.split(',').map(Number) : [];
};

// Update URL parameters
const updateQueryParams = () => {
  const params = new URLSearchParams();
  if (activeFilters.category) params.set('category', activeFilters.category);
  if (activeFilters.search) params.set('search', activeFilters.search);
  if (activeFilters.sort) params.set('sort', activeFilters.sort);
  if (activeFilters.minPrice !== 100) params.set('minPrice', activeFilters.minPrice);
  if (activeFilters.maxPrice !== 2000) params.set('maxPrice', activeFilters.maxPrice);
  if (activeFilters.offers.length > 0) params.set('offers', activeFilters.offers.join(','));
  
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState({}, '', newUrl);
};

// Render Products Grid / List
const renderProducts = (products) => {
  const container = document.getElementById('productsGrid');
  if (!container) return;

  // Toggle layout class on container
  container.className = currentLayout === 'list' ? 'catalog-grid list-view' : 'catalog-grid';

  if (products.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 80px 20px; color: var(--white-3); background: #ffffff; border-radius: 20px; border: 1px solid rgba(27,26,23,0.06);">
        <span style="font-size: 3.5rem; opacity: 0.6; display: block; margin-bottom: 10px;">🔍</span>
        <h3 style="color: var(--white); margin-top: 15px; margin-bottom: 8px; font-family: 'Outfit', sans-serif; font-size: 1.4rem; font-weight: 800;">No Products Found</h3>
        <p style="font-size: 0.92rem; opacity: 0.8; max-width: 320px; margin: 0 auto 20px;">Try adjusting your search queries, checkboxes, or price sliders.</p>
        <button class="btn-primary btn-sm" onclick="resetFilters()" style="padding: 10px 22px; font-weight: 700; border-radius: 50px;">Clear All Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(p => {
    const originalText = 'Add to Cart';
    const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
    
    return `
      <div class="d2c-card fade-in" data-id="${p._id}" onclick="if(!event.target.closest('.d2c-actions, .wishlist-toggle-btn')) window.location.href='/pages/product-detail.html?slug=${p.slug}'" style="cursor: pointer;">
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
              ${'★'.repeat(Math.round(p.rating?.avg || 5))}${'☆'.repeat(5 - Math.round(p.rating?.avg || 5))}
            </span>
            <span class="d2c-rating-val">${p.rating?.avg !== undefined ? p.rating.avg.toFixed(1) : '4.8'}</span>
            <span class="d2c-rating-count">(${p.rating?.count !== undefined ? p.rating.count : 120} reviews)</span>
          </div>
          
          <div class="d2c-price-row">
            <div class="d2c-price-box">
              <span class="d2c-price">₹${p.price}</span>
              ${p.mrp > p.price ? `<span class="d2c-mrp">₹${p.mrp}</span>` : ''}
            </div>
            ${p.stock > 0 ? '<span class="status-badge-green">In Stock</span>' : ''}
          </div>
          
          <div class="d2c-actions">
            <button 
              class="d2c-btn-cart" 
              data-add-cart="${p._id}" 
              data-original-text="${originalText}"
              onclick="addToCart('${p._id}', 1, ${JSON.stringify(p).replace(/"/g, '&quot;')})"
              ${p.stock === 0 ? 'disabled' : ''}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px; display: inline-block; vertical-align: middle;"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              <span>${p.stock > 0 ? originalText : 'Out of Stock'}</span>
            </button>
            ${p.stock > 0 ? `
            <button 
              class="d2c-btn-buy" 
              onclick="buyNowDirect('${p._id}', ${JSON.stringify(p).replace(/"/g, '&quot;')})"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px; display: inline-block; vertical-align: middle;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              Buy Now
            </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Update wishlist icons for stored wishlist items
  if (window.updateWishlistIcons) updateWishlistIcons();
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

    // Client-side Price Range & Offers Filtering
    let filtered = [...productsState];
    
    // Filter by Price Range
    filtered = filtered.filter(p => p.price >= activeFilters.minPrice && p.price <= activeFilters.maxPrice);

    // Filter by Selected Offer Percentages
    if (activeFilters.offers.length > 0) {
      filtered = filtered.filter(p => {
        const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
        return activeFilters.offers.some(threshold => discount >= threshold);
      });
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

// Double Price Range Input Handlers
window.updatePriceInputs = () => {
  const minRange = document.getElementById('minRangeInput');
  const maxRange = document.getElementById('maxRangeInput');
  const minDisplay = document.getElementById('minPriceDisplay');
  const maxDisplay = document.getElementById('maxPriceDisplay');
  const track = document.getElementById('sliderTrack');

  if (!minRange || !maxRange) return;

  let minVal = parseInt(minRange.value);
  let maxVal = parseInt(maxRange.value);

  // Prevent overlap
  if (minVal > maxVal - 50) {
    if (document.activeElement === minRange) {
      minRange.value = maxVal - 50;
      minVal = maxVal - 50;
    } else {
      maxRange.value = minVal + 50;
      maxVal = minVal + 50;
    }
  }

  minDisplay.value = `₹${minVal}`;
  maxDisplay.value = `₹${maxVal}`;

  // Update track coloring
  const minPercent = ((minVal - 100) / 1900) * 100;
  const maxPercent = ((maxVal - 100) / 1900) * 100;
  track.style.left = `${minPercent}%`;
  track.style.width = `${maxPercent - minPercent}%`;
};

window.applyPriceFilter = () => {
  const minRange = document.getElementById('minRangeInput');
  const maxRange = document.getElementById('maxRangeInput');
  if (!minRange || !maxRange) return;

  activeFilters.minPrice = parseInt(minRange.value);
  activeFilters.maxPrice = parseInt(maxRange.value);
  
  updateQueryParams();
  loadProducts();
  toast.success(`Price filtered: ₹${activeFilters.minPrice} - ₹${activeFilters.maxPrice}`);
};

// Offer Checkbox Handlers
window.filterOffer = (percent) => {
  const index = activeFilters.offers.indexOf(percent);
  if (index === -1) {
    activeFilters.offers.push(percent);
  } else {
    activeFilters.offers.splice(index, 1);
  }
  updateQueryParams();
  loadProducts();
};

// Toggle Grid and List layout
window.toggleLayout = (mode) => {
  currentLayout = mode;
  const gridBtn = document.getElementById('viewGridBtn');
  const listBtn = document.getElementById('viewListBtn');
  
  if (gridBtn && listBtn) {
    gridBtn.classList.toggle('active', mode === 'grid');
    listBtn.classList.toggle('active', mode === 'list');
  }

  renderProducts(productsState.filter(p => p.price >= activeFilters.minPrice && p.price <= activeFilters.maxPrice));
};

window.resetFilters = () => {
  activeFilters = {
    category: '',
    search: '',
    sort: 'featured',
    minPrice: 100,
    maxPrice: 2000,
    offers: []
  };

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';

  const minRange = document.getElementById('minRangeInput');
  const maxRange = document.getElementById('maxRangeInput');
  if (minRange && maxRange) {
    minRange.value = 100;
    maxRange.value = 2000;
    updatePriceInputs();
  }

  // Uncheck all checkboxes
  document.querySelectorAll('.offers-list input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });

  updateQueryParams();
  loadProducts();
  toast.info('All filters reset');
};

// Update Filter Buttons / Inputs UI
const updateFilterUI = () => {
  // Update Category List active states
  document.querySelectorAll('.category-item').forEach(btn => {
    const cat = btn.getAttribute('data-category');
    btn.classList.toggle('active', cat === activeFilters.category);
  });

  // Update Select Dropdowns
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.value = activeFilters.sort;

  // Set Range Inputs from State
  const minRange = document.getElementById('minRangeInput');
  const maxRange = document.getElementById('maxRangeInput');
  if (minRange && maxRange) {
    minRange.value = activeFilters.minPrice;
    maxRange.value = activeFilters.maxPrice;
    updatePriceInputs();
  }

  // Set Checkboxes from State
  document.querySelectorAll('.offers-list input[type="checkbox"]').forEach(cb => {
    const val = parseInt(cb.value);
    cb.checked = activeFilters.offers.includes(val);
  });
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

    // Initialize Slider positions
    updatePriceInputs();

    // Set Search Button click trigger
    const searchSubmit = document.getElementById('searchSubmitBtn');
    if (searchSubmit && searchInput) {
      searchSubmit.addEventListener('click', () => {
        activeFilters.search = searchInput.value;
        updateQueryParams();
        loadProducts();
      });
    }

    loadProducts();
  }
});
