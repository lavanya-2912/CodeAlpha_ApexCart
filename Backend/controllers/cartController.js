const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { ErrorResponse } = require('../middlewares/errorMiddleware');

// Helper to get or create cart for user
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

// @desc    Get user cart
// @route   GET /api/v1/cart
// @access  Private
exports.getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    
    // Populate product details
    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price discountPrice images quantityInStock brand category',
      populate: [
        { path: 'brand', select: 'name' },
        { path: 'category', select: 'name' }
      ]
    });

    res.status(200).json({
      success: true,
      data: populatedCart,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add item to cart
// @route   POST /api/v1/cart
// @access  Private
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity, 10) || 1;

    // Check if product exists and is in stock
    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    if (product.quantityInStock < qty) {
      return next(new ErrorResponse(`Only ${product.quantityInStock} units left in stock`, 400));
    }

    const cart = await getOrCreateCart(req.user.id);

    // Check if item already exists in cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && !item.saveForLater
    );

    if (itemIndex > -1) {
      // Product exists, increment quantity
      cart.items[itemIndex].quantity += qty;
    } else {
      // Add new item
      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save();
    
    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/v1/cart/items/:itemId
// @access  Private
exports.updateQuantity = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (qty < 1) {
      return next(new ErrorResponse('Quantity must be at least 1', 400));
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return next(new ErrorResponse('Cart not found', 404));
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return next(new ErrorResponse('Cart item not found', 404));
    }

    // Verify stock
    const product = await Product.findById(item.product);
    if (product.quantityInStock < qty) {
      return next(new ErrorResponse(`Only ${product.quantityInStock} units left in stock`, 400));
    }

    item.quantity = qty;
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/items/:itemId
// @access  Private
exports.removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return next(new ErrorResponse('Cart not found', 404));
    }

    // Find and pull the item out of the array
    cart.items.pull({ _id: req.params.itemId });
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle Save for Later
// @route   PUT /api/v1/cart/items/:itemId/save-for-later
// @access  Private
exports.toggleSaveForLater = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return next(new ErrorResponse('Cart not found', 404));
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return next(new ErrorResponse('Cart item not found', 404));
    }

    item.saveForLater = !item.saveForLater;
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Sync guest cart with database on login
// @route   POST /api/v1/cart/sync
// @access  Private
exports.syncCart = async (req, res, next) => {
  try {
    const { items } = req.body; // Array of { product: id, quantity: n }
    if (!Array.isArray(items)) {
      return next(new ErrorResponse('Invalid payload, items list required', 400));
    }

    const cart = await getOrCreateCart(req.user.id);

    for (const guestItem of items) {
      // Find matching item in DB cart
      const existingItemIndex = cart.items.findIndex(
        (dbItem) => dbItem.product.toString() === guestItem.product
      );

      if (existingItemIndex > -1) {
        // Overwrite or sum quantity
        cart.items[existingItemIndex].quantity = Math.max(
          cart.items[existingItemIndex].quantity,
          guestItem.quantity
        );
      } else {
        // Verify product exists before adding
        const product = await Product.findById(guestItem.product);
        if (product) {
          cart.items.push({
            product: guestItem.product,
            quantity: guestItem.quantity,
          });
        }
      }
    }

    await cart.save();

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};
