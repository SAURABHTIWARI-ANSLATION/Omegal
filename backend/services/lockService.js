import { randomUUID } from 'crypto';
import { redisKey } from '../config/redisConfig.js';
import { getRedisStateClient } from './redisClient.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class LockService {
    constructor() {
        this.localLocks = new Set();
    }

    key(name) {
        return redisKey('locks', name);
    }

    async acquire(name, ttlMs = 5000) {
        const client = await getRedisStateClient();
        const token = randomUUID();

        if (client) {
            const result = await client.set(this.key(name), token, {
                NX: true,
                PX: ttlMs
            });

            return result === 'OK' ? token : null;
        }

        if (this.localLocks.has(name)) return null;
        this.localLocks.add(name);
        return token;
    }

    async release(name, token) {
        if (!token) return;

        const client = await getRedisStateClient();
        if (client) {
            await client.eval(
                'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end',
                {
                    keys: [this.key(name)],
                    arguments: [token]
                }
            );
            return;
        }

        this.localLocks.delete(name);
    }

    async run(name, ttlMs, fn, { retries = 0, retryDelayMs = 25 } = {}) {
        let token = null;

        for (let attempt = 0; attempt <= retries; attempt += 1) {
            token = await this.acquire(name, ttlMs);
            if (token) break;
            if (attempt < retries) {
                await sleep(retryDelayMs);
            }
        }

        if (!token) return { acquired: false, result: null };

        try {
            return { acquired: true, result: await fn() };
        } finally {
            await this.release(name, token);
        }
    }
}

export default new LockService();
