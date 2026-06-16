/**
 * Lohar Auto Garage — Cart State Management
 * Handles cart sidebar, add-to-cart, quantities, and persistence
 */

let cartState = { items: [], totalItems: 0, subtotal: 0 };
const SHIPPING_FREE_THRESHOLD = 1000;
const SHIPPING_RATES = [
  { max: 499, rate: 60 },
  { max: 999, rate: 40 },
  { max: Infinity, rate: 0 },
];

const calcShipping = (subtotal) => {
  for (const tier of SHIPPING_RATES) if (subtotal <= tier.max) return tier.rate;
  return 0;
};

// ===== Load Cart from API or localStorage =====
const loadCart = async () => {
  try {
    if (window.isLoggedIn && isLoggedIn()) {
      const res = await CartAPI.get();
      cartState = res.cart || { items: [] };
    } else {
      const stored = localStorage.getItem('lag_cart');
      cartState = stored ? JSON.parse(stored) : { items: [] };
    }
  } catch (_) {
    cartState = { items: [] };
  }
  updateCartUI();
};

// ===== Save Cart to localStorage (guest) =====
const persistCart = () => {
  if (!isLoggedIn())
    localStorage.setItem('lag_cart', JSON.stringify(cartState));
};

// ===== Add to Cart =====
window.addToCart = async (productId, qty = 1, productData = null) => {
  const btn = document.querySelector(`[data-add-cart="${productId}"]`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = 'Adding...';
  }

  try {
    if (isLoggedIn()) {
      const res = await CartAPI.add(productId, qty);
      cartState = res.cart;
    } else {
      // Guest cart in localStorage
      if (!cartState.items) cartState.items = [];
      const existing = cartState.items.find(
        (i) => i.product === productId || i.product?._id === productId,
      );
      if (existing) existing.qty = Math.min(existing.qty + qty, 20);
      else {
        const item = productData
          ? {
              product: productId,
              qty,
              price: productData.price,
              name: productData.name,
              image: productData.images?.[0] || '',
            }
          : { product: productId, qty };
        cartState.items.push(item);
      }
      persistCart();
    }

    updateCartUI();
    openCartSidebar();
    toast.cart('Added to cart!');

    if (btn) {
      btn.innerHTML = 'Added!';
      btn.style.background = '#10b981';
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = btn.getAttribute('data-original-text') || 'Add to Cart';
        btn.style.background = '';
      }, 2000);
    }
  } catch (err) {
    toast.error(err.message || 'Failed to add to cart');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = btn.getAttribute('data-original-text') || 'Add to Cart';
    }
  }
};

// ===== Remove from Cart =====
window.removeFromCart = async (productId) => {
  try {
    if (isLoggedIn()) {
      const res = await CartAPI.remove(productId);
      cartState = res.cart;
    } else {
      cartState.items = cartState.items.filter(
        (i) => (i.product?._id || i.product) !== productId,
      );
      persistCart();
    }
    updateCartUI();
    renderCartSidebar();
    toast.info('Removed from cart');
  } catch (err) {
    toast.error('Failed to remove item');
  }
};

// ===== Update Quantity =====
window.updateCartQty = async (productId, qty) => {
  try {
    if (isLoggedIn()) {
      const res = await CartAPI.update(productId, qty);
      cartState = res.cart;
    } else {
      const item = cartState.items.find(
        (i) => (i.product?._id || i.product) === productId,
      );
      if (item) {
        if (qty <= 0)
          cartState.items = cartState.items.filter(
            (i) => (i.product?._id || i.product) !== productId,
          );
        else item.qty = Math.min(qty, 20);
      }
      persistCart();
    }
    updateCartUI();
    renderCartSidebar();
  } catch (err) {
    toast.error('Failed to update quantity');
  }
};

// ===== Update Cart UI (badge + totals) =====
const updateCartUI = () => {
  const items = cartState.items || [];
  const totalItems = items.reduce((sum, i) => sum + (i.qty || 0), 0);
  const subtotal = items.reduce(
    (sum, i) => sum + (i.price || 0) * (i.qty || 0),
    0,
  );

  // Update badge
  document.querySelectorAll('.cart-badge').forEach((el) => {
    el.textContent = totalItems;
    el.style.display = totalItems > 0 ? 'flex' : 'none';
  });

  cartState._totalItems = totalItems;
  cartState._subtotal = subtotal;
};

