const redisService = require('../services/redis.service');

const rateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    keyPrefix = 'rate-limit',
    message = 'Too many requests, please try again later.'
  } = options;

  return async (req, res, next) => {
    const key = `${keyPrefix}:${req.ip}`;
    
    try {
      const current = await redisService.redis.incr(key);
      
      // Set expiry on first request
      if (current === 1) {
        await redisService.redis.expire(key, Math.floor(windowMs / 1000));
      }

      // Get TTL for the rate limit key
      const ttl = await redisService.redis.ttl(key);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));
      res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + ttl);
      res.setHeader('Retry-After', ttl);

      if (current > max) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: message,
          retryAfter: ttl,
          limit: max,
          remaining: 0,
          reset: Math.floor(Date.now() / 1000) + ttl
        });
      }

      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      next(); // Continue on error to prevent blocking legitimate requests
    }
  };
};

module.exports = rateLimit; 