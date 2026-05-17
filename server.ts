import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import { createServer as createViteServer } from 'vite';
import db from './server/db'; 

// Setup Express
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Make uploads dir if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2GB limit
});

// Helper to generate short code
function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous characters O, 0, I, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// API Routes

// 1. Upload File
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { originalname, size, mimetype, filename } = req.file;
  const id = uuidv4();
  
  let code = generateShortCode();
  // Simple collision check (in production, we'd loop until unique)
  const existing = db.prepare('SELECT code FROM files WHERE code = ?').get(code);
  if (existing) {
    code = generateShortCode(); 
  }

  // Set expiration to 24 hours from now
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  // Use UTC format without timezone parsing issues
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO files (id, code, originalName, size, mimeType, path, createdAt, expiresAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    stmt.run(id, code, originalname, size, mimetype, filename, createdAt, expiresAt);
    res.json({
      success: true,
      code,
      expiresAt,
      originalName: originalname,
      size
    });
  } catch (err) {
    console.error('Error saving file context:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 2. Get File Info
app.get('/api/file/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const file = db.prepare('SELECT * FROM files WHERE code = ?').get(code) as any;

  if (!file) {
    return res.status(404).json({ error: 'File not found or has expired' });
  }

  // Check expiration manually as a safeguard
  if (new Date(file.expiresAt).getTime() < Date.now()) {
    return res.status(404).json({ error: 'File has expired' });
  }

  res.json({
    code: file.code,
    originalName: file.originalName,
    size: file.size,
    mimeType: file.mimeType,
    expiresAt: file.expiresAt
  });
});

// 3. Download File
app.get('/api/download/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const file = db.prepare('SELECT * FROM files WHERE code = ?').get(code) as any;

  if (!file) {
    return res.status(404).json({ error: 'File not found or has expired' });
  }

  if (new Date(file.expiresAt).getTime() < Date.now()) {
    return res.status(404).json({ error: 'File has expired' });
  }

  const filePath = path.join(uploadsDir, file.path);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File missing from storage' });
  }

  res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
  res.sendFile(filePath);
});

// Cron Job for Auto-deletion (Runs every 1 hour)
cron.schedule('0 * * * *', () => {
  console.log('Running expiration cleanup job...');
  const now = new Date().toISOString();
  
  try {
    const expiredFiles = db.prepare('SELECT * FROM files WHERE expiresAt < ?').all(now) as any[];
    
    for (const file of expiredFiles) {
      const filePath = path.join(uploadsDir, file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      db.prepare('DELETE FROM files WHERE id = ?').run(file.id);
      console.log(`Deleted expired file: ${file.code}`);
    }
  } catch (err) {
    console.error('Error during cleanup:', err);
  }
});

// Vite & Frontend Serve implementation
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
