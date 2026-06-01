const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { protect } = require('../middleware/auth');
const { getRazorpay } = require('../config/razorpay');
const { generateOrderId } = require('../utils/orderNumber');

// Shipping charge logic
const calcShipping = (subtotal) => {
  if (subtotal >= 1000) return 0;
  if (subtotal >= 500) return 40;
  return 60;
};

// GST Rate (18% on cleaning chemicals)
const GST_RATE = 0.18;

// POST /api/payment/create-order — Create Razorpay order
router.post('/create-order', protect, async (req, res) => {
  try {
    const { items, couponCode, addressId, gstNumber, companyName, notes } =
      req.body;

    // Validate items + calculate totals
    let subtotal = 0;
    const validatedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive)
        return res
          .status(400)
          .json({ success: false, message: `${item.name} is unavailable` });
      if (product.stock < item.qty)
        return res
          .status(400)
          .json({
            success: false,
            message: `Insufficient stock for ${product.name}`,
          });
      validatedItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0] || '',
        price: product.price,
        qty: item.qty,
      });
      subtotal += product.price * item.qty;
    }

    // Coupon
    let couponDiscount = 0;
    let couponData = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon) {
        const validity = coupon.isValid(subtotal, req.user._id);
        if (validity.valid) {
          couponDiscount = coupon.calculateDiscount(subtotal);
          couponData = { code: coupon.code, discount: couponDiscount };
        }
      }
    }

    const shippingCharge = calcShipping(subtotal);
    const gstAmount = Math.round(subtotal * GST_RATE);
    const total = subtotal - couponDiscount + shippingCharge + gstAmount;

    // Get shipping address
    const user = req.user;
    let shippingAddress;
    if (addressId) {
      shippingAddress = user.addresses.id(addressId);
    } else if (req.body.shippingAddress) {
      shippingAddress = req.body.shippingAddress;
    }
    if (!shippingAddress)
      return res
        .status(400)
        .json({ success: false, message: 'Shipping address required' });

    const razorpay = getRazorpay();
    if (!razorpay) {
      // COD only — create order directly
      return res.json({
        success: true,
        codOnly: true,
        orderData: {
          items: validatedItems,
          shippingAddress,
          gstNumber,
          companyName,
          subtotal,
          shippingCharge,
          gstAmount,
          coupon: couponData,
          couponDiscount,
          total,
          notes,
        },
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), // paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: { userId: user._id.toString() },
    });

    res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      orderData: {
        items: validatedItems,
        shippingAddress,
        gstNumber,
        companyName,
        subtotal,
        shippingCharge,
        gstAmount,
        coupon: couponData,
        couponDiscount,
        total,
        notes,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payment/verify — Verify Razorpay payment + create order
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderData } =
      req.body;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res
        .status(400)
        .json({ success: false, message: 'Payment verification failed' });
    }

    const order = await createOrder(req.user._id, orderData, {
      method: 'razorpay',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      status: 'paid',
      paidAt: new Date(),
    });

    await sendOrderNotification(order, req.user);
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payment/cod — Place Cash On Delivery order
router.post('/cod', protect, async (req, res) => {
  try {
    const { orderData } = req.body;
    const order = await createOrder(req.user._id, orderData, {
      method: 'cod',
      status: 'pending',
    });
    await sendOrderNotification(order, req.user);
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper: Create order in DB
async function createOrder(userId, orderData, payment) {
  const orderId = generateOrderId();

  // Deduct stock
  for (const item of orderData.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.qty },
    });
  }

  // Mark coupon used
  if (orderData.coupon?.code) {
    await Coupon.findOneAndUpdate(
      { code: orderData.coupon.code },
      { $inc: { usedCount: 1 }, $push: { usedBy: userId } },
    );
  }

  // Clear cart
  await Cart.findOneAndUpdate({ user: userId }, { items: [] });

  const order = await Order.create({
    orderId,
    user: userId,
    items: orderData.items,
    shippingAddress: orderData.shippingAddress,
    gstNumber: orderData.gstNumber,
    companyName: orderData.companyName,
    payment,
    coupon: orderData.coupon || {},
    subtotal: orderData.subtotal,
    shippingCharge: orderData.shippingCharge,
    gstAmount: orderData.gstAmount,
    couponDiscount: orderData.couponDiscount || 0,
    total: orderData.total,
    notes: orderData.notes,
    tracking: [{ status: 'Placed', note: 'Order placed successfully' }],
  });

  return order;
}

// Helper: Send order confirmation notifications
async function sendOrderNotification(order, user) {
  try {
    const emailService = require('../services/email');
    await emailService.sendOrderConfirmation(user.email, user.name, order);
  } catch (err) {
    console.warn('Order notification failed:', err.message);
  }
}

module.exports = router;
