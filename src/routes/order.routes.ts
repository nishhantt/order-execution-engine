import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { validateOrderRequest } from '../middleware/request-validator';
import { rateLimiter } from '../middleware/rate-limiter';
import { addOrderToQueue } from '../queues/order.queue';
import { WebSocketManager } from '../services/websocket';
import { logger } from '../utils/logger';

export const orderRoutes = async (fastify: FastifyInstance, wsManager: WebSocketManager) => {
  // POST /api/orders/execute - Submit order and upgrade to WebSocket
  fastify.route({
    method: 'POST',
    url: '/api/orders/execute',
    preHandler: [rateLimiter, validateOrderRequest],
    wsHandler: (connection: any, request: any) => {
      // This handles the WebSocket upgrade
      const validatedOrder = (request as any).validatedOrder;
      const orderId = uuidv4();
      const socket = connection.socket;

      logger.info({ orderId, order: validatedOrder }, 'Order received via WebSocket upgrade');

      // Add connection to manager
      wsManager.addConnection(orderId, socket);

      // Send initial confirmation with orderId
      socket.send(
        JSON.stringify({
          type: 'order_accepted',
          orderId,
          status: 'queued',
          message: 'Order queued for processing',
          timestamp: Date.now(),
        })
      );

      // Add order to queue
      addOrderToQueue({
        orderId,
        ...validatedOrder,
        timestamp: Date.now(),
      }).catch((error) => {
        logger.error({ orderId, error }, 'Failed to queue order');
        socket.send(
          JSON.stringify({
            type: 'error',
            orderId,
            error: 'Failed to queue order',
            timestamp: Date.now(),
          })
        );
      });

      // Handle connection close
      socket.on('close', () => {
        logger.info({ orderId }, 'WebSocket connection closed');
        wsManager.removeConnection(orderId);
      });

      // Handle errors
      socket.on('error', (error: Error) => {
        logger.error({ orderId, error }, 'WebSocket error');
        wsManager.removeConnection(orderId);
      });
    },
    handler: async (request, reply) => {
      // This handles regular HTTP POST (if client doesn't upgrade)
      const validatedOrder = (request as any).validatedOrder;
      const orderId = uuidv4();

      logger.info({ orderId, order: validatedOrder }, 'Order received via HTTP');

      await addOrderToQueue({
        orderId,
        ...validatedOrder,
        timestamp: Date.now(),
      });

      return reply.status(202).send({
        orderId,
        status: 'queued',
        message: 'Order queued for processing. Connect to WebSocket for updates.',
        websocketUrl: `/api/orders/${orderId}/stream`,
      });
    },
  });

  // GET /api/orders/:orderId/stream - WebSocket endpoint (fallback)
  fastify.get(
    '/api/orders/:orderId/stream',
    { websocket: true },
    (connection: any, request: any) => {
      const { orderId } = request.params as { orderId: string };
      const socket = connection.socket;

      logger.info({ orderId }, 'WebSocket connection opened (fallback endpoint)');

      wsManager.addConnection(orderId, socket);

      socket.send(
        JSON.stringify({
          type: 'connection_established',
          orderId,
          message: 'Connected to order status stream',
          timestamp: Date.now(),
        })
      );

      socket.on('close', () => {
        logger.info({ orderId }, 'WebSocket connection closed');
        wsManager.removeConnection(orderId);
      });

      socket.on('error', (error: Error) => {
        logger.error({ orderId, error }, 'WebSocket error');
        wsManager.removeConnection(orderId);
      });
    }
  );

  // GET /api/orders/:orderId - Get order status (HTTP fallback)
  fastify.get('/api/orders/:orderId', async (request, reply) => {
    const { orderId } = request.params as { orderId: string };

    const { OrderRepository } = await import('../repositories/order.repository');
    const orderRepo = new OrderRepository();

    const order = await orderRepo.findById(orderId);

    if (!order) {
      return reply.status(404).send({
        error: 'OrderNotFound',
        message: `Order ${orderId} not found`,
      });
    }

    return reply.send(order);
  });
};