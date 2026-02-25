const mongoose = require('mongoose');

/**
 * Connect to MongoDB (supports Railway MONGO_URL & standard MONGO_URI).
 * Retries up to 5 times with exponential back-off.
 */
const connectDB = async () => {
  const MAX_RETRIES = 5;
  const uri = process.env.MONGO_URI || process.env.MONGO_URL;

  if (!uri) {
    console.error('🛑 No MONGO_URI or MONGO_URL set. Exiting.');
    process.exit(1);
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const conn = await mongoose.connect(uri, {
        // Mongoose 8 uses the new URL parser & unified topology by default
      });

      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.error(
        `❌ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed:`,
        err.message
      );

      if (attempt === MAX_RETRIES) {
        console.error('🛑 All MongoDB connection attempts exhausted. Exiting.');
        process.exit(1);
      }

      // Exponential back-off: 1s, 2s, 4s, 8s, 16s
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`⏳ Retrying in ${delay / 1000}s…`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

module.exports = connectDB;
