const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
});

const AddressSubSchema = new mongoose.Schema({
  title: String,
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String, required: true },
});

const TimelineSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    required: true,
  },
  description: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderItems: [OrderItemSchema],
  shippingAddress: {
    type: AddressSubSchema,
    required: true,
  },
  billingAddress: {
    type: AddressSubSchema,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'cod'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentIntentId: {
    type: String,
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  couponApplied: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
  },
  discountAmount: {
    type: Number,
    default: 0.0,
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending',
  },
  trackingNumber: {
    type: String,
  },
  deliveryTimeline: [TimelineSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Setup timeline tracking details automatically when status changes
OrderSchema.pre('save', function (next) {
  if (this.isModified('orderStatus')) {
    const descriptionMap = {
      pending: 'Order placed successfully and is awaiting processing.',
      processing: 'Seller is preparing your order.',
      shipped: 'Order has been dispatched and is on its way.',
      delivered: 'Order was successfully delivered to your doorstep.',
      cancelled: 'Order has been cancelled.',
      returned: 'Return request processed successfully.',
    };
    
    this.deliveryTimeline.push({
      status: this.orderStatus,
      description: descriptionMap[this.orderStatus] || 'Status updated.',
      timestamp: Date.now(),
    });
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
