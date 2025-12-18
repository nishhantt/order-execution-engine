import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { registerRoutes } from './routes';
import { WebSocketManager } from './services/websocket';

export const createApp = async () => {
  const app = Fastify({
    logger: false, // We use our own logger
    trustProxy: true,
    bodyLimit: 1048576, // 1MB
  });

  // Register CORS
  await app.register(cors, {
    origin: true, // Allow all origins in development
    credentials: true,
  });

  // Register WebSocket support
  await app.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB
    },
  });

  // Create WebSocket manager
  const wsManager = new WebSocketManager();

  // Register routes
  await registerRoutes(app, wsManager);

  // Register error handler
  app.setErrorHandler(errorHandler);

  // Log all requests
  app.addHook('onRequest', async (request) => {
    logger.info(
      {
        method: request.method,
        url: request.url,
        ip: request.ip,
      },
      'Incoming request'
    );
  });

  // Log all responses
  app.addHook('onResponse', async (request, reply) => {
    logger.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.getResponseTime(),
      },
      'Request completed'
    );
  });

  return { app, wsManager };
};