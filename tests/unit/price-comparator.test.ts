import { PriceComparator } from '../../src/services/dex-router/price-comparator';
import { DexQuote } from '../../src/types/dex.types';
import { DexName } from '../../src/types/order.types';

describe('PriceComparator', () => {
  let comparator: PriceComparator;

  beforeEach(() => {
    comparator = new PriceComparator();
  });

  it('should select Raydium when it has lower total cost', () => {
    const raydiumQuote: DexQuote = {
      dex: DexName.RAYDIUM,
      price: 100,
      fee: 0.003,
      totalCost: 100.3,
      liquidity: 500000,
      estimatedAmountOut: 0.995,
    };

    const meteoraQuote: DexQuote = {
      dex: DexName.METEORA,
      price: 100.5,
      fee: 0.002,
      totalCost: 100.7,
      liquidity: 400000,
      estimatedAmountOut: 0.993,
    };

    const result = comparator.compare(raydiumQuote, meteoraQuote);

    expect(result.bestDex).toBe(DexName.RAYDIUM);
    expect(result.bestQuote).toEqual(raydiumQuote);
    expect(result.savings).toBeCloseTo(0.4, 2);
  });

  it('should select Meteora when it has lower total cost', () => {
    const raydiumQuote: DexQuote = {
      dex: DexName.RAYDIUM,
      price: 100,
      fee: 0.003,
      totalCost: 100.3,
      liquidity: 500000,
      estimatedAmountOut: 0.995,
    };

    const meteoraQuote: DexQuote = {
      dex: DexName.METEORA,
      price: 99.8,
      fee: 0.002,
      totalCost: 99.99,
      liquidity: 400000,
      estimatedAmountOut: 1.0,
    };

    const result = comparator.compare(raydiumQuote, meteoraQuote);

    expect(result.bestDex).toBe(DexName.METEORA);
    expect(result.bestQuote).toEqual(meteoraQuote);
    expect(result.savings).toBeCloseTo(0.31, 2);
  });

  it('should calculate savings percentage correctly', () => {
    const raydiumQuote: DexQuote = {
      dex: DexName.RAYDIUM,
      price: 100,
      fee: 0.003,
      totalCost: 100.3,
      liquidity: 500000,
      estimatedAmountOut: 0.995,
    };

    const meteoraQuote: DexQuote = {
      dex: DexName.METEORA,
      price: 98,
      fee: 0.002,
      totalCost: 98.196,
      liquidity: 400000,
      estimatedAmountOut: 1.02,
    };

    const result = comparator.compare(raydiumQuote, meteoraQuote);

    expect(result.savingsPercentage).toBeGreaterThan(2);
    expect(result.savingsPercentage).toBeLessThan(3);
  });

  it('should include all quotes in the result', () => {
    const raydiumQuote: DexQuote = {
      dex: DexName.RAYDIUM,
      price: 100,
      fee: 0.003,
      totalCost: 100.3,
      liquidity: 500000,
      estimatedAmountOut: 0.995,
    };

    const meteoraQuote: DexQuote = {
      dex: DexName.METEORA,
      price: 100,
      fee: 0.002,
      totalCost: 100.2,
      liquidity: 400000,
      estimatedAmountOut: 1.0,
    };

    const result = comparator.compare(raydiumQuote, meteoraQuote);

    expect(result.allQuotes).toHaveLength(2);
    expect(result.allQuotes).toContain(raydiumQuote);
    expect(result.allQuotes).toContain(meteoraQuote);
  });
});