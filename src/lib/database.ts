import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Organization {
  id: string;
  name: string;
  code: string;
  settings: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'Admin' | 'Manager' | 'Technician' | 'Viewer';
  phone?: string;
  is_active: boolean;
  otp_enabled: boolean;
  otp_secret?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface Technician {
  id: string;
  user_id: string;
  organization_id: string;
  employee_id: string;
  skills: string;
  certifications: string;
  is_available: boolean;
  current_location?: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  organization_id: string;
  job_number: string;
  title: string;
  description: string;
  job_type: string;
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  scheduled_date?: string;
  completed_date?: string;
  customer_id?: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface JobTask {
  id: string;
  job_id: string;
  task_name: string;
  task_type: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Skipped';
  sequence_order: number;
  notes?: string;
  completed_at?: string;
  completed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface JobLog {
  id: string;
  job_id: string;
  user_id: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface JobAssignment {
  id: string;
  job_id: string;
  technician_id: string;
  assigned_by: string;
  assigned_at: string;
  status: 'Assigned' | 'Accepted' | 'Declined' | 'Completed';
}

export interface InventoryItem {
  id: string;
  organization_id: string;
  item_code: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  quantity_on_hand: number;
  minimum_threshold: number;
  maximum_threshold: number;
  unit_cost: number;
  location: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  item_id: string;
  transaction_type: 'In' | 'Out' | 'Adjustment' | 'Transfer';
  quantity: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  performed_by: string;
  performed_at: string;
}

export interface Setting {
  id: string;
  organization_id: string;
  category: string;
  key: string;
  value: string;
  updated_by?: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  organization_id: string;
  title: string;
  content: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  target_roles: string;
  is_active: boolean;
  expires_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SyncOutbox {
  id: string;
  entity_type: string;
  entity_id: string;
  action: 'create' | 'update' | 'delete';
  payload: string;
  retry_count: number;
  last_error?: string;
  created_at: string;
  synced_at?: string;
}

export interface SyncAudit {
  id: string;
  sync_direction: 'push' | 'pull';
  entity_type: string;
  entity_count: number;
  status: 'success' | 'partial' | 'failed';
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

const STORAGE_KEYS = {
  organizations: 'db_organizations',
  users: 'db_users',
  sessions: 'db_sessions',
  technicians: 'db_technicians',
  jobs: 'db_jobs',
  job_tasks: 'db_job_tasks',
  job_logs: 'db_job_logs',
  job_assignments: 'db_job_assignments',
  inventory_items: 'db_inventory_items',
  inventory_transactions: 'db_inventory_transactions',
  settings: 'db_settings',
  announcements: 'db_announcements',
  sync_outbox: 'db_sync_outbox',
  sync_audit: 'db_sync_audit',
  db_version: 'db_version',
};

const CURRENT_DB_VERSION = 1;

class Database {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const versionStr = await AsyncStorage.getItem(STORAGE_KEYS.db_version);
      const version = versionStr ? parseInt(versionStr, 10) : 0;

      if (version < CURRENT_DB_VERSION) {
        await this.runMigrations(version);
        await AsyncStorage.setItem(STORAGE_KEYS.db_version, CURRENT_DB_VERSION.toString());
      }

      this.initialized = true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async runMigrations(fromVersion: number): Promise<void> {
    if (fromVersion < 1) {
      for (const key of Object.values(STORAGE_KEYS)) {
        if (key !== STORAGE_KEYS.db_version) {
          const existing = await AsyncStorage.getItem(key);
          if (!existing) {
            await AsyncStorage.setItem(key, JSON.stringify([]));
          }
        }
      }
    }
  }

  private async getTable<T>(key: string): Promise<T[]> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Failed to get table ${key}:`, error);
      return [];
    }
  }

  private async setTable<T>(key: string, data: T[]): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to set table ${key}:`, error);
      throw error;
    }
  }

  async getOrganizations(): Promise<Organization[]> {
    return this.getTable<Organization>(STORAGE_KEYS.organizations);
  }

  async getOrganization(id: string): Promise<Organization | null> {
    const orgs = await this.getOrganizations();
    return orgs.find(o => o.id === id) || null;
  }

  async saveOrganization(org: Organization): Promise<void> {
    const orgs = await this.getOrganizations();
    const index = orgs.findIndex(o => o.id === org.id);
    if (index >= 0) {
      orgs[index] = { ...orgs[index], ...org, updated_at: new Date().toISOString() };
    } else {
      orgs.push({ ...org, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    await this.setTable(STORAGE_KEYS.organizations, orgs);
    await this.queueSync('organizations', org.id, index >= 0 ? 'update' : 'create', org);
  }

  async getUsers(organizationId?: string): Promise<User[]> {
    const users = await this.getTable<User>(STORAGE_KEYS.users);
    return organizationId ? users.filter(u => u.organization_id === organizationId) : users;
  }

  async getUser(id: string): Promise<User | null> {
    const users = await this.getTable<User>(STORAGE_KEYS.users);
    return users.find(u => u.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getTable<User>(STORAGE_KEYS.users);
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async saveUser(user: User): Promise<void> {
    const users = await this.getTable<User>(STORAGE_KEYS.users);
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = { ...users[index], ...user, updated_at: new Date().toISOString() };
    } else {
      users.push({ ...user, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    await this.setTable(STORAGE_KEYS.users, users);
    await this.queueSync('users', user.id, index >= 0 ? 'update' : 'create', user);
  }

  async deleteUser(id: string): Promise<void> {
    const users = await this.getTable<User>(STORAGE_KEYS.users);
    const user = users.find(u => u.id === id);
    const filtered = users.filter(u => u.id !== id);
    await this.setTable(STORAGE_KEYS.users, filtered);
    if (user) {
      await this.queueSync('users', id, 'delete', user);
    }
  }

  async getSessions(): Promise<Session[]> {
    return this.getTable<Session>(STORAGE_KEYS.sessions);
  }

  async saveSession(session: Session): Promise<void> {
    const sessions = await this.getSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    await this.setTable(STORAGE_KEYS.sessions, sessions);
  }

  async deleteSession(id: string): Promise<void> {
    const sessions = await this.getSessions();
    await this.setTable(STORAGE_KEYS.sessions, sessions.filter(s => s.id !== id));
  }

  async clearExpiredSessions(): Promise<void> {
    const sessions = await this.getSessions();
    const now = new Date().toISOString();
    await this.setTable(STORAGE_KEYS.sessions, sessions.filter(s => s.expires_at > now));
  }

  async getJobs(organizationId?: string): Promise<Job[]> {
    const jobs = await this.getTable<Job>(STORAGE_KEYS.jobs);
    return organizationId ? jobs.filter(j => j.organization_id === organizationId) : jobs;
  }

  async getJob(id: string): Promise<Job | null> {
    const jobs = await this.getTable<Job>(STORAGE_KEYS.jobs);
    return jobs.find(j => j.id === id) || null;
  }

  async saveJob(job: Job): Promise<void> {
    const jobs = await this.getTable<Job>(STORAGE_KEYS.jobs);
    const index = jobs.findIndex(j => j.id === job.id);
    if (index >= 0) {
      jobs[index] = { ...jobs[index], ...job, updated_at: new Date().toISOString() };
    } else {
      jobs.push({ ...job, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    await this.setTable(STORAGE_KEYS.jobs, jobs);
    await this.queueSync('jobs', job.id, index >= 0 ? 'update' : 'create', job);
  }

  async deleteJob(id: string): Promise<void> {
    const jobs = await this.getTable<Job>(STORAGE_KEYS.jobs);
    const job = jobs.find(j => j.id === id);
    await this.setTable(STORAGE_KEYS.jobs, jobs.filter(j => j.id !== id));
    if (job) {
      await this.queueSync('jobs', id, 'delete', job);
    }
  }

  async getJobTasks(jobId: string): Promise<JobTask[]> {
    const tasks = await this.getTable<JobTask>(STORAGE_KEYS.job_tasks);
    return tasks.filter(t => t.job_id === jobId).sort((a, b) => a.sequence_order - b.sequence_order);
  }

  async saveJobTask(task: JobTask): Promise<void> {
    const tasks = await this.getTable<JobTask>(STORAGE_KEYS.job_tasks);
    const index = tasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      tasks[index] = { ...tasks[index], ...task, updated_at: new Date().toISOString() };
    } else {
      tasks.push({ ...task, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    await this.setTable(STORAGE_KEYS.job_tasks, tasks);
    await this.queueSync('job_tasks', task.id, index >= 0 ? 'update' : 'create', task);
  }

  async getJobLogs(jobId: string): Promise<JobLog[]> {
    const logs = await this.getTable<JobLog>(STORAGE_KEYS.job_logs);
    return logs.filter(l => l.job_id === jobId).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async addJobLog(log: JobLog): Promise<void> {
    const logs = await this.getTable<JobLog>(STORAGE_KEYS.job_logs);
    logs.push(log);
    await this.setTable(STORAGE_KEYS.job_logs, logs);
    await this.queueSync('job_logs', log.id, 'create', log);
  }

  async getJobAssignments(jobId?: string): Promise<JobAssignment[]> {
    const assignments = await this.getTable<JobAssignment>(STORAGE_KEYS.job_assignments);
    return jobId ? assignments.filter(a => a.job_id === jobId) : assignments;
  }

  async saveJobAssignment(assignment: JobAssignment): Promise<void> {
    const assignments = await this.getTable<JobAssignment>(STORAGE_KEYS.job_assignments);
    const index = assignments.findIndex(a => a.id === assignment.id);
    if (index >= 0) {
      assignments[index] = assignment;
    } else {
      assignments.push(assignment);
    }
    await this.setTable(STORAGE_KEYS.job_assignments, assignments);
    await this.queueSync('job_assignments', assignment.id, index >= 0 ? 'update' : 'create', assignment);
  }

  async getInventoryItems(organizationId?: string): Promise<InventoryItem[]> {
    const items = await this.getTable<InventoryItem>(STORAGE_KEYS.inventory_items);
    return organizationId ? items.filter(i => i.organization_id === organizationId) : items;
  }

  async getInventoryItem(id: string): Promise<InventoryItem | null> {
    const items = await this.getTable<InventoryItem>(STORAGE_KEYS.inventory_items);
    return items.find(i => i.id === id) || null;
  }

  async saveInventoryItem(item: InventoryItem): Promise<void> {
    const items = await this.getTable<InventoryItem>(STORAGE_KEYS.inventory_items);
    const index = items.findIndex(i => i.id === item.id);
    if (index >= 0) {
      items[index] = { ...items[index], ...item, updated_at: new Date().toISOString() };
    } else {
      items.push({ ...item, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    await this.setTable(STORAGE_KEYS.inventory_items, items);
    await this.queueSync('inventory_items', item.id, index >= 0 ? 'update' : 'create', item);
  }

  async deleteInventoryItem(id: string): Promise<void> {
    const items = await this.getTable<InventoryItem>(STORAGE_KEYS.inventory_items);
    const item = items.find(i => i.id === id);
    await this.setTable(STORAGE_KEYS.inventory_items, items.filter(i => i.id !== id));
    if (item) {
      await this.queueSync('inventory_items', id, 'delete', item);
    }
  }

  async getLowStockItems(organizationId: string): Promise<InventoryItem[]> {
    const items = await this.getInventoryItems(organizationId);
    return items.filter(i => i.is_active && i.quantity_on_hand <= i.minimum_threshold);
  }

  async getInventoryTransactions(itemId?: string): Promise<InventoryTransaction[]> {
    const transactions = await this.getTable<InventoryTransaction>(STORAGE_KEYS.inventory_transactions);
    return itemId ? transactions.filter(t => t.item_id === itemId) : transactions;
  }

  async addInventoryTransaction(transaction: InventoryTransaction): Promise<void> {
    const transactions = await this.getTable<InventoryTransaction>(STORAGE_KEYS.inventory_transactions);
    transactions.push(transaction);
    await this.setTable(STORAGE_KEYS.inventory_transactions, transactions);

    const item = await this.getInventoryItem(transaction.item_id);
    if (item) {
      let newQuantity = item.quantity_on_hand;
      if (transaction.transaction_type === 'In') {
        newQuantity += transaction.quantity;
      } else if (transaction.transaction_type === 'Out') {
        newQuantity -= transaction.quantity;
      } else if (transaction.transaction_type === 'Adjustment') {
        newQuantity = transaction.quantity;
      }
      await this.saveInventoryItem({ ...item, quantity_on_hand: Math.max(0, newQuantity) });
    }

    await this.queueSync('inventory_transactions', transaction.id, 'create', transaction);
  }

  async getSettings(organizationId: string, category?: string): Promise<Setting[]> {
    const settings = await this.getTable<Setting>(STORAGE_KEYS.settings);
    let filtered = settings.filter(s => s.organization_id === organizationId);
    if (category) {
      filtered = filtered.filter(s => s.category === category);
    }
    return filtered;
  }

  async getSetting(organizationId: string, key: string): Promise<Setting | null> {
    const settings = await this.getTable<Setting>(STORAGE_KEYS.settings);
    return settings.find(s => s.organization_id === organizationId && s.key === key) || null;
  }

  async saveSetting(setting: Setting): Promise<void> {
    const settings = await this.getTable<Setting>(STORAGE_KEYS.settings);
    const index = settings.findIndex(s => s.id === setting.id);
    if (index >= 0) {
      settings[index] = { ...setting, updated_at: new Date().toISOString() };
    } else {
      settings.push({ ...setting, updated_at: new Date().toISOString() });
    }
    await this.setTable(STORAGE_KEYS.settings, settings);
    await this.queueSync('settings', setting.id, index >= 0 ? 'update' : 'create', setting);
  }

  async getAnnouncements(organizationId: string, activeOnly = true): Promise<Announcement[]> {
    const announcements = await this.getTable<Announcement>(STORAGE_KEYS.announcements);
    let filtered = announcements.filter(a => a.organization_id === organizationId);
    if (activeOnly) {
      const now = new Date().toISOString();
      filtered = filtered.filter(a => a.is_active && (!a.expires_at || a.expires_at > now));
    }
    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async saveAnnouncement(announcement: Announcement): Promise<void> {
    const announcements = await this.getTable<Announcement>(STORAGE_KEYS.announcements);
    const index = announcements.findIndex(a => a.id === announcement.id);
    if (index >= 0) {
      announcements[index] = { ...announcements[index], ...announcement, updated_at: new Date().toISOString() };
    } else {
      announcements.push({ ...announcement, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    await this.setTable(STORAGE_KEYS.announcements, announcements);
    await this.queueSync('announcements', announcement.id, index >= 0 ? 'update' : 'create', announcement);
  }

  async deleteAnnouncement(id: string): Promise<void> {
    const announcements = await this.getTable<Announcement>(STORAGE_KEYS.announcements);
    const announcement = announcements.find(a => a.id === id);
    await this.setTable(STORAGE_KEYS.announcements, announcements.filter(a => a.id !== id));
    if (announcement) {
      await this.queueSync('announcements', id, 'delete', announcement);
    }
  }

  async queueSync(entityType: string, entityId: string, action: 'create' | 'update' | 'delete', payload: any): Promise<void> {
    const outbox = await this.getTable<SyncOutbox>(STORAGE_KEYS.sync_outbox);
    const existingIndex = outbox.findIndex(
      o => o.entity_type === entityType && o.entity_id === entityId && !o.synced_at
    );

    const syncItem: SyncOutbox = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entity_type: entityType,
      entity_id: entityId,
      action,
      payload: JSON.stringify(payload),
      retry_count: 0,
      created_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      if (action === 'delete' && outbox[existingIndex].action === 'create') {
        outbox.splice(existingIndex, 1);
      } else {
        outbox[existingIndex] = { ...outbox[existingIndex], action, payload: syncItem.payload };
      }
    } else {
      outbox.push(syncItem);
    }

    await this.setTable(STORAGE_KEYS.sync_outbox, outbox);
  }

  async getPendingSyncItems(): Promise<SyncOutbox[]> {
    const outbox = await this.getTable<SyncOutbox>(STORAGE_KEYS.sync_outbox);
    return outbox.filter(o => !o.synced_at);
  }

  async markSynced(id: string): Promise<void> {
    const outbox = await this.getTable<SyncOutbox>(STORAGE_KEYS.sync_outbox);
    const index = outbox.findIndex(o => o.id === id);
    if (index >= 0) {
      outbox[index].synced_at = new Date().toISOString();
      await this.setTable(STORAGE_KEYS.sync_outbox, outbox);
    }
  }

  async markSyncFailed(id: string, error: string): Promise<void> {
    const outbox = await this.getTable<SyncOutbox>(STORAGE_KEYS.sync_outbox);
    const index = outbox.findIndex(o => o.id === id);
    if (index >= 0) {
      outbox[index].retry_count += 1;
      outbox[index].last_error = error;
      await this.setTable(STORAGE_KEYS.sync_outbox, outbox);
    }
  }

  async getSyncAuditLogs(limit = 50): Promise<SyncAudit[]> {
    const logs = await this.getTable<SyncAudit>(STORAGE_KEYS.sync_audit);
    return logs.sort((a, b) => 
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    ).slice(0, limit);
  }

  async addSyncAudit(audit: SyncAudit): Promise<void> {
    const logs = await this.getTable<SyncAudit>(STORAGE_KEYS.sync_audit);
    logs.push(audit);
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    await this.setTable(STORAGE_KEYS.sync_audit, logs);
  }

  async getStats(organizationId: string): Promise<{
    totalUsers: number;
    totalJobs: number;
    pendingJobs: number;
    completedJobs: number;
    inventoryItems: number;
    lowStockItems: number;
    pendingSync: number;
  }> {
    const [users, jobs, inventory, syncOutbox] = await Promise.all([
      this.getUsers(organizationId),
      this.getJobs(organizationId),
      this.getInventoryItems(organizationId),
      this.getPendingSyncItems(),
    ]);

    const lowStockItems = inventory.filter(i => i.is_active && i.quantity_on_hand <= i.minimum_threshold);

    return {
      totalUsers: users.length,
      totalJobs: jobs.length,
      pendingJobs: jobs.filter(j => j.status === 'Pending' || j.status === 'Assigned').length,
      completedJobs: jobs.filter(j => j.status === 'Completed').length,
      inventoryItems: inventory.filter(i => i.is_active).length,
      lowStockItems: lowStockItems.length,
      pendingSync: syncOutbox.length,
    };
  }

  async clearAllData(): Promise<void> {
    for (const key of Object.values(STORAGE_KEYS)) {
      await AsyncStorage.removeItem(key);
    }
    this.initialized = false;
  }
}

export const db = new Database();

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
