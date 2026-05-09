const DEFAULT_DEV_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173'
];

const parseOrigins = (value = '') =>
    value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

export const getAllowedOrigins = () => {
    const configuredOrigins = parseOrigins(process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || '');

    if (configuredOrigins.length > 0) {
        return configuredOrigins;
    }

    return process.env.NODE_ENV === 'production' ? [] : DEFAULT_DEV_ORIGINS;
};

export const isOriginAllowed = (origin) => {
    if (!origin) return true;
    return getAllowedOrigins().includes(origin);
};

export const corsOriginDelegate = (origin, callback) => {
    if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
    }

    callback(null, false);
};
