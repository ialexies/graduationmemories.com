import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DB_PATH || join(__dirname, 'data.db');
export const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      page_id TEXT NOT NULL,
      user_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (page_id) REFERENCES pages(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS page_assignments (
      user_id INTEGER NOT NULL,
      page_id TEXT NOT NULL,
      PRIMARY KEY (user_id, page_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (page_id) REFERENCES pages(id)
    );
  `);
}

export function seedDb() {
  const postsPath = join(__dirname, '..', 'public', 'data', 'posts.json');
  const postsData = JSON.parse(readFileSync(postsPath, 'utf-8'));
  const pageIds = Object.keys(postsData.posts || {});

  const insertPage = db.prepare(
    'INSERT OR IGNORE INTO pages (id, enabled) VALUES (?, 1)'
  );
  for (const id of pageIds) {
    insertPage.run(id);
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
    ).run('admin@gradmemories.local', hash, 'Admin', 'admin');
  }
}

export function validateToken(pageId, token) {
  if (!pageId || !token) return { valid: false, reason: 'missing' };

  const row = db
    .prepare(
      `SELECT t.id, p.enabled FROM tokens t
       JOIN pages p ON t.page_id = p.id
       WHERE t.token = ? AND t.page_id = ?`
    )
    .get(token, pageId);

  if (!row) return { valid: false, reason: 'invalid' };
  if (row.enabled !== 1) return { valid: false, reason: 'disabled' };
  return { valid: true };
}
