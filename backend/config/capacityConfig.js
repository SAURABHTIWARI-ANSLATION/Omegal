const readNumber = (name, fallback) => {
    const value = Number(process.env[name]);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
};

export const capacityConfig = {
    maxConnectedSockets: readNumber('MAX_CONNECTED_SOCKETS', 2000),
    maxQueueSize: readNumber('MAX_QUEUE_SIZE', 2500),
    maxActiveRooms: readNumber('MAX_ACTIVE_ROOMS', 1000),
    maxPairsPerTick: Math.max(1, readNumber('MAX_PAIRS_PER_TICK', 100)),
    queueBroadcastIntervalMs: readNumber('QUEUE_SIZE_BROADCAST_INTERVAL_MS', 1000),
    loadSheddingRetryAfterMs: readNumber('LOAD_SHEDDING_RETRY_AFTER_MS', 5000)
};

export const isLimitEnabled = (value) => Number(value) > 0;
