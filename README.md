# Graduation Memories

NFC-based memory pages for graduations, weddings, and events. Visitors tap an NFC card to view a personalized page with photos, messages, and guest lists.

## Tech stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + SQLite
- **Auth:** Token in URL for public pages; JWT for admin CMS

## Quick start

```bash
npm install
cd server && npm install
npm run dev:server   # API on port 3001
npm run dev          # Vite on port 5173
```

1. Open http://localhost:5173/admin/login
2. Log in (default: `admin@gradmemories.local` / `admin123`)
3. Edit content, create tokens, and share NFC URLs

## Features

- **Page types** — Graduation, Wedding, Event
- **Per-page color themes** — Default, Blue, Green, Rose, Amber, Indigo
- **Section visibility** — Toggle class photo, gallery, message block, people list
- **Image upload** — Upload photos directly (no paths)
- **Custom labels** — Override labels per page
- **Admin / Editor roles** — Editors see only assigned pages

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (frontend) |
| `npm run dev:server` | Start API server |
| `npm run build` | Build for production |
| `npm run start` | Run production server |

## Documentation

- [CMS User Guide](docs/CMS_GUIDE.md) — How to use the admin interface
- [Deployment](DEPLOY.md) — Docker and manual deployment
