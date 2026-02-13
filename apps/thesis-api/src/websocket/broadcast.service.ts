import { randomUUID } from 'crypto';
import type { Event } from '@thesis/protocol';

interface WebSocketConnection {
  socket: any;
  sessionId: string;
  clientId: string;
  connectedAt: Date;
}

class BroadcastService {
  private connections: Map<string, Set<WebSocketConnection>> = new Map();

  addConnection(sessionId: string, socket: any): string {
    const clientId = randomUUID();
    const connection: WebSocketConnection = {
      socket,
      sessionId,
      clientId,
      connectedAt: new Date(),
    };

    if (!this.connections.has(sessionId)) {
      this.connections.set(sessionId, new Set());
    }

    this.connections.get(sessionId)!.add(connection);

    socket.on('close', () => {
      this.removeConnection(sessionId, clientId);
    });

    return clientId;
  }

  removeConnection(sessionId: string, clientId: string): void {
    const sessionConnections = this.connections.get(sessionId);
    if (sessionConnections) {
      for (const conn of sessionConnections) {
        if (conn.clientId === clientId) {
          sessionConnections.delete(conn);
          break;
        }
      }

      if (sessionConnections.size === 0) {
        this.connections.delete(sessionId);
      }
    }
  }

  broadcast(sessionId: string, event: Event): void {
    const sessionConnections = this.connections.get(sessionId);
    if (!sessionConnections) {
      return;
    }

    const message = JSON.stringify({
      type: 'event',
      data: event,
      timestamp: new Date().toISOString(),
    });

    const disconnectedClients: WebSocketConnection[] = [];

    for (const conn of sessionConnections) {
      try {
        conn.socket.send(message);
      } catch (error) {
        console.error(`Error sending to client ${conn.clientId}:`, error);
        disconnectedClients.push(conn);
      }
    }

    for (const conn of disconnectedClients) {
      this.removeConnection(sessionId, conn.clientId);
    }
  }

  getConnectionCount(sessionId: string): number {
    const sessionConnections = this.connections.get(sessionId);
    return sessionConnections ? sessionConnections.size : 0;
  }

  getAllConnectionCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [sessionId, connections] of this.connections.entries()) {
      counts[sessionId] = connections.size;
    }
    return counts;
  }
}

export const broadcastService = new BroadcastService();
