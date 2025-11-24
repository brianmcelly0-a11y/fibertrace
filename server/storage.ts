import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  type User,
  type InsertUser,
  type Client,
  type InsertClient,
  type Job,
  type InsertJob,
  type InventoryItem,
  type InsertInventoryItem,
  type MeterReading,
  type InsertMeterReading,
  type InsertInventoryUsage,
  type Olt,
  type InsertOlt,
  type Odf,
  type InsertOdf,
  type Splitter,
  type InsertSplitter,
  type Fat,
  type InsertFat,
  type Atb,
  type InsertAtb,
  type Closure,
  type InsertClosure,
  type SpliceRecord,
  type InsertSpliceRecord,
  type PowerReading,
  type InsertPowerReading,
  type FiberRoute,
  type InsertFiberRoute,
  type FieldReport,
  type InsertFieldReport,
  users,
  clients,
  jobs,
  inventoryItems,
  meterReadings,
  inventoryUsage,
  olts,
  odfs,
  splitters,
  fats,
  atbs,
  closures,
  spliceRecords,
  powerReadings,
  fiberRoutes,
  fieldReports,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Jobs
  getJobs(): Promise<Array<Job & { clientName: string }>>;
  getJobsByTechnician(technicianId: number): Promise<Array<Job & { clientName: string }>>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;

  // Inventory
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  useInventoryItem(usage: InsertInventoryUsage): Promise<void>;

  // Meter Readings
  getMeterReadingsByJob(jobId: number): Promise<MeterReading[]>;
  createMeterReading(reading: InsertMeterReading): Promise<MeterReading>;

  // Analytics
  getJobStatsByTechnician(technicianId: number): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  }>;

  // OLT Management
  getOlts(): Promise<Olt[]>;
  getOlt(id: number): Promise<Olt | undefined>;
  createOlt(olt: InsertOlt): Promise<Olt>;
  updateOlt(id: number, olt: Partial<InsertOlt>): Promise<Olt | undefined>;
  deleteOlt(id: number): Promise<boolean>;

  // ODF Management
  getOdfs(): Promise<Odf[]>;
  getOdf(id: number): Promise<Odf | undefined>;
  createOdf(odf: InsertOdf): Promise<Odf>;
  updateOdf(id: number, odf: Partial<InsertOdf>): Promise<Odf | undefined>;
  deleteOdf(id: number): Promise<boolean>;

  // Splitter Management
  getSplitters(): Promise<Splitter[]>;
  getSplitter(id: number): Promise<Splitter | undefined>;
  getSplittersByParent(parentNodeId: number, parentNodeType: string): Promise<Splitter[]>;
  createSplitter(splitter: InsertSplitter): Promise<Splitter>;
  updateSplitter(id: number, splitter: Partial<InsertSplitter>): Promise<Splitter | undefined>;
  deleteSplitter(id: number): Promise<boolean>;

  // FAT Management
  getFats(): Promise<Fat[]>;
  getFat(id: number): Promise<Fat | undefined>;
  getFatsBySplitter(splitterId: number): Promise<Fat[]>;
  createFat(fat: InsertFat): Promise<Fat>;
  updateFat(id: number, fat: Partial<InsertFat>): Promise<Fat | undefined>;
  deleteFat(id: number): Promise<boolean>;

  // ATB Management
  getAtbs(): Promise<Atb[]>;
  getAtb(id: number): Promise<Atb | undefined>;
  getAtbsByFat(fatId: number): Promise<Atb[]>;
  createAtb(atb: InsertAtb): Promise<Atb>;
  updateAtb(id: number, atb: Partial<InsertAtb>): Promise<Atb | undefined>;
  deleteAtb(id: number): Promise<boolean>;

  // Closure Management
  getClosures(): Promise<Closure[]>;
  getClosure(id: number): Promise<Closure | undefined>;
  getClosuresByParent(parentNodeId: number, parentNodeType: string): Promise<Closure[]>;
  createClosure(closure: InsertClosure): Promise<Closure>;
  updateClosure(id: number, closure: Partial<InsertClosure>): Promise<Closure | undefined>;
  deleteClosure(id: number): Promise<boolean>;

  // Splice Records Management
  getSpliceRecords(): Promise<SpliceRecord[]>;
  getSpliceRecord(id: number): Promise<SpliceRecord | undefined>;
  getSpliceRecordsByClosure(closureId: number): Promise<SpliceRecord[]>;
  getSpliceRecordsByJob(jobId: number): Promise<SpliceRecord[]>;
  createSpliceRecord(record: InsertSpliceRecord): Promise<SpliceRecord>;
  updateSpliceRecord(id: number, record: Partial<InsertSpliceRecord>): Promise<SpliceRecord | undefined>;
  deleteSpliceRecord(id: number): Promise<boolean>;

  // Power Readings Management
  getPowerReadings(): Promise<PowerReading[]>;
  getPowerReading(id: number): Promise<PowerReading | undefined>;
  getPowerReadingsByNode(nodeId: number, nodeType: string): Promise<PowerReading[]>;
  createPowerReading(reading: InsertPowerReading): Promise<PowerReading>;
  updatePowerReading(id: number, reading: Partial<InsertPowerReading>): Promise<PowerReading | undefined>;
  deletePowerReading(id: number): Promise<boolean>;

  // Fiber Routes Management
  getFiberRoutes(): Promise<FiberRoute[]>;
  getFiberRoute(id: number): Promise<FiberRoute | undefined>;
  getFiberRoutesByJob(jobId: number): Promise<FiberRoute[]>;
  createFiberRoute(route: InsertFiberRoute): Promise<FiberRoute>;
  updateFiberRoute(id: number, route: Partial<InsertFiberRoute>): Promise<FiberRoute | undefined>;
  deleteFiberRoute(id: number): Promise<boolean>;

  // Field Reports Management
  getFieldReports(): Promise<FieldReport[]>;
  getFieldReport(id: number): Promise<FieldReport | undefined>;
  getFieldReportsByJob(jobId: number): Promise<FieldReport[]>;
  getFieldReportsByTechnician(technicianId: number): Promise<FieldReport[]>;
  createFieldReport(report: InsertFieldReport): Promise<FieldReport>;
  updateFieldReport(id: number, report: Partial<InsertFieldReport>): Promise<FieldReport | undefined>;
  deleteFieldReport(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return result[0];
  }

  async createClient(client: InsertClient): Promise<Client> {
    const result = await db.insert(clients).values(client).returning();
    return result[0];
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined> {
    const result = await db.update(clients)
      .set(client)
      .where(eq(clients.id, id))
      .returning();
    return result[0];
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id)).returning();
    return result.length > 0;
  }

  // Jobs
  async getJobs(): Promise<Array<Job & { clientName: string }>> {
    const result = await db
      .select({
        id: jobs.id,
        clientId: jobs.clientId,
        technicianId: jobs.technicianId,
        type: jobs.type,
        status: jobs.status,
        scheduledDate: jobs.scheduledDate,
        completedDate: jobs.completedDate,
        address: jobs.address,
        latitude: jobs.latitude,
        longitude: jobs.longitude,
        notes: jobs.notes,
        cableUsed: jobs.cableUsed,
        materialsUsed: jobs.materialsUsed,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
        clientName: clients.name,
      })
      .from(jobs)
      .leftJoin(clients, eq(jobs.clientId, clients.id))
      .orderBy(desc(jobs.scheduledDate));
    
    return result.map((r: any) => ({
      ...r,
      clientName: r.clientName || 'Unknown Client'
    }));
  }

  async getJobsByTechnician(technicianId: number): Promise<Array<Job & { clientName: string }>> {
    const result = await db
      .select({
        id: jobs.id,
        clientId: jobs.clientId,
        technicianId: jobs.technicianId,
        type: jobs.type,
        status: jobs.status,
        scheduledDate: jobs.scheduledDate,
        completedDate: jobs.completedDate,
        address: jobs.address,
        latitude: jobs.latitude,
        longitude: jobs.longitude,
        notes: jobs.notes,
        cableUsed: jobs.cableUsed,
        materialsUsed: jobs.materialsUsed,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
        clientName: clients.name,
      })
      .from(jobs)
      .leftJoin(clients, eq(jobs.clientId, clients.id))
      .where(eq(jobs.technicianId, technicianId))
      .orderBy(desc(jobs.scheduledDate));
    
    return result.map((r: any) => ({
      ...r,
      clientName: r.clientName || 'Unknown Client'
    }));
  }

  async getJob(id: number): Promise<Job | undefined> {
    const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return result[0];
  }

  async createJob(job: InsertJob): Promise<Job> {
    const result = await db.insert(jobs).values(job).returning();
    return result[0];
  }

  async updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined> {
    const result = await db.update(jobs)
      .set({ ...job, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return result[0];
  }

  async deleteJob(id: number): Promise<boolean> {
    const result = await db.delete(jobs).where(eq(jobs.id, id)).returning();
    return result.length > 0;
  }

  // Inventory
  async getInventoryItems(): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems).orderBy(inventoryItems.name);
  }

  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    const result = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).limit(1);
    return result[0];
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const result = await db.insert(inventoryItems).values(item).returning();
    return result[0];
  }

  async updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    // Auto-update status based on quantity
    const updates: any = { ...item };
    if (item.quantity !== undefined) {
      const currentItem = await this.getInventoryItem(id);
      if (currentItem) {
        if (item.quantity === 0) {
          updates.status = 'Out of Stock';
        } else if (item.quantity < currentItem.minStockLevel) {
          updates.status = 'Low Stock';
        } else {
          updates.status = 'In Stock';
        }
      }
    }

    const result = await db.update(inventoryItems)
      .set(updates)
      .where(eq(inventoryItems.id, id))
      .returning();
    return result[0];
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    const result = await db.delete(inventoryItems).where(eq(inventoryItems.id, id)).returning();
    return result.length > 0;
  }

  async useInventoryItem(usage: InsertInventoryUsage): Promise<void> {
    await db.transaction(async (tx: any) => {
      // Log the usage
      await tx.insert(inventoryUsage).values(usage);
      
      // Update inventory quantity
      const item = await tx.select().from(inventoryItems).where(eq(inventoryItems.id, usage.itemId)).limit(1);
      if (item[0]) {
        const newQuantity = item[0].quantity - usage.quantityUsed;
        await tx.update(inventoryItems)
          .set({ quantity: newQuantity })
          .where(eq(inventoryItems.id, usage.itemId));
      }
    });
  }

  // Meter Readings
  async getMeterReadingsByJob(jobId: number): Promise<MeterReading[]> {
    return db.select().from(meterReadings)
      .where(eq(meterReadings.jobId, jobId))
      .orderBy(desc(meterReadings.timestamp));
  }

  async createMeterReading(reading: InsertMeterReading): Promise<MeterReading> {
    const result = await db.insert(meterReadings).values(reading).returning();
    return result[0];
  }

  // Analytics
  async getJobStatsByTechnician(technicianId: number): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  }> {
    const result = await db
      .select({
        status: jobs.status,
        count: sql<number>`count(*)::int`,
      })
      .from(jobs)
      .where(eq(jobs.technicianId, technicianId))
      .groupBy(jobs.status);

    const stats = {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
    };

    for (const row of result) {
      const count = Number(row.count);
      stats.total += count;
      if (row.status === 'Pending') stats.pending = count;
      if (row.status === 'In Progress') stats.inProgress = count;
      if (row.status === 'Completed') stats.completed = count;
    }

    return stats;
  }

  // OLT Management
  async getOlts(): Promise<Olt[]> {
    return db.select().from(olts).orderBy(desc(olts.createdAt));
  }

  async getOlt(id: number): Promise<Olt | undefined> {
    const result = await db.select().from(olts).where(eq(olts.id, id)).limit(1);
    return result[0];
  }

  async createOlt(olt: InsertOlt): Promise<Olt> {
    const result = await db.insert(olts).values(olt).returning();
    return result[0];
  }

  async updateOlt(id: number, olt: Partial<InsertOlt>): Promise<Olt | undefined> {
    const result = await db.update(olts)
      .set({ ...olt, updatedAt: new Date() })
      .where(eq(olts.id, id))
      .returning();
    return result[0];
  }

  async deleteOlt(id: number): Promise<boolean> {
    const result = await db.delete(olts).where(eq(olts.id, id)).returning();
    return result.length > 0;
  }

  // ODF Management
  async getOdfs(): Promise<Odf[]> {
    return db.select().from(odfs).orderBy(desc(odfs.createdAt));
  }

  async getOdf(id: number): Promise<Odf | undefined> {
    const result = await db.select().from(odfs).where(eq(odfs.id, id)).limit(1);
    return result[0];
  }

  async createOdf(odf: InsertOdf): Promise<Odf> {
    const result = await db.insert(odfs).values(odf).returning();
    return result[0];
  }

  async updateOdf(id: number, odf: Partial<InsertOdf>): Promise<Odf | undefined> {
    const result = await db.update(odfs)
      .set({ ...odf, updatedAt: new Date() })
      .where(eq(odfs.id, id))
      .returning();
    return result[0];
  }

  async deleteOdf(id: number): Promise<boolean> {
    const result = await db.delete(odfs).where(eq(odfs.id, id)).returning();
    return result.length > 0;
  }

  // Splitter Management
  async getSplitters(): Promise<Splitter[]> {
    return db.select().from(splitters).orderBy(desc(splitters.createdAt));
  }

  async getSplitter(id: number): Promise<Splitter | undefined> {
    const result = await db.select().from(splitters).where(eq(splitters.id, id)).limit(1);
    return result[0];
  }

  async getSplittersByParent(parentNodeId: number, parentNodeType: string): Promise<Splitter[]> {
    return db.select().from(splitters)
      .where(and(eq(splitters.parentNodeId, parentNodeId), eq(splitters.parentNodeType, parentNodeType)))
      .orderBy(desc(splitters.createdAt));
  }

  async createSplitter(splitter: InsertSplitter): Promise<Splitter> {
    const result = await db.insert(splitters).values(splitter).returning();
    return result[0];
  }

  async updateSplitter(id: number, splitter: Partial<InsertSplitter>): Promise<Splitter | undefined> {
    const result = await db.update(splitters)
      .set({ ...splitter, updatedAt: new Date() })
      .where(eq(splitters.id, id))
      .returning();
    return result[0];
  }

  async deleteSplitter(id: number): Promise<boolean> {
    const result = await db.delete(splitters).where(eq(splitters.id, id)).returning();
    return result.length > 0;
  }

  // FAT Management
  async getFats(): Promise<Fat[]> {
    return db.select().from(fats).orderBy(desc(fats.createdAt));
  }

  async getFat(id: number): Promise<Fat | undefined> {
    const result = await db.select().from(fats).where(eq(fats.id, id)).limit(1);
    return result[0];
  }

  async getFatsBySplitter(splitterId: number): Promise<Fat[]> {
    return db.select().from(fats)
      .where(eq(fats.splitterId, splitterId))
      .orderBy(desc(fats.createdAt));
  }

  async createFat(fat: InsertFat): Promise<Fat> {
    const result = await db.insert(fats).values(fat).returning();
    return result[0];
  }

  async updateFat(id: number, fat: Partial<InsertFat>): Promise<Fat | undefined> {
    const result = await db.update(fats)
      .set({ ...fat, updatedAt: new Date() })
      .where(eq(fats.id, id))
      .returning();
    return result[0];
  }

  async deleteFat(id: number): Promise<boolean> {
    const result = await db.delete(fats).where(eq(fats.id, id)).returning();
    return result.length > 0;
  }

  // ATB Management
  async getAtbs(): Promise<Atb[]> {
    return db.select().from(atbs).orderBy(desc(atbs.createdAt));
  }

  async getAtb(id: number): Promise<Atb | undefined> {
    const result = await db.select().from(atbs).where(eq(atbs.id, id)).limit(1);
    return result[0];
  }

  async getAtbsByFat(fatId: number): Promise<Atb[]> {
    return db.select().from(atbs)
      .where(eq(atbs.fatId, fatId))
      .orderBy(desc(atbs.createdAt));
  }

  async createAtb(atb: InsertAtb): Promise<Atb> {
    const result = await db.insert(atbs).values(atb).returning();
    return result[0];
  }

  async updateAtb(id: number, atb: Partial<InsertAtb>): Promise<Atb | undefined> {
    const result = await db.update(atbs)
      .set({ ...atb, updatedAt: new Date() })
      .where(eq(atbs.id, id))
      .returning();
    return result[0];
  }

  async deleteAtb(id: number): Promise<boolean> {
    const result = await db.delete(atbs).where(eq(atbs.id, id)).returning();
    return result.length > 0;
  }

  // Closure Management
  async getClosures(): Promise<Closure[]> {
    return db.select().from(closures).orderBy(desc(closures.createdAt));
  }

  async getClosure(id: number): Promise<Closure | undefined> {
    const result = await db.select().from(closures).where(eq(closures.id, id)).limit(1);
    return result[0];
  }

  async getClosuresByParent(parentNodeId: number, parentNodeType: string): Promise<Closure[]> {
    return db.select().from(closures)
      .where(and(eq(closures.parentNodeId, parentNodeId), eq(closures.parentNodeType, parentNodeType)))
      .orderBy(desc(closures.createdAt));
  }

  async createClosure(closure: InsertClosure): Promise<Closure> {
    const result = await db.insert(closures).values(closure).returning();
    return result[0];
  }

  async updateClosure(id: number, closure: Partial<InsertClosure>): Promise<Closure | undefined> {
    const result = await db.update(closures)
      .set({ ...closure, updatedAt: new Date() })
      .where(eq(closures.id, id))
      .returning();
    return result[0];
  }

  async deleteClosure(id: number): Promise<boolean> {
    const result = await db.delete(closures).where(eq(closures.id, id)).returning();
    return result.length > 0;
  }

  // Splice Records Management
  async getSpliceRecords(): Promise<SpliceRecord[]> {
    return db.select().from(spliceRecords).orderBy(desc(spliceRecords.spliceDate));
  }

  async getSpliceRecord(id: number): Promise<SpliceRecord | undefined> {
    const result = await db.select().from(spliceRecords).where(eq(spliceRecords.id, id)).limit(1);
    return result[0];
  }

  async getSpliceRecordsByClosure(closureId: number): Promise<SpliceRecord[]> {
    return db.select().from(spliceRecords)
      .where(eq(spliceRecords.closureId, closureId))
      .orderBy(desc(spliceRecords.spliceDate));
  }

  async getSpliceRecordsByJob(jobId: number): Promise<SpliceRecord[]> {
    return db.select().from(spliceRecords)
      .where(eq(spliceRecords.jobId, jobId))
      .orderBy(desc(spliceRecords.spliceDate));
  }

  async createSpliceRecord(record: InsertSpliceRecord): Promise<SpliceRecord> {
    const result = await db.insert(spliceRecords).values(record).returning();
    return result[0];
  }

  async updateSpliceRecord(id: number, record: Partial<InsertSpliceRecord>): Promise<SpliceRecord | undefined> {
    const result = await db.update(spliceRecords)
      .set(record)
      .where(eq(spliceRecords.id, id))
      .returning();
    return result[0];
  }

  async deleteSpliceRecord(id: number): Promise<boolean> {
    const result = await db.delete(spliceRecords).where(eq(spliceRecords.id, id)).returning();
    return result.length > 0;
  }

  // Power Readings Management
  async getPowerReadings(): Promise<PowerReading[]> {
    return db.select().from(powerReadings).orderBy(desc(powerReadings.readingDate));
  }

  async getPowerReading(id: number): Promise<PowerReading | undefined> {
    const result = await db.select().from(powerReadings).where(eq(powerReadings.id, id)).limit(1);
    return result[0];
  }

  async getPowerReadingsByNode(nodeId: number, nodeType: string): Promise<PowerReading[]> {
    return db.select().from(powerReadings)
      .where(and(eq(powerReadings.nodeId, nodeId), eq(powerReadings.nodeType, nodeType)))
      .orderBy(desc(powerReadings.readingDate));
  }

  async createPowerReading(reading: InsertPowerReading): Promise<PowerReading> {
    const result = await db.insert(powerReadings).values(reading).returning();
    return result[0];
  }

  async updatePowerReading(id: number, reading: Partial<InsertPowerReading>): Promise<PowerReading | undefined> {
    const result = await db.update(powerReadings)
      .set(reading)
      .where(eq(powerReadings.id, id))
      .returning();
    return result[0];
  }

  async deletePowerReading(id: number): Promise<boolean> {
    const result = await db.delete(powerReadings).where(eq(powerReadings.id, id)).returning();
    return result.length > 0;
  }

  // Fiber Routes Management
  async getFiberRoutes(): Promise<FiberRoute[]> {
    return db.select().from(fiberRoutes).orderBy(desc(fiberRoutes.createdAt));
  }

  async getFiberRoute(id: number): Promise<FiberRoute | undefined> {
    const result = await db.select().from(fiberRoutes).where(eq(fiberRoutes.id, id)).limit(1);
    return result[0];
  }

  async getFiberRoutesByJob(jobId: number): Promise<FiberRoute[]> {
    return db.select().from(fiberRoutes)
      .where(eq(fiberRoutes.jobId, jobId))
      .orderBy(desc(fiberRoutes.createdAt));
  }

  async createFiberRoute(route: InsertFiberRoute): Promise<FiberRoute> {
    const result = await db.insert(fiberRoutes).values(route).returning();
    return result[0];
  }

  async updateFiberRoute(id: number, route: Partial<InsertFiberRoute>): Promise<FiberRoute | undefined> {
    const result = await db.update(fiberRoutes)
      .set(route)
      .where(eq(fiberRoutes.id, id))
      .returning();
    return result[0];
  }

  async deleteFiberRoute(id: number): Promise<boolean> {
    const result = await db.delete(fiberRoutes).where(eq(fiberRoutes.id, id)).returning();
    return result.length > 0;
  }

  // Field Reports Management
  async getFieldReports(): Promise<FieldReport[]> {
    return db.select().from(fieldReports).orderBy(desc(fieldReports.createdAt));
  }

  async getFieldReport(id: number): Promise<FieldReport | undefined> {
    const result = await db.select().from(fieldReports).where(eq(fieldReports.id, id)).limit(1);
    return result[0];
  }

  async getFieldReportsByJob(jobId: number): Promise<FieldReport[]> {
    return db.select().from(fieldReports)
      .where(eq(fieldReports.jobId, jobId))
      .orderBy(desc(fieldReports.createdAt));
  }

  async getFieldReportsByTechnician(technicianId: number): Promise<FieldReport[]> {
    return db.select().from(fieldReports)
      .where(eq(fieldReports.technicianId, technicianId))
      .orderBy(desc(fieldReports.createdAt));
  }

  async createFieldReport(report: InsertFieldReport): Promise<FieldReport> {
    const result = await db.insert(fieldReports).values(report).returning();
    return result[0];
  }

  async updateFieldReport(id: number, report: Partial<InsertFieldReport>): Promise<FieldReport | undefined> {
    const result = await db.update(fieldReports)
      .set({ ...report, updatedAt: new Date() })
      .where(eq(fieldReports.id, id))
      .returning();
    return result[0];
  }

  async deleteFieldReport(id: number): Promise<boolean> {
    const result = await db.delete(fieldReports).where(eq(fieldReports.id, id)).returning();
    return result.length > 0;
  }
}

