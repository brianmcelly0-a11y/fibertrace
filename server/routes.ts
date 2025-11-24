import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import {
  insertUserSchema,
  insertClientSchema,
  insertJobSchema,
  insertInventoryItemSchema,
  insertMeterReadingSchema,
  insertInventoryUsageSchema,
  insertOltSchema,
  insertOdfSchema,
  insertSplitterSchema,
  insertFatSchema,
  insertAtbSchema,
  insertClosureSchema,
  insertSpliceRecordSchema,
  insertPowerReadingSchema,
  insertFiberRouteSchema,
  insertFieldReportSchema,
} from "@shared/schema";
import "./types";

// Helper function to validate parent node references
async function validateParentNode(parentNodeId: number, parentNodeType: string): Promise<boolean> {
  if (!parentNodeId || !parentNodeType) {
    return false;
  }

  const validTypes = ['OLT', 'ODF', 'Splitter', 'FAT', 'ATB', 'Closure'];
  if (!validTypes.includes(parentNodeType)) {
    return false;
  }

  try {
    switch (parentNodeType) {
      case 'OLT':
        const olt = await storage.getOlt(parentNodeId);
        return !!olt;
      case 'ODF':
        const odf = await storage.getOdf(parentNodeId);
        return !!odf;
      case 'Splitter':
        const splitter = await storage.getSplitter(parentNodeId);
        return !!splitter;
      case 'FAT':
        const fat = await storage.getFat(parentNodeId);
        return !!fat;
      case 'ATB':
        const atb = await storage.getAtb(parentNodeId);
        return !!atb;
      case 'Closure':
        const closure = await storage.getClosure(parentNodeId);
        return !!closure;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(data.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Store user in session
      if (req.session) {
        req.session.userId = user.id;
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };

  // Client Routes
  app.get("/api/clients", requireAuth, async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const client = await storage.getClient(parseInt(req.params.id));
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/clients", requireAuth, async (req, res) => {
    try {
      const data = insertClientSchema.parse(req.body);
      const client = await storage.createClient(data);
      res.status(201).json(client);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const client = await storage.updateClient(parseInt(req.params.id), req.body);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteClient(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json({ message: "Client deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Job Routes
  app.get("/api/jobs", requireAuth, async (req, res) => {
    try {
      const jobs = await storage.getJobsByTechnician(req.session!.userId!);
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/jobs/:id", requireAuth, async (req, res) => {
    try {
      const job = await storage.getJob(parseInt(req.params.id));
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/jobs", requireAuth, async (req, res) => {
    try {
      const data = insertJobSchema.parse({
        ...req.body,
        technicianId: req.session!.userId,
      });
      const job = await storage.createJob(data);
      res.status(201).json(job);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/jobs/:id", requireAuth, async (req, res) => {
    try {
      const job = await storage.updateJob(parseInt(req.params.id), req.body);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/jobs/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteJob(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json({ message: "Job deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Inventory Routes
  app.get("/api/inventory", requireAuth, async (req, res) => {
    try {
      const items = await storage.getInventoryItems();
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/inventory/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getInventoryItem(parseInt(req.params.id));
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/inventory", requireAuth, async (req, res) => {
    try {
      const data = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(data);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/inventory/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.updateInventoryItem(parseInt(req.params.id), req.body);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/inventory/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteInventoryItem(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json({ message: "Item deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/inventory/use", requireAuth, async (req, res) => {
    try {
      const data = insertInventoryUsageSchema.parse({
        ...req.body,
        usedBy: req.session!.userId,
      });
      await storage.useInventoryItem(data);
      const updatedItem = await storage.getInventoryItem(data.itemId);
      res.json(updatedItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/inventory/:id/restock", requireAuth, async (req, res) => {
    try {
      const { quantity } = req.body;
      const itemId = parseInt(req.params.id);
      
      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      
      const item = await storage.getInventoryItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      const updatedItem = await storage.updateInventoryItem(itemId, {
        quantity: item.quantity + quantity,
        lastRestocked: new Date(),
      });
      
      res.json(updatedItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Meter Readings Routes
  app.get("/api/meter-readings/:jobId", requireAuth, async (req, res) => {
    try {
      const readings = await storage.getMeterReadingsByJob(parseInt(req.params.jobId));
      res.json(readings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/meter-readings", requireAuth, async (req, res) => {
    try {
      const data = insertMeterReadingSchema.parse(req.body);
      const reading = await storage.createMeterReading(data);
      res.status(201).json(reading);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Analytics/Stats Routes
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getJobStatsByTechnician(req.session!.userId!);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // GPON Topology Management Routes

  // OLT Routes
  app.get("/api/olts", requireAuth, async (req, res) => {
    try {
      const olts = await storage.getOlts();
      res.json(olts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/olts/:id", requireAuth, async (req, res) => {
    try {
      const olt = await storage.getOlt(parseInt(req.params.id));
      if (!olt) {
        return res.status(404).json({ message: "OLT not found" });
      }
      res.json(olt);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/olts", requireAuth, async (req, res) => {
    try {
      const data = insertOltSchema.parse(req.body);
      const olt = await storage.createOlt(data);
      res.status(201).json(olt);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/olts/:id", requireAuth, async (req, res) => {
    try {
      const olt = await storage.updateOlt(parseInt(req.params.id), req.body);
      if (!olt) {
        return res.status(404).json({ message: "OLT not found" });
      }
      res.json(olt);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/olts/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteOlt(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "OLT not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ODF Routes
  app.get("/api/odfs", requireAuth, async (req, res) => {
    try {
      const odfs = await storage.getOdfs();
      res.json(odfs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/odfs", requireAuth, async (req, res) => {
    try {
      const data = insertOdfSchema.parse(req.body);
      const odf = await storage.createOdf(data);
      res.status(201).json(odf);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Splitter Routes
  app.get("/api/splitters", requireAuth, async (req, res) => {
    try {
      const splitters = await storage.getSplitters();
      res.json(splitters);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/splitters", requireAuth, async (req, res) => {
    try {
      const data = insertSplitterSchema.parse(req.body);
      
      // Reject inconsistent payload (one field without the other)
      if ((data.parentNodeId && !data.parentNodeType) || (!data.parentNodeId && data.parentNodeType)) {
        return res.status(400).json({ message: "Both parentNodeId and parentNodeType must be provided together" });
      }
      
      // Validate parent node if provided
      if (data.parentNodeId && data.parentNodeType) {
        const isValid = await validateParentNode(data.parentNodeId, data.parentNodeType);
        if (!isValid) {
          return res.status(400).json({ message: `Invalid parent node reference: ${data.parentNodeType} with ID ${data.parentNodeId} not found` });
        }
      }
      
      const splitter = await storage.createSplitter(data);
      res.status(201).json(splitter);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/splitters/:id", requireAuth, async (req, res) => {
    try {
      // Reject inconsistent payload (one field without the other)
      if ((req.body.parentNodeId && !req.body.parentNodeType) || (!req.body.parentNodeId && req.body.parentNodeType)) {
        return res.status(400).json({ message: "Both parentNodeId and parentNodeType must be provided together" });
      }
      
      // Validate parent node if provided in update
      if (req.body.parentNodeId && req.body.parentNodeType) {
        const isValid = await validateParentNode(req.body.parentNodeId, req.body.parentNodeType);
        if (!isValid) {
          return res.status(400).json({ message: `Invalid parent node reference: ${req.body.parentNodeType} with ID ${req.body.parentNodeId} not found` });
        }
      }
      
      const splitter = await storage.updateSplitter(parseInt(req.params.id), req.body);
      if (!splitter) {
        return res.status(404).json({ message: "Splitter not found" });
      }
      res.json(splitter);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // FAT Routes
  app.get("/api/fats", requireAuth, async (req, res) => {
    try {
      const fats = await storage.getFats();
      res.json(fats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/fats", requireAuth, async (req, res) => {
    try {
      const data = insertFatSchema.parse(req.body);
      
      // Validate splitter reference if provided
      if (data.splitterId) {
        const splitter = await storage.getSplitter(data.splitterId);
        if (!splitter) {
          return res.status(400).json({ message: `Invalid splitter reference: Splitter with ID ${data.splitterId} not found` });
        }
      }
      
      const fat = await storage.createFat(data);
      res.status(201).json(fat);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/fats/:id", requireAuth, async (req, res) => {
    try {
      // Validate splitter reference if provided in update
      if (req.body.splitterId) {
        const splitter = await storage.getSplitter(req.body.splitterId);
        if (!splitter) {
          return res.status(400).json({ message: `Invalid splitter reference: Splitter with ID ${req.body.splitterId} not found` });
        }
      }
      
      const fat = await storage.updateFat(parseInt(req.params.id), req.body);
      if (!fat) {
        return res.status(404).json({ message: "FAT not found" });
      }
      res.json(fat);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ATB Routes
  app.get("/api/atbs", requireAuth, async (req, res) => {
    try {
      const atbs = await storage.getAtbs();
      res.json(atbs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/atbs", requireAuth, async (req, res) => {
    try {
      const data = insertAtbSchema.parse(req.body);
      
      // Validate FAT reference if provided
      if (data.fatId) {
        const fat = await storage.getFat(data.fatId);
        if (!fat) {
          return res.status(400).json({ message: `Invalid FAT reference: FAT with ID ${data.fatId} not found` });
        }
      }
      
      const atb = await storage.createAtb(data);
      res.status(201).json(atb);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Closure Routes
  app.get("/api/closures", requireAuth, async (req, res) => {
    try {
      const closures = await storage.getClosures();
      res.json(closures);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/closures", requireAuth, async (req, res) => {
    try {
      const data = insertClosureSchema.parse(req.body);
      
      // Validate parent node if provided
      if (data.parentNodeId && data.parentNodeType) {
        const isValid = await validateParentNode(data.parentNodeId, data.parentNodeType);
        if (!isValid) {
          return res.status(400).json({ message: `Invalid parent node reference: ${data.parentNodeType} with ID ${data.parentNodeId} not found` });
        }
      }
      
      const closure = await storage.createClosure(data);
      res.status(201).json(closure);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/closures/:id", requireAuth, async (req, res) => {
    try {
      // Validate parent node if provided in update
      if (req.body.parentNodeId && req.body.parentNodeType) {
        const isValid = await validateParentNode(req.body.parentNodeId, req.body.parentNodeType);
        if (!isValid) {
          return res.status(400).json({ message: `Invalid parent node reference: ${req.body.parentNodeType} with ID ${req.body.parentNodeId} not found` });
        }
      }
      
      // Reject inconsistent payload (one field without the other)
      if ((req.body.parentNodeId && !req.body.parentNodeType) || (!req.body.parentNodeId && req.body.parentNodeType)) {
        return res.status(400).json({ message: "Both parentNodeId and parentNodeType must be provided together" });
      }
      
      const closure = await storage.updateClosure(parseInt(req.params.id), req.body);
      if (!closure) {
        return res.status(404).json({ message: "Closure not found" });
      }
      res.json(closure);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Splice Records Routes
  app.get("/api/splice-records", requireAuth, async (req, res) => {
    try {
      const records = await storage.getSpliceRecords();
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/splice-records", requireAuth, async (req, res) => {
    try {
      const data = insertSpliceRecordSchema.parse(req.body);
      const record = await storage.createSpliceRecord(data);
      res.status(201).json(record);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/splice-records/job/:jobId", requireAuth, async (req, res) => {
    try {
      const records = await storage.getSpliceRecordsByJob(parseInt(req.params.jobId));
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Power Readings Routes
  app.get("/api/power-readings", requireAuth, async (req, res) => {
    try {
      const readings = await storage.getPowerReadings();
      res.json(readings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/power-readings", requireAuth, async (req, res) => {
    try {
      const data = insertPowerReadingSchema.parse(req.body);
      const reading = await storage.createPowerReading(data);
      res.status(201).json(reading);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/power-readings/node/:nodeId/:nodeType", requireAuth, async (req, res) => {
    try {
      const readings = await storage.getPowerReadingsByNode(
        parseInt(req.params.nodeId),
        req.params.nodeType
      );
      res.json(readings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Fiber Routes
  app.get("/api/fiber-routes", requireAuth, async (req, res) => {
    try {
      const routes = await storage.getFiberRoutes();
      res.json(routes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/fiber-routes", requireAuth, async (req, res) => {
    try {
      const data = insertFiberRouteSchema.parse(req.body);
      const route = await storage.createFiberRoute(data);
      res.status(201).json(route);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/fiber-routes/job/:jobId", requireAuth, async (req, res) => {
    try {
      const routes = await storage.getFiberRoutesByJob(parseInt(req.params.jobId));
      res.json(routes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Field Reports Routes
  app.get("/api/field-reports", requireAuth, async (req, res) => {
    try {
      const reports = await storage.getFieldReports();
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/field-reports", requireAuth, async (req, res) => {
    try {
      const data = insertFieldReportSchema.parse(req.body);
      const report = await storage.createFieldReport(data);
      res.status(201).json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/field-reports/job/:jobId", requireAuth, async (req, res) => {
    try {
      const reports = await storage.getFieldReportsByJob(parseInt(req.params.jobId));
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/field-reports/:id", requireAuth, async (req, res) => {
    try {
      const report = await storage.updateFieldReport(parseInt(req.params.id), req.body);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
