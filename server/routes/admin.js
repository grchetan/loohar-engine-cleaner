const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const DealerInquiry = require('../models/DealerInquiry');
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// GET /api/admin/dashboard — Stats
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));

    const [
      totalOrders,
      todayOrders,
      monthOrders,
      totalRevenue,
      monthRevenue,
      totalUsers,
      totalProducts,
      pendingOrders,
      pendingReviews,
      newInquiries,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.aggregate([
        { $match: { 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth },
            'payment.status': 'paid',
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({ status: { $in: ['Placed', 'Confirmed'] } }),
      Review.countDocuments({ isApproved: false }),
      DealerInquiry.countDocuments({ status: 'new' }),
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email');

    // Low stock products
    const lowStock = await Product.find({
      isActive: true,
      stock: { $lte: 10 },
    }).select('name stock');

    res.json({
      success: true,
      stats: {
        totalOrders,
        todayOrders,
        monthOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthRevenue: monthRevenue[0]?.total || 0,
        totalUsers,
        totalProducts,
        pendingOrders,
        pendingReviews,
        newInquiries,
      },
      recentOrders,
      lowStock,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/customers — Customer list
router.get('/customers', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { role: 'customer' };
    if (search)
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-password'),
      User.countDocuments(query),
    ]);
    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/customers/:id/status — Toggle customer active status
router.patch('/customers/:id/status', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true },
    ).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
