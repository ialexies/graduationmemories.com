import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { writeFile } from 'fs/promises';
import sharp from 'sharp';
import { parseFile } from 'music-metadata';
import { initDb, seedDb, db, validateToken, getPostContent, getFooter, getPageLabels, getPageMeta, savePageMeta, getEditablePageIds, savePostContent, saveFooter, createPage } from './db.js';
import { authMiddleware, signToken, requireAdmin, requirePageAccess } from './middleware/auth.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

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
    type: meta?.type || 'event',
    labels: meta?.labels || {},
    sectionVisibility: meta?.sectionVisibility || { classPhoto: true, gallery: true, teacherMessage: true, teacherAudio: true, peopleList: true, studentPhotos: false },
    colorTheme: meta?.colorTheme || 'default',
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
  try {
    const editableIds = getEditablePageIds(req.user.id, req.user.role);
    if (editableIds.length === 0) return res.json({ pages: [] });
    const rows = db.prepare(`
      SELECT p.id, p.enabled, p.type, p.created_at, c.section_name as label
      FROM pages p
      LEFT JOIN posts_content c ON p.id = c.page_id
      WHERE p.id IN (${editableIds.map(() => '?').join(',')})
      ORDER BY p.id
    `).all(...editableIds);
    const pages = rows.map((r) => ({
      id: r.id,
      enabled: r.enabled,
      type: r.type,
      created_at: r.created_at,
      label: r.label || null,
    }));
    res.json({ pages });
  } catch (err) {
    console.error('GET /api/admin/pages error:', err);
    res.status(500).json({ error: err.message || 'Failed to load pages' });
  }
});

app.post('/api/admin/pages', requireAdmin, (req, res) => {
  try {
    const { id, type } = req.body;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Page ID is required' });
    }
    const trimmed = id.trim();
    if (trimmed.length < 3 || trimmed.length > 20) {
      return res.status(400).json({ error: 'Page ID must be 3–20 characters' });
    }
    if (!/^[a-zA-Z0-9-]+$/.test(trimmed)) {
      return res.status(400).json({ error: 'Page ID can only contain letters, numbers, and hyphens' });
    }
    const exists = db.prepare('SELECT 1 FROM pages WHERE id = ?').get(trimmed);
    if (exists) {
      return res.status(400).json({ error: 'A page with this ID already exists' });
    }
    const pageType = ['graduation', 'wedding', 'event'].includes(type) ? type : 'event';
    createPage(trimmed, pageType);
    db.prepare('INSERT OR IGNORE INTO page_assignments (user_id, page_id) VALUES (?, ?)').run(req.user.id, trimmed);
    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(trimmed);
    res.status(201).json(page);
  } catch (err) {
    console.error('POST /api/admin/pages error:', err);
    res.status(500).json({ error: err.message || 'Failed to create page' });
  }
});

app.get('/api/admin/pages/:id/content', requirePageAccess('id'), (req, res) => {
  const { id } = req.params;
  const post = getPostContent(id);
  if (!post) return res.status(404).json({ error: 'Content not found' });
  res.json(post);
});

app.put('/api/admin/pages/:id/content', requirePageAccess('id'), (req, res) => {
  try {
    const { id } = req.params;
    const post = req.body;
    const pageExists = db.prepare('SELECT 1 FROM pages WHERE id = ?').get(id);
    if (!pageExists) return res.status(404).json({ error: 'Page not found' });
    savePostContent(id, post);
    res.json(getPostContent(id));
  } catch (err) {
    console.error('PUT content error:', err);
    res.status(500).json({ error: err.message || 'Failed to save content' });
  }
});

// Image/audio upload: use ASSETS_PATH in production (e.g. Docker volume) for persistence
const uploadDir = process.env.ASSETS_PATH || join(__dirname, '..', 'public', 'assets');
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

const MAX_AUDIO_DURATION_SEC = 180; // 3 minutes
const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5MB
const uploadAudio = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const pageId = req.params.id;
      const dir = join(uploadDir, pageId);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const base = 'teacher-audio';
      cb(null, `${base}-${Date.now()}.mp3`);
    },
  }),
  limits: { fileSize: MAX_AUDIO_SIZE },
});

const MAX_IMAGE_DIMENSION = 2048;
const MAX_INPUT_DIMENSION = 8000; // reject images larger than this (safety)
const JPEG_QUALITY = 85;
const WEBP_QUALITY = 85;

