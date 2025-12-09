import { db, generateId, Organization, User, Job, JobTask, JobLog, InventoryItem, InventoryTransaction, Setting, Announcement, Technician, JobAssignment } from '../lib/database';
import * as bcrypt from 'bcryptjs';

class LocalDataService {
  private currentOrganizationId: string | null = null;
  private currentUserId: string | null = null;

  async initialize(): Promise<void> {
    await db.initialize();
  }

  setCurrentContext(organizationId: string, userId: string): void {
    this.currentOrganizationId = organizationId;
    this.currentUserId = userId;
  }

  getCurrentOrganizationId(): string | null {
    return this.currentOrganizationId;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  async createOrganization(name: string, code: string): Promise<Organization> {
    const org: Organization = {
      id: generateId(),
      name,
      code: code.toUpperCase(),
      settings: JSON.stringify({
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        workingHours: { start: '08:00', end: '17:00' },
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await db.saveOrganization(org);
    return org;
  }

  async getOrganization(id: string): Promise<Organization | null> {
    return db.getOrganization(id);
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | null> {
    const org = await db.getOrganization(id);
    if (!org) return null;
    const updated = { ...org, ...updates };
    await db.saveOrganization(updated);
    return updated;
  }

  async createUser(data: {
    organizationId: string;
    email: string;
    password: string;
    fullName: string;
    role: User['role'];
    phone?: string;
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user: User = {
      id: generateId(),
      organization_id: data.organizationId,
      email: data.email.toLowerCase(),
      password_hash: passwordHash,
      full_name: data.fullName,
      role: data.role,
      phone: data.phone,
      is_active: true,
      otp_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await db.saveUser(user);
    return user;
  }

  async getUser(id: string): Promise<User | null> {
    return db.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return db.getUserByEmail(email);
  }

  async getUsers(organizationId?: string): Promise<User[]> {
    return db.getUsers(organizationId || this.currentOrganizationId || undefined);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = await db.getUser(id);
    if (!user) return null;
    
    if (updates.password_hash) {
      updates.password_hash = await bcrypt.hash(updates.password_hash, 10);
    }
    
    const updated = { ...user, ...updates };
    await db.saveUser(updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    await db.deleteUser(id);
    return true;
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await db.getUserByEmail(email);
    if (!user || !user.is_active) return null;
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    return isValid ? user : null;
  }

  async enableOTP(userId: string, secret: string): Promise<boolean> {
    const user = await db.getUser(userId);
    if (!user) return false;
    
    await db.saveUser({
      ...user,
      otp_enabled: true,
      otp_secret: secret,
    });
    return true;
  }

  async disableOTP(userId: string): Promise<boolean> {
    const user = await db.getUser(userId);
    if (!user) return false;
    
    await db.saveUser({
      ...user,
      otp_enabled: false,
      otp_secret: undefined,
    });
    return true;
  }

  async createJob(data: {
    title: string;
    description: string;
    jobType: string;
    priority: Job['priority'];
    scheduledDate?: string;
    customerId?: string;
    locationAddress?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<Job> {
    if (!this.currentOrganizationId || !this.currentUserId) {
      throw new Error('No organization context set');
    }

    const jobs = await db.getJobs(this.currentOrganizationId);
    const jobNumber = `JOB-${String(jobs.length + 1).padStart(5, '0')}`;

    const job: Job = {
      id: generateId(),
      organization_id: this.currentOrganizationId,
      job_number: jobNumber,
      title: data.title,
      description: data.description,
      job_type: data.jobType,
      status: 'Pending',
      priority: data.priority,
      scheduled_date: data.scheduledDate,
      customer_id: data.customerId,
      location_address: data.locationAddress,
      latitude: data.latitude,
      longitude: data.longitude,
      created_by: this.currentUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.saveJob(job);
    await this.addJobLog(job.id, 'Created', `Job ${jobNumber} created`);
    return job;
  }

  async getJob(id: string): Promise<Job | null> {
    return db.getJob(id);
  }

  async getJobs(filters?: {
    status?: Job['status'];
    priority?: Job['priority'];
    technicianId?: string;
  }): Promise<Job[]> {
    let jobs = await db.getJobs(this.currentOrganizationId || undefined);
    
    if (filters?.status) {
      jobs = jobs.filter(j => j.status === filters.status);
    }
    if (filters?.priority) {
      jobs = jobs.filter(j => j.priority === filters.priority);
    }
    if (filters?.technicianId) {
      const assignments = await db.getJobAssignments();
      const assignedJobIds = new Set(
        assignments.filter(a => a.technician_id === filters.technicianId).map(a => a.job_id)
      );
      jobs = jobs.filter(j => assignedJobIds.has(j.id));
    }

    return jobs.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | null> {
    const job = await db.getJob(id);
    if (!job) return null;

    const oldStatus = job.status;
    const updated = { ...job, ...updates };
    await db.saveJob(updated);

    if (updates.status && updates.status !== oldStatus) {
      await this.addJobLog(id, 'Status Changed', `Status changed from ${oldStatus} to ${updates.status}`);
      
      if (updates.status === 'Completed') {
        await db.saveJob({ ...updated, completed_date: new Date().toISOString() });
      }
    }

    return updated;
  }

  async deleteJob(id: string): Promise<boolean> {
    await db.deleteJob(id);
    return true;
  }

  async assignJob(jobId: string, technicianId: string): Promise<JobAssignment> {
    if (!this.currentUserId) {
      throw new Error('No user context set');
    }

    const assignment: JobAssignment = {
      id: generateId(),
      job_id: jobId,
      technician_id: technicianId,
      assigned_by: this.currentUserId,
      assigned_at: new Date().toISOString(),
      status: 'Assigned',
    };

    await db.saveJobAssignment(assignment);
    await this.updateJob(jobId, { status: 'Assigned' });
    await this.addJobLog(jobId, 'Assigned', `Job assigned to technician ${technicianId}`);

    return assignment;
  }

  async addJobTask(jobId: string, taskName: string, taskType: string): Promise<JobTask> {
    const tasks = await db.getJobTasks(jobId);
    const task: JobTask = {
      id: generateId(),
      job_id: jobId,
      task_name: taskName,
      task_type: taskType,
      status: 'Pending',
      sequence_order: tasks.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await db.saveJobTask(task);
    return task;
  }

  async updateJobTask(id: string, updates: Partial<JobTask>): Promise<JobTask | null> {
    const tasks = await db.getJobTasks('');
    const task = tasks.find(t => t.id === id);
    if (!task) return null;

    const updated = { ...task, ...updates };
    if (updates.status === 'Completed' && !task.completed_at) {
      updated.completed_at = new Date().toISOString();
      updated.completed_by = this.currentUserId || undefined;
    }
    await db.saveJobTask(updated);
    return updated;
  }

  async getJobTasks(jobId: string): Promise<JobTask[]> {
    return db.getJobTasks(jobId);
  }

  async addJobLog(jobId: string, action: string, details: string): Promise<void> {
    const log: JobLog = {
      id: generateId(),
      job_id: jobId,
      user_id: this.currentUserId || 'system',
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    await db.addJobLog(log);
  }

  async getJobLogs(jobId: string): Promise<JobLog[]> {
    return db.getJobLogs(jobId);
  }

  async createInventoryItem(data: {
    itemCode: string;
    name: string;
    description: string;
    category: string;
    unit: string;
    initialQuantity: number;
    minimumThreshold: number;
    maximumThreshold: number;
    unitCost: number;
    location: string;
  }): Promise<InventoryItem> {
    if (!this.currentOrganizationId) {
      throw new Error('No organization context set');
    }

    const item: InventoryItem = {
      id: generateId(),
      organization_id: this.currentOrganizationId,
      item_code: data.itemCode,
      name: data.name,
      description: data.description,
      category: data.category,
      unit: data.unit,
      quantity_on_hand: data.initialQuantity,
      minimum_threshold: data.minimumThreshold,
      maximum_threshold: data.maximumThreshold,
      unit_cost: data.unitCost,
      location: data.location,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.saveInventoryItem(item);
    return item;
  }

  async getInventoryItem(id: string): Promise<InventoryItem | null> {
    return db.getInventoryItem(id);
  }

  async getInventoryItems(filters?: {
    category?: string;
    lowStock?: boolean;
    search?: string;
  }): Promise<InventoryItem[]> {
    let items = await db.getInventoryItems(this.currentOrganizationId || undefined);

    if (filters?.category) {
      items = items.filter(i => i.category === filters.category);
    }
    if (filters?.lowStock) {
      items = items.filter(i => i.quantity_on_hand <= i.minimum_threshold);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      items = items.filter(i => 
        i.name.toLowerCase().includes(search) ||
        i.item_code.toLowerCase().includes(search) ||
        i.description.toLowerCase().includes(search)
      );
    }

    return items.filter(i => i.is_active);
  }

  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
    const item = await db.getInventoryItem(id);
    if (!item) return null;
    
    const updated = { ...item, ...updates };
    await db.saveInventoryItem(updated);
    return updated;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const item = await db.getInventoryItem(id);
    if (!item) return false;
    
    await db.saveInventoryItem({ ...item, is_active: false });
    return true;
  }

  async addStock(itemId: string, quantity: number, notes?: string): Promise<InventoryTransaction> {
    if (!this.currentUserId) {
      throw new Error('No user context set');
    }

    const transaction: InventoryTransaction = {
      id: generateId(),
      item_id: itemId,
      transaction_type: 'In',
      quantity,
      notes,
      performed_by: this.currentUserId,
      performed_at: new Date().toISOString(),
    };

    await db.addInventoryTransaction(transaction);
    return transaction;
  }

  async removeStock(itemId: string, quantity: number, referenceType?: string, referenceId?: string, notes?: string): Promise<InventoryTransaction> {
    if (!this.currentUserId) {
      throw new Error('No user context set');
    }

    const item = await db.getInventoryItem(itemId);
    if (!item || item.quantity_on_hand < quantity) {
      throw new Error('Insufficient stock');
    }

    const transaction: InventoryTransaction = {
      id: generateId(),
      item_id: itemId,
      transaction_type: 'Out',
      quantity,
      reference_type: referenceType,
      reference_id: referenceId,
      notes,
      performed_by: this.currentUserId,
      performed_at: new Date().toISOString(),
    };

    await db.addInventoryTransaction(transaction);
    return transaction;
  }

  async adjustStock(itemId: string, newQuantity: number, notes?: string): Promise<InventoryTransaction> {
    if (!this.currentUserId) {
      throw new Error('No user context set');
    }

    const transaction: InventoryTransaction = {
      id: generateId(),
      item_id: itemId,
      transaction_type: 'Adjustment',
      quantity: newQuantity,
      notes,
      performed_by: this.currentUserId,
      performed_at: new Date().toISOString(),
    };

    await db.addInventoryTransaction(transaction);
    return transaction;
  }

  async getInventoryTransactions(itemId: string): Promise<InventoryTransaction[]> {
    return db.getInventoryTransactions(itemId);
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    if (!this.currentOrganizationId) return [];
    return db.getLowStockItems(this.currentOrganizationId);
  }

  async getSetting(key: string): Promise<string | null> {
    if (!this.currentOrganizationId) return null;
    const setting = await db.getSetting(this.currentOrganizationId, key);
    return setting?.value || null;
  }

  async getSettings(category?: string): Promise<Setting[]> {
    if (!this.currentOrganizationId) return [];
    return db.getSettings(this.currentOrganizationId, category);
  }

  async setSetting(category: string, key: string, value: string): Promise<void> {
    if (!this.currentOrganizationId) {
      throw new Error('No organization context set');
    }

    const existing = await db.getSetting(this.currentOrganizationId, key);
    const setting: Setting = {
      id: existing?.id || generateId(),
      organization_id: this.currentOrganizationId,
      category,
      key,
      value,
      updated_by: this.currentUserId || undefined,
      updated_at: new Date().toISOString(),
    };
    await db.saveSetting(setting);
  }

  async createAnnouncement(data: {
    title: string;
    content: string;
    priority: Announcement['priority'];
    targetRoles: string[];
    expiresAt?: string;
  }): Promise<Announcement> {
    if (!this.currentOrganizationId || !this.currentUserId) {
      throw new Error('No organization context set');
    }

    const announcement: Announcement = {
      id: generateId(),
      organization_id: this.currentOrganizationId,
      title: data.title,
      content: data.content,
      priority: data.priority,
      target_roles: JSON.stringify(data.targetRoles),
      is_active: true,
      expires_at: data.expiresAt,
      created_by: this.currentUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.saveAnnouncement(announcement);
    return announcement;
  }

  async getAnnouncements(activeOnly = true): Promise<Announcement[]> {
    if (!this.currentOrganizationId) return [];
    return db.getAnnouncements(this.currentOrganizationId, activeOnly);
  }

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement | null> {
    const announcements = await this.getAnnouncements(false);
    const announcement = announcements.find(a => a.id === id);
    if (!announcement) return null;

    const updated = { ...announcement, ...updates };
    await db.saveAnnouncement(updated);
    return updated;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    await db.deleteAnnouncement(id);
    return true;
  }

  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalJobs: number;
    pendingJobs: number;
    completedJobs: number;
    inventoryItems: number;
    lowStockItems: number;
    pendingSync: number;
    activeAnnouncements: number;
  }> {
    if (!this.currentOrganizationId) {
      return {
        totalUsers: 0,
        totalJobs: 0,
        pendingJobs: 0,
        completedJobs: 0,
        inventoryItems: 0,
        lowStockItems: 0,
        pendingSync: 0,
        activeAnnouncements: 0,
      };
    }

    const [stats, announcements] = await Promise.all([
      db.getStats(this.currentOrganizationId),
      this.getAnnouncements(true),
    ]);

    return {
      ...stats,
      activeAnnouncements: announcements.length,
    };
  }

  async getPendingSyncCount(): Promise<number> {
    const items = await db.getPendingSyncItems();
    return items.length;
  }
}

export const localDataService = new LocalDataService();
export default localDataService;
