# CMS V2 Data Model

## Objectives

- Remove graduation-specific schema coupling.
- Represent pages as reusable blocks.
- Support draft/publish with immutable versions.

## Proposed Tables

## `v2_pages`

- `id` (TEXT PK)
- `slug` (TEXT UNIQUE)
- `title` (TEXT)
- `status` (TEXT: `draft` | `published` | `archived`)
- `theme_id` (TEXT nullable)
- `published_version_id` (TEXT nullable)
- `created_at` (TEXT datetime)
- `updated_at` (TEXT datetime)
- `published_at` (TEXT datetime nullable)

## `v2_page_versions`

- `id` (TEXT PK)
- `page_id` (TEXT FK -> `v2_pages.id`)
- `version_no` (INTEGER)
- `content_json` (TEXT JSON)
- `created_by` (INTEGER FK -> `users.id`)
- `created_at` (TEXT datetime)
- `is_published` (INTEGER bool)

`content_json` shape:

```json
{
  "labels": {},
  "blocks": [],
  "meta": {}
}
```

## `v2_themes`

- `id` (TEXT PK)
- `name` (TEXT)
- `tokens_json` (TEXT JSON)
- `created_at` (TEXT datetime)
- `updated_at` (TEXT datetime)

## Optional `v2_blocks` (if normalized mode is chosen)

- `id` (TEXT PK)
- `page_id` (TEXT FK)
- `sort_order` (INTEGER)
- `type` (TEXT)
- `props_json` (TEXT JSON)
- `visibility` (INTEGER bool)
- `style_variant` (TEXT nullable)

Note: If using immutable snapshots as source-of-truth, `v2_blocks` is optional.

## Indexes

- `v2_pages_slug_idx` on `v2_pages(slug)`
- `v2_page_versions_page_version_idx` on `v2_page_versions(page_id, version_no DESC)`
- `v2_page_versions_page_created_idx` on `v2_page_versions(page_id, created_at DESC)`

## Legacy Compatibility

Keep existing tables unchanged:

- `posts_content`
- `page_labels`
- `pages`
- `tokens`
- `users`
- `page_assignments`
- `footer_config`

V2 is additive. No destructive migration in initial phases.

## Generic Block Props (Examples)

## Header

```json
{
  "title": "Welcome",
  "subtitle": "Build pages quickly",
  "metaLeft": "Left info",
  "metaRight": "Right info"
}
```

## People List

```json
{
  "items": [
    { "name": "Alex", "tag": "VIP", "avatar": "/assets/p1/alex.jpg" }
  ],
  "footerText": "Since 2024"
}
```

## Rich Text

```json
{
  "content": "<p>Hello world</p>"
}
```

## Theme Tokens Example

```json
{
  "colors": {
    "bg": "#f8fafc",
    "text": "#0f172a",
    "accent": "#3b82f6",
    "gradientStart": "#2563eb",
    "gradientEnd": "#1d4ed8"
  },
  "radius": {
    "card": "24px"
  },
  "typography": {
    "headingFamily": "serif",
    "bodyFamily": "sans-serif"
  }
}
```
