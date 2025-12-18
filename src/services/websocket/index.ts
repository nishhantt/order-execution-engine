import { WebSocketMessage } from '../../types/websocket.types';
import { logger } from '../../utils/logger';

export class WebSocketManager {
  private connections: Map<string, any> = new Map();

  addConnection(orderId: string, socket: any): void {
    this.connections.set(orderId, socket);
    logger.debug({ orderId }, 'WebSocket connection added');
  }

  removeConnection(orderId: string): void {
    this.connections.delete(orderId);
    logger.debug({ orderId }, 'WebSocket connection removed');
  }

  sendToOrder(orderId: string, message: WebSocketMessage): void {
    const socket = this.connections.get(orderId);

    if (socket && socket.readyState === 1) {
      // 1 = OPEN
      try {
        socket.send(JSON.stringify(message));
        logger.debug({ orderId, messageType: message.type }, 'WebSocket message sent');
      } catch (error) {
        logger.error({ orderId, error }, 'Failed to send WebSocket message');
      }
    } else {
      logger.debug({ orderId }, 'WebSocket connection not found or not open');
    }
  }

  hasConnection(orderId: string): boolean {
    return this.connections.has(orderId);
  }
}