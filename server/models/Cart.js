const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  qty: { type: Number, required: true, min: 1, max: 20, default: 1 },
  price: { type: Number },
});

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', sparse: true },
    sessionId: { type: String, sparse: true },
    items: [cartItemSchema],
  },
  { timestamps: true },
);

cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });

// Virtual: total items
cartSchema.virtual('totalItems').get(function () {
  return this.items.reduce((sum, item) => sum + item.qty, 0);
});

// Virtual: subtotal
cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.qty, 0);
});

cartSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Cart', cartSchema);
