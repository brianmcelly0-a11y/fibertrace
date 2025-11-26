// API client for mobile app - connects to same backend
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export const api = {
  async getOlts() {
    const res = await fetch(`${API_BASE}/api/olts`);
    if (!res.ok) throw new Error('Failed to fetch OLTs');
    return res.json();
  },

  async getSplitters() {
    const res = await fetch(`${API_BASE}/api/splitters`);
    if (!res.ok) throw new Error('Failed to fetch Splitters');
    return res.json();
  },

  async getFats() {
    const res = await fetch(`${API_BASE}/api/fats`);
    if (!res.ok) throw new Error('Failed to fetch FATs');
    return res.json();
  },

  async getAtbs() {
    const res = await fetch(`${API_BASE}/api/atbs`);
    if (!res.ok) throw new Error('Failed to fetch ATBs');
    return res.json();
  },

  async getClosures() {
    const res = await fetch(`${API_BASE}/api/closures`);
    if (!res.ok) throw new Error('Failed to fetch Closures');
    return res.json();
  },

  async getJobs() {
    const res = await fetch(`${API_BASE}/api/jobs`);
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  },

  async getJob(id: number) {
    const res = await fetch(`${API_BASE}/api/jobs/${id}`);
    if (!res.ok) throw new Error('Failed to fetch job');
    return res.json();
  },

  async createJob(data: any) {
    const res = await fetch(`${API_BASE}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create job');
    return res.json();
  },

  async updateJob(id: number, data: any) {
    const res = await fetch(`${API_BASE}/api/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update job');
    return res.json();
  },

  async updateJobStatus(id: number, status: string) {
    const res = await fetch(`${API_BASE}/api/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update job status');
    return res.json();
  },

  async deleteJob(id: number) {
    const res = await fetch(`${API_BASE}/api/jobs/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete job');
    return res.json();
  },

  async getFiberRoutes() {
    const res = await fetch(`${API_BASE}/api/fiber-routes`);
    if (!res.ok) throw new Error('Failed to fetch routes');
    return res.json();
  },

  async saveFiberRoute(data: any) {
    const res = await fetch(`${API_BASE}/api/fiber-routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save route');
    return res.json();
  },
};
