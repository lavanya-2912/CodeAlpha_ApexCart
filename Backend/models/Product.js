const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a product description'],
  },
  price: {
    type: Number,
    required: [true, 'Please add a product price'],
    min: [0, 'Price must be positive'],
  },
  discountPrice: {
    type: Number,
    default: 0,
    validate: {
      validator: function (value) {
        // 'this' refers to doc; only works on initial doc creation
        return value < this.price;
      },
      message: 'Discount price ({VALUE}) must be lower than original price',
    },
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please associate a category'],
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: [true, 'Please associate a brand'],
  },
  quantityInStock: {
    type: Number,
    required: [true, 'Please add stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  ratingsAverage: {
    type: Number,
    default: 0,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating cannot exceed 5'],
    set: val => Math.round(val * 10) / 10, // 4.6666 -> 4.7
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  images: {
    type: [String],
    default: [],
  },
  specifications: {
    type: Map,
    of: String,
    default: {},
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isTrending: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexing for search performance
ProductSchema.index({ name: 'text', description: 'text' });

// Create product slug from the name before saving
ProductSchema.pre('save', function (next) {
  this.slug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  next();
});

module.exports = mongoose.model('Product', ProductSchema);
