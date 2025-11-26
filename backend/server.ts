import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';

const app: Express = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// In-memory storage (replace with database in production)
const database = {
  nodes: [] as any[],
  routes: [] as any[],
  closures: [] as any[],
  customers: [] as any[],
  splices: [] as any[],
  jobs: [] as any[],
  inventory: [] as any[],
  syncLog: [] as any[],
};

// ============ HEALTH CHECK ============
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), server: 'FiberTrace Backend' });
});

// ============ NODE ENDPOINTS ============
app.get('/api/nodes', (req: Request, res: Response) => {
  res.json({ nodes: database.nodes, count: database.nodes.length });
});

app.post('/api/nodes', (req: Request, res: Response) => {
  const node = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString(), synced: true };
  database.nodes.push(node);
  res.status(201).json(node);
});

app.put('/api/nodes/:id', (req: Request, res: Response) => {
  const idx = database.nodes.findIndex(n => n.id === req.params.id);
  if (idx !== -1) {
    database.nodes[idx] = { ...database.nodes[idx], ...req.body, updatedAt: new Date().toISOString() };
    res.json(database.nodes[idx]);
  } else {
    res.status(404).json({ error: 'Node not found' });
  }
});

app.delete('/api/nodes/:id', (req: Request, res: Response) => {
  database.nodes = database.nodes.filter(n => n.id !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ============ ROUTE ENDPOINTS ============
app.get('/api/routes', (req: Request, res: Response) => {
  res.json({ routes: database.routes, count: database.routes.length });
});

app.post('/api/routes', (req: Request, res: Response) => {
  const route = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString(), synced: true };
  database.routes.push(route);
  res.status(201).json(route);
});

app.put('/api/routes/:id', (req: Request, res: Response) => {
  const idx = database.routes.findIndex(r => r.id === req.params.id);
  if (idx !== -1) {
    database.routes[idx] = { ...database.routes[idx], ...req.body, updatedAt: new Date().toISOString() };
    res.json(database.routes[idx]);
  } else {
    res.status(404).json({ error: 'Route not found' });
  }
});

app.delete('/api/routes/:id', (req: Request, res: Response) => {
  database.routes = database.routes.filter(r => r.id !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ============ CLOSURE ENDPOINTS ============
app.get('/api/closures', (req: Request, res: Response) => {
  res.json({ closures: database.closures, count: database.closures.length });
});

app.post('/api/closures', (req: Request, res: Response) => {
  const closure = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString(), synced: true };
  database.closures.push(closure);
  res.status(201).json(closure);
});

app.put('/api/closures/:id', (req: Request, res: Response) => {
  const idx = database.closures.findIndex(c => c.id === req.params.id);
  if (idx !== -1) {
    database.closures[idx] = { ...database.closures[idx], ...req.body, updatedAt: new Date().toISOString() };
    res.json(database.closures[idx]);
  } else {
    res.status(404).json({ error: 'Closure not found' });
  }
});

// ============ CUSTOMER ENDPOINTS ============
app.get('/api/customers', (req: Request, res: Response) => {
  res.json({ customers: database.customers, count: database.customers.length });
});

app.post('/api/customers', (req: Request, res: Response) => {
  const customer = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString(), synced: true };
  database.customers.push(customer);
  res.status(201).json(customer);
});

app.put('/api/customers/:id', (req: Request, res: Response) => {
  const idx = database.customers.findIndex(c => c.id === req.params.id);
  if (idx !== -1) {
    database.customers[idx] = { ...database.customers[idx], ...req.body, updatedAt: new Date().toISOString() };
    res.json(database.customers[idx]);
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
});

// ============ SPLICE ENDPOINTS ============
app.get('/api/splices', (req: Request, res: Response) => {
  res.json({ splices: database.splices, count: database.splices.length });
});

app.post('/api/splices', (req: Request, res: Response) => {
  const splice = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString(), synced: true };
  database.splices.push(splice);
  res.status(201).json(splice);
});

// ============ JOB ENDPOINTS ============
app.get('/api/jobs', (req: Request, res: Response) => {
  res.json({ jobs: database.jobs, count: database.jobs.length });
});

app.post('/api/jobs', (req: Request, res: Response) => {
  const job = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString(), synced: true };
  database.jobs.push(job);
  res.status(201).json(job);
});

app.put('/api/jobs/:id', (req: Request, res: Response) => {
  const idx = database.jobs.findIndex(j => j.id === req.params.id);
  if (idx !== -1) {
    database.jobs[idx] = { ...database.jobs[idx], ...req.body, updatedAt: new Date().toISOString() };
    res.json(database.jobs[idx]);
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});

// ============ INVENTORY ENDPOINTS ============
app.get('/api/inventory', (req: Request, res: Response) => {
  res.json({ items: database.inventory, count: database.inventory.length });
});

app.post('/api/inventory', (req: Request, res: Response) => {
  const item = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString(), synced: true };
  database.inventory.push(item);
  res.status(201).json(item);
});

app.put('/api/inventory/:id', (req: Request, res: Response) => {
  const idx = database.inventory.findIndex(i => i.id === req.params.id);
  if (idx !== -1) {
    database.inventory[idx] = { ...database.inventory[idx], ...req.body, updatedAt: new Date().toISOString() };
    res.json(database.inventory[idx]);
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

// ============ BULK SYNC ENDPOINT ============
app.post('/api/sync', (req: Request, res: Response) => {
  const { nodes, routes, closures, customers, splices, jobs, inventory, timestamp } = req.body;

  const syncId = uuidv4();
  const syncResult = {
    syncId,
    timestamp: new Date().toISOString(),
    deviceTimestamp: timestamp,
    processed: 0,
    errors: [] as any[],
  };

  // Merge nodes
  if (nodes && Array.isArray(nodes)) {
    nodes.forEach((node: any) => {
      const idx = database.nodes.findIndex(n => n.id === node.id);
      if (idx !== -1) {
        database.nodes[idx] = { ...database.nodes[idx], ...node, synced: true };
      } else {
        database.nodes.push({ ...node, id: node.id || uuidv4(), synced: true });
      }
      syncResult.processed++;
    });
  }

  // Merge routes
  if (routes && Array.isArray(routes)) {
    routes.forEach((route: any) => {
      const idx = database.routes.findIndex(r => r.id === route.id);
      if (idx !== -1) {
        database.routes[idx] = { ...database.routes[idx], ...route, synced: true };
      } else {
        database.routes.push({ ...route, id: route.id || uuidv4(), synced: true });
      }
      syncResult.processed++;
    });
  }

  // Merge closures
  if (closures && Array.isArray(closures)) {
    closures.forEach((closure: any) => {
      const idx = database.closures.findIndex(c => c.id === closure.id);
      if (idx !== -1) {
        database.closures[idx] = { ...database.closures[idx], ...closure, synced: true };
      } else {
        database.closures.push({ ...closure, id: closure.id || uuidv4(), synced: true });
      }
      syncResult.processed++;
    });
  }

  // Merge customers
  if (customers && Array.isArray(customers)) {
    customers.forEach((customer: any) => {
      const idx = database.customers.findIndex(c => c.id === customer.id);
      if (idx !== -1) {
        database.customers[idx] = { ...database.customers[idx], ...customer, synced: true };
      } else {
        database.customers.push({ ...customer, id: customer.id || uuidv4(), synced: true });
      }
      syncResult.processed++;
    });
  }

  // Merge splices
  if (splices && Array.isArray(splices)) {
    splices.forEach((splice: any) => {
      const idx = database.splices.findIndex(s => s.id === splice.id);
      if (idx !== -1) {
        database.splices[idx] = { ...database.splices[idx], ...splice, synced: true };
      } else {
        database.splices.push({ ...splice, id: splice.id || uuidv4(), synced: true });
      }
      syncResult.processed++;
    });
  }

  // Merge jobs
  if (jobs && Array.isArray(jobs)) {
    jobs.forEach((job: any) => {
      const idx = database.jobs.findIndex(j => j.id === job.id);
      if (idx !== -1) {
        database.jobs[idx] = { ...database.jobs[idx], ...job, synced: true };
      } else {
        database.jobs.push({ ...job, id: job.id || uuidv4(), synced: true });
      }
      syncResult.processed++;
    });
  }

  // Merge inventory
  if (inventory && Array.isArray(inventory)) {
    inventory.forEach((item: any) => {
      const idx = database.inventory.findIndex(i => i.id === item.id);
      if (idx !== -1) {
        database.inventory[idx] = { ...database.inventory[idx], ...item, synced: true };
      } else {
        database.inventory.push({ ...item, id: item.id || uuidv4(), synced: true });
      }
      syncResult.processed++;
    });
  }

  // Log sync
  database.syncLog.push(syncResult);

  res.json({
    success: true,
    ...syncResult,
    syncLog: database.syncLog.slice(-10), // Return last 10 syncs
  });
});

// ============ STATS ENDPOINT ============
app.get('/api/stats', (req: Request, res: Response) => {
  res.json({
    totalNodes: database.nodes.length,
    totalRoutes: database.routes.length,
    totalClosures: database.closures.length,
    totalCustomers: database.customers.length,
    totalJobs: database.jobs.length,
    totalInventory: database.inventory.length,
    lastSync: database.syncLog.length > 0 ? database.syncLog[database.syncLog.length - 1] : null,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ FiberTrace Backend running on port ${PORT}`);
  console.log(`📱 Mobile app can sync to: http://localhost:${PORT}/api/sync`);
  console.log(`🔄 Available endpoints:`);
  console.log(`   - GET/POST /api/nodes`);
  console.log(`   - GET/POST /api/routes`);
  console.log(`   - GET/POST /api/closures`);
  console.log(`   - GET/POST /api/customers`);
  console.log(`   - GET/POST /api/splices`);
  console.log(`   - GET/POST /api/jobs`);
  console.log(`   - GET/POST /api/inventory`);
  console.log(`   - POST /api/sync (offline data sync)`);
  console.log(`   - GET /api/stats (system statistics)`);
});
