# V2 CMS operations

## Deploy and fresh admin bundles

The production server serves the built SPA from `dist/` (see `server/index.js`). After pulling changes or editing the admin UI:

1. Run `npm run build` at the project root (generates `dist/`).
2. Restart the Node process that runs `server/index.js` (or `npm run start`).

If you only restart the server without rebuilding, browsers may load an older cached `index.html` and JS bundle. Use a hard refresh after deploy.

## API process and port

- Default API port is **3001** (`PORT` env overrides).
- If `EADDRINUSE` appears, another process is bound to that port; stop it or choose another `PORT`.

## V2 endpoints (reference)

- Authenticated: `PATCH /api/v2/pages/:id` — update DB title/slug (slug change records a redirect from the old slug).
- Authenticated: `GET /api/v2/pages/:id/export.json` — full page JSON export.
- Authenticated (admin page media): `POST /api/admin/pages/:id/upload` — image upload endpoint used by V2 inspector upload controls.
- Public: `GET /api/v2/sitemap.xml` — published V2 pages.
- Public: `GET /api/v2/rss.xml` — simple RSS for published V2 pages.

## Backups

Use **Admin → Backup** to download a ZIP of the database and uploaded assets. Restoring replaces DB data; keep copies before major migrations.

## Structured logs

V2 actions emit single-line JSON logs to stdout (draft save, publish, slug change, publish blocked by lint). Ship logs to your host’s log aggregator for production debugging.

## Publish audit trail

Successful publishes append a row to `v2_audit_log` (action `publish`, JSON detail includes version number and lint warning count). Scheduled publishing is not implemented yet; use manual publish or add a worker later.
