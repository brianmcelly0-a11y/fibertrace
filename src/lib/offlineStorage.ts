// Offline storage system using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredJob {
  id: number;
  type: string;
  address: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  scheduledDate: string;
  completedDate?: string;
  notes?: string;
  cableUsed?: string;
  materialsUsed?: string;
  latitude?: number;
  longitude?: number;
  clientId?: number;
  technicianId?: number;
  createdAt?: string;
  updatedAt?: string;
  synced: boolean;
  syncedAt?: string;
}

export interface StoredNode {
  id: number;
  name: string;
  type: 'OLT' | 'Splitter' | 'FAT' | 'ATB' | 'Closure';
  latitude: number;
  longitude: number;
  inputPower?: string;
  location?: string;
  notes?: string;
  cachedAt: string;
}

export interface StoredFiberRoute {
  id: number;
  name: string;
  routeType: string;
  coordinates: [number, number][];
  distance: number;
  jobId?: number;
  cachedAt: string;
}

// Initialize offline storage
export async function initializeOfflineStorage() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const hasData = keys.some(key => key.startsWith('fibertrace_'));
    
    if (!hasData) {
      // Initialize empty collections
      await AsyncStorage.setItem('fibertrace_jobs', JSON.stringify([]));
      await AsyncStorage.setItem('fibertrace_nodes', JSON.stringify([]));
      await AsyncStorage.setItem('fibertrace_routes', JSON.stringify([]));
      await AsyncStorage.setItem('fibertrace_last_sync', new Date().toISOString());
    }
  } catch (error) {
    console.error('Failed to initialize offline storage:', error);
  }
}

// Job Storage Operations
export async function getStoredJobs(): Promise<StoredJob[]> {
  try {
    const data = await AsyncStorage.getItem('fibertrace_jobs');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get stored jobs:', error);
    return [];
  }
}

export async function saveJob(job: StoredJob): Promise<void> {
  try {
    const jobs = await getStoredJobs();
    const existingIndex = jobs.findIndex(j => j.id === job.id);
    
    if (existingIndex >= 0) {
      jobs[existingIndex] = { ...jobs[existingIndex], ...job };
    } else {
      jobs.push(job);
    }
    
    await AsyncStorage.setItem('fibertrace_jobs', JSON.stringify(jobs));
  } catch (error) {
    console.error('Failed to save job:', error);
    throw error;
  }
}

export async function deleteJob(jobId: number): Promise<void> {
  try {
    const jobs = await getStoredJobs();
    const filtered = jobs.filter(j => j.id !== jobId);
    await AsyncStorage.setItem('fibertrace_jobs', JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete job:', error);
    throw error;
  }
}

export async function getStoredJob(jobId: number): Promise<StoredJob | null> {
  try {
    const jobs = await getStoredJobs();
    return jobs.find(j => j.id === jobId) || null;
  } catch (error) {
    console.error('Failed to get stored job:', error);
    return null;
  }
}

// Node Storage Operations
export async function getStoredNodes(): Promise<StoredNode[]> {
  try {
    const data = await AsyncStorage.getItem('fibertrace_nodes');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get stored nodes:', error);
    return [];
  }
}

export async function cacheNodes(nodes: StoredNode[]): Promise<void> {
  try {
    const withTimestamp = nodes.map(n => ({
      ...n,
      cachedAt: new Date().toISOString(),
    }));
    await AsyncStorage.setItem('fibertrace_nodes', JSON.stringify(withTimestamp));
  } catch (error) {
    console.error('Failed to cache nodes:', error);
    throw error;
  }
}

export async function getStoredNodeById(nodeId: number): Promise<StoredNode | null> {
  try {
    const nodes = await getStoredNodes();
    return nodes.find(n => n.id === nodeId) || null;
  } catch (error) {
    console.error('Failed to get stored node:', error);
    return null;
  }
}

// Fiber Route Storage Operations
export async function getStoredRoutes(): Promise<StoredFiberRoute[]> {
  try {
    const data = await AsyncStorage.getItem('fibertrace_routes');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get stored routes:', error);
    return [];
  }
}

export async function saveRoute(route: StoredFiberRoute): Promise<void> {
  try {
    const routes = await getStoredRoutes();
    const existingIndex = routes.findIndex(r => r.id === route.id);
    
    if (existingIndex >= 0) {
      routes[existingIndex] = { ...routes[existingIndex], ...route };
    } else {
      routes.push(route);
    }
    
    await AsyncStorage.setItem('fibertrace_routes', JSON.stringify(routes));
  } catch (error) {
    console.error('Failed to save route:', error);
    throw error;
  }
}

export async function cacheRoutes(routes: StoredFiberRoute[]): Promise<void> {
  try {
    const withTimestamp = routes.map(r => ({
      ...r,
      cachedAt: new Date().toISOString(),
    }));
    await AsyncStorage.setItem('fibertrace_routes', JSON.stringify(withTimestamp));
  } catch (error) {
    console.error('Failed to cache routes:', error);
    throw error;
  }
}

// Sync Status
export async function getLastSyncTime(): Promise<Date | null> {
  try {
    const data = await AsyncStorage.getItem('fibertrace_last_sync');
    return data ? new Date(data) : null;
  } catch (error) {
    console.error('Failed to get last sync time:', error);
    return null;
  }
}

export async function setLastSyncTime(): Promise<void> {
  try {
    await AsyncStorage.setItem('fibertrace_last_sync', new Date().toISOString());
  } catch (error) {
    console.error('Failed to set last sync time:', error);
  }
}

// Get unsynced jobs for sync operations
export async function getUnsyncedJobs(): Promise<StoredJob[]> {
  try {
    const jobs = await getStoredJobs();
    return jobs.filter(j => !j.synced);
  } catch (error) {
    console.error('Failed to get unsynced jobs:', error);
    return [];
  }
}

// Mark job as synced
export async function markJobAsSynced(jobId: number): Promise<void> {
  try {
    const job = await getStoredJob(jobId);
    if (job) {
      await saveJob({
        ...job,
        synced: true,
        syncedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Failed to mark job as synced:', error);
  }
}

// Clear all offline data
export async function clearOfflineData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      'fibertrace_jobs',
      'fibertrace_nodes',
      'fibertrace_routes',
      'fibertrace_last_sync',
    ]);
  } catch (error) {
    console.error('Failed to clear offline data:', error);
    throw error;
  }
}

// Get storage statistics
export async function getStorageStats(): Promise<{
  jobsCount: number;
  nodesCount: number;
  routesCount: number;
  lastSync: Date | null;
}> {
  try {
    const jobs = await getStoredJobs();
    const nodes = await getStoredNodes();
    const routes = await getStoredRoutes();
    const lastSync = await getLastSyncTime();
    
    return {
      jobsCount: jobs.length,
      nodesCount: nodes.length,
      routesCount: routes.length,
      lastSync,
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return {
      jobsCount: 0,
      nodesCount: 0,
      routesCount: 0,
      lastSync: null,
    };
  }
}
