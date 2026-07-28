import mongoose from 'mongoose';

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = 'mongodb://localhost:27017/personal_finance_tracker';

  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`MongoDB Connected (Primary): ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Primary Connection Error: ${error.message}`);
    console.log('Attempting connection to local MongoDB fallback...');
    
    try {
      const connFallback = await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 3000
      });
      console.log(`MongoDB Connected (Fallback): ${connFallback.connection.host}`);
    } catch (fallbackError) {
      console.error(`MongoDB Fallback Connection Error: ${fallbackError.message}`);
      console.log('Database connection could not be established. Buffering will occur.');
    }
  }
};

export default connectDB;
