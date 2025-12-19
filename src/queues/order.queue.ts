import { Queue, QueueOptions } from 'bullmq';
import { logger } from '../utils/logger';
import { CreateOrderRequest } from '../types/order.types';
import Redis from 'ioredis';

export interface OrderJobData extends CreateOrderRequest {
  orderId: string;
  timestamp: number;
}

console.log('🔍 Queue REDIS_URL:', process.env.REDIS_URL ? 'EXISTS' : 'MISSING');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

const queueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 86400 },
  },
};

export const orderQueue = new Queue<OrderJobData>('order-execution', queueOptions);

orderQueue.on('error', (error) => {
  logger.error({ error }, 'Order queue error');
});

logger.info('Order queue initialized');

export const addOrderToQueue = async (jobData: OrderJobData): Promise<string> => {
  const job = await orderQueue.add('process-order', jobData, { jobId: jobData.orderId });
  logger.info({ orderId: jobData.orderId }, 'Order added to queue');
  return job.id!;
};