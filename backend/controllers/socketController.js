/**
 * Socket Controllers - Handles all socket.io events
 */

import queueService from '../services/queueService.js';
import roomService from '../services/roomService.js';
import { capacityConfig, isLimitEnabled } from '../config/capacityConfig.js';
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
    next_partner: { windowMs: 30_000, max: 8 },
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
const nextPartnerLocks = new Set();
let queueSizeBroadcastTimer = null;
let lastQueueSizeBroadcastAt = 0;
let pairingScheduled = false;

const getSocketById = (io, socketId) => io.of('/').sockets.get(socketId) || null;
const getConnectedSocketCount = (io) => io.of('/').sockets.size;
const getActiveRoomCount = () => roomService.getStats().totalRooms;

const emitQueueSizeNow = (io) => {
    lastQueueSizeBroadcastAt = Date.now();
    io.emit('queue_size_updated', {
        queueSize: queueService.getQueueSize()
    });
};

const emitQueueSize = (io, { immediate = false } = {}) => {
    const intervalMs = capacityConfig.queueBroadcastIntervalMs;
    if (immediate || !isLimitEnabled(intervalMs)) {
        if (queueSizeBroadcastTimer) {
            clearTimeout(queueSizeBroadcastTimer);
            queueSizeBroadcastTimer = null;
        }
        emitQueueSizeNow(io);
        return;
    }

    const elapsed = Date.now() - lastQueueSizeBroadcastAt;
    if (elapsed >= intervalMs) {
        emitQueueSizeNow(io);
        return;
    }

    if (queueSizeBroadcastTimer) return;
    queueSizeBroadcastTimer = setTimeout(() => {
        queueSizeBroadcastTimer = null;
        emitQueueSizeNow(io);
    }, intervalMs - elapsed);
    queueSizeBroadcastTimer.unref?.();
};

const getCapacitySnapshot = (io) => ({
    connectedSockets: getConnectedSocketCount(io),
    queueSize: queueService.getQueueSize(),
    activeRooms: getActiveRoomCount(),
    limits: capacityConfig
});

const hasConnectionCapacity = (io) => (
    !isLimitEnabled(capacityConfig.maxConnectedSockets)
    || getConnectedSocketCount(io) <= capacityConfig.maxConnectedSockets
);

const hasQueueCapacity = (socketId) => (
    queueService.getUserStatus(socketId) === 'waiting'
    || !isLimitEnabled(capacityConfig.maxQueueSize)
    || queueService.getQueueSize() < capacityConfig.maxQueueSize
);

const hasRoomCapacity = () => (
    !isLimitEnabled(capacityConfig.maxActiveRooms)
    || getActiveRoomCount() < capacityConfig.maxActiveRooms
);

const schedulePairing = (io) => {
    if (pairingScheduled) return;
    pairingScheduled = true;
    setImmediate(() => {
        pairingScheduled = false;
        checkAndPairUsers(io);
    });
};

const getRoomContext = (socket, payload = {}, { requirePartner = true } = {}) => {
    const room = roomService.getRoomByUser(socket.id);
    if (!room) {
        socket.emit('error', { message: 'Not in any room' });
        return null;
    }

    if (payload.roomId && payload.roomId !== room.roomId) {
        return null;
    }

    if (payload.sessionVersion !== undefined && Number(payload.sessionVersion) !== Number(room.sessionVersion || 1)) {
        return null;
    }

    const partnerId = roomService.getPartner(room.roomId, socket.id);
    if (requirePartner && !partnerId) {
        socket.emit('error', { message: 'Partner not available' });
        return null;
    }

    return { room, roomId: room.roomId, partnerId };
};

