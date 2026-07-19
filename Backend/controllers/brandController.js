const Brand = require('../models/Brand');
const { ErrorResponse } = require('../middlewares/errorMiddleware');

// @desc    Get all brands
// @route   GET /api/v1/brands
// @access  Public
exports.getBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find().sort('name');
    res.status(200).json({
      success: true,
      count: brands.length,
      data: brands,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single brand
// @route   GET /api/v1/brands/:id
// @access  Public
exports.getBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return next(new ErrorResponse(`Brand not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new brand
// @route   POST /api/v1/brands
// @access  Private/Admin
exports.createBrand = async (req, res, next) => {
  try {
    const brand = await Brand.create(req.body);
    res.status(201).json({
      success: true,
      data: brand,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update brand
// @route   PUT /api/v1/brands/:id
// @access  Private/Admin
exports.updateBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!brand) {
      return next(new ErrorResponse(`Brand not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete brand
// @route   DELETE /api/v1/brands/:id
// @access  Private/Admin
exports.deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) {
      return next(new ErrorResponse(`Brand not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
