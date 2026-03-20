import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { initDb, seedDb, db, validateToken } from './db.js';
import { authMiddleware, signToken } from './middleware/auth.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

initDb();
seedDb();

function loadPostsData() {
  const path = join(__dirname, '..', 'public', 'data', 'posts.json');
  return JSON.parse(readFileSync(path, 'utf-8'));
}

app.get('/api/pages/:id', (req, res) => {
  const { id } = req.params;
  const token = req.query.t;

  const result = validateToken(id, token);
  if (!result.valid) {
    if (result.reason === 'invalid') return res.status(401).json({ error: 'Invalid token' });
    if (result.reason === 'disabled') return res.status(403).json({ error: 'Page disabled' });
    return res.status(401).json({ error: 'Token required' });
  }

  const data = loadPostsData();
  const post = data.posts?.[id];
  const footer = data.footer;

  if (!post || !footer) {
    return res.status(404).json({ error: 'Page not found' });
  }

  res.json({ post, footer });
});

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken(user);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.use('/api/admin', authMiddleware);

app.get('/api/admin/pages', (req, res) => {
  const pages = db.prepare('SELECT * FROM pages ORDER BY id').all();
  res.json({ pages });
});

app.patch('/api/admin/pages/:id', (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'enabled (boolean) required' });
  }
  db.prepare('UPDATE pages SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id);
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
  if (!page) return res.status(404).json({ error: 'Page not found' });
  res.json(page);
});

app.get('/api/admin/tokens', (req, res) => {
  const tokens = db
    .prepare(
      `SELECT t.id, t.token, t.page_id, t.created_at, u.name as user_name
       FROM tokens t
       LEFT JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC`
    )
    .all();
  res.json({ tokens });
});

app.post('/api/admin/tokens', (req, res) => {
  const { page_id, user_id } = req.body;
  if (!page_id) return res.status(400).json({ error: 'page_id required' });

  const pageExists = db.prepare('SELECT 1 FROM pages WHERE id = ?').get(page_id);
  if (!pageExists) return res.status(400).json({ error: 'Page not found' });

  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('INSERT INTO tokens (token, page_id, user_id) VALUES (?, ?, ?)').run(
    token,
    page_id,
    user_id || null
  );
  const row = db.prepare('SELECT * FROM tokens WHERE token = ?').get(token);
  res.status(201).json(row);
});

app.delete('/api/admin/tokens/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const result = db.prepare('DELETE FROM tokens WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Token not found' });
  res.status(204).send();
});

app.get('/api/admin/users', (req, res) => {
  const users = db.prepare('SELECT id, email, name, role, created_at FROM users').all();
  res.json({ users });
});

app.post('/api/admin/users', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, name required' });
  }
  const hash = bcrypt.hashSync(password, 10);
  try {
    db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)').run(
      email,
      hash,
      name,
      'admin'
    );
    const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE email = ?').get(email);
    res.status(201).json(user);
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    throw e;
  }
});

app.post('/api/admin/assign', (req, res) => {
  const { user_id, page_id } = req.body;
  if (!user_id || !page_id) {
    return res.status(400).json({ error: 'user_id and page_id required' });
  }
  try {
    db.prepare('INSERT OR IGNORE INTO page_assignments (user_id, page_id) VALUES (?, ?)').run(
      user_id,
      page_id
    );
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: 'User or page not found' });
    }
    throw e;
  }
});

const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
}
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexPath = join(distPath, 'index.html');
  if (existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(503).send(
    '<html><body><h1>Frontend not built</h1><p>Run <code>npm run build</code> then restart the server. Or use <code>npm run dev</code> for development (Vite serves the app on port 5173).</p></body></html>'
  );
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
