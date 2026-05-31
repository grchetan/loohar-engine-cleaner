/**
 * Lohar Auto Garage — Wishlist Manager
 * Synchronizes client-side and server-side user wishlist
 */

let wishlistState = [];

// Load wishlist
window.loadWishlist = async () => {
  try {
    if (isLoggedIn()) {
      const res = await WishlistAPI.get();
      wishlistState = res.wishlist.map(p => p._id || p);
    } else {
      const stored = localStorage.getItem('lag_wishlist');
      wishlistState = stored ? JSON.parse(stored) : [];
    }
  } catch (err) {
    wishlistState = [];
  }
  updateWishlistIcons();
};

// Toggle wishlist item
window.toggleWishlist = async (productId, btnEl = null) => {
  try {
    if (isLoggedIn()) {
      const res = await WishlistAPI.toggle(productId);
      wishlistState = res.wishlist.map(p => p._id || p);
      toast.success(res.message || 'Wishlist updated');
    } else {
      // Guest local storage wishlist
      const index = wishlistState.indexOf(productId);
      if (index > -1) {
        wishlistState.splice(index, 1);
        toast.info('Removed from wishlist');
      } else {
        wishlistState.push(productId);
        toast.success('Added to wishlist!');
      }
      localStorage.setItem('lag_wishlist', JSON.stringify(wishlistState));
    }
    
    updateWishlistIcons();
    
    // If we are on the wishlist page, reload
    if (document.getElementById('wishlistGrid')) {
      loadWishlistPage();
    }
  } catch (err) {
    toast.error('Failed to update wishlist');
  }
};

// Update heart icons across the page
window.updateWishlistIcons = () => {
  document.querySelectorAll('.wishlist-toggle-btn').forEach(btn => {
    const pid = btn.getAttribute('data-id');
    const isWished = wishlistState.includes(pid);
    btn.innerHTML = isWished ? '♥' : '♡';
    btn.classList.toggle('wished', isWished);
  });
};

// Render Wishlist Page
window.loadWishlistPage = async () => {
  const grid = document.getElementById('wishlistGrid');
  const loader = document.getElementById('wishlistLoader');
  if (!grid) return;

  if (loader) loader.style.display = 'block';

  try {
    let products = [];
    if (isLoggedIn()) {
      const res = await WishlistAPI.get();
      products = res.wishlist || [];
    } else {
      // For guest, fetch all products and filter locally
      const stored = localStorage.getItem('lag_wishlist');
      const guestIds = stored ? JSON.parse(stored) : [];
      if (guestIds.length > 0) {
        const res = await ProductsAPI.list({ limit: 100 });
        products = (res.products || []).filter(p => guestIds.includes(p._id));
      }
    }

    if (loader) loader.style.display = 'none';

    if (products.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 80px 20px; color: rgba(255,255,255,0.4);">
          <span style="font-size: 3.5rem; color: #f5c518;">♥</span>
          <h3 style="color: #fff; margin-top: 15px; margin-bottom: 8px;">Your Wishlist is Empty</h3>
          <p style="font-size: 0.95rem; margin-bottom: 20px;">Save your favorite cleaning products here to buy later.</p>
          <a href="/pages/products.html" class="btn-primary btn-sm">Explore Products</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = products.map(p => {
      const originalText = 'Add to Cart';
      return `
        <div class="product-card premium-border" data-id="${p._id}" style="padding: 16px;">
          <button class="wishlist-toggle-btn wished" onclick="toggleWishlist('${p._id}', this)" data-id="${p._id}">
            ♥
          </button>
          <a href="/pages/product-detail.html?slug=${p.slug}" class="product-img-link">
            <img src="${p.images[0] || '/assets/images/hero_bottle.png'}" alt="${p.name}" class="product-card-img" style="max-height: 200px; width: 100%; object-fit: contain; margin-bottom: 12px;" onerror="this.src='/assets/images/hero_bottle.png'">
          </a>
          <div class="product-card-info">
            <span class="product-card-category" style="font-size: 0.8rem; font-weight:700; color:#f5c518;">${p.category}</span>
            <h3 class="product-card-title" style="font-size: 1.1rem; margin-top: 4px; margin-bottom: 8px;">
              <a href="/pages/product-detail.html?slug=${p.slug}" style="color: #fff; text-decoration: none;">${p.name}</a>
            </h3>
            <div class="product-card-price-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <div class="price-box">
                <span class="current-price" style="font-size: 1.3rem; font-weight: 800; color: #f5c518;">₹${p.price}</span>
                ${p.mrp > p.price ? `<span class="original-price" style="font-size: 0.9rem; color: rgba(255,255,255,0.4); text-decoration: line-through; margin-left: 8px;">₹${p.mrp}</span>` : ''}
              </div>
            </div>
            <div class="product-card-actions">
              <button 
                class="btn-primary btn-sm btn-add-cart" 
                data-add-cart="${p._id}" 
                data-original-text="${originalText}"
                onclick="addToCart('${p._id}', 1, ${JSON.stringify(p).replace(/"/g, '&quot;')})"
                style="width: 100%; padding: 12px; font-size: 0.95rem; font-weight: 800; border-radius: 8px; cursor: pointer;"
                ${p.stock === 0 ? 'disabled' : ''}
              >
                ${p.stock > 0 ? originalText : 'Out of Stock'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    if (loader) loader.style.display = 'none';
    toast.error('Failed to load wishlist items');
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadWishlist();
  if (document.getElementById('wishlistGrid')) {
    loadWishlistPage();
  }
});
