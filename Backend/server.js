const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception Error: ${err.message}`);
  console.log('Shutting down due to uncaught exception...');
  process.exit(1);
});

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Connect to database
connectDB();

const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    console.log('Server shut down due to unhandled promise rejection.');
    process.exit(1);
  });
});
