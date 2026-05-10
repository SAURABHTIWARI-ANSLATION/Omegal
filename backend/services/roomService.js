import { redisKey } from '../config/redisConfig.js';
import { getRedisStateClient } from './redisClient.js';

class RoomService {
    constructor() {
        this.rooms = new Map();
        this.userRoomMap = new Map();
        this.maxMessagesPerRoom = Number(process.env.MAX_ROOM_MESSAGES || 100);
        this.maxIceCandidatesPerRoom = Number(process.env.MAX_ROOM_ICE_CANDIDATES || 80);
        this.maxRoomAgeMs = Number(process.env.MAX_ROOM_AGE_MS || 2 * 60 * 60 * 1000);
        this.roomsKey = redisKey('rooms', 'ids');
        this.userRoomKey = redisKey('rooms', 'user-map');
        this.roomKeyPrefix = redisKey('rooms', 'room');
    }

    createWebRTCState() {
        return {
            user1Offer: null,
            user2Offer: null,
            user1Answer: null,
            user2Answer: null,
            iceCandidates: []
        };
    }

    roomKey(roomId) {
        return `${this.roomKeyPrefix}:${roomId}`;
    }

    async getClient() {
        return getRedisStateClient();
    }

    async saveRoom(client, room) {
        if (!room?.roomId) return null;

        await client.set(this.roomKey(room.roomId), JSON.stringify(room));
        await client.sAdd(this.roomsKey, room.roomId);

        const participants = this.getParticipants(room);
        if (participants.length > 0) {
            await client.hSet(
                this.userRoomKey,
                Object.fromEntries(participants.map((user) => [user.socketId, room.roomId]))
            );
        }

        return room;
    }

    async createRoom(roomId, user1SocketId, user2SocketId, user1Data, user2Data) {
        const now = Date.now();
        const room = {
            roomId,
            user1: {
                socketId: user1SocketId,
                ...user1Data
            },
            user2: {
                socketId: user2SocketId,
                ...user2Data
            },
            createdAt: now,
            lastActivityAt: now,
            status: 'active',
            sessionVersion: 1,
            blockedPartnerIds: [],
            messages: [],
            webrtcState: this.createWebRTCState()
        };

        const client = await this.getClient();
        if (client) {
            await this.saveRoom(client, room);
        } else {
            this.rooms.set(roomId, room);
            this.userRoomMap.set(user1SocketId, roomId);
            this.userRoomMap.set(user2SocketId, roomId);
        }

        console.log(`🏠 Room created: ${roomId}`);
        return room;
    }

    async getRoom(roomId) {
        const client = await this.getClient();
        if (client) {
            const raw = await client.get(this.roomKey(roomId));
            if (!raw) return null;

            try {
                return JSON.parse(raw);
            } catch {
                await this.closeRoom(roomId);
                return null;
            }
        }

        return this.rooms.get(roomId) || null;
    }

    async getRoomByUser(socketId) {
        const client = await this.getClient();
        if (client) {
            const roomId = await client.hGet(this.userRoomKey, socketId);
            if (!roomId) return null;

            const room = await this.getRoom(roomId);
            if (!room) {
                await client.hDel(this.userRoomKey, socketId);
                return null;
            }

            return room;
        }

        const roomId = this.userRoomMap.get(socketId);
        if (!roomId) return null;

        const room = this.rooms.get(roomId);
        if (!room) {
            this.userRoomMap.delete(socketId);
            return null;
        }

        return room;
    }

    getParticipantKey(room, socketId) {
        if (!room || !socketId) return null;
        if (room.user1?.socketId === socketId) return 'user1';
        if (room.user2?.socketId === socketId) return 'user2';
        return null;
    }

    getParticipant(room, socketId) {
        const participantKey = this.getParticipantKey(room, socketId);
        return participantKey ? room[participantKey] : null;
    }

    getParticipants(room) {
        if (!room) return [];
        return [room.user1, room.user2].filter(Boolean);
    }

    getSingleParticipant(room) {
        const participants = this.getParticipants(room);
        return participants.length === 1 ? participants[0] : null;
    }

    async isParticipant(roomId, socketId) {
        return Boolean(this.getParticipantKey(await this.getRoom(roomId), socketId));
    }

    touchRoom(room) {
        if (room) {
            room.lastActivityAt = Date.now();
        }
    }

