/**
 * Room Service - Manages chat rooms and paired users
 * Tracks active rooms and participants
 */

class RoomService {
    constructor() {
        // Map to store rooms: roomId -> { user1, user2, createdAt, status }
        this.rooms = new Map();
        // Map to track user's room: socketId -> roomId
        this.userRoomMap = new Map();
        this.maxMessagesPerRoom = Number(process.env.MAX_ROOM_MESSAGES || 100);
        this.maxIceCandidatesPerRoom = Number(process.env.MAX_ROOM_ICE_CANDIDATES || 80);
        this.maxRoomAgeMs = Number(process.env.MAX_ROOM_AGE_MS || 2 * 60 * 60 * 1000);
    }

    /**
     * Create a new room with two users
     * @param {string} roomId - Unique room ID
     * @param {string} user1SocketId - First user's socket ID
     * @param {string} user2SocketId - Second user's socket ID
     * @param {Object} user1Data - First user's data
     * @param {Object} user2Data - Second user's data
     * @returns {Object} Created room object
     */
    createRoom(roomId, user1SocketId, user2SocketId, user1Data, user2Data) {
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
            messages: [],
            webrtcState: {
                user1Offer: null,
                user2Offer: null,
                user1Answer: null,
                user2Answer: null,
                iceCandidates: []
            }
        };

        this.rooms.set(roomId, room);
        this.userRoomMap.set(user1SocketId, roomId);
        this.userRoomMap.set(user2SocketId, roomId);

        console.log(`🏠 Room created: ${roomId}`);
        return room;
    }

    /**
     * Get room by ID
     * @param {string} roomId - Room ID
     * @returns {Object|null} Room object or null
     */
    getRoom(roomId) {
        return this.rooms.get(roomId) || null;
    }

    /**
     * Get room by user's socket ID
     * @param {string} socketId - Socket ID
     * @returns {Object|null} Room object or null
     */
    getRoomByUser(socketId) {
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
        if (!room) return null;
        if (room.user1.socketId === socketId) return 'user1';
        if (room.user2.socketId === socketId) return 'user2';
        return null;
    }

    isParticipant(roomId, socketId) {
        return Boolean(this.getParticipantKey(this.getRoom(roomId), socketId));
    }

    touchRoom(room) {
        if (room) {
            room.lastActivityAt = Date.now();
        }
    }

    /**
     * Get partner's socket ID in a room
     * @param {string} roomId - Room ID
     * @param {string} socketId - User's socket ID
     * @returns {string|null} Partner's socket ID or null
     */
    getPartner(roomId, socketId) {
        const room = this.getRoom(roomId);
        if (!room) return null;

        if (room.user1.socketId === socketId) {
            return room.user2.socketId;
        } else if (room.user2.socketId === socketId) {
            return room.user1.socketId;
        }

        return null;
    }

    /**
     * Add message to room
     * @param {string} roomId - Room ID
     * @param {string} socketId - Sender's socket ID
     * @param {string} message - Message content
     */
    addMessage(roomId, socketId, message) {
        const room = this.getRoom(roomId);
        if (room && this.isParticipant(roomId, socketId)) {
            room.messages.push({
                socketId,
                message: message.trim().slice(0, 1000),
                timestamp: Date.now()
            });
            if (room.messages.length > this.maxMessagesPerRoom) {
                room.messages.splice(0, room.messages.length - this.maxMessagesPerRoom);
            }
            this.touchRoom(room);
            console.log(`💬 Message added to room ${roomId}`);
            return true;
        }
        return false;
    }

    /**
     * Store WebRTC offer
     * @param {string} roomId - Room ID
     * @param {string} socketId - Offer sender's socket ID
     * @param {Object} offer - WebRTC offer
     */
    storeOffer(roomId, socketId, offer) {
        const room = this.getRoom(roomId);
        const participantKey = this.getParticipantKey(room, socketId);
        if (room && participantKey) {
            if (participantKey === 'user1') {
                room.webrtcState.user1Offer = offer;
            } else {
                room.webrtcState.user2Offer = offer;
            }
            this.touchRoom(room);
            console.log(`📤 Offer stored for room ${roomId}`);
            return true;
        }
        return false;
    }

    /**
     * Store WebRTC answer
     * @param {string} roomId - Room ID
     * @param {string} socketId - Answer sender's socket ID
     * @param {Object} answer - WebRTC answer
     */
    storeAnswer(roomId, socketId, answer) {
        const room = this.getRoom(roomId);
        const participantKey = this.getParticipantKey(room, socketId);
        if (room && participantKey) {
            if (participantKey === 'user1') {
                room.webrtcState.user1Answer = answer;
            } else {
                room.webrtcState.user2Answer = answer;
            }
            this.touchRoom(room);
            console.log(`📥 Answer stored for room ${roomId}`);
            return true;
        }
        return false;
    }

    /**
     * Add ICE candidate
     * @param {string} roomId - Room ID
     * @param {Object} candidate - ICE candidate
     */
    addICECandidate(roomId, socketId, candidate) {
        const room = this.getRoom(roomId);
        if (room && this.isParticipant(roomId, socketId)) {
            room.webrtcState.iceCandidates.push({
                ...candidate,
                timestamp: Date.now()
            });
            if (room.webrtcState.iceCandidates.length > this.maxIceCandidatesPerRoom) {
                room.webrtcState.iceCandidates.splice(0, room.webrtcState.iceCandidates.length - this.maxIceCandidatesPerRoom);
            }
            this.touchRoom(room);
            return true;
        }
        return false;
    }

    /**
     * Close/delete room
     * @param {string} roomId - Room ID
     * @returns {boolean} True if deleted, false if not found
     */
    closeRoom(roomId) {
        const room = this.getRoom(roomId);
        if (room) {
            this.userRoomMap.delete(room.user1.socketId);
            this.userRoomMap.delete(room.user2.socketId);
            this.rooms.delete(roomId);
            console.log(`🏚️ Room deleted: ${roomId}`);
            return true;
        }
        return false;
    }

    closeExpiredRooms(now = Date.now()) {
        const expiredRooms = [];

        for (const room of this.rooms.values()) {
            if (now - room.lastActivityAt >= this.maxRoomAgeMs) {
                expiredRooms.push(room);
            }
        }

        expiredRooms.forEach((room) => this.closeRoom(room.roomId));
        return expiredRooms;
    }

    /**
     * Check if room exists
     * @param {string} roomId - Room ID
     * @returns {boolean} True if room exists
     */
    roomExists(roomId) {
        return this.rooms.has(roomId);
    }

    /**
     * Get all active rooms
     * @returns {Array} Array of all rooms
     */
    getAllRooms() {
        return Array.from(this.rooms.values());
    }

    /**
     * Get room statistics
     * @returns {Object} Statistics
     */
    getStats({ includeRooms = false } = {}) {
        const stats = {
            totalRooms: this.rooms.size,
            totalUsers: this.userRoomMap.size
        };

        if (!includeRooms) {
            return stats;
        }

        return {
            ...stats,
            rooms: Array.from(this.rooms.values()).map(room => ({
                roomId: room.roomId,
                createdAt: room.createdAt,
                lastActivityAt: room.lastActivityAt,
                user1: room.user1.socketId,
                user2: room.user2.socketId
            }))
        };
    }

    /**
     * Clear all rooms (for testing)
     */
    clear() {
        this.rooms.clear();
        this.userRoomMap.clear();
        console.log('Room service cleared');
    }
}

export default new RoomService();
