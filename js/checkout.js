/**
 * Lohar Auto Garage — Checkout System
 * Integrates cart data, coupons, addresses, and Razorpay + COD payment methods
 */

let selectedAddressId = null;
let checkoutCart = { items: [], subtotal: 0 };
let activeCoupon = null;
let shippingAddressData = null;

// Initialize checkout page
window.initCheckout = async () => {
  if (!isLoggedIn()) {
    toast.warning('Please login to proceed to checkout');
    window.location.href = `/pages/auth.html?redirect=${encodeURIComponent('/pages/checkout.html')}`;
    return;
  }

  const user = getUser();
  document.getElementById('checkoutUserEmail').textContent = user.email;

  // Load cart
  try {
    const res = await CartAPI.get();
    checkoutCart = res.cart;

    if (!checkoutCart.items || checkoutCart.items.length === 0) {
      toast.warning('Your cart is empty');
      window.location.href = '/pages/products.html';
      return;
    }

    renderCheckoutItems();
    updateCheckoutSummary();
    loadAddresses();
  } catch (err) {
    toast.error('Failed to load cart. Please try again.');
  }
};

// Render mini item list
const renderCheckoutItems = () => {
  const container = document.getElementById('checkoutItems');
  if (!container) return;

  container.innerHTML = checkoutCart.items.map(item => `
    <div class="checkout-item-mini" style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:0.88rem;">
      <span style="color:rgba(255,255,255,0.7)">${item.product?.name || item.name} <strong>x${item.qty}</strong></span>
      <span style="color:#fff; font-weight:600">₹${(item.price || item.product?.price) * item.qty}</span>
    </div>
  `).join('');
};

// Load saved user addresses
const loadAddresses = async () => {
  const container = document.getElementById('savedAddressesList');
  if (!container) return;

  try {
    const res = await AuthAPI.me();
    const user = res.user;
    saveUser(user); // Sync local info

    if (!user.addresses || user.addresses.length === 0) {
      container.innerHTML = `<p style="font-size:0.85rem; color:rgba(255,255,255,0.4)">No saved addresses found. Please add a shipping address below.</p>`;
      selectedAddressId = null;
      document.getElementById('newAddressForm').style.display = 'block';
      return;
    }

    container.innerHTML = user.addresses.map(addr => `
      <div class="glass-card address-card ${addr.isDefault ? 'selected' : ''}" data-id="${addr._id}" onclick="selectAddress('${addr._id}')" style="padding:15px; margin-bottom:10px; cursor:pointer; border:1px solid rgba(255,255,255,0.1); border-radius:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px">
          <strong style="color:#fff">${addr.label}</strong>
          <span style="font-size:0.75rem; background:#f5c518; color:#000; padding:2px 6px; border-radius:4px; font-weight:700">${addr.phone}</span>
        </div>
        <p style="font-size:0.82rem; color:rgba(255,255,255,0.7); line-height:1.4">${addr.fullName}<br>${addr.line1}, ${addr.line2 || ''}<br>${addr.city}, ${addr.state} - ${addr.pincode}</p>
      </div>
    `).join('');

    const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
    if (defaultAddr) selectAddress(defaultAddr._id);

  } catch (err) {
    toast.error('Failed to load saved addresses');
  }
};

window.selectAddress = (addressId) => {
  selectedAddressId = addressId;
  document.querySelectorAll('.address-card').forEach(el => {
    el.classList.toggle('selected', el.getAttribute('data-id') === addressId);
    if (el.getAttribute('data-id') === addressId) {
      el.style.borderColor = '#f5c518';
      el.style.background = 'rgba(245,197,24,0.03)';
    } else {
      el.style.borderColor = 'rgba(255,255,255,0.1)';
      el.style.background = 'rgba(255,255,255,0.02)';
    }
  });
  document.getElementById('newAddressForm').style.display = 'none';
  shippingAddressData = null; // Reset custom address if saved is chosen
};

window.showNewAddressForm = () => {
  selectedAddressId = null;
  document.querySelectorAll('.address-card').forEach(el => {
    el.style.borderColor = 'rgba(255,255,255,0.1)';
    el.style.background = 'rgba(255,255,255,0.02)';
  });
  document.getElementById('newAddressForm').style.display = 'block';
};

// Calculate all taxes, shipping & discounts
const updateCheckoutSummary = () => {
  const items = checkoutCart.items || [];
  const subtotal = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
  
  // Flat shipping logic
  let shipping = 60;
  if (subtotal >= 1000) shipping = 0;
  else if (subtotal >= 500) shipping = 40;

  // 18% GST (already calculated in backend order flow, shown here)
  const gst = Math.round(subtotal * 0.18);

  let discount = 0;
  if (activeCoupon) {
    if (activeCoupon.discountType === 'percent') {
      discount = Math.round((subtotal * activeCoupon.value) / 100);
      if (activeCoupon.maxDiscountAmount) discount = Math.min(discount, activeCoupon.maxDiscountAmount);
    } else {
      discount = activeCoupon.value;
    }
  }

  const grandTotal = subtotal - discount + shipping + gst;

  document.getElementById('summarySubtotal').textContent = `₹${subtotal}`;
  document.getElementById('summaryGST').textContent = `₹${gst}`;
  document.getElementById('summaryShipping').textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;
  document.getElementById('summaryDiscountRow').style.display = discount > 0 ? 'flex' : 'none';
  document.getElementById('summaryDiscount').textContent = `- ₹${discount}`;
  document.getElementById('summaryTotal').textContent = `₹${grandTotal}`;
};

