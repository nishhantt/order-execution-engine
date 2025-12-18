import { OrderStatus, DexName } from './order.types';

export enum WebSocketMessageType {
  STATUS_UPDATE = 'status_update',
  ERROR = 'error',
  ROUTING_INFO = 'routing_info',
  EXECUTION_RESULT = 'execution_result',
}

export interface BaseWebSocketMessage {
  type: WebSocketMessageType;
  orderId: string;
  timestamp: number;
}

export interface StatusUpdateMessage extends BaseWebSocketMessage {
  type: WebSocketMessageType.STATUS_UPDATE;
  status: OrderStatus;
  message: string;
}

export interface RoutingInfoMessage extends BaseWebSocketMessage {
  type: WebSocketMessageType.ROUTING_INFO;
  raydiumPrice: number;
  meteoraPrice: number;
  selectedDex: DexName;
  reason: string;
}

export interface ExecutionResultMessage extends BaseWebSocketMessage {
  type: WebSocketMessageType.EXECUTION_RESULT;
  txHash: string;
  executedPrice: number;
  amountOut: number;
  dex: DexName;
}

export interface ErrorMessage extends BaseWebSocketMessage {
  type: WebSocketMessageType.ERROR;
  error: string;
  retryCount: number;
}

export type WebSocketMessage =
  | StatusUpdateMessage
  | RoutingInfoMessage
  | ExecutionResultMessage
  | ErrorMessage;