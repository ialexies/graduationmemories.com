# Changelog

## [Unreleased]

### Added

- CMS with page content and footer editing
- Editor role: edit content for assigned pages only
- Admin role: full access (pages, tokens, users, content, footer)
- `posts_content` and `footer_config` tables; content loaded from DB
- Page assignments for editors
- Role-based nav and route guards
- User creation with role (admin/editor)
- Documentation: API, CMS guide, developer guide
- Multi-use page types: graduation, wedding, event
- Configurable labels per page type (e.g. "Section" vs "Event", "Students" vs "Guests")
- `page_labels` table for per-page label overrides
- `pages.type` column; meta API (GET/PUT) for page type and labels

### Documentation

- Updated V2 CMS guide with latest editor UX: preview zoom, scrollable preview, click-to-select blocks, and image builder controls.
- Clarified current block deletion flow (inspector remove) and noted planned left-list quick delete action.
- Updated V2 API spec implemented notes to reflect current V2 inspector/preview/image behaviors.
