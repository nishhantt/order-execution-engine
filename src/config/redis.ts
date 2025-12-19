import Redis from 'ioredis';
import { config } from './index';
import { createChildLogger } from '../utils/logger';

const logger = createChildLogger('redis');

// Use REDIS_URL if available (Railway), otherwise use individual config
export const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('Redis max retries reached');
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    })
  : new Redis({
      host: config.redis.host,
      port: config.redis.port,
      maxRetriesPerRequest: null,
    });

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis error');
});

redis.on('ready', () => {
  logger.info('Redis is ready');
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redis.ping();
    logger.info('Redis connection verified');
  } catch (err) {
    logger.error({ err }, 'Failed to connect to Redis');
    throw err;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  await redis.quit();
  logger.info('Redis connection closed');
};