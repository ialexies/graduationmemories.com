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

    CREATE TABLE IF NOT EXISTS posts_content (
      page_id TEXT PRIMARY KEY REFERENCES pages(id),
      section_name TEXT NOT NULL,
      batch TEXT NOT NULL,
      location TEXT NOT NULL,
      quote TEXT NOT NULL,
      class_photo TEXT NOT NULL,
      gallery TEXT NOT NULL,
      teacher_message TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      teacher_photo TEXT,
      teacher_title TEXT NOT NULL,
      students TEXT NOT NULL,
      together_since TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS footer_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      link_url TEXT,
      logo TEXT,
      shop_name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      location TEXT NOT NULL
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

  const contentCount = db.prepare('SELECT COUNT(*) as count FROM posts_content').get();
  if (contentCount.count === 0 && postsData.posts) {
    const insertContent = db.prepare(`
      INSERT INTO posts_content (
        page_id, section_name, batch, location, quote, class_photo, gallery,
        teacher_message, teacher_name, teacher_photo, teacher_title, students, together_since
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const [pageId, post] of Object.entries(postsData.posts)) {
      insertContent.run(
        pageId,
        post.sectionName,
        post.batch,
        post.location,
        post.quote,
        post.classPhoto,
        JSON.stringify(post.gallery || []),
        post.teacherMessage,
        post.teacherName,
        post.teacherPhoto || null,
        post.teacherTitle,
        JSON.stringify(post.students || []),
        post.togetherSince
      );
    }
  } else if (postsData.posts) {
    // Backfill: add content for pages in posts.json that have no content yet
    const insertContent = db.prepare(`
      INSERT INTO posts_content (
        page_id, section_name, batch, location, quote, class_photo, gallery,
        teacher_message, teacher_name, teacher_photo, teacher_title, students, together_since
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const [pageId, post] of Object.entries(postsData.posts)) {
      const exists = db.prepare('SELECT 1 FROM posts_content WHERE page_id = ?').get(pageId);
      if (!exists) {
        insertContent.run(
          pageId,
          post.sectionName,
          post.batch,
          post.location,
          post.quote,
          post.classPhoto,
          JSON.stringify(post.gallery || []),
          post.teacherMessage,
          post.teacherName,
          post.teacherPhoto || null,
          post.teacherTitle,
          JSON.stringify(post.students || []),
          post.togetherSince
        );
      }
    }
  }

  const footerCount = db.prepare('SELECT COUNT(*) as count FROM footer_config').get();
  if (footerCount.count === 0 && postsData.footer) {
    const f = postsData.footer;
    db.prepare(`
      INSERT INTO footer_config (id, link_url, logo, shop_name, tagline, location)
      VALUES (1, ?, ?, ?, ?, ?)
    `).run(f.linkUrl || null, f.logo || null, f.shopName, f.tagline, f.location);
  }
}

export function getPostContent(pageId) {
  const row = db.prepare('SELECT * FROM posts_content WHERE page_id = ?').get(pageId);
  if (!row) return null;
  return {
    sectionName: row.section_name,
    batch: row.batch,
    location: row.location,
    quote: row.quote,
    classPhoto: row.class_photo,
    gallery: JSON.parse(row.gallery || '[]'),
    teacherMessage: row.teacher_message,
    teacherName: row.teacher_name,
    teacherPhoto: row.teacher_photo,
    teacherTitle: row.teacher_title,
    students: JSON.parse(row.students || '[]'),
    togetherSince: row.together_since,
  };
}

export function getFooter() {
  const row = db.prepare('SELECT * FROM footer_config WHERE id = 1').get();
  if (!row) return null;
  return {
    linkUrl: row.link_url,
    logo: row.logo,
    shopName: row.shop_name,
    tagline: row.tagline,
    location: row.location,
  };
}

export function canEditPage(userId, role, pageId) {
  if (role === 'admin') return true;
  if (role !== 'editor') return false;
  const assigned = db.prepare('SELECT 1 FROM page_assignments WHERE user_id = ? AND page_id = ?').get(userId, pageId);
  return !!assigned;
}

export function getEditablePageIds(userId, role) {
  if (role === 'admin') {
    return db.prepare('SELECT id FROM pages ORDER BY id').all().map((r) => r.id);
  }
  return db.prepare('SELECT page_id FROM page_assignments WHERE user_id = ? ORDER BY page_id').all(userId).map((r) => r.page_id);
}

export function savePostContent(pageId, post) {
  db.prepare(`
    INSERT INTO posts_content (
      page_id, section_name, batch, location, quote, class_photo, gallery,
      teacher_message, teacher_name, teacher_photo, teacher_title, students, together_since, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(page_id) DO UPDATE SET
      section_name = excluded.section_name,
      batch = excluded.batch,
      location = excluded.location,
      quote = excluded.quote,
      class_photo = excluded.class_photo,
      gallery = excluded.gallery,
      teacher_message = excluded.teacher_message,
      teacher_name = excluded.teacher_name,
      teacher_photo = excluded.teacher_photo,
      teacher_title = excluded.teacher_title,
      students = excluded.students,
      together_since = excluded.together_since,
      updated_at = datetime('now')
  `).run(
    pageId,
    post.sectionName,
    post.batch,
    post.location,
    post.quote,
    post.classPhoto,
    JSON.stringify(post.gallery || []),
    post.teacherMessage,
    post.teacherName,
    post.teacherPhoto || null,
    post.teacherTitle,
    JSON.stringify(post.students || []),
    post.togetherSince
  );
}

export function saveFooter(footer) {
  db.prepare(`
    INSERT INTO footer_config (id, link_url, logo, shop_name, tagline, location)
    VALUES (1, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      link_url = excluded.link_url,
      logo = excluded.logo,
      shop_name = excluded.shop_name,
      tagline = excluded.tagline,
      location = excluded.location
  `).run(
    footer.linkUrl || null,
    footer.logo || null,
    footer.shopName,
    footer.tagline,
    footer.location
  );
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