const notifyRoomClosed = (io, room, message) => {
    roomService.getParticipants(room).forEach(({ socketId }) => {
        getSocketById(io, socketId)?.leave(room.roomId);
        queueService.removeUser(socketId);
        io.to(socketId).emit('partner_disconnected', {
            message,
            roomId: room.roomId,
            sessionVersion: room.sessionVersion || 1
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

const createMatchPayload = (room, partnerUser, { reconnect = false } = {}) => ({
    roomId: room.roomId,
    partnerId: partnerUser.socketId,
    sessionVersion: room.sessionVersion || 1,
    reconnect,
    partnerData: {
        joinedAt: partnerUser.joinedAt || null,
        chatMode: partnerUser.chatMode || null
    },
    message: 'Connected to stranger'
});

const emitMatchedPair = (io, room, user1, user2, options = {}) => {
    io.to(room.roomId).emit('user_matched', {
        roomId: room.roomId,
        partnerId: null,
        sessionVersion: room.sessionVersion || 1,
        message: 'Connected to stranger'
    });

    io.to(user1.socketId).emit('matched', createMatchPayload(room, user2, options));
    io.to(user2.socketId).emit('matched', createMatchPayload(room, user1, options));
};

const emitPeerReset = (io, socketId, payload) => {
    io.to(socketId).emit('peer_reset', {
        reason: payload.reason || 'partner_change',
        message: payload.message || 'Resetting peer connection',
        roomId: payload.roomId,
        sessionVersion: payload.sessionVersion
    });
};

const isSocketAvailableForQueueMatch = (io, socketId) => (
    Boolean(getSocketById(io, socketId))
    && !roomService.getRoomByUser(socketId)
);

const attachQueuedUserToWaitingRoom = (io, room, { excludeSocketIds = new Set() } = {}) => {
    if (!room) return null;

    const requester = roomService.getSingleParticipant(room);
    if (!requester?.socketId) return null;

    const requesterSocket = getSocketById(io, requester.socketId);
    if (!requesterSocket) {
        queueService.removeUser(requester.socketId);
        roomService.closeRoom(room.roomId);
        return null;
    }

    const excluded = new Set([
        requester.socketId,
        ...roomService.getBlockedPartnerIds(room.roomId),
        ...excludeSocketIds
    ]);

    const newPartner = queueService.takeNextUser({
        excludeSocketIds: excluded,
        isAvailable: (socketId) => isSocketAvailableForQueueMatch(io, socketId)
    });

    if (!newPartner) return null;

    const partnerSocket = getSocketById(io, newPartner.socketId);
    if (!partnerSocket) {
        queueService.removeUser(newPartner.socketId);
        return null;
    }

    roomService.bumpSessionVersion(room.roomId);
    const updatedRoom = roomService.getRoom(room.roomId);
    if (!updatedRoom) {
        queueService.requeueUser(newPartner, { front: true });
        return null;
    }

    const attachedPartner = roomService.attachParticipant(updatedRoom.roomId, newPartner);
    if (!attachedPartner) {
        queueService.requeueUser(newPartner, { front: true });
        return null;
    }

    queueService.setUserStatus(requester.socketId, 'paired');
    queueService.setUserStatus(newPartner.socketId, 'paired');
    partnerSocket.join(updatedRoom.roomId);

    emitPeerReset(io, requester.socketId, {
        roomId: updatedRoom.roomId,
        sessionVersion: updatedRoom.sessionVersion,
        reason: 'partner_change',
        message: 'Preparing a fresh peer connection'
    });
    emitMatchedPair(io, updatedRoom, requester, attachedPartner, { reconnect: true });
    return { room: updatedRoom, requester, partner: attachedPartner };
};

const fillWaitingRooms = (io, { onlyRoomId = null, excludeSocketIds = new Set() } = {}) => {
    const rooms = onlyRoomId
        ? [roomService.getRoom(onlyRoomId)].filter(Boolean)
        : roomService.getWaitingRooms();

    let attachedCount = 0;
    rooms.forEach((room) => {
        if (attachQueuedUserToWaitingRoom(io, room, { excludeSocketIds })) {
            attachedCount += 1;
        }
    });

    return attachedCount;
};

/**
 * Register all socket event handlers
 * @param {Server} io - Socket.IO server instance
 */
export const registerSocketControllers = (io) => {
    startRoomCleanup(io);

    io.on('connection', (socket) => {
        if (!hasConnectionCapacity(io)) {
            socket.emit('capacity_reached', {
                message: 'Server is at capacity. Please try again shortly.',
                retryAfterMs: capacityConfig.loadSheddingRetryAfterMs,
                capacity: getCapacitySnapshot(io)
            });
            socket.disconnect(true);
            return;
        }

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

                if (!hasQueueCapacity(socket.id)) {
                    socket.emit('capacity_reached', {
                        message: 'Queue is full. Please try again shortly.',
                        retryAfterMs: capacityConfig.loadSheddingRetryAfterMs,
                        capacity: getCapacitySnapshot(io)
                    });
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
         * Move to a fresh partner without tearing down the requester room.
         * Event: next_partner
         */
        socket.on('next_partner', (data = {}) => {
            handleNextPartner(io, socket, data);
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

                const context = getRoomContext(socket, data);
                if (!context) return;

                // Store message
                roomService.addMessage(context.roomId, socket.id, message);

                // Send message to partner
                io.to(context.partnerId).emit('receive_message', {
                    message,
                    senderId: socket.id,
                    roomId: context.roomId,
                    sessionVersion: context.room.sessionVersion || 1,
                    timestamp: Date.now()
                });

                // Send confirmation to sender
                socket.emit('message_sent', {
                    clientMessageId: data.clientMessageId || null,
                    message,
                    roomId: context.roomId,
                    sessionVersion: context.room.sessionVersion || 1,
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

                const context = getRoomContext(socket, data);
                if (!context) return;

                // Store offer
                roomService.storeOffer(context.roomId, socket.id, data.offer);

                // Send offer to partner
                io.to(context.partnerId).emit('receive_offer', {
                    offer: data.offer,
                    senderId: socket.id,
                    roomId: context.roomId,
                    sessionVersion: context.room.sessionVersion || 1
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

                const context = getRoomContext(socket, data);
                if (!context) return;

                // Store answer
                roomService.storeAnswer(context.roomId, socket.id, data.answer);

                // Send answer to partner
                io.to(context.partnerId).emit('receive_answer', {
                    answer: data.answer,
                    senderId: socket.id,
                    roomId: context.roomId,
                    sessionVersion: context.room.sessionVersion || 1
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

                const context = getRoomContext(socket, data);
                if (!context) return;

                // Store ICE candidate
                roomService.addICECandidate(context.roomId, socket.id, data.candidate);

                // Send candidate to partner
                io.to(context.partnerId).emit('receive_ice_candidate', {
                    candidate: data.candidate,
                    senderId: socket.id,
                    roomId: context.roomId,
                    sessionVersion: context.room.sessionVersion || 1
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
                        sessionVersion: room.sessionVersion || 1,
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

                socket.emit('room_stats', {
                    ...roomService.getStats({ includeRooms: true }),
                    queue: queueService.getStats(),
                    capacity: getCapacitySnapshot(io)
                });
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

const handleNextPartner = (io, socket, data = {}) => {
    if (nextPartnerLocks.has(socket.id)) {
        socket.emit('next_partner_waiting', {
            message: 'Looking for a new partner...',
            queueSize: queueService.getQueueSize()
        });
        return;
    }

    nextPartnerLocks.add(socket.id);

    try {
        const room = roomService.getRoomByUser(socket.id);
        if (!room) {
            socket.emit('error', { message: 'Not in any room' });
            return;
        }

        if (data.roomId && data.roomId !== room.roomId) return;
        if (data.sessionVersion !== undefined && Number(data.sessionVersion) !== Number(room.sessionVersion || 1)) return;

        const currentPartnerId = roomService.getPartner(room.roomId, socket.id);
        queueService.removeUser(socket.id);
        queueService.setUserStatus(socket.id, 'searching');

        if (!currentPartnerId) {
            socket.emit('next_partner_waiting', {
                roomId: room.roomId,
                sessionVersion: room.sessionVersion || 1,
                message: 'Looking for a new partner...',
                queueSize: queueService.getQueueSize()
            });
            fillWaitingRooms(io, { onlyRoomId: room.roomId });
            emitQueueSize(io);
            return;
        }

        const currentPartner = roomService.getParticipant(room, currentPartnerId);
        const currentPartnerSocket = getSocketById(io, currentPartnerId);

        roomService.addBlockedPartner(room.roomId, currentPartnerId);
        roomService.bumpSessionVersion(room.roomId);
        const waitingRoom = roomService.getRoom(room.roomId);
        if (!waitingRoom) {
            socket.emit('error', { message: 'Room is no longer available' });
            return;
        }

        emitPeerReset(io, socket.id, {
            roomId: waitingRoom.roomId,
            sessionVersion: waitingRoom.sessionVersion,
            reason: 'next_partner',
            message: 'Looking for a new partner...'
        });
        emitPeerReset(io, currentPartnerId, {
            roomId: waitingRoom.roomId,
            sessionVersion: waitingRoom.sessionVersion,
            reason: 'partner_moved_on',
            message: 'Waiting for another user...'
        });

        currentPartnerSocket?.leave(waitingRoom.roomId);
        const detachedPartner = roomService.detachParticipant(waitingRoom.roomId, currentPartnerId) || currentPartner;

        socket.emit('next_partner_waiting', {
            roomId: waitingRoom.roomId,
            sessionVersion: waitingRoom.sessionVersion,
            message: 'Looking for a new partner...',
            queueSize: queueService.getQueueSize()
        });

        if (currentPartnerSocket && detachedPartner?.socketId) {
            queueService.requeueUser({
                ...detachedPartner,
                socketId: currentPartnerId,
                chatMode: detachedPartner.chatMode || room.chatMode
            });

            currentPartnerSocket.emit('partner_waiting', {
                oldRoomId: waitingRoom.roomId,
                oldSessionVersion: waitingRoom.sessionVersion,
                message: 'Waiting for another user...',
                queueSize: queueService.getQueueSize()
            });
            currentPartnerSocket.emit('queue_joined', {
                message: 'Waiting for another user...',
                queuePosition: queueService.getQueuePosition(currentPartnerId),
                queueSize: queueService.getQueueSize()
            });
        } else {
            queueService.removeUser(currentPartnerId);
        }

        fillWaitingRooms(io, {
            onlyRoomId: waitingRoom.roomId,
            excludeSocketIds: new Set([currentPartnerId])
        });
        checkAndPairUsers(io);
        emitQueueSize(io);
    } catch (error) {
        console.error('Error in next_partner:', error.message);
        socket.emit('error', { message: 'Error finding next partner' });
    } finally {
        nextPartnerLocks.delete(socket.id);
    }
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
    const removedStaleUsers = queueService.pruneUnavailableUsers((socketId) => (
        Boolean(getSocketById(io, socketId))
        && !roomService.getRoomByUser(socketId)
    ));
    const filledWaitingRooms = fillWaitingRooms(io);
    let pairedRooms = 0;

    while (queueService.getQueueSize() >= 2 && pairedRooms < capacityConfig.maxPairsPerTick && hasRoomCapacity()) {
        const pair = queueService.getPair();
        if (!pair) break;

        const [user1, user2] = pair;
        const socket1 = getSocketById(io, user1.socketId);
        const socket2 = getSocketById(io, user2.socketId);

        if (user1.socketId === user2.socketId) {
            if (socket1) queueService.requeueUser(user1, { front: true });
            continue;
        }

        if (!socket1 || !socket2) {
            if (socket1) queueService.requeueUser(user1, { front: true });
            if (socket2) queueService.requeueUser(user2, { front: true });
            if (!socket1) queueService.removeUser(user1.socketId);
            if (!socket2) queueService.removeUser(user2.socketId);
            continue;
        }

        if (roomService.getRoomByUser(user1.socketId) || roomService.getRoomByUser(user2.socketId)) {
            if (!roomService.getRoomByUser(user1.socketId)) queueService.requeueUser(user1, { front: true });
            if (!roomService.getRoomByUser(user2.socketId)) queueService.requeueUser(user2, { front: true });
            continue;
        }

        const roomId = generateRoomId();

        // Create room
        const room = roomService.createRoom(
            roomId,
            user1.socketId,
            user2.socketId,
            user1,
            user2
        );

        // Join both users to a socket.io room
        socket1.join(roomId);
        socket2.join(roomId);

        emitMatchedPair(io, room, user1, user2);

        console.log(`Users paired in room: ${roomId}`);
        pairedRooms += 1;
    }

    if (removedStaleUsers > 0 || filledWaitingRooms > 0 || pairedRooms > 0) {
        emitQueueSize(io);
    }

    if (queueService.getQueueSize() >= 2 && pairedRooms >= capacityConfig.maxPairsPerTick && hasRoomCapacity()) {
        schedulePairing(io);
    }
};
