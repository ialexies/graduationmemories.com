# Graduation Memories

NFC-based graduation memories website. Each NFC card links to a class page (e.g. `/h322x?t=TOKEN`). Class pages display section info, photos, teacher message, and student list. Access is token-based.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, React Router
- **Backend**: Node.js, Express, SQLite (better-sqlite3)
- **Auth**: JWT for admin/editor login

## Quick Start

```bash
npm install
npm run dev          # Vite dev server (port 5173)
npm run dev:server   # API server (port 3001)
```

For full setup, see [DEVELOPER.md](./DEVELOPER.md).

## Documentation

- **[API.md](./API.md)** — API reference (endpoints, auth, errors)
- **[CMS_GUIDE.md](./CMS_GUIDE.md)** — CMS user guide for admins and editors
- **[DEVELOPER.md](./DEVELOPER.md)** — Dev setup, architecture, deployment