// In-Memory Storage Implementation for Offline Functionality
export class MemoryStorage implements IStorage {
  private users: User[] = [];
  private clients: Client[] = [];
  private jobs: Array<Job> = [];
  private inventoryItems: InventoryItem[] = [];
  private meterReadings: MeterReading[] = [];
  private inventoryUsageLog: any[] = [];
  private nextUserId = 1;
  private nextClientId = 1;
  private nextJobId = 1;
  private nextInventoryId = 1;
  private nextMeterReadingId = 1;
  private nextInventoryUsageId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed Users (Technicians)
    this.users = [
      {
        id: 1,
        email: "alex.tech@fibertrace.com",
        password: "$2b$10$WJsi2tKOEdxDSvRHyFKti.W.Ipq2mSjX9SZzmwSXvcXN7Cdi/Io2m", // password: "password"
        name: "Alex Rodriguez",
        role: "Senior Technician",
        phone: "+1 (555) 123-4567",
        createdAt: new Date("2024-01-15"),
      },
      {
        id: 2,
        email: "sarah.chen@fibertrace.com",
        password: "$2b$10$WJsi2tKOEdxDSvRHyFKti.W.Ipq2mSjX9SZzmwSXvcXN7Cdi/Io2m", // password: "password"
        name: "Sarah Chen",
        role: "Technician",
        phone: "+1 (555) 234-5678",
        createdAt: new Date("2024-02-10"),
      },
      {
        id: 3,
        email: "mike.johnson@fibertrace.com",
        password: "$2b$10$WJsi2tKOEdxDSvRHyFKti.W.Ipq2mSjX9SZzmwSXvcXN7Cdi/Io2m", // password: "password"
        name: "Mike Johnson",
        role: "Lead Technician",
        phone: "+1 (555) 345-6789",
        createdAt: new Date("2023-11-20"),
      },
    ];
    this.nextUserId = 4;

