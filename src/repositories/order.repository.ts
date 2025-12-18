import { pool } from '../config/database';
import { Order, OrderStatus, OrderType, DexName } from '../types/order.types';
import { logger } from '../utils/logger';
import { OrderNotFoundError } from '../utils/errors';

export class OrderRepository {
  async create(order: Omit<Order, 'createdAt' | 'updatedAt'>): Promise<Order> {
    const query = `
      INSERT INTO orders (
        id, order_type, token_in, token_out, amount_in, status, retry_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      order.id,
      order.orderType,
      order.tokenIn,
      order.tokenOut,
      order.amountIn,
      order.status,
      order.retryCount,
    ];

    try {
      const result = await pool.query(query, values);
      logger.info({ orderId: order.id }, 'Order created in database');
      return this.mapRowToOrder(result.rows[0]);
    } catch (error) {
      logger.error({ error, orderId: order.id }, 'Failed to create order');
      throw error;
    }
  }

  async findById(id: string): Promise<Order | null> {
    const query = 'SELECT * FROM orders WHERE id = $1';

    try {
      const result = await pool.query(query, [id]);
      return result.rows.length > 0 ? this.mapRowToOrder(result.rows[0]) : null;
    } catch (error) {
      logger.error({ error, orderId: id }, 'Failed to find order');
      throw error;
    }
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    additionalData?: {
      selectedDex?: DexName;
      raydiumQuotePrice?: number;
      meteoraQuotePrice?: number;
      executedPrice?: number;
      amountOut?: number;
      txHash?: string;
      errorMessage?: string;
      confirmedAt?: Date;
    }
  ): Promise<Order> {
    const updates: string[] = ['status = $2'];
    const values: any[] = [id, status];
    let paramIndex = 3;

    if (additionalData) {
      if (additionalData.selectedDex) {
        updates.push(`selected_dex = $${paramIndex++}`);
        values.push(additionalData.selectedDex);
      }
      if (additionalData.raydiumQuotePrice !== undefined) {
        updates.push(`raydium_quote_price = $${paramIndex++}`);
        values.push(additionalData.raydiumQuotePrice);
      }
      if (additionalData.meteoraQuotePrice !== undefined) {
        updates.push(`meteora_quote_price = $${paramIndex++}`);
        values.push(additionalData.meteoraQuotePrice);
      }
      if (additionalData.executedPrice !== undefined) {
        updates.push(`executed_price = $${paramIndex++}`);
        values.push(additionalData.executedPrice);
      }
      if (additionalData.amountOut !== undefined) {
        updates.push(`amount_out = $${paramIndex++}`);
        values.push(additionalData.amountOut);
      }
      if (additionalData.txHash) {
        updates.push(`tx_hash = $${paramIndex++}`);
        values.push(additionalData.txHash);
      }
      if (additionalData.errorMessage) {
        updates.push(`error_message = $${paramIndex++}`);
        values.push(additionalData.errorMessage);
      }
      if (additionalData.confirmedAt) {
        updates.push(`confirmed_at = $${paramIndex++}`);
        values.push(additionalData.confirmedAt);
      }
    }

    const query = `
      UPDATE orders
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        throw new OrderNotFoundError(id);
      }
      logger.info({ orderId: id, status }, 'Order status updated');
      return this.mapRowToOrder(result.rows[0]);
    } catch (error) {
      logger.error({ error, orderId: id, status }, 'Failed to update order status');
      throw error;
    }
  }

  async incrementRetryCount(id: string): Promise<Order> {
    const query = `
      UPDATE orders
      SET retry_count = retry_count + 1
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) {
        throw new OrderNotFoundError(id);
      }
      return this.mapRowToOrder(result.rows[0]);
    } catch (error) {
      logger.error({ error, orderId: id }, 'Failed to increment retry count');
      throw error;
    }
  }

  async createEvent(orderId: string, eventType: string, eventData?: any): Promise<void> {
    const query = `
      INSERT INTO order_events (order_id, event_type, event_data)
      VALUES ($1, $2, $3)
    `;

    try {
      await pool.query(query, [orderId, eventType, eventData ? JSON.stringify(eventData) : null]);
      logger.debug({ orderId, eventType }, 'Order event created');
    } catch (error) {
      logger.error({ error, orderId, eventType }, 'Failed to create order event');
      // Don't throw - event logging is not critical
    }
  }

  private mapRowToOrder(row: any): Order {
    return {
      id: row.id,
      orderType: row.order_type as OrderType,
      tokenIn: row.token_in,
      tokenOut: row.token_out,
      amountIn: parseFloat(row.amount_in),
      status: row.status as OrderStatus,
      selectedDex: row.selected_dex as DexName | undefined,
      raydiumQuotePrice: row.raydium_quote_price ? parseFloat(row.raydium_quote_price) : undefined,
      meteoraQuotePrice: row.meteora_quote_price ? parseFloat(row.meteora_quote_price) : undefined,
      executedPrice: row.executed_price ? parseFloat(row.executed_price) : undefined,
      amountOut: row.amount_out ? parseFloat(row.amount_out) : undefined,
      txHash: row.tx_hash,
      errorMessage: row.error_message,
      retryCount: row.retry_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      confirmedAt: row.confirmed_at,
    };
  }
}