const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// GET /api/products — List with filters + search + pagination
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, page = 1, limit = 12, featured, minPrice, maxPrice } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;
    if (search) query.$text = { $search: search };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const sortOptions = {
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      'newest': { createdAt: -1 },
      'rating': { 'rating.avg': -1 },
      'default': { isFeatured: -1, isBestseller: -1, createdAt: -1 },
    };
    const sortBy = sortOptions[sort] || sortOptions['default'];

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).sort(sortBy).skip(skip).limit(Number(limit)).populate('relatedProducts', 'name slug price images'),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('relatedProducts', 'name slug price images rating isBestseller');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products — [Admin] Create product
router.post('/', protect, adminOnly, upload.array('images', 5), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files && req.files.length > 0) {
      const imageUrls = await Promise.all(
        req.files.map(file => uploadToCloudinary(file.buffer, 'lohar-auto/products'))
      );
      data.images = imageUrls;
    }
    if (data.features && typeof data.features === 'string') {
      data.features = data.features.split('\n').filter(Boolean);
    }
    const product = await Product.create(data);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/products/:id — [Admin] Update product
router.put('/:id', protect, adminOnly, upload.array('images', 5), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files && req.files.length > 0) {
      const imageUrls = await Promise.all(
        req.files.map(file => uploadToCloudinary(file.buffer, 'lohar-auto/products'))
      );
      data.images = data.keepImages
        ? [...(data.keepImages.split(',').filter(Boolean)), ...imageUrls]
        : imageUrls;
    }
    if (data.features && typeof data.features === 'string') {
      data.features = data.features.split('\n').filter(Boolean);
    }
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id — [Admin] Delete product
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    // Soft delete
    product.isActive = false;
    await product.save();
    res.json({ success: true, message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/products/:id/stock — [Admin] Update stock
router.patch('/:id/stock', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock: req.body.stock },
      { new: true }
    );
    res.json({ success: true, stock: product.stock });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
