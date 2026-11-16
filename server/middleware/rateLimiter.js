/**
 * StockWise In-Memory Sliding Window Rate Limiter
 * Zero external dependencies; protects against brute force and denial of service.
 */

const ipRequestMap = new Map();

/**
 * Periodically clean up stale IP records older than 5 minutes to avoid memory leaks
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipRequestMap.entries()) {
    if (now - record.resetTime > 300000) {
      ipRequestMap.delete(key);
    }
  }
}, 60000);

export const createRateLimiter = ({
  windowMs = 60 * 1000,
  max = 200,
  message = 'Too many requests. Please try again later.',
  keyPrefix = 'global',
} = {}) => {
  return (req, res, next) => {
    // In test environment, bypass rate limit so that high-speed automated suites run unimpeded
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const clientIp =
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const mapKey = `${keyPrefix}:${clientIp}`;
    const now = Date.now();

    let record = ipRequestMap.get(mapKey);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      ipRequestMap.set(mapKey, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message,
        retryAfter: `${retryAfterSeconds} seconds`,
      });
    }

    next();
  };
};

// General API rate limiter: 300 requests per minute
export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  message: 'API rate limit exceeded. Please wait a moment before sending more requests.',
  keyPrefix: 'api',
});

// Sensitive Auth endpoint limiter: 50 requests per minute (prevents credential stuffing)
export const authLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 50,
  message: 'Too many authentication attempts. Please wait a minute before trying again.',
  keyPrefix: 'auth',
});
