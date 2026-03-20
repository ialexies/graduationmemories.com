# CMS User Guide

Guide for admins and editors using the Graduation Memories CMS.

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
3. Fill in or update:
   - **Section & basic info**: Section name, batch, location, quote
   - **Images**: Class photo path, gallery image paths (one per line)
   - **Teacher**: Name, title, photo path, message
   - **Students**: Add/remove students; optionally check **Honor**
   - **Together since**: e.g. "June 2025"
4. Click **Save**

Image paths should be like `/assets/h322x/class-photo.jpg`. Upload images via FTP or your existing process, then paste the path into the CMS.

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
