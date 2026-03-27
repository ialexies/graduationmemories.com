# Developer Guide

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
```

## Environment variables

Create a `.env` in the project root (optional):

- `PORT` — API server port (default: 3001)
- `JWT_SECRET` — Secret for JWT signing (set in production)
- `DB_PATH` — Path to SQLite database (default: `server/data.db`)

## Running

```bash
# Frontend dev server (port 5173)
npm run dev

# API server (port 3001)
npm run dev:server
```

Run both in separate terminals for full-stack development.

## Build & production

```bash
npm run build
npm start
```

The built frontend is served from `dist/` by the Express server.

---

## Architecture

### Folder structure

```
├── public/
│   ├── assets/          # Images by page (e.g. h322x/, 33410/)
│   └── data/
│       └── posts.json   # Seed data (migrated to DB on first run)
├── server/
│   ├── db.js            # SQLite schema, migrations, helpers
│   ├── index.js         # Express app, API routes
│   └── middleware/
│       └── auth.js      # JWT auth, requireAdmin, requirePageAccess
├── src/
│   ├── contexts/        # AuthContext
│   ├── hooks/           # usePost
│   ├── lib/             # apiFetch
│   ├── pages/           # PostPage, admin pages
│   └── components/      # HeroSection, Footer, etc.
└── docs/
```

### Database schema

- **users** — email, password_hash, name, role (admin/editor)
- **pages** — id, enabled, type (graduation/wedding/event/birthday/anniversary/reunion/retirement/babyShower/farewell/engagement)
- **page_labels** — per-page label overrides (theme, title, people, message, etc.)
- **tokens** — token, page_id, user_id
- **page_assignments** — user_id, page_id (for editor scope)
- **posts_content** — page content (section, batch, gallery, teacher, students, etc.)
- **footer_config** — single-row footer (shop name, tagline, logo, etc.)
- **v2_pages** — V2 page metadata (slug, status, theme, publish pointer)
- **v2_page_versions** — immutable draft/published content snapshots (`content_json`)
- **v2_themes** — V2 theme token payloads
- **v2_page_assignments** — editor scope for V2 pages

Content is seeded from `public/data/posts.json` on first run.

### Auth flow

1. Login returns JWT with `{ id, email, role }`
2. `Authorization: Bearer <token>` required for `/api/admin/*`
3. `requireAdmin` — 403 if role !== admin
4. `requirePageAccess` — 403 if not admin and not assigned to the page

### V2 routes (implemented)

- Admin:
  - `/admin/v2/pages`
  - `/admin/v2/pages/:id`
- Public:
  - `/v2/:slug`

### V2 API (implemented)

- `GET /api/v2/public/:slug` (no auth)
- `GET /api/v2/pages`
- `POST /api/v2/pages`
- `GET /api/v2/pages/:id`
- `PUT /api/v2/pages/:id/draft`
- `POST /api/v2/pages/:id/publish`
- `POST /api/v2/pages/:id/blocks`
- `PATCH /api/v2/pages/:id/blocks/:blockId`
- `DELETE /api/v2/pages/:id/blocks/:blockId`
- `POST /api/v2/migration/preview/:legacyPageId`

### V2 editor capabilities (current)

- Block add/remove
- Drag-and-drop block reorder
- JSON props inspector
- Device-style preview modes (desktop/tablet/mobile/custom)
- Pixel width input + drag-resize handle
- Ruler scale synced to active preview width

---

## Deployment

1. Set `JWT_SECRET` and `DB_PATH` in production
2. Run `npm run build`
3. Run `npm start` (or use a process manager like PM2)
4. Serve behind a reverse proxy (nginx, Caddy) with HTTPS
