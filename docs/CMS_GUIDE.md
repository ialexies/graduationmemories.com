# CMS User Guide

Guide for admins and editors using the Graduation Memories CMS. The app supports multiple page types: graduation, wedding, event, birthday, anniversary, reunion, retirement, baby shower, farewell, and engagement.

## Features

- **Page types** — Graduation, Wedding, Event, Birthday, Anniversary, Reunion, Retirement, Baby shower, Farewell, Engagement (changes labels)
- **Color themes** — 50 per-page themes (Default plus Blue, Green, Rose, Navy, Cobalt, Mint, Sage, Coral, Gold, Plum, Lavender, Aqua, Charcoal, Ruby, Jade, Iris, Peach, Lilac, Steel, and more)
- **Visible sections** — Toggle class photo, gallery, message block, people list
- **Image upload** — Upload photos directly (no paths to type)
- **Custom labels** — Override default labels per page

## Login

1. Go to `/admin/login`
2. Enter your email and password
3. Click Login

Your role (Admin or Editor) determines what you can see and edit.

---

## Roles

| Capability | Admin | Editor |
|------------|-------|--------|
| Edit page content | All pages | Assigned pages only |
| Edit footer | Yes | Yes |
| Enable/disable pages | Yes | No |
| Manage tokens | Yes | No |
| Manage users | Yes | No |
| Create new pages | Yes | No |
| Backup & restore | Yes | No |

Editors only see pages that an admin has assigned to them.

### Backup (admins only)

Open **Backup** in the navigation to download a ZIP of all data and uploads, or export a single page. To restore: upload the ZIP. **Full site restore** requires typing `RESTORE` in the confirmation field and replaces everything—log in again afterward. **Page backup** restores merge one page only. Keep ZIP files private (passwords and tokens inside).

---

## Editing page content

1. Go to **Content** in the navigation
2. Click **Edit content** next to the page you want to edit
3. **Page type** (optional): Choose Graduation, Wedding, or Event. This changes the labels shown on the public page (e.g. "Section" vs "Event", "Students" vs "Guests").
4. **Color theme** (optional): Choose from 50 themes (Default plus Blue, Green, Rose, Navy, Cobalt, Mint, Coral, Gold, Plum, Lavender, and more). Each option shows a preview swatch. The theme affects the hero gradient, section cards, and accents on the public page.
5. **Visible sections** (optional): Uncheck any section to hide it on the public page. Disabled sections are also hidden in the editor to avoid editing content that won’t appear. Sections you can toggle:
   - **Class/cover photo** — main photo with batch and location
   - **Image gallery** — slider of additional images
   - **Message block** — teacher/couple/host message
   - **People list** — students or guests with optional Honor/VIP
   - **Student profile photos** — show profile photos next to names (enable to upload per-student images)
   - Click **Save page settings** to apply, or **Save** at the bottom to save content and settings together.
6. **Custom labels** (optional): Click "Custom labels..." to override any label (theme, title, people list heading, etc.) for this page. Leave blank to use defaults for the selected type.
7. Fill in or update the content fields shown. Re-enable a section in step 5 to edit it again.
   - **Section & basic info**: Section/event name, batch/date (when class photo enabled), location (when class photo enabled), quote
   - **Images** (when enabled): Upload class photo and gallery images; use Remove to delete. Supported: JPEG, PNG, GIF, WebP (max 10MB). Images are auto-resized and compressed.
   - **Teacher/Author** (when message block enabled): Name, title, photo, message (works for graduation teacher, wedding couple, or event host)
   - **Students/Guests** (when people list enabled): Add/remove people; optionally check Honor/VIP
   - **Together since**: e.g. "June 2025"
8. Click **Save** to save content and page settings, or **Save page settings** to save only type, labels, and visible sections.

**Images**: Upload only — no paths to type. Click **Upload photo** (class/teacher) or **Upload images** (gallery) to choose files. Use **Replace** to change an image or **Remove** to delete it. Files are stored under `/assets/{pageId}/`. Supported: JPEG, PNG, GIF, WebP (max 10MB per file). Images are automatically resized to max 2048px on the longest side and compressed for faster loading. Maximum resolution: 8000×8000 pixels.

---

## Editing the footer

1. Go to **Footer** in the navigation
2. Update shop name, tagline, location, link URL, and logo path
3. Click **Save**

The footer appears on all class pages.

---

## Admin-only tasks

### Creating new pages

1. Go to **Pages**
2. Click **Create new page**
3. Enter a **Page ID** (e.g. `batch2026` or `event-march`), or click **Auto-generate** for a random ID
4. Choose **Page type** (Event, Graduation, Wedding, Birthday, Anniversary, Reunion, Retirement, Baby shower, Farewell, or Engagement) — default is Event with general labels
5. Click **Create** — the page is created and assigned to you
6. Create a token in **Tokens** to share the page
7. Edit content in **Content** to add photos, messages, and guests

Page IDs must be 3–20 characters (letters, numbers, hyphens only).

### Enabling/disabling pages

1. Go to **Pages**
2. Click **Enable** or **Disable** for a page
3. Disabled pages cannot be accessed even with a valid token

### Managing tokens

1. Go to **Tokens**
2. **Create token**: Choose a page and optionally a user; a new token is generated
3. **Revoke**: Delete a token to invalidate it

### Managing users and assignments

1. Go to **Users**
2. **Create user**: Enter email, password, name, and **Role** (Admin or Editor)
3. **Assign page to user**: Select a user and page, then click Assign — this gives editors access to edit that page’s content

