import express, { Express, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Pool } from 'pg';
import { authMiddleware, AuthRequest } from './auth.js';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/csv'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Initialize uploads table
export async function initUploadsTable(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS uploads (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        entity_type VARCHAR(100),
        entity_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_uploads_user ON uploads(user_id);
      CREATE INDEX IF NOT EXISTS idx_uploads_entity ON uploads(entity_type, entity_id);
    `);
  } finally {
    client.release();
  }
}

// POST /api/uploads - Upload file
router.post('/uploads', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file || !req.user) {
      return res.status(400).json({ error: 'No file uploaded or user not authenticated' });
    }

    const { entity_type, entity_id } = req.body;
    const pool = (req.app as any).pool as Pool;

    const result = await pool.query(
      `INSERT INTO uploads (user_id, file_name, file_path, file_size, mime_type, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, file_name, file_path, created_at`,
      [
        req.user.userId,
        req.file.originalname,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        entity_type || null,
        entity_id || null,
      ]
    );

    res.status(201).json({
      success: true,
      upload: result.rows[0],
      url: `/api/uploads/${result.rows[0].id}/download`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/uploads/:id/download - Download file
router.get('/uploads/:id/download', async (req: Request, res: Response) => {
  try {
    const pool = (req.app as any).pool as Pool;
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM uploads WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    const upload = result.rows[0];
    res.download(upload.file_path, upload.file_name);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/uploads - List user uploads
router.get('/uploads', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const pool = (req.app as any).pool as Pool;
    const result = await pool.query(
      'SELECT id, file_name, file_size, mime_type, entity_type, entity_id, created_at FROM uploads WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );

    res.json({ uploads: result.rows, count: result.rows.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
