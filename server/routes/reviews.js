const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

// GET /api/reviews/product/:productId
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId, isApproved: true })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/reviews — Submit review
router.post('/', protect, async (req, res) => {
  try {
    const { productId, orderId, rating, title, body } = req.body;
    if (!productId || !rating) return res.status(400).json({ success: false, message: 'Product and rating required' });

    // Check for duplicate
    const existing = await Review.findOne({ product: productId, user: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'You already reviewed this product' });

    // Check if verified purchase
    let isVerifiedPurchase = false;
    if (orderId) {
      const order = await Order.findOne({ orderId, user: req.user._id, status: 'Delivered' });
      if (order) isVerifiedPurchase = true;
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      order: orderId || undefined,
      rating, title, body,
      isVerifiedPurchase,
      isApproved: false, // Admin must approve
    });

    res.status(201).json({ success: true, message: 'Review submitted for approval', review });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/reviews — [Admin] All pending reviews
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { approved, page = 1, limit = 20 } = req.query;
    const query = {};
    if (approved !== undefined) query.isApproved = approved === 'true';
    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/reviews/:id/approve — [Admin] Approve review
router.put('/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { isApproved: req.body.approve !== false }, { new: true });
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/reviews/:id — [Admin] Delete review
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
