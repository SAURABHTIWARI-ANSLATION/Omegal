import { randomUUID } from 'crypto';
import { redisKey } from '../config/redisConfig.js';
import { getRedisStateClient } from './redisClient.js';

class QueueService {
    constructor() {
        this.waitingQueue = [];
        this.userStatus = new Map();
        this.queueKey = redisKey('queue', 'waiting');
        this.statusKey = redisKey('queue', 'status');
        this.userKeyPrefix = redisKey('queue', 'user');
    }

    userKey(socketId) {
        return `${this.userKeyPrefix}:${socketId}`;
    }

    async getClient() {
        return getRedisStateClient();
    }

    async getQueuedUser(client, socketId) {
        const raw = await client.get(this.userKey(socketId));
        if (!raw) return null;

        try {
            return JSON.parse(raw);
        } catch {
            await client.del(this.userKey(socketId));
            await client.hDel(this.statusKey, socketId);
            await client.lRem(this.queueKey, 0, socketId);
            return null;
        }
    }

    normalizeUser(socketId, userData = {}, status = 'waiting') {
        return {
            socketId,
            ...userData,
            joinedAt: userData.joinedAt || Date.now(),
            status,
            queueToken: userData.queueToken || randomUUID()
        };
    }

    async pushUser(client, userObject, { front = false } = {}) {
        await client.lRem(this.queueKey, 0, userObject.socketId);
        await client.set(this.userKey(userObject.socketId), JSON.stringify(userObject));
        await client.hSet(this.statusKey, userObject.socketId, userObject.status);

        if (front) {
            await client.lPush(this.queueKey, userObject.socketId);
        } else {
            await client.rPush(this.queueKey, userObject.socketId);
        }

        return userObject;
    }

    async addToQueue(socketId, userData) {
        const client = await this.getClient();
        if (client) {
            const existingStatus = await client.hGet(this.statusKey, socketId);
            if (existingStatus === 'waiting') {
                const existingUser = await this.getQueuedUser(client, socketId);
                if (existingUser) return existingUser;
                await this.removeUser(socketId);
            }

            if (existingStatus) {
                await this.removeUser(socketId);
            }

            const userObject = this.normalizeUser(socketId, userData, 'waiting');
            await this.pushUser(client, userObject);
            console.log(`✅ User ${socketId} added to Redis queue.`);
            return userObject;
        }

        const existingStatus = this.userStatus.get(socketId);
        if (existingStatus === 'waiting') {
            return this.waitingQueue.find(user => user.socketId === socketId) || null;
        }

        if (existingStatus) {
            this.userStatus.delete(socketId);
        }

        const userObject = this.normalizeUser(socketId, userData, 'waiting');
        this.waitingQueue.push(userObject);
        this.userStatus.set(socketId, 'waiting');

        console.log(`✅ User ${socketId} added to queue. Queue size: ${this.waitingQueue.length}`);
        return userObject;
    }

    async requeueUser(user, { front = false } = {}) {
        if (!user?.socketId) return null;

        const client = await this.getClient();
        if (client) {
            await this.removeUser(user.socketId);
            const userObject = this.normalizeUser(user.socketId, user, 'waiting');
            return this.pushUser(client, userObject, { front });
        }

        await this.removeUser(user.socketId);
        const userObject = this.normalizeUser(user.socketId, user, 'waiting');

        if (front) {
            this.waitingQueue.unshift(userObject);
        } else {
            this.waitingQueue.push(userObject);
        }

        this.userStatus.set(user.socketId, 'waiting');
        return userObject;
    }

    async removeFromQueue(socketId) {
        const client = await this.getClient();
        if (client) {
            const removedCount = await client.lRem(this.queueKey, 0, socketId);
            if (removedCount > 0) {
                await client.hDel(this.statusKey, socketId);
                await client.del(this.userKey(socketId));
            }
            return removedCount > 0;
        }

        const index = this.waitingQueue.findIndex(user => user.socketId === socketId);

        if (index !== -1) {
            this.waitingQueue.splice(index, 1);
            this.userStatus.delete(socketId);
            console.log(` User ${socketId} removed from queue. Queue size: ${this.waitingQueue.length}`);
            return true;
        }

        console.warn(`User ${socketId} not found in queue`);
        return false;
    }

    async getQueuePosition(socketId) {
        const client = await this.getClient();
        if (client) {
            const queue = await client.lRange(this.queueKey, 0, -1);
            const index = queue.indexOf(socketId);
            return index === -1 ? null : index + 1;
        }

        const index = this.waitingQueue.findIndex(user => user.socketId === socketId);
        return index === -1 ? null : index + 1;
    }

    async removeUser(socketId) {
        const client = await this.getClient();
        if (client) {
            const [removedCount, removedStatus, removedUser] = await Promise.all([
                client.lRem(this.queueKey, 0, socketId),
                client.hDel(this.statusKey, socketId),
                client.del(this.userKey(socketId))
            ]);
            return removedCount > 0 || removedStatus > 0 || removedUser > 0;
        }

        const index = this.waitingQueue.findIndex(user => user.socketId === socketId);
        const removedFromQueue = index !== -1;
        if (removedFromQueue) {
            this.waitingQueue.splice(index, 1);
        }
        const removedStatus = this.userStatus.delete(socketId);
        return removedFromQueue || removedStatus;
    }

