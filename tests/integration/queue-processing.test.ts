import { addOrderToQueue } from '../../src/queues/order.queue';
import { OrderType } from '../../src/types/order.types';
import { v4 as uuidv4 } from 'uuid';

describe('Queue Processing', () => {
  it('should add order to queue successfully', async () => {
    const orderId = uuidv4();

    const jobId = await addOrderToQueue({
      orderId,
      orderType: OrderType.MARKET,
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 100,
      timestamp: Date.now(),
    });

    expect(jobId).toBeDefined();
    expect(jobId).toBe(orderId);
  });

  it('should handle multiple orders concurrently', async () => {
    const orderIds = Array.from({ length: 5 }, () => uuidv4());

    const promises = orderIds.map((orderId) =>
      addOrderToQueue({
        orderId,
        orderType: OrderType.MARKET,
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: 100,
        timestamp: Date.now(),
      })
    );

    const jobIds = await Promise.all(promises);

    expect(jobIds).toHaveLength(5);
    jobIds.forEach((jobId) => {
      expect(jobId).toBeDefined();
    });
  });
});