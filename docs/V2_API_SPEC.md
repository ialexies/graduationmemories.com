# CMS V2 API Specification

## Base

- Prefix: `/api/v2`
- Auth: Bearer JWT for all `/api/v2/*` routes except public read endpoint
- Content type: `application/json` unless stated otherwise

## Error Format

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {}
}
```

## Endpoints (MVP)

## `GET /api/v2/pages`

List pages visible to current user.

Response:

```json
{
  "pages": [
    {
      "id": "p_001",
      "slug": "landing-01",
      "title": "Landing 01",
      "status": "draft",
      "updatedAt": "2026-03-24T01:22:00Z"
    }
  ]
}
```

## `POST /api/v2/pages`

Create V2 page.

Request:

```json
{
  "slug": "landing-01",
  "title": "Landing 01",
  "themeId": "theme_blue"
}
```

## `GET /api/v2/pages/:id`

Get page metadata + latest draft version summary.

## `PUT /api/v2/pages/:id/draft`

Save draft snapshot.

Request:

```json
{
  "labels": {
    "headerTitleLabel": "Event"
  },
  "blocks": [
    {
      "id": "blk_header_01",
      "type": "header",
      "visibility": true,
      "props": {
        "title": "My Event",
        "subtitle": "Welcome"
      }
    }
  ],
  "meta": {
    "migrationVersion": 1
  }
}
```

Response:

```json
{
  "ok": true,
  "pageId": "p_001",
  "versionNo": 3,
  "savedAt": "2026-03-24T02:00:00Z"
}
```

## `POST /api/v2/pages/:id/publish`

Publish latest draft as live version.

Response:

```json
{
  "ok": true,
  "pageId": "p_001",
  "publishedVersionNo": 3,
  "publishedAt": "2026-03-24T02:05:00Z"
}
```

## `GET /api/v2/public/:slug`

Public read endpoint for published page.
No JWT required.

Response:

```json
{
  "page": {
    "slug": "landing-01",
    "title": "Landing 01",
    "theme": { "preset": "blue" }
  },
  "labels": {},
  "blocks": []
}
```

## `POST /api/v2/migration/preview/:legacyPageId`

Generate deterministic V2 payload from legacy data without DB write.

Response:

```json
{
  "ok": true,
  "sourcePageId": "h322x",
  "result": {
    "page": {},
    "blocks": [],
    "versionMeta": {
      "source": "legacy-migration",
      "migrationVersion": 1
    }
  }
}
```

## `POST /api/v2/pages/:id/blocks`

Append a block to the latest draft content.

Request:

```json
{
  "id": "blk_cta_03",
  "type": "cta",
  "visibility": true,
  "props": {
    "label": "Get started",
    "href": "https://example.com"
  }
}
```

## `PATCH /api/v2/pages/:id/blocks/:blockId`

Patch block fields in latest draft content (merges `props`).

Request:

```json
{
  "visibility": true,
  "props": {
    "label": "Book now"
  }
}
```

## `DELETE /api/v2/pages/:id/blocks/:blockId`

Remove a block from the latest draft content.

## Authorization Expectations

- Admin:
  - Full access to V2 CRUD, publish, migration preview.
- Editor:
  - Read/edit assigned pages.
  - Publish permission configurable (default: Admin only recommended).

## Validation Rules (Minimum)

- `slug`: lowercase letters, numbers, hyphen, 3-64 chars.
- `title`: 1-120 chars.
- `blocks[].type`: must exist in block registry.
- `blocks[].props`: must pass block schema validator.
- max blocks per page: configurable safeguard (recommended 200).

## Implemented Notes

- Current V2 editor route: `/admin/v2/pages` and `/admin/v2/pages/:id`.
- Current public V2 route: `/v2/:slug`.
- Current editor supports:
  - drag-and-drop block reorder
  - block add/remove
  - JSON inspector editing
  - device preview toolbar (desktop/tablet/mobile/custom)
  - width input + drag-resize handle
  - ruler showing active preview width scale
