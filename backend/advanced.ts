// Advanced features: WebSocket notifications, analytics, exponential backoff

import { Pool } from 'pg';
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

// Event analytics tracker
export class EventAnalytics {
  private events: Map<string, any[]> = new Map();

  recordEvent(eventType: string, data: any): void {
    if (!this.events.has(eventType)) {
      this.events.set(eventType, []);
    }
    this.events.get(eventType)!.push({
      ...data,
      timestamp: new Date().toISOString()
    });

    // Keep only last 1000 events per type
    const eventList = this.events.get(eventType)!;
    if (eventList.length > 1000) {
      eventList.shift();
    }
  }

  getEvents(eventType?: string) {
    if (eventType) {
      return this.events.get(eventType) || [];
    }
    return Object.fromEntries(this.events);
  }

  getStats() {
    const stats: Record<string, any> = {};
    for (const [type, events] of this.events.entries()) {
      stats[type] = {
        count: events.length,
        lastEvent: events[events.length - 1]?.timestamp
      };
    }
    return stats;
  }
}

export const analytics = new EventAnalytics();

// Real-time notification system with WebSocket
export class NotificationServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocket> = new Map();

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket, req: any) => {
      const clientId = req.headers['sec-websocket-key'] || Math.random().toString();
      this.clients.set(clientId, ws);
      
      analytics.recordEvent('websocket_connected', { clientId });

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          analytics.recordEvent('websocket_message', { clientId, data });
        } catch (e) {
          // Ignore parse errors
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        analytics.recordEvent('websocket_disconnected', { clientId });
      });

      ws.on('error', (error) => {
        analytics.recordEvent('websocket_error', { clientId, error: error.message });
      });
    });
  }

  broadcast(event: string, data: any): void {
    const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
    for (const [clientId, ws] of this.clients.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
    analytics.recordEvent('notification_broadcast', { event, clientCount: this.clients.size });
  }

  notifyClient(clientId: string, event: string, data: any): void {
    const ws = this.clients.get(clientId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
      ws.send(message);
    }
  }

  getConnectedClients(): number {
    return this.clients.size;
  }
}

export const notificationServer = new NotificationServer();

// Exponential backoff retry helper for offline sync
export class ExponentialBackoff {
  private attempts: Map<string, number> = new Map();
  private maxAttempts: number = 5;
  private baseDelayMs: number = 1000;

  getDelay(key: string): number {
    const attempt = this.attempts.get(key) || 0;
    return Math.min(this.baseDelayMs * Math.pow(2, attempt), 30000); // Max 30s
  }

  shouldRetry(key: string): boolean {
    const attempt = this.attempts.get(key) || 0;
    return attempt < this.maxAttempts;
  }

  recordAttempt(key: string): void {
    const current = this.attempts.get(key) || 0;
    this.attempts.set(key, current + 1);
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  getAttempt(key: string): number {
    return this.attempts.get(key) || 0;
  }

  getStats(key: string) {
    return {
      attempts: this.getAttempt(key),
      nextDelayMs: this.getDelay(key),
      canRetry: this.shouldRetry(key)
    };
  }
}

export const backoffManager = new ExponentialBackoff();

// Offline sync queue with exponential backoff
export class OfflineSyncQueue {
  private queue: Array<{ id: string; operation: any; retryStats: any }> = [];

  enqueue(id: string, operation: any): void {
    this.queue.push({
      id,
      operation,
      retryStats: { attempts: 0, nextRetry: Date.now() }
    });
    analytics.recordEvent('offline_sync_enqueued', { id, queueSize: this.queue.length });
  }

  dequeue(): { id: string; operation: any; retryStats: any } | null {
    if (this.queue.length === 0) return null;

    const now = Date.now();
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].retryStats.nextRetry <= now) {
        const item = this.queue.splice(i, 1)[0];
        item.retryStats.attempts++;
        return item;
      }
    }
    return null;
  }

  markFailed(id: string): void {
    const item = this.queue.find(q => q.id === id);
    if (item) {
      const delayMs = backoffManager.getDelay(id);
      item.retryStats.nextRetry = Date.now() + delayMs;
      backoffManager.recordAttempt(id);
      analytics.recordEvent('offline_sync_failed', { id, attempt: item.retryStats.attempts });
    }
  }

  markSuccess(id: string): void {
    const index = this.queue.findIndex(q => q.id === id);
    if (index >= 0) {
      this.queue.splice(index, 1);
    }
    backoffManager.reset(id);
    analytics.recordEvent('offline_sync_success', { id });
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getStats() {
    return {
      queueSize: this.queue.length,
      items: this.queue.map(q => ({
        id: q.id,
        attempts: q.retryStats.attempts,
        nextRetryIn: Math.max(0, q.retryStats.nextRetry - Date.now())
      }))
    };
  }
}

export const syncQueue = new OfflineSyncQueue();

// Analytics dashboard data
export function getDashboardAnalytics(pool: Pool) {
  return async () => {
    try {
      const eventStats = analytics.getStats();
      const queueStats = syncQueue.getStats();
      const wsClients = notificationServer.getConnectedClients();

      // Get database stats
      const dbStats = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM routes) as total_routes,
          (SELECT COUNT(*) FROM closures) as total_closures,
          (SELECT COUNT(*) FROM jobs) as total_jobs,
          (SELECT COUNT(*) FROM jobs WHERE status = 'completed') as completed_jobs
      `);

      return {
        timestamp: new Date().toISOString(),
        events: eventStats,
        offlineSync: queueStats,
        websockets: { connectedClients: wsClients },
        database: dbStats.rows[0]
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  };
}
