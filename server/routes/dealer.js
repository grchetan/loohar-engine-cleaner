const express = require('express');
const router = express.Router();
const DealerInquiry = require('../models/DealerInquiry');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

// POST /api/dealer/inquiry — Submit inquiry
router.post('/inquiry', async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      businessName,
      city,
      state,
      businessType,
      inquiryType,
      message,
    } = req.body;
    if (!name || !phone || !businessName || !city) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Name, phone, business name and city are required',
        });
    }
    const inquiry = await DealerInquiry.create({
      name,
      phone,
      email,
      businessName,
      city,
      state,
      businessType,
      inquiryType: inquiryType || 'dealer',
      message,
    });

    // Notify admin
    try {
      const emailService = require('../services/email');
      await emailService.sendDealerInquiryAlert(inquiry);
    } catch (_) {}

    res
      .status(201)
      .json({
        success: true,
        message: "Inquiry received! We'll contact you within 24 hours.",
        inquiry: { _id: inquiry._id },
      });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dealer — [Admin] List inquiries
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.inquiryType = type;
    const skip = (page - 1) * limit;
    const [inquiries, total] = await Promise.all([
      DealerInquiry.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      DealerInquiry.countDocuments(query),
    ]);
    res.json({ success: true, inquiries, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/dealer/:id — [Admin] Update inquiry status
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const inquiry = await DealerInquiry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.json({ success: true, inquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
