import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.warn('⚠️ MONGO_URI is not defined in environment variables. Database connection skipped.');
      return;
    }
    
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`MongoDB Connected to database: ${mongoose.connection.name}`);
  } catch (error: any) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Do not exit the process to allow the server to start
  }
};

export default connectDB;
