import { Queue, QueueOptions } from 'bullmq';
import { config } from '../config';
import { logger } from '../utils/logger';
import { CreateOrderRequest } from '../types/order.types';
import Redis from 'ioredis';

export interface OrderJobData extends CreateOrderRequest {
  orderId: string;
  timestamp: number;
}

// Create Redis connection for BullMQ using environment variable
const connection = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    })
  : new Redis({
      host: config.redis.host,
      port: config.redis.port,
      maxRetriesPerRequest: null,
    });

const queueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: config.orderProcessing.maxRetryAttempts,
    backoff: {
      type: 'exponential',
      delay: config.orderProcessing.retryBackoffMs,
    },
    removeOnComplete: {
      age: 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 86400,
    },
  },
};

export const orderQueue = new Queue<OrderJobData>('order-execution', queueOptions);

orderQueue.on('error', (error) => {
  logger.error({ error }, 'Order queue error');
});

orderQueue.on('cleaned', (jobs, type) => {
  logger.info({ count: jobs.length, type }, 'Order queue cleaned');
});

logger.info('Order queue initialized');

export const addOrderToQueue = async (jobData: OrderJobData): Promise<string> => {
  const job = await orderQueue.add('process-order', jobData, {
    jobId: jobData.orderId,
  });

  logger.info({ orderId: jobData.orderId, jobId: job.id }, 'Order added to queue');

  return job.id!;
};