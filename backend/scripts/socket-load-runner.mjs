import { io } from 'socket.io-client';
import { performance } from 'node:perf_hooks';

const readNumber = (name, fallback) => {
    const value = Number(process.env[name]);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
};

const targetUrl = process.env.TARGET_URL || process.env.SOCKET_URL || 'http://localhost:5000';
const totalUsers = readNumber('USERS', 100);
const rampMs = readNumber('RAMP_MS', 10_000);
const holdMs = readNumber('HOLD_MS', 30_000);
const mode = process.env.MODE || 'text';
const transports = (process.env.TRANSPORTS || 'websocket')
    .split(',')
    .map((transport) => transport.trim())
    .filter(Boolean);

const stats = {
    requested: totalUsers,
    connected: 0,
    connectionErrors: 0,
    queueJoined: 0,
    matched: 0,
    capacityReached: 0,
    errors: 0,
    disconnected: 0
};

const sockets = [];
const start = performance.now();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const elapsedSeconds = () => ((performance.now() - start) / 1000).toFixed(1);

const printStats = (label = 'stats') => {
    const active = sockets.filter((socket) => socket.connected).length;
    console.log(`[${elapsedSeconds()}s] ${label}`, {
        ...stats,
        active,
        targetUrl,
        mode
    });
};

const createClient = (index) => {
    const socket = io(targetUrl, {
        transports,
        reconnection: false,
        timeout: readNumber('CONNECT_TIMEOUT_MS', 10_000),
        forceNew: true
    });

    sockets.push(socket);

    socket.on('connect', () => {
        stats.connected += 1;
        socket.emit('join_queue', {
            userData: {
                chatMode: mode,
                loadTestUser: `load-${index}`
            }
        });
    });

    socket.on('connect_error', (error) => {
        stats.connectionErrors += 1;
        if (process.env.DEBUG_LOAD_TEST) {
            console.error(`connect_error[${index}]`, error.message);
        }
    });

    socket.on('queue_joined', () => {
        stats.queueJoined += 1;
    });

    socket.on('matched', () => {
        stats.matched += 1;
    });

    socket.on('capacity_reached', () => {
        stats.capacityReached += 1;
    });

    socket.on('error', (payload) => {
        stats.errors += 1;
        if (process.env.DEBUG_LOAD_TEST) {
            console.error(`socket_error[${index}]`, payload);
        }
    });

    socket.on('disconnect', () => {
        stats.disconnected += 1;
    });
};

console.log('Starting socket load test', {
    targetUrl,
    totalUsers,
    rampMs,
    holdMs,
    mode,
    transports
});

const reporter = setInterval(() => printStats(), readNumber('REPORT_INTERVAL_MS', 1000));
reporter.unref?.();

const rampDelay = totalUsers > 0 ? rampMs / totalUsers : 0;
for (let index = 0; index < totalUsers; index += 1) {
    createClient(index + 1);
    if (rampDelay > 0) {
        await delay(rampDelay);
    }
}

await delay(holdMs);
printStats('final-before-disconnect');
sockets.forEach((socket) => socket.disconnect());
await delay(500);
clearInterval(reporter);
printStats('final');
