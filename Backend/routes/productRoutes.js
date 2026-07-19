const express = require('express');
const {
  getProducts,
  getProduct,
  getLandingLists,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/landing/lists', getLandingLists);
router.get('/:id', getProduct);
router.get('/:id/related', getRelatedProducts);

// Admin-only CRUD routes (supporting multi-image uploads)
router.post('/', protect, authorize('admin'), upload.array('images', 5), createProduct);
router.put('/:id', protect, authorize('admin'), upload.array('images', 5), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
