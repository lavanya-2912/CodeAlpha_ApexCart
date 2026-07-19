const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const generateInvoicePdf = require('../utils/pdfGenerator');
const { ErrorResponse } = require('../middlewares/errorMiddleware');

// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      billingAddress,
      paymentMethod,
      paymentStatus,
      paymentIntentId,
      couponCode,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return next(new ErrorResponse('No order items provided', 400));
    }

    // Resolve details from DB to avoid client-side manipulation
    let subtotal = 0;
    const resolvedItems = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${item.product}`, 404));
      }

      // Check stock
      if (product.quantityInStock < item.quantity) {
        return next(new ErrorResponse(`Product ${product.name} has insufficient stock`, 400));
      }

      const price = product.discountPrice > 0 ? product.discountPrice : product.price;
      subtotal += price * item.quantity;

      resolvedItems.push({
        product: product._id,
        name: product.name,
        image: product.images && product.images.length > 0 ? product.images[0] : '',
        quantity: item.quantity,
        price: price,
      });
    }

    // Apply Coupon
    let discountAmount = 0;
    let couponId = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && !coupon.isExpired()) {
        discountAmount = subtotal * (coupon.discountPercentage / 100);
        couponId = coupon._id;
      }
    }

    const taxPrice = (subtotal - discountAmount) * 0.15; // 15% tax
    const shippingPrice = subtotal - discountAmount > 100 ? 0 : 15; // Free shipping over $100
    const totalPrice = subtotal - discountAmount + taxPrice + shippingPrice;

    // Create Order
    const order = await Order.create({
      user: req.user.id,
      orderItems: resolvedItems,
      shippingAddress,
      billingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : (paymentStatus || 'paid'),
      paymentIntentId,
      taxPrice,
      shippingPrice,
      totalPrice,
      couponApplied: couponId,
      discountAmount,
      orderStatus: 'pending',
    });

    // Subtract quantities from stock
    for (const item of resolvedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantityInStock: -item.quantity },
      });
      
      // Stock warning check
      const updatedProduct = await Product.findById(item.product);
      if (updatedProduct.quantityInStock < 5) {
        // Find Admins to notify
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
          await Notification.create({
            user: admin._id,
            title: 'Low Stock Alert',
            message: `Product "${updatedProduct.name}" is running low on stock. Only ${updatedProduct.quantityInStock} units left.`,
            type: 'inventory',
          });
        }
      }
    }

    // Clear user cart
    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });

    // Create order notification for customer
    await Notification.create({
      user: req.user.id,
      title: 'Order Placed Successfully',
      message: `Your order #${order._id.toString().toUpperCase().slice(-6)} has been received and is pending processing.`,
      type: 'order',
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/v1/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get order details
// @route   GET /api/v1/orders/:id
// @access  Private
exports.getOrderDetails = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('couponApplied', 'code discountPercentage');

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, 404));
    }

    // Ensure order belongs to user or user is admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to view this order', 401));
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel order
// @route   PUT /api/v1/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, 404));
    }

    // Check ownership
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to cancel this order', 401));
    }

    // Can only cancel if pending or processing
    if (order.orderStatus !== 'pending' && order.orderStatus !== 'processing') {
      return next(new ErrorResponse('Order cannot be cancelled. It has already been shipped or completed.', 400));
    }

    order.orderStatus = 'cancelled';
    order.paymentStatus = 'refunded'; // simple refund simulation
    await order.save();

    // Restore stock levels
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantityInStock: item.quantity },
      });
    }

    // Notify user
    await Notification.create({
      user: order.user,
      title: 'Order Cancelled',
      message: `Your order #${order._id.toString().toUpperCase().slice(-6)} has been cancelled successfully.`,
      type: 'order',
    });

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Request product return
// @route   PUT /api/v1/orders/:id/return
// @access  Private
exports.returnRequest = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, 404));
    }

    if (order.user.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to return this order', 401));
    }

    if (order.orderStatus !== 'delivered') {
      return next(new ErrorResponse('Only delivered orders can be returned', 400));
    }

    order.orderStatus = 'returned';
    await order.save();

    // Restock returned items
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantityInStock: item.quantity },
      });
    }

    await Notification.create({
      user: req.user.id,
      title: 'Return Request Processed',
      message: `Return request for order #${order._id.toString().toUpperCase().slice(-6)} was completed. Items restocked.`,
      type: 'order',
    });

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Download invoice PDF
// @route   GET /api/v1/orders/:id/invoice
// @access  Private
exports.downloadInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ErrorResponse(`Order not found`, 404));
    }

    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to access this invoice', 401));
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice_${order._id.toString().slice(-6)}.pdf`
    );

    generateInvoicePdf(order, res);
  } catch (err) {
    next(err);
  }
};

// --- ADMIN ORDER MANAGEMENT ---

// @desc    Get all orders
// @route   GET /api/v1/orders
// @access  Private/Admin
exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update order status
// @route   PUT /api/v1/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, trackingNumber } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, 404));
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
      
      // If order is delivered, set payment status to paid (handles COD transitions)
      if (orderStatus === 'delivered') {
        order.paymentStatus = 'paid';
      }
    }

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    await order.save();

    // Send status update notification to customer
    await Notification.create({
      user: order.user,
      title: `Order Status Updated`,
      message: `Your order #${order._id.toString().toUpperCase().slice(-6)} is now: ${orderStatus.toUpperCase()}.`,
      type: 'order',
    });

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN ANALYTICS ---

