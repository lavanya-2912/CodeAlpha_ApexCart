const express = require('express');
const {
  createCheckoutSession,
  getPaymentStatus,
} = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect); // Secure checkout actions

router.post('/checkout', createCheckoutSession);
router.get('/status/:sessionId', getPaymentStatus);

module.exports = router;
