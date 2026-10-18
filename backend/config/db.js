const mongoose = require("mongoose");

async function connectDB() {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = 'mongodb://127.0.0.1:27017/foodbridge';

  if (primaryUri) {
    try {
      const conn = await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 2500
      });
      console.log(`MongoDB connected (Primary): ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn(`Primary MongoDB unavailable (${err.message}). Trying local MongoDB...`);
    }
  }

  try {
    const conn = await mongoose.connect(fallbackUri, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`MongoDB connected (Local Docker fallback): ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
