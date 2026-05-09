/**
 * Socket Controllers - Handles all socket.io events
 */

import queueService from '../services/queueService.js';
import roomService from '../services/roomService.js';
import { generateRoomId } from '../utils/roomIdGenerator.js';
import { consumeRateLimit } from '../utils/rateLimiter.js';
import {
    isValidMessage,
    isValidUserData,
    isValidOffer,
    isValidAnswer,
    isValidICECandidate,
    normalizeMessage,
    sanitizeUserData
} from '../utils/validations.js';

const SOCKET_EVENT_LIMITS = {
    join_queue: { windowMs: 60_000, max: 12 },
    leave_queue: { windowMs: 60_000, max: 20 },
    disconnect_room: { windowMs: 60_000, max: 20 },
    send_message: { windowMs: 10_000, max: 20 },
    send_offer: { windowMs: 60_000, max: 10 },
    send_answer: { windowMs: 60_000, max: 10 },
    send_ice_candidate: { windowMs: 10_000, max: 120 },
    default: { windowMs: 10_000, max: 80 }
};

const isAuthorizedAdmin = (socket) => {
    const adminToken = process.env.ADMIN_TOKEN;
    if (!adminToken) return false;

    const suppliedToken = socket.handshake.auth?.adminToken || socket.handshake.headers?.['x-admin-token'];
    return suppliedToken === adminToken;
};

const ROOM_CLEANUP_INTERVAL_MS = Number(process.env.ROOM_CLEANUP_INTERVAL_MS || 5 * 60 * 1000);
let roomCleanupTimer = null;

const getSocketById = (io, socketId) => io.of('/').sockets.get(socketId) || null;

const emitQueueSize = (io) => {
    io.emit('queue_size_updated', {
        queueSize: queueService.getQueueSize()
    });
};

const getRoomContext = (socket) => {
    const room = roomService.getRoomByUser(socket.id);
    if (!room) {
        socket.emit('error', { message: 'Not in any room' });
        return null;
    }

    const partnerId = roomService.getPartner(room.roomId, socket.id);
    if (!partnerId) {
        socket.emit('error', { message: 'Partner not available' });
        return null;
    }

    return { room, roomId: room.roomId, partnerId };
};

const notifyRoomClosed = (io, room, message) => {
    [room.user1.socketId, room.user2.socketId].forEach((socketId) => {
        getSocketById(io, socketId)?.leave(room.roomId);
        queueService.removeUser(socketId);
        io.to(socketId).emit('partner_disconnected', {
            message,
            roomId: room.roomId
        });
    });
};

const startRoomCleanup = (io) => {
    if (roomCleanupTimer || ROOM_CLEANUP_INTERVAL_MS <= 0) return;

    roomCleanupTimer = setInterval(() => {
        const expiredRooms = roomService.closeExpiredRooms();
        if (expiredRooms.length === 0) return;

        expiredRooms.forEach((room) => {
            notifyRoomClosed(io, room, 'Room expired due to inactivity');
        });
        emitQueueSize(io);
    }, ROOM_CLEANUP_INTERVAL_MS);

    roomCleanupTimer.unref?.();
};

/**
 * Register all socket event handlers
 * @param {Server} io - Socket.IO server instance
 */
