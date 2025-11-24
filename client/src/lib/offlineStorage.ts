interface SyncQueueItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  data: any;
  timestamp: number;
}

interface OfflineData {
  jobs: any[];
  inventory: any[];
  clients: any[];
  olts: any[];
  splitters: any[];
  fats: any[];
  atbs: any[];
  closures: any[];
  spliceRecords: any[];
  powerReadings: any[];
  fiberRoutes: any[];
  fieldReports: any[];
  lastSync: number;
  syncQueue: SyncQueueItem[];
}

const STORAGE_KEY = 'fibertrace_offline_data';
const SYNC_QUEUE_KEY = 'fibertrace_sync_queue';

class OfflineStorage {
  private isOnline: boolean = navigator.onLine;

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingChanges();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  private getStoredData(): OfflineData {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse offline data', e);
      }
    }
    
    return {
      jobs: [],
      inventory: [],
      clients: [],
      olts: [],
      splitters: [],
      fats: [],
      atbs: [],
      closures: [],
      spliceRecords: [],
      powerReadings: [],
      fiberRoutes: [],
      fieldReports: [],
      lastSync: 0,
      syncQueue: [],
    };
  }

  private saveData(data: Partial<OfflineData>): void {
    const existing = this.getStoredData();
    const updated = { ...existing, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  cacheData(key: keyof Omit<OfflineData, 'lastSync' | 'syncQueue'>, data: any[]): void {
    const stored = this.getStoredData();
    stored[key] = data;
    stored.lastSync = Date.now();
    this.saveData(stored);
  }

  getCachedData(key: keyof Omit<OfflineData, 'lastSync' | 'syncQueue'>): any[] {
    const data = this.getStoredData();
    return data[key] || [];
  }

  getLastSyncTime(): number {
    return this.getStoredData().lastSync;
  }

  addToSyncQueue(endpoint: string, method: 'POST' | 'PATCH' | 'DELETE', data: any): string {
    const item: SyncQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      endpoint,
      method,
      data,
      timestamp: Date.now(),
    };

    const stored = this.getStoredData();
    stored.syncQueue.push(item);
    this.saveData(stored);

    if (this.isOnline) {
      this.syncPendingChanges();
    }

    return item.id;
  }

  async syncPendingChanges(): Promise<void> {
    if (!this.isOnline) {
      console.log('Offline - sync deferred');
      return;
    }

    const stored = this.getStoredData();
    const queue = [...stored.syncQueue];

    if (queue.length === 0) {
      return;
    }

    console.log(`Syncing ${queue.length} pending changes...`);

    for (const item of queue) {
      try {
        const response = await fetch(item.endpoint, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item.data),
          credentials: 'include',
        });

        if (response.ok) {
          stored.syncQueue = stored.syncQueue.filter(qi => qi.id !== item.id);
          this.saveData(stored);
          console.log(`Synced ${item.method} ${item.endpoint}`);
        } else {
          console.error(`Failed to sync ${item.method} ${item.endpoint}:`, response.status);
        }
      } catch (error) {
        console.error(`Error syncing ${item.method} ${item.endpoint}:`, error);
      }
    }
  }

  getPendingSyncCount(): number {
    return this.getStoredData().syncQueue.length;
  }

  clearCache(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SYNC_QUEUE_KEY);
  }

  async refreshAllData(apiRequest: (endpoint: string) => Promise<any>): Promise<void> {
    if (!this.isOnline) {
      console.log('Offline - using cached data');
      return;
    }

    try {
      console.log('Refreshing all offline data...');

      const endpoints: Array<{ key: keyof Omit<OfflineData, 'lastSync' | 'syncQueue'>; endpoint: string }> = [
        { key: 'jobs', endpoint: '/api/jobs' },
        { key: 'inventory', endpoint: '/api/inventory' },
        { key: 'clients', endpoint: '/api/clients' },
        { key: 'olts', endpoint: '/api/olts' },
        { key: 'splitters', endpoint: '/api/splitters' },
        { key: 'fats', endpoint: '/api/fats' },
        { key: 'atbs', endpoint: '/api/atbs' },
        { key: 'closures', endpoint: '/api/closures' },
        { key: 'spliceRecords', endpoint: '/api/splice-records' },
        { key: 'powerReadings', endpoint: '/api/power-readings' },
        { key: 'fiberRoutes', endpoint: '/api/fiber-routes' },
        { key: 'fieldReports', endpoint: '/api/field-reports' },
      ];

      for (const { key, endpoint } of endpoints) {
        try {
          const data = await apiRequest(endpoint);
          this.cacheData(key, data);
        } catch (error) {
          console.error(`Failed to refresh ${key}:`, error);
        }
      }

      console.log('Offline data refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh offline data:', error);
    }
  }
}

export const offlineStorage = new OfflineStorage();
