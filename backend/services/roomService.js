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
            createdAt: Date.now(),
            status: 'active',
            messages: [],
            webrtcState: {
                user1Offer: null,
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
        return roomId ? this.rooms.get(roomId) : null;
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
        if (room) {
            room.messages.push({
                socketId,
                message,
                timestamp: Date.now()
            });
            console.log(`💬 Message added to room ${roomId}`);
        }
    }

    /**
     * Store WebRTC offer
     * @param {string} roomId - Room ID
     * @param {string} socketId - Offer sender's socket ID
     * @param {Object} offer - WebRTC offer
     */
    storeOffer(roomId, socketId, offer) {
        const room = this.getRoom(roomId);
        if (room) {
            if (room.user1.socketId === socketId) {
                room.webrtcState.user1Offer = offer;
            } else {
                room.webrtcState.user2Offer = offer;
            }
            console.log(`📤 Offer stored for room ${roomId}`);
        }
    }

    /**
     * Store WebRTC answer
     * @param {string} roomId - Room ID
     * @param {string} socketId - Answer sender's socket ID
     * @param {Object} answer - WebRTC answer
     */
    storeAnswer(roomId, socketId, answer) {
        const room = this.getRoom(roomId);
        if (room) {
            if (room.user1.socketId === socketId) {
                room.webrtcState.user1Answer = answer;
            } else {
                room.webrtcState.user2Answer = answer;
            }
            console.log(`📥 Answer stored for room ${roomId}`);
        }
    }

    /**
     * Add ICE candidate
     * @param {string} roomId - Room ID
     * @param {Object} candidate - ICE candidate
     */
    addICECandidate(roomId, candidate) {
        const room = this.getRoom(roomId);
        if (room) {
            room.webrtcState.iceCandidates.push({
                ...candidate,
                timestamp: Date.now()
            });
        }
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
    getStats() {
        return {
            totalRooms: this.rooms.size,
            totalUsers: this.userRoomMap.size,
            rooms: Array.from(this.rooms.values()).map(room => ({
                roomId: room.roomId,
                createdAt: room.createdAt,
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