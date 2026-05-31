const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 },
});

const trackingEventSchema = new mongoose.Schema({
  status: { type: String, required: true },
  note: { type: String },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  line1: String,
  line2: String,
  city: String,
  state: String,
  pincode: String,
});

const ORDER_STATUSES = [
  'Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out For Delivery',
  'Delivered',
  'Cancelled',
];

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    gstNumber: { type: String },
    companyName: { type: String },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'Placed',
    },
    payment: {
      method: { type: String, enum: ['razorpay', 'cod', 'upi'], default: 'cod' },
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
      paidAt: Date,
    },
    coupon: {
      code: String,
      discount: { type: Number, default: 0 },
    },
    subtotal: { type: Number, required: true },
    shippingCharge: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    tracking: [trackingEventSchema],
    invoiceUrl: { type: String },
    cancelReason: { type: String },
    cancelledAt: { type: Date },
    deliveredAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
