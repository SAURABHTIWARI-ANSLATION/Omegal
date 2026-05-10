import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { registerSocketControllers } from '../controllers/socketController.js';
import { corsOriginDelegate } from './originConfig.js';
import { createRedisAdapterClients } from '../services/redisClient.js';

/**
 * Initialize Socket.IO server with configuration
 * @param {Server} httpServer - HTTP server instance
 */
export const initializeSocketIO = async (httpServer) => {
    const redisAdapterClients = await createRedisAdapterClients();
    const io = new Server(httpServer, {
        cors: {
            origin: corsOriginDelegate,
            methods: ['GET', 'POST'],
            credentials: true
        },
        adapter: redisAdapterClients
            ? createAdapter(redisAdapterClients.pubClient, redisAdapterClients.subClient, {
                publishOnSpecificResponseChannel: true
            })
            : undefined,
        maxHttpBufferSize: 256 * 1024,
        transports: ['websocket', 'polling'],
        pingInterval: 25000,
        pingTimeout: 20000
    });

    // Register all socket event handlers
    registerSocketControllers(io);

    console.log(`✅ Socket.IO initialized${redisAdapterClients ? ' with Redis adapter' : ''}`);
    return io;
};
