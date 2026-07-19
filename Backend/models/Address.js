const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please add a label (e.g. Home, Office)'],
    trim: true,
  },
  street: {
    type: String,
    required: [true, 'Please add street address'],
  },
  city: {
    type: String,
    required: [true, 'Please add city'],
  },
  state: {
    type: String,
    required: [true, 'Please add state'],
  },
  zipCode: {
    type: String,
    required: [true, 'Please add ZIP or postal code'],
  },
  country: {
    type: String,
    required: [true, 'Please add country'],
    default: 'United States',
  },
  phone: {
    type: String,
    required: [true, 'Please add phone number'],
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Address', AddressSchema);
