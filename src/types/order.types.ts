export enum OrderType {
  MARKET = 'market',
  LIMIT = 'limit',
  SNIPER = 'sniper',
}

export enum OrderStatus {
  PENDING = 'pending',
  ROUTING = 'routing',
  BUILDING = 'building',
  SUBMITTED = 'submitted',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

export enum DexName {
  RAYDIUM = 'raydium',
  METEORA = 'meteora',
}

export interface CreateOrderRequest {
  orderType: OrderType;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
}

export interface Order {
  id: string;
  orderType: OrderType;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  status: OrderStatus;
  selectedDex?: DexName;
  raydiumQuotePrice?: number;
  meteoraQuotePrice?: number;
  executedPrice?: number;
  amountOut?: number;
  txHash?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
}