    // Seed Clients
    this.clients = [
      {
        id: 1,
        name: "TechCorp HQ",
        email: "admin@techcorp.com",
        phone: "+1 (555) 100-2001",
        address: "123 Silicon Valley Blvd, San Jose, CA 95110",
        package: "Enterprise",
        status: "Active",
        latitude: "37.33874",
        longitude: "-121.88485",
        createdAt: new Date("2024-01-10"),
      },
      {
        id: 2,
        name: "Downtown Medical Center",
        email: "it@downtownmedical.com",
        phone: "+1 (555) 200-3002",
        address: "456 Healthcare Ave, San Francisco, CA 94102",
        package: "Gold",
        status: "Active",
        latitude: "37.77493",
        longitude: "-122.41942",
        createdAt: new Date("2024-01-12"),
      },
      {
        id: 3,
        name: "StartupHub Co-working",
        email: "facilities@startuphub.com",
        phone: "+1 (555) 300-4003",
        address: "789 Innovation Dr, Palo Alto, CA 94301",
        package: "Silver",
        status: "Active",
        latitude: "37.44188",
        longitude: "-122.14302",
        createdAt: new Date("2024-02-01"),
      },
      {
        id: 4,
        name: "Green Valley Apartments",
        email: "manager@greenvalley.com",
        phone: "+1 (555) 400-5004",
        address: "321 Residential St, Mountain View, CA 94040",
        package: "Bronze",
        status: "Active",
        latitude: "37.38605",
        longitude: "-122.08385",
        createdAt: new Date("2024-02-15"),
      },
      {
        id: 5,
        name: "Riverside Shopping Mall",
        email: "ops@riversidemail.com",
        phone: "+1 (555) 500-6005",
        address: "555 Commerce Way, San Mateo, CA 94401",
        package: "Gold",
        status: "Active",
        latitude: "37.56299",
        longitude: "-122.32553",
        createdAt: new Date("2024-03-01"),
      },
    ];
    this.nextClientId = 6;

