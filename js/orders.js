/**
 * Lohar Auto Garage — Orders History and Detail Modules
 * Handles user orders lists, cancellations, tracking flow, and invoice download triggers
 */

// Load all user orders
window.loadUserOrders = async () => {
  if (!isLoggedIn()) {
    window.location.href = '/pages/auth.html?redirect=/pages/orders.html';
    return;
  }

  const container = document.getElementById('ordersListContainer');
  const loader = document.getElementById('ordersLoader');
  if (!container) return;

  if (loader) loader.style.display = 'block';

  try {
    const res = await OrdersAPI.list({ limit: 50 });
    const orders = res.orders || [];

    if (loader) loader.style.display = 'none';

    if (orders.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding: 60px 20px; color:rgba(255,255,255,0.4);" class="glass-card">
          <span style="font-size: 3rem; opacity: 0.6;">📦</span>
          <h3 style="color:#fff; margin-top:15px; margin-bottom:8px;">No Orders Placed Yet</h3>
          <p style="font-size:0.9rem; margin-bottom:20px;">You haven't ordered anything yet.</p>
          <a href="/pages/products.html" class="btn-primary btn-sm">Start Shopping</a>
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map(order => {
      const itemsCount = order.items.reduce((s, i) => s + i.qty, 0);
      const mainImage = order.items[0]?.product?.images?.[0] || '/assets/images/hero_bottle.png';
      const orderDate = new Date(order.createdAt).toLocaleDateString();
      
      let statusColor = '#f5c518';
      if (order.status === 'Delivered') statusColor = '#10b981';
      else if (order.status === 'Cancelled') statusColor = '#ef4444';

      return `
        <div class="glass-card order-list-card" style="padding:20px; margin-bottom:20px; border:1px solid rgba(255,255,255,0.08); border-radius:12px; display:grid; grid-template-columns:100px 1fr auto; gap:20px; align-items:center;">
          <img src="${mainImage}" alt="Order Item" style="width:90px; height:90px; object-fit:contain; border-radius:8px; background:rgba(255,255,255,0.02)" onerror="this.src='/assets/images/hero_bottle.png'">
          <div>
            <div style="display:flex; gap:12px; align-items:center; margin-bottom:6px">
              <strong style="color:#fff; font-size:0.95rem;">Order #${order.orderId}</strong>
              <span style="font-size:0.75rem; background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.6); padding:2px 8px; border-radius:4px">${orderDate}</span>
            </div>
            <p style="font-size:0.82rem; color:rgba(255,255,255,0.5); margin-bottom:8px">${itemsCount} items (${order.items.map(i => i.name).join(', ')})</p>
            <span style="font-size:0.85rem; font-weight:700; color:${statusColor}">● ${order.status}</span>
          </div>
          <div style="text-align:right; display:flex; flex-direction:column; gap:8px">
            <strong style="color:#fff; font-size:1.1rem; display:block">₹${order.total}</strong>
            <a href="/pages/order-detail.html?orderId=${order.orderId}" class="btn-primary btn-sm" style="padding: 10px 16px; font-weight: 800; font-size:0.82rem">Track Order</a>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    if (loader) loader.style.display = 'none';
    if (err.message.includes('authorized') || err.message.includes('token') || err.message.includes('login') || err.message.includes('Server error')) {
      clearToken();
      clearUser();
      window.location.href = '/pages/auth.html?redirect=/pages/orders.html';
      return;
    }
    toast.error('Failed to load order history');
  }
};

// Load specific order detail (tracking, cancellations, invoices)
window.loadOrderDetail = async () => {
  if (!isLoggedIn()) {
    const orderId = new URLSearchParams(window.location.search).get('orderId');
    window.location.href = `/pages/auth.html?redirect=${encodeURIComponent('/pages/order-detail.html?orderId=' + (orderId || ''))}`;
    return;
  }

  const orderId = new URLSearchParams(window.location.search).get('orderId');
  if (!orderId) {
    window.location.href = '/pages/orders.html';
    return;
  }

  const loader = document.getElementById('orderDetailLoader');
  const content = document.getElementById('orderDetailContent');
  if (loader) loader.style.display = 'block';

  try {
    const res = await OrdersAPI.get(orderId);
    const order = res.order;

    if (loader) loader.style.display = 'none';
    if (content) content.style.display = 'block';

    // Set textual details
    document.getElementById('detOrderId').textContent = order.orderId;
    document.getElementById('detOrderDate').textContent = new Date(order.createdAt).toLocaleDateString();
    
    let statusColor = '#f5c518';
    if (order.status === 'Delivered') statusColor = '#10b981';
    else if (order.status === 'Cancelled') statusColor = '#ef4444';
    
    document.getElementById('detOrderStatus').textContent = order.status;
    document.getElementById('detOrderStatus').style.color = statusColor;

    // Delivery Address
    const addr = order.shippingAddress;
    document.getElementById('detAddressName').textContent = addr.fullName;
    document.getElementById('detAddressPhone').textContent = addr.phone;
    document.getElementById('detAddressLines').innerHTML = `${addr.line1}, ${addr.line2 || ''}<br>${addr.city}, ${addr.state} - ${addr.pincode}`;

    // Invoice Download Action
    const invoiceBtn = document.getElementById('downloadInvoiceBtn');
    if (invoiceBtn) {
      invoiceBtn.onclick = () => {
        // Stream download from server
        const token = localStorage.getItem('lag_token');
        window.location.href = `${OrdersAPI.invoiceUrl(orderId)}?token=${token}`;
      };
    }

    // Render Items
    const itemsList = document.getElementById('detailOrderItems');
    itemsList.innerHTML = order.items.map(item => {
      const img = item.product?.images?.[0] || '/assets/images/hero_bottle.png';
      return `
        <div style="display:grid; grid-template-columns:60px 1fr auto; gap:16px; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.04); padding-bottom:10px">
          <img src="${img}" style="width:50px; height:50px; object-fit:contain; border-radius:6px; background:rgba(255,255,255,0.02)" onerror="this.src='/assets/images/hero_bottle.png'">
          <div>
            <strong style="color:#fff; font-size:0.88rem; display:block">${item.name}</strong>
            <span style="font-size:0.8rem; color:rgba(255,255,255,0.5)">₹${item.price} x ${item.qty}</span>
          </div>
          <strong style="color:#fff; font-size:0.9rem">₹${item.price * item.qty}</strong>
        </div>
      `;
    }).join('');

    // Summary calculation
    document.getElementById('detailSubtotal').textContent = `₹${order.subtotal}`;
    document.getElementById('detailGST').textContent = `₹${order.gstAmount}`;
    document.getElementById('detailShipping').textContent = order.shippingCharge === 0 ? 'FREE' : `₹${order.shippingCharge}`;
    
    if (order.couponDiscount > 0) {
      document.getElementById('detailDiscountRow').style.display = 'flex';
      document.getElementById('detailDiscount').textContent = `- ₹${order.couponDiscount}`;
    } else {
      document.getElementById('detailDiscountRow').style.display = 'none';
    }
    
    document.getElementById('detailTotal').textContent = `₹${order.total}`;

    // Tracking flow UI
    renderTrackingMilestones(order);

    // Cancel order option (Available before confirmation/packing)
    const cancelBox = document.getElementById('cancelOrderBox');
    if (cancelBox) {
      const allowedCancel = ['Placed', 'Confirmed'].includes(order.status);
      cancelBox.style.display = allowedCancel ? 'block' : 'none';
    }

  } catch (err) {
    if (loader) loader.style.display = 'none';
    if (err.message.includes('authorized') || err.message.includes('token') || err.message.includes('login') || err.message.includes('Server error')) {
      clearToken();
      clearUser();
      window.location.href = '/pages/auth.html?redirect=/pages/orders.html';
      return;
    }
    toast.error('Failed to load order details');
  }
};

// Render progress steps visually
const renderTrackingMilestones = (order) => {
  const trackingContainer = document.getElementById('orderTrackingSteps');
  if (!trackingContainer) return;

  const steps = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];
  
  if (order.status === 'Cancelled') {
    trackingContainer.innerHTML = `
      <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); border-radius:10px; padding:20px; text-align:center; color:#ef4444">
        <strong style="font-size:1.1rem; display:block; margin-bottom:5px;">Order Cancelled</strong>
        <p style="font-size:0.9rem; color:rgba(255,255,255,0.7); margin-top:4px;">Reason: ${order.cancelReason || 'Customer requested cancellation'}</p>
      </div>
    `;
    return;
  }

  const currentIdx = steps.indexOf(order.status);

  trackingContainer.innerHTML = `
    <div class="tracking-timeline" style="display:flex; justify-content:space-between; position:relative; margin: 35px 0 15px 0; gap: 8px;">
      <div class="timeline-bar" style="position:absolute; top:16px; left:20px; right:20px; height:4px; background:rgba(255,255,255,0.1); z-index:1; border-radius:2px;">
        <div class="timeline-fill" style="height:100%; width:${Math.max(0, (currentIdx / (steps.length - 1)) * 100)}%; background:#f5c518; transition:width 0.4s ease; border-radius:2px;"></div>
      </div>
      ${steps.map((step, idx) => {
        const isCompleted = idx <= currentIdx;
        const isActive = idx === currentIdx;
        
        return `
          <div class="timeline-step" style="display:flex; flex-direction:column; align-items:center; z-index:2; position:relative; flex:1; text-align:center;">
            <div class="step-dot" style="width:32px; height:32px; border-radius:50%; background:${isActive ? '#f5c518' : isCompleted ? '#f5c518' : '#222'}; border:2px solid ${isCompleted ? '#f5c518' : 'rgba(255,255,255,0.2)'}; color:${isCompleted ? '#000' : 'rgba(255,255,255,0.4)'}; font-size:0.85rem; font-weight:800; display:flex; align-items:center; justify-content:center; transition:all 0.3s; transform:${isActive ? 'scale(1.15)' : 'none'};">
              ${isCompleted ? '✓' : idx + 1}
            </div>
            <div class="step-labels-box" style="margin-top:12px;">
              <strong class="step-label" style="display:block; font-size:0.8rem; color:${isActive ? '#f5c518' : isCompleted ? '#fff' : 'rgba(255,255,255,0.4)'}; font-weight:700;">${step}</strong>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
};

// Cancel Order action
window.cancelOrder = async () => {
  const reason = document.getElementById('cancelReasonSelect').value;
  const orderId = new URLSearchParams(window.location.search).get('orderId');
  if (!orderId) return;

  const btn = document.getElementById('confirmCancelBtn');
  btn.disabled = true;
  btn.textContent = 'Cancelling...';

  try {
    await OrdersAPI.cancel(orderId, reason);
    toast.success('Order cancelled successfully');
    loadOrderDetail(); // Reload
  } catch (err) {
    toast.error(err.message || 'Failed to cancel order');
    btn.disabled = false;
    btn.textContent = 'Confirm Cancellation';
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('ordersListContainer')) {
    loadUserOrders();
  }
  if (document.getElementById('orderDetailContainer')) {
    loadOrderDetail();
  }
});
