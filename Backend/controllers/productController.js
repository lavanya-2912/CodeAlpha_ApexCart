const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const { ErrorResponse } = require('../middlewares/errorMiddleware');
const { uploadToCloudinaryOrLocal } = require('../middlewares/uploadMiddleware');

// @desc    Get all products with advanced filtering, sorting, searching, and pagination
// @route   GET /api/v1/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    let query;
    const reqQuery = { ...req.query };

    // Fields to exclude from direct filtering matching
    const removeFields = ['select', 'sort', 'page', 'limit', 'search', 'category', 'brand', 'priceMin', 'priceMax', 'ratingMin', 'availability'];
    removeFields.forEach((param) => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);
    let queryJson = JSON.parse(queryStr);

    // Text Search
    if (req.query.search) {
      queryJson.$text = { $search: req.query.search };
    }

    // Dynamic Category Filtering (by Category ID or Slug list)
    if (req.query.category) {
      const categoryIds = req.query.category.split(',');
      queryJson.category = { $in: categoryIds };
    }

    // Dynamic Brand Filtering
    if (req.query.brand) {
      const brandIds = req.query.brand.split(',');
      queryJson.brand = { $in: brandIds };
    }

    // Price Filtering
    if (req.query.priceMin || req.query.priceMax) {
      queryJson.price = {};
      if (req.query.priceMin) {
        queryJson.price.$gte = Number(req.query.priceMin);
      }
      if (req.query.priceMax) {
        queryJson.price.$lte = Number(req.query.priceMax);
      }
    }

    // Rating Filtering
    if (req.query.ratingMin) {
      queryJson.ratingsAverage = { $gte: Number(req.query.ratingMin) };
    }

    // Availability Filtering (In Stock)
    if (req.query.availability === 'in-stock') {
      queryJson.quantityInStock = { $gt: 0 };
    } else if (req.query.availability === 'out-of-stock') {
      queryJson.quantityInStock = 0;
    }

    // Initialize query
    query = Product.find(queryJson);

    // Populate Category and Brand
    query = query.populate('category', 'name slug').populate('brand', 'name slug');

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortByMap = {
        'price-asc': 'price',
        'price-desc': '-price',
        'newest': '-createdAt',
        'rating': '-ratingsAverage',
        'popularity': '-ratingsQuantity',
      };
      const sortBy = sortByMap[req.query.sort] || '-createdAt';
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 9;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Product.countDocuments(queryJson);

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const products = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pagination,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('brand', 'name slug');

    if (!product) {
      return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Landing Aggregated Lists (Featured, Trending, Latest)
// @route   GET /api/v1/products/landing/lists
// @access  Public
exports.getLandingLists = async (req, res, next) => {
  try {
    const featured = await Product.find({ isFeatured: true })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .limit(8);

    const trending = await Product.find({ isTrending: true })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .limit(8);

    const latest = await Product.find()
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .sort('-createdAt')
      .limit(8);

    res.status(200).json({
      success: true,
      data: {
        featured,
        trending,
        latest,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get related products (same category)
// @route   GET /api/v1/products/:id/related
// @access  Public
exports.getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
    })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .limit(4);

    res.status(200).json({
      success: true,
      data: related,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    let images = [];
    
    // Process files if uploaded
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinaryOrLocal(file);
        if (url) images.push(url);
      }
    } else if (req.body.images) {
      // Allow passing string urls directly (e.g. for seeder or remote URL addition)
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    const productData = { ...req.body };
    productData.images = images;
    
    // Parse specifications map if it comes as a stringified object from form-data
    if (typeof productData.specifications === 'string') {
      try {
        productData.specifications = JSON.parse(productData.specifications);
      } catch (e) {
        productData.specifications = {};
      }
    }

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    let images = [...(product.images || [])];
    
    // If files are uploaded, append or replace. We will replace if body.replaceImages is true, otherwise append.
    if (req.files && req.files.length > 0) {
      if (req.body.replaceImages === 'true') {
        images = [];
      }
      for (const file of req.files) {
        const url = await uploadToCloudinaryOrLocal(file);
        if (url) images.push(url);
      }
    }

    const productData = { ...req.body };
    productData.images = images;

    if (typeof productData.specifications === 'string') {
      try {
        productData.specifications = JSON.parse(productData.specifications);
      } catch (e) {
        // keep old specs if parsing fail
      }
    }

    product = await Product.findByIdAndUpdate(req.params.id, productData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }
    
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
