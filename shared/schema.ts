import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for better type safety and database constraints
export const nodeTypeEnum = pgEnum('node_type', ['OLT', 'ODF', 'Splitter', 'FAT', 'ATB', 'Closure']);
export const closureTypeEnum = pgEnum('closure_type', ['Dome', 'Underground', 'Aerial']);
export const statusEnum = pgEnum('status', ['Active', 'Inactive', 'Maintenance', 'Retired']);
export const spliceQualityEnum = pgEnum('splice_quality', ['Excellent', 'Good', 'Fair', 'Poor']);
export const powerStatusEnum = pgEnum('power_status', ['Normal', 'Warning', 'Critical']);
export const reportStatusEnum = pgEnum('report_status', ['Draft', 'Submitted', 'Approved']);

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("Technician"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Clients Table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  package: text("package").notNull().default("Bronze"),
  status: text("status").notNull().default("Active"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clients).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Jobs Table
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  technicianId: integer("technician_id").references(() => users.id).notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("Pending"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  completedDate: timestamp("completed_date"),
  address: text("address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  notes: text("notes"),
  cableUsed: text("cable_used"),
  materialsUsed: text("materials_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

// Job Photos Table
export const jobPhotos = pgTable("job_photos", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  photoUrl: text("photo_url").notNull(),
  photoType: text("photo_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const insertJobPhotoSchema = createInsertSchema(jobPhotos).omit({ 
  id: true, 
  uploadedAt: true 
});
export type InsertJobPhoto = z.infer<typeof insertJobPhotoSchema>;
export type JobPhoto = typeof jobPhotos.$inferSelect;

// Meter Readings Table
export const meterReadings = pgTable("meter_readings", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  deviceName: text("device_name"),
  readingType: text("reading_type").notNull(),
  lossDbm: decimal("loss_dbm", { precision: 6, scale: 2 }),
  distanceMeters: decimal("distance_meters", { precision: 10, scale: 2 }),
  eventMarkers: text("event_markers"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertMeterReadingSchema = createInsertSchema(meterReadings).omit({ 
  id: true, 
  timestamp: true 
});
export type InsertMeterReading = z.infer<typeof insertMeterReadingSchema>;
export type MeterReading = typeof meterReadings.$inferSelect;

// Inventory Items Table
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(0),
  unit: text("unit").notNull(),
  minStockLevel: integer("min_stock_level").notNull().default(10),
  status: text("status").notNull().default("In Stock"),
  lastRestocked: timestamp("last_restocked"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;

// Inventory Usage Log Table
export const inventoryUsage = pgTable("inventory_usage", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => inventoryItems.id).notNull(),
  jobId: integer("job_id").references(() => jobs.id),
  quantityUsed: integer("quantity_used").notNull(),
  usedBy: integer("used_by").references(() => users.id).notNull(),
  usedAt: timestamp("used_at").defaultNow().notNull(),
});

export const insertInventoryUsageSchema = createInsertSchema(inventoryUsage).omit({ 
  id: true, 
  usedAt: true 
});
export type InsertInventoryUsage = z.infer<typeof insertInventoryUsageSchema>;
export type InventoryUsage = typeof inventoryUsage.$inferSelect;

// GPON Topology Tables

// OLT (Optical Line Terminal) Table
export const olts = pgTable("olts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  capacity: integer("capacity").notNull(), // Total port capacity
  usedPorts: integer("used_ports").notNull().default(0),
  status: text("status").notNull().default("Active"),
  ipAddress: text("ip_address"),
  vendor: text("vendor"),
  model: text("model"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOltSchema = createInsertSchema(olts).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});
export type InsertOlt = z.infer<typeof insertOltSchema>;
export type Olt = typeof olts.$inferSelect;

// ODF (Optical Distribution Frame) Table
export const odfs = pgTable("odfs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  oltId: integer("olt_id").references(() => olts.id),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  totalPorts: integer("total_ports").notNull(),
  usedPorts: integer("used_ports").notNull().default(0),
  status: text("status").notNull().default("Active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOdfSchema = createInsertSchema(odfs).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});
export type InsertOdf = z.infer<typeof insertOdfSchema>;
export type Odf = typeof odfs.$inferSelect;

// Splitters Table
export const splitters = pgTable("splitters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  parentNodeId: integer("parent_node_id"), // Can reference OLT, ODF, or another splitter
  parentNodeType: text("parent_node_type"), // Validated in API layer
  splitRatio: text("split_ratio").notNull(), // "1:2", "1:4", "1:8", "1:16", "1:32", "1:64"
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  inputPower: decimal("input_power", { precision: 6, scale: 2 }), // in dBm
  outputPower: decimal("output_power", { precision: 6, scale: 2 }), // in dBm
  splitterLoss: decimal("splitter_loss", { precision: 6, scale: 2 }), // in dB
  status: statusEnum("status").notNull().default("Active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSplitterSchema = createInsertSchema(splitters).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});
export type InsertSplitter = z.infer<typeof insertSplitterSchema>;
export type Splitter = typeof splitters.$inferSelect;

// FAT (Fiber Access Terminal) / FDT Table
export const fats = pgTable("fats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  splitterId: integer("splitter_id").references(() => splitters.id),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  totalPorts: integer("total_ports").notNull().default(8),
  usedPorts: integer("used_ports").notNull().default(0),
  inputPower: decimal("input_power", { precision: 6, scale: 2 }),
  status: text("status").notNull().default("Active"),
  installDate: timestamp("install_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFatSchema = createInsertSchema(fats).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});
export type InsertFat = z.infer<typeof insertFatSchema>;
export type Fat = typeof fats.$inferSelect;

// ATB (Access Terminal Box) Table
export const atbs = pgTable("atbs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fatId: integer("fat_id").references(() => fats.id),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  totalPorts: integer("total_ports").notNull().default(4),
  usedPorts: integer("used_ports").notNull().default(0),
  inputPower: decimal("input_power", { precision: 6, scale: 2 }),
  status: text("status").notNull().default("Active"),
  installDate: timestamp("install_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAtbSchema = createInsertSchema(atbs).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});
export type InsertAtb = z.infer<typeof insertAtbSchema>;
export type Atb = typeof atbs.$inferSelect;

// Closures Table (Dome, Underground, Aerial)
export const closures = pgTable("closures", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: closureTypeEnum("type").notNull(), // Enum for closure type
  parentNodeId: integer("parent_node_id"),
  parentNodeType: text("parent_node_type"), // Validated in API layer
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  fiberCount: integer("fiber_count").notNull().default(12),
  spliceCount: integer("splice_count").notNull().default(0),
  inputPower: decimal("input_power", { precision: 6, scale: 2 }),
  outputPower: decimal("output_power", { precision: 6, scale: 2 }),
  status: statusEnum("status").notNull().default("Active"),
  installDate: timestamp("install_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClosureSchema = createInsertSchema(closures).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});
export type InsertClosure = z.infer<typeof insertClosureSchema>;
export type Closure = typeof closures.$inferSelect;

// Splice Records Table
export const spliceRecords = pgTable("splice_records", {
  id: serial("id").primaryKey(),
  closureId: integer("closure_id").references(() => closures.id),
  jobId: integer("job_id").references(() => jobs.id),
  fiber1: text("fiber_1").notNull(),
  fiber2: text("fiber_2").notNull(),
  spliceLoss: decimal("splice_loss", { precision: 6, scale: 2 }), // in dB
  spliceQuality: spliceQualityEnum("splice_quality"), // Enum for quality
  attenuation: decimal("attenuation", { precision: 6, scale: 2 }),
  fusionCount: integer("fusion_count"),
  deviceName: text("device_name"), // Bluetooth splicer name
  technicianId: integer("technician_id").references(() => users.id),
  spliceDate: timestamp("splice_date").defaultNow().notNull(),
  notes: text("notes"),
});

export const insertSpliceRecordSchema = createInsertSchema(spliceRecords).omit({ 
  id: true, 
  spliceDate: true 
});
export type InsertSpliceRecord = z.infer<typeof insertSpliceRecordSchema>;
export type SpliceRecord = typeof spliceRecords.$inferSelect;

// Power Readings Table
export const powerReadings = pgTable("power_readings", {
  id: serial("id").primaryKey(),
  nodeId: integer("node_id").notNull(),
  nodeType: text("node_type").notNull(), // Validated in API layer
  inputPower: decimal("input_power", { precision: 6, scale: 2 }), // in dBm
  outputPower: decimal("output_power", { precision: 6, scale: 2 }), // in dBm
  connectorLoss: decimal("connector_loss", { precision: 6, scale: 2 }).default(sql`0.5`), // in dB
  spliceLoss: decimal("splice_loss", { precision: 6, scale: 2 }).default(sql`0.1`), // in dB
  distanceAttenuation: decimal("distance_attenuation", { precision: 6, scale: 2 }).default(sql`0`), // in dB
  totalLoss: decimal("total_loss", { precision: 6, scale: 2 }),
  status: powerStatusEnum("status").notNull().default("Normal"), // Enum for power status
  technicianId: integer("technician_id").references(() => users.id),
  readingDate: timestamp("reading_date").defaultNow().notNull(),
  notes: text("notes"),
});

export const insertPowerReadingSchema = createInsertSchema(powerReadings).omit({ 
  id: true, 
  readingDate: true 
});
export type InsertPowerReading = z.infer<typeof insertPowerReadingSchema>;
export type PowerReading = typeof powerReadings.$inferSelect;

// Fiber Routes Table (for distance calculation and GPS tracking)
export const fiberRoutes = pgTable("fiber_routes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startNodeId: integer("start_node_id"),
  startNodeType: text("start_node_type"),
  endNodeId: integer("end_node_id"),
  endNodeType: text("end_node_type"),
  waypoints: text("waypoints"), // JSON array of {lat, lng} coordinates
  linearDistance: decimal("linear_distance", { precision: 10, scale: 2 }), // in meters
  routedDistance: decimal("routed_distance", { precision: 10, scale: 2 }), // in meters
  cableRequired: decimal("cable_required", { precision: 10, scale: 2 }), // with slack
  slackPercentage: decimal("slack_percentage", { precision: 5, scale: 2 }).default(sql`10`), // default 10%
  splicePoints: integer("splice_points").default(0),
  estimatedLoss: decimal("estimated_loss", { precision: 6, scale: 2 }),
  jobId: integer("job_id").references(() => jobs.id),
  technicianId: integer("technician_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  notes: text("notes"),
});

export const insertFiberRouteSchema = createInsertSchema(fiberRoutes).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertFiberRoute = z.infer<typeof insertFiberRouteSchema>;
export type FiberRoute = typeof fiberRoutes.$inferSelect;

// Field Reports Table
export const fieldReports = pgTable("field_reports", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  technicianId: integer("technician_id").references(() => users.id).notNull(),
  reportType: text("report_type").notNull(), // "Route Distance", "Splice Log", "Power Mapping", "Deployment Summary"
  summary: text("summary").notNull(),
  routeData: text("route_data"), // JSON for route details
  powerData: text("power_data"), // JSON for power chain
  spliceData: text("splice_data"), // JSON for splice records
  inventoryUsed: text("inventory_used"), // JSON for materials used
  gpsTrace: text("gps_trace"), // JSON array of GPS coordinates
  photos: text("photos"), // JSON array of photo URLs
  status: reportStatusEnum("status").notNull().default("Draft"), // Enum for report status
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFieldReportSchema = createInsertSchema(fieldReports).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});
export type InsertFieldReport = z.infer<typeof insertFieldReportSchema>;
export type FieldReport = typeof fieldReports.$inferSelect;
