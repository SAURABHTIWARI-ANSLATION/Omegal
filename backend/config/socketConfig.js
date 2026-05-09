import { Server } from 'socket.io';
import { corsConfig } from './corsConfig.js';
import { registerSocketControllers } from '../controllers/socketController.js';

/**
 * Initialize Socket.IO server with configuration
 * @param {Server} httpServer - HTTP server instance
 */
export const initializeSocketIO = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling'],
        pingInterval: 25000,
        pingTimeout: 20000
    });

    // Register all socket event handlers
    registerSocketControllers(io);

    console.log('✅ Socket.IO initialized');
    return io;
};