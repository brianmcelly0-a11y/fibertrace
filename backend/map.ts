import express, { Request, Response } from 'express';
import { Pool } from 'pg';

const router = express.Router();

// GET /api/map/data - Aggregate endpoint for map visualization
router.get('/map/data', async (req: Request, res: Response) => {
  try {
    const pool = (req.app as any).pool as Pool;

    // Fetch all map layers in parallel
    const [routes, nodes, closures, splitters, customers, splices] = await Promise.all([
      pool.query('SELECT * FROM routes WHERE status = $1', ['active']),
      pool.query('SELECT * FROM nodes ORDER BY created_at DESC'),
      pool.query('SELECT * FROM closures ORDER BY created_at DESC'),
      pool.query('SELECT * FROM splitters ORDER BY created_at DESC'),
      pool.query('SELECT * FROM customers ORDER BY created_at DESC'),
      pool.query('SELECT * FROM splices ORDER BY created_at DESC'),
    ]);

    res.json({
      routes: routes.rows,
      nodes: nodes.rows,
      closures: closures.rows,
      splitters: splitters.rows,
      customers: customers.rows,
      splices: splices.rows,
      counts: {
        routes: routes.rows.length,
        nodes: nodes.rows.length,
        closures: closures.rows.length,
        splitters: splitters.rows.length,
        customers: customers.rows.length,
        splices: splices.rows.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/map/layers - Get only visible layers
router.get('/map/layers', async (req: Request, res: Response) => {
  try {
    const pool = (req.app as any).pool as Pool;
    const { layers } = req.query; // ?layers=routes,nodes,closures

    const visibleLayers = layers ? (layers as string).split(',') : [];
    const result: any = {};

    if (visibleLayers.includes('routes') || visibleLayers.length === 0) {
      const routes = await pool.query('SELECT id, route_name, path_coordinates, color, status FROM routes WHERE status = $1', ['active']);
      result.routes = routes.rows;
    }

    if (visibleLayers.includes('nodes') || visibleLayers.length === 0) {
      const nodes = await pool.query('SELECT id, node_name, node_type, latitude, longitude, power_status FROM nodes');
      result.nodes = nodes.rows;
    }

    if (visibleLayers.includes('closures') || visibleLayers.length === 0) {
      const closures = await pool.query('SELECT id, closure_name, closure_type, latitude, longitude, capacity_used, capacity_total FROM closures');
      result.closures = closures.rows;
    }

    if (visibleLayers.includes('splitters') || visibleLayers.length === 0) {
      const splitters = await pool.query('SELECT id, splitter_label, latitude, longitude, ratio FROM splitters');
      result.splitters = splitters.rows;
    }

    if (visibleLayers.includes('customers') || visibleLayers.length === 0) {
      const customers = await pool.query('SELECT id, customer_number, customer_name, latitude, longitude, status FROM customers');
      result.customers = customers.rows;
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
