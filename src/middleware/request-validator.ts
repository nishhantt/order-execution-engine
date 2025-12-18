import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderValidator } from '../services/order-processor/validator';
import { logger } from '../utils/logger';

const orderValidator = new OrderValidator();

export const validateOrderRequest = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const validated = orderValidator.validate(request.body);
    // Attach validated data to request
    (request as any).validatedOrder = validated;
  } catch (error) {
    logger.warn({ body: request.body, error }, 'Order validation failed');
    throw error; // Will be caught by error handler
  }
};