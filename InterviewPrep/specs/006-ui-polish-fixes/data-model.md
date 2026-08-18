# Phase 1 Data Model: Study Surface UI Polish

None of these five fixes add, remove, or reshape a persisted entity or an item schema field. This
document records the entities the spec names in its **Key Entities** section, narrowed to what
actually changes about each one, plus the one new in-memory-only value introduced for rendering.

## Theme preference

- **Storage**: `localStorage`, under `Store.getSettings().theme` (`aip.v1.settings` — a UI-settings
  bucket, not the `aip.v1.progress`/`.session`/`.plan`/`.mockResults` learning-state families).
- **Before**: `'dark' | 'light' | 'auto'`, default `'auto'`.
- **After**: `'dark' | 'light'` only. `'auto'` is no longer a value any code path writes — not the
  toggle button, not the Settings dropdown. A first-ever boot with no stored value resolves once
  via `matchMedia('(prefers-color-scheme: dark)')` and persists the resolution as an explicit
  `'dark'`/`'light'`, per `research.md` §1. If `matchMedia` is unavailable, the resolution defaults
  to `'dark'` and persists that fallback the same way.
- **Validation rule**: any settings read that encounters a legacy stored `'auto'` (from a session
  before this fix shipped) is treated as "no explicit choice yet" and re-resolved via the same
  first-boot rule, then persisted as `'dark'`/`'light'` — this keeps a candidate who upgraded mid-
  session from getting stuck displaying a value neither control can produce anymore.
- **Relationships**: none — read only by `app.js#applyTheme()`/`#initTheme()` and
  `views/settings.js`.

## Item `level` (reused, unchanged)

- **Storage**: content pack JSON, field `level`, integer `1`–`4`.
- **Change**: none to the field itself, its schema, or its values in any pack. The only change is
  that `views/topics.js` now sorts by this existing field before rendering the per-category list
  (previously: disk/pack order). Label mapping is unchanged (`assets/js/levels.js`:
  `1` Basics, `2` Mid-Level, `3` Senior, `4` Lead).
- **Sort key contract**: ascending numeric `level`, ties broken by original (pre-sort) relative
  order — i.e. a stable sort, no secondary key.

## Release-change signals — `addedIn` / `updatedIn` (reused, unchanged)

- **Storage**: content pack JSON, fields `addedIn` / `updatedIn`, each a manifest version string or
  absent.
- **Change**: none to storage, meaning, or the sync/diff logic in `content.js` that reads them, and
  none to the `state.status === 'new-content'` filter in `topics.js` that includes an item when
  either field equals the current snapshot version. The only change is display: the `UPD` badge
  that read `updatedIn === snapshot.version` is deleted from `topics.js`'s render. The `NEW` badge
  (`addedIn === snapshot.version`) is untouched.

## Sentence unit (new — render-time only, never persisted)

A value introduced purely inside `md.js` for this feature; it is not a stored entity and never
reaches a content file or `localStorage`.

- **Shape**: an ordered array of strings, each one sentence of an input `q` or `prompt` value, in
  original left-to-right order, with backtick code spans intact (protected during splitting, then
  restored — see `research.md` §3).
- **Produced by**: a new `md.js` splitting helper, consumed only inside the render path of
  `item.js`, `drill.js`, `mock.js`, `design.js`, `dsa.js` (for `q`) and `renderMarkdown`'s paragraph
  path (for `prompt`).
- **Cardinality**: exactly one element for any single-sentence input (FR-009) — the common case
  across the ~629-item library remains a one-element array, rendering identically to today.
- **Invariant**: concatenating the array's sentences (trimmed, rejoined with a single space)
  reproduces the original text with no characters added, removed, or reordered — the helper only
  decides *where* to introduce a visual break, never rewrites content (FR-008).
