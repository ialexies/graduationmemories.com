import crypto from 'crypto';
import { db, getPostContent, getFooter, getPageMeta, getEditablePageIds } from './db.js';

const DEFAULT_THEME_ID = 'theme_default';

function newId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function nowIso() {
  return new Date().toISOString();
}

export const V2_BLOCK_TYPES = new Set([
  'header',
  'richText',
  'peopleList',
  'imageGrid',
  'cta',
  'footer',
  'image',
  'authorCard',
  'audio',
]);

function validateBlocks(blocks) {
  if (!Array.isArray(blocks)) throw new Error('blocks must be an array');
  for (const b of blocks) {
    if (!b || typeof b !== 'object') throw new Error('Invalid block');
    if (typeof b.id !== 'string' || !b.id.trim()) throw new Error('Block id required');
    if (!V2_BLOCK_TYPES.has(b.type)) throw new Error(`Unsupported block type: ${b.type}`);
    if (typeof b.props !== 'object' || b.props == null || Array.isArray(b.props)) {
      throw new Error(`Invalid props for block ${b.id}`);
    }
  }
}

function parseThemePreset(meta) {
  try {
    const raw = meta?.colorTheme ?? 'default';
    return typeof raw === 'string' ? raw : 'default';
  } catch {
    return 'default';
  }
}

export function ensureV2Defaults() {
  const exists = db.prepare('SELECT 1 FROM v2_themes WHERE id = ?').get(DEFAULT_THEME_ID);
  if (!exists) {
    const tokens = {
      preset: 'default',
      colors: {
        bg: '#f8fafc',
        text: '#0f172a',
        accent: '#2563eb',
      },
    };
    db.prepare(
      'INSERT INTO v2_themes (id, name, tokens_json) VALUES (?, ?, ?)'
    ).run(DEFAULT_THEME_ID, 'Default', JSON.stringify(tokens));
  }
}

function canReadV2Page(userId, role, pageId) {
  if (role === 'admin') return true;
  const owns = db.prepare('SELECT 1 FROM v2_pages WHERE id = ? AND created_by = ?').get(pageId, userId);
  if (owns) return true;
  const assigned = db.prepare('SELECT 1 FROM v2_page_assignments WHERE user_id = ? AND page_id = ?').get(userId, pageId);
  return !!assigned;
}

export function listV2PagesForUser(userId, role) {
  if (role === 'admin') {
    return db.prepare(`
      SELECT p.id, p.slug, p.title, p.status, p.created_at, p.updated_at, p.published_at, t.name as theme_name
      FROM v2_pages p
      LEFT JOIN v2_themes t ON t.id = p.theme_id
      ORDER BY p.updated_at DESC, p.created_at DESC
    `).all();
  }
  return db.prepare(`
    SELECT p.id, p.slug, p.title, p.status, p.created_at, p.updated_at, p.published_at, t.name as theme_name
    FROM v2_pages p
    LEFT JOIN v2_themes t ON t.id = p.theme_id
    LEFT JOIN v2_page_assignments a ON a.page_id = p.id
    WHERE p.created_by = ? OR a.user_id = ?
    ORDER BY p.updated_at DESC, p.created_at DESC
  `).all(userId, userId);
}

export function createV2Page({ slug, title, themeId }, user) {
  const id = newId('v2p');
  const sanitizedSlug = slug.trim().toLowerCase();
  const pageTheme = themeId || DEFAULT_THEME_ID;
  db.prepare(`
    INSERT INTO v2_pages (id, slug, title, status, theme_id, created_by, created_at, updated_at)
    VALUES (?, ?, ?, 'draft', ?, ?, datetime('now'), datetime('now'))
  `).run(id, sanitizedSlug, title.trim(), pageTheme, user.id);
  db.prepare('INSERT OR IGNORE INTO v2_page_assignments (user_id, page_id) VALUES (?, ?)').run(user.id, id);

  const initialContent = {
    labels: {},
    blocks: [
      {
        id: 'blk_header_01',
        type: 'header',
        visibility: true,
        props: { title: title.trim(), subtitle: '', metaLeft: '', metaRight: '' },
      },
      {
        id: 'blk_richtext_01',
        type: 'richText',
        visibility: true,
        props: { content: '<p></p>' },
      },
      {
        id: 'blk_footer_01',
        type: 'footer',
        visibility: true,
        props: { shopName: '', tagline: '', location: '', linkUrl: '' },
      },
    ],
    meta: { schemaVersion: 1 },
  };
  saveV2Draft(id, initialContent, user, true);
  return getV2PageById(id, user);
}