export const registerSocketControllers = (io) => {
    startRoomCleanup(io);

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.use((packet, next) => {
            const [eventName] = packet;
            const limit = SOCKET_EVENT_LIMITS[eventName] || SOCKET_EVENT_LIMITS.default;
            const result = consumeRateLimit(`socket:${socket.id}:${eventName}`, limit);

            if (!result.allowed) {
                socket.emit('error', {
                    message: 'Too many requests',
                    retryAfterMs: result.retryAfterMs
                });
                return;
            }

            next();
        });

        // Emit connection success
        socket.emit('connection_success', {
            socketId: socket.id,
            message: 'Connected to server'
        });

        /**
         * User joins waiting queue
         * Event: join_queue
         * Payload: { userData: { name?, ... } }
         */
        socket.on('join_queue', (data) => {
            try {
                const rawUserData = data?.userData || {};
                if (!isValidUserData(rawUserData)) {
                    socket.emit('error', { message: 'Invalid user data' });
                    return;
                }

                if (roomService.getRoomByUser(socket.id)) {
                    handleUserDisconnect(io, socket.id, { reason: 'joining_queue' });
                }

                const userData = sanitizeUserData(rawUserData);

                // Add user to queue
                const queuedUser = queueService.addToQueue(socket.id, userData);
                if (!queuedUser) {
                    socket.emit('error', { message: 'Unable to join queue' });
                    return;
                }

                // Emit queue joined confirmation
                const queuePosition = queueService.getQueuePosition(socket.id);
                socket.emit('queue_joined', {
                    message: 'You have joined the queue',
                    queuePosition,
                    queueSize: queueService.getQueueSize()
                });

                // Broadcast queue size to all connected users
                emitQueueSize(io);

                // Attempt to pair users
                checkAndPairUsers(io);
            } catch (error) {
                console.error('Error in join_queue:', error.message);
                socket.emit('error', { message: 'Error joining queue' });
            }
        });

        /**
         * User leaves queue
         * Event: leave_queue
         */
        socket.on('leave_queue', () => {
            try {
                if (queueService.removeFromQueue(socket.id)) {
                    socket.emit('queue_left', { message: 'You have left the queue' });

                    emitQueueSize(io);
                }
            } catch (error) {
                console.error('Error in leave_queue:', error.message);
                socket.emit('error', { message: 'Error leaving queue' });
            }
        });

        /**
         * Get current queue status
         * Event: get_queue_status
         */
        socket.on('get_queue_status', () => {
            try {
                socket.emit('queue_status', {
                    queueSize: queueService.getQueueSize(),
                    userQueuePosition: queueService.getQueuePosition(socket.id),
                    stats: queueService.getStats()
                });
            } catch (error) {
                console.error('Error in get_queue_status:', error.message);
            }
        });


        /**
         * Send text message
         * Event: send_message
         * Payload: { message: string }
         */
        socket.on('send_message', (data) => {
            try {
                if (!isValidMessage(data?.message)) {
                    socket.emit('error', { message: 'Invalid message' });
                    return;
                }
                const message = normalizeMessage(data.message);

                const context = getRoomContext(socket);
                if (!context) return;

                // Store message
                roomService.addMessage(context.roomId, socket.id, message);

                // Send message to partner
                io.to(context.partnerId).emit('receive_message', {
                    message,
                    senderId: socket.id,
                    timestamp: Date.now()
                });

                // Send confirmation to sender
                socket.emit('message_sent', {
                    clientMessageId: data.clientMessageId || null,
                    message,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error('Error in send_message:', error.message);
                socket.emit('error', { message: 'Error sending message' });
            }
        });


        /**
         * Send WebRTC offer
         * Event: send_offer
         * Payload: { offer: RTCSessionDescriptionInit }
         */
        socket.on('send_offer', (data) => {
            try {
                if (!isValidOffer(data?.offer)) {
                    socket.emit('error', { message: 'Invalid offer format' });
                    return;
                }

                const context = getRoomContext(socket);
                if (!context) return;

                // Store offer
                roomService.storeOffer(context.roomId, socket.id, data.offer);

                // Send offer to partner
                io.to(context.partnerId).emit('receive_offer', {
                    offer: data.offer,
                    senderId: socket.id
                });

                console.log(`📤 Offer sent from ${socket.id} to ${context.partnerId}`);
            } catch (error) {
                console.error('Error in send_offer:', error.message);
                socket.emit('error', { message: 'Error sending offer' });
            }
        });

        /**
         * Send WebRTC answer
         * Event: send_answer
         * Payload: { answer: RTCSessionDescriptionInit }
         */
        socket.on('send_answer', (data) => {
            try {
                if (!isValidAnswer(data?.answer)) {
                    socket.emit('error', { message: 'Invalid answer format' });
                    return;
                }

                const context = getRoomContext(socket);
                if (!context) return;

                // Store answer
                roomService.storeAnswer(context.roomId, socket.id, data.answer);

                // Send answer to partner
                io.to(context.partnerId).emit('receive_answer', {
                    answer: data.answer,
                    senderId: socket.id
                });

                console.log(`📥 Answer sent from ${socket.id} to ${context.partnerId}`);
            } catch (error) {
                console.error('Error in send_answer:', error.message);
                socket.emit('error', { message: 'Error sending answer' });
            }
        });

        /**
         * Send ICE candidate
         * Event: send_ice_candidate
         * Payload: { candidate: RTCIceCandidate }
         */
        socket.on('send_ice_candidate', (data) => {
            try {
                if (!isValidICECandidate(data?.candidate)) {
                    socket.emit('error', { message: 'Invalid ICE candidate format' });
                    return;
                }

                const context = getRoomContext(socket);
                if (!context) return;

                // Store ICE candidate
                roomService.addICECandidate(context.roomId, socket.id, data.candidate);

                // Send candidate to partner
                io.to(context.partnerId).emit('receive_ice_candidate', {
                    candidate: data.candidate,
                    senderId: socket.id
                });

                console.log(`❄️ ICE candidate sent from ${socket.id} to ${context.partnerId}`);
            } catch (error) {
                console.error('Error in send_ice_candidate:', error.message);
                socket.emit('error', { message: 'Error sending ICE candidate' });
            }
        });


        /**
         * Get current room info
         * Event: get_room_info
         */
        socket.on('get_room_info', () => {
            try {
                const room = roomService.getRoomByUser(socket.id);
                if (room) {
                    const partner = roomService.getPartner(room.roomId, socket.id);
                    socket.emit('room_info', {
                        roomId: room.roomId,
                        partnerId: partner,
                        createdAt: room.createdAt,
                        messageCount: room.messages.length
                    });
                } else {
                    socket.emit('error', { message: 'Not in any room' });
                }
            } catch (error) {
                console.error('Error in get_room_info:', error.message);
            }
        });

        /**
         * Get room statistics
         * Event: get_room_stats
         */
        socket.on('get_room_stats', () => {
            try {
                if (!isAuthorizedAdmin(socket)) {
                    socket.emit('error', { message: 'Unauthorized' });
                    return;
                }

                socket.emit('room_stats', roomService.getStats({ includeRooms: true }));
            } catch (error) {
                console.error('Error in get_room_stats:', error.message);
            }
        });

        /**
         * Disconnect event - Clean up when user leaves
         */
        socket.on('disconnect', () => {
            handleUserDisconnect(io, socket.id, { reason: 'socket_disconnect' });
        });

        /**
         * Manual disconnect event
         * Event: disconnect_room
         */
        socket.on('disconnect_room', () => {
            handleUserDisconnect(io, socket.id, { reason: 'manual_disconnect' });
        });
    });
};

