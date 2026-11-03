const mongoose = require('mongoose');
async function connectDB() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required; no automatic fallback database is used');
  return mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
}
module.exports = connectDB;
