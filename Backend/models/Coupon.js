const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please add a coupon code'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountPercentage: {
    type: Number,
    required: [true, 'Please add discount percentage'],
    min: [1, 'Discount must be at least 1%'],
    max: [100, 'Discount cannot exceed 100%'],
  },
  expiryDate: {
    type: Date,
    required: [true, 'Please add expiry date'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Check if coupon is expired
CouponSchema.methods.isExpired = function () {
  return Date.now() > this.expiryDate;
};

module.exports = mongoose.model('Coupon', CouponSchema);