    async getPartner(roomId, socketId) {
        const room = await this.getRoom(roomId);
        if (!room) return null;

        if (room.user1?.socketId === socketId) {
            return room.user2?.socketId || null;
        } else if (room.user2?.socketId === socketId) {
            return room.user1?.socketId || null;
        }

        return null;
    }

    async resetWebRTCState(roomId) {
        const client = await this.getClient();
        const room = await this.getRoom(roomId);
        if (!room) return null;

        room.webrtcState = this.createWebRTCState();
        room.messages = [];
        this.touchRoom(room);

        if (client) {
            await this.saveRoom(client, room);
        }

        return room;
    }

    async bumpSessionVersion(roomId) {
        const room = await this.resetWebRTCState(roomId);
        if (!room) return null;

        room.sessionVersion = (Number(room.sessionVersion) || 1) + 1;
        this.touchRoom(room);

        const client = await this.getClient();
        if (client) {
            await this.saveRoom(client, room);
        }

        return room.sessionVersion;
    }

    async addBlockedPartner(roomId, socketId) {
        const client = await this.getClient();
        const room = await this.getRoom(roomId);
        if (!room || !socketId) return false;

        if (!Array.isArray(room.blockedPartnerIds)) {
            room.blockedPartnerIds = [];
        }

        if (!room.blockedPartnerIds.includes(socketId)) {
            room.blockedPartnerIds.push(socketId);
        }

        this.touchRoom(room);
        if (client) await this.saveRoom(client, room);
        return true;
    }

    async getBlockedPartnerIds(roomId) {
        const room = await this.getRoom(roomId);
        return Array.isArray(room?.blockedPartnerIds) ? room.blockedPartnerIds : [];
    }

    async detachParticipant(roomId, socketId) {
        const client = await this.getClient();
        const room = await this.getRoom(roomId);
        const participantKey = this.getParticipantKey(room, socketId);
        if (!room || !participantKey) return null;

        const detachedUser = room[participantKey];
        room[participantKey] = null;
        room.status = this.getParticipants(room).length > 0 ? 'waiting' : 'closed';
        this.touchRoom(room);

        if (client) {
            await client.hDel(this.userRoomKey, socketId);
            await this.saveRoom(client, room);
        } else {
            this.userRoomMap.delete(socketId);
        }

        return detachedUser;
    }

    async attachParticipant(roomId, user) {
        const client = await this.getClient();
        const room = await this.getRoom(roomId);
        if (!room || !user?.socketId || this.getParticipantKey(room, user.socketId)) return null;

        const participantKey = !room.user1 ? 'user1' : !room.user2 ? 'user2' : null;
        if (!participantKey) return null;

        room[participantKey] = {
            ...user,
            socketId: user.socketId
        };
        room.status = this.getParticipants(room).length === 2 ? 'active' : 'waiting';
        this.touchRoom(room);

        if (client) {
            await this.saveRoom(client, room);
        } else {
            this.userRoomMap.set(user.socketId, roomId);
        }

        return room[participantKey];
    }

    async getWaitingRooms() {
        const rooms = await this.getAllRooms();
        return rooms.filter((room) => (
            room.status === 'waiting'
            && this.getParticipants(room).length === 1
        ));
    }

    async addMessage(roomId, socketId, message) {
        const client = await this.getClient();
        const room = await this.getRoom(roomId);
        if (room && this.getParticipantKey(room, socketId)) {
            room.messages.push({
                socketId,
                message: message.trim().slice(0, 1000),
                timestamp: Date.now()
            });
            if (room.messages.length > this.maxMessagesPerRoom) {
                room.messages.splice(0, room.messages.length - this.maxMessagesPerRoom);
            }
            this.touchRoom(room);
            if (client) await this.saveRoom(client, room);
            console.log(`💬 Message added to room ${roomId}`);
            return true;
        }
        return false;
    }

    async storeOffer(roomId, socketId, offer) {
        const client = await this.getClient();
        const room = await this.getRoom(roomId);
        const participantKey = this.getParticipantKey(room, socketId);
        if (room && participantKey) {
            if (participantKey === 'user1') {
                room.webrtcState.user1Offer = offer;
            } else {
                room.webrtcState.user2Offer = offer;
            }
            this.touchRoom(room);
            if (client) await this.saveRoom(client, room);
            console.log(`📤 Offer stored for room ${roomId}`);
            return true;
        }
        return false;
    }

