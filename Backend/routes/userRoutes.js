const express = require('express');
const {
  updateProfile,
  uploadProfilePicture,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getUsers,
  deleteUser,
  promoteToAdmin,
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');

const router = express.Router();

// Profile operations
router.put('/profile', protect, updateProfile);
router.post('/profile/picture', protect, upload.single('profilePicture'), uploadProfilePicture);

// Saved Address Book
router.route('/addresses')
  .get(protect, getAddresses)
  .post(protect, addAddress);

router.route('/addresses/:id')
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

// Admin-only operations
router.get('/', protect, authorize('admin'), getUsers);
router.route('/:id')
  .delete(protect, authorize('admin'), deleteUser);
router.put('/:id/promote', protect, authorize('admin'), promoteToAdmin);

module.exports = router;
