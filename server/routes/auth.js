const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { verifyFirebaseToken } = require('../config/firebase');
const {
  protect,
  sendTokenResponse,
  generateToken,
} = require('../middleware/auth');
const crypto = require('crypto');

// Helper: format validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 60 }),
    body('email')
      .isEmail()
      .withMessage('Valid email required')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('phone')
      .optional()
      .isMobilePhone('en-IN')
      .withMessage('Valid Indian phone required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, email, password, phone } = req.body;
      const existing = await User.findOne({ email });
      if (existing)
        return res
          .status(400)
          .json({ success: false, message: 'Email already registered' });

      const user = await User.create({ name, email, password, phone });
      sendTokenResponse(user, 201, res);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');
      if (!user || !user.password) {
        return res
          .status(401)
          .json({ success: false, message: 'Invalid credentials' });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch)
        return res
          .status(401)
          .json({ success: false, message: 'Invalid credentials' });
      user.lastLogin = new Date();
      await user.save();
      sendTokenResponse(user, 200, res);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// POST /api/auth/firebase — Google / Firebase token login
router.post('/firebase', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken)
      return res
        .status(400)
        .json({ success: false, message: 'Firebase ID token required' });

    const decoded = await verifyFirebaseToken(idToken);
    if (!decoded)
      return res
        .status(401)
        .json({ success: false, message: 'Invalid Firebase token' });

    let user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      user = await User.findOne({ email: decoded.email });
      if (user) {
        user.firebaseUid = decoded.uid;
        await user.save();
      } else {
        user = await User.create({
          name: decoded.name || decoded.email.split('@')[0],
          email: decoded.email,
          firebaseUid: decoded.uid,
          avatar: decoded.picture,
          googleId: decoded.uid,
        });
      }
    }
    user.lastLogin = new Date();
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validate,
  async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        // Don't reveal if email exists
        return res.json({
          success: true,
          message: 'If that email exists, a reset link has been sent.',
        });
      }
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 min
      await user.save();

      // In production, send email with reset link
      const resetUrl = `${process.env.FRONTEND_URL}/pages/reset-password.html?token=${resetToken}`;
      try {
        const emailService = require('../services/email');
        await emailService.sendPasswordReset(user.email, user.name, resetUrl);
      } catch (emailErr) {
        console.warn('Email send failed:', emailErr.message);
      }
      res.json({
        success: true,
        message: 'If that email exists, a reset link has been sent.',
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: 'Invalid or expired reset token' });
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/auth/me
router.put(
  '/me',
  protect,
  [
    body('name').optional().trim().notEmpty().isLength({ max: 60 }),
    body('phone').optional().isMobilePhone('en-IN'),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, phone, avatar } = req.body;
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { name, phone, avatar },
        { new: true, runValidators: true },
      );
      res.json({ success: true, user });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// PUT /api/auth/me/address — Add or update address
router.put('/me/address', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const {
      _id,
      label,
      fullName,
      phone,
      line1,
      line2,
      city,
      state,
      pincode,
      isDefault,
    } = req.body;

    if (isDefault) user.addresses.forEach((a) => (a.isDefault = false));

    if (_id) {
      const addr = user.addresses.id(_id);
      if (addr)
        Object.assign(addr, {
          label,
          fullName,
          phone,
          line1,
          line2,
          city,
          state,
          pincode,
          isDefault,
        });
    } else {
      if (user.addresses.length === 0) req.body.isDefault = true;
      user.addresses.push({
        label,
        fullName,
        phone,
        line1,
        line2,
        city,
        state,
        pincode,
        isDefault,
      });
    }
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/auth/me/address/:id
router.delete('/me/address/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(
      (a) => a._id.toString() !== req.params.id,
    );
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.cookie('token', '', { expires: new Date(0), httpOnly: true });
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;
