const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a brand name'],
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  logo: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create brand slug from the name before saving
BrandSchema.pre('save', function (next) {
  this.slug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  next();
});

module.exports = mongoose.model('Brand', BrandSchema);
