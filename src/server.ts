import { createApp } from './app';
import { config } from './config';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './utils/logger';
import { OrderWorker } from './queues/order.worker';

let server: any;
let orderWorker: OrderWorker;

async function start() {
  try {
    logger.info('Starting Order Execution Engine...');

    // Connect to database
    await connectDatabase();

    // Connect to Redis
    await connectRedis();

    // Create Fastify app
    const { app, wsManager } = await createApp();

    // Start order worker
    orderWorker = new OrderWorker(wsManager);
    logger.info('Order worker started');

    // Start server
    await app.listen({
      port: config.port,
      host: config.host,
    });

    server = app;

    logger.info(
      {
        port: config.port,
        host: config.host,
        nodeEnv: config.nodeEnv,
      },
      '🚀 Server is running!'
    );

    logger.info(`📡 Health check: http://localhost:${config.port}/health`);
    logger.info(`📊 API: http://localhost:${config.port}/api/orders/execute`);
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received');

  try {
    // Stop accepting new requests
    if (server) {
      await server.close();
      logger.info('HTTP server closed');
    }

    // Stop worker
    if (orderWorker) {
      await orderWorker.close();
      logger.info('Order worker closed');
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception');
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
  shutdown('unhandledRejection');
});

// Start the server
start();