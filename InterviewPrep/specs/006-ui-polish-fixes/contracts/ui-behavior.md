# UI Behavior Contracts: Study Surface UI Polish

This app has no external API, CLI, or wire format — its only "interface" is the rendered page and
the small set of persisted values behind it. These are the observable contracts each fix must hold,
for whoever implements or verifies the tasks in `tasks.md`.

## C1 — Theme control

- **Persisted values**: `Store.getSettings().theme` MUST only ever be read or written as `'dark'`
  or `'light'` by any app code path, going forward. No path may write `'auto'`.
- **Toggle button** (`#theme-toggle`, `app.js`): each click MUST alternate the persisted value
  between exactly these two values. The button's icon MUST equal `🌙` iff the persisted value is
  `'dark'`, and `☀️` iff `'light'` — never computed from `matchMedia` after the first boot.
- **Settings dropdown** (`#theme-select`, `views/settings.js`): MUST offer exactly two options,
  Dark and Light, writing the same persisted value as the toggle.
- **First boot** (no persisted value present): the app MUST choose an initial `data-theme` using
  `matchMedia('(prefers-color-scheme: dark)')`, and MUST persist that choice as an explicit
  `'dark'`/`'light'` value before or at the first render, so every subsequent read (including a
  later OS-level preference change) sees an explicit choice, never a live re-resolution. If
  `matchMedia` is unavailable, the app MUST default to `'dark'` and persist that fallback the same
  way as any other first-boot resolution.
- **Legacy value migration**: a stored value of `'auto'` (from before this fix) MUST be treated as
  "no explicit choice yet" and re-resolved/persisted per the first-boot rule above, not passed
  through to the icon or the dropdown.

## C2 — Short-answer list styling

- The `.short-answer` list (item page, Drill, Mock) MUST render with no left border, bar, or other
  vertical accent — plain `<ul><li>` bullet styling only.
- This applies identically on all three surfaces that render `shortAnswer` — a single shared CSS
  rule, not a per-surface override.

## C3 — Sentence-separated question/prompt rendering

- **Input**: any `item.q` string, and any `item.prompt` string, exactly as stored in content packs
  today — no pack file is edited to satisfy this contract.
- **Output**: the rendered surface (item page, Drill, Mock, and — for `q` — the DSA/Design detail
  header) MUST show each sentence of the input as its own visually distinct line/block, in original
  order, with no sentence's text altered, dropped, or duplicated.
- **Non-splitting cases** (MUST NOT introduce a break):
  - Input with only one sentence → exactly one output line, textually identical to today's
    single-line render.
  - A `.` immediately followed by a digit, by a lowercase letter, or by nothing that resembles a
    new sentence start (no following capital letter) → not treated as a boundary (covers decimals,
    version numbers, and typical abbreviations).
  - A `.`/`?`/`!` occurring inside a backtick code span (`` `...` ``) → never treated as a boundary,
    regardless of what follows.
- **Splitting cases** (MUST introduce a break):
  - A `?` or `!` anywhere outside a code span → always a boundary.
  - A `.` outside a code span, followed by whitespace and then an uppercase letter or a quote mark,
    or by end-of-string → a boundary.
- **Consistency**: the same input `q`/`prompt` MUST produce the same sentence breaks on every
  surface that renders it (FR-006's cross-surface acceptance scenario).

## C4 — "UPD" badge removal

- No item listing anywhere in the app MUST render an "UPD" badge (or any other visible label whose
  sole purpose is "changed in the current release").
- The "NEW" badge (`addedIn === snapshot.version`) MUST continue to render exactly as before.
- Any filter/view whose *inclusion* logic depends on `addedIn === snapshot.version ||
  updatedIn === snapshot.version` (e.g. the Topics "✨ New in this release" filter) MUST continue to
  include the same items as before — only the visible badge changes, never what a filter matches.

## C5 — Topic-category level ordering

- Within a single topic's category grouping in the Topics listing, items MUST render in ascending
  `level` order (`1` Basics, `2` Mid-Level, `3` Senior, `4` Lead).
- Items sharing the same `level` within that grouping MUST keep the same relative order across
  repeated renders of the same underlying data (a stable sort, not a re-shuffle).
- An item with a missing/undefined `level` MUST still render, sorted as if it were `level === 1`
  (Basics), never dropped and never erroring the view.
