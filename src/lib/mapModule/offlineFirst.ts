// Workflow 10: OFFLINE FIRST PRIORITY - Local queue, seamless sync
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncData } from './types';

const OFFLINE_QUEUE_KEY = 'map_offline_queue';
const SYNC_STATUS_KEY = 'map_sync_status';

export async function queueOfflineAction(action: any): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue: any[] = stored ? JSON.parse(stored) : [];
    queue.push({
      ...action,
      queuedAt: Date.now(),
      synced: false,
    });
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error queuing offline action:', error);
  }
}

export async function getOfflineQueue(): Promise<any[]> {
  try {
    const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
}

export async function clearOfflineQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (error) {
    console.error('Error clearing offline queue:', error);
  }
}

export async function markActionSynced(actionId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (stored) {
      const queue: any[] = JSON.parse(stored);
      const updated = queue.map((a) =>
        a.id === actionId ? { ...a, synced: true } : a
      );
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Error marking action synced:', error);
  }
}

export async function setSyncStatus(
  status: 'syncing' | 'synced' | 'failed' | 'offline'
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      SYNC_STATUS_KEY,
      JSON.stringify({
        status,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error('Error setting sync status:', error);
  }
}

export async function getSyncStatus(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    if (stored) {
      const { status } = JSON.parse(stored);
      return status || 'offline';
    }
  } catch (error) {
    console.error('Error getting sync status:', error);
  }
  return 'offline';
}

export async function getPendingActionsCount(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (stored) {
      const queue: any[] = JSON.parse(stored);
      return queue.filter((a) => !a.synced).length;
    }
  } catch (error) {
    console.error('Error getting pending actions count:', error);
  }
  return 0;
}

export async function shouldSyncWhenOnline(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (stored) {
      const queue: any[] = JSON.parse(stored);
      return queue.some((a) => !a.synced);
    }
  } catch (error) {
    console.error('Error checking sync needs:', error);
  }
  return false;
}
