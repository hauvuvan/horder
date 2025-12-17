import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/api.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
// Fallback is dangerous for public repos. Rely ONLY on Environment Variables.
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.set('trust proxy', 1); // Trust Vercel proxy
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
// Apply limiter only to API routes if desired, or globally
app.use('/api', limiter);

// Database Connection Helper
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    if (!MONGODB_URI) {
        console.error('FATAL ERROR: MONGODB_URI environment variable is missing!');
        throw new Error('MONGODB_URI is missing');
    }
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        throw err;
    }
};

// Middleware to ensure DB is connected before handling requests
app.use(async (req, res, next) => {
    // Skip DB connection for health checks if possible, but for simplicity/safety we connect
    if (req.path === '/api/health') return next();

    try {
        await connectDB();
        next();
    } catch (error) {
        res.status(500).json({ message: 'Database Connection Failed' });
    }
});

// Routes
// Mount at /api for standard behavior
app.use('/api', apiRoutes);
// Mount at / as a fallback if Vercel strips the prefix
app.use('/', apiRoutes);

// 404 Handler (Must be after routes)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.path
    });
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Only listen if not importing as a module (e.g. Vercel imports it)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;