    // Seed Jobs
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    this.jobs = [
      {
        id: 1,
        clientId: 1,
        technicianId: 1,
        type: "Fiber Installation",
        status: "Completed",
        scheduledDate: yesterday,
        completedDate: yesterday,
        address: "123 Silicon Valley Blvd, San Jose, CA 95110",
        latitude: "37.33874",
        longitude: "-121.88485",
        notes: "New fiber line installation for main building. Customer satisfied.",
        cableUsed: "Single-mode OS2, 500m",
        materialsUsed: "10x SC connectors, 2x patch panels",
        createdAt: new Date("2024-03-10"),
        updatedAt: yesterday,
      },
      {
        id: 2,
        clientId: 2,
        technicianId: 1,
        type: "Maintenance",
        status: "In Progress",
        scheduledDate: now,
        completedDate: null,
        address: "456 Healthcare Ave, San Francisco, CA 94102",
        latitude: "37.77493",
        longitude: "-122.41942",
        notes: "Quarterly maintenance check. Signal degradation reported on line 3.",
        cableUsed: null,
        materialsUsed: null,
        createdAt: new Date("2024-03-15"),
        updatedAt: now,
      },
      {
        id: 3,
        clientId: 3,
        technicianId: 1,
        type: "Troubleshooting",
        status: "Pending",
        scheduledDate: tomorrow,
        completedDate: null,
        address: "789 Innovation Dr, Palo Alto, CA 94301",
        latitude: "37.44188",
        longitude: "-122.14302",
        notes: "Intermittent connectivity issues on floor 2. Check splice points.",
        cableUsed: null,
        materialsUsed: null,
        createdAt: new Date("2024-03-18"),
        updatedAt: new Date("2024-03-18"),
      },
      {
        id: 4,
        clientId: 4,
        technicianId: 2,
        type: "Fiber Installation",
        status: "Pending",
        scheduledDate: tomorrow,
        completedDate: null,
        address: "321 Residential St, Mountain View, CA 94040",
        latitude: "37.38605",
        longitude: "-122.08385",
        notes: "Install fiber to 12 residential units.",
        cableUsed: null,
        materialsUsed: null,
        createdAt: new Date("2024-03-19"),
        updatedAt: new Date("2024-03-19"),
      },
      {
        id: 5,
        clientId: 5,
        technicianId: 3,
        type: "Network Upgrade",
        status: "Pending",
        scheduledDate: nextWeek,
        completedDate: null,
        address: "555 Commerce Way, San Mateo, CA 94401",
        latitude: "37.56299",
        longitude: "-122.32553",
        notes: "Upgrade to 10Gbps backbone. Coordinate with building management.",
        cableUsed: null,
        materialsUsed: null,
        createdAt: new Date("2024-03-20"),
        updatedAt: new Date("2024-03-20"),
      },
      {
        id: 6,
        clientId: 1,
        technicianId: 1,
        type: "Testing",
        status: "Completed",
        scheduledDate: new Date("2024-03-15"),
        completedDate: new Date("2024-03-15"),
        address: "123 Silicon Valley Blvd, San Jose, CA 95110",
        latitude: "37.33874",
        longitude: "-121.88485",
        notes: "OTDR testing completed. All parameters within spec.",
        cableUsed: null,
        materialsUsed: null,
        createdAt: new Date("2024-03-14"),
        updatedAt: new Date("2024-03-15"),
      },
    ];
    this.nextJobId = 7;