// ===== Cart Sidebar =====
const createCartSidebar = () => {
  if (document.getElementById('cartSidebar')) return;

  const sidebar = document.createElement('div');
  sidebar.id = 'cartSidebar';
  sidebar.innerHTML = `
    <div class="cart-overlay" id="cartOverlay" onclick="closeCartSidebar()"></div>
    <div class="cart-panel">
      <div class="cart-panel-header" style="background:var(--black-2); padding:20px 24px; border-bottom:1px solid var(--glass-border);">
        <h3 style="font-family:Outfit,sans-serif; font-size:1.15rem; font-weight:800; color:var(--white); margin:0;">Shopping Cart</h3>
        <button class="cart-close" onclick="closeCartSidebar()" style="background:none !important; border:none !important; color:rgba(18,18,18,0.4) !important; font-size:1.8rem !important; cursor:pointer !important; padding:0 !important; line-height:1 !important; outline:none !important; box-shadow:none !important;" title="Close">×</button>
      </div>
      <div class="cart-panel-body" id="cartBody">
        <div class="cart-empty" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:12px; color:var(--white); opacity:0.6;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.3; color:var(--white); margin-bottom:10px;"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          <h3 style="color:var(--white); margin-top:10px; font-family:Outfit; font-size:1.2rem;">Your Cart is Empty</h3>
          <p style="color:var(--white); opacity:0.6; font-size:0.85rem; margin-bottom:15px;">Add items to your cart to get started.</p>
          <a href="/pages/products.html" class="btn-primary btn-sm" onclick="closeCartSidebar()" style="padding:10px 20px; font-weight:800; font-size:0.85rem; border-radius:8px;">Shop Products</a>
        </div>
      </div>
      <div class="cart-panel-footer" id="cartFooter" style="display:none; background:var(--black-2); border-top:1px solid var(--glass-border); padding:20px 24px;">
        <div class="cart-shipping-bar" id="cartShippingBar" style="font-size:0.82rem; color:var(--white); opacity:0.75; margin-bottom:12px;"></div>
        <div class="cart-totals" style="margin-bottom:16px;">
          <div class="cart-total-row" style="display:flex; justify-content:space-between; padding:4px 0; font-size:0.88rem; color:var(--white); opacity:0.75;"><span>Subtotal</span><span id="cartSubtotal">₹0</span></div>
          <div class="cart-total-row" style="display:flex; justify-content:space-between; padding:4px 0; font-size:0.88rem; color:var(--white); opacity:0.75;"><span>Shipping</span><span id="cartShipping">₹0</span></div>
          <div class="cart-total-row cart-total-grand" style="display:flex; justify-content:space-between; font-weight:800; color:var(--white); font-size:1.05rem; border-top:1px solid var(--glass-border); padding-top:10px; margin-top:6px;"><span>Total</span><span id="cartTotal" style="color:var(--yellow);">₹0</span></div>
        </div>
        <a href="/pages/checkout.html" class="btn-primary btn-full" id="checkoutBtn" style="padding:14px; font-size:1rem; font-weight:800; background:var(--yellow); border-color:var(--yellow); color:#0c0c0c !important; text-align:center; border-radius:10px; display:block;">Proceed to Checkout</a>
      </div>
    </div>
  `;
  document.body.appendChild(sidebar);
  injectCartStyles();
};

