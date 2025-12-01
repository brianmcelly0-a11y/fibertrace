// API client for mobile app - connects to real backend
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

let authToken: string | null = null;

async function getAuthHeader(): Promise<Record<string, string>> {
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
    const finalHeaders = { 'Content-Type': 'application/json', ...headers };
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      headers: finalHeaders as Record<string, string>,
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async sendRecoveryCode(email: string) {
    const res = await fetch(`${API_BASE}/api/auth/password-recovery/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to send recovery code' }));
      throw new Error(error.error || 'Failed to send recovery code');
    }
    return res.json();
  },

  async verifyRecoveryCode(email: string, code: string) {
    const res = await fetch(`${API_BASE}/api/auth/password-recovery/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Invalid recovery code' }));
      throw new Error(error.error || 'Invalid recovery code');
    }
    return res.json();
  },

  async resetPassword(email: string, code: string, new_password: string) {
    const res = await fetch(`${API_BASE}/api/auth/password-recovery/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, new_password }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Password reset failed' }));
      throw new Error(error.error || 'Password reset failed');
    }
    return res.json();
  },

  // ===== MAP DATA =====
  async getMapData() {
    const headers = await getAuthHeader();
    const finalHeaders = { 'Content-Type': 'application/json', ...headers };
    const res = await fetch(`${API_BASE}/api/map/data`, {
      headers: finalHeaders as Record<string, string>,
    });
    if (!res.ok) throw new Error('Failed to fetch map data');
    return res.json();
  },

  async getMapLayers(layers?: string[]) {
    const headers = await getAuthHeader();
    const query = layers ? `?layers=${layers.join(',')}` : '';
    const finalHeaders = { 'Content-Type': 'application/json', ...headers };
    const res = await fetch(`${API_BASE}/api/map/layers${query}`, {
      headers: finalHeaders as Record<string, string>,
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
      headers: headers as Record<string, string>,
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload file');
    return res.json();
  },

  async getUploads() {
    const headers = await getAuthHeader();
    const finalHeaders = { 'Content-Type': 'application/json', ...headers };
    const res = await fetch(`${API_BASE}/api/uploads`, {
      headers: finalHeaders as Record<string, string>,
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

  async getNode(id: number) {
    const res = await fetch(`${API_BASE}/api/nodes/${id}`);
    if (!res.ok) throw new Error('Failed to fetch node');
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

  // ===== ROUTES =====
  async getRoutes() {
    const res = await fetch(`${API_BASE}/api/routes`);
    if (!res.ok) throw new Error('Failed to fetch routes');
    return res.json();
  },

  async getRoute(id: number) {
    const res = await fetch(`${API_BASE}/api/routes/${id}`);
    if (!res.ok) throw new Error('Failed to fetch route');
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

  async updateRoute(id: number, data: any) {
    const res = await fetch(`${API_BASE}/api/routes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update route');
    return res.json();
  },

  // ===== CLOSURES =====
  async getClosures() {
    const res = await fetch(`${API_BASE}/api/closures`);
    if (!res.ok) throw new Error('Failed to fetch closures');
    return res.json();
  },

  async getClosure(id: number) {
    const res = await fetch(`${API_BASE}/api/closures/${id}`);
    if (!res.ok) throw new Error('Failed to fetch closure');
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

  async updateClosure(id: number, data: any) {
    const res = await fetch(`${API_BASE}/api/closures/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update closure');
    return res.json();
  },

  // ===== CLOSURE SPLICES =====
  async getClosureSplices(closureId: number) {
    const res = await fetch(`${API_BASE}/api/closures/${closureId}/splices`);
    if (!res.ok) throw new Error('Failed to fetch closure splices');
    return res.json();
  },

  async createClosureSplice(closureId: number, data: any) {
    const res = await fetch(`${API_BASE}/api/closures/${closureId}/splices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create closure splice');
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

  async updateSplice(spliceId: number, data: any) {
    const res = await fetch(`${API_BASE}/api/splices/${spliceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update splice');
    return res.json();
  },

  // ===== POWER CALCULATION =====
  async calculatePower(data: any) {
    const res = await fetch(`${API_BASE}/api/power/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to calculate power');
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

  async logJobAction(jobId: number, data: any) {
    const res = await fetch(`${API_BASE}/api/jobs/${jobId}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to log job action');
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

  async assignInventory(data: any) {
    const res = await fetch(`${API_BASE}/api/inventory/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to assign inventory');
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

  // ===== SETTINGS =====
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

  // ===== REPORT EXPORTS (Module L) =====
  async exportRoute(id: number, format: 'csv' | 'json' = 'csv') {
    const res = await fetch(`${API_BASE}/api/reports/route/${id}/export?format=${format}`);
    if (!res.ok) throw new Error('Failed to export route');
    if (format === 'csv') return res.text();
    return res.json();
  },

  async getDailyReport(date?: string, userId?: number) {
    let url = `${API_BASE}/api/reports/daily`;
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (userId) params.append('userId', userId.toString());
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch daily reports');
    return res.json();
  },

  async exportDailyReport(date: string, format: 'csv' | 'json' = 'csv') {
    const res = await fetch(`${API_BASE}/api/reports/daily/export?date=${date}&format=${format}`);
    if (!res.ok) throw new Error('Failed to export daily report');
    if (format === 'csv') return res.text();
    return res.json();
  },

  // ===== BATCH SYNC (Module M) =====
  async batchSync(clientTime: string, items: any[]) {
    const res = await fetch(`${API_BASE}/api/sync/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientTime, items }),
    });
    if (!res.ok) throw new Error('Failed to sync batch');
    return res.json();
  },

  async resolveConflict(clientId: string, resolution: 'keep-client' | 'keep-server' | 'merge', clientVersion: number, serverVersion: number) {
    const res = await fetch(`${API_BASE}/api/sync/resolve-conflict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, resolution, clientVersion, serverVersion }),
    });
    if (!res.ok) throw new Error('Failed to resolve conflict');
    return res.json();
  },
};