    // Seed Inventory
    this.inventoryItems = [
      {
        id: 1,
        name: "Single-mode OS2 Fiber Cable",
        category: "Cable",
        quantity: 2500,
        unit: "meters",
        minStockLevel: 1000,
        status: "In Stock",
        lastRestocked: new Date("2024-03-01"),
        createdAt: new Date("2024-01-10"),
      },
      {
        id: 2,
        name: "Multi-mode OM4 Fiber Cable",
        category: "Cable",
        quantity: 1200,
        unit: "meters",
        minStockLevel: 800,
        status: "In Stock",
        lastRestocked: new Date("2024-02-15"),
        createdAt: new Date("2024-01-10"),
      },
      {
        id: 3,
        name: "SC/UPC Connectors",
        category: "Connectors",
        quantity: 150,
        unit: "pieces",
        minStockLevel: 100,
        status: "In Stock",
        lastRestocked: new Date("2024-03-10"),
        createdAt: new Date("2024-01-10"),
      },
      {
        id: 4,
        name: "LC/UPC Connectors",
        category: "Connectors",
        quantity: 45,
        unit: "pieces",
        minStockLevel: 50,
        status: "Low Stock",
        lastRestocked: new Date("2024-02-20"),
        createdAt: new Date("2024-01-10"),
      },
      {
        id: 5,
        name: "Fusion Splicer",
        category: "Equipment",
        quantity: 3,
        unit: "units",
        minStockLevel: 2,
        status: "In Stock",
        lastRestocked: new Date("2024-01-05"),
        createdAt: new Date("2024-01-10"),
      },
      {
        id: 6,
        name: "OTDR Meter",
        category: "Equipment",
        quantity: 5,
        unit: "units",
        minStockLevel: 3,
        status: "In Stock",
        lastRestocked: new Date("2024-01-15"),
        createdAt: new Date("2024-01-10"),
      },
      {
        id: 7,
        name: "Fiber Cleaver",
        category: "Tools",
        quantity: 8,
        unit: "units",
        minStockLevel: 5,
        status: "In Stock",
        lastRestocked: new Date("2024-02-01"),
        createdAt: new Date("2024-01-10"),
      },
      {
        id: 8,
        name: "Patch Panels (24-port)",
        category: "Hardware",
        quantity: 12,
        unit: "units",
        minStockLevel: 10,
        status: "In Stock",
        lastRestocked: new Date("2024-03-05"),
        createdAt: new Date("2024-01-10"),
      },
      {
        id: 9,
        name: "Cable Ties",
        category: "Accessories",
        quantity: 5,
        unit: "pieces",
        minStockLevel: 20,
        status: "Out of Stock",
        lastRestocked: new Date("2024-01-20"),
        createdAt: new Date("2024-01-10"),
      },
      {
        id: 10,
        name: "Fiber Cleaning Kit",
        category: "Accessories",
        quantity: 25,
        unit: "units",
        minStockLevel: 15,
        status: "In Stock",
        lastRestocked: new Date("2024-03-12"),
        createdAt: new Date("2024-01-10"),
      },
    ];
    this.nextInventoryId = 11;

