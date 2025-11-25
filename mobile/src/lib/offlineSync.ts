// Offline sync manager - syncs local changes with backend when online
import { 
  getUnsyncedJobs, 
  markJobAsSynced, 
  setLastSyncTime,
  cacheNodes,
  cacheRoutes,
  getStoredNodes,
  StoredNode,
} from './offlineStorage';
import { api } from './api';

export interface SyncStatus {
  isSyncing: boolean;
  lastSync: Date | null;
  unsyncedCount: number;
  syncErrors: string[];
}

let syncInProgress = false;

// Main sync function - called when device comes online or periodically
export async function syncWithBackend(): Promise<SyncStatus> {
  if (syncInProgress) {
    console.log('Sync already in progress, skipping...');
    return {
      isSyncing: true,
      lastSync: new Date(),
      unsyncedCount: (await getUnsyncedJobs()).length,
      syncErrors: [],
    };
  }

  syncInProgress = true;
  const syncErrors: string[] = [];

  try {
    // 1. Sync unsynced jobs
    const unsyncedJobs = await getUnsyncedJobs();
    
    for (const job of unsyncedJobs) {
      try {
        if (job.syncedAt) {
          // Already created on backend, just update status
          await api.updateJob(job.id, { status: job.status });
        } else {
          // New job, need to create
          await api.createJob({
            type: job.type,
            address: job.address,
            status: job.status,
            scheduledDate: job.scheduledDate,
            notes: job.notes,
            cableUsed: job.cableUsed,
            materialsUsed: job.materialsUsed,
          });
        }
        await markJobAsSynced(job.id);
      } catch (error) {
        syncErrors.push(`Failed to sync job ${job.id}: ${String(error)}`);
      }
    }

    // 2. Fetch and cache latest nodes data
    try {
      const [olts, splitters, fats, atbs, closures] = await Promise.all([
        api.getOlts().catch(() => []),
        api.getSplitters().catch(() => []),
        api.getFats().catch(() => []),
        api.getAtbs().catch(() => []),
        api.getClosures().catch(() => []),
      ]);

      const allNodes: StoredNode[] = [
        ...olts.map((n: any) => ({
          id: n.id,
          name: n.name,
          type: 'OLT' as const,
          latitude: n.latitude,
          longitude: n.longitude,
          inputPower: n.inputPower,
          location: n.location,
          notes: n.notes,
        })),
        ...splitters.map((n: any) => ({
          id: n.id,
          name: n.name,
          type: 'Splitter' as const,
          latitude: n.latitude,
          longitude: n.longitude,
          inputPower: n.inputPower,
          location: n.location,
          notes: n.notes,
        })),
        ...fats.map((n: any) => ({
          id: n.id,
          name: n.name,
          type: 'FAT' as const,
          latitude: n.latitude,
          longitude: n.longitude,
          inputPower: n.inputPower,
          location: n.location,
          notes: n.notes,
        })),
        ...atbs.map((n: any) => ({
          id: n.id,
          name: n.name,
          type: 'ATB' as const,
          latitude: n.latitude,
          longitude: n.longitude,
          inputPower: n.inputPower,
          location: n.location,
          notes: n.notes,
        })),
        ...closures.map((n: any) => ({
          id: n.id,
          name: n.name,
          type: 'Closure' as const,
          latitude: n.latitude,
          longitude: n.longitude,
          inputPower: n.inputPower,
          location: n.location,
          notes: n.notes,
        })),
      ];

      if (allNodes.length > 0) {
        await cacheNodes(allNodes);
      }
    } catch (error) {
      syncErrors.push(`Failed to sync nodes: ${String(error)}`);
    }

    // 3. Fetch and cache latest fiber routes
    try {
      const routes = await api.getFiberRoutes().catch(() => []);
      const storedRoutes = (routes || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        routeType: r.routeType || 'GPS',
        coordinates: Array.isArray(r.coordinates) 
          ? r.coordinates 
          : JSON.parse(r.coordinates || '[]'),
        distance: parseFloat(r.distance || '0'),
        jobId: r.jobId,
        cachedAt: new Date().toISOString(),
      }));
      
      if (storedRoutes.length > 0) {
        await cacheRoutes(storedRoutes);
      }
    } catch (error) {
      syncErrors.push(`Failed to sync routes: ${String(error)}`);
    }

    // Update last sync time
    await setLastSyncTime();

    console.log('Sync completed successfully');
  } catch (error) {
    syncErrors.push(`Sync failed: ${String(error)}`);
    console.error('Sync error:', error);
  } finally {
    syncInProgress = false;
  }

  const unsyncedJobs = await getUnsyncedJobs();
  
  return {
    isSyncing: false,
    lastSync: new Date(),
    unsyncedCount: unsyncedJobs.length,
    syncErrors,
  };
}

// Periodic sync - call this every 5-30 minutes when app is in use
export function startPeriodicSync(intervalMs: number = 300000): () => void {
  const interval = setInterval(() => {
    syncWithBackend().catch(error => {
      console.error('Periodic sync error:', error);
    });
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(interval);
}

// Detect online/offline and sync accordingly
export function setupNetworkListener(
  onOnline?: (syncStatus: SyncStatus) => void,
  onOffline?: () => void,
): () => void {
  // Import NetInfo to detect network changes
  let cleanupPeriodicSync: (() => void) | null = null;

  try {
    // Note: This would require NetInfo package
    // For now, just start periodic sync
    cleanupPeriodicSync = startPeriodicSync();

    // Optional: Add specific online/offline detection if NetInfo is available
    // This is a placeholder for future implementation
    
    return () => {
      if (cleanupPeriodicSync) {
        cleanupPeriodicSync();
      }
    };
  } catch (error) {
    console.error('Failed to setup network listener:', error);
    return () => {};
  }
}

// Export for use in app initialization
export const offlineSync = {
  sync: syncWithBackend,
  startPeriodic: startPeriodicSync,
  setupNetworkListener,
};
