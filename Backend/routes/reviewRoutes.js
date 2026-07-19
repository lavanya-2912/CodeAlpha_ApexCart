const express = require('express');
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public route to view reviews
router.get('/product/:productId', getProductReviews);

// Protected routes to submit or modify reviews
router.post('/product/:productId', protect, createReview);
router.route('/:id')
  .put(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router;
