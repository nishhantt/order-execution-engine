import { redis } from '../config/redis';
import { Order } from '../types/order.types';
import { logger } from '../utils/logger';

export class CacheRepository {
  private readonly ACTIVE_ORDER_PREFIX = 'active_order:';
  private readonly ACTIVE_ORDERS_SET = 'active_orders';
  private readonly ORDER_TTL = 3600; // 1 hour

  async setActiveOrder(order: Order): Promise<void> {
    const key = this.getOrderKey(order.id);

    try {
      await redis.setex(key, this.ORDER_TTL, JSON.stringify(order));
      await redis.sadd(this.ACTIVE_ORDERS_SET, order.id);
      logger.debug({ orderId: order.id }, 'Order cached in Redis');
    } catch (error) {
      logger.error({ error, orderId: order.id }, 'Failed to cache order');
      // Don't throw - caching is not critical
    }
  }

  async getActiveOrder(orderId: string): Promise<Order | null> {
    const key = this.getOrderKey(orderId);

    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error({ error, orderId }, 'Failed to get cached order');
      return null;
    }
  }

  async removeActiveOrder(orderId: string): Promise<void> {
    const key = this.getOrderKey(orderId);

    try {
      await redis.del(key);
      await redis.srem(this.ACTIVE_ORDERS_SET, orderId);
      logger.debug({ orderId }, 'Order removed from cache');
    } catch (error) {
      logger.error({ error, orderId }, 'Failed to remove cached order');
      // Don't throw - cache cleanup is not critical
    }
  }

  async getAllActiveOrderIds(): Promise<string[]> {
    try {
      return await redis.smembers(this.ACTIVE_ORDERS_SET);
    } catch (error) {
      logger.error({ error }, 'Failed to get active order IDs');
      return [];
    }
  }

  private getOrderKey(orderId: string): string {
    return `${this.ACTIVE_ORDER_PREFIX}${orderId}`;
  }
}