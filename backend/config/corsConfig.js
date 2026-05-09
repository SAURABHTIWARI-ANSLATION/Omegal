import cors from 'cors';

/**
 * CORS configuration middleware
 * Allows requests from specified origins
 */
export const corsConfig = cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    optionsSuccessStatus: 200
});