import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    console.log(`[Database Connection] Attempting to connect. URI in env is: "${process.env.MONGODB_URI}"`);
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/intervexa-ai';
    const conn = await mongoose.connect(dbUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${(error as Error).message}`);
    process.exit(1);
  }
};
