import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(3000),
  host: z.string().default('0.0.0.0'),

  database: z.object({
    host: z.string().default('localhost'),
    port: z.coerce.number().default(5432),
    user: z.string().default('orderengine'),
    password: z.string().default('dev_password_123'),
    name: z.string().default('order_execution'),
    maxConnections: z.coerce.number().default(20),
  }),

  redis: z.object({
    host: z.string().default('localhost'),
    port: z.coerce.number().default(6379),
  }),

  queue: z.object({
    concurrency: z.coerce.number().default(10),
    maxJobsPerMinute: z.coerce.number().default(100),
  }),

  orderProcessing: z.object({
    maxRetryAttempts: z.coerce.number().default(3),
    retryBackoffMs: z.coerce.number().default(1000),
  }),

  dex: z.object({
    raydiumNetworkDelayMs: z.coerce.number().default(200),
    meteoraNetworkDelayMs: z.coerce.number().default(200),
    swapExecutionDelayMs: z.coerce.number().default(2000),
  }),

  logging: z.object({
  level: z.enum(['silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  prettyLogs: z.coerce.boolean().default(true),
}),
});

export const config = configSchema.parse({
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  host: process.env.HOST,
  database: (() => {
    // Support single DATABASE_URL (Railway/Postgres) or individual DB_* vars
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      try {
        const parsed = new URL(databaseUrl);
        return {
          host: parsed.hostname,
          port: parsed.port ? Number(parsed.port) : undefined,
          user: parsed.username || undefined,
          password: parsed.password || undefined,
          name: parsed.pathname ? parsed.pathname.replace(/^\//, '') : undefined,
          maxConnections: process.env.DB_MAX_CONNECTIONS,
        };
      } catch (e) {
        // fall back to individual vars if parsing fails
      }
    }

    return {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      name: process.env.DB_NAME,
      maxConnections: process.env.DB_MAX_CONNECTIONS,
    };
  })(),
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  queue: {
    concurrency: process.env.QUEUE_CONCURRENCY,
    maxJobsPerMinute: process.env.QUEUE_MAX_JOBS_PER_MINUTE,
  },
  orderProcessing: {
    maxRetryAttempts: process.env.MAX_RETRY_ATTEMPTS,
    retryBackoffMs: process.env.RETRY_BACKOFF_MS,
  },
  dex: {
    raydiumNetworkDelayMs: process.env.RAYDIUM_NETWORK_DELAY_MS,
    meteoraNetworkDelayMs: process.env.METEORA_NETWORK_DELAY_MS,
    swapExecutionDelayMs: process.env.SWAP_EXECUTION_DELAY_MS,
  },
  logging: {
    level: process.env.LOG_LEVEL,
    prettyLogs: process.env.PRETTY_LOGS,
  },
});