# CMS V2 Overview

## Purpose

CMS V2 turns the project into a general-purpose page builder instead of a graduation-specific system. The new model is block-based, reusable, and template-driven while keeping legacy pages running during migration.

## Goals

- Support general page creation (not only graduation pages).
- Replace rigid legacy content schema with reusable blocks.
- Keep rollout safe by building V2 in parallel with current architecture.
- Preserve existing auth, tokens, uploads, and backup capabilities.
- Enable draft/publish flow for controlled content release.

## MVP Scope

- Header block
- Rich text block
- People list block
- Image grid block
- CTA block
- Footer block
- Theme/style presets
- Draft/Publish workflow
- Admin/Editor roles

## Non-Goals (Initial V2)

- Full WordPress plugin/theme ecosystem
- Multi-tenant organization-level permissions
- Real-time collaborative editing
- Full legacy removal in first release

## Rollout Strategy

1. Build V2 in parallel (`/api/v2/*`, new admin screens, new renderer).
2. Keep legacy routes and data active for current pages.
3. Add migration preview/generation from legacy to V2 blocks.
4. Pilot migration on a few pages.
5. Make V2 default for new pages after parity checks.
6. Retire legacy only after stability window.

## Related Documents

- [V2_ARCHITECTURE.md](./V2_ARCHITECTURE.md)
- [V2_DATA_MODEL.md](./V2_DATA_MODEL.md)
- [V2_API_SPEC.md](./V2_API_SPEC.md)
- [V2_MIGRATION.md](./V2_MIGRATION.md)
- [V2_IMPLEMENTATION_PLAN.md](./V2_IMPLEMENTATION_PLAN.md)
