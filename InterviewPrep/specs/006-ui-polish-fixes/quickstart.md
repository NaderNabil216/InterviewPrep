# Quickstart: Validating Study Surface UI Polish

No automated test runner exists in this repo (`CLAUDE.md`). Validation is manual, in a browser,
against the running site. Content is unaffected by this feature, so no `node tools/validate.mjs`
re-run or manifest bump is required — but running it once first confirms you haven't touched
content by accident:

```bash
node tools/validate.mjs
```

## Setup

```bash
bash tools/serve.sh          # http://localhost:8777 — caching disabled
```

Open `http://localhost:8777` in a browser. The site must be served over `http://localhost` —
`file://` is hard-blocked.

## Scenario 1 — Theme toggle is a plain two-way switch (C1 / User Story 2)

1. Clear the theme setting: DevTools → Application → Local Storage → delete the `aip.v1.settings`
   key (or open a fresh profile), then reload.
2. **Expect**: the app opens in an appearance matching your OS's current light/dark setting, and
   the icon (moon or sun) matches it.
3. Click the theme button repeatedly. **Expect**: it alternates strictly moon → sun → moon → sun,
   the icon always matching `data-theme` on `<html>` — never a third state.
4. Go to Settings. **Expect**: the Theme card offers only "Dark" and "Light" — no "Match system"
   option.
5. With an explicit choice made, change your OS's system light/dark setting while the tab stays
   open. **Expect**: the app's appearance and icon do not change on their own.

## Scenario 2 — Short-answer bullets are plain (C2 / User Story 3)

1. Open any item's detail page and reveal the short answer. **Expect**: a plain bulleted list, no
   vertical line/bar to its left.
2. Repeat in Drill (start a drill session, flip a card) and in Mock (start a mock, expand an
   answer). **Expect**: identical plain-list presentation on all three surfaces.

## Scenario 3 — Multi-sentence questions read as separate lines (C3 / User Story 1)

1. Find or open an item whose `q` contains more than one sentence (the spec's own example: a
   statement followed by two questions, e.g. an item touching generics/variance/`@UnsafeVariance`).
2. On the item page, in Drill, and in Mock: **expect** each sentence to appear as its own visually
   separated line, in original order, with none of the original wording changed.
3. Open a single-sentence item on the same three surfaces. **Expect**: no change from current
   behavior — one line, as today.
4. Check an item whose text contains a decimal, a version number, or a backtick-quoted code
   identifier with a `.` inside it (e.g. `` `List<out E>.contains` ``). **Expect**: no false break
   at that punctuation.
5. Open a Design or DSA item whose `prompt` is multi-sentence. **Expect**: the same per-sentence
   separation in the requirement prompt text.

## Scenario 4 — No "UPD" badge anywhere (C4 / User Story 4)

1. In Topics, use the status filter for "new/updated in this release" (or browse to an item you
   know was `updatedIn` the currently-installed manifest version — check
   `content/manifest.json`'s `version` against an item's `updatedIn`).
2. **Expect**: that item shows no "UPD" badge anywhere in its listing row.
3. Find an item `addedIn` the current version. **Expect**: its "NEW" badge still renders, unchanged.
4. Confirm the "new-content" status filter in Topics still includes both the updated and the newly
   added item — only the badge is gone, not the filter match.

## Scenario 5 — Topic categories sort Basics → Lead (C5 / User Story 5)

1. In Topics, pick a track/topic whose category has items at more than one level (filter by track,
   scan for a category with a level spread, or check pack JSON directly).
2. **Expect**: within that category, items appear ordered Basics, then Mid-Level, then Senior, then
   Lead — never a Lead item above a Basics item in the same category.
3. Reload the page and re-check the same category. **Expect**: items at the same level keep the
   same relative order as the previous view (no shuffle).

## Regression check

- Reload the app fresh (no `aip.v1.settings` key) once more after all five fixes are in place, and
  confirm the dashboard, Drill, and Mock still boot normally — none of these fixes should be able to
  break boot, since all are presentation-only per the plan's Constitution Check.