    // Seed Meter Readings
    this.meterReadings = [
      {
        id: 1,
        jobId: 1,
        deviceName: "EXFO MaxTester 940",
        readingType: "OTDR",
        lossDbm: "-14.5",
        distanceMeters: "450.25",
        eventMarkers: "Splice at 125m, Connector at 450m",
        timestamp: yesterday,
      },
      {
        id: 2,
        jobId: 1,
        deviceName: "EXFO MaxTester 940",
        readingType: "Power Meter",
        lossDbm: "-12.8",
        distanceMeters: null,
        eventMarkers: null,
        timestamp: yesterday,
      },
      {
        id: 3,
        jobId: 6,
        deviceName: "VIAVI OneExpert",
        readingType: "OTDR",
        lossDbm: "-15.2",
        distanceMeters: "485.50",
        eventMarkers: "Clean run, no events detected",
        timestamp: new Date("2024-03-15"),
      },
    ];
    this.nextMeterReadingId = 4;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    // Check for duplicate email
    const existingUser = await this.getUserByEmail(user.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const newUser: User = {
      id: this.nextUserId++,
      email: user.email,
      password: user.password,
      name: user.name,
      role: user.role || "Technician",
      phone: user.phone || null,
      createdAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return [...this.clients].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.find(c => c.id === id);
  }

  async createClient(client: InsertClient): Promise<Client> {
    const newClient: Client = {
      id: this.nextClientId++,
      name: client.name,
      email: client.email || null,
      phone: client.phone,
      address: client.address,
      package: client.package || "Bronze",
      status: client.status || "Active",
      latitude: client.latitude || null,
      longitude: client.longitude || null,
      createdAt: new Date(),
    };
    this.clients.push(newClient);
    return newClient;
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined> {
    const index = this.clients.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    this.clients[index] = { ...this.clients[index], ...client } as Client;
    return this.clients[index];
  }

  async deleteClient(id: number): Promise<boolean> {
    const index = this.clients.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.clients.splice(index, 1);
    return true;
  }

  // Jobs
  async getJobs(): Promise<Array<Job & { clientName: string }>> {
    return this.jobs
      .map(job => {
        const client = this.clients.find(c => c.id === job.clientId);
        return {
          ...job,
          clientName: client?.name || 'Unknown Client',
        };
      })
      .sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime());
  }

  async getJobsByTechnician(technicianId: number): Promise<Array<Job & { clientName: string }>> {
    return this.jobs
      .filter(job => job.technicianId === technicianId)
      .map(job => {
        const client = this.clients.find(c => c.id === job.clientId);
        return {
          ...job,
          clientName: client?.name || 'Unknown Client',
        };
      })
      .sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime());
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.find(j => j.id === id);
  }