export function getV2PageById(pageId, user) {
  if (!canReadV2Page(user.id, user.role, pageId)) return null;
  const page = db.prepare('SELECT * FROM v2_pages WHERE id = ?').get(pageId);
  if (!page) return null;
  const latest = db.prepare(`
    SELECT id, version_no, content_json, is_published, created_at
    FROM v2_page_versions
    WHERE page_id = ?
    ORDER BY version_no DESC
    LIMIT 1
  `).get(pageId);
  const published = page.published_version_id
    ? db.prepare('SELECT id, version_no, content_json, created_at FROM v2_page_versions WHERE id = ?').get(page.published_version_id)
    : null;
  return {
    page,
    latestDraft: latest ? { ...latest, content: JSON.parse(latest.content_json) } : null,
    published: published ? { ...published, content: JSON.parse(published.content_json) } : null,
  };
}

export function saveV2Draft(pageId, content, user, skipAccessCheck = false) {
  if (!skipAccessCheck && !canReadV2Page(user.id, user.role, pageId)) return null;
  if (!content || typeof content !== 'object') throw new Error('content is required');
  const blocks = content.blocks || [];
  validateBlocks(blocks);

  const nextVersion = db.prepare('SELECT COALESCE(MAX(version_no), 0) + 1 as n FROM v2_page_versions WHERE page_id = ?').get(pageId).n;
  const versionId = newId('v2v');
  const payload = {
    labels: content.labels && typeof content.labels === 'object' ? content.labels : {},
    blocks,
    meta: content.meta && typeof content.meta === 'object' ? content.meta : { schemaVersion: 1 },
  };

  db.prepare(`
    INSERT INTO v2_page_versions (id, page_id, version_no, content_json, created_by, is_published, created_at)
    VALUES (?, ?, ?, ?, ?, 0, datetime('now'))
  `).run(versionId, pageId, nextVersion, JSON.stringify(payload), user.id);

  db.prepare(`UPDATE v2_pages SET updated_at = datetime('now') WHERE id = ?`).run(pageId);

  return {
    id: versionId,
    versionNo: nextVersion,
    savedAt: nowIso(),
  };
}

