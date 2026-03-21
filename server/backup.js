/**
 * Full and single-page backup export/import (ZIP: manifest.json + data.json + assets/).
 */
import archiver from 'archiver';
import unzipper from 'unzipper';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  statSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { db } from './db.js';

export const BACKUP_FORMAT_VERSION = 1;
const MAX_ZIP_ENTRIES = 20000;
const MAX_UNCOMPRESSED_BYTES = 512 * 1024 * 1024; // 512 MB total extract guard

/** Same rules as create page / duplicate: single path segment, no traversal (used for join(assetsRoot, pageId)). */
function isValidBackupPageId(pageId) {
  return (
    typeof pageId === 'string' &&
    pageId.length >= 3 &&
    pageId.length <= 20 &&
    /^[a-zA-Z0-9-]+$/.test(pageId)
  );
}

const TABLES_FULL = [
  'users',
  'pages',
  'page_labels',
  'posts_content',
  'footer_config',
  'page_assignments',
  'tokens',
];

/** SQLite double-quoted identifier; names must be alphanumeric + underscore. */
function quoteIdent(name) {
  if (typeof name !== 'string' || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Invalid SQL identifier: ${name}`);
  }
  return `"${name}"`;
}

function collectDataFull() {
  const data = {};
  for (const t of TABLES_FULL) {
    data[t] = db.prepare(`SELECT * FROM ${quoteIdent(t)}`).all();
  }
  return data;
}

function collectDataPage(pageId) {
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(pageId);
  if (!page) return null;
  const data = {
    users: [],
    pages: [page],
    page_labels: db.prepare('SELECT * FROM page_labels WHERE page_id = ?').all(pageId),
    posts_content: [],
    footer_config: [],
    page_assignments: db.prepare('SELECT * FROM page_assignments WHERE page_id = ?').all(pageId),
    tokens: db.prepare('SELECT * FROM tokens WHERE page_id = ?').all(pageId),
  };
  const post = db.prepare('SELECT * FROM posts_content WHERE page_id = ?').get(pageId);
  if (post) data.posts_content = [post];
  return data;
}

/**
 * Stream a ZIP backup to Express response.
 * @param {import('express').Response} res
 * @param {string} assetsRoot - absolute path to assets directory
 * @param {{ scope?: 'full'|'page', pageId?: string }} opts
 */
export function streamBackupZip(res, assetsRoot, opts = {}) {
  const scope = opts.scope === 'page' && opts.pageId ? 'page' : 'full';
  const pageId =
    scope === 'page' && typeof opts.pageId === 'string' ? opts.pageId.trim() : undefined;

  if (scope === 'page') {
    if (!pageId || !isValidBackupPageId(pageId)) {
      res.status(400).json({ error: 'Invalid page ID' });
      return;
    }
    const data = collectDataPage(pageId);
    if (!data) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }
    const manifest = {
      version: BACKUP_FORMAT_VERSION,
      app: 'graduation-memories',
      exportedAt: new Date().toISOString(),
      scope: 'page',
      pageId,
    };
    pipeZip(res, manifest, data, assetsRoot, scope, pageId);
    return;
  }

  const manifest = {
    version: BACKUP_FORMAT_VERSION,
    app: 'graduation-memories',
    exportedAt: new Date().toISOString(),
    scope: 'full',
  };
  const data = collectDataFull();
  pipeZip(res, manifest, data, assetsRoot, scope, undefined);
}

function pipeZip(res, manifest, data, assetsRoot, scope, pageId) {
  const filename = `gradmemories-backup-${scope}-${new Date().toISOString().slice(0, 10)}.zip`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.on('error', (err) => {
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else res.end();
  });
  archive.pipe(res);
  archive.append(JSON.stringify(manifest, null, 0), { name: 'manifest.json' });
  archive.append(JSON.stringify(data, null, 0), { name: 'data.json' });

  if (existsSync(assetsRoot)) {
    if (scope === 'page' && pageId) {
      const pageDir = join(assetsRoot, pageId);
      if (existsSync(pageDir) && statSync(pageDir).isDirectory()) {
        archive.directory(pageDir, `assets/${pageId}`);
      }
    } else {
      archive.directory(assetsRoot, 'assets');
    }
  }
  archive.finalize();
}

/**
 * Reject path traversal: resolve logical path depth; any `..` that escapes above root fails.
 * (Leading-strip-only checks miss e.g. `assets/../../etc/passwd`.)
 */
function isSafeZipPath(entryPath) {
  const p = String(entryPath).replace(/\\/g, '/').replace(/^\/+/, '');
  if (!p) return false;
  if (p.startsWith('/') || /^[a-zA-Z]:/.test(p)) return false;
  const segments = p.split('/').filter((s) => s.length > 0);
  let depth = 0;
  for (const seg of segments) {
    if (seg === '..') {
      depth -= 1;
      if (depth < 0) return false;
    } else if (seg !== '.') {
      depth += 1;
    }
  }
  return true;
}

/**
 * @param {Buffer} buffer
 * @param {string} assetsRoot
 * @param {{ confirmFull?: boolean }} options
 * @returns {{ ok: true } | { ok: false, error: string, status?: number }}
 */
export async function importBackupFromBuffer(buffer, assetsRoot, options = {}) {
  let directory;
  try {
    directory = await unzipper.Open.buffer(buffer);
  } catch (e) {
    return { ok: false, error: 'Invalid ZIP file', status: 400 };
  }

  let manifestText;
  let dataText;
  const fileEntries = [];

  let totalSize = 0;
  let entryCount = 0;
  for (const file of directory.files) {
    if (file.type === 'Directory') continue;
    entryCount++;
    if (entryCount > MAX_ZIP_ENTRIES) {
      return { ok: false, error: 'ZIP has too many entries', status: 400 };
    }
    const path = file.path.replace(/\\/g, '/');
    if (!isSafeZipPath(path)) {
      return { ok: false, error: 'Unsafe path in ZIP', status: 400 };
    }
    if (path === 'manifest.json') {
      const buf = await file.buffer();
      totalSize += buf.length;
      if (totalSize > MAX_UNCOMPRESSED_BYTES) return { ok: false, error: 'ZIP too large', status: 400 };
      manifestText = buf.toString('utf8');
      continue;
    }
    if (path === 'data.json') {
      const buf = await file.buffer();
      totalSize += buf.length;
      if (totalSize > MAX_UNCOMPRESSED_BYTES) return { ok: false, error: 'ZIP too large', status: 400 };
      dataText = buf.toString('utf8');
      continue;
    }
    if (path.startsWith('assets/')) {
      fileEntries.push(file);
      continue;
    }
  }

  if (!manifestText || !dataText) {
    return { ok: false, error: 'ZIP must contain manifest.json and data.json', status: 400 };
  }

  let manifest;
  try {
    manifest = JSON.parse(manifestText);
  } catch {
    return { ok: false, error: 'Invalid manifest.json', status: 400 };
  }
  if (manifest.app !== 'graduation-memories' || manifest.version !== BACKUP_FORMAT_VERSION) {
    return {
      ok: false,
      error: `Unsupported backup (app/version). Expected version ${BACKUP_FORMAT_VERSION}.`,
      status: 400,
    };
  }

  let data;
  try {
    data = JSON.parse(dataText);
  } catch {
    return { ok: false, error: 'Invalid data.json', status: 400 };
  }

  const scope = manifest.scope === 'page' ? 'page' : 'full';

  if (scope === 'full') {
    if (!options.confirmFull) {
      return { ok: false, error: 'Full restore requires confirm: RESTORE', status: 400 };
    }
    return runFullImport(data, fileEntries, assetsRoot, directory, totalSize);
  }

  const rawPageId = manifest.pageId;
  if (!rawPageId || typeof rawPageId !== 'string') {
    return { ok: false, error: 'Page backup missing pageId in manifest', status: 400 };
  }
  const pageId = rawPageId.trim();
  if (!isValidBackupPageId(pageId)) {
    return {
      ok: false,
      error: 'Invalid pageId in manifest (must be 3–20 letters, numbers, or hyphens only)',
      status: 400,
    };
  }
  return runPageImport(data, pageId, fileEntries, assetsRoot, directory, totalSize);
}

async function runFullImport(data, fileEntries, assetsRoot, _directory, initialTotal) {
  const required = ['users', 'pages', 'page_labels', 'posts_content', 'footer_config', 'page_assignments', 'tokens'];
  for (const t of required) {
    if (!Array.isArray(data[t])) {
      return { ok: false, error: `data.json missing array: ${t}`, status: 400 };
    }
  }
  if (data.footer_config.length !== 1) {
    return { ok: false, error: 'Full backup must include exactly one footer_config row', status: 400 };
  }

  const tempAssets = join(tmpdir(), `gm-restore-assets-${randomBytes(8).toString('hex')}`);
  mkdirSync(tempAssets, { recursive: true });

  try {
    let totalSize = initialTotal;
    for (const file of fileEntries) {
      if (file.type === 'Directory') continue;
      const rel = file.path.replace(/\\/g, '/');
      if (rel.endsWith('/')) continue;
      if (!rel.startsWith('assets/')) continue;
      const rest = rel.slice('assets/'.length);
      if (!rest || rest.endsWith('/') || rest.includes('..')) continue;
      if (!isSafeZipPath(rel)) continue;
      const buf = await file.buffer();
      totalSize += buf.length;
      if (totalSize > MAX_UNCOMPRESSED_BYTES) {
        rmSync(tempAssets, { recursive: true, force: true });
        return { ok: false, error: 'ZIP uncompressed size too large', status: 400 };
      }
      const dest = join(tempAssets, rest);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, buf);
    }

    const run = db.transaction(() => {
      db.exec('PRAGMA foreign_keys = OFF');
      db.prepare('DELETE FROM tokens').run();
      db.prepare('DELETE FROM page_assignments').run();
      db.prepare('DELETE FROM posts_content').run();
      db.prepare('DELETE FROM page_labels').run();
      db.prepare('DELETE FROM pages').run();
      db.prepare('DELETE FROM users').run();
      db.prepare('DELETE FROM footer_config').run();

      insertRows('users', data.users);
      insertRows('pages', data.pages);
      insertRows('page_labels', data.page_labels);
      insertRows('posts_content', data.posts_content);
      insertRows('footer_config', data.footer_config);
      insertRows('page_assignments', data.page_assignments);
      insertRows('tokens', data.tokens);

      db.exec('PRAGMA foreign_keys = ON');
    });
    run();

    syncAutoIncrement('users');
    syncAutoIncrement('tokens');

    const backupPrev = `${assetsRoot}.bak-restore-${randomBytes(4).toString('hex')}`;
    if (existsSync(assetsRoot)) {
      try {
        renameSync(assetsRoot, backupPrev);
      } catch (e) {
        rmSync(tempAssets, { recursive: true, force: true });
        throw e;
      }
    }
    mkdirSync(assetsRoot, { recursive: true });
    try {
      if (existsSync(tempAssets)) {
        const children = readdirSync(tempAssets);
        for (const name of children) {
          const src = join(tempAssets, name);
          const dest = join(assetsRoot, name);
          cpRecursive(src, dest);
        }
      }
      if (existsSync(backupPrev)) {
        rmSync(backupPrev, { recursive: true, force: true });
      }
    } catch (e) {
      rmSync(assetsRoot, { recursive: true, force: true });
      if (existsSync(backupPrev)) {
        try {
          renameSync(backupPrev, assetsRoot);
        } catch (_) {
          /* best effort */
        }
      }
      throw e;
    }
  } catch (e) {
    rmSync(tempAssets, { recursive: true, force: true });
    console.error('Full import error:', e);
    return { ok: false, error: e.message || 'Import failed', status: 500 };
  }

  rmSync(tempAssets, { recursive: true, force: true });
  return { ok: true };
}

function cpRecursive(src, dest) {
  const st = statSync(src);
  if (st.isDirectory()) {
    mkdirSync(dest, { recursive: true });
    for (const name of readdirSync(src)) {
      cpRecursive(join(src, name), join(dest, name));
    }
  } else {
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(src, dest);
  }
}

const ALLOWED_TABLES = new Set(TABLES_FULL);

function getTableColumnNames(table) {
  if (!ALLOWED_TABLES.has(table)) throw new Error(`Invalid table: ${table}`);
  const qt = quoteIdent(table);
  return db.prepare(`PRAGMA table_info(${qt})`).all().map((c) => c.name);
}

function insertRows(table, rows) {
  if (!rows.length) return;
  const schemaCols = getTableColumnNames(table);
  const placeholders = schemaCols.map(() => '?').join(', ');
  const qCols = schemaCols.map((c) => quoteIdent(c)).join(', ');
  const sql = `INSERT INTO ${quoteIdent(table)} (${qCols}) VALUES (${placeholders})`;
  const stmt = db.prepare(sql);
  for (const row of rows) {
    stmt.run(
      schemaCols.map((c) =>
        Object.prototype.hasOwnProperty.call(row, c) && row[c] !== undefined ? row[c] : null
      )
    );
  }
}

/** Insert rows omitting listed columns (e.g. `id` for new token rows on page import). */
function insertRowsOmitting(table, rows, omit) {
  if (!rows.length) return;
  const omitSet = new Set(omit);
  const schemaCols = getTableColumnNames(table).filter((c) => !omitSet.has(c));
  const placeholders = schemaCols.map(() => '?').join(', ');
  const qCols = schemaCols.map((c) => quoteIdent(c)).join(', ');
  const sql = `INSERT INTO ${quoteIdent(table)} (${qCols}) VALUES (${placeholders})`;
  const stmt = db.prepare(sql);
  for (const row of rows) {
    stmt.run(
      schemaCols.map((c) =>
        Object.prototype.hasOwnProperty.call(row, c) && row[c] !== undefined ? row[c] : null
      )
    );
  }
}

function syncAutoIncrement(table) {
  try {
    const max = db.prepare(`SELECT MAX(${quoteIdent('id')}) AS m FROM ${quoteIdent(table)}`).get();
    const m = max?.m ?? 0;
    const row = db.prepare('SELECT seq FROM sqlite_sequence WHERE name = ?').get(table);
    if (row) {
      db.prepare('UPDATE sqlite_sequence SET seq = ? WHERE name = ?').run(Math.max(m, row.seq || 0), table);
    } else if (m > 0) {
      db.prepare('INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)').run(table, m);
    }
  } catch (_) {
    /* sqlite_sequence may not exist for non-AUTOINCREMENT tables */
  }
}

async function runPageImport(data, pageId, fileEntries, assetsRoot, _directory, initialTotal) {
  const need = ['pages', 'page_labels', 'posts_content', 'page_assignments', 'tokens'];
  for (const k of need) {
    if (!Array.isArray(data[k])) {
      return { ok: false, error: `data.json missing array: ${k}`, status: 400 };
    }
  }
  if (data.pages.length !== 1 || data.pages[0].id !== pageId) {
    return { ok: false, error: 'Page backup data mismatch', status: 400 };
  }
  if (data.posts_content.length > 1) {
    return { ok: false, error: 'Page backup must have at most one posts_content row', status: 400 };
  }

  const tempAssets = join(tmpdir(), `gm-restore-page-${randomBytes(8).toString('hex')}`);
  mkdirSync(tempAssets, { recursive: true });

  try {
    let totalSize = initialTotal;
    for (const file of fileEntries) {
      if (file.type === 'Directory') continue;
      const rel = file.path.replace(/\\/g, '/');
      if (rel.endsWith('/')) continue;
      if (!rel.startsWith('assets/')) continue;
      const rest = rel.slice('assets/'.length);
      if (!rest || rest.endsWith('/') || rest.includes('..')) continue;
      if (!isSafeZipPath(rel)) continue;
      if (!rest.startsWith(`${pageId}/`) && rest !== pageId) {
        continue;
      }
      const buf = await file.buffer();
      totalSize += buf.length;
      if (totalSize > MAX_UNCOMPRESSED_BYTES) {
        rmSync(tempAssets, { recursive: true, force: true });
        return { ok: false, error: 'ZIP uncompressed size too large', status: 400 };
      }
      const dest = join(tempAssets, rest);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, buf);
    }

    const userIds = new Set(db.prepare('SELECT id FROM users').all().map((r) => r.id));

    const run = db.transaction(() => {
      db.exec('PRAGMA foreign_keys = OFF');
      db.prepare('DELETE FROM tokens WHERE page_id = ?').run(pageId);
      db.prepare('DELETE FROM page_assignments WHERE page_id = ?').run(pageId);
      db.prepare('DELETE FROM posts_content WHERE page_id = ?').run(pageId);
      db.prepare('DELETE FROM page_labels WHERE page_id = ?').run(pageId);
      db.prepare('DELETE FROM pages WHERE id = ?').run(pageId);

      insertRows('pages', data.pages);
      if (data.page_labels.length) insertRows('page_labels', data.page_labels);
      if (data.posts_content.length) insertRows('posts_content', data.posts_content);

      const assignments = data.page_assignments
        .filter((a) => userIds.has(a.user_id))
        .map((a) => ({ ...a, page_id: pageId }));
      if (assignments.length) insertRows('page_assignments', assignments);

      const tokens = data.tokens.map((t) => ({
        ...t,
        page_id: pageId,
        user_id: t.user_id != null && userIds.has(t.user_id) ? t.user_id : null,
      }));
      if (tokens.length) insertRowsOmitting('tokens', tokens, ['id']);

      db.exec('PRAGMA foreign_keys = ON');
    });
    run();

    syncAutoIncrement('tokens');

    const pageTempDir = join(tempAssets, pageId);
    const pageDestDir = join(assetsRoot, pageId);
    if (existsSync(pageTempDir) && statSync(pageTempDir).isDirectory()) {
      if (existsSync(pageDestDir)) {
        rmSync(pageDestDir, { recursive: true, force: true });
      }
      mkdirSync(assetsRoot, { recursive: true });
      cpRecursive(pageTempDir, pageDestDir);
    }
  } catch (e) {
    rmSync(tempAssets, { recursive: true, force: true });
    console.error('Page import error:', e);
    return { ok: false, error: e.message || 'Import failed', status: 500 };
  }

  rmSync(tempAssets, { recursive: true, force: true });
  return { ok: true };
}