  async createJob(job: InsertJob): Promise<Job> {
    const newJob: Job = {
      id: this.nextJobId++,
      clientId: job.clientId,
      technicianId: job.technicianId,
      type: job.type,
      status: job.status || "Pending",
      scheduledDate: job.scheduledDate,
      completedDate: job.completedDate || null,
      address: job.address,
      latitude: job.latitude || null,
      longitude: job.longitude || null,
      notes: job.notes || null,
      cableUsed: job.cableUsed || null,
      materialsUsed: job.materialsUsed || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.push(newJob);
    return newJob;
  }

  async updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined> {
    const index = this.jobs.findIndex(j => j.id === id);
    if (index === -1) return undefined;
    this.jobs[index] = { 
      ...this.jobs[index], 
      ...job,
      updatedAt: new Date(),
    } as Job;
    return this.jobs[index];
  }

  async deleteJob(id: number): Promise<boolean> {
    const index = this.jobs.findIndex(j => j.id === id);
    if (index === -1) return false;
    this.jobs.splice(index, 1);
    return true;
  }

  // Inventory
  async getInventoryItems(): Promise<InventoryItem[]> {
    return [...this.inventoryItems].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    return this.inventoryItems.find(i => i.id === id);
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const newItem: InventoryItem = {
      id: this.nextInventoryId++,
      name: item.name,
      category: item.category,
      quantity: item.quantity || 0,
      unit: item.unit,
      minStockLevel: item.minStockLevel || 10,
      status: item.status || "In Stock",
      lastRestocked: item.lastRestocked || null,
      createdAt: new Date(),
    };
    this.inventoryItems.push(newItem);
    return newItem;
  }

  async updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const index = this.inventoryItems.findIndex(i => i.id === id);
    if (index === -1) return undefined;

    const updates: any = { ...item };
    if (item.quantity !== undefined) {
      const currentItem = this.inventoryItems[index];
      if (item.quantity === 0) {
        updates.status = 'Out of Stock';
      } else if (item.quantity < currentItem.minStockLevel) {
        updates.status = 'Low Stock';
      } else {
        updates.status = 'In Stock';
      }
    }

    this.inventoryItems[index] = { ...this.inventoryItems[index], ...updates } as InventoryItem;
    return this.inventoryItems[index];
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    const index = this.inventoryItems.findIndex(i => i.id === id);
    if (index === -1) return false;
    this.inventoryItems.splice(index, 1);
    return true;
  }

  async useInventoryItem(usage: InsertInventoryUsage): Promise<void> {
    const item = this.inventoryItems.find(i => i.id === usage.itemId);
    if (!item) throw new Error("Item not found");

    const newQuantity = item.quantity - usage.quantityUsed;
    await this.updateInventoryItem(usage.itemId, { quantity: newQuantity });

    this.inventoryUsageLog.push({
      id: this.nextInventoryUsageId++,
      ...usage,
      usedAt: new Date(),
    });
  }

