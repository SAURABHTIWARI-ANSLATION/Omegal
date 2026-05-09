const buckets = new Map();

const cleanupExpiredBuckets = (now) => {
    if (buckets.size < 5000) return;

    for (const [key, bucket] of buckets.entries()) {
        if (bucket.resetAt <= now) {
            buckets.delete(key);
        }
    }
};

export const consumeRateLimit = (key, { windowMs = 60_000, max = 60 } = {}) => {
    const now = Date.now();
    cleanupExpiredBuckets(now);

    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: Math.max(max - 1, 0), retryAfterMs: 0 };
    }

    current.count += 1;

    if (current.count > max) {
        return {
            allowed: false,
            remaining: 0,
            retryAfterMs: Math.max(current.resetAt - now, 0)
        };
    }

    return {
        allowed: true,
        remaining: Math.max(max - current.count, 0),
        retryAfterMs: 0
    };
};

export const createMemoryRateLimiter = ({ windowMs = 60_000, max = 120, keyGenerator } = {}) => {
    return (req, res, next) => {
        const key = keyGenerator ? keyGenerator(req) : req.ip;
        const result = consumeRateLimit(`http:${key}`, { windowMs, max });

        if (!result.allowed) {
            res.setHeader('Retry-After', String(Math.ceil(result.retryAfterMs / 1000)));
            res.status(429).json({ error: 'Too many requests' });
            return;
        }

        next();
    };
};
