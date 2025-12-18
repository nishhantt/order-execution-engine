import { Queue, QueueOptions } from 'bullmq';
import { redis } from '../config/redis';
import { config } from '../config';
import { logger } from '../utils/logger';
import { CreateOrderRequest } from '../types/order.types';

export interface OrderJobData extends CreateOrderRequest {
  orderId: string;
  timestamp: number;
}

const queueOptions: QueueOptions = {
  connection: redis,
  defaultJobOptions: {
    attempts: config.orderProcessing.maxRetryAttempts,
    backoff: {
      type: 'exponential',
      delay: config.orderProcessing.retryBackoffMs,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000,
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
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