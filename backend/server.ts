import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import pg from 'pg';

const { Pool } = pg;
const app: Express = express();
const PORT = process.env.PORT || 5001;

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id?: number;
        email?: string;
        role?: string;
      };
    }
  }
}

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fibertrace',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// ============ HEALTH CHECK ============
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), server: 'FiberTrace Backend', database: 'PostgreSQL' });
});

// ============ AUTH ENDPOINTS ============
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { full_name, email, password_hash } = req.body;
    const result = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role',
      [full_name, email, password_hash, 'technician']
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password_hash } = req.body;
    const result = await pool.query(
      'SELECT id, email, full_name, role FROM users WHERE email = $1 AND password_hash = $2',
      [email, password_hash]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

app.post('/api/auth/password-reset', async (req: Request, res: Response) => {
  try {
    const { email, new_password_hash } = req.body;
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email',
      [new_password_hash, email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Password reset failed' });
  }
});

// ============ NODE ENDPOINTS ============
app.get('/api/nodes', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM nodes ORDER BY created_at DESC');
    res.json({ nodes: result.rows, count: result.rows.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/nodes', async (req: Request, res: Response) => {
  try {
    const { node_name, node_type, latitude, longitude, power_status, power_rating, description } = req.body;
    const result = await pool.query(
      'INSERT INTO nodes (node_name, node_type, latitude, longitude, power_status, power_rating, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [node_name, node_type, latitude, longitude, power_status, power_rating, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/nodes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { node_name, node_type, power_status } = req.body;
    const result = await pool.query(
      'UPDATE nodes SET node_name = COALESCE($1, node_name), node_type = COALESCE($2, node_type), power_status = COALESCE($3, power_status) WHERE id = $4 RETURNING *',
      [node_name, node_type, power_status, id]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CLOSURES ENDPOINTS ============
app.get('/api/closures', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM closures ORDER BY created_at DESC');
    res.json({ closures: result.rows, count: result.rows.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/closures', async (req: Request, res: Response) => {
  try {
    const { closure_name, closure_type, latitude, longitude, capacity_total, description } = req.body;
    const result = await pool.query(
      'INSERT INTO closures (closure_name, closure_type, latitude, longitude, capacity_total, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [closure_name, closure_type, latitude, longitude, capacity_total, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ROUTES (FIBER LINES) ENDPOINTS ============
app.get('/api/routes', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM fiber_lines ORDER BY created_at DESC');
    res.json({ routes: result.rows, count: result.rows.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/routes', async (req: Request, res: Response) => {
  try {
    const { line_name, fiber_count, length_meters, start_point_type, start_point_id, end_point_type, end_point_id } = req.body;
    const result = await pool.query(
      'INSERT INTO fiber_lines (line_name, fiber_count, length_meters, start_point_type, start_point_id, end_point_type, end_point_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [line_name, fiber_count, length_meters, start_point_type, start_point_id, end_point_type, end_point_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SPLITTERS ENDPOINTS ============
app.get('/api/splitters', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM splitters ORDER BY created_at DESC');
    res.json({ splitters: result.rows, count: result.rows.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/splitters', async (req: Request, res: Response) => {
  try {
    const { splitter_label, ratio, latitude, longitude } = req.body;
    const result = await pool.query(
      'INSERT INTO splitters (splitter_label, ratio, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *',
      [splitter_label, ratio, latitude, longitude]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ POWER READINGS ENDPOINTS ============
app.get('/api/power-readings', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM power_readings ORDER BY timestamp DESC LIMIT 100');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/power-readings', async (req: Request, res: Response) => {
  try {
    const { node_id, voltage, current, battery_level } = req.body;
    const result = await pool.query(
      'INSERT INTO power_readings (node_id, voltage, current, battery_level) VALUES ($1, $2, $3, $4) RETURNING *',
      [node_id, voltage, current, battery_level]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ FAT PORTS ENDPOINTS ============
app.get('/api/fat-ports', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM fat_ports ORDER BY closure_id');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/fat-ports', async (req: Request, res: Response) => {
  try {
    const { closure_id, port_number, status, customer_name } = req.body;
    const result = await pool.query(
      'INSERT INTO fat_ports (closure_id, port_number, status, customer_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [closure_id, port_number, status, customer_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ JOBS ENDPOINTS ============
app.get('/api/jobs', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM jobs ORDER BY created_at DESC');
    res.json({ jobs: result.rows, count: result.rows.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/jobs', async (req: Request, res: Response) => {
  try {
    const { job_title, job_type, assigned_to_user_id, asset_type, asset_id, status } = req.body;
    const result = await pool.query(
      'INSERT INTO jobs (job_title, job_type, assigned_to_user_id, asset_type, asset_id, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [job_title, job_type, assigned_to_user_id, asset_type, asset_id, status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query('UPDATE jobs SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ DAILY REPORTS ENDPOINTS ============
app.get('/api/daily-reports', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM daily_reports ORDER BY date DESC');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/daily-reports', async (req: Request, res: Response) => {
  try {
    const { user_id, summary, total_jobs, total_distance_walked } = req.body;
    const result = await pool.query(
      'INSERT INTO daily_reports (user_id, date, summary, total_jobs, total_distance_walked) VALUES ($1, NOW(), $2, $3, $4) RETURNING *',
      [user_id, summary, total_jobs, total_distance_walked]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ OFFLINE SYNC ENDPOINT ============
app.post('/api/sync', async (req: Request, res: Response) => {
  try {
    const { nodes, closures, routes, jobs, timestamp } = req.body;
    let processed = 0;

    if (nodes && Array.isArray(nodes)) {
      for (const node of nodes) {
        await pool.query(
          'INSERT INTO nodes (node_name, node_type, latitude, longitude, power_status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
          [node.node_name, node.node_type, node.latitude, node.longitude, node.power_status]
        );
        processed++;
      }
    }

    if (closures && Array.isArray(closures)) {
      for (const closure of closures) {
        await pool.query(
          'INSERT INTO closures (closure_name, closure_type, latitude, longitude) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
          [closure.closure_name, closure.closure_type, closure.latitude, closure.longitude]
        );
        processed++;
      }
    }

    if (jobs && Array.isArray(jobs)) {
      for (const job of jobs) {
        await pool.query(
          'INSERT INTO jobs (job_title, job_type, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [job.job_title, job.job_type, job.status]
        );
        processed++;
      }
    }

    res.json({ success: true, processed, syncId: Date.now(), timestamp });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ STATS ENDPOINT ============
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const nodeCount = await pool.query('SELECT COUNT(*) as count FROM nodes');
    const closureCount = await pool.query('SELECT COUNT(*) as count FROM closures');
    const jobCount = await pool.query('SELECT COUNT(*) as count FROM jobs WHERE status = $1', ['completed']);
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');

    res.json({
      totalNodes: parseInt(nodeCount.rows[0].count),
      totalClosures: parseInt(closureCount.rows[0].count),
      completedJobs: parseInt(jobCount.rows[0].count),
      totalUsers: parseInt(userCount.rows[0].count),
      lastSync: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ FiberTrace Backend running on port ${PORT}`);
  console.log(`📱 API Base: http://localhost:${PORT}`);
  console.log(`🔌 Database: PostgreSQL (${process.env.DATABASE_URL ? 'connected' : 'local default'})`);
  console.log(`📊 API Endpoints Ready - PostgreSQL Integration Active`);
});

// ============ OTP & EMAIL VERIFICATION ENDPOINTS ============
app.post('/api/auth/request-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP in database
    await pool.query(
      'INSERT INTO otp_codes (email, code, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiryTime]
    );

    // Send email via Gmail (requires Gmail App Password in env)
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_ADDRESS,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.GMAIL_ADDRESS,
      to: email,
      subject: 'FiberTrace - Email Verification Code',
      html: `<h2>Email Verification</h2><p>Your OTP code is: <strong>${otp}</strong></p><p>Valid for 5 minutes</p>`,
    });

    res.json({ success: true, message: 'OTP sent to email' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    const result = await pool.query(
      'SELECT * FROM otp_codes WHERE email = $1 AND code = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, code]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    await pool.query('UPDATE otp_codes SET used = true WHERE id = $1', [result.rows[0].id]);

    res.json({ success: true, message: 'Email verified', verified: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ADMIN EMAIL CONFIGURATION ============
app.post('/api/admin/email-config', async (req: Request, res: Response) => {
  try {
    const { role } = req.user || {}; // Verify JWT token
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { gmailAppPassword, adminEmail, otpExpiry, emailVerificationEnabled, singleEmailUse } = req.body;

    // In production, encrypt and store these securely
    const config = {
      gmailAppPassword,
      adminEmail,
      otpExpiry,
      emailVerificationEnabled,
      singleEmailUse,
      updatedAt: new Date(),
    };

    // Store in database or environment
    await pool.query(
      'INSERT INTO admin_config (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
      ['email_config', JSON.stringify(config)]
    );

    res.json({ success: true, message: 'Email configuration updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/email-config', async (req: Request, res: Response) => {
  try {
    const { role } = req.user || {};
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await pool.query('SELECT value FROM admin_config WHERE key = $1', ['email_config']);

    if (result.rows.length === 0) {
      return res.json({ config: null });
    }

    res.json({ config: JSON.parse(result.rows[0].value) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ USER SETTINGS ============
app.get('/api/users/:userId/settings', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT settings FROM users WHERE id = $1',
      [userId]
    );
    res.json({ success: true, settings: result.rows[0]?.settings || {} });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:userId/settings', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const settings = req.body;
    await pool.query(
      'UPDATE users SET settings = $1 WHERE id = $2',
      [JSON.stringify(settings), userId]
    );
    res.json({ success: true, message: 'Settings updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start server

// ============ USER PROFILE UPDATE ============
app.put('/api/users/:userId/profile', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { full_name, phone } = req.body;
    await pool.query(
      'UPDATE users SET full_name = $1, phone = $2 WHERE id = $3',
      [full_name, phone, userId]
    );
    res.json({ success: true, message: 'Profile updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
