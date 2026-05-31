const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 100 },
    body: { type: String, trim: true, maxlength: 2000 },
    isVerifiedPurchase: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    helpfulVotes: { type: Number, default: 0 },
    images: [{ type: String }],
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, isApproved: 1 });
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// After saving a review, update product rating
reviewSchema.post('save', async function () {
  const Product = require('./Product');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { product: this.product, isApproved: true } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.product, {
      'rating.avg': Math.round(stats[0].avgRating * 10) / 10,
      'rating.count': stats[0].count,
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
