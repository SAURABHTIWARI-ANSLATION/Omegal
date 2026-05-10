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

test('queue state can be cleared after users are paired', async () => {
    await queueService.clear();

    await queueService.addToQueue('socket-a', {});
    await queueService.addToQueue('socket-b', {});
    const pair = await queueService.getPair();

    assert.equal(pair.length, 2);
    assert.equal(await queueService.getUserStatus('socket-a'), 'paired');
    assert.equal(await queueService.getUserStatus('socket-b'), 'paired');

    await queueService.removeUser('socket-a');
    await queueService.removeUser('socket-b');

    assert.equal(await queueService.getUserStatus('socket-a'), null);
    assert.equal(await queueService.getUserStatus('socket-b'), null);
});

test('queue exposes positions and prunes unavailable waiting users', async () => {
    await queueService.clear();

    await queueService.addToQueue('socket-a', {});
    await queueService.addToQueue('socket-b', {});
    await queueService.addToQueue('socket-c', {});

    assert.equal(await queueService.getQueuePosition('socket-b'), 2);

    const removed = await queueService.pruneUnavailableUsers((socketId) => socketId !== 'socket-b');

    assert.equal(removed, 1);
    assert.equal(await queueService.getQueuePosition('socket-c'), 2);
    assert.equal(await queueService.getUserStatus('socket-b'), null);
});

test('queue can restore a shifted paired user without dropping their turn', async () => {
    await queueService.clear();

    await queueService.addToQueue('socket-a', { chatMode: 'text' });
    await queueService.addToQueue('socket-b', { chatMode: 'text' });
    const [stillConnected] = await queueService.getPair();
    const originalJoinedAt = stillConnected.joinedAt;

    assert.equal(await queueService.getUserStatus('socket-a'), 'paired');

    const restored = await queueService.requeueUser(stillConnected, { front: true });

    assert.equal(restored.socketId, 'socket-a');
    assert.equal(restored.status, 'waiting');
    assert.equal(restored.joinedAt, originalJoinedAt);
    assert.equal(await queueService.getUserStatus('socket-a'), 'waiting');
    assert.equal(await queueService.getQueuePosition('socket-a'), 1);
});

test('queue can pick the next eligible user while skipping excluded sockets', async () => {
    await queueService.clear();

    await queueService.addToQueue('socket-old-partner', { chatMode: 'video' });
    await queueService.addToQueue('socket-new-partner', { chatMode: 'video' });

    const nextUser = await queueService.takeNextUser({
        excludeSocketIds: new Set(['socket-old-partner']),
        isAvailable: (socketId) => socketId !== 'socket-missing'
    });

    assert.equal(nextUser.socketId, 'socket-new-partner');
    assert.equal(await queueService.getUserStatus('socket-new-partner'), 'paired');
    assert.equal(await queueService.getQueuePosition('socket-old-partner'), 1);
});

test('room service caps retained room messages and hides room details by default', async () => {
    await roomService.clear();
    const room = await roomService.createRoom('room_test', 'socket-a', 'socket-b', {}, {});

    for (let index = 0; index < roomService.maxMessagesPerRoom + 5; index += 1) {
        await roomService.addMessage(room.roomId, 'socket-a', `message ${index}`);
    }

    assert.equal((await roomService.getRoom(room.roomId)).messages.length, roomService.maxMessagesPerRoom);
    assert.deepEqual(await roomService.getStats(), { totalRooms: 1, totalUsers: 2 });
    assert.equal((await roomService.getStats({ includeRooms: true })).rooms.length, 1);
});

test('room service supports stable room partner replacement', async () => {
    await roomService.clear();

    const room = await roomService.createRoom(
        'room_next',
        'socket-requester',
        'socket-old-partner',
        { chatMode: 'video' },
        { chatMode: 'video' }
    );

    await roomService.addBlockedPartner(room.roomId, 'socket-old-partner');
    const nextVersion = await roomService.bumpSessionVersion(room.roomId);
    const detached = await roomService.detachParticipant(room.roomId, 'socket-old-partner');

    assert.equal(nextVersion, 2);
    assert.equal(detached.socketId, 'socket-old-partner');
    assert.equal((await roomService.getRoomByUser('socket-requester')).roomId, room.roomId);
    assert.equal(await roomService.getRoomByUser('socket-old-partner'), null);
    assert.equal((await roomService.getWaitingRooms()).length, 1);
    assert.deepEqual(await roomService.getBlockedPartnerIds(room.roomId), ['socket-old-partner']);

    const attached = await roomService.attachParticipant(room.roomId, {
        socketId: 'socket-new-partner',
        chatMode: 'video'
    });

    assert.equal(attached.socketId, 'socket-new-partner');
    assert.equal(await roomService.getPartner(room.roomId, 'socket-requester'), 'socket-new-partner');
    assert.equal((await roomService.getRoom(room.roomId)).status, 'active');
});

test('room service rejects non-participant writes and expires inactive rooms', async () => {
    await roomService.clear();
    const room = await roomService.createRoom('room_expire', 'socket-a', 'socket-b', {}, {});

    assert.equal(await roomService.addMessage(room.roomId, 'socket-x', 'hello'), false);
    assert.equal(await roomService.storeOffer(room.roomId, 'socket-x', { type: 'offer', sdp: 'v=0' }), false);
    assert.equal(await roomService.storeAnswer(room.roomId, 'socket-x', { type: 'answer', sdp: 'v=0' }), false);
    assert.equal(await roomService.addICECandidate(room.roomId, 'socket-x', { candidate: 'candidate:1' }), false);
    assert.equal((await roomService.getRoom(room.roomId)).messages.length, 0);

    assert.equal(await roomService.addICECandidate(room.roomId, 'socket-a', { candidate: 'candidate:1' }), true);

    room.lastActivityAt = Date.now() - roomService.maxRoomAgeMs - 1;
    const expiredRooms = await roomService.closeExpiredRooms();

    assert.equal(expiredRooms.length, 1);
    assert.equal(await roomService.getRoom(room.roomId), null);
    assert.equal(await roomService.getRoomByUser('socket-a'), null);
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