app.post('/api/admin/pages/:id/upload', requirePageAccess('id'), (req, res, next) => {
  upload.single('file')(req, res, async (multerErr) => {
    try {
      if (multerErr) {
        console.error('Multer error:', multerErr);
        return res.status(400).json({ error: multerErr.message || 'Upload failed' });
      }
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const filePath = req.file.path;
      const ext = (req.file.filename.split('.').pop() || 'jpg').toLowerCase();
      try {
        const image = sharp(filePath);
        const metadata = await image.metadata();
        const { width = 0, height = 0 } = metadata;

        if (width > MAX_INPUT_DIMENSION || height > MAX_INPUT_DIMENSION) {
          unlinkSync(filePath);
          return res.status(400).json({
            error: `Image resolution too large. Maximum ${MAX_INPUT_DIMENSION}×${MAX_INPUT_DIMENSION} pixels.`,
          });
        }

        let pipeline = image.resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
          fit: 'inside',
          withoutEnlargement: true,
        });

        if (['jpg', 'jpeg'].includes(ext)) {
          pipeline = pipeline.jpeg({ quality: JPEG_QUALITY });
        } else if (ext === 'png') {
          pipeline = pipeline.png({ compressionLevel: 9 });
        } else if (ext === 'webp') {
          pipeline = pipeline.webp({ quality: WEBP_QUALITY });
        } else if (ext === 'gif') {
          pipeline = pipeline.gif();
        }

        const buffer = await pipeline.toBuffer();
        await writeFile(filePath, buffer);
      } catch (err) {
        console.error('Image processing error (keeping original):', err.message);
        // Keep original file if sharp fails - upload still succeeds
      }

      const path = `/assets/${req.params.id}/${req.file.filename}`;
      res.json({ path });
    } catch (err) {
      console.error('Upload handler error:', err);
      if (req.file?.path && existsSync(req.file.path)) unlinkSync(req.file.path);
      res.status(500).json({ error: err.message || 'Upload failed' });
    }
  });
});

app.post('/api/admin/pages/:id/upload-audio', requirePageAccess('id'), (req, res, next) => {
  uploadAudio.single('file')(req, res, async (multerErr) => {
    try {
      if (multerErr) {
        console.error('Audio multer error:', multerErr.message, multerErr.code);
        let msg = multerErr.message || 'Upload failed. Max 5MB.';
        if (multerErr.code === 'LIMIT_FILE_SIZE') msg = 'File too large. Maximum 5MB.';
        if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') msg = 'Unexpected field. Use field name "file".';
        return res.status(400).json({ error: msg });
      }
      if (!req.file) {
        console.error('Audio upload: no file in request');
        return res.status(400).json({ error: 'No file uploaded. Please select an MP3 file.' });
      }
      const filePath = req.file.path;
      try {
        const metadata = await parseFile(filePath);
        const durationSec = metadata.format?.duration ?? 0;
        if (durationSec > MAX_AUDIO_DURATION_SEC) {
          unlinkSync(filePath);
          return res.status(400).json({
            error: `Audio too long. Maximum ${MAX_AUDIO_DURATION_SEC / 60} minutes. Your file: ${Math.ceil(durationSec / 60)} min.`,
          });
        }
      } catch (err) {
        console.warn('Audio metadata parse failed (accepting file):', err?.message);
        // Accept file anyway - some MP3 variants may not parse; duration check skipped
      }
      // Remove old audio file when replacing
      const content = getPostContent(req.params.id);
      const oldPath = content?.teacherAudio;
      if (oldPath && oldPath.startsWith('/assets/')) {
        const fullPath = join(__dirname, '..', 'public', oldPath.replace(/^\//, ''));
        if (existsSync(fullPath)) unlinkSync(fullPath);
      }
      const path = `/assets/${req.params.id}/${req.file.filename}`;
      res.json({ path });
    } catch (err) {
      console.error('Audio upload error:', err);
      if (req.file?.path && existsSync(req.file.path)) unlinkSync(req.file.path);
      res.status(500).json({ error: err.message || 'Upload failed' });
    }
  });
});

app.delete('/api/admin/pages/:id/audio', requirePageAccess('id'), (req, res) => {
  try {
    const { id } = req.params;
    const content = getPostContent(id);
    const oldPath = content?.teacherAudio;
    if (oldPath && oldPath.startsWith('/assets/')) {
      const fullPath = join(__dirname, '..', 'public', oldPath.replace(/^\//, ''));
      if (existsSync(fullPath)) unlinkSync(fullPath);
    }
    const updated = { ...content, teacherAudio: undefined };
    savePostContent(id, updated);
    res.json(getPostContent(id));
  } catch (err) {
    console.error('Delete audio error:', err);
    res.status(500).json({ error: err.message || 'Failed to remove audio' });
  }
});

app.get('/api/admin/pages/:id/meta', requirePageAccess('id'), (req, res) => {
  const { id } = req.params;
  const meta = getPageMeta(id);
  if (!meta) return res.status(404).json({ error: 'Page not found' });
  res.json(meta);
});

app.put('/api/admin/pages/:id/meta', requirePageAccess('id'), (req, res) => {
  try {
    const { id } = req.params;
    const pageExists = db.prepare('SELECT 1 FROM pages WHERE id = ?').get(id);
    if (!pageExists) {
      const hasContent = db.prepare('SELECT 1 FROM posts_content WHERE page_id = ?').get(id);
      if (hasContent) {
        db.prepare('INSERT OR IGNORE INTO pages (id, enabled, type) VALUES (?, 1, ?)').run(id, req.body.type || 'event');
      } else {
        return res.status(404).json({ error: 'Page not found' });
      }
    }
    const ok = savePageMeta(id, req.body);
    if (!ok) return res.status(404).json({ error: 'Page not found' });
    res.json(getPageMeta(id));
  } catch (err) {
    console.error('PUT meta error:', err);
    res.status(500).json({ error: err.message || 'Failed to save meta' });
  }
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

// Serve uploaded assets so /assets/pageId/file.jpg works
const assetsPath = process.env.ASSETS_PATH || join(__dirname, '..', 'public', 'assets');
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

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
