const store = {};
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // requests per window
export const rateLimiter = (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    // Clean up expired entries
    Object.keys(store).forEach((k) => {
        const entry = store[k];
        if (entry && entry.resetTime < now) {
            delete store[k];
        }
    });
    if (!store[key]) {
        store[key] = {
            count: 1,
            resetTime: now + WINDOW_MS,
        };
        return next();
    }
    if (store[key].count >= MAX_REQUESTS) {
        return res.status(429).json({
            error: {
                message: 'Too many requests',
                statusCode: 429,
                retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
            },
        });
    }
    store[key].count++;
    next();
};
//# sourceMappingURL=rateLimiter.js.map