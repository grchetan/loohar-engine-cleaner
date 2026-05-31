const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your-')) {
    console.warn('⚠️  Email not configured - notifications disabled');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  const t = getTransporter();
  if (!t) return;
  await t.sendMail({
    from: `"Lohar Auto Garage" <${process.env.EMAIL_USER}>`,
    to, subject, html,
  });
};

// Email Templates
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: #0a0a0a; padding: 24px 32px; text-align: center; }
    .header h1 { color: #f5c518; font-size: 24px; margin: 0; letter-spacing: 3px; }
    .header p { color: rgba(255,255,255,0.6); font-size: 12px; margin: 4px 0 0; }
    .body { padding: 32px; }
    .highlight { background: #fff9e6; border-left: 4px solid #f5c518; padding: 16px; border-radius: 4px; margin: 16px 0; }
    .btn { display: inline-block; padding: 12px 28px; background: #f5c518; color: #000; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0; }
    .order-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .order-table th { background: #f5c518; padding: 10px; text-align: left; font-size: 13px; }
    .order-table td { padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
    .total-row td { font-weight: bold; border-top: 2px solid #f5c518; }
    .footer { background: #0a0a0a; padding: 20px 32px; text-align: center; }
    .footer p { color: rgba(255,255,255,0.4); font-size: 12px; margin: 0; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚙ LOHAR AUTO</h1>
      <p>Professional Cleaning Solutions For Every Engine</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© 2024 Lohar Auto Garage | Made with ❤️ in India</p>
      <p>Need help? Email us at ${process.env.EMAIL_USER || 'info@loharautogarage.com'}</p>
    </div>
  </div>
</body>
</html>`;

// Welcome Email
const sendWelcomeEmail = async (email, name) => {
  await sendEmail({
    to: email,
    subject: 'Welcome to Lohar Auto Garage! 🎉',
    html: baseTemplate(`
      <h2>Welcome, ${name}! 👋</h2>
      <p>Thank you for joining Lohar Auto Garage — India's trusted engine cleaning solution.</p>
      <div class="highlight">
        <strong>Your account is ready!</strong><br>
        Start exploring our professional automotive cleaning products.
      </div>
      <a href="${process.env.FRONTEND_URL}/pages/products.html" class="btn">Shop Products →</a>
      <p>Use code <strong>WELCOME10</strong> for 10% off your first order!</p>
    `),
  });
};

// Order Confirmation Email
const sendOrderConfirmation = async (email, name, order) => {
  const itemsHtml = order.items.map(item =>
    `<tr><td>${item.name}</td><td>${item.qty}</td><td>₹${item.price}</td><td>₹${item.price * item.qty}</td></tr>`
  ).join('');

  await sendEmail({
    to: email,
    subject: `Order Confirmed! #${order.orderId} 🎉`,
    html: baseTemplate(`
      <h2>Order Confirmed! 🎉</h2>
      <p>Hi ${name}, your order has been placed successfully.</p>
      <div class="highlight">
        <strong>Order ID:</strong> ${order.orderId}<br>
        <strong>Payment:</strong> ${order.payment.method.toUpperCase()}<br>
        <strong>Status:</strong> <span class="status-badge" style="background:#fff3cd">Placed</span>
      </div>
      <table class="order-table">
        <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
        ${itemsHtml}
        <tr><td colspan="3">Subtotal</td><td>₹${order.subtotal}</td></tr>
        <tr><td colspan="3">Shipping</td><td>₹${order.shippingCharge}</td></tr>
        <tr><td colspan="3">GST (18%)</td><td>₹${order.gstAmount}</td></tr>
        ${order.couponDiscount ? `<tr><td colspan="3">Coupon Discount</td><td>-₹${order.couponDiscount}</td></tr>` : ''}
        <tr class="total-row"><td colspan="3">Total</td><td>₹${order.total}</td></tr>
      </table>
      <a href="${process.env.FRONTEND_URL}/pages/order-detail.html?id=${order.orderId}" class="btn">Track Order →</a>
    `),
  });
};

// Order Status Update Email
const sendOrderStatusUpdate = async (email, name, order) => {
  const statusColors = {
    Confirmed: '#d4edda', Packed: '#cce5ff', Shipped: '#fff3cd',
    'Out For Delivery': '#ffd9b3', Delivered: '#d4edda', Cancelled: '#f8d7da',
  };
  const color = statusColors[order.status] || '#f0f0f0';

  await sendEmail({
    to: email,
    subject: `Order Update: ${order.status} — #${order.orderId}`,
    html: baseTemplate(`
      <h2>Order Update 📦</h2>
      <p>Hi ${name}, your order status has been updated.</p>
      <div class="highlight">
        <strong>Order ID:</strong> ${order.orderId}<br>
        <strong>New Status:</strong> <span class="status-badge" style="background:${color}">${order.status}</span>
      </div>
      <a href="${process.env.FRONTEND_URL}/pages/order-detail.html?id=${order.orderId}" class="btn">View Order →</a>
    `),
  });
};

// Password Reset Email
const sendPasswordReset = async (email, name, resetUrl) => {
  await sendEmail({
    to: email,
    subject: 'Reset Your Lohar Auto Garage Password',
    html: baseTemplate(`
      <h2>Reset Your Password 🔐</h2>
      <p>Hi ${name}, you requested to reset your password.</p>
      <p>Click the button below to reset it. This link is valid for 30 minutes.</p>
      <a href="${resetUrl}" class="btn">Reset Password →</a>
      <p style="color:#999;font-size:12px">If you didn't request this, ignore this email.</p>
    `),
  });
};

// Dealer Inquiry Alert (to admin)
const sendDealerInquiryAlert = async (inquiry) => {
  if (!process.env.ADMIN_EMAIL) return;
  await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: `New Dealer Inquiry from ${inquiry.name} — ${inquiry.city}`,
    html: baseTemplate(`
      <h2>New Dealer Inquiry 🤝</h2>
      <div class="highlight">
        <strong>Name:</strong> ${inquiry.name}<br>
        <strong>Phone:</strong> ${inquiry.phone}<br>
        <strong>Business:</strong> ${inquiry.businessName}<br>
        <strong>City:</strong> ${inquiry.city}<br>
        <strong>Type:</strong> ${inquiry.businessType}<br>
        ${inquiry.message ? `<strong>Message:</strong> ${inquiry.message}` : ''}
      </div>
      <a href="${process.env.FRONTEND_URL}/pages/admin/dealers.html" class="btn">View in Admin →</a>
    `),
  });
};

module.exports = { sendWelcomeEmail, sendOrderConfirmation, sendOrderStatusUpdate, sendPasswordReset, sendDealerInquiryAlert };
