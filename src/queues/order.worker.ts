import { Worker, Job } from 'bullmq';
import { logger } from '../utils/logger';
import { OrderProcessor } from '../services/order-processor';
import { WebSocketManager } from '../services/websocket';
import { OrderJobData } from './order.queue';
import Redis from 'ioredis';

export class OrderWorker {
  private worker: Worker;
  private orderProcessor: OrderProcessor;

  constructor(wsManager: WebSocketManager) {
    this.orderProcessor = new OrderProcessor(wsManager);

    console.log('🔍 Worker REDIS_URL:', process.env.REDIS_URL ? 'EXISTS' : 'MISSING');

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

    this.worker = new Worker<OrderJobData>(
      'order-execution',
      async (job: Job<OrderJobData>) => this.processJob(job),
      {
        connection,
        concurrency: 10,
        limiter: { max: 100, duration: 60000 },
      }
    );

    this.setupEventHandlers();
    logger.info('Order worker initialized');
  }

  private async processJob(job: Job<OrderJobData>): Promise<void> {
    const { orderId, orderType, tokenIn, tokenOut, amountIn } = job.data;
    logger.info({ orderId }, 'Processing order job');
    await this.orderProcessor.processOrder(orderId, orderType, tokenIn, tokenOut, amountIn);
  }

  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      logger.info({ orderId: job.data.orderId }, 'Order job completed');
    });

    this.worker.on('failed', (job, error) => {
      logger.error({ orderId: job?.data.orderId, error: error.message }, 'Order job failed');
    });

    this.worker.on('error', (error) => {
      logger.error({ error }, 'Worker error');
    });
  }

  async close(): Promise<void> => {
    await this.worker.close();
  }
}