import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import configurations and modules
import { initializeSocketIO } from './config/socketConfig.js';
import { corsConfig } from './config/corsConfig.js';
import { createMemoryRateLimiter } from './utils/rateLimiter.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Middleware
app.set('trust proxy', 1);
app.use(helmet({
    crossOriginEmbedderPolicy: false
}));
app.use(corsConfig);
app.use(createMemoryRateLimiter({
    windowMs: 60_000,
    max: Number(process.env.HTTP_RATE_LIMIT_MAX || 120)
}));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Initialize Socket.IO
initializeSocketIO(httpServer);

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Basic route
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to Omegle Chat Backend',
        version: '1.0.0',
        endpoints: {
            health: '/health'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' ? 'Unexpected server error' : err.message
    });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

export default app;
