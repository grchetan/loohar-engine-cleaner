const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    slug: { type: String, unique: true, lowercase: true },
    category: {
      type: String,
      required: true,
      enum: ['Engine Care', 'Exterior Care', 'Interior Care', 'Garage Maintenance'],
    },
    description: { type: String, required: true },
    features: [{ type: String }],
    howToUse: { type: String },
    images: [{ type: String }],
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, unique: true, sparse: true },
    hsn: { type: String },
    weight: { type: Number },
    tags: [{ type: String, lowercase: true }],
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isBestseller: { type: Boolean, default: false },
    rating: {
      avg: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

// Auto-generate slug from name
productSchema.pre('save', function () {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  // Auto-set MRP if not provided
  if (!this.mrp) this.mrp = this.price;
});

// Virtual: discount percentage
productSchema.virtual('discountPercent').get(function () {
  if (!this.mrp || this.mrp <= this.price) return 0;
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