// @desc    Get Admin Panel Dashboard statistics
// @route   GET /api/v1/orders/admin/stats
// @access  Private/Admin
exports.getAdminStatistics = async (req, res, next) => {
  try {
    // 1. Revenue
    const completedOrders = await Order.find({
      paymentStatus: 'paid',
      orderStatus: { $ne: 'cancelled' },
    });
    const totalRevenue = completedOrders.reduce((acc, o) => acc + o.totalPrice, 0);

    // 2. Order counts
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    const processingOrders = await Order.countDocuments({ orderStatus: 'processing' });
    const shippedOrders = await Order.countDocuments({ orderStatus: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ orderStatus: 'cancelled' });

    // 3. User stats
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // 4. Inventory stats
    const totalProductsCount = await Product.countDocuments();
    const lowStockProducts = await Product.find({ quantityInStock: { $lt: 5 } })
      .populate('category', 'name')
      .populate('brand', 'name');

    // 5. Best Selling (Group orders and count product items)
    // We can simulate simple best selling calculations using order parsing
    const productSalesCountMap = {};
    const ordersList = await Order.find({ orderStatus: { $ne: 'cancelled' } });
    ordersList.forEach((order) => {
      order.orderItems.forEach((item) => {
        const prodId = item.product.toString();
        productSalesCountMap[prodId] = (productSalesCountMap[prodId] || 0) + item.quantity;
      });
    });

    const sortedSales = Object.entries(productSalesCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const bestSellers = [];
    for (const [prodId, qtySold] of sortedSales) {
      const product = await Product.findById(prodId).select('name price images');
      if (product) {
        bestSellers.push({
          product,
          qtySold,
          totalSalesValue: qtySold * product.price,
        });
      }
    }

    // 6. Category Revenue distribution
    const categoryRevenueMap = {};
    for (const order of ordersList) {
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product).populate('category', 'name');
        if (product && product.category) {
          const catName = product.category.name;
          categoryRevenueMap[catName] = (categoryRevenueMap[catName] || 0) + (item.price * item.quantity);
        }
      }
    }
    const categoryRevenue = Object.entries(categoryRevenueMap).map(([name, value]) => ({
      name,
      value,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProductsCount,
        orderStats: {
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
        lowStock: lowStockProducts,
        bestSellers,
        categoryRevenue,
      },
    });
  } catch (err) {
    next(err);
  }
};
