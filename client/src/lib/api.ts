import type { User, Client, Job, InventoryItem, MeterReading } from "@shared/schema";

const API_BASE = "/api";

export interface JobWithClient extends Omit<Job, 'scheduledDate' | 'completedDate' | 'createdAt' | 'updatedAt'> {
  clientName: string;
  scheduledDate: string;
  completedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// Auth API
export const authApi = {
  async login(email: string, password: string): Promise<Omit<User, 'password'>> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Login failed");
    return res.json();
  },

  async logout(): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/logout`, { method: "POST" });
    if (!res.ok) throw new Error("Logout failed");
  },

  async me(): Promise<Omit<User, 'password'>> {
    const res = await fetch(`${API_BASE}/auth/me`);
    if (!res.ok) throw new Error("Not authenticated");
    return res.json();
  },
};

// Jobs API
export const jobsApi = {
  async getAll(): Promise<JobWithClient[]> {
    const res = await fetch(`${API_BASE}/jobs`);
    if (!res.ok) throw new Error("Failed to fetch jobs");
    return res.json();
  },

  async getById(id: number): Promise<Job> {
    const res = await fetch(`${API_BASE}/jobs/${id}`);
    if (!res.ok) throw new Error("Failed to fetch job");
    return res.json();
  },

  async create(job: any): Promise<Job> {
    const res = await fetch(`${API_BASE}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    });
    if (!res.ok) throw new Error("Failed to create job");
    return res.json();
  },

  async update(id: number, job: any): Promise<Job> {
    const res = await fetch(`${API_BASE}/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    });
    if (!res.ok) throw new Error("Failed to update job");
    return res.json();
  },

  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/jobs/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete job");
  },
};

// Clients API
export const clientsApi = {
  async getAll(): Promise<Client[]> {
    const res = await fetch(`${API_BASE}/clients`);
    if (!res.ok) throw new Error("Failed to fetch clients");
    return res.json();
  },

  async create(client: any): Promise<Client> {
    const res = await fetch(`${API_BASE}/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(client),
    });
    if (!res.ok) throw new Error("Failed to create client");
    return res.json();
  },
};

// Inventory API
export const inventoryApi = {
  async getAll(): Promise<InventoryItem[]> {
    const res = await fetch(`${API_BASE}/inventory`);
    if (!res.ok) throw new Error("Failed to fetch inventory");
    return res.json();
  },

  async update(id: number, item: any): Promise<InventoryItem> {
    const res = await fetch(`${API_BASE}/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error("Failed to update item");
    return res.json();
  },

  async use(itemId: number, jobId: number | null, quantity: number): Promise<void> {
    const res = await fetch(`${API_BASE}/inventory/use`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, jobId, quantityUsed: quantity }),
    });
    if (!res.ok) throw new Error("Failed to use inventory item");
  },
};

// Stats API
export const statsApi = {
  async getStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  }> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
  },
};

// Meter Readings API
export const meterApi = {
  async getByJob(jobId: number): Promise<MeterReading[]> {
    const res = await fetch(`${API_BASE}/meter-readings/${jobId}`);
    if (!res.ok) throw new Error("Failed to fetch meter readings");
    return res.json();
  },

  async create(reading: any): Promise<MeterReading> {
    const res = await fetch(`${API_BASE}/meter-readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reading),
    });
    if (!res.ok) throw new Error("Failed to create reading");
    return res.json();
  },
};
