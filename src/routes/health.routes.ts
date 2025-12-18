import { FastifyInstance } from 'fastify';
import { pool } from '../config/database';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

export const healthRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/health', async (request, reply) => {
    const health = {
      status: 'ok',
      timestamp: Date.now(),
      uptime: process.uptime(),
      services: {
        database: 'unknown',
        redis: 'unknown',
      },
    };

    // Check database
    try {
      await pool.query('SELECT 1');
      health.services.database = 'connected';
    } catch (error) {
      health.services.database = 'disconnected';
      health.status = 'degraded';
      logger.error({ error }, 'Database health check failed');
    }

    // Check Redis
    try {
      await redis.ping();
      health.services.redis = 'connected';
    } catch (error) {
      health.services.redis = 'disconnected';
      health.status = 'degraded';
      logger.error({ error }, 'Redis health check failed');
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    return reply.status(statusCode).send(health);
  });
};