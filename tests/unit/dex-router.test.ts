import { DexRouter } from '../../src/services/dex-router';
import { DexName } from '../../src/types/order.types';

describe('DexRouter', () => {
  let router: DexRouter;

  beforeEach(() => {
    router = new DexRouter();
  });

  it('should get quotes from both DEXs', async () => {
    const request = {
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 100,
    };

    const result = await router.getBestQuote(request);

    expect(result.allQuotes).toHaveLength(2);
    expect(result.allQuotes.some((q) => q.dex === DexName.RAYDIUM)).toBe(true);
    expect(result.allQuotes.some((q) => q.dex === DexName.METEORA)).toBe(true);
  });

  it('should select the best DEX based on total cost', async () => {
    const request = {
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 100,
    };

    const result = await router.getBestQuote(request);

    expect(result.bestDex).toBeDefined();
    expect([DexName.RAYDIUM, DexName.METEORA]).toContain(result.bestDex);
  });

  it('should calculate savings correctly', async () => {
    const request = {
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 100,
    };

    const result = await router.getBestQuote(request);

    expect(result.savings).toBeGreaterThanOrEqual(0);
    expect(result.savingsPercentage).toBeGreaterThanOrEqual(0);
  });

  it('should return valid quote data', async () => {
    const request = {
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 100,
    };

    const result = await router.getBestQuote(request);

    expect(result.bestQuote.price).toBeGreaterThan(0);
    expect(result.bestQuote.fee).toBeGreaterThan(0);
    expect(result.bestQuote.totalCost).toBeGreaterThan(0);
    expect(result.bestQuote.liquidity).toBeGreaterThan(0);
  });

  it('should execute swap on the selected DEX', async () => {
    const request = {
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 100,
    };

    const comparison = await router.getBestQuote(request);
    const swapResult = await router.executeSwap(request, comparison.bestDex, comparison.bestQuote);

    expect(swapResult.txHash).toBeDefined();
    expect(swapResult.txHash).toContain(comparison.bestDex);
    expect(swapResult.executedPrice).toBeGreaterThan(0);
    expect(swapResult.amountOut).toBeGreaterThan(0);
    expect(swapResult.timestamp).toBeGreaterThan(0);
  });
});