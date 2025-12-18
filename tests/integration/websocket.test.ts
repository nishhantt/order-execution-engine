import { WebSocketManager } from '../../src/services/websocket';
import { WebSocketMessageType } from '../../src/types/websocket.types';
import { OrderStatus } from '../../src/types/order.types';

describe('WebSocket Manager', () => {
  let wsManager: WebSocketManager;

  beforeEach(() => {
    wsManager = new WebSocketManager();
  });

  it('should add and remove connections', () => {
    const orderId = 'test-order-123';
    const mockSocket = {
      readyState: 1,
      send: jest.fn(),
    };

    wsManager.addConnection(orderId, mockSocket);
    expect(wsManager.hasConnection(orderId)).toBe(true);

    wsManager.removeConnection(orderId);
    expect(wsManager.hasConnection(orderId)).toBe(false);
  });

  it('should send messages to connected sockets', () => {
    const orderId = 'test-order-123';
    const mockSocket = {
      readyState: 1,
      send: jest.fn(),
    };

    wsManager.addConnection(orderId, mockSocket);

    const message = {
      type: WebSocketMessageType.STATUS_UPDATE as WebSocketMessageType.STATUS_UPDATE,
      orderId,
      status: OrderStatus.PENDING,
      message: 'Order received',
      timestamp: Date.now(),
    };

    wsManager.sendToOrder(orderId, message);

    expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
  });

  it('should not send to disconnected sockets', () => {
    const orderId = 'test-order-123';
    const mockSocket = {
      readyState: 3, // CLOSED
      send: jest.fn(),
    };

    wsManager.addConnection(orderId, mockSocket);

    const message = {
      type: WebSocketMessageType.STATUS_UPDATE as WebSocketMessageType.STATUS_UPDATE,
      orderId,
      status: OrderStatus.PENDING,
      message: 'Order received',
      timestamp: Date.now(),
    };

    wsManager.sendToOrder(orderId, message);

    expect(mockSocket.send).not.toHaveBeenCalled();
  });

  it('should handle sending to non-existent connections gracefully', () => {
    const orderId = 'non-existent-order';

    const message = {
      type: WebSocketMessageType.STATUS_UPDATE as WebSocketMessageType.STATUS_UPDATE,
      orderId,
      status: OrderStatus.PENDING,
      message: 'Order received',
      timestamp: Date.now(),
    };

    // Should not throw
    expect(() => wsManager.sendToOrder(orderId, message)).not.toThrow();
  });
});