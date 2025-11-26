import * as JobManagement from './jobManagement';
import * as NodeManagement from './nodeManagement';
import * as RouteManagement from './routeManagement';

export interface ConflictResolution {
  strategy: 'local' | 'remote' | 'merge';
  timestamp: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'job' | 'node' | 'route';
  operation: 'create' | 'update' | 'delete';
  data: any;
  createdAt: string;
  retries: number;
}

class EnhancedOfflineSync {
  private queue: SyncQueueItem[] = [];
  private isSyncing = false;
  private syncErrors: Map<string, string> = new Map();

  // 3-way merge for conflict resolution
  mergeJobs(
    local: JobManagement.Job,
    remote: JobManagement.Job,
    base: JobManagement.Job
  ): JobManagement.Job {
    // If no conflicts, use remote (server is source of truth)
    if (
      JSON.stringify(remote.updatedAt) === JSON.stringify(local.updatedAt)
    ) {
      return remote;
    }

    // If only local changed, use local
    if (JSON.stringify(base) === JSON.stringify(remote)) {
      return local;
    }

    // If only remote changed, use remote
    if (JSON.stringify(base) === JSON.stringify(local)) {
      return remote;
    }

    // Both changed - merge intelligently
    const merged = { ...remote };

    // Prefer most recent timestamps
    if (local.updatedAt > remote.updatedAt) {
      // Keep local changes for these fields
      merged.status = local.status;
      merged.notes = local.notes;
      merged.duration = local.duration;
    }

    // Always merge inline notes
    const localNotes = new Map(local.inlineNotes.map(n => [n.id, n]));
    const remoteNotes = new Map(remote.inlineNotes.map(n => [n.id, n]));
    
    Array.from(localNotes.entries()).forEach(([id, note]) => {
      if (!remoteNotes.has(id)) {
        merged.inlineNotes.push(note);
      }
    });

    merged.unsyncedChanges = false;
    return merged;
  }

  // Conflict detection
  detectConflict(
    local: JobManagement.Job,
    remote: JobManagement.Job
  ): boolean {
    if (!local.syncedAt) return false; // New item, not a conflict

    const localModified = new Date(local.updatedAt).getTime();
    const remoteModified = new Date(remote.updatedAt).getTime();
    const lastSync = new Date(local.syncedAt).getTime();

    // Conflict if both changed since last sync
    return localModified > lastSync && remoteModified > lastSync;
  }

  // Add to sync queue
  addToQueue(
    type: 'job' | 'node' | 'route',
    operation: 'create' | 'update' | 'delete',
    data: any
  ): SyncQueueItem {
    const item: SyncQueueItem = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      operation,
      data,
      createdAt: new Date().toISOString(),
      retries: 0,
    };

    this.queue.push(item);
    return item;
  }

  // Process sync queue with retry logic
  async processSyncQueue(uploadFn: (items: SyncQueueItem[]) => Promise<any>): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    const results: { synced: number; failed: number; errors: string[] } = { synced: 0, failed: 0, errors: [] };

    for (const item of this.queue) {
      try {
        await uploadFn([item]);
        results.synced++;
        this.queue = this.queue.filter(i => i.id !== item.id);
      } catch (error) {
        item.retries++;

        if (item.retries < 3) {
          // Will retry
          results.failed++;
        } else {
          // Max retries exceeded
          results.failed++;
          const errorMsg = `Failed to sync ${item.type} ${item.id} after 3 retries: ${String(error)}`;
          results.errors.push(errorMsg);
          this.queue = this.queue.filter(i => i.id !== item.id);
        }
      }
    }

    return results;
  }

  // Delta sync - only sync changes
  getDeltaChanges(
    local: JobManagement.Job[],
    lastSyncTime: string
  ): JobManagement.Job[] {
    const lastSync = new Date(lastSyncTime).getTime();
    return local.filter(job => {
      const updated = new Date(job.updatedAt).getTime();
      return updated > lastSync;
    });
  }

  // Get queue status
  getQueueStatus(): {
    total: number;
    pending: number;
    failed: number;
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter(i => i.retries === 0).length,
      failed: this.queue.filter(i => i.retries > 0).length,
    };
  }

  // Clear sync queue
  clearQueue() {
    this.queue = [];
    this.syncErrors.clear();
  }

  // Sync state
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

export const enhancedOfflineSync = new EnhancedOfflineSync();
