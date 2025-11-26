// API adapter that falls back to offline storage when backend is unavailable
import { api } from './api';
import {
  getStoredJobs,
  getStoredJob,
  saveJob,
  getStoredNodes,
  getStoredRoutes,
  StoredJob,
  StoredNode,
  StoredFiberRoute,
} from './offlineStorage';

// Check if device is online
export async function isDeviceOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('http://localhost:5000/api/health', {
      method: 'HEAD',
      signal: controller.signal,
    }).catch(() => null);
    
    clearTimeout(timeout);
    return response !== null && response.status < 500;
  } catch {
    return false;
  }
}

// Offline-first API wrapper
export const offlineApi = {
  // Jobs
  async getJobs(): Promise<StoredJob[]> {
    try {
      return await api.getJobs();
    } catch (error) {
      console.log('Backend unavailable, using offline jobs');
      return await getStoredJobs();
    }
  },

  async getJob(jobId: number): Promise<StoredJob | null> {
    try {
      return await api.getJob(jobId);
    } catch (error) {
      console.log('Backend unavailable, using offline job');
      return await getStoredJob(jobId);
    }
  },

  async createJob(jobData: any): Promise<StoredJob> {
    try {
      const job = await api.createJob(jobData);
      await saveJob({
        ...job,
        synced: true,
        syncedAt: new Date().toISOString(),
      });
      return job;
    } catch (error) {
      console.log('Backend unavailable, saving job offline');
      
      // Create offline job with temporary ID
      const newJob: StoredJob = {
        id: Math.floor(Math.random() * 1000000),
        type: jobData.type,
        address: jobData.address,
        status: 'Pending',
        scheduledDate: jobData.scheduledDate,
        notes: jobData.notes,
        cableUsed: jobData.cableUsed,
        materialsUsed: jobData.materialsUsed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: false,
      };
      
      await saveJob(newJob);
      return newJob;
    }
  },

  async updateJob(jobId: number, data: any): Promise<StoredJob> {
    try {
      return await api.updateJob(jobId, data);
    } catch (error) {
      console.log('Backend unavailable, updating job offline');
      const job = await getStoredJob(jobId);
      if (!job) throw new Error('Job not found');
      
      const updated = {
        ...job,
        ...data,
        updatedAt: new Date().toISOString(),
        synced: false,
      };
      
      await saveJob(updated);
      return updated;
    }
  },

  async updateJobStatus(
    jobId: number,
    status: 'Pending' | 'In Progress' | 'Completed'
  ): Promise<void> {
    try {
      await api.updateJob(jobId, { status });
    } catch (error) {
      console.log('Backend unavailable, updating job status offline');
      const job = await getStoredJob(jobId);
      if (job) {
        await saveJob({
          ...job,
          status,
          completedDate: status === 'Completed' ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
          synced: false,
        });
      }
    }
  },

  // Nodes
  async getNodes(): Promise<StoredNode[]> {
    try {
      const [olts, splitters, fats, atbs, closures] = await Promise.all([
        api.getOlts().catch(() => []),
        api.getSplitters().catch(() => []),
        api.getFats().catch(() => []),
        api.getAtbs().catch(() => []),
        api.getClosures().catch(() => []),
      ]);

      const nodes = [
        ...olts.map((n: any) => ({ ...n, type: 'OLT' as const })),
        ...splitters.map((n: any) => ({ ...n, type: 'Splitter' as const })),
        ...fats.map((n: any) => ({ ...n, type: 'FAT' as const })),
        ...atbs.map((n: any) => ({ ...n, type: 'ATB' as const })),
        ...closures.map((n: any) => ({ ...n, type: 'Closure' as const })),
      ];

      return nodes;
    } catch (error) {
      console.log('Backend unavailable, using offline nodes');
      return await getStoredNodes();
    }
  },

  // Routes
  async getRoutes(): Promise<StoredFiberRoute[]> {
    try {
      return await api.getFiberRoutes();
    } catch (error) {
      console.log('Backend unavailable, using offline routes');
      return await getStoredRoutes();
    }
  },

  // Health check
  async healthCheck(): Promise<boolean> {
    return await isDeviceOnline();
  },
};

export default offlineApi;