/**
 * Handle user disconnect - Clean up queue and rooms
 * @param {Server} io - Socket.IO server
 * @param {string} socketId - Disconnected user's socket ID
 */
const handleUserDisconnect = (io, socketId, options = {}) => {
    const { reason = 'disconnect' } = options;
    const room = roomService.getRoomByUser(socketId);
    const removedQueueUser = queueService.removeUser(socketId);
    if (!room && !removedQueueUser) return;

    console.log(`🔴 User disconnected: ${socketId}`);

    if (room) {
        const partner = roomService.getPartner(room.roomId, socketId);
        getSocketById(io, socketId)?.leave(room.roomId);

        // Notify partner about disconnection
        if (partner) {
            getSocketById(io, partner)?.leave(room.roomId);
            io.to(partner).emit('partner_disconnected', {
                message: reason === 'joining_queue' ? 'Your partner is searching for a new chat' : 'Your partner has disconnected',
                roomId: room.roomId
            });
            queueService.removeUser(partner);
        }

        // Close room
        roomService.closeRoom(room.roomId);
    }

    // Update stats
    emitQueueSize(io);
};

/**
 * Check queue and pair users if possible
 * @param {Server} io - Socket.IO server
 */
const checkAndPairUsers = (io) => {
    const removedStaleUsers = queueService.pruneUnavailableUsers((socketId) => Boolean(getSocketById(io, socketId)));
    let pairedRooms = 0;

    while (queueService.getQueueSize() >= 2) {
        const pair = queueService.getPair();
        if (!pair) break;

        const [user1, user2] = pair;
        const roomId = generateRoomId();
        const socket1 = getSocketById(io, user1.socketId);
        const socket2 = getSocketById(io, user2.socketId);

        if (!socket1 || !socket2) {
            if (socket1) queueService.requeueUser(user1, { front: true });
            if (socket2) queueService.requeueUser(user2, { front: true });
            if (!socket1) queueService.removeUser(user1.socketId);
            if (!socket2) queueService.removeUser(user2.socketId);
            continue;
        }

        // Create room
        roomService.createRoom(
            roomId,
            user1.socketId,
            user2.socketId,
            user1,
            user2
        );

        // Join both users to a socket.io room
        socket1.join(roomId);
        socket2.join(roomId);

        // Notify both users about pairing
        io.to(roomId).emit('user_matched', {
            roomId,
            partnerId: null, // Don't send partner ID for privacy, they get it from the connection
            message: 'You have been matched with a stranger'
        });

        // Send specific info to each user
        io.to(user1.socketId).emit('matched', {
            roomId,
            partnerId: user2.socketId,
            partnerData: {
                joinedAt: user2.joinedAt
            }
        });

        io.to(user2.socketId).emit('matched', {
            roomId,
            partnerId: user1.socketId,
            partnerData: {
                joinedAt: user1.joinedAt
            }
        });

        console.log(`Users paired in room: ${roomId}`);
        pairedRooms += 1;
    }

    if (removedStaleUsers > 0 || pairedRooms > 0) {
        emitQueueSize(io);
    }
};
