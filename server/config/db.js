import mongoose from 'mongoose';

export let isDbConnected = false;

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stockwise';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000,
    });
    isDbConnected = true;
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    isDbConnected = false;
    console.warn(`\n[Database Warning] Could not connect to MongoDB server at: ${mongoURI}`);
    console.warn(`[Database Fallback] Built-in in-memory user repository activated for development/testing.`);
    console.warn(`[Database Tip] To persist data to MongoDB, start your local service ("net start MongoDB" / "mongod") or provide MONGODB_URI in .env\n`);
  }
};
