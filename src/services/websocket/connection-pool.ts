import { logger } from '../../utils/logger';

export class ConnectionPool {
  private connections: Map<string, any> = new Map();
  private orderIdToSocketId: Map<string, string> = new Map();

  add(socketId: string, orderId: string, socket: any): void {
    this.connections.set(socketId, socket);
    this.orderIdToSocketId.set(orderId, socketId);

    logger.info({ socketId, orderId, totalConnections: this.connections.size }, 'Connection added');
  }

  remove(socketId: string): void {
    const socket = this.connections.get(socketId);
    this.connections.delete(socketId);

    // Find and remove orderId mapping
    for (const [orderId, sid] of this.orderIdToSocketId.entries()) {
      if (sid === socketId) {
        this.orderIdToSocketId.delete(orderId);
        logger.info({ socketId, orderId, totalConnections: this.connections.size }, 'Connection removed');
        break;
      }
    }
  }

  getByOrderId(orderId: string): any | null {
    const socketId = this.orderIdToSocketId.get(orderId);
    return socketId ? this.connections.get(socketId) : null;
  }

  getAll(): any[] {
    return Array.from(this.connections.values());
  }

  size(): number {
    return this.connections.size;
  }
}