export function publishV2Latest(pageId, user) {
  if (!canReadV2Page(user.id, user.role, pageId)) return null;
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  const latest = db.prepare(`
    SELECT id, version_no
    FROM v2_page_versions
    WHERE page_id = ?
    ORDER BY version_no DESC
    LIMIT 1
  `).get(pageId);
  if (!latest) throw new Error('No draft exists to publish');

  const tx = db.transaction(() => {
    db.prepare('UPDATE v2_page_versions SET is_published = 0 WHERE page_id = ?').run(pageId);
    db.prepare('UPDATE v2_page_versions SET is_published = 1 WHERE id = ?').run(latest.id);
    db.prepare(`
      UPDATE v2_pages
      SET published_version_id = ?, status = 'published', published_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(latest.id, pageId);
  });
  tx();
  return { publishedVersionNo: latest.version_no, publishedAt: nowIso() };
}

export function getV2PublicBySlug(slug) {
  const page = db.prepare(`
    SELECT p.*, t.tokens_json
    FROM v2_pages p
    LEFT JOIN v2_themes t ON t.id = p.theme_id
    WHERE p.slug = ?
  `).get(slug);
  if (!page || !page.published_version_id) return null;
  const version = db.prepare(`
    SELECT content_json, version_no, created_at
    FROM v2_page_versions
    WHERE id = ? AND is_published = 1
  `).get(page.published_version_id);
  if (!version) return null;
  const content = JSON.parse(version.content_json);
  return {
    page: {
      id: page.id,
      slug: page.slug,
      title: page.title,
      status: page.status,
      publishedAt: page.published_at,
      theme: page.tokens_json ? JSON.parse(page.tokens_json) : { preset: 'default' },
    },
    labels: content.labels || {},
    blocks: content.blocks || [],
    version: { no: version.version_no, createdAt: version.created_at },
  };
}

function fromLegacyStudents(studentsRaw, peopleTagLabel) {
  const input = Array.isArray(studentsRaw) ? studentsRaw : [];
  return input.map((s) => ({
    name: s?.name || '',
    tag: s?.honor ? (peopleTagLabel || 'Tag') : '',
    avatar: s?.photo || '',
  }));
}

export function previewLegacyToV2(legacyPageId) {
  const post = getPostContent(legacyPageId);
  if (!post) return null;
  const footer = getFooter() || { shopName: '', tagline: '', location: '', linkUrl: '' };
  const meta = getPageMeta(legacyPageId) || { labels: {}, sectionVisibility: {}, colorTheme: 'default' };
  const labels = meta.labels || {};
  const vis = meta.sectionVisibility || {};

  const blocks = [
    {
      id: 'blk_header_01',
      type: 'header',
      visibility: true,
      props: {
        title: post.sectionName || '',
        subtitle: post.quote || '',
        metaLeft: post.batch || '',
        metaRight: post.location || '',
      },
    },
    {
      id: 'blk_image_01',
      type: 'image',
      visibility: vis.classPhoto !== false,
      props: { src: post.classPhoto || '', alt: 'Cover image' },
    },
    {
      id: 'blk_grid_01',
      type: 'imageGrid',
      visibility: vis.gallery !== false,
      props: { images: Array.isArray(post.gallery) ? post.gallery : [] },
    },
    {
      id: 'blk_author_01',
      type: 'authorCard',
      visibility: vis.teacherMessage !== false,
      props: { name: post.teacherName || '', role: post.teacherTitle || '', photo: post.teacherPhoto || '' },
    },
    {
      id: 'blk_richtext_01',
      type: 'richText',
      visibility: vis.teacherMessage !== false,
      props: { content: post.teacherMessage || '<p></p>' },
    },
    {
      id: 'blk_audio_01',
      type: 'audio',
      visibility: vis.teacherAudio !== false,
      props: {
        src: post.teacherAudio || '',
        transcript: Array.isArray(post.teacherAudioTranscript) ? post.teacherAudioTranscript : [],
      },
    },
    {
      id: 'blk_people_01',
      type: 'peopleList',
      visibility: vis.peopleList !== false,
      props: {
        items: fromLegacyStudents(post.students, labels.peopleTagLabel),
        footerText: post.togetherSince || '',
      },
    },
    {
      id: 'blk_footer_01',
      type: 'footer',
      visibility: true,
      props: {
        shopName: footer.shopName || '',
        tagline: footer.tagline || '',
        location: footer.location || '',
        linkUrl: footer.linkUrl || '',
      },
    },
  ];

  return {
    page: {
      id: legacyPageId,
      slug: legacyPageId,
      title: post.sectionName || legacyPageId,
      status: 'draft',
      theme: { preset: parseThemePreset(meta) },
      labels: {
        headerEyebrow: labels.themeLabel || '',
        headerTitleLabel: labels.titleLabel || '',
        peopleListTitle: labels.peopleLabel || '',
        peopleTagText: labels.peopleTagLabel || '',
        messageBlockTitle: labels.messageLabel || '',
        authorLabel: labels.messageAuthorLabel || '',
      },
    },
    blocks,
    versionMeta: {
      source: 'legacy-migration',
      sourceSchema: 'posts_content_v1',
      migrationVersion: 1,
    },
  };
}

export function assignV2PageToUser(pageId, userId) {
  db.prepare('INSERT OR IGNORE INTO v2_page_assignments (user_id, page_id) VALUES (?, ?)').run(userId, pageId);
}

export function canAccessV2Page(user, pageId) {
  return canReadV2Page(user.id, user.role, pageId);
}

export function canAccessLegacySourceForMigration(user, legacyPageId) {
  if (user.role === 'admin') return true;
  const editable = new Set(getEditablePageIds(user.id, user.role));
  return editable.has(legacyPageId);
}

