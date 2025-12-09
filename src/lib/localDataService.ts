import * as DB from './db';

let initialized = false;

export async function ensureInitialized() {
  if (!initialized) {
    await DB.initializeDatabase();
    initialized = true;
  }
}

export const localData = {
  async getNodes() {
    await ensureInitialized();
    const result = await DB.getNodes() as { nodes: any[] };
    return { nodes: result.nodes || [], data: result.nodes || [] };
  },

  async getNode(id: number) {
    await ensureInitialized();
    return DB.getNode(id);
  },

  async createNode(data: any) {
    await ensureInitialized();
    return DB.createNode(data);
  },

  async updateNode(id: number, data: any) {
    await ensureInitialized();
    return DB.updateNode(id, data);
  },

  async getRoutes() {
    await ensureInitialized();
    const result = await DB.getRoutes() as { routes: any[] };
    return { routes: result.routes || [], data: result.routes || [] };
  },

  async getRoute(id: number) {
    await ensureInitialized();
    return DB.getRoute(id);
  },

  async createRoute(data: any) {
    await ensureInitialized();
    return DB.createRoute(data);
  },

  async updateRoute(id: number, data: any) {
    await ensureInitialized();
    return DB.updateRoute(id, data);
  },

  async deleteRoute(id: number) {
    await ensureInitialized();
    return DB.deleteRoute(id);
  },

  async getJobs() {
    await ensureInitialized();
    const result = await DB.getJobs() as { jobs: any[] };
    return { jobs: result.jobs || [], data: result.jobs || [] };
  },

  async getJob(id: number) {
    await ensureInitialized();
    return DB.getJob(id);
  },

  async createJob(data: any) {
    await ensureInitialized();
    return DB.createJob(data);
  },

  async updateJob(id: number, data: any) {
    await ensureInitialized();
    return DB.updateJob(id, data);
  },

  async getClosures() {
    await ensureInitialized();
    const result = await DB.getClosures() as { closures: any[] };
    return { closures: result.closures || [], data: result.closures || [] };
  },

  async createClosure(data: any) {
    await ensureInitialized();
    return DB.createClosure(data);
  },

  async getInventory() {
    await ensureInitialized();
    const result = await DB.getInventory() as { inventory: any[] };
    return { 
      inventory: result.inventory || [], 
      items: result.inventory || [],
      data: result.inventory || [] 
    };
  },

  async createInventoryItem(data: any) {
    await ensureInitialized();
    return DB.createInventoryItem(data);
  },

  async getMapData() {
    await ensureInitialized();
    return DB.getMapData();
  },

  async getStats() {
    await ensureInitialized();
    return DB.getStats();
  },

  async getSplices(closureId?: number) {
    await ensureInitialized();
    return { splices: [], data: [] };
  },

  async createSplice(data: any) {
    await ensureInitialized();
    return { id: Date.now(), ...data };
  },

  async getCustomers() {
    await ensureInitialized();
    return { customers: [], data: [] };
  },

  async createCustomer(data: any) {
    await ensureInitialized();
    return { id: Date.now(), ...data };
  },

  async updateCustomer(id: number, data: any) {
    await ensureInitialized();
    return { id, ...data };
  },

  async getDailyReports() {
    await ensureInitialized();
    return { reports: [], data: [] };
  },

  async createDailyReport(data: any) {
    await ensureInitialized();
    return { id: Date.now(), ...data };
  },

  async updateUserSettings(userId: string | number, settings: any) {
    await ensureInitialized();
    return { id: userId, ...settings };
  },

  async updateUserProfile(userId: string | number, profile: any) {
    await ensureInitialized();
    return { id: userId, ...profile };
  },
};

export const api = localData;

export default localData;
