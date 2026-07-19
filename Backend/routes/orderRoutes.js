const express = require('express');
const {
  createOrder,
  getMyOrders,
  getOrderDetails,
  cancelOrder,
  returnRequest,
  downloadInvoice,
  getOrders,
  updateOrderStatus,
  getAdminStatistics,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Customer specific order endpoints
router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderDetails);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/return', protect, returnRequest);
router.get('/:id/invoice', protect, downloadInvoice);

// Admin-only order management endpoints
router.get('/', protect, authorize('admin'), getOrders);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);
router.get('/admin/stats', protect, authorize('admin'), getAdminStatistics);

module.exports = router;
