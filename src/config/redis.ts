import Redis from 'ioredis';
import { config } from './index';

export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redis.ping();
    console.log('✅ Redis connection verified');
  } catch (err) {
    console.error('❌ Redis connection failed:', err);
    throw err;
  }
};