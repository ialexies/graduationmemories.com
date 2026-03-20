# API Reference

## Authentication

### Admin login

- **POST** `/api/admin/login`
- **Body**: `{ email, password }`
- **Response**: `{ token, user: { id, email, name, role } }`
- **Status**: 200 on success; 400 if missing fields; 401 if invalid credentials

### Protected routes

All `/api/admin/*` routes (except login) require a JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

Or, for public page access, the token can be passed as a query parameter: `?t=TOKEN`.

---

## Public endpoints

### Get page content

- **GET** `/api/pages/:id?t=TOKEN`
- **Query**: `t` (required) — access token for the page
- **Response**: `{ post, footer }`
- **Status**: 200 on success; 401 if token invalid/missing; 403 if page disabled; 404 if page not found

---

## Admin endpoints

### Pages (content scope)

| Method | Endpoint | Who | Description |
|--------|----------|-----|-------------|
| GET | `/api/admin/pages` | Admin (all); Editor (assigned only) | List pages |
| GET | `/api/admin/pages/:id/content` | Admin; Editor (assigned only) | Get post content |
| PUT | `/api/admin/pages/:id/content` | Admin; Editor (assigned only) | Save post content |

### Footer

| Method | Endpoint | Who | Description |
|--------|----------|-----|-------------|
| GET | `/api/admin/footer` | Admin, Editor | Get footer config |
| PUT | `/api/admin/footer` | Admin, Editor | Save footer config |

### Admin-only

| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/admin/pages/:id` | Enable/disable page. Body: `{ enabled: boolean }` |
| GET | `/api/admin/tokens` | List tokens |
| POST | `/api/admin/tokens` | Create token. Body: `{ page_id, user_id? }` |
| DELETE | `/api/admin/tokens/:id` | Delete token |
| GET | `/api/admin/users` | List users |
| POST | `/api/admin/users` | Create user. Body: `{ email, password, name, role? }` — role: `admin` or `editor` |
| POST | `/api/admin/assign` | Assign page to user. Body: `{ user_id, page_id }` |

---

## Response shapes

### Post content (get/put)

```json
{
  "sectionName": "Malakas",
  "batch": "Batch 2025-2026",
  "location": "Hermosa, Bataan",
  "quote": "An investment in knowledge...",
  "classPhoto": "/assets/h322x/class-photo.jpg",
  "gallery": ["/assets/h322x/photos-slide/1.jpg", "..."],
  "teacherMessage": "...",
  "teacherName": "Teacher Cha",
  "teacherPhoto": "/assets/h322x/teacher.jpg",
  "teacherTitle": "Class Adviser",
  "students": [{ "name": "Abad, Juan P.", "honor": true }, "..."],
  "togetherSince": "June 2025"
}
```

### Footer

```json
{
  "linkUrl": "https://...",
  "logo": "/assets/logo.png",
  "shopName": "AC 3D PRINTS & CRAFTS",
  "tagline": "Digital Souvenir Edition",
  "location": "Tipo, Hermosa, Bataan"
}
```

---

## Error responses

- **400** — Bad request: `{ error: "message" }`
- **401** — Unauthorized (no/invalid token): `{ error: "message" }`
- **403** — Forbidden (insufficient role or page access): `{ error: "message" }`
- **404** — Not found: `{ error: "message" }`
