# CMS V2 Migration Guide

## Goal

Migrate legacy page data (`posts_content`, `page_labels`, `footer_config`) to generic V2 blocks without breaking existing pages.

## Migration Mode

- Initial mode: read-only preview generation.
- Write mode starts after parity validation on pilot pages.

## Deterministic Mapping Rules

- `section_name` -> `header.title`
- `quote` -> `header.subtitle`
- `batch` -> `header.metaLeft`
- `location` -> `header.metaRight`
- `class_photo` -> `image.src`
- `gallery[]` -> `imageGrid.images[]`
- `teacher_message` -> `richText.content`
- `teacher_name` -> `authorCard.name`
- `teacher_title` -> `authorCard.role`
- `teacher_photo` -> `authorCard.photo`
- `teacher_audio` -> `audio.src`
- `teacher_audio_transcript` -> `audio.transcript`
- `students[]` -> `peopleList.items[]` (`honor` maps to `tag`)
- `together_since` -> `peopleList.footerText`
- `footer_config` -> `footer.props`
- `page_labels` -> `page.labels` dictionary
- `section_visibility` -> `block.visibility`
- `color_theme` -> `page.theme.preset`

## Migration Algorithm (Recommended)

1. Read legacy page (`posts_content`, `page_labels`, `footer_config`, `pages`).
2. Build in-memory V2 page object and ordered block list.
3. Set `visibility` using legacy section visibility.
4. Preserve existing HTML as-is for rich text.
5. Generate deterministic block IDs.
6. Validate output against V2 block schemas.
7. Return preview payload or write draft version (depending on mode).

## Deterministic Block ID Strategy

Use stable IDs to avoid drift on reruns:

- `blk_${type}_${index}` plus hash suffix from `pageId + type + keyProps`
- Example: `blk_people_01_a18f`

## Edge Case Handling

- Missing media path -> keep block, set empty `src`.
- Invalid JSON in legacy arrays -> fallback to empty arrays.
- Hidden legacy section -> output block with `visibility: false`.
- Empty labels -> use template defaults in runtime.
- Null author info -> keep `authorCard` with empty strings for editability.

## Pilot Plan

- Select 1-3 representative pages:
  - media-heavy page
  - text-heavy page
  - page with hidden sections
- Run migration preview and render through V2.
- Compare parity against legacy output.
- Approve before write-mode migration.

## Rollback Plan

- V2 is additive; legacy tables remain untouched.
- If issue found:
  - disable V2 route for affected page
  - keep serving legacy path
  - fix adapter and rerun

## Completion Criteria

- Migration preview passes schema validation.
- Visual parity acceptable for pilot pages.
- No legacy data corruption.
- Same input produces same output JSON.
