import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
// Route imports (placeholder endpoints will be wired)
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import careerRoutes from './routes/career.routes.js';
import interviewRoutes from './routes/interview.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import recruiterRoutes from './routes/recruiter.routes.js';
import universityRoutes from './routes/university.routes.js';
import adminRoutes from './routes/admin.routes.js';
import liveInterviewRoutes from './routes/liveInterview.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
const app = express();
// Security Middlewares
app.use(helmet());
const allowedOrigins = [
    "http://localhost:5173",
    process.env.CLIENT_URL,
    "https://intervexa-ai-project.vercel.app",
    "https://intervexa-ai-project-jmeqbujr0-prabhat8910s-projects.vercel.app"
].filter(Boolean);
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests without origin (Postman, server-to-server)
        if (!origin) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("CORS: Origin not allowed"));
    },
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());
// Rate Limiters
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // Stricter limit for authentication routes
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login or registration attempts. Please try again after 15 minutes.' }
});
app.use('/api/', apiLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);
app.use('/api/v1/auth/reset-password', authLimiter);
// Health check
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Routes configuration
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/resume', resumeRoutes);
app.use('/api/v1/career', careerRoutes);
app.use('/api/v1/interview', interviewRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/recruiter', recruiterRoutes);
app.use('/api/v1/university', universityRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/live-interview', liveInterviewRoutes);
// Global Error Handler Middleware
app.use(errorHandler);
export default app;