  // Meter Readings
  async getMeterReadingsByJob(jobId: number): Promise<MeterReading[]> {
    return this.meterReadings
      .filter(r => r.jobId === jobId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createMeterReading(reading: InsertMeterReading): Promise<MeterReading> {
    const newReading: MeterReading = {
      id: this.nextMeterReadingId++,
      jobId: reading.jobId,
      deviceName: reading.deviceName || null,
      readingType: reading.readingType,
      lossDbm: reading.lossDbm || null,
      distanceMeters: reading.distanceMeters || null,
      eventMarkers: reading.eventMarkers || null,
      timestamp: new Date(),
    };
    this.meterReadings.push(newReading);
    return newReading;
  }

  // Analytics
  async getJobStatsByTechnician(technicianId: number): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  }> {
    const techJobs = this.jobs.filter(j => j.technicianId === technicianId);
    return {
      total: techJobs.length,
      pending: techJobs.filter(j => j.status === 'Pending').length,
      inProgress: techJobs.filter(j => j.status === 'In Progress').length,
      completed: techJobs.filter(j => j.status === 'Completed').length,
    };
  }

  // Topology Management - Basic stubs for offline support
  async getOlts(): Promise<Olt[]> { return []; }
  async getOlt(id: number): Promise<Olt | undefined> { return undefined; }
  async createOlt(olt: InsertOlt): Promise<Olt> { return {} as Olt; }
  async updateOlt(id: number, olt: Partial<InsertOlt>): Promise<Olt | undefined> { return undefined; }
  async deleteOlt(id: number): Promise<boolean> { return false; }

  async getOdfs(): Promise<Odf[]> { return []; }
  async getOdf(id: number): Promise<Odf | undefined> { return undefined; }
  async createOdf(odf: InsertOdf): Promise<Odf> { return {} as Odf; }
  async updateOdf(id: number, odf: Partial<InsertOdf>): Promise<Odf | undefined> { return undefined; }
  async deleteOdf(id: number): Promise<boolean> { return false; }

  async getSplitters(): Promise<Splitter[]> { return []; }
  async getSplitter(id: number): Promise<Splitter | undefined> { return undefined; }
  async getSplittersByParent(parentNodeId: number, parentNodeType: string): Promise<Splitter[]> { return []; }
  async createSplitter(splitter: InsertSplitter): Promise<Splitter> { return {} as Splitter; }
  async updateSplitter(id: number, splitter: Partial<InsertSplitter>): Promise<Splitter | undefined> { return undefined; }
  async deleteSplitter(id: number): Promise<boolean> { return false; }

  async getFats(): Promise<Fat[]> { return []; }
  async getFat(id: number): Promise<Fat | undefined> { return undefined; }
  async getFatsBySplitter(splitterId: number): Promise<Fat[]> { return []; }
  async createFat(fat: InsertFat): Promise<Fat> { return {} as Fat; }
  async updateFat(id: number, fat: Partial<InsertFat>): Promise<Fat | undefined> { return undefined; }
  async deleteFat(id: number): Promise<boolean> { return false; }

  async getAtbs(): Promise<Atb[]> { return []; }
  async getAtb(id: number): Promise<Atb | undefined> { return undefined; }
  async getAtbsByFat(fatId: number): Promise<Atb[]> { return []; }
  async createAtb(atb: InsertAtb): Promise<Atb> { return {} as Atb; }
  async updateAtb(id: number, atb: Partial<InsertAtb>): Promise<Atb | undefined> { return undefined; }
  async deleteAtb(id: number): Promise<boolean> { return false; }

  async getClosures(): Promise<Closure[]> { return []; }
  async getClosure(id: number): Promise<Closure | undefined> { return undefined; }
  async getClosuresByParent(parentNodeId: number, parentNodeType: string): Promise<Closure[]> { return []; }
  async createClosure(closure: InsertClosure): Promise<Closure> { return {} as Closure; }
  async updateClosure(id: number, closure: Partial<InsertClosure>): Promise<Closure | undefined> { return undefined; }
  async deleteClosure(id: number): Promise<boolean> { return false; }

  async getSpliceRecords(): Promise<SpliceRecord[]> { return []; }
  async getSpliceRecord(id: number): Promise<SpliceRecord | undefined> { return undefined; }
  async getSpliceRecordsByClosure(closureId: number): Promise<SpliceRecord[]> { return []; }
  async getSpliceRecordsByJob(jobId: number): Promise<SpliceRecord[]> { return []; }
  async createSpliceRecord(record: InsertSpliceRecord): Promise<SpliceRecord> { return {} as SpliceRecord; }
  async updateSpliceRecord(id: number, record: Partial<InsertSpliceRecord>): Promise<SpliceRecord | undefined> { return undefined; }
  async deleteSpliceRecord(id: number): Promise<boolean> { return false; }

  async getPowerReadings(): Promise<PowerReading[]> { return []; }
  async getPowerReading(id: number): Promise<PowerReading | undefined> { return undefined; }
  async getPowerReadingsByNode(nodeId: number, nodeType: string): Promise<PowerReading[]> { return []; }
  async createPowerReading(reading: InsertPowerReading): Promise<PowerReading> { return {} as PowerReading; }
  async updatePowerReading(id: number, reading: Partial<InsertPowerReading>): Promise<PowerReading | undefined> { return undefined; }
  async deletePowerReading(id: number): Promise<boolean> { return false; }

  async getFiberRoutes(): Promise<FiberRoute[]> { return []; }
  async getFiberRoute(id: number): Promise<FiberRoute | undefined> { return undefined; }
  async getFiberRoutesByJob(jobId: number): Promise<FiberRoute[]> { return []; }
  async createFiberRoute(route: InsertFiberRoute): Promise<FiberRoute> { return {} as FiberRoute; }
  async updateFiberRoute(id: number, route: Partial<InsertFiberRoute>): Promise<FiberRoute | undefined> { return undefined; }
  async deleteFiberRoute(id: number): Promise<boolean> { return false; }

  async getFieldReports(): Promise<FieldReport[]> { return []; }
  async getFieldReport(id: number): Promise<FieldReport | undefined> { return undefined; }
  async getFieldReportsByJob(jobId: number): Promise<FieldReport[]> { return []; }
  async getFieldReportsByTechnician(technicianId: number): Promise<FieldReport[]> { return []; }
  async createFieldReport(report: InsertFieldReport): Promise<FieldReport> { return {} as FieldReport; }
  async updateFieldReport(id: number, report: Partial<InsertFieldReport>): Promise<FieldReport | undefined> { return undefined; }
  async deleteFieldReport(id: number): Promise<boolean> { return false; }
}

// Use MemoryStorage for offline functionality
export const storage = new MemoryStorage();
