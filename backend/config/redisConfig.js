const parseBoolean = (value, fallback = false) => {
    if (value === undefined || value === null || value === '') return fallback;
    return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL || '';
const defaultEnabled = Boolean(redisUrl);

export const redisConfig = {
    url: redisUrl,
    keyPrefix: (process.env.REDIS_KEY_PREFIX || 'omegal').replace(/[^a-zA-Z0-9:_-]/g, ''),
    adapterEnabled: parseBoolean(process.env.REDIS_SOCKET_ADAPTER_ENABLED, defaultEnabled),
    stateEnabled: parseBoolean(process.env.REDIS_STATE_ENABLED, defaultEnabled),
    connectTimeoutMs: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 10000)
};

export const isRedisAdapterEnabled = () => Boolean(redisConfig.url && redisConfig.adapterEnabled);

export const isRedisStateEnabled = () => Boolean(redisConfig.url && redisConfig.stateEnabled);

export const redisKey = (...parts) => [redisConfig.keyPrefix, ...parts].join(':');
