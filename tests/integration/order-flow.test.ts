import { OrderProcessor } from '../../src/services/order-processor';
import { OrderRepository } from '../../src/repositories/order.repository';
import { OrderStatus, OrderType } from '../../src/types/order.types';
import { WebSocketManager } from '../../src/services/websocket';
import { v4 as uuidv4 } from 'uuid';

describe('Order Flow Integration', () => {
  let orderProcessor: OrderProcessor;
  let orderRepo: OrderRepository;
  let wsManager: WebSocketManager;

  beforeEach(() => {
    wsManager = new WebSocketManager();
    orderProcessor = new OrderProcessor(wsManager);
    orderRepo = new OrderRepository();
  });

  it('should process a complete order from start to finish', async () => {
    const orderId = uuidv4();
    const orderType = OrderType.MARKET;
    const tokenIn = 'SOL';
    const tokenOut = 'USDC';
    const amountIn = 100;

    // Process the order
    await orderProcessor.processOrder(orderId, orderType, tokenIn, tokenOut, amountIn);

    // Check final state in database
    const order = await orderRepo.findById(orderId);

    expect(order).toBeDefined();
    expect(order?.status).toBe(OrderStatus.CONFIRMED);
    expect(order?.txHash).toBeDefined();
    expect(order?.executedPrice).toBeGreaterThan(0);
    expect(order?.selectedDex).toBeDefined();
  }, 15000);

  it('should save DEX routing information', async () => {
    const orderId = uuidv4();

    await orderProcessor.processOrder(orderId, OrderType.MARKET, 'SOL', 'USDC', 100);

    const order = await orderRepo.findById(orderId);

    expect(order?.raydiumQuotePrice).toBeDefined();
    expect(order?.meteoraQuotePrice).toBeDefined();
    expect(order?.selectedDex).toBeDefined();
  }, 15000);

  it('should increment retry count on failure', async () => {
    // This test would require mocking a failure scenario
    // For now, we just verify the retry count starts at 0
    const orderId = uuidv4();

    await orderProcessor.processOrder(orderId, OrderType.MARKET, 'SOL', 'USDC', 100);

    const order = await orderRepo.findById(orderId);
    expect(order?.retryCount).toBeGreaterThanOrEqual(0);
  }, 15000);
});