const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

// POST /api/coupons/validate — Check coupon validity
router.post('/validate', protect, async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });

    const validity = coupon.isValid(orderAmount || 0, req.user._id);
    if (!validity.valid) return res.status(400).json({ success: false, message: validity.message });

    const discount = coupon.calculateDiscount(orderAmount || 0);
    res.json({ success: true, coupon: { code: coupon.code, discount, description: coupon.description } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/coupons — [Admin] List coupons
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/coupons — [Admin] Create coupon
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/coupons/:id — [Admin] Update coupon
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/coupons/:id — [Admin] Delete coupon
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
