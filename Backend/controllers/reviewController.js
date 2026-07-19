const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { ErrorResponse } = require('../middlewares/errorMiddleware');

// @desc    Get reviews for a product
// @route   GET /api/v1/reviews/product/:productId
// @access  Public
exports.getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name profilePicture')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a product review
// @route   POST /api/v1/reviews/product/:productId
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const { rating, comment } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    // Check if user already reviewed this product
    const alreadyReviewed = await Review.findOne({
      product: productId,
      user: req.user.id,
    });

    if (alreadyReviewed) {
      return next(new ErrorResponse('You have already reviewed this product', 400));
    }

    // Check if verified purchase (Order exists, is delivered, and contains this product)
    const hasPurchased = await Order.findOne({
      user: req.user.id,
      orderStatus: 'delivered',
      'orderItems.product': productId,
    });
    const isVerifiedPurchase = !!hasPurchased;

    const review = await Review.create({
      product: productId,
      user: req.user.id,
      rating: Number(rating),
      comment,
      isVerifiedPurchase,
    });

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a review
// @route   PUT /api/v1/reviews/:id
// @access  Private
exports.updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return next(new ErrorResponse(`Review not found with id of ${req.params.id}`, 404));
    }

    // Ensure review belongs to user
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to update this review', 401));
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Manually trigger rating update (hook is on save, but findByIdAndUpdate bypasses pre/post save hooks. 
    // We can run statics recalculate method directly)
    await Review.getAverageRating(review.product);

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {
    // Find review first
    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(new ErrorResponse(`Review not found with id of ${req.params.id}`, 404));
    }

    // Ensure review belongs to user
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to delete this review', 401));
    }

    // Use findOneAndDelete to trigger our post hook
    await Review.findOneAndDelete({ _id: req.params.id });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
