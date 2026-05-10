/**
 * Socket Controllers - Handles all socket.io events
 */

import queueService from '../services/queueService.js';
import roomService from '../services/roomService.js';
import lockService from '../services/lockService.js';
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
let queueSizeBroadcastTimer = null;
let lastQueueSizeBroadcastAt = 0;
let pairingScheduled = false;

const getSocketById = (io, socketId) => io.of('/').sockets.get(socketId) || null;
const getSocketsById = async (io, socketId) => io.in(socketId).fetchSockets();
const socketExists = async (io, socketId) => {
    if (getSocketById(io, socketId)) return true;
    return (await getSocketsById(io, socketId)).length > 0;
};
const joinSocketRoom = async (io, socketId, roomId) => {
    const socket = getSocketById(io, socketId);
    if (socket) {
        socket.join(roomId);
        return;
    }
    await io.in(socketId).socketsJoin(roomId);
};
const leaveSocketRoom = async (io, socketId, roomId) => {
    const socket = getSocketById(io, socketId);
    if (socket) {
        socket.leave(roomId);
        return;
    }
    await io.in(socketId).socketsLeave(roomId);
};
const getConnectedSocketCount = async (io) => {
    try {
        return (await io.of('/').fetchSockets()).length;
    } catch {
        return io.of('/').sockets.size;
    }
};
const getActiveRoomCount = async () => (await roomService.getStats()).totalRooms;

const emitQueueSizeNow = async (io) => {
    lastQueueSizeBroadcastAt = Date.now();
    io.emit('queue_size_updated', {
        queueSize: await queueService.getQueueSize()
    });
};

const emitQueueSize = (io, { immediate = false } = {}) => {
    const intervalMs = capacityConfig.queueBroadcastIntervalMs;
    if (immediate || !isLimitEnabled(intervalMs)) {
        if (queueSizeBroadcastTimer) {
            clearTimeout(queueSizeBroadcastTimer);
            queueSizeBroadcastTimer = null;
        }
        void emitQueueSizeNow(io);
        return;
    }

    const elapsed = Date.now() - lastQueueSizeBroadcastAt;
    if (elapsed >= intervalMs) {
        void emitQueueSizeNow(io);
        return;
    }

    if (queueSizeBroadcastTimer) return;
    queueSizeBroadcastTimer = setTimeout(() => {
        queueSizeBroadcastTimer = null;
        void emitQueueSizeNow(io);
    }, intervalMs - elapsed);
    queueSizeBroadcastTimer.unref?.();
};

const getCapacitySnapshot = async (io) => ({
    connectedSockets: await getConnectedSocketCount(io),
    queueSize: await queueService.getQueueSize(),
    activeRooms: await getActiveRoomCount(),
    limits: capacityConfig
});

const hasConnectionCapacity = async (io) => (
    !isLimitEnabled(capacityConfig.maxConnectedSockets)
    || await getConnectedSocketCount(io) <= capacityConfig.maxConnectedSockets
);

const hasQueueCapacity = async (socketId) => (
    await queueService.getUserStatus(socketId) === 'waiting'
    || !isLimitEnabled(capacityConfig.maxQueueSize)
    || await queueService.getQueueSize() < capacityConfig.maxQueueSize
);

const hasRoomCapacity = async () => (
    !isLimitEnabled(capacityConfig.maxActiveRooms)
    || await getActiveRoomCount() < capacityConfig.maxActiveRooms
);

const schedulePairing = (io) => {
    if (pairingScheduled) return;
    pairingScheduled = true;
    setImmediate(() => {
        pairingScheduled = false;
        void checkAndPairUsers(io);
    });
};

const getRoomContext = async (socket, payload = {}, { requirePartner = true } = {}) => {
    const room = await roomService.getRoomByUser(socket.id);
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

    const partnerId = await roomService.getPartner(room.roomId, socket.id);
    if (requirePartner && !partnerId) {
        socket.emit('error', { message: 'Partner not available' });
        return null;
    }

    return { room, roomId: room.roomId, partnerId };
};

