import { Server } from 'socket.io';
import { registerSocketControllers } from '../controllers/socketController.js';
import { corsOriginDelegate } from './originConfig.js';

/**
 * Initialize Socket.IO server with configuration
 * @param {Server} httpServer - HTTP server instance
 */
export const initializeSocketIO = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: corsOriginDelegate,
            methods: ['GET', 'POST'],
            credentials: true
        },
        maxHttpBufferSize: 256 * 1024,
        transports: ['websocket', 'polling'],
        pingInterval: 25000,
        pingTimeout: 20000
    });

    // Register all socket event handlers
    registerSocketControllers(io);

    console.log('✅ Socket.IO initialized');
    return io;
};
