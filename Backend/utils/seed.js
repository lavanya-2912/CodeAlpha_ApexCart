const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Coupon = require('../models/Coupon');

const seedData = async () => {
  try {
    // Connect to database
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/apexcart');
    console.log(`Database connected for seeding: ${conn.connection.host}`);

    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await Brand.deleteMany();
    await Coupon.deleteMany();
    console.log('Existing database records purged.');

    // Seed Admin User
    await User.create({
      name: 'ApexCart Admin',
      email: 'admin@apexcart.com',
      password: 'adminpassword',
      role: 'admin',
      isVerified: true,
      profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
    });
    
    // Seed Customer User
    await User.create({
      name: 'John Doe',
      email: 'john@gmail.com',
      password: 'password123',
      role: 'customer',
      isVerified: true,
      profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    });

    console.log('Default users seeded successfully.');

    // Seed Categories
    const categoriesData = [
      { name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=500&q=80' },
      { name: 'Fashion', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=80' },
      { name: 'Home', image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=500&q=80' },
      { name: 'Books', image: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=500&q=80' },
      { name: 'Sports', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=500&q=80' },
      { name: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=500&q=80' },
      { name: 'Accessories', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80' }
    ];
    
    const categories = [];
    for (const cat of categoriesData) {
      const c = await Category.create(cat);
      categories.push(c);
    }
    console.log('Categories seeded.');

    // Seed Brands
    const brandsData = [
      { name: 'Apple', logo: '' },
      { name: 'Samsung', logo: '' },
      { name: 'Sony', logo: '' },
      { name: 'Nike', logo: '' },
      { name: 'Adidas', logo: '' },
      { name: 'Ikea', logo: '' },
      { name: 'Penguin Books', logo: '' },
      { name: 'Levi\'s', logo: '' },
      { name: 'Zara', logo: '' },
      { name: 'Dyson', logo: '' },
      { name: 'Philips', logo: '' },
      { name: 'Nespresso', logo: '' },
      { name: 'Wilson', logo: '' },
      { name: 'Garmin', logo: '' },
      { name: 'CeraVe', logo: '' },
      { name: 'Ray-Ban', logo: '' },
      { name: 'Fossil', logo: '' }
    ];
    
    const brands = [];
    for (const brand of brandsData) {
      const b = await Brand.create(brand);
      brands.push(b);
    }
    console.log('Brands seeded.');

    // Helper map
    const catMap = {};
    categories.forEach(c => catMap[c.name] = c._id);
    const brandMap = {};
    brands.forEach(b => brandMap[b.name] = b._id);

    // Seed Products
    const productsData = [
      // --- ELECTRONICS ---
      {
        name: 'iPhone 15 Pro Max',
        description: 'Experience the titanium design, groundbreaking A17 Pro chip, and the most powerful iPhone camera system ever.',
        price: 1199,
        discountPrice: 1099,
        category: catMap['Electronics'],
        brand: brandMap['Apple'],
        quantityInStock: 25,
        images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Storage': '256GB', 'Color': 'Natural Titanium', 'Display': '6.7-inch Super Retina XDR' },
        isFeatured: true,
        isTrending: true
      },
      {
        name: 'Sony WH-1000XM5 Headphones',
        description: 'Industry-leading noise cancelling wireless over-ear headphones with auto noise-cancelling optimizer and crystal clear hands-free calling.',
        price: 399,
        discountPrice: 349,
        category: catMap['Electronics'],
        brand: brandMap['Sony'],
        quantityInStock: 15,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Battery Life': 'Up to 30 Hours', 'Bluetooth Version': '5.2', 'Weight': '250g' },
        isFeatured: true,
        isTrending: false
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Welcome to the era of mobile AI. With Galaxy S24 Ultra in your hands, you can unleash whole new levels of creativity, productivity and possibility.',
        price: 1299,
        discountPrice: 1199,
        category: catMap['Electronics'],
        brand: brandMap['Samsung'],
        quantityInStock: 20,
        images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Storage': '512GB', 'Color': 'Titanium Gray', 'Camera': '200MP Main Lens' },
        isFeatured: false,
        isTrending: true
      },
      {
        name: 'MacBook Air M3 13-inch',
        description: 'The superportable MacBook Air laptop lets you work and play anywhere, and the M3 chip brings even greater capabilities and AI power.',
        price: 1099,
        discountPrice: 0,
        category: catMap['Electronics'],
        brand: brandMap['Apple'],
        quantityInStock: 12,
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Processor': 'Apple M3', 'RAM': '8GB', 'SSD': '256GB' },
        isFeatured: true,
        isTrending: false
      },

      // --- FASHION ---
      {
        name: 'Nike Air Max 270',
        description: 'Boasting the first-ever Max Air unit created specifically for Nike Sportswear, the Nike Air Max 270 delivers visible air under every step.',
        price: 160,
        discountPrice: 140,
        category: catMap['Fashion'],
        brand: brandMap['Nike'],
        quantityInStock: 50,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Size': '10 US', 'Color': 'Red/Black', 'Material': 'Mesh/Synthetic' },
        isFeatured: false,
        isTrending: true
      },
      {
        name: 'Adidas Ultraboost Light',
        description: 'Ultraboost Light, our lightest Ultraboost ever. Feel epic energy in every stride with the next-generation adidas Light BOOST.',
        price: 190,
        discountPrice: 170,
        category: catMap['Fashion'],
        brand: brandMap['Adidas'],
        quantityInStock: 35,
        images: ['https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Size': '9.5 US', 'Color': 'Core Black', 'Weight': '262g' },
        isFeatured: true,
        isTrending: true
      },
      {
        name: 'Levi\'s 501 Original Jeans',
        description: 'The original blue jean since 1873. A straight fit with the signature button fly, crafted from 100% premium cotton denim.',
        price: 69,
        discountPrice: 59,
        category: catMap['Fashion'],
        brand: brandMap['Levi\'s'],
        quantityInStock: 40,
        images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Waist': '32"', 'Length': '32"', 'Style': 'Straight Leg' },
        isFeatured: false,
        isTrending: false
      },
      {
        name: 'Zara Double-Breasted Blazer',
        description: 'Classic double-breasted tailoring featuring a peaked lapel collar, long sleeves, front flap pockets, and button-up front closures.',
        price: 89,
        discountPrice: 79,
        category: catMap['Fashion'],
        brand: brandMap['Zara'],
        quantityInStock: 15,
        images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Size': 'M', 'Color': 'Navy Blue', 'Fit': 'Structured' },
        isFeatured: false,
        isTrending: false
      },

      // --- HOME ---
      {
        name: 'Ikea Lack Coffee Table',
        description: 'Easy to assemble, light to move. The LACK series keeps your budget happy while delivering a clean Scandinavian aesthetic.',
        price: 49,
        discountPrice: 0,
        category: catMap['Home'],
        brand: brandMap['Ikea'],
        quantityInStock: 100,
        images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Dimensions': '35.5 x 21.5 "', 'Color': 'Black-brown', 'Max Load': '55 lbs' },
        isFeatured: false,
        isTrending: false
      },
      {
        name: 'Dyson V8 Cordless Vacuum',
        description: 'Engineered for homes with pets. Captures dust and allergens, expels cleaner air. Up to 40 minutes of fade-free suction power.',
        price: 399,
        discountPrice: 349,
        category: catMap['Home'],
        brand: brandMap['Dyson'],
        quantityInStock: 10,
        images: ['https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Weight': '5.7 lbs', 'Bin Volume': '0.14 gal', 'Run Time': '40 mins' },
        isFeatured: true,
        isTrending: false
      },
      {
        name: 'Philips Hue Smart Light Bulb',
        description: 'Add color to any room with a single smart LED bulb. Offers 16 million colors and shades of white light to create any mood.',
        price: 49,
        discountPrice: 39,
        category: catMap['Home'],
        brand: brandMap['Philips'],
        quantityInStock: 60,
        images: ['https://images.unsplash.com/photo-1550537687-c91072c4792d?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Wattage': '9.5W', 'Fitting': 'E26', 'Protocol': 'Zigbee/Bluetooth' },
        isFeatured: false,
        isTrending: false
      },
      {
        name: 'Nespresso Vertuo Coffee Maker',
        description: 'Brew double espresso shots or standard large mugs with smooth crema. Utilizes barcode technology to brew perfect cups every time.',
        price: 199,
        discountPrice: 179,
        category: catMap['Home'],
        brand: brandMap['Nespresso'],
        quantityInStock: 18,
        images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Water Tank': '40 oz', 'Heatup': '15 seconds', 'Color': 'Matte Black' },
        isFeatured: false,
        isTrending: true
      },

      // --- BOOKS ---
      {
        name: 'The Great Gatsby',
        description: 'F. Scott Fitzgerald’s classic novel exploring themes of wealth, love, and the American Dream in the Roaring Twenties.',
        price: 15,
        discountPrice: 12,
        category: catMap['Books'],
        brand: brandMap['Penguin Books'],
        quantityInStock: 150,
        images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Format': 'Paperback', 'Pages': '180', 'Publisher': 'Penguin Classics' },
        isFeatured: false,
        isTrending: false
      },
      {
        name: 'Atomic Habits by James Clear',
        description: 'No matter your goals, Atomic Habits offers a proven framework for improving every day. Learn how to build good habits and break bad ones.',
        price: 20,
        discountPrice: 16,
        category: catMap['Books'],
        brand: brandMap['Penguin Books'],
        quantityInStock: 80,
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Format': 'Hardcover', 'Pages': '320', 'Language': 'English' },
        isFeatured: true,
        isTrending: true
      },
      {
        name: 'Clean Code: A Handbook',
        description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees. Learn to write clean code.',
        price: 45,
        discountPrice: 39,
        category: catMap['Books'],
        brand: brandMap['Penguin Books'],
        quantityInStock: 30,
        images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Author': 'Robert C. Martin', 'Pages': '464', 'Topic': 'Software Development' },
        isFeatured: true,
        isTrending: false
      },

      // --- SPORTS ---
      {
        name: 'Wilson Evolution Basketball',
        description: 'The #1 indoor game basketball in America. Features a microfiber composite cover and laid-in channels for ultimate control.',
        price: 60,
        discountPrice: 0,
        category: catMap['Sports'],
        brand: brandMap['Wilson'],
        quantityInStock: 45,
        images: ['https://images.unsplash.com/photo-1519766304817-4f37bda74a27?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Size': 'Official 29.5"', 'Material': 'Microfiber Leather', 'Surface': 'Indoor Only' },
        isFeatured: false,
        isTrending: false
      },
      {
        name: 'Adidas FIFA Soccer Ball',
        description: 'Experience precision with the official replica soccer ball, built with machine-stitched casing for long-lasting durability.',
        price: 25,
        discountPrice: 20,
        category: catMap['Sports'],
        brand: brandMap['Adidas'],
        quantityInStock: 75,
        images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Size': '5', 'Construction': 'Machine Stitched', 'Bladder': 'Butyl' },
        isFeatured: false,
        isTrending: false
      },
      {
        name: 'Garmin Forerunner 265',
        description: 'Plan your training strategy with daily suggested workouts, training readiness insights, and multi-band GPS tracking on an AMOLED screen.',
        price: 449,
        discountPrice: 429,
        category: catMap['Sports'],
        brand: brandMap['Garmin'],
        quantityInStock: 8,
        images: ['https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Display': 'AMOLED Touchscreen', 'Battery': 'Up to 13 Days', 'GPS': 'Multi-Band GNSS' },
        isFeatured: true,
        isTrending: true
      },

      // --- BEAUTY ---
      {
        name: 'CeraVe Hydrating Cleanser',
        description: 'A gentle, non-foaming facial wash that cleanses makeup, dirt, and excess oil without stripping the skin of natural moisture.',
        price: 16,
        discountPrice: 14,
        category: catMap['Beauty'],
        brand: brandMap['CeraVe'],
        quantityInStock: 120,
        images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Volume': '16 fl oz', 'Skin Type': 'Normal to Dry', 'Key Actives': 'Ceramides, Hyaluronic Acid' },
        isFeatured: false,
        isTrending: false
      },
      {
        name: 'Chanel No. 5 Parfum',
        description: 'The very essence of femininity. A powdery floral bouquet, sublimated by aldehydes, presented in an iconic minimalist bottle.',
        price: 135,
        discountPrice: 0,
        category: catMap['Beauty'],
        brand: brandMap['Sony'], // Sony acts as placeholder for Chanel
        quantityInStock: 15,
        images: ['https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Volume': '3.4 oz', 'Concentration': 'Eau de Parfum', 'Fragrance Notes': 'May Rose, Jasmine, Citrus' },
        isFeatured: true,
        isTrending: true
      },

      // --- ACCESSORIES ---
      {
        name: 'Samsung Galaxy Watch 6',
        description: 'Track your workouts, sleep, and heart health on a larger, sleeker watch face with advanced body composition analysis.',
        price: 299,
        discountPrice: 249,
        category: catMap['Accessories'],
        brand: brandMap['Samsung'],
        quantityInStock: 20,
        images: ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Screen Size': '44mm', 'OS': 'Wear OS 4', 'Connectivity': 'Bluetooth/LTE' },
        isFeatured: false,
        isTrending: true
      },
      {
        name: 'Ray-Ban Classic Wayfarer',
        description: 'The most recognizable style in the history of sunglasses. Distinctive shape is combined with the traditional signature logo.',
        price: 160,
        discountPrice: 139,
        category: catMap['Accessories'],
        brand: brandMap['Ray-Ban'],
        quantityInStock: 22,
        images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Frame Material': 'Acetate', 'Lens Treatment': 'Classic Green G-15', 'UV Guard': '100% UVA/UVB' },
        isFeatured: true,
        isTrending: false
      },
      {
        name: 'Fossil Minimalist Leather Watch',
        description: 'A clean, slim watch face with a simple three-hand analog display, set on a top-grain brown leather interchangeable strap.',
        price: 120,
        discountPrice: 99,
        category: catMap['Accessories'],
        brand: brandMap['Fossil'],
        quantityInStock: 14,
        images: ['https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80'],
        specifications: { 'Case Size': '44mm', 'Strap Width': '22mm', 'Water Guard': '5 ATM' },
        isFeatured: false,
        isTrending: true
      }
    ];

    for (const prod of productsData) {
      await Product.create(prod);
    }
    console.log('Products seeded.');

    // Seed Coupons
    const couponsData = [
      { code: 'SAVE10', discountPercentage: 10, expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), isActive: true },
      { code: 'WELCOME50', discountPercentage: 50, expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), isActive: true },
      { code: 'EXPIRED20', discountPercentage: 20, expiryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), isActive: true }
    ];
    for (const cp of couponsData) {
      await Coupon.create(cp);
    }
    console.log('Coupons seeded.');

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding Failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
