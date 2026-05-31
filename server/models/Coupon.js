const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },
    discountType: { type: String, enum: ['percent', 'flat'], default: 'percent' },
    value: { type: Number, required: true, min: 1 },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number },
    maxUses: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.methods.isValid = function (orderAmount, userId) {
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (this.expiresAt && new Date() > this.expiresAt) return { valid: false, message: 'Coupon has expired' };
  if (this.maxUses && this.usedCount >= this.maxUses) return { valid: false, message: 'Coupon usage limit reached' };
  if (orderAmount < this.minOrderAmount)
    return { valid: false, message: `Minimum order ₹${this.minOrderAmount} required` };
  if (userId && this.usedBy.includes(userId))
    return { valid: false, message: 'You have already used this coupon' };
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function (orderAmount) {
  let discount = 0;
  if (this.discountType === 'percent') {
    discount = (orderAmount * this.value) / 100;
    if (this.maxDiscountAmount) discount = Math.min(discount, this.maxDiscountAmount);
  } else {
    discount = this.value;
  }
  return Math.min(discount, orderAmount);
};

module.exports = mongoose.model('Coupon', couponSchema);
