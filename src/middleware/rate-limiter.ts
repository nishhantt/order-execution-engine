import { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../config/redis';
import { RateLimitError } from '../utils/errors';
import { logger } from '../utils/logger';

const RATE_LIMIT_WINDOW = 60; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

export const rateLimiter = async (request: FastifyRequest, reply: FastifyReply) => {
  const clientIp = request.ip;
  const key = `rate_limit:${clientIp}`;

  try {
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }

    if (current > RATE_LIMIT_MAX_REQUESTS) {
      logger.warn({ clientIp, requests: current }, 'Rate limit exceeded');
      throw new RateLimitError(`Too many requests. Limit: ${RATE_LIMIT_MAX_REQUESTS} per minute`);
    }

    // Add rate limit headers
    reply.header('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
    reply.header('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT_MAX_REQUESTS - current));
    reply.header('X-RateLimit-Reset', Date.now() + RATE_LIMIT_WINDOW * 1000);
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    // If Redis fails, allow the request (fail open)
    logger.error({ error, clientIp }, 'Rate limiter error');
  }
};