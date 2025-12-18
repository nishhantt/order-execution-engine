import { DexQuote } from '../../types/dex.types';
import { DexName } from '../../types/order.types';
import { logger } from '../../utils/logger';

export interface ComparisonResult {
  bestDex: DexName;
  bestQuote: DexQuote;
  savings: number;
  savingsPercentage: number;
  allQuotes: DexQuote[];
}

export class PriceComparator {
  compare(raydiumQuote: DexQuote, meteoraQuote: DexQuote): ComparisonResult {
    logger.info(
      {
        raydium: {
          price: raydiumQuote.price,
          fee: raydiumQuote.fee,
          totalCost: raydiumQuote.totalCost,
        },
        meteora: {
          price: meteoraQuote.price,
          fee: meteoraQuote.fee,
          totalCost: meteoraQuote.totalCost,
        },
      },
      'Comparing DEX quotes'
    );

    // Lower total cost is better
    const isMeteoraBetter = meteoraQuote.totalCost < raydiumQuote.totalCost;

    const bestQuote = isMeteoraBetter ? meteoraQuote : raydiumQuote;
    const worseQuote = isMeteoraBetter ? raydiumQuote : meteoraQuote;

    const savings = Math.abs(raydiumQuote.totalCost - meteoraQuote.totalCost);
    const savingsPercentage = (savings / worseQuote.totalCost) * 100;

    const result: ComparisonResult = {
      bestDex: bestQuote.dex,
      bestQuote,
      savings,
      savingsPercentage,
      allQuotes: [raydiumQuote, meteoraQuote],
    };

    logger.info(
      {
        winner: result.bestDex,
        savings: result.savings.toFixed(4),
        savingsPercentage: result.savingsPercentage.toFixed(2) + '%',
      },
      'DEX comparison completed'
    );

    return result;
  }

  formatComparisonMessage(result: ComparisonResult): string {
    const { bestDex, savings, savingsPercentage } = result;
    const loser = bestDex === DexName.RAYDIUM ? DexName.METEORA : DexName.RAYDIUM;

    return `Selected ${bestDex} (saves $${savings.toFixed(4)} / ${savingsPercentage.toFixed(2)}% vs ${loser})`;
  }
}