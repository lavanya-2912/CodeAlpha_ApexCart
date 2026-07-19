const express = require('express');
const {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  toggleSaveForLater,
  syncCart,
} = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect); // Secure all cart routes

router.route('/')
  .get(getCart)
  .post(addToCart);

router.post('/sync', syncCart);

router.route('/items/:itemId')
  .put(updateQuantity)
  .delete(removeFromCart);

router.put('/items/:itemId/save-for-later', toggleSaveForLater);

module.exports = router;
