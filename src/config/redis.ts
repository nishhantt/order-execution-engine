import Redis from 'ioredis';

console.log('🔍 REDIS_URL:', process.env.REDIS_URL ? 'EXISTS' : 'MISSING');
console.log('🔍 REDIS_HOST:', process.env.REDIS_HOST);

// ALWAYS use REDIS_URL first, fallback to localhost
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

console.log('🔌 Connecting to Redis:', redisUrl.substring(0, 30) + '...');

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('❌ Redis max retries reached');
      return null;
    }
    return Math.min(times * 50, 2000);
  },
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redis.ping();
    console.log('✅ Redis connection verified');
  } catch (err) {
    console.error('❌ Failed to connect to Redis:', err);
    throw err;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  await redis.quit();
};