const injectCartStyles = () => {
  if (document.getElementById('lag-cart-style')) return;
  const style = document.createElement('style');
  style.id = 'lag-cart-style';
  style.textContent = `
    .cart-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9998;backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity 0.35s cubic-bezier(0.4,0,0.2,1); }
    #cartSidebar.open .cart-overlay { opacity:1; pointer-events:auto; }
    .cart-panel { position:fixed;top:0;right:-420px;width:420px;max-width:100vw;height:100vh;background:var(--black);border-left:1px solid var(--glass-border);z-index:9999;display:flex;flex-direction:column;transition:right 0.35s cubic-bezier(0.4,0,0.2,1);overflow:hidden; }
    #cartSidebar.open .cart-panel { right:0; }
    .cart-panel-header { display:flex;align-items:center;justify-content:space-between;flex-shrink:0; }
    .cart-close { transition:color 0.2s; }
    .cart-close:hover { color:var(--yellow) !important; }
    .cart-panel-body { flex:1;overflow-y:auto;padding:16px 24px; }
    .cart-empty { display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px; }
    .cart-item { display:grid;grid-template-columns:70px 1fr auto;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid var(--glass-border); }
    .cart-item-img { width:70px;height:70px;object-fit:contain;border-radius:10px;background:rgba(0,0,0,0.02); }
    .cart-item-name { font-size:0.88rem;font-weight:600;color:var(--white);margin-bottom:4px; }
    .cart-item-price { font-size:0.85rem;color:var(--yellow);font-weight:700; }
    .cart-qty-controls { display:flex;align-items:center;gap:6px;margin-top:8px; }
    .cart-qty-btn { width:26px;height:26px;border-radius:6px;border:1px solid var(--glass-border);background:rgba(0,0,0,0.03);color:var(--white);cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;transition:all 0.2s; }
    .cart-qty-btn:hover { border-color:var(--yellow);color:var(--yellow); }
    .cart-qty-num { font-size:0.9rem;font-weight:600;color:var(--white);width:24px;text-align:center; }
    .cart-remove { background:none !important; border:none !important; color:rgba(18,18,18,0.4) !important; cursor:pointer !important; font-size:1.5rem !important; padding:4px !important; transition:color 0.2s; line-height:1 !important; outline:none !important; box-shadow:none !important; }
    .cart-remove:hover { color:#ef4444 !important; }
    .cart-panel-footer { flex-shrink:0; }
    .cart-shipping-bar { font-size:0.8rem; color:var(--white); opacity:0.75; }
    .cart-shipping-progress { height:4px;background:rgba(0,0,0,0.08);border-radius:2px;margin-top:6px;overflow:hidden; }
    .cart-shipping-fill { height:100%;background:var(--yellow);border-radius:2px;transition:width 0.4s ease; }
    .cart-totals { margin-bottom:14px; }
    .cart-total-row { display:flex;justify-content:space-between;padding:5px 0;font-size:0.88rem;color:var(--white); opacity:0.75; }
    .cart-total-grand { font-weight:700;color:var(--white);font-size:1rem;border-top:1px solid var(--glass-border);padding-top:10px;margin-top:4px; }
    .cart-total-grand span:last-child { color:var(--yellow); }
    @media(max-width:500px) { .cart-panel { width:100vw; } }
  `;
  document.head.appendChild(style);
};

const renderCartSidebar = () => {
  const body = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  if (!body) return;

  const items = cartState.items || [];
  if (items.length === 0) {
    body.innerHTML = `
      <div class="cart-empty" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:12px; color:var(--white); opacity:0.6;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.3; color:var(--white); margin-bottom:10px;"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        <h3 style="color:var(--white); margin-top:10px; font-family:Outfit; font-size:1.2rem;">Your Cart is Empty</h3>
        <p style="color:var(--white); opacity:0.5; font-size:0.85rem; margin-bottom:15px;">Add items to your cart to get started.</p>
        <a href="/pages/products.html" class="btn-primary btn-sm" onclick="closeCartSidebar()" style="padding:10px 20px; font-weight:800; font-size:0.85rem; border-radius:8px;">Shop Products</a>
      </div>
    `;
    if (footer) footer.style.display = 'none';
    return;
  }

  const subtotal = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
  const shipping = calcShipping(subtotal);
  const total = subtotal + shipping;
  const freeShipLeft = Math.max(0, SHIPPING_FREE_THRESHOLD - subtotal);

  body.innerHTML = items
    .map((item) => {
      const pid = item.product?._id || item.product;
      const img =
        item.product?.images?.[0] ||
        item.image ||
        '/assets/images/hero_bottle.png';
      const name = item.product?.name || item.name || 'Product';
      const price = item.price || item.product?.price || 0;
      return `
      <div class="cart-item">
        <img src="${img}" alt="${name}" class="cart-item-img" onerror="this.src='/assets/images/hero_bottle.png'">
        <div>
          <div class="cart-item-name">${name}</div>
          <div class="cart-item-price">₹${price}</div>
          <div class="cart-qty-controls">
            <button class="cart-qty-btn" onclick="updateCartQty('${pid}', ${item.qty - 1})">−</button>
            <span class="cart-qty-num">${item.qty}</span>
            <button class="cart-qty-btn" onclick="updateCartQty('${pid}', ${item.qty + 1})">+</button>
          </div>
        </div>
        <button class="cart-remove" onclick="removeFromCart('${pid}')" style="background:none !important; border:none !important; color:rgba(18,18,18,0.3) !important; font-size:1.5rem !important; cursor:pointer !important; padding:4px !important; line-height:1 !important; outline:none !important; box-shadow:none !important;" title="Remove">×</button>
      </div>
    `;
    })
    .join('');

  if (footer) {
    footer.style.display = 'block';
    const shippingBar = document.getElementById('cartShippingBar');
    const pct = Math.min((subtotal / SHIPPING_FREE_THRESHOLD) * 100, 100);
    if (shippingBar) {
      shippingBar.innerHTML =
        freeShipLeft > 0
          ? `Add <strong>₹${freeShipLeft}</strong> more for free shipping! <div class="cart-shipping-progress"><div class="cart-shipping-fill" style="width:${pct}%"></div></div>`
          : `Free shipping applied to this order!`;
    }
    document.getElementById('cartSubtotal').textContent = `₹${subtotal}`;
    document.getElementById('cartShipping').textContent =
      shipping === 0 ? 'FREE' : `₹${shipping}`;
    document.getElementById('cartTotal').textContent = `₹${total}`;
  }
};

