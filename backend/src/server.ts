import path from 'path';
import dotenv from 'dotenv';
// Load environment variables before importing other modules
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
console.log(`[Database Init] MONGODB_URI loaded: ${process.env.MONGODB_URI ? 'Defined' : 'UNDEFINED'}`);

import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Initialize DB Connection
    await connectDB();

    // Start Express Web Server
    app.listen(PORT, () => {
      console.log(`[Server] running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error(`[Server] initialization error: ${(error as Error).message}`);
    process.exit(1);
  }
};

startServer();
