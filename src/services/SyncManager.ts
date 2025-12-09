import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, SyncOutbox, SyncAudit, generateId } from '../lib/database';

export interface SyncConfig {
  apiEndpoint: string;
  syncIntervalMs: number;
  maxRetries: number;
  batchSize: number;
  enabled: boolean;
}

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
}

export interface ConflictResolution {
  strategy: 'server-wins' | 'client-wins' | 'merge' | 'manual';
}

type SyncEventType = 'sync-started' | 'sync-completed' | 'sync-failed' | 'sync-progress' | 'online-status-changed' | 'sync-conflict';
type SyncEventCallback = (data: any) => void;

class SyncManager {
  private config: SyncConfig = {
    apiEndpoint: 'https://api.fibertrace.app',
    syncIntervalMs: 30000,
    maxRetries: 3,
    batchSize: 50,
    enabled: true,
  };

  private syncIntervalId: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private isOnline = true;
  private listeners: Map<SyncEventType, Set<SyncEventCallback>> = new Map();
  private progress: SyncProgress = {
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: false,
  };

  async initialize(): Promise<void> {
    await this.loadConfig();
    this.startOnlineMonitor();
    
    if (this.config.enabled) {
      this.startPeriodicSync();
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('sync_config');
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
      
      const endpoint = await AsyncStorage.getItem('api_endpoint');
      if (endpoint) {
        this.config.apiEndpoint = endpoint;
      }
    } catch (error) {
      console.error('Failed to load sync config:', error);
    }
  }

  async updateConfig(updates: Partial<SyncConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await AsyncStorage.setItem('sync_config', JSON.stringify(this.config));

    if (updates.syncIntervalMs !== undefined || updates.enabled !== undefined) {
      this.stopPeriodicSync();
      if (this.config.enabled) {
        this.startPeriodicSync();
      }
    }
  }

