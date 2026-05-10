import { createClient } from 'redis';
import { redisConfig, isRedisAdapterEnabled, isRedisStateEnabled } from '../config/redisConfig.js';

let stateClientPromise = null;
const trackedClients = new Set();

const createNamedClient = (name) => {
    const client = createClient({
        url: redisConfig.url,
        socket: {
            connectTimeout: redisConfig.connectTimeoutMs,
            reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
        }
    });

    client.on('error', (error) => {
        console.error(`Redis ${name} error:`, error.message);
    });

    client.on('ready', () => {
        console.log(`✅ Redis ${name} connected`);
    });

    client.on('end', () => {
        console.log(`Redis ${name} connection closed`);
    });

    trackedClients.add(client);
    return client;
};

const connectClient = async (client) => {
    if (!client.isOpen) {
        await client.connect();
    }
    return client;
};

export const getRedisStateClient = async () => {
    if (!isRedisStateEnabled()) return null;

    if (!stateClientPromise) {
        const client = createNamedClient('state');
        stateClientPromise = connectClient(client).catch((error) => {
            stateClientPromise = null;
            throw error;
        });
    }

    return stateClientPromise;
};

export const createRedisAdapterClients = async () => {
    if (!isRedisAdapterEnabled()) return null;

    const pubClient = createNamedClient('socket pub');
    const subClient = pubClient.duplicate();

    subClient.on('error', (error) => {
        console.error('Redis socket sub error:', error.message);
    });

    subClient.on('ready', () => {
        console.log('✅ Redis socket sub connected');
    });

    trackedClients.add(subClient);

    await Promise.all([
        connectClient(pubClient),
        connectClient(subClient)
    ]);

    return { pubClient, subClient };
};

export const closeRedisClients = async () => {
    const clients = Array.from(trackedClients);
    trackedClients.clear();
    stateClientPromise = null;

    await Promise.allSettled(clients.map(async (client) => {
        if (client.isOpen) {
            await client.quit();
        }
    }));
};
