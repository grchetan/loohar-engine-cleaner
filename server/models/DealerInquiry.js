const mongoose = require('mongoose');

const dealerInquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    businessName: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    businessType: {
      type: String,
      enum: [
        'garage',
        'workshop',
        'autoparts',
        'distributor',
        'servicecenter',
        'other',
      ],
      default: 'other',
    },
    inquiryType: {
      type: String,
      enum: ['dealer', 'distributor', 'bulk'],
      default: 'dealer',
    },
    message: { type: String },
    status: {
      type: String,
      enum: ['new', 'contacted', 'interested', 'converted', 'rejected'],
      default: 'new',
    },
    adminNotes: { type: String },
  },
  { timestamps: true },
);

dealerInquirySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('DealerInquiry', dealerInquirySchema);
