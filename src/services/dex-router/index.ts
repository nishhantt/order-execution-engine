import { DexQuoteRequest, DexQuote, SwapExecutionResult } from '../../types/dex.types';
import { DexName } from '../../types/order.types';
import { RaydiumService } from './raydium.service';
import { MeteorService } from './meteora.service';
import { PriceComparator, ComparisonResult } from './price-comparator';
import { logger } from '../../utils/logger';

export class DexRouter {
  private raydiumService: RaydiumService;
  private meteoraService: MeteorService;
  private priceComparator: PriceComparator;

  constructor() {
    this.raydiumService = new RaydiumService();
    this.meteoraService = new MeteorService();
    this.priceComparator = new PriceComparator();
  }

  async getBestQuote(request: DexQuoteRequest): Promise<ComparisonResult> {
    logger.info({ request }, 'Getting quotes from all DEXs');

    // Fetch quotes in parallel for speed
    const [raydiumQuote, meteoraQuote] = await Promise.all([
      this.raydiumService.getQuote(request),
      this.meteoraService.getQuote(request),
    ]);

    // Compare and select best
    const comparison = this.priceComparator.compare(raydiumQuote, meteoraQuote);

    return comparison;
  }

  async executeSwap(
    request: DexQuoteRequest,
    dex: DexName,
    quote: DexQuote
  ): Promise<SwapExecutionResult> {
    logger.info({ dex, request }, 'Executing swap on selected DEX');

    const service = dex === DexName.RAYDIUM ? this.raydiumService : this.meteoraService;

    return await service.executeSwap(request, quote);
  }
}