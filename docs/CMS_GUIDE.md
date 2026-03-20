# CMS User Guide

Guide for admins and editors using the Graduation Memories CMS. The app supports multiple page types (graduation, wedding, event) so you can use it for class memories, wedding souvenirs, reunions, and more.

## Features

- **Page types** — Graduation, Wedding, or Event (changes labels)
- **Color themes** — Per-page themes: Default, Blue, Green, Rose, Amber, Indigo
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

Editors only see pages that an admin has assigned to them.

---

## Editing page content

1. Go to **Content** in the navigation
2. Click **Edit content** next to the page you want to edit
3. **Page type** (optional): Choose Graduation, Wedding, or Event. This changes the labels shown on the public page (e.g. "Section" vs "Event", "Students" vs "Guests").
4. **Color theme** (optional): Choose Default, Blue, Green, Rose, Amber, or Indigo. Each option shows a preview swatch. The theme affects the hero gradient, section cards, and accents on the public page.
5. **Visible sections** (optional): Uncheck any section to hide it on the public page. Disabled sections are also hidden in the editor to avoid editing content that won’t appear. Sections you can toggle:
   - **Class/cover photo** — main photo with batch and location
   - **Image gallery** — slider of additional images
   - **Message block** — teacher/couple/host message
   - **People list** — students or guests with optional Honor/VIP
   - Click **Save page settings** to apply, or **Save** at the bottom to save content and settings together.
6. **Custom labels** (optional): Click "Custom labels..." to override any label (theme, title, people list heading, etc.) for this page. Leave blank to use defaults for the selected type.
7. Fill in or update the content fields shown. Re-enable a section in step 5 to edit it again.
   - **Section & basic info**: Section/event name, batch/date (when class photo enabled), location (when class photo enabled), quote
   - **Images** (when enabled): Upload class photo and gallery images; use Remove to delete. Supported: JPEG, PNG, GIF, WebP (max 10MB).
   - **Teacher/Author** (when message block enabled): Name, title, photo, message (works for graduation teacher, wedding couple, or event host)
   - **Students/Guests** (when people list enabled): Add/remove people; optionally check Honor/VIP
   - **Together since**: e.g. "June 2025"
8. Click **Save** to save content and page settings, or **Save page settings** to save only type, labels, and visible sections.

**Images**: Upload only — no paths to type. Click **Upload photo** (class/teacher) or **Upload images** (gallery) to choose files. Use **Replace** to change an image or **Remove** to delete it. Files are stored under `/assets/{pageId}/`. Supported: JPEG, PNG, GIF, WebP (max 10MB per file).

---

## Editing the footer

1. Go to **Footer** in the navigation
2. Update shop name, tagline, location, link URL, and logo path
3. Click **Save**

The footer appears on all class pages.

---

## Admin-only tasks

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

