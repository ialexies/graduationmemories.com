import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import { initDb, seedDb, db, validateToken, getPostContent, getFooter, getPageLabels, getPageMeta, savePageMeta, getEditablePageIds, savePostContent, saveFooter } from './db.js';
import { authMiddleware, signToken, requireAdmin, requirePageAccess } from './middleware/auth.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

initDb();
seedDb();

app.get('/api/pages/:id', (req, res) => {
  const { id } = req.params;
  const token = req.query.t;

  const result = validateToken(id, token);
  if (!result.valid) {
    if (result.reason === 'invalid') return res.status(401).json({ error: 'Invalid token' });
    if (result.reason === 'disabled') return res.status(403).json({ error: 'Page disabled' });
    return res.status(401).json({ error: 'Token required' });
  }

  const post = getPostContent(id);
  const footer = getFooter();
  const meta = getPageLabels(id);

  if (!post || !footer) {
    return res.status(404).json({ error: 'Page not found' });
  }

  res.json({
    post,
    footer,
    type: meta?.type || 'graduation',
    labels: meta?.labels || {},
    sectionVisibility: meta?.sectionVisibility || { classPhoto: true, gallery: true, teacherMessage: true, peopleList: true },
  });
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
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role || 'admin' } });
});

app.use('/api/admin', authMiddleware);

app.get('/api/admin/pages', (req, res) => {
  const editableIds = getEditablePageIds(req.user.id, req.user.role);
  if (editableIds.length === 0) return res.json({ pages: [] });
  const pages = db.prepare('SELECT * FROM pages WHERE id IN (' + editableIds.map(() => '?').join(',') + ') ORDER BY id').all(...editableIds);
  res.json({ pages });
});

app.get('/api/admin/pages/:id/content', requirePageAccess('id'), (req, res) => {
  const { id } = req.params;
  const post = getPostContent(id);
  if (!post) return res.status(404).json({ error: 'Content not found' });
  res.json(post);
});

app.put('/api/admin/pages/:id/content', requirePageAccess('id'), (req, res) => {
  const { id } = req.params;
  const post = req.body;
  const pageExists = db.prepare('SELECT 1 FROM pages WHERE id = ?').get(id);
  if (!pageExists) return res.status(404).json({ error: 'Page not found' });
  savePostContent(id, post);
  res.json(getPostContent(id));
});

// Image upload: stores in public/assets/{pageId}/, returns path e.g. /assets/h322x/class-photo.jpg
const uploadDir = join(__dirname, '..', 'public', 'assets');
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const pageId = req.params.id;
      const dir = join(uploadDir, pageId);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const base = file.originalname.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 50) || 'image';
      cb(null, `${base}-${Date.now()}.${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    cb(null, ok);
  },
});

app.post('/api/admin/pages/:id/upload', requirePageAccess('id'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const path = `/assets/${req.params.id}/${req.file.filename}`;
  res.json({ path });
});

app.get('/api/admin/pages/:id/meta', requirePageAccess('id'), (req, res) => {
  const { id } = req.params;
  const meta = getPageMeta(id);
  if (!meta) return res.status(404).json({ error: 'Page not found' });
  res.json(meta);
});

app.put('/api/admin/pages/:id/meta', requirePageAccess('id'), (req, res) => {
  const { id } = req.params;
  // Ensure page exists (may be missing if content was backfilled but page never seeded)
  const pageExists = db.prepare('SELECT 1 FROM pages WHERE id = ?').get(id);
  if (!pageExists) {
    const hasContent = db.prepare('SELECT 1 FROM posts_content WHERE page_id = ?').get(id);
    if (hasContent) {
      db.prepare('INSERT OR IGNORE INTO pages (id, enabled, type) VALUES (?, 1, ?)').run(id, req.body.type || 'graduation');
    } else {
      return res.status(404).json({ error: 'Page not found' });
    }
  }
  const ok = savePageMeta(id, req.body);
  if (!ok) return res.status(404).json({ error: 'Page not found' });
  res.json(getPageMeta(id));
});

app.get('/api/admin/footer', (req, res) => {
  const footer = getFooter();
  if (!footer) return res.status(404).json({ error: 'Footer not configured' });
  res.json(footer);
});

app.put('/api/admin/footer', (req, res) => {
  const footer = req.body;
  if (!footer?.shopName || !footer?.tagline || !footer?.location) {
    return res.status(400).json({ error: 'shopName, tagline, location required' });
  }
  saveFooter(footer);
  res.json(getFooter());
});

app.patch('/api/admin/pages/:id', requireAdmin, (req, res) => {
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

app.get('/api/admin/tokens', requireAdmin, (req, res) => {
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

app.post('/api/admin/tokens', requireAdmin, (req, res) => {
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

app.delete('/api/admin/tokens/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const result = db.prepare('DELETE FROM tokens WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Token not found' });
  res.status(204).send();
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, email, name, role, created_at FROM users').all();
  res.json({ users });
});

app.post('/api/admin/users', requireAdmin, (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, name required' });
  }
  const userRole = role === 'editor' ? 'editor' : 'admin';
  const hash = bcrypt.hashSync(password, 10);
  try {
    db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)').run(
      email,
      hash,
      name,
      userRole
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

app.post('/api/admin/assign', requireAdmin, (req, res) => {
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

// Serve uploaded assets (public/assets) so /assets/pageId/file.jpg works
const assetsPath = join(__dirname, '..', 'public', 'assets');
if (!existsSync(assetsPath)) mkdirSync(assetsPath, { recursive: true });
app.use('/assets', express.static(assetsPath));

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