    async pruneUnavailableUsers(isAvailable) {
        const client = await this.getClient();
        if (client) {
            const queue = await client.lRange(this.queueKey, 0, -1);
            let removed = 0;

            for (const socketId of queue) {
                if (!await isAvailable(socketId)) {
                    if (await this.removeUser(socketId)) {
                        removed += 1;
                    }
                }
            }

            return removed;
        }

        const before = this.waitingQueue.length;
        const keptUsers = [];

        for (const user of this.waitingQueue) {
            if (await isAvailable(user.socketId)) {
                keptUsers.push(user);
            } else {
                this.userStatus.delete(user.socketId);
            }
        }

        this.waitingQueue = keptUsers;
        return before - this.waitingQueue.length;
    }

    async popNextWaitingUser(client) {
        const socketId = await client.lPop(this.queueKey);
        if (!socketId) return null;

        const user = await this.getQueuedUser(client, socketId);
        if (!user) {
            await client.hDel(this.statusKey, socketId);
            return null;
        }

        await client.hSet(this.statusKey, socketId, 'paired');
        await client.set(this.userKey(socketId), JSON.stringify({ ...user, status: 'paired' }));
        return { ...user, status: 'paired' };
    }

    async getPair() {
        const client = await this.getClient();
        if (client) {
            const users = [];
            const maxAttempts = Math.max(2, await client.lLen(this.queueKey));

            for (let attempt = 0; attempt < maxAttempts && users.length < 2; attempt += 1) {
                const user = await this.popNextWaitingUser(client);
                if (user) users.push(user);
            }

            if (users.length < 2) {
                for (const user of users.reverse()) {
                    await this.requeueUser(user, { front: true });
                }
                return null;
            }

            console.log(`🔗 Pairing users: ${users[0].socketId} <-> ${users[1].socketId}`);
            return users;
        }

        if (this.waitingQueue.length < 2) {
            return null;
        }

        const user1 = this.waitingQueue.shift();
        const user2 = this.waitingQueue.shift();

        this.userStatus.set(user1.socketId, 'paired');
        this.userStatus.set(user2.socketId, 'paired');

        console.log(`🔗 Pairing users: ${user1.socketId} <-> ${user2.socketId}`);
        return [user1, user2];
    }

    async takeNextUser({ excludeSocketIds = new Set(), isAvailable = () => true } = {}) {
        const excluded = excludeSocketIds instanceof Set ? excludeSocketIds : new Set(excludeSocketIds);
        const client = await this.getClient();

        if (client) {
            const queue = await client.lRange(this.queueKey, 0, -1);
            for (const socketId of queue) {
                if (!socketId || excluded.has(socketId) || !await isAvailable(socketId)) {
                    continue;
                }

                const removedCount = await client.lRem(this.queueKey, 1, socketId);
                if (removedCount <= 0) continue;

                const user = await this.getQueuedUser(client, socketId);
                if (!user) {
                    await client.hDel(this.statusKey, socketId);
                    continue;
                }

                const pairedUser = { ...user, status: 'paired' };
                await client.hSet(this.statusKey, socketId, 'paired');
                await client.set(this.userKey(socketId), JSON.stringify(pairedUser));
                return pairedUser;
            }

            return null;
        }

        for (let index = 0; index < this.waitingQueue.length; index += 1) {
            const user = this.waitingQueue[index];
            if (
                user?.socketId
                && !excluded.has(user.socketId)
                && await isAvailable(user.socketId, user)
            ) {
                this.waitingQueue.splice(index, 1);
                this.userStatus.set(user.socketId, 'paired');
                return user;
            }
        }

        return null;
    }

    async isInQueue(socketId) {
        return (await this.getQueuePosition(socketId)) !== null;
    }

    async getQueueSize() {
        const client = await this.getClient();
        if (client) {
            return client.lLen(this.queueKey);
        }

        return this.waitingQueue.length;
    }

    async getUserStatus(socketId) {
        const client = await this.getClient();
        if (client) {
            return await client.hGet(this.statusKey, socketId) || null;
        }

        return this.userStatus.get(socketId) || null;
    }

    async setUserStatus(socketId, status) {
        const client = await this.getClient();
        if (client) {
            await client.hSet(this.statusKey, socketId, status);
            const user = await this.getQueuedUser(client, socketId);
            if (user) {
                await client.set(this.userKey(socketId), JSON.stringify({ ...user, status }));
            }
            return;
        }

        this.userStatus.set(socketId, status);
    }

    async clear() {
        const client = await this.getClient();
        if (client) {
            const keys = [];
            for await (const key of client.scanIterator({ MATCH: redisKey('queue', '*'), COUNT: 100 })) {
                keys.push(key);
            }
            if (keys.length > 0) {
                await client.del(keys);
            }
            return;
        }

        this.waitingQueue = [];
        this.userStatus.clear();
        console.log('Queue service cleared');
    }

    async getStats() {
        const client = await this.getClient();
        if (client) {
            const [queueSize, statuses] = await Promise.all([
                client.lLen(this.queueKey),
                client.hVals(this.statusKey)
            ]);

            return {
                queueSize,
                totalUsers: statuses.length,
                userStatuses: {
                    waiting: statuses.filter(s => s === 'waiting').length,
                    paired: statuses.filter(s => s === 'paired').length,
                    disconnected: statuses.filter(s => s === 'disconnected').length,
                    searching: statuses.filter(s => s === 'searching').length
                }
            };
        }

        return {
            queueSize: this.waitingQueue.length,
            totalUsers: this.userStatus.size,
            userStatuses: {
                waiting: [...this.userStatus.values()].filter(s => s === 'waiting').length,
                paired: [...this.userStatus.values()].filter(s => s === 'paired').length,
                disconnected: [...this.userStatus.values()].filter(s => s === 'disconnected').length,
                searching: [...this.userStatus.values()].filter(s => s === 'searching').length
            }
        };
    }
}

export default new QueueService();
