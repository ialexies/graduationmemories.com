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
- **[V2_OVERVIEW.md](./V2_OVERVIEW.md)** — V2 goals, scope, and rollout strategy
- **[V2_MASTER_SPEC.md](./V2_MASTER_SPEC.md)** — Consolidated all-in-one V2 specification for stakeholders
- **[V2_ARCHITECTURE.md](./V2_ARCHITECTURE.md)** — V2 system architecture and runtime design
- **[V2_DATA_MODEL.md](./V2_DATA_MODEL.md)** — Proposed V2 tables, schemas, and block contracts
- **[V2_CONTENT_MODEL.md](./V2_CONTENT_MODEL.md)** — Neutral vocabulary and reusable content semantics
- **[V2_API_SPEC.md](./V2_API_SPEC.md)** — V2 endpoint contracts and validation expectations
- **[V2_MIGRATION.md](./V2_MIGRATION.md)** — Legacy-to-V2 migration mapping and rollout safety
- **[V2_IMPLEMENTATION_PLAN.md](./V2_IMPLEMENTATION_PLAN.md)** — Phase-by-phase execution checklist
