import { Order, OrderStatus, OrderType } from '../../types/order.types';
import { DexRouter } from '../dex-router';
import { OrderRepository } from '../../repositories/order.repository';
import { CacheRepository } from '../../repositories/cache.repository';
import { logger } from '../../utils/logger';
import { RetryHandler } from '../../utils/retry';
import { WebSocketManager } from '../websocket';
import { WebSocketMessageType } from '../../types/websocket.types';

export class OrderProcessor {
  private dexRouter: DexRouter;
  private orderRepo: OrderRepository;
  private cacheRepo: CacheRepository;
  private wsManager: WebSocketManager;

  constructor(wsManager: WebSocketManager) {
    this.dexRouter = new DexRouter();
    this.orderRepo = new OrderRepository();
    this.cacheRepo = new CacheRepository();
    this.wsManager = wsManager;
  }

  async processOrder(
    orderId: string,
    orderType: OrderType,
    tokenIn: string,
    tokenOut: string,
    amountIn: number
  ): Promise<void> {
    const startTime = Date.now();
    logger.info({ orderId, orderType, tokenIn, tokenOut, amountIn }, 'Starting order processing');

    try {
      // STEP 1: Create order in database
      const order = await this.orderRepo.create({
        id: orderId,
        orderType,
        tokenIn,
        tokenOut,
        amountIn,
        status: OrderStatus.PENDING,
        retryCount: 0,
      });

      await this.cacheRepo.setActiveOrder(order);

      // Send initial status
      this.sendStatusUpdate(orderId, OrderStatus.PENDING, 'Order received and queued');

      // STEP 2: Routing phase - Get quotes from DEXs
      await this.orderRepo.updateStatus(orderId, OrderStatus.ROUTING);
      this.sendStatusUpdate(orderId, OrderStatus.ROUTING, 'Comparing DEX prices...');

      const comparison = await RetryHandler.withExponentialBackoff(
        () => this.dexRouter.getBestQuote({ tokenIn, tokenOut, amountIn }),
        `GetQuotes-${orderId}`
      );

      // Update with routing info
      await this.orderRepo.updateStatus(orderId, OrderStatus.ROUTING, {
        selectedDex: comparison.bestDex,
        raydiumQuotePrice: comparison.allQuotes.find(q => q.dex === 'raydium')?.totalCost,
        meteoraQuotePrice: comparison.allQuotes.find(q => q.dex === 'meteora')?.totalCost,
      });

      // Send routing info via WebSocket
      this.sendRoutingInfo(orderId, comparison);

      // STEP 3: Building phase
      await this.orderRepo.updateStatus(orderId, OrderStatus.BUILDING);
      this.sendStatusUpdate(orderId, OrderStatus.BUILDING, 'Creating transaction...');

      // Simulate transaction building
      await this.sleep(500);

      // STEP 4: Submitted phase - Execute swap
      await this.orderRepo.updateStatus(orderId, OrderStatus.SUBMITTED);
      this.sendStatusUpdate(orderId, OrderStatus.SUBMITTED, 'Transaction sent to blockchain...');

      const swapResult = await RetryHandler.withExponentialBackoff(
        () =>
          this.dexRouter.executeSwap(
            { tokenIn, tokenOut, amountIn },
            comparison.bestDex,
            comparison.bestQuote
          ),
        `ExecuteSwap-${orderId}`,
        {
          onRetry: async (attempt) => {
            await this.orderRepo.incrementRetryCount(orderId);
          },
        }
      );

      // STEP 5: Confirmed phase
      await this.orderRepo.updateStatus(orderId, OrderStatus.CONFIRMED, {
        executedPrice: swapResult.executedPrice,
        amountOut: swapResult.amountOut,
        txHash: swapResult.txHash,
        confirmedAt: new Date(),
      });

      // Send execution result
      this.sendExecutionResult(orderId, swapResult, comparison.bestDex);

      // Cleanup cache
      await this.cacheRepo.removeActiveOrder(orderId);

      const duration = Date.now() - startTime;
      logger.info({ orderId, duration, txHash: swapResult.txHash }, 'Order processing completed');
    } catch (error) {
      await this.handleOrderFailure(orderId, error as Error);
    }
  }

  private async handleOrderFailure(orderId: string, error: Error): Promise<void> {
    logger.error({ orderId, error: error.message }, 'Order processing failed');

    try {
      await this.orderRepo.updateStatus(orderId, OrderStatus.FAILED, {
        errorMessage: error.message,
      });

      this.sendError(orderId, error.message);

      await this.cacheRepo.removeActiveOrder(orderId);
    } catch (updateError) {
      logger.error({ orderId, updateError }, 'Failed to update order failure status');
    }
  }

  private sendStatusUpdate(orderId: string, status: OrderStatus, message: string): void {
    this.wsManager.sendToOrder(orderId, {
      type: WebSocketMessageType.STATUS_UPDATE,
      orderId,
      status,
      message,
      timestamp: Date.now(),
    });
  }

  private sendRoutingInfo(orderId: string, comparison: any): void {
    const raydiumQuote = comparison.allQuotes.find((q: any) => q.dex === 'raydium');
    const meteoraQuote = comparison.allQuotes.find((q: any) => q.dex === 'meteora');

    this.wsManager.sendToOrder(orderId, {
      type: WebSocketMessageType.ROUTING_INFO,
      orderId,
      raydiumPrice: raydiumQuote?.totalCost || 0,
      meteoraPrice: meteoraQuote?.totalCost || 0,
      selectedDex: comparison.bestDex,
      reason: `Better price (saves $${comparison.savings.toFixed(4)})`,
      timestamp: Date.now(),
    });
  }

  private sendExecutionResult(orderId: string, swapResult: any, dex: any): void {
    this.wsManager.sendToOrder(orderId, {
      type: WebSocketMessageType.EXECUTION_RESULT,
      orderId,
      txHash: swapResult.txHash,
      executedPrice: swapResult.executedPrice,
      amountOut: swapResult.amountOut,
      dex,
      timestamp: Date.now(),
    });
  }

  private sendError(orderId: string, error: string): void {
    this.wsManager.sendToOrder(orderId, {
      type: WebSocketMessageType.ERROR,
      orderId,
      error,
      retryCount: 0,
      timestamp: Date.now(),
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}