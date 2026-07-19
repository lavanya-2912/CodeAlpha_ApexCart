const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { ErrorResponse } = require('../middlewares/errorMiddleware');

// Helper to get or create wishlist
const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }
  return wishlist;
};

// @desc    Get user wishlist
// @route   GET /api/v1/wishlist
// @access  Private
exports.getWishlist = async (req, res, next) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user.id);
    
    const populated = await Wishlist.findById(wishlist._id).populate({
      path: 'products',
      select: 'name price discountPrice images quantityInStock ratingsAverage',
    });

    res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add product to wishlist
// @route   POST /api/v1/wishlist
// @access  Private
exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    const wishlist = await getOrCreateWishlist(req.user.id);

    if (wishlist.products.includes(productId)) {
      return res.status(200).json({
        success: true,
        message: 'Product already in wishlist',
        data: wishlist,
      });
    }

    wishlist.products.push(productId);
    await wishlist.save();

    res.status(200).json({
      success: true,
      data: wishlist,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/v1/wishlist/:productId
// @access  Private
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return next(new ErrorResponse('Wishlist not found', 404));
    }

    wishlist.products.pull(req.params.productId);
    await wishlist.save();

    res.status(200).json({
      success: true,
      data: wishlist,
    });
  } catch (err) {
    next(err);
  }
};
