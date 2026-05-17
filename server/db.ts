import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'swiftshare.db');
const db = new Database(dbPath);

// Initialization table
db.exec(`
  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    originalName TEXT NOT NULL,
    size INTEGER NOT NULL,
    mimeType TEXT NOT NULL,
    path TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiresAt DATETIME NOT NULL
  )
`);

export default db;
