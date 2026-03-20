# Deployment: gradmemories.lexserver.org

## Architecture

- **Frontend:** React SPA (served by Node)
- **Backend:** Node.js/Express with SQLite
- **Auth:** Token in URL for pages; JWT for admin

## Docker deployment (recommended)

```bash
docker compose up -d --build
```

Exposes the app on port 8084. Set `JWT_SECRET` in `.env` for production:

```bash
JWT_SECRET=your-random-secret-here
```

SQLite data persists in the `graduationmemories-data` volume.

## Manual deployment

1. Build frontend: `npm run build`
2. Install server deps: `cd server && npm ci`
3. Run server: `node server/index.js` (from project root)
4. Server serves `dist/` and handles `/api` routes. Default port 3001 (or set `PORT`).

## NFC URLs

Each NFC card stores a full URL with token, e.g.:

```
https://gradmemories.lexserver.org/h322x?t=YOUR_TOKEN_HERE
```

Create tokens in Admin > Tokens. Default admin: `admin@gradmemories.local` / `admin123` (change after first login).

## Subdomain

Point `gradmemories.lexserver.org` to your server. Use a reverse proxy (Nginx) to forward to port 3000/8084 if needed.

