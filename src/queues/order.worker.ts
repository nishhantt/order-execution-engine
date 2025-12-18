import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { config } from '../config';
import { logger } from '../utils/logger';
import { OrderProcessor } from '../services/order-processor';
import { WebSocketManager } from '../services/websocket';
import { OrderJobData } from './order.queue';

export class OrderWorker {
  private worker: Worker;
  private orderProcessor: OrderProcessor;

  constructor(wsManager: WebSocketManager) {
    this.orderProcessor = new OrderProcessor(wsManager);

    this.worker = new Worker<OrderJobData>(
      'order-execution',
      async (job: Job<OrderJobData>) => {
        return this.processJob(job);
      },
      {
        connection: redis,
        concurrency: config.queue.concurrency,
        limiter: {
          max: config.queue.maxJobsPerMinute,
          duration: 60000, // 1 minute
        },
      }
    );

    this.setupEventHandlers();

    logger.info(
      { concurrency: config.queue.concurrency, maxJobsPerMinute: config.queue.maxJobsPerMinute },
      'Order worker initialized'
    );
  }

  private async processJob(job: Job<OrderJobData>): Promise<void> {
    const { orderId, orderType, tokenIn, tokenOut, amountIn } = job.data;

    logger.info(
      { jobId: job.id, orderId, attempt: job.attemptsMade + 1 },
      'Processing order job'
    );

    await this.orderProcessor.processOrder(orderId, orderType, tokenIn, tokenOut, amountIn);
  }

  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      logger.info({ jobId: job.id, orderId: job.data.orderId }, 'Order job completed');
    });

    this.worker.on('failed', (job, error) => {
      logger.error(
        { jobId: job?.id, orderId: job?.data.orderId, error: error.message },
        'Order job failed'
      );
    });

    this.worker.on('error', (error) => {
      logger.error({ error }, 'Worker error');
    });

    this.worker.on('stalled', (jobId) => {
      logger.warn({ jobId }, 'Job stalled');
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
    logger.info('Order worker closed');
  }
}