const stripe = require('stripe');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { ErrorResponse } = require('../middlewares/errorMiddleware');

const isStripeConfigured = !!process.env.STRIPE_SECRET_KEY;
let stripeInstance = null;
if (isStripeConfigured) {
  stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
}

// @desc    Create Stripe checkout session
// @route   POST /api/v1/payments/checkout
// @access  Private
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { items, couponCode, shippingAddress, billingAddress } = req.body;

    if (!items || items.length === 0) {
      return next(new ErrorResponse('No items in checkout payload', 400));
    }

    // Resolve prices from DB to avoid client-side tampering
    const lineItems = [];
    let subtotal = 0;
    
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${item.product}`, 404));
      }
      
      const price = product.discountPrice > 0 ? product.discountPrice : product.price;
      subtotal += price * item.quantity;

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            images: product.images && product.images.length > 0 ? [product.images[0]] : [],
          },
          unit_amount: Math.round(price * 100), // Stripe expects cents
        },
        quantity: item.quantity,
      });
    }

    // Check discount
    let discountPercent = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && !coupon.isExpired()) {
        discountPercent = coupon.discountPercentage;
      }
    }

    const discountAmount = subtotal * (discountPercent / 100);
    const taxPrice = (subtotal - discountAmount) * 0.15; // 15% tax
    const shippingPrice = subtotal - discountAmount > 100 ? 0 : 15; // Free shipping over $100
    const finalTotal = subtotal - discountAmount + taxPrice + shippingPrice;

    // Check configuration
    if (isStripeConfigured) {
      // Assemble Stripe discounts if applicable
      const sessionParams = {
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/#/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/#/cart`,
        metadata: {
          userId: req.user.id,
          shippingAddress: JSON.stringify(shippingAddress),
          billingAddress: JSON.stringify(billingAddress),
          couponCode: couponCode || '',
          discountAmount: discountAmount.toString(),
          taxPrice: taxPrice.toString(),
          shippingPrice: shippingPrice.toString(),
          totalPrice: finalTotal.toString(),
        },
      };

      const session = await stripeInstance.checkout.sessions.create(sessionParams);

      res.status(200).json({
        success: true,
        sessionId: session.id,
        url: session.url,
      });
    } else {
      // Mock stripe checkout URL redirection
      const mockSessionId = 'mock_stripe_session_' + Date.now();
      const mockCheckoutUrl = `${req.protocol}://${req.get('host')}/#/mock-stripe-checkout?session_id=${mockSessionId}&total=${finalTotal.toFixed(2)}`;

      // Save checkout context temporarily or let the frontend post-checkout completion call handle order creation
      res.status(200).json({
        success: true,
        sessionId: mockSessionId,
        url: mockCheckoutUrl,
        isMock: true,
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Retrieve payment status
// @route   GET /api/v1/payments/status/:sessionId
// @access  Private
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (sessionId.startsWith('mock_stripe_session_')) {
      return res.status(200).json({
        success: true,
        status: 'paid',
        paymentMethod: 'stripe',
      });
    }

    if (!isStripeConfigured) {
      return next(new ErrorResponse('Stripe is not configured', 400));
    }

    const session = await stripeInstance.checkout.sessions.retrieve(sessionId);
    res.status(200).json({
      success: true,
      status: session.payment_status,
      paymentMethod: 'stripe',
      metadata: session.metadata,
      paymentIntent: session.payment_intent,
    });
  } catch (err) {
    next(err);
  }
};