// Apply coupon code validation
window.applyCoupon = async () => {
  const code = document.getElementById('couponCodeInput').value.trim().toUpperCase();
  if (!code) return;

  const btn = document.getElementById('couponApplyBtn');
  btn.disabled = true;
  btn.textContent = '...';

  try {
    const items = checkoutCart.items || [];
    const subtotal = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
    const res = await CouponsAPI.validate(code, subtotal);
    
    activeCoupon = res.coupon;
    updateCheckoutSummary();
    toast.success(`Coupon "${code}" applied successfully! 🏷`);
    
    // UI update
    document.getElementById('couponSuccessMessage').style.display = 'block';
    document.getElementById('couponSuccessMessage').textContent = `✓ ${res.message}`;
  } catch (err) {
    activeCoupon = null;
    updateCheckoutSummary();
    toast.error(err.message || 'Invalid coupon code');
    document.getElementById('couponSuccessMessage').style.display = 'none';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Apply';
  }
};

// Main order placement handler
window.placeOrder = async () => {
  const placeBtn = document.getElementById('placeOrderBtn');
  placeBtn.disabled = true;
  placeBtn.innerHTML = '⚙ Processing Order...';

  try {
    let addressObj = null;

    if (selectedAddressId) {
      addressObj = selectedAddressId; // backend takes addressId
    } else {
      // Create address from form
      const fullName = document.getElementById('shippingName').value.trim();
      const phone = document.getElementById('shippingPhone').value.trim();
      const line1 = document.getElementById('shippingLine1').value.trim();
      const line2 = document.getElementById('shippingLine2').value.trim();
      const city = document.getElementById('shippingCity').value.trim();
      const state = document.getElementById('shippingState').value.trim();
      const pincode = document.getElementById('shippingPincode').value.trim();

      if (!fullName || !phone || !line1 || !city || !state || !pincode) {
        toast.warning('Please enter all required shipping details');
        placeBtn.disabled = false;
        placeBtn.innerHTML = '⚡ Place Order';
        return;
      }

      addressObj = { fullName, phone, line1, line2, city, state, pincode };
      
      // Proactively save address to profile for future convenience
      await AuthAPI.addAddress({ ...addressObj, label: 'Home' }).catch(() => {});
    }

    const gstNumber = document.getElementById('gstNumberInput').value.trim() || undefined;
    const companyName = document.getElementById('companyNameInput').value.trim() || undefined;
    const notes = document.getElementById('orderNotesInput').value.trim() || undefined;

    const itemsFormatted = checkoutCart.items.map(i => ({
      productId: i.product?._id || i.product,
      qty: i.qty,
      name: i.product?.name || i.name
    }));

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    const checkoutData = {
      items: itemsFormatted,
      couponCode: activeCoupon ? activeCoupon.code : undefined,
      gstNumber,
      companyName,
      notes
    };

    if (typeof addressObj === 'string') {
      checkoutData.addressId = addressObj;
    } else {
      checkoutData.shippingAddress = addressObj;
    }

    if (paymentMethod === 'cod') {
      // Call COD endpoint directly
      const paymentOrder = await OrdersAPI.createPaymentOrder(checkoutData);
      const res = await OrdersAPI.codOrder(paymentOrder.orderData);
      toast.success('Order placed successfully! 📦');
      setTimeout(() => window.location.href = `/pages/order-detail.html?orderId=${res.order.orderId}`, 1000);
    } else {
      // Razorpay checkout
      const payOrderRes = await OrdersAPI.createPaymentOrder(checkoutData);

      if (payOrderRes.codOnly) {
        // Fallback if Razorpay is not configured on server
        const res = await OrdersAPI.codOrder(payOrderRes.orderData);
        toast.info('Razorpay test mode enabled, checkout placed as COD');
        setTimeout(() => window.location.href = `/pages/order-detail.html?orderId=${res.order.orderId}`, 1000);
        return;
      }

      const options = {
        key: payOrderRes.key,
        amount: payOrderRes.amount,
        currency: payOrderRes.currency,
        name: 'Lohar Auto Garage',
        description: 'Automotive Engine Cleaners & Degreasers',
        order_id: payOrderRes.razorpayOrderId,
        handler: async (response) => {
          placeBtn.innerHTML = '✔ Payment Verified. Finalizing Order...';
          try {
            const verifyRes = await OrdersAPI.verifypayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderData: payOrderRes.orderData
            });
            toast.success('Payment successful! 🎉');
            window.location.href = `/pages/order-detail.html?orderId=${verifyRes.order.orderId}`;
          } catch (err) {
            toast.error(err.message || 'Payment verification failed');
            placeBtn.disabled = false;
            placeBtn.innerHTML = '⚡ Place Order';
          }
        },
        prefill: {
          name: getUser().name,
          email: getUser().email,
          contact: typeof addressObj === 'object' ? addressObj.phone : ''
        },
        theme: { color: '#f5c518' }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response) {
        toast.error(`Payment failed: ${response.error.description}`);
        placeBtn.disabled = false;
        placeBtn.innerHTML = '⚡ Place Order';
      });
      rzp1.open();
    }
  } catch (err) {
    toast.error(err.message || 'Failed to place order');
    placeBtn.disabled = false;
    placeBtn.innerHTML = '⚡ Place Order';
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('checkoutItems')) {
    initCheckout();
  }
});