  private startOnlineMonitor(): void {
    const checkOnline = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${this.config.apiEndpoint}/health`, {
          method: 'HEAD',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        const wasOnline = this.isOnline;
        this.isOnline = response.ok;

        if (!wasOnline && this.isOnline) {
          this.emit('online-status-changed', { isOnline: true });
          this.triggerSync();
        } else if (wasOnline && !this.isOnline) {
          this.emit('online-status-changed', { isOnline: false });
        }
      } catch {
        const wasOnline = this.isOnline;
        this.isOnline = false;
        if (wasOnline) {
          this.emit('online-status-changed', { isOnline: false });
        }
      }
    };

    checkOnline();
    setInterval(checkOnline, 10000);
  }

  private startPeriodicSync(): void {
    this.stopPeriodicSync();
    this.syncIntervalId = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.triggerSync();
      }
    }, this.config.syncIntervalMs);
  }

  private stopPeriodicSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  async triggerSync(): Promise<boolean> {
    if (this.isSyncing || !this.isOnline) {
      return false;
    }

    this.isSyncing = true;
    this.progress = { total: 0, completed: 0, failed: 0, inProgress: true };
    this.emit('sync-started', { timestamp: new Date().toISOString() });

    const auditId = generateId();
    const startedAt = new Date().toISOString();

    try {
      const pendingItems = await db.getPendingSyncItems();
      this.progress.total = pendingItems.length;

      if (pendingItems.length === 0) {
        this.isSyncing = false;
        this.progress.inProgress = false;
        this.emit('sync-completed', { success: true, synced: 0 });
        return true;
      }

      const batches = this.createBatches(pendingItems, this.config.batchSize);

      for (const batch of batches) {
        await this.syncBatch(batch);
      }

      const audit: SyncAudit = {
        id: auditId,
        sync_direction: 'push',
        entity_type: 'mixed',
        entity_count: this.progress.completed,
        status: this.progress.failed === 0 ? 'success' : 'partial',
        started_at: startedAt,
        completed_at: new Date().toISOString(),
      };
      await db.addSyncAudit(audit);

      this.emit('sync-completed', { 
        success: this.progress.failed === 0, 
        synced: this.progress.completed,
        failed: this.progress.failed,
      });

      return this.progress.failed === 0;
    } catch (error) {
      console.error('Sync failed:', error);
      
      const audit: SyncAudit = {
        id: auditId,
        sync_direction: 'push',
        entity_type: 'mixed',
        entity_count: 0,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        started_at: startedAt,
        completed_at: new Date().toISOString(),
      };
      await db.addSyncAudit(audit);

      this.emit('sync-failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    } finally {
      this.isSyncing = false;
      this.progress.inProgress = false;
    }
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async syncBatch(items: SyncOutbox[]): Promise<void> {
    for (const item of items) {
      try {
        await this.syncItem(item);
        await db.markSynced(item.id);
        this.progress.completed++;
        this.emit('sync-progress', { ...this.progress });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        
        if (item.retry_count >= this.config.maxRetries) {
          this.progress.failed++;
        } else {
          await db.markSyncFailed(item.id, errorMsg);
        }
        this.emit('sync-progress', { ...this.progress });
      }
    }
  }

  private async syncItem(item: SyncOutbox): Promise<void> {
    const payload = JSON.parse(item.payload);
    const endpoint = `${this.config.apiEndpoint}/api/${item.entity_type}`;

    let method: string;
    let url: string;

    switch (item.action) {
      case 'create':
        method = 'POST';
        url = endpoint;
        break;
      case 'update':
        method = 'PUT';
        url = `${endpoint}/${item.entity_id}`;
        break;
      case 'delete':
        method = 'DELETE';
        url = `${endpoint}/${item.entity_id}`;
        break;
      default:
        throw new Error(`Unknown action: ${item.action}`);
    }

    const token = await this.getAuthToken();

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: item.action !== 'delete' ? JSON.stringify(payload) : undefined,
    });

    if (!response.ok) {
      if (response.status === 409) {
        await this.handleConflict(item, await response.json());
        return;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const sessionData = await AsyncStorage.getItem('auth_current_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        return session.token || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async handleConflict(item: SyncOutbox, serverData: any): Promise<void> {
    const resolution = await this.getConflictResolution();

    switch (resolution.strategy) {
      case 'server-wins':
        await db.markSynced(item.id);
        break;

      case 'client-wins':
        break;

      case 'merge':
        const localPayload = JSON.parse(item.payload);
        const merged = { ...serverData, ...localPayload, updated_at: new Date().toISOString() };
        const newItem: SyncOutbox = {
          ...item,
          payload: JSON.stringify(merged),
          retry_count: 0,
        };
        await db.markSyncFailed(item.id, 'Conflict - merged and retrying');
        break;

      case 'manual':
        await db.markSyncFailed(item.id, 'Conflict - requires manual resolution');
        this.emit('sync-conflict', { item, serverData });
        break;
    }
  }

  private async getConflictResolution(): Promise<ConflictResolution> {
    try {
      const stored = await AsyncStorage.getItem('sync_conflict_resolution');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
    }
    return { strategy: 'merge' };
  }

  async setConflictResolution(resolution: ConflictResolution): Promise<void> {
    await AsyncStorage.setItem('sync_conflict_resolution', JSON.stringify(resolution));
  }

  async pullFromServer(): Promise<boolean> {
    if (!this.isOnline) {
      return false;
    }

    const startedAt = new Date().toISOString();
    const auditId = generateId();

    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const lastSync = await AsyncStorage.getItem('last_pull_timestamp');
      const since = lastSync || '1970-01-01T00:00:00.000Z';

      const response = await fetch(`${this.config.apiEndpoint}/api/sync/pull?since=${encodeURIComponent(since)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      let entityCount = 0;

      if (data.users) {
        for (const user of data.users) {
          await db.saveUser(user);
          entityCount++;
        }
      }

      if (data.jobs) {
        for (const job of data.jobs) {
          await db.saveJob(job);
          entityCount++;
        }
      }

      if (data.inventory_items) {
        for (const item of data.inventory_items) {
          await db.saveInventoryItem(item);
          entityCount++;
        }
      }

      if (data.announcements) {
        for (const announcement of data.announcements) {
          await db.saveAnnouncement(announcement);
          entityCount++;
        }
      }

      if (data.settings) {
        for (const setting of data.settings) {
          await db.saveSetting(setting);
          entityCount++;
        }
      }

      await AsyncStorage.setItem('last_pull_timestamp', new Date().toISOString());

      const audit: SyncAudit = {
        id: auditId,
        sync_direction: 'pull',
        entity_type: 'mixed',
        entity_count: entityCount,
        status: 'success',
        started_at: startedAt,
        completed_at: new Date().toISOString(),
      };
      await db.addSyncAudit(audit);

      return true;
    } catch (error) {
      const audit: SyncAudit = {
        id: auditId,
        sync_direction: 'pull',
        entity_type: 'mixed',
        entity_count: 0,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        started_at: startedAt,
        completed_at: new Date().toISOString(),
      };
      await db.addSyncAudit(audit);

      console.error('Pull sync failed:', error);
      return false;
    }
  }

  async fullSync(): Promise<boolean> {
    const pushSuccess = await this.triggerSync();
    const pullSuccess = await this.pullFromServer();
    return pushSuccess && pullSuccess;
  }

  on(event: SyncEventType, callback: SyncEventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: SyncEventType, data: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in sync event listener for ${event}:`, error);
      }
    });
  }

  getProgress(): SyncProgress {
    return { ...this.progress };
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  async getPendingCount(): Promise<number> {
    const items = await db.getPendingSyncItems();
    return items.length;
  }

  async getSyncHistory(limit = 20): Promise<SyncAudit[]> {
    return db.getSyncAuditLogs(limit);
  }

  async clearPendingSync(): Promise<void> {
    const items = await db.getPendingSyncItems();
    for (const item of items) {
      await db.markSynced(item.id);
    }
  }

  async retryFailed(): Promise<void> {
    const items = await db.getPendingSyncItems();
    const failed = items.filter(i => i.retry_count > 0 && i.retry_count < this.config.maxRetries);
    
    for (const item of failed) {
      await db.markSyncFailed(item.id, '');
    }

    if (failed.length > 0) {
      await this.triggerSync();
    }
  }

  shutdown(): void {
    this.stopPeriodicSync();
  }
}

export const syncManager = new SyncManager();
export default syncManager;
