# Deployment: gradmemories.lexserver.org

## Architecture

- **Frontend:** React SPA (served by Node)
- **Backend:** Node.js/Express with SQLite
- **Auth:** Token in URL for pages; JWT for admin

## Docker deployment (recommended)

```bash
docker compose up -d --build
```

Exposes the app on port 8084.

**Before going live:**

1. Set `JWT_SECRET` in `.env` (or as env var):
   ```bash
   JWT_SECRET=your-random-secret-here
   ```
2. Change the default admin password (`admin@gradmemories.local` / `admin123`) in the CMS after first login.

SQLite data and uploaded assets (images, audio) persist in the `graduationmemories-data` volume. Assets are stored in `/data/assets/{pageId}/` and served at `/assets/`.

### Backup and restore

In the CMS (**Admin → Backup**), you can download a ZIP (`manifest.json`, `data.json`, and `assets/…`) to copy a site between environments. **Full restore** wipes the current database and asset tree and replaces them—confirm with the exact text `RESTORE`. **Page backup** merge-imports a single page without clearing users or footer.

- Use HTTPS in production; backup files contain password hashes and NFC tokens.
- After a **full** restore, log in again with a user from the backup (existing JWTs may be invalid).
- Server dependencies include `archiver` and `unzipper` (see `server/package.json`).

## Manual deployment

1. Build frontend: `npm run build`
2. Install server deps: `cd server && npm ci`
3. Run server: `node server/index.js` (from project root)
4. Server serves `dist/` and handles `/api` routes. Default port 3001 (or set `PORT`).
5. Uploaded images go to `public/assets/`; ensure this directory is writable and persisted.

## NFC URLs

Each NFC card stores a full URL with token, e.g.:

```
https://gradmemories.lexserver.org/h322x?t=YOUR_TOKEN_HERE
```

Create tokens in Admin > Tokens. Default admin: `admin@gradmemories.local` / `admin123` (change after first login).

## Subdomain

Point `gradmemories.lexserver.org` to your server. Use a reverse proxy (Nginx) to forward to port 3000/8084 if needed.

