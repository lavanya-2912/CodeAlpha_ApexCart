const express = require('express');
const {
  validateCoupon,
  getCoupons,
  createCoupon,
  deleteCoupon,
} = require('../controllers/couponController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/validate', protect, validateCoupon);

// Admin-only CRUD operations
router.route('/')
  .get(protect, authorize('admin'), getCoupons)
  .post(protect, authorize('admin'), createCoupon);

router.delete('/:id', protect, authorize('admin'), deleteCoupon);

module.exports = router;
