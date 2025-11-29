// API client for mobile app - connects to real backend
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export const api = {
  // ===== NODES =====
  async getNodes() {
    const res = await fetch(`${API_BASE}/api/nodes`);
    if (!res.ok) throw new Error('Failed to fetch nodes');
    return res.json();
  },

  async createNode(data: any) {
    const res = await fetch(`${API_BASE}/api/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create node');
    return res.json();
  },

  async updateNode(id: number, data: any) {
    const res = await fetch(`${API_BASE}/api/nodes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update node');
    return res.json();
  },

  // ===== CLOSURES (FAT, ATB, Dome, etc.) =====
  async getClosures() {
    const res = await fetch(`${API_BASE}/api/closures`);
    if (!res.ok) throw new Error('Failed to fetch closures');
    return res.json();
  },

  async createClosure(data: any) {
    const res = await fetch(`${API_BASE}/api/closures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create closure');
    return res.json();
  },

  // ===== SPLITTERS =====
  async getSplitters() {
    const res = await fetch(`${API_BASE}/api/splitters`);
    if (!res.ok) throw new Error('Failed to fetch splitters');
    return res.json();
  },

  async createSplitter(data: any) {
    const res = await fetch(`${API_BASE}/api/splitters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create splitter');
    return res.json();
  },

  // ===== ROUTES =====
  async getRoutes() {
    const res = await fetch(`${API_BASE}/api/routes`);
    if (!res.ok) throw new Error('Failed to fetch routes');
    return res.json();
  },

  async createRoute(data: any) {
    const res = await fetch(`${API_BASE}/api/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create route');
    return res.json();
  },

  // ===== POWER READINGS =====
  async getPowerReadings() {
    const res = await fetch(`${API_BASE}/api/power-readings`);
    if (!res.ok) throw new Error('Failed to fetch power readings');
    return res.json();
  },

  async createPowerReading(data: any) {
    const res = await fetch(`${API_BASE}/api/power-readings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create power reading');
    return res.json();
  },

  // ===== JOBS =====
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
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update job');
    return res.json();
  },

  async updateJobStatus(id: number, status: string) {
    const res = await fetch(`${API_BASE}/api/jobs/${id}`, {
      method: 'PUT',
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

  // ===== REPORTS & STATS =====
  async getStats() {
    const res = await fetch(`${API_BASE}/api/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async getDailyReports() {
    const res = await fetch(`${API_BASE}/api/daily-reports`);
    if (!res.ok) throw new Error('Failed to fetch daily reports');
    return res.json();
  },

  async createDailyReport(data: any) {
    const res = await fetch(`${API_BASE}/api/daily-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create daily report');
    return res.json();
  },

  // ===== FAT PORTS =====
  async getFatPorts() {
    const res = await fetch(`${API_BASE}/api/fat-ports`);
    if (!res.ok) throw new Error('Failed to fetch FAT ports');
    return res.json();
  },

  async createFatPort(data: any) {
    const res = await fetch(`${API_BASE}/api/fat-ports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create FAT port');
    return res.json();
  },

  // ===== USER SETTINGS =====
  async getUserSettings(userId: number) {
    const res = await fetch(`${API_BASE}/api/users/${userId}/settings`);
    if (!res.ok) throw new Error('Failed to fetch user settings');
    return res.json();
  },

  async updateUserSettings(userId: number, settings: any) {
    const res = await fetch(`${API_BASE}/api/users/${userId}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update user settings');
    return res.json();
  },

  // ===== METER READINGS (Bluetooth Integration) =====
  async getMeterReadings() {
    const res = await fetch(`${API_BASE}/api/meter-readings`);
    if (!res.ok) throw new Error('Failed to fetch meter readings');
    return res.json();
  },

  async saveMeterReading(data: any) {
    const res = await fetch(`${API_BASE}/api/meter-readings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save meter reading');
    return res.json();
  },

  // ===== GPS LOGS =====
  async saveGpsLog(data: any) {
    const res = await fetch(`${API_BASE}/api/gps-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save GPS log');
    return res.json();
  },
};
