const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const { generateInvoicePDF } = require('../services/invoice');

// GET /api/orders — User's orders
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('items.product', 'name images slug'),
      Order.countDocuments({ user: req.user._id }),
    ]);
    res.json({ success: true, orders, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:orderId — Single order
router.get('/:orderId', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId, user: req.user._id }).populate('items.product', 'name images slug price');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders/:orderId/cancel — Cancel order
router.post('/:orderId/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (['Shipped', 'Out For Delivery', 'Delivered', 'Cancelled'].includes(order.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel order in ${order.status} status` });
    }
    order.status = 'Cancelled';
    order.cancelReason = req.body.reason || 'Cancelled by customer';
    order.cancelledAt = new Date();
    order.tracking.push({ status: 'Cancelled', note: order.cancelReason });

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
    }
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:orderId/invoice — Download PDF invoice
router.get('/:orderId/invoice', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId, user: req.user._id }).populate('items.product', 'name price').populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderId}.pdf`);
    generateInvoicePDF(order, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===== ADMIN ROUTES =====
// GET /api/orders/admin/all — [Admin] All orders
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.orderId = { $regex: search, $options: 'i' };
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('user', 'name email phone'),
      Order.countDocuments(query),
    ]);
    res.json({ success: true, orders, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/:orderId/status — [Admin] Update order status
router.put('/:orderId/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;
    order.tracking.push({ status, note: note || `Status updated to ${status}`, updatedBy: req.user._id });
    if (status === 'Delivered') order.deliveredAt = new Date();

    await order.save();

    // Send update email
    try {
      const emailService = require('../services/email');
      const populatedOrder = await order.populate('user', 'name email');
      await emailService.sendOrderStatusUpdate(populatedOrder.user.email, populatedOrder.user.name, order);
    } catch (_) {}

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
