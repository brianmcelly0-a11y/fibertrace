// Workflow 9: CLOUD SYNC - Online detection, conflict resolution, uploads/downloads
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncData } from './types';

const UNSYNC_DATA_KEY = 'map_unsync_data';
const LAST_SYNC_KEY = 'map_last_sync';

export async function checkInternetConnection(): Promise<boolean> {
  try {
    const response = await fetch('https://api.fibertrace.app/health', {
      method: 'HEAD',
      cache: 'no-cache',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function queueForSync(data: SyncData): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(UNSYNC_DATA_KEY);
    const queue: SyncData[] = stored ? JSON.parse(stored) : [];
    queue.push(data);
    await AsyncStorage.setItem(UNSYNC_DATA_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error queueing data for sync:', error);
  }
}

export async function syncToCloud(
  apiUrl: string,
  authToken: string
): Promise<{ success: boolean; conflicts: any[] }> {
  try {
    const isOnline = await checkInternetConnection();
    if (!isOnline) {
      return { success: false, conflicts: [] };
    }

    const stored = await AsyncStorage.getItem(UNSYNC_DATA_KEY);
    const queue: SyncData[] = stored ? JSON.parse(stored) : [];

    if (queue.length === 0) {
      return { success: true, conflicts: [] };
    }

    const conflicts: any[] = [];

    for (const data of queue) {
      try {
        const response = await fetch(`${apiUrl}/map/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(data),
        });

        if (response.status === 409) {
          // Conflict - use timestamp resolution
          const conflict = await response.json();
          conflicts.push(conflict);
        } else if (!response.ok) {
          throw new Error(`Sync failed: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error syncing data:', error);
        continue;
      }
    }

    // Clear synced items
    if (conflicts.length === 0) {
      await AsyncStorage.removeItem(UNSYNC_DATA_KEY);
    }

    await AsyncStorage.setItem(LAST_SYNC_KEY, JSON.stringify(Date.now()));
    return { success: true, conflicts };
  } catch (error) {
    console.error('Error during cloud sync:', error);
    return { success: false, conflicts: [] };
  }
}

export async function resolveConflictByTimestamp(
  local: any,
  remote: any
): Promise<any> {
  // Newer timestamp wins
  const localTime = local.lastUpdate || local.timestamp || 0;
  const remoteTime = remote.lastUpdate || remote.timestamp || 0;

  return localTime > remoteTime ? local : remote;
}

export async function downloadUpdatesFromCloud(
  apiUrl: string,
  authToken: string
): Promise<SyncData | null> {
  try {
    const isOnline = await checkInternetConnection();
    if (!isOnline) {
      return null;
    }

    const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
    const since = lastSync ? parseInt(lastSync) : 0;

    const response = await fetch(`${apiUrl}/map/updates?since=${since}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const data: SyncData = await response.json();
    return data;
  } catch (error) {
    console.error('Error downloading updates:', error);
    return null;
  }
}

export async function getPendingSyncCount(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(UNSYNC_DATA_KEY);
    const queue: SyncData[] = stored ? JSON.parse(stored) : [];
    return queue.length;
  } catch (error) {
    return 0;
  }
}
