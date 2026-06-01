const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/wishlist
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'wishlist',
      'name slug images price mrp rating isBestseller isActive',
    );
    res.json({
      success: true,
      wishlist: user.wishlist.filter((p) => p.isActive),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/wishlist/toggle/:productId
router.post('/toggle/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const idx = user.wishlist.findIndex(
      (id) => id.toString() === req.params.productId,
    );
    let added;
    if (idx > -1) {
      user.wishlist.splice(idx, 1);
      added = false;
    } else {
      user.wishlist.push(req.params.productId);
      added = true;
    }
    await user.save();
    res.json({
      success: true,
      added,
      message: added ? 'Added to wishlist' : 'Removed from wishlist',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
