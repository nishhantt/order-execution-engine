import { z } from 'zod';
import { CreateOrderRequest, OrderType } from '../../types/order.types';
import { ValidationError } from '../../utils/errors';
import { logger } from '../../utils/logger';

const createOrderSchema = z.object({
  orderType: z.nativeEnum(OrderType),
  tokenIn: z.string().min(1).max(50),
  tokenOut: z.string().min(1).max(50),
  amountIn: z.number().positive(),
});

export class OrderValidator {
  validate(data: unknown): CreateOrderRequest {
    try {
      const validated = createOrderSchema.parse(data);

      // Additional validation: tokens must be different
      if (validated.tokenIn === validated.tokenOut) {
        throw new ValidationError('tokenIn and tokenOut must be different');
      }

      // Additional validation: amount must not be too small
      if (validated.amountIn < 0.000001) {
        throw new ValidationError('amountIn is too small (minimum: 0.000001)');
      }

      logger.debug({ validated }, 'Order validation successful');

      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        logger.warn({ error: message }, 'Order validation failed');
        throw new ValidationError(message);
      }
      throw error;
    }
  }
}