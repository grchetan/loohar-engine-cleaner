const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { optionalAuth } = require('../middleware/auth');

// Get or create cart helper
const getCart = async (req) => {
  const sessionId = req.headers['x-session-id'];
  if (req.user) {
    return await Cart.findOne({ user: req.user._id }).populate('items.product', 'name images price stock slug') || new Cart({ user: req.user._id, items: [] });
  }
  if (sessionId) {
    return await Cart.findOne({ sessionId }).populate('items.product', 'name images price stock slug') || new Cart({ sessionId, items: [] });
  }
  return new Cart({ items: [] });
};

// GET /api/cart
router.get('/', optionalAuth, async (req, res) => {
  try {
    const cart = await getCart(req);
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/cart/add
router.post('/add', optionalAuth, async (req, res) => {
  try {
    const { productId, qty = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product || !product.isActive) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.stock < qty) return res.status(400).json({ success: false, message: `Only ${product.stock} items in stock` });

    const cart = await getCart(req);
    const existing = cart.items.find(i => i.product?._id?.toString() === productId || i.product?.toString() === productId);

    if (existing) {
      existing.qty = Math.min(existing.qty + qty, 20, product.stock);
    } else {
      cart.items.push({ product: productId, qty, price: product.price });
    }
    await cart.save();
    await cart.populate('items.product', 'name images price stock slug');
    res.json({ success: true, cart, message: 'Added to cart' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/cart/update
router.put('/update', optionalAuth, async (req, res) => {
  try {
    const { productId, qty } = req.body;
    const cart = await getCart(req);
    const item = cart.items.find(i => i.product?._id?.toString() === productId || i.product?.toString() === productId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not in cart' });
    if (qty <= 0) {
      cart.items = cart.items.filter(i => (i.product?._id?.toString() || i.product?.toString()) !== productId);
    } else {
      item.qty = Math.min(qty, 20);
    }
    await cart.save();
    await cart.populate('items.product', 'name images price stock slug');
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/cart/remove/:productId
router.delete('/remove/:productId', optionalAuth, async (req, res) => {
  try {
    const cart = await getCart(req);
    cart.items = cart.items.filter(i => (i.product?._id?.toString() || i.product?.toString()) !== req.params.productId);
    await cart.save();
    res.json({ success: true, cart, message: 'Removed from cart' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/cart/clear
router.delete('/clear', optionalAuth, async (req, res) => {
  try {
    const cart = await getCart(req);
    cart.items = [];
    await cart.save();
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/cart/merge — Merge guest cart after login
router.post('/merge', async (req, res) => {
  try {
    const { sessionId, userId } = req.body;
    const [guestCart, userCart] = await Promise.all([
      Cart.findOne({ sessionId }),
      Cart.findOne({ user: userId }),
    ]);
    if (!guestCart || guestCart.items.length === 0) return res.json({ success: true });

    const mergedCart = userCart || new Cart({ user: userId, items: [] });
    for (const guestItem of guestCart.items) {
      const existing = mergedCart.items.find(i => i.product.toString() === guestItem.product.toString());
      if (existing) {
        existing.qty = Math.min(existing.qty + guestItem.qty, 20);
      } else {
        mergedCart.items.push(guestItem);
      }
    }
    await mergedCart.save();
    await Cart.deleteOne({ sessionId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
