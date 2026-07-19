const express = require('express');
const {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
} = require('../controllers/brandController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getBrands);
router.get('/:id', getBrand);

// Admin routes
router.post('/', protect, authorize('admin'), createBrand);
router.put('/:id', protect, authorize('admin'), updateBrand);
router.delete('/:id', protect, authorize('admin'), deleteBrand);

module.exports = router;
