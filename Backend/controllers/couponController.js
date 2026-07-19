const Coupon = require('../models/Coupon');
const { ErrorResponse } = require('../middlewares/errorMiddleware');

// @desc    Validate a coupon code
// @route   POST /api/v1/coupons/validate
// @access  Private
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return next(new ErrorResponse('Please provide a coupon code', 400));
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return next(new ErrorResponse('Invalid coupon code', 404));
    }

    if (!coupon.isActive) {
      return next(new ErrorResponse('This coupon code has been deactivated', 400));
    }

    if (coupon.isExpired()) {
      return next(new ErrorResponse('This coupon has expired', 400));
    }

    res.status(200).json({
      success: true,
      data: {
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
        _id: coupon._id
      },
    });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN COUPON ENDPOINTS ---

// @desc    Get all coupons
// @route   GET /api/v1/coupons
// @access  Private/Admin
exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort('-createdAt');
    res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a coupon
// @route   POST /api/v1/coupons
// @access  Private/Admin
exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({
      success: true,
      data: coupon,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a coupon
// @route   DELETE /api/v1/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return next(new ErrorResponse(`Coupon not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
