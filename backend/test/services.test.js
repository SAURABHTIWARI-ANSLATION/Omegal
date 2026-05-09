import test from 'node:test';
import assert from 'node:assert/strict';

import queueService from '../services/queueService.js';
import roomService from '../services/roomService.js';
import {
    isValidAnswer,
    isValidICECandidate,
    isValidMessage,
    isValidOffer,
    isValidUserData,
    normalizeMessage,
    sanitizeUserData
} from '../utils/validations.js';

test('queue state can be cleared after users are paired', () => {
    queueService.clear();

    queueService.addToQueue('socket-a', {});
    queueService.addToQueue('socket-b', {});
    const pair = queueService.getPair();

    assert.equal(pair.length, 2);
    assert.equal(queueService.getUserStatus('socket-a'), 'paired');
    assert.equal(queueService.getUserStatus('socket-b'), 'paired');

    queueService.removeUser('socket-a');
    queueService.removeUser('socket-b');

    assert.equal(queueService.getUserStatus('socket-a'), null);
    assert.equal(queueService.getUserStatus('socket-b'), null);
});

test('queue exposes positions and prunes unavailable waiting users', () => {
    queueService.clear();

    queueService.addToQueue('socket-a', {});
    queueService.addToQueue('socket-b', {});
    queueService.addToQueue('socket-c', {});

    assert.equal(queueService.getQueuePosition('socket-b'), 2);

    const removed = queueService.pruneUnavailableUsers((socketId) => socketId !== 'socket-b');

    assert.equal(removed, 1);
    assert.equal(queueService.getQueuePosition('socket-c'), 2);
    assert.equal(queueService.getUserStatus('socket-b'), null);
});

test('room service caps retained room messages and hides room details by default', () => {
    roomService.clear();
    const room = roomService.createRoom('room_test', 'socket-a', 'socket-b', {}, {});

    for (let index = 0; index < roomService.maxMessagesPerRoom + 5; index += 1) {
        roomService.addMessage(room.roomId, 'socket-a', `message ${index}`);
    }

    assert.equal(room.messages.length, roomService.maxMessagesPerRoom);
    assert.deepEqual(roomService.getStats(), { totalRooms: 1, totalUsers: 2 });
    assert.equal(roomService.getStats({ includeRooms: true }).rooms.length, 1);
});

test('room service rejects non-participant writes and expires inactive rooms', () => {
    roomService.clear();
    const room = roomService.createRoom('room_expire', 'socket-a', 'socket-b', {}, {});

    assert.equal(roomService.addMessage(room.roomId, 'socket-x', 'hello'), false);
    assert.equal(roomService.storeOffer(room.roomId, 'socket-x', { type: 'offer', sdp: 'v=0' }), false);
    assert.equal(roomService.storeAnswer(room.roomId, 'socket-x', { type: 'answer', sdp: 'v=0' }), false);
    assert.equal(roomService.addICECandidate(room.roomId, 'socket-x', { candidate: 'candidate:1' }), false);
    assert.equal(room.messages.length, 0);

    assert.equal(roomService.addICECandidate(room.roomId, 'socket-a', { candidate: 'candidate:1' }), true);

    room.lastActivityAt = Date.now() - roomService.maxRoomAgeMs - 1;
    const expiredRooms = roomService.closeExpiredRooms();

    assert.equal(expiredRooms.length, 1);
    assert.equal(roomService.getRoom(room.roomId), null);
    assert.equal(roomService.getRoomByUser('socket-a'), null);
});

test('validations reject oversized signaling and sanitize user data', () => {
    assert.equal(isValidMessage(' hello '), true);
    assert.equal(normalizeMessage(' hello '), 'hello');
    assert.equal(isValidMessage('x'.repeat(1001)), false);

    assert.equal(isValidOffer({ type: 'offer', sdp: 'v=0' }), true);
    assert.equal(isValidOffer({ type: 'offer', sdp: 'x'.repeat(200001) }), false);
    assert.equal(isValidAnswer({ type: 'answer', sdp: 'v=0' }), true);
    assert.equal(isValidICECandidate({ candidate: 'candidate:1', sdpMid: '0', sdpMLineIndex: 0 }), true);
    assert.equal(isValidICECandidate({ candidate: 'x'.repeat(5001) }), false);

    assert.equal(isValidUserData({ chatMode: 'video', interests: ['music'] }), true);
    assert.deepEqual(sanitizeUserData({ chatMode: ' video ', interests: [' music ', ''] }), {
        chatMode: 'video',
        interests: ['music']
    });
    assert.equal(isValidUserData({ 'bad key': 'value' }), false);
});
