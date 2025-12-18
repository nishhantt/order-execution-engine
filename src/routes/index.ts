import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.routes';
import { orderRoutes } from './order.routes';
import { WebSocketManager } from '../services/websocket';
import { logger } from '../utils/logger';

export const registerRoutes = async (
  fastify: FastifyInstance,
  wsManager: WebSocketManager
) => {
  // Register health routes
  await fastify.register(healthRoutes);
  logger.info('Health routes registered');

  // Register order routes
  await fastify.register(async (instance) => {
    await orderRoutes(instance, wsManager);
  });
  logger.info('Order routes registered');
};