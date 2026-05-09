/**
 * Socket Controllers - Handles all socket.io events
 */

import queueService from '../services/queueService.js';
import roomService from '../services/roomService.js';
import { generateRoomId } from '../utils/roomIdGenerator.js';
import {
    isValidSocketId,
    isValidMessage,
    isValidOffer,
    isValidAnswer,
    isValidICECandidate
} from '../utils/validations.js';

/**
 * Register all socket event handlers
 * @param {Server} io - Socket.IO server instance
 */
export const registerSocketControllers = (io) => {
    io.on('connection', (socket) => {
        console.log(`🟢 User connected: ${socket.id}`);

        // Emit connection success
        socket.emit('connection_success', {
            socketId: socket.id,
            message: 'Connected to server'
        });

        // ==================== QUEUE EVENTS ====================

        /**
         * User joins waiting queue
         * Event: join_queue
         * Payload: { userData: { name?, ... } }
         */
        socket.on('join_queue', (data) => {
            try {
                const userData = data?.userData || {};

                // Add user to queue
                queueService.addToQueue(socket.id, userData);

                // Emit queue joined confirmation
                socket.emit('queue_joined', {
                    message: 'You have joined the queue',
                    queuePosition: queueService.waitingQueue.findIndex(u => u.socketId === socket.id) + 1,
                    queueSize: queueService.getQueueSize()
                });

                // Broadcast queue size to all connected users
                io.emit('queue_size_updated', {
                    queueSize: queueService.getQueueSize()
                });

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

                    io.emit('queue_size_updated', {
                        queueSize: queueService.getQueueSize()
                    });
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
                    userQueuePosition: queueService.isInQueue(socket.id)
                        ? queueService.waitingQueue.findIndex(u => u.socketId === socket.id) + 1
                        : null,
                    stats: queueService.getStats()
                });
            } catch (error) {
                console.error('Error in get_queue_status:', error.message);
            }
        });

        // ==================== CHAT EVENTS ====================

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

                const room = roomService.getRoomByUser(socket.id);
                if (!room) {
                    socket.emit('error', { message: 'Not in any room' });
                    return;
                }

                // Store message
                roomService.addMessage(room.roomId, socket.id, data.message);

                // Get partner socket ID
                const partner = roomService.getPartner(room.roomId, socket.id);

                // Send message to partner
                io.to(partner).emit('receive_message', {
                    message: data.message,
                    senderId: socket.id,
                    timestamp: Date.now()
                });

                // Send confirmation to sender
                socket.emit('message_sent', {
                    message: data.message,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error('Error in send_message:', error.message);
                socket.emit('error', { message: 'Error sending message' });
            }
        });

        // ==================== WEBRTC SIGNALING EVENTS ====================

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

                const room = roomService.getRoomByUser(socket.id);
                if (!room) {
                    socket.emit('error', { message: 'Not in any room' });
                    return;
                }

                // Store offer
                roomService.storeOffer(room.roomId, socket.id, data.offer);

                // Get partner
                const partner = roomService.getPartner(room.roomId, socket.id);

                // Send offer to partner
                io.to(partner).emit('receive_offer', {
                    offer: data.offer,
                    senderId: socket.id
                });

                console.log(`📤 Offer sent from ${socket.id} to ${partner}`);
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

                const room = roomService.getRoomByUser(socket.id);
                if (!room) {
                    socket.emit('error', { message: 'Not in any room' });
                    return;
                }

                // Store answer
                roomService.storeAnswer(room.roomId, socket.id, data.answer);

                // Get partner
                const partner = roomService.getPartner(room.roomId, socket.id);

                // Send answer to partner
                io.to(partner).emit('receive_answer', {
                    answer: data.answer,
                    senderId: socket.id
                });

                console.log(`📥 Answer sent from ${socket.id} to ${partner}`);
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

                const room = roomService.getRoomByUser(socket.id);
                if (!room) {
                    socket.emit('error', { message: 'Not in any room' });
                    return;
                }

                // Store ICE candidate
                roomService.addICECandidate(room.roomId, data.candidate);

                // Get partner
                const partner = roomService.getPartner(room.roomId, socket.id);

                // Send candidate to partner
                io.to(partner).emit('receive_ice_candidate', {
                    candidate: data.candidate,
                    senderId: socket.id
                });

                console.log(`❄️ ICE candidate sent from ${socket.id} to ${partner}`);
            } catch (error) {
                console.error('Error in send_ice_candidate:', error.message);
                socket.emit('error', { message: 'Error sending ICE candidate' });
            }
        });

        // ==================== ROOM EVENTS ====================

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
                socket.emit('room_stats', roomService.getStats());
            } catch (error) {
                console.error('Error in get_room_stats:', error.message);
            }
        });

        /**
         * Disconnect event - Clean up when user leaves
         */
        socket.on('disconnect', () => {
            handleUserDisconnect(io, socket.id);
        });

        /**
         * Manual disconnect event
         * Event: disconnect_room
         */
        socket.on('disconnect_room', () => {
            handleUserDisconnect(io, socket.id);
        });
    });
};

/**
 * Handle user disconnect - Clean up queue and rooms
 * @param {Server} io - Socket.IO server
 * @param {string} socketId - Disconnected user's socket ID
 */
const handleUserDisconnect = (io, socketId) => {
    console.log(`🔴 User disconnected: ${socketId}`);

    // Check if user was in queue
    if (queueService.isInQueue(socketId)) {
        queueService.removeFromQueue(socketId);
        io.emit('queue_size_updated', {
            queueSize: queueService.getQueueSize()
        });
    }

    // Check if user was in a room
    const room = roomService.getRoomByUser(socketId);
    if (room) {
        const partner = roomService.getPartner(room.roomId, socketId);

        // Notify partner about disconnection
        if (partner) {
            io.to(partner).emit('partner_disconnected', {
                message: 'Your partner has disconnected',
                roomId: room.roomId
            });
        }

        // Close room
        roomService.closeRoom(room.roomId);
    }

    // Update stats
    io.emit('queue_size_updated', {
        queueSize: queueService.getQueueSize()
    });
};

/**
 * Check queue and pair users if possible
 * @param {Server} io - Socket.IO server
 */
const checkAndPairUsers = (io) => {
    const pair = queueService.getPair();

    if (pair) {
        const [user1, user2] = pair;
        const roomId = generateRoomId();

        // Create room
        roomService.createRoom(
            roomId,
            user1.socketId,
            user2.socketId,
            user1,
            user2
        );

        // Join both users to a socket.io room
        const room = io.of('/').sockets.get(user1.socketId);
        const room2 = io.of('/').sockets.get(user2.socketId);

        if (room) room.join(roomId);
        if (room2) room2.join(roomId);

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

        // Broadcast updated queue size
        io.emit('queue_size_updated', {
            queueSize: queueService.getQueueSize()
        });

        console.log(`✅ Users paired in room: ${roomId}`);

        // Continue checking for more pairs
        checkAndPairUsers(io);
    }
};