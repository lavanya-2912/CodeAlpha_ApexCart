const User = require('../models/User');
const Address = require('../models/Address');
const { ErrorResponse } = require('../middlewares/errorMiddleware');
const { uploadToCloudinaryOrLocal } = require('../middlewares/uploadMiddleware');

// @desc    Update user profile details
// @route   PUT /api/v1/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload profile picture
// @route   POST /api/v1/users/profile/picture
// @access  Private
exports.uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new ErrorResponse('Please upload a file', 400));
    }

    const imageUrl = await uploadToCloudinaryOrLocal(req.file);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: imageUrl },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all saved addresses
// @route   GET /api/v1/users/addresses
// @access  Private
exports.getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user.id });

    res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add a new address
// @route   POST /api/v1/users/addresses
// @access  Private
exports.addAddress = async (req, res, next) => {
  try {
    req.body.user = req.user.id;

    // If this is set as default, remove default from other addresses
    if (req.body.isDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    } else {
      // If user has no addresses, make this the default
      const addressCount = await Address.countDocuments({ user: req.user.id });
      if (addressCount === 0) {
        req.body.isDefault = true;
      }
    }

    const address = await Address.create(req.body);

    res.status(201).json({
      success: true,
      data: address,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a saved address
// @route   PUT /api/v1/users/addresses/:id
// @access  Private
exports.updateAddress = async (req, res, next) => {
  try {
    let address = await Address.findById(req.params.id);

    if (!address) {
      return next(new ErrorResponse(`Address not found with id of ${req.params.id}`, 404));
    }

    // Ensure address belongs to user
    if (address.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to update this address', 401));
    }

    if (req.body.isDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }

    address = await Address.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: address,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a saved address
// @route   DELETE /api/v1/users/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return next(new ErrorResponse(`Address not found with id of ${req.params.id}`, 404));
    }

    // Ensure address belongs to user
    if (address.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to delete this address', 401));
    }

    const wasDefault = address.isDefault;
    await Address.findByIdAndDelete(req.params.id);

    // If deleted address was default, make another address default if available
    if (wasDefault) {
      const remainingAddress = await Address.findOne({ user: req.user.id });
      if (remainingAddress) {
        remainingAddress.isDefault = true;
        await remainingAddress.save();
      }
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN USER MANAGEMENT ENPOINTS ---

// @desc    View all users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).sort('-createdAt');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Deactivate/delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }
    
    // Prevent deleting oneself
    if (user._id.toString() === req.user.id) {
      return next(new ErrorResponse('You cannot delete your own admin account', 400));
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Promote user to Admin
// @route   PUT /api/v1/users/:id/promote
// @access  Private/Admin
exports.promoteToAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    user.role = 'admin';
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};
