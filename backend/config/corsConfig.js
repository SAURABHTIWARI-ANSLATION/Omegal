import cors from 'cors';
import { corsOriginDelegate } from './originConfig.js';

/**
 * CORS configuration middleware
 * Allows requests from specified origins
 */
export const corsConfig = cors({
    origin: corsOriginDelegate,
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 200
});
