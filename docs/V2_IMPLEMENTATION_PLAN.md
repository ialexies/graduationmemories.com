# CMS V2 Implementation Plan

## Phase 1 (Foundation, 1 Week)

## Day 1: Contracts

- Decide storage mode:
  - versions-only JSON, or normalized blocks + versions
- Finalize enums:
  - `PageStatus`, `BlockType`
- Freeze block schemas and validation rules.

## Day 2: Database

- Add V2 migrations in backend startup.
- Create `v2_pages`, `v2_page_versions`, `v2_themes` (and optional `v2_blocks`).
- Add indexes and one default seed.

## Day 3: V2 CRUD API

- Implement:
  - `POST /api/v2/pages`
  - `GET /api/v2/pages`
  - `GET /api/v2/pages/:id`
  - `PUT /api/v2/pages/:id/draft`
- Reuse auth and role middleware.

## Day 4: Publish + Public Read

- Implement:
  - `POST /api/v2/pages/:id/publish`
  - `GET /api/v2/public/:slug`
- Enforce "public sees published only".

## Day 5: Legacy Adapter

- Implement deterministic migration preview:
  - `POST /api/v2/migration/preview/:legacyPageId`
- No write to legacy tables.

## Day 6: Testing + Pilot Gate

- Integration tests for:
  - validation
  - permissions
  - draft/publish
  - migration determinism
- Manual parity checks on pilot pages.

## Day 7: Hardening

- Fix defects.
- Add logging/telemetry.
- Freeze contracts for Phase 2.

## Phase 2 (Frontend V2 Shell)

- Add V2 page renderer with block registry.
- Add V2 admin editor shell:
  - block canvas
  - inspector
  - theme panel
  - publish controls

## Phase 3 (Block Editors + UX)

- Build individual block forms.
- Add reorder/duplicate/delete flows.
- Add validation feedback in UI.

## Phase 4 (Migration Write Mode + Cutover)

- Enable migration write mode for selected pages.
- Make V2 default for new pages.
- Keep legacy read path until retirement window closes.

## Done Criteria

- V2 draft/publish works end-to-end.
- Renderer supports MVP block set.
- Legacy pages continue working unchanged.
- At least one migrated page in production pilot without rollback.
