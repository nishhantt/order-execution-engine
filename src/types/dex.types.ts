import { DexName } from './order.types';

export interface DexQuote {
  dex: DexName;
  price: number;
  fee: number;
  totalCost: number;
  liquidity: number;
  estimatedAmountOut: number;
}

export interface DexQuoteRequest {
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
}

export interface SwapExecutionResult {
  txHash: string;
  executedPrice: number;
  amountOut: number;
  timestamp: number;
}

export interface DexService {
  getQuote(request: DexQuoteRequest): Promise<DexQuote>;
  executeSwap(request: DexQuoteRequest, quote: DexQuote): Promise<SwapExecutionResult>;
}