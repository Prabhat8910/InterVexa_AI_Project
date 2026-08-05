import './config/env.js';
import app from './app.js';
import { connectDB } from './config/db.js';
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    try {
        // Initialize DB Connection
        await connectDB();
        // Start Express Web Server
        app.listen(PORT, () => {
            console.log(`[Server] running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        });
    }
    catch (error) {
        console.error(`[Server] initialization error: ${error.message}`);
        process.exit(1);
    }
};
startServer();
