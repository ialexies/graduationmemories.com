# CMS V2 Content Model

## Why This Exists

Legacy content model uses domain-specific names tied to graduation use cases. V2 defines neutral content semantics so the same system works for events, business pages, portfolios, communities, and more.

## Neutral Vocabulary

- Use `author` instead of `teacher/couple/host`.
- Use `people` instead of `students/guests/class registry`.
- Use `group` instead of `class`.
- Use `meta` fields instead of hardcoded `batch/date/location` assumptions.

## Labels Strategy

- Labels are page data, not code constants.
- Store labels in `page.labels` dictionary.
- Templates provide default labels; page-level overrides are optional.

Example:

```json
{
  "labels": {
    "headerTitleLabel": "Event",
    "peopleListTitle": "Team Members",
    "peopleTagText": "Lead",
    "authorLabel": "Speaker"
  }
}
```

## Block Types and Purpose

- `header`: top visual/title/metadata
- `richText`: long-form or formatted text
- `image`: single focal visual
- `imageGrid`: list of images
- `authorCard`: person identity card
- `audio`: optional voice/media support
- `peopleList`: structured list with optional tags/avatars
- `cta`: action button/group
- `footer`: bottom site/page metadata

## Template vs Content

- Template defines defaults:
  - block starter layout
  - default labels
  - default theme preset
- Content defines instance-specific values.

Keep template keys generic:

- `templateKey = "generalLanding" | "eventPage" | "memoryPage" | "portfolioPage"`

Templates should never enforce domain-specific schema.

## Backward Compatibility Rule

When migrating legacy pages:

- Preserve original text exactly where possible.
- Map legacy domain words into labels, not into structural schema.
- Keep future edits unconstrained by legacy wording.
