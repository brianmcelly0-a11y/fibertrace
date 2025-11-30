// API client for mobile app - connects to real backend
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

let authToken: string | null = null;

async function getAuthHeader() {
  if (!authToken) {
    authToken = await AsyncStorage.getItem('auth_token');
  }
  return authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
}

export async function setAuthToken(token: string) {
  authToken = token;
  await AsyncStorage.setItem('auth_token', token);
}

export async function clearAuthToken() {
  authToken = null;
  await AsyncStorage.removeItem('auth_token');
}

export const api = {
  // ===== AUTHENTICATION =====
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || 'Login failed');
    }
    const data = await res.json();
    if (data.token) {
      await setAuthToken(data.token);
    }
    return data;
  },

  async register(data: { full_name: string; email: string; phone?: string; password: string; role?: string }) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(error.error || 'Registration failed');
    }
    const result = await res.json();
    if (result.token) {
      await setAuthToken(result.token);
    }
    return result;
  },

  async getMe() {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...headers },
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  // ===== MAP DATA =====
  async getMapData() {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE}/api/map/data`, {
      headers: { 'Content-Type': 'application/json', ...headers },
    });
    if (!res.ok) throw new Error('Failed to fetch map data');
    return res.json();
  },

  async getMapLayers(layers?: string[]) {
    const headers = await getAuthHeader();
    const query = layers ? `?layers=${layers.join(',')}` : '';
    const res = await fetch(`${API_BASE}/api/map/layers${query}`, {
      headers: { 'Content-Type': 'application/json', ...headers },
    });
    if (!res.ok) throw new Error('Failed to fetch map layers');
    return res.json();
  },

  // ===== UPLOADS =====
  async uploadFile(file: File, entityType?: string, entityId?: number) {
    const headers = await getAuthHeader();
    const formData = new FormData();
    formData.append('file', file);
    if (entityType) formData.append('entity_type', entityType);
    if (entityId) formData.append('entity_id', entityId.toString());

    const res = await fetch(`${API_BASE}/api/uploads`, {
      method: 'POST',
      headers: { ...headers },
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload file');
    return res.json();
  },

  async getUploads() {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE}/api/uploads`, {
      headers: { 'Content-Type': 'application/json', ...headers },
    });
    if (!res.ok) throw new Error('Failed to fetch uploads');
    return res.json();
  },

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

  // ===== USER PROFILE =====
  async updateUserProfile(userId: number, data: any) {
    const res = await fetch(`${API_BASE}/api/users/${userId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update user profile');
    return res.json();
  },

  // ===== INVENTORY =====
  async getInventory() {
    const res = await fetch(`${API_BASE}/api/inventory`);
    if (!res.ok) throw new Error('Failed to fetch inventory');
    return res.json();
  },

  async createInventoryItem(data: any) {
    const res = await fetch(`${API_BASE}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create inventory item');
    return res.json();
  },

  async updateInventoryItem(id: number, data: any) {
    const res = await fetch(`${API_BASE}/api/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update inventory item');
    return res.json();
  },

  // ===== CUSTOMERS =====
  async getCustomers() {
    const res = await fetch(`${API_BASE}/api/customers`);
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
  },

  async createCustomer(data: any) {
    const res = await fetch(`${API_BASE}/api/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create customer');
    return res.json();
  },

  async updateCustomer(id: number, data: any) {
    const res = await fetch(`${API_BASE}/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update customer');
    return res.json();
  },

  // ===== SPLICES =====
  async getSplices(closureId?: number) {
    const url = closureId ? `${API_BASE}/api/splices?closure_id=${closureId}` : `${API_BASE}/api/splices`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch splices');
    return res.json();
  },

  async createSplice(data: any) {
    const res = await fetch(`${API_BASE}/api/splices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create splice');
    return res.json();
  },

  // ===== SYNC =====
  async syncData(data: any) {
    const res = await fetch(`${API_BASE}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to sync data');
    return res.json();
  },
};