    async storeAnswer(roomId, socketId, answer) {
        const client = await this.getClient();
        const room = await this.getRoom(roomId);
        const participantKey = this.getParticipantKey(room, socketId);
        if (room && participantKey) {
            if (participantKey === 'user1') {
                room.webrtcState.user1Answer = answer;
            } else {
                room.webrtcState.user2Answer = answer;
            }
            this.touchRoom(room);
            if (client) await this.saveRoom(client, room);
            console.log(`📥 Answer stored for room ${roomId}`);
            return true;
        }
        return false;
    }

    async addICECandidate(roomId, socketId, candidate) {
        const client = await this.getClient();
        const room = await this.getRoom(roomId);
        if (room && this.getParticipantKey(room, socketId)) {
            room.webrtcState.iceCandidates.push({
                ...candidate,
                timestamp: Date.now()
            });
            if (room.webrtcState.iceCandidates.length > this.maxIceCandidatesPerRoom) {
                room.webrtcState.iceCandidates.splice(0, room.webrtcState.iceCandidates.length - this.maxIceCandidatesPerRoom);
            }
            this.touchRoom(room);
            if (client) await this.saveRoom(client, room);
            return true;
        }
        return false;
    }

    async closeRoom(roomId) {
        const client = await this.getClient();
        const room = await this.getRoom(roomId);
        if (!room) return false;

        const participants = this.getParticipants(room);
        if (client) {
            if (participants.length > 0) {
                await client.hDel(this.userRoomKey, participants.map((user) => user.socketId));
            }
            await client.sRem(this.roomsKey, roomId);
            await client.del(this.roomKey(roomId));
        } else {
            participants.forEach((user) => {
                this.userRoomMap.delete(user.socketId);
            });
            this.rooms.delete(roomId);
        }

        console.log(`🏚️ Room deleted: ${roomId}`);
        return true;
    }

    async closeExpiredRooms(now = Date.now()) {
        const rooms = await this.getAllRooms();
        const expiredRooms = rooms.filter((room) => now - room.lastActivityAt >= this.maxRoomAgeMs);

        for (const room of expiredRooms) {
            await this.closeRoom(room.roomId);
        }

        return expiredRooms;
    }

    async roomExists(roomId) {
        const client = await this.getClient();
        if (client) {
            return Boolean(await client.exists(this.roomKey(roomId)));
        }

        return this.rooms.has(roomId);
    }

    async getAllRooms() {
        const client = await this.getClient();
        if (client) {
            const roomIds = await client.sMembers(this.roomsKey);
            if (roomIds.length === 0) return [];

            const rooms = await client.mGet(roomIds.map((roomId) => this.roomKey(roomId)));
            return rooms
                .filter(Boolean)
                .map((raw, index) => {
                    try {
                        return JSON.parse(raw);
                    } catch {
                        client.sRem(this.roomsKey, roomIds[index]).catch(() => {});
                        return null;
                    }
                })
                .filter(Boolean);
        }

        return Array.from(this.rooms.values());
    }

    async getStats({ includeRooms = false } = {}) {
        const client = await this.getClient();
        const totalRooms = client ? await client.sCard(this.roomsKey) : this.rooms.size;
        const totalUsers = client ? await client.hLen(this.userRoomKey) : this.userRoomMap.size;
        const stats = { totalRooms, totalUsers };

        if (!includeRooms) {
            return stats;
        }

        const rooms = await this.getAllRooms();
        return {
            ...stats,
            rooms: rooms.map(room => ({
                roomId: room.roomId,
                createdAt: room.createdAt,
                lastActivityAt: room.lastActivityAt,
                status: room.status,
                sessionVersion: room.sessionVersion,
                user1: room.user1?.socketId || null,
                user2: room.user2?.socketId || null
            }))
        };
    }

    async clear() {
        const client = await this.getClient();
        if (client) {
            const keys = [];
            for await (const key of client.scanIterator({ MATCH: redisKey('rooms', '*'), COUNT: 100 })) {
                keys.push(key);
            }
            if (keys.length > 0) {
                await client.del(keys);
            }
            return;
        }

        this.rooms.clear();
        this.userRoomMap.clear();
        console.log('Room service cleared');
    }
}

export default new RoomService();
