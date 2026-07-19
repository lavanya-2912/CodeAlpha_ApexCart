const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating between 1 and 5'],
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: [true, 'Please add a review comment'],
    trim: true,
  },
  reviewImages: {
    type: [String],
    default: [],
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Avoid multiple reviews by same user for same product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to get avg rating and save
ReviewSchema.statics.getAverageRating = async function (productId) {
  const obj = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: '$product',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  try {
    if (obj.length > 0) {
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        ratingsQuantity: obj[0].nRating,
        ratingsAverage: obj[0].avgRating,
      });
    } else {
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        ratingsQuantity: 0,
        ratingsAverage: 0,
      });
    }
  } catch (err) {
    console.error('Error recalculating average rating:', err);
  }
};

// Call getAverageRating after save
ReviewSchema.post('save', async function () {
  await this.constructor.getAverageRating(this.product);
});

// Call getAverageRating after removal
ReviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.getAverageRating(doc.product);
  }
});

module.exports = mongoose.model('Review', ReviewSchema);