const notifyRoomClosed = async (io, room, message) => {
    await Promise.all(roomService.getParticipants(room).map(async ({ socketId }) => {
        await leaveSocketRoom(io, socketId, room.roomId);
        await queueService.removeUser(socketId);
        io.to(socketId).emit('partner_disconnected', {
            message,
            roomId: room.roomId,
            sessionVersion: room.sessionVersion || 1
        });
    }));
};

const startRoomCleanup = (io) => {
    if (roomCleanupTimer || ROOM_CLEANUP_INTERVAL_MS <= 0) return;

    roomCleanupTimer = setInterval(async () => {
        const expiredRooms = await roomService.closeExpiredRooms();
        if (expiredRooms.length === 0) return;

        await Promise.all(expiredRooms.map((room) => notifyRoomClosed(io, room, 'Room expired due to inactivity')));
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

const isSocketAvailableForQueueMatch = async (io, socketId) => (
    await socketExists(io, socketId)
    && !(await roomService.getRoomByUser(socketId))
);

const attachQueuedUserToWaitingRoom = async (io, room, { excludeSocketIds = new Set() } = {}) => {
    if (!room) return null;

    const requester = roomService.getSingleParticipant(room);
    if (!requester?.socketId) return null;

    if (!await socketExists(io, requester.socketId)) {
        await queueService.removeUser(requester.socketId);
        await roomService.closeRoom(room.roomId);
        return null;
    }

    const excluded = new Set([
        requester.socketId,
        ...(await roomService.getBlockedPartnerIds(room.roomId)),
        ...excludeSocketIds
    ]);

    const newPartner = await queueService.takeNextUser({
        excludeSocketIds: excluded,
        isAvailable: (socketId) => isSocketAvailableForQueueMatch(io, socketId)
    });

    if (!newPartner) return null;

    if (!await socketExists(io, newPartner.socketId)) {
        await queueService.removeUser(newPartner.socketId);
        return null;
    }

    await roomService.bumpSessionVersion(room.roomId);
    const updatedRoom = await roomService.getRoom(room.roomId);
    if (!updatedRoom) {
        await queueService.requeueUser(newPartner, { front: true });
        return null;
    }

    const attachedPartner = await roomService.attachParticipant(updatedRoom.roomId, newPartner);
    if (!attachedPartner) {
        await queueService.requeueUser(newPartner, { front: true });
        return null;
    }

    await queueService.setUserStatus(requester.socketId, 'paired');
    await queueService.setUserStatus(newPartner.socketId, 'paired');
    await joinSocketRoom(io, newPartner.socketId, updatedRoom.roomId);

    emitPeerReset(io, requester.socketId, {
        roomId: updatedRoom.roomId,
        sessionVersion: updatedRoom.sessionVersion,
        reason: 'partner_change',
        message: 'Preparing a fresh peer connection'
    });
    emitMatchedPair(io, updatedRoom, requester, attachedPartner, { reconnect: true });
    return { room: updatedRoom, requester, partner: attachedPartner };
};

const fillWaitingRooms = async (io, { onlyRoomId = null, excludeSocketIds = new Set() } = {}) => {
    const rooms = onlyRoomId
        ? [await roomService.getRoom(onlyRoomId)].filter(Boolean)
        : await roomService.getWaitingRooms();

    let attachedCount = 0;
    for (const room of rooms) {
        if (await attachQueuedUserToWaitingRoom(io, room, { excludeSocketIds })) {
            attachedCount += 1;
        }
    }

    return attachedCount;
};

/**
 * Register all socket event handlers
 * @param {Server} io - Socket.IO server instance
 */
export const registerSocketControllers = (io) => {
    startRoomCleanup(io);

    io.on('connection', async (socket) => {
        if (!await hasConnectionCapacity(io)) {
            socket.emit('capacity_reached', {
                message: 'Server is at capacity. Please try again shortly.',
                retryAfterMs: capacityConfig.loadSheddingRetryAfterMs,
                capacity: await getCapacitySnapshot(io)
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
        socket.on('join_queue', async (data) => {
            try {
                const rawUserData = data?.userData || {};
                if (!isValidUserData(rawUserData)) {
                    socket.emit('error', { message: 'Invalid user data' });
                    return;
                }

                if (!await hasQueueCapacity(socket.id)) {
                    socket.emit('capacity_reached', {
                        message: 'Queue is full. Please try again shortly.',
                        retryAfterMs: capacityConfig.loadSheddingRetryAfterMs,
                        capacity: await getCapacitySnapshot(io)
                    });
                    return;
                }

                if (await roomService.getRoomByUser(socket.id)) {
                    await handleUserDisconnect(io, socket.id, { reason: 'joining_queue' });
                }

                const userData = sanitizeUserData(rawUserData);

                // Add user to queue
                const queuedUser = await queueService.addToQueue(socket.id, userData);
                if (!queuedUser) {
                    socket.emit('error', { message: 'Unable to join queue' });
                    return;
                }

                // Emit queue joined confirmation
                const queuePosition = await queueService.getQueuePosition(socket.id);
                socket.emit('queue_joined', {
                    message: 'You have joined the queue',
                    queuePosition,
                    queueSize: await queueService.getQueueSize()
                });

                // Broadcast queue size to all connected users
                emitQueueSize(io);

                // Attempt to pair users
                await checkAndPairUsers(io);
            } catch (error) {
                console.error('Error in join_queue:', error.message);
                socket.emit('error', { message: 'Error joining queue' });
            }
        });

        /**
         * User leaves queue
         * Event: leave_queue
         */
        socket.on('leave_queue', async () => {
            try {
                if (await queueService.removeFromQueue(socket.id)) {
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
            void handleNextPartner(io, socket, data);
        });

        /**
         * Get current queue status
         * Event: get_queue_status
         */
        socket.on('get_queue_status', async () => {
            try {
                socket.emit('queue_status', {
                    queueSize: await queueService.getQueueSize(),
                    userQueuePosition: await queueService.getQueuePosition(socket.id),
                    stats: await queueService.getStats()
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
        socket.on('send_message', async (data) => {
            try {
                if (!isValidMessage(data?.message)) {
                    socket.emit('error', { message: 'Invalid message' });
                    return;
                }
                const message = normalizeMessage(data.message);

                const context = await getRoomContext(socket, data);
                if (!context) return;

                // Store message
                await roomService.addMessage(context.roomId, socket.id, message);

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
        socket.on('send_offer', async (data) => {
            try {
                if (!isValidOffer(data?.offer)) {
                    socket.emit('error', { message: 'Invalid offer format' });
                    return;
                }

                const context = await getRoomContext(socket, data);
                if (!context) return;

                // Store offer
                await roomService.storeOffer(context.roomId, socket.id, data.offer);

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
        socket.on('send_answer', async (data) => {
            try {
                if (!isValidAnswer(data?.answer)) {
                    socket.emit('error', { message: 'Invalid answer format' });
                    return;
                }

                const context = await getRoomContext(socket, data);
                if (!context) return;

                // Store answer
                await roomService.storeAnswer(context.roomId, socket.id, data.answer);

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
        socket.on('send_ice_candidate', async (data) => {
            try {
                if (!isValidICECandidate(data?.candidate)) {
                    socket.emit('error', { message: 'Invalid ICE candidate format' });
                    return;
                }

                const context = await getRoomContext(socket, data);
                if (!context) return;

                // Store ICE candidate
                await roomService.addICECandidate(context.roomId, socket.id, data.candidate);

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
        socket.on('get_room_info', async () => {
            try {
                const room = await roomService.getRoomByUser(socket.id);
                if (room) {
                    const partner = await roomService.getPartner(room.roomId, socket.id);
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
        socket.on('get_room_stats', async () => {
            try {
                if (!isAuthorizedAdmin(socket)) {
                    socket.emit('error', { message: 'Unauthorized' });
                    return;
                }

                socket.emit('room_stats', {
                    ...await roomService.getStats({ includeRooms: true }),
                    queue: await queueService.getStats(),
                    capacity: await getCapacitySnapshot(io)
                });
            } catch (error) {
                console.error('Error in get_room_stats:', error.message);
            }
        });

        /**
         * Disconnect event - Clean up when user leaves
         */
        socket.on('disconnect', () => {
            void handleUserDisconnect(io, socket.id, { reason: 'socket_disconnect' });
        });

        /**
         * Manual disconnect event
         * Event: disconnect_room
         */
        socket.on('disconnect_room', () => {
            void handleUserDisconnect(io, socket.id, { reason: 'manual_disconnect' });
        });
    });
};

const handleNextPartner = async (io, socket, data = {}) => {
    try {
        const lockResult = await lockService.run(`next-partner:${socket.id}`, 10000, async () => {
            const initialRoom = await roomService.getRoomByUser(socket.id);
            if (!initialRoom) {
                socket.emit('error', { message: 'Not in any room' });
                return;
            }

            const roomLock = await lockService.run(
                `room-flow:${initialRoom.roomId}`,
                10000,
                async () => {
                    const room = await roomService.getRoomByUser(socket.id);
                    if (!room) {
                        socket.emit('error', { message: 'Not in any room' });
                        return;
                    }

                    if (data.roomId && data.roomId !== room.roomId) return;
                    if (data.sessionVersion !== undefined && Number(data.sessionVersion) !== Number(room.sessionVersion || 1)) return;

                    const currentPartnerId = await roomService.getPartner(room.roomId, socket.id);
                    await queueService.removeUser(socket.id);
                    await queueService.setUserStatus(socket.id, 'searching');

                    if (!currentPartnerId) {
                        socket.emit('next_partner_waiting', {
                            roomId: room.roomId,
                            sessionVersion: room.sessionVersion || 1,
                            message: 'Looking for a new partner...',
                            queueSize: await queueService.getQueueSize()
                        });
                        await fillWaitingRooms(io, { onlyRoomId: room.roomId });
                        emitQueueSize(io);
                        return;
                    }

                    const currentPartner = roomService.getParticipant(room, currentPartnerId);
                    const partnerConnected = await socketExists(io, currentPartnerId);

                    await roomService.addBlockedPartner(room.roomId, currentPartnerId);
                    await roomService.bumpSessionVersion(room.roomId);
                    const waitingRoom = await roomService.getRoom(room.roomId);
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

                    await leaveSocketRoom(io, currentPartnerId, waitingRoom.roomId);
                    const detachedPartner = await roomService.detachParticipant(waitingRoom.roomId, currentPartnerId) || currentPartner;

                    socket.emit('next_partner_waiting', {
                        roomId: waitingRoom.roomId,
                        sessionVersion: waitingRoom.sessionVersion,
                        message: 'Looking for a new partner...',
                        queueSize: await queueService.getQueueSize()
                    });

                    if (partnerConnected && detachedPartner?.socketId) {
                        await queueService.requeueUser({
                            ...detachedPartner,
                            socketId: currentPartnerId,
                            chatMode: detachedPartner.chatMode || room.chatMode
                        });

                        io.to(currentPartnerId).emit('partner_waiting', {
                            oldRoomId: waitingRoom.roomId,
                            oldSessionVersion: waitingRoom.sessionVersion,
                            message: 'Waiting for another user...',
                            queueSize: await queueService.getQueueSize()
                        });
                        io.to(currentPartnerId).emit('queue_joined', {
                            message: 'Waiting for another user...',
                            queuePosition: await queueService.getQueuePosition(currentPartnerId),
                            queueSize: await queueService.getQueueSize()
                        });
                    } else {
                        await queueService.removeUser(currentPartnerId);
                    }

                    await fillWaitingRooms(io, {
                        onlyRoomId: waitingRoom.roomId,
                        excludeSocketIds: new Set([currentPartnerId])
                    });
                    await checkAndPairUsers(io);
                    emitQueueSize(io);
                },
                { retries: 5, retryDelayMs: 40 }
            );

            if (!roomLock.acquired) {
                socket.emit('next_partner_waiting', {
                    roomId: initialRoom.roomId,
                    sessionVersion: initialRoom.sessionVersion || 1,
                    message: 'Looking for a new partner...',
                    queueSize: await queueService.getQueueSize()
                });
            }
        });

        if (!lockResult.acquired) {
            socket.emit('next_partner_waiting', {
                message: 'Looking for a new partner...',
                queueSize: await queueService.getQueueSize()
            });
        }
    } catch (error) {
        console.error('Error in next_partner:', error.message);
        socket.emit('error', { message: 'Error finding next partner' });
    }
};

/**
 * Handle user disconnect - Clean up queue and rooms
 * @param {Server} io - Socket.IO server
 * @param {string} socketId - Disconnected user's socket ID
 */
const handleUserDisconnect = async (io, socketId, options = {}) => {
    const { reason = 'disconnect', attempt = 0 } = options;
    const room = await roomService.getRoomByUser(socketId);
    const removedQueueUser = await queueService.removeUser(socketId);
    if (!room && !removedQueueUser) return;

    console.log(`🔴 User disconnected: ${socketId}`);

    if (room) {
        const roomLock = await lockService.run(
            `room-flow:${room.roomId}`,
            10000,
            async () => {
                const activeRoom = await roomService.getRoomByUser(socketId);
                if (!activeRoom) return;

                const partner = await roomService.getPartner(activeRoom.roomId, socketId);
                await leaveSocketRoom(io, socketId, activeRoom.roomId);

                if (partner) {
                    await leaveSocketRoom(io, partner, activeRoom.roomId);
                    io.to(partner).emit('partner_disconnected', {
                        message: reason === 'joining_queue' ? 'Your partner is searching for a new chat' : 'Your partner has disconnected',
                        roomId: activeRoom.roomId,
                        sessionVersion: activeRoom.sessionVersion || 1
                    });
                    await queueService.removeUser(partner);
                }

                await roomService.closeRoom(activeRoom.roomId);
            },
            { retries: 5, retryDelayMs: 50 }
        );

        if (!roomLock.acquired && attempt < 3) {
            const retryTimer = setTimeout(() => {
                void handleUserDisconnect(io, socketId, { reason, attempt: attempt + 1 });
            }, 150);
            retryTimer.unref?.();
            return;
        }
    }

    // Update stats
    emitQueueSize(io);
};

/**
 * Check queue and pair users if possible
 * @param {Server} io - Socket.IO server
 */
const checkAndPairUsers = async (io) => {
    await lockService.run('matchmaking', 10000, async () => {
        const removedStaleUsers = await queueService.pruneUnavailableUsers((socketId) => (
            isSocketAvailableForQueueMatch(io, socketId)
        ));
        const filledWaitingRooms = await fillWaitingRooms(io);
        let pairedRooms = 0;

        while (
            await queueService.getQueueSize() >= 2
            && pairedRooms < capacityConfig.maxPairsPerTick
            && await hasRoomCapacity()
        ) {
            const pair = await queueService.getPair();
            if (!pair) break;

            const [user1, user2] = pair;
            const socket1Exists = await socketExists(io, user1.socketId);
            const socket2Exists = await socketExists(io, user2.socketId);

            if (user1.socketId === user2.socketId) {
                if (socket1Exists) await queueService.requeueUser(user1, { front: true });
                continue;
            }

            if (!socket1Exists || !socket2Exists) {
                if (socket1Exists) await queueService.requeueUser(user1, { front: true });
                if (socket2Exists) await queueService.requeueUser(user2, { front: true });
                if (!socket1Exists) await queueService.removeUser(user1.socketId);
                if (!socket2Exists) await queueService.removeUser(user2.socketId);
                continue;
            }

            const [user1Room, user2Room] = await Promise.all([
                roomService.getRoomByUser(user1.socketId),
                roomService.getRoomByUser(user2.socketId)
            ]);

            if (user1Room || user2Room) {
                if (!user1Room) await queueService.requeueUser(user1, { front: true });
                if (!user2Room) await queueService.requeueUser(user2, { front: true });
                continue;
            }

            const roomId = generateRoomId();
            const room = await roomService.createRoom(
                roomId,
                user1.socketId,
                user2.socketId,
                user1,
                user2
            );

            await Promise.all([
                joinSocketRoom(io, user1.socketId, roomId),
                joinSocketRoom(io, user2.socketId, roomId)
            ]);

            emitMatchedPair(io, room, user1, user2);

            console.log(`Users paired in room: ${roomId}`);
            pairedRooms += 1;
        }

        if (removedStaleUsers > 0 || filledWaitingRooms > 0 || pairedRooms > 0) {
            emitQueueSize(io);
        }

        if (
            await queueService.getQueueSize() >= 2
            && pairedRooms >= capacityConfig.maxPairsPerTick
            && await hasRoomCapacity()
        ) {
            schedulePairing(io);
        }
    });
};