window.openCartSidebar = () => {
  createCartSidebar();
  const sidebar = document.getElementById('cartSidebar');
  if (sidebar) sidebar.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCartSidebar();
};

window.closeCartSidebar = () => {
  const sidebar = document.getElementById('cartSidebar');
  if (sidebar) sidebar.classList.remove('open');
  document.body.style.overflow = '';
};

// Global direct checkout action for frictionless quick ordering
window.buyNowDirect = async (productId, product) => {
  toast.info('Direct Checkout Initiated...');
  await addToCart(productId, 1, product);
  setTimeout(() => {
    window.location.href = '/pages/checkout.html';
  }, 300);
};

// Premium Floating WhatsApp Button
const injectWhatsAppFloat = () => {
  if (document.getElementById('loharQuickOrder')) return;

  // Hide old default WhatsApp floats if any
  const oldFloat = document.querySelector('.float-whatsapp');
  if (oldFloat) oldFloat.style.display = 'none';

  // Inject styles for premium circle button
  const style = document.createElement('style');
  style.id = 'lohar-quick-order-style';
  style.textContent = `
    .lohar-quick-order-pill {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #25D366;
      color: #FFF !important;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      box-shadow: 0 8px 24px rgba(37, 211, 102, 0.4);
      transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
      text-decoration: none;
      border: 1px solid rgba(255, 255, 255, 0.2);
      animation: lohar-pulse-glow 2s infinite;
    }
    @keyframes lohar-pulse-glow {
      0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7), 0 8px 24px rgba(37, 211, 102, 0.4); }
      70% { box-shadow: 0 0 0 12px rgba(37, 211, 102, 0), 0 8px 24px rgba(37, 211, 102, 0.4); }
      100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0), 0 8px 24px rgba(37, 211, 102, 0.4); }
    }
    .lohar-quick-order-pill:hover {
      background: #20ba5a;
      transform: scale(1.1) translateY(-2px);
      box-shadow: 0 12px 30px rgba(37, 211, 102, 0.6);
    }
    .lohar-quick-order-pill svg {
      fill: currentColor;
    }
    .lohar-wa-tooltip {
      position: absolute;
      right: 70px;
      background: rgba(17, 17, 17, 0.95);
      color: #fff;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .lohar-quick-order-pill:hover .lohar-wa-tooltip {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);

  // Inject Element
  const pill = document.createElement('a');
  pill.id = 'loharQuickOrder';
  pill.className = 'lohar-quick-order-pill';
  pill.href =
    'https://wa.me/919755255746?text=Hello%20Lohar%20Auto%20Garage%2C%20I%20would%20like%20to%20place%20an%20order%20for%20automotive%20cleaning%20products.%20Please%20assist%20me.';
  pill.target = '_blank';
  pill.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 448 512" fill="currentColor" style="display:inline-block; vertical-align:middle;">
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L32 503l138.2-36.2c32.4 17.7 68.9 27 106.5 27 122.4 0 222-99.6 222-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-82.1 21.5 21.9-80-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
    </svg>
    <span class="lohar-wa-tooltip">Order via WhatsApp</span>
  `;
  document.body.appendChild(pill);
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  injectWhatsAppFloat();

  // Set dynamic copyright year globally
  document.querySelectorAll('.current-year, #currentYear').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // Add cart button to navbar
  const navCta = document.querySelector('.nav-cta');
  if (navCta && !document.querySelector('.cart-nav-btn')) {
    const cartBtn = document.createElement('button');
    cartBtn.className = 'cart-nav-btn';
    cartBtn.setAttribute('aria-label', 'Open cart');
    cartBtn.onclick = openCartSidebar;
    cartBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; display:inline-block;"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg> <span class="cart-badge" style="display:none;background:#c68a00;color:#fcfbf9;border-radius:50%;width:18px;height:18px;font-size:10px;font-weight:800;align-items:center;justify-content:center;position:absolute;top:-6px;right:-6px">0</span>`;
    navCta.parentNode.insertBefore(cartBtn, navCta);
  }
});
