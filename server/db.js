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
      type TEXT DEFAULT 'event',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS page_labels (
      page_id TEXT PRIMARY KEY REFERENCES pages(id),
      theme_label TEXT,
      title_label TEXT,
      subtitle_label TEXT,
      people_label TEXT,
      people_tag_label TEXT,
      message_label TEXT,
      message_author_label TEXT,
      section_visibility TEXT
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

  // Migration: add type column to pages if missing (existing DBs)
  const cols = db.prepare("SELECT name FROM pragma_table_info('pages') WHERE name = 'type'").all();
  if (cols.length === 0) {
    db.exec("ALTER TABLE pages ADD COLUMN type TEXT DEFAULT 'event'");
  }

  // Migration: add section_visibility to page_labels if missing
  const labelCols = db.prepare("SELECT name FROM pragma_table_info('page_labels') WHERE name = 'section_visibility'").all();
  if (labelCols.length === 0) {
    db.exec('ALTER TABLE page_labels ADD COLUMN section_visibility TEXT');
  }

  // Migration: add color_theme to page_labels if missing
  const themeCols = db.prepare("SELECT name FROM pragma_table_info('page_labels') WHERE name = 'color_theme'").all();
  if (themeCols.length === 0) {
    db.exec('ALTER TABLE page_labels ADD COLUMN color_theme TEXT');
  }

  // Migration: add teacher_audio to posts_content if missing
  const audioCols = db.prepare("SELECT name FROM pragma_table_info('posts_content') WHERE name = 'teacher_audio'").all();
  if (audioCols.length === 0) {
    db.exec('ALTER TABLE posts_content ADD COLUMN teacher_audio TEXT');
  }
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

const DEFAULT_SECTION_VISIBILITY = {
  classPhoto: true,
  gallery: true,
  teacherMessage: true,
  teacherAudio: true,
  peopleList: true,
  studentPhotos: false,
};

const DEFAULT_LABELS = {
  graduation: {
    themeLabel: 'Graduation Souvenir',
    titleLabel: 'Section',
    subtitleLabel: 'Batch',
    peopleLabel: 'Class Registry',
    peopleTagLabel: 'Honor',
    messageLabel: 'Words from your Teacher',
    messageAuthorLabel: 'Teacher',
  },
  wedding: {
    themeLabel: 'Wedding Memories',
    titleLabel: 'Event',
    subtitleLabel: 'Date',
    peopleLabel: 'Guests',
    peopleTagLabel: 'VIP',
    messageLabel: 'From the Couple',
    messageAuthorLabel: 'Couple',
  },
  event: {
    themeLabel: 'Event Memories',
    titleLabel: 'Event',
    subtitleLabel: 'Date',
    peopleLabel: 'Attendees',
    peopleTagLabel: 'VIP',
    messageLabel: 'Message from Host',
    messageAuthorLabel: 'Host',
  },
  birthday: {
    themeLabel: 'Birthday Memories',
    titleLabel: 'Event',
    subtitleLabel: 'Date',
    peopleLabel: 'Guests',
    peopleTagLabel: 'VIP',
    messageLabel: 'Message from Host',
    messageAuthorLabel: 'Host',
  },
  anniversary: {
    themeLabel: 'Anniversary Memories',
    titleLabel: 'Event',
    subtitleLabel: 'Date',
    peopleLabel: 'Guests',
    peopleTagLabel: 'VIP',
    messageLabel: 'From the Couple',
    messageAuthorLabel: 'Couple',
  },
  reunion: {
    themeLabel: 'Reunion Memories',
    titleLabel: 'Event',
    subtitleLabel: 'Date',
    peopleLabel: 'Attendees',
    peopleTagLabel: 'VIP',
    messageLabel: 'Message from Host',
    messageAuthorLabel: 'Host',
  },
  retirement: {
    themeLabel: 'Retirement Memories',
    titleLabel: 'Event',
    subtitleLabel: 'Date',
    peopleLabel: 'Colleagues',
    peopleTagLabel: 'VIP',
    messageLabel: 'Message for Honoree',
    messageAuthorLabel: 'Honoree',
  },
  babyShower: {
    themeLabel: 'Baby Shower Memories',
    titleLabel: 'Event',
    subtitleLabel: 'Date',
    peopleLabel: 'Guests',
    peopleTagLabel: 'VIP',
    messageLabel: 'Message from Host',
    messageAuthorLabel: 'Host',
  },
  farewell: {
    themeLabel: 'Farewell Memories',
    titleLabel: 'Event',
    subtitleLabel: 'Date',
    peopleLabel: 'Colleagues',
    peopleTagLabel: 'VIP',
    messageLabel: 'Message for Honoree',
    messageAuthorLabel: 'Honoree',
  },
  engagement: {
    themeLabel: 'Engagement Memories',
    titleLabel: 'Event',
    subtitleLabel: 'Date',
    peopleLabel: 'Guests',
    peopleTagLabel: 'VIP',
    messageLabel: 'From the Couple',
    messageAuthorLabel: 'Couple',
  },
};

export const VALID_PAGE_TYPES = ['graduation', 'wedding', 'event', 'birthday', 'anniversary', 'reunion', 'retirement', 'babyShower', 'farewell', 'engagement'];

export function createPage(pageId, type = 'event') {
  const validType = VALID_PAGE_TYPES.includes(type) ? type : 'event';
  db.prepare('INSERT INTO pages (id, enabled, type) VALUES (?, 1, ?)').run(pageId, validType);
  db.prepare(`
    INSERT INTO posts_content (
      page_id, section_name, batch, location, quote, class_photo, gallery,
      teacher_message, teacher_name, teacher_photo, teacher_title, teacher_audio, students, together_since
    ) VALUES (?, '', '', '', '', '', '[]', '', '', NULL, '', NULL, '[]', '')
  `).run(pageId);
}

export function duplicatePage(sourceId, newId) {
  const source = db.prepare('SELECT * FROM pages WHERE id = ?').get(sourceId);
  if (!source) return { ok: false, error: 'Source page not found' };
  const exists = db.prepare('SELECT 1 FROM pages WHERE id = ?').get(newId);
  if (exists) return { ok: false, error: 'A page with this ID already exists' };
  const content = db.prepare('SELECT * FROM posts_content WHERE page_id = ?').get(sourceId);
  const labels = db.prepare('SELECT * FROM page_labels WHERE page_id = ?').get(sourceId);

  db.prepare('INSERT INTO pages (id, enabled, type) VALUES (?, 1, ?)').run(newId, source.type || 'event');
  if (content) {
    db.prepare(`
      INSERT INTO posts_content (page_id, section_name, batch, location, quote, class_photo, gallery,
        teacher_message, teacher_name, teacher_photo, teacher_title, teacher_audio, students, together_since)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newId, content.section_name, content.batch, content.location, content.quote,
      content.class_photo, content.gallery, content.teacher_message, content.teacher_name,
      content.teacher_photo, content.teacher_title, content.teacher_audio || null,
      content.students, content.together_since
    );
  } else {
    db.prepare(`
      INSERT INTO posts_content (page_id, section_name, batch, location, quote, class_photo, gallery,
        teacher_message, teacher_name, teacher_photo, teacher_title, teacher_audio, students, together_since)
      VALUES (?, '', '', '', '', '', '[]', '', '', NULL, '', NULL, '[]', '')
    `).run(newId);
  }
  if (labels) {
    const l = labels;
    db.prepare(`
      INSERT INTO page_labels (page_id, theme_label, title_label, subtitle_label, people_label, people_tag_label,
        message_label, message_author_label, section_visibility, color_theme)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newId, l.theme_label, l.title_label, l.subtitle_label, l.people_label, l.people_tag_label,
      l.message_label, l.message_author_label, l.section_visibility, l.color_theme
    );
  }
  return { ok: true };
}

export function getPageLabels(pageId) {
  const page = db.prepare('SELECT type FROM pages WHERE id = ?').get(pageId);
  if (!page) return null;
  const pageType = page.type || 'event';
  const defaults = DEFAULT_LABELS[pageType] || DEFAULT_LABELS.event;
  const overrides = db.prepare('SELECT * FROM page_labels WHERE page_id = ?').get(pageId);
  if (!overrides) return { type: pageType, labels: defaults, sectionVisibility: DEFAULT_SECTION_VISIBILITY, colorTheme: 'default' };
  let sectionVisibility = DEFAULT_SECTION_VISIBILITY;
  if (overrides.section_visibility) {
    try {
      sectionVisibility = { ...DEFAULT_SECTION_VISIBILITY, ...JSON.parse(overrides.section_visibility) };
    } catch (_) {}
  }
  let colorTheme = 'default';
  if (overrides.color_theme) {
    try {
      const parsed = JSON.parse(overrides.color_theme);
      colorTheme = parsed.preset || 'default';
    } catch (_) {}
  }
  return {
    type: pageType,
    labels: {
      themeLabel: overrides.theme_label ?? defaults.themeLabel,
      titleLabel: overrides.title_label ?? defaults.titleLabel,
      subtitleLabel: overrides.subtitle_label ?? defaults.subtitleLabel,
      peopleLabel: overrides.people_label ?? defaults.peopleLabel,
      peopleTagLabel: overrides.people_tag_label ?? defaults.peopleTagLabel,
      messageLabel: overrides.message_label ?? defaults.messageLabel,
      messageAuthorLabel: overrides.message_author_label ?? defaults.messageAuthorLabel,
    },
    sectionVisibility,
    colorTheme,
  };
}

export function getPageMeta(pageId) {
  const data = getPageLabels(pageId);
  if (!data) return null;
  return {
    type: data.type,
    labels: data.labels,
    sectionVisibility: data.sectionVisibility || DEFAULT_SECTION_VISIBILITY,
    colorTheme: data.colorTheme || 'default',
  };
}

export function savePageMeta(pageId, meta) {
  const page = db.prepare('SELECT id, type FROM pages WHERE id = ?').get(pageId);
  if (!page) return false;
  if (meta.type) {
    const typeChanged = page.type !== meta.type;
    db.prepare('UPDATE pages SET type = ? WHERE id = ?').run(meta.type, pageId);
    // When type changes, clear label overrides so the new type's defaults apply
    if (typeChanged) {
      db.prepare(`
        UPDATE page_labels SET
          theme_label = NULL, title_label = NULL, subtitle_label = NULL,
          people_label = NULL, people_tag_label = NULL, message_label = NULL, message_author_label = NULL
        WHERE page_id = ?
      `).run(pageId);
    }
  }
  if (meta.labels && typeof meta.labels === 'object') {
    const l = meta.labels;
    db.prepare(`
      INSERT INTO page_labels (page_id, theme_label, title_label, subtitle_label, people_label, people_tag_label, message_label, message_author_label)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(page_id) DO UPDATE SET
        theme_label = excluded.theme_label,
        title_label = excluded.title_label,
        subtitle_label = excluded.subtitle_label,
        people_label = excluded.people_label,
        people_tag_label = excluded.people_tag_label,
        message_label = excluded.message_label,
        message_author_label = excluded.message_author_label
    `).run(
      pageId,
      l.themeLabel ?? null,
      l.titleLabel ?? null,
      l.subtitleLabel ?? null,
      l.peopleLabel ?? null,
      l.peopleTagLabel ?? null,
      l.messageLabel ?? null,
      l.messageAuthorLabel ?? null
    );
  }
  if (meta.sectionVisibility && typeof meta.sectionVisibility === 'object') {
    db.prepare(`
      INSERT INTO page_labels (page_id, section_visibility) VALUES (?, ?)
      ON CONFLICT(page_id) DO UPDATE SET section_visibility = excluded.section_visibility
    `).run(pageId, JSON.stringify(meta.sectionVisibility));
  }
  if ('colorTheme' in meta) {
    const preset = meta.colorTheme || 'default';
    db.prepare(`
      INSERT INTO page_labels (page_id, color_theme) VALUES (?, ?)
      ON CONFLICT(page_id) DO UPDATE SET color_theme = excluded.color_theme
    `).run(pageId, JSON.stringify({ preset }));
  }
  return true;
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
    teacherAudio: row.teacher_audio || undefined,
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
      teacher_message, teacher_name, teacher_photo, teacher_title, teacher_audio, students, together_since, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
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
      teacher_audio = excluded.teacher_audio,
      students = excluded.students,
      together_since = excluded.together_since,
      updated_at = datetime('now')
  `).run(
    pageId,
    post.sectionName ?? '',
    post.batch ?? '',
    post.location ?? '',
    post.quote ?? '',
    post.classPhoto ?? '',
    JSON.stringify(post.gallery || []),
    post.teacherMessage ?? '',
    post.teacherName ?? '',
    post.teacherPhoto || null,
    post.teacherTitle ?? '',
    post.teacherAudio || null,
    JSON.stringify(post.students || []),
    post.togetherSince ?? ''
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
