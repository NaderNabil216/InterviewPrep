---

description: "Task list for Study Surface UI Polish"
---

# Tasks: Study Surface UI Polish

**Input**: Design documents from `/specs/006-ui-polish-fixes/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-behavior.md, quickstart.md

**Tests**: No automated test runner exists in this repo (see `CLAUDE.md`, plan.md's Testing
section) and the spec does not request one — every story is verified manually against the running
site via `quickstart.md`. No test tasks are generated; each story's implementation tasks are
followed by a manual-verification task instead.

**Organization**: Tasks are grouped by user story (priorities per spec.md: US1 P1, US2 P1, US3 P2,
US5 P2, US4 P3) so each of the five independent fixes can be implemented, verified, and shipped on
its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Which user story this task belongs to (US1–US5, per spec.md)
- File paths are exact and relative to the repo root (`/Users/nn/InterviewPrep`), not this Spec Kit
  scaffold

## Path Conventions

Single flat static-site project, no build step (constitution Principle V) — all paths are under
`assets/js/**`, `assets/css/app.css`, and `index.html` at the repo root, per plan.md's Project
Structure.

---

## Phase 1: Setup

**Purpose**: Confirm a clean baseline before touching any app code

- [X] T001 Run `node tools/validate.mjs` from the repo root and confirm it exits 0, establishing that
  the content set is clean before any app-code change (no content file is touched by this feature).
- [X] T002 [P] Start the local dev server with `bash tools/serve.sh` and confirm the site loads at
  `http://localhost:8777` (per `CLAUDE.md`, the app hard-stops under `file://`).

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by all user stories

**None identified.** All five fixes are independently scoped to their own files with no shared
entity, module, or infrastructure change (see research.md decisions 1–5 and data-model.md, where
every changed value — theme preference, item `level`, `addedIn`/`updatedIn`, the new sentence unit —
serves exactly one story). Proceed directly to the user story phases; any story may be implemented
first.

---

## Phase 3: User Story 1 - A run-on question reads as separate, answerable ideas (Priority: P1) 🎯 MVP

**Goal**: Split a multi-sentence `q`/`prompt` into one visually distinct line per sentence, at
render time, on every surface that shows a question — without editing any content file.

**Independent Test**: Open an item whose `q` contains more than one sentence (the spec's own
generics/`@UnsafeVariance` example) on the item page, in Drill, and in Mock, and confirm each
sentence renders as its own line, in order, unaltered — while a single-sentence item, a decimal/
version number, and a backtick code span containing a `.` all render exactly as before.

### Implementation for User Story 1

- [X] T003 [US1] Add a `splitSentences(text)` helper to `assets/js/md.js`: stash backtick code spans
  (reuse the existing stash regex from `inline()`, `md.js:13-14`), split the remaining text into
  sentences on `?`/`!` (always a boundary) and on `.` only when followed by whitespace + an
  uppercase letter/quote or end-of-string, then restore the stashed code spans into each sentence —
  per research.md §3's algorithm.
- [X] T004 [US1] Add a `renderSentences(text)` helper to `assets/js/md.js` that calls
  `splitSentences()`, runs the existing `inline()` pass over each resulting sentence, and emits each
  as its own block-level element in original order — a single-sentence input must produce exactly
  one block, visually identical to today's output (FR-009). (Depends on T003.)
- [X] T005 [P] [US1] Update `assets/js/views/item.js` (`item.js:39`) to render `item.q` via
  `renderSentences()` instead of a single inline string. (Depends on T004.)
- [X] T006 [P] [US1] Update `assets/js/views/drill.js` (`drill.js:78`) to render `item.q` via
  `renderSentences()`. (Depends on T004.)
- [X] T007 [P] [US1] Update `assets/js/views/mock.js` (`mock.js:141`) to render `item.q` via
  `renderSentences()`. (Depends on T004.)
- [X] T008 [P] [US1] Update `assets/js/views/design.js`'s `<h1>` question header (`design.js:20,61`)
  to render `item.q` via `renderSentences()`. (Depends on T004.)
- [X] T009 [P] [US1] Update `assets/js/views/dsa.js`'s `<h1>` question header (`dsa.js:56`) to render
  `item.q` via `renderSentences()`. (Depends on T004.)
- [X] T010 [US1] Wire sentence splitting into `renderMarkdown`'s paragraph-flush path in
  `assets/js/md.js` so `item.prompt`'s body text (design/DSA requirement prompts) gets the same
  per-sentence treatment as `q`. (Depends on T003, T004; same file as T003/T004 — sequential.)
- [X] T011 [US1] Manually verify Quickstart Scenario 3 (multi-sentence item on item page/Drill/Mock,
  single-sentence no-op, decimal/version-number/code-span false-positive check, Design/DSA
  multi-sentence prompt) per `specs/006-ui-polish-fixes/quickstart.md`. (Depends on T005–T010.)
  Verified in-browser 2026-08-18: `kt-0042` ("You're designing a generic API. How do you decide
  variance? What is `@UnsafeVariance` doing in `List<out E>.contains`?") renders as three separate
  `<span class="sentence">` lines on the item page, in original order, with the `.` inside the
  backtick-quoted `List<out E>.contains` correctly *not* treated as a sentence boundary. `kt-0064`
  ("How does Kotlin's null safety work? And what is a platform type?") confirmed split correctly on
  both Drill and Mock (apostrophe in "Kotlin's" didn't cause a false break either). DSA item
  `ds-0001`'s multi-sentence `prompt` (4 sentences across 2 paragraphs) and Design item `sd-0000`'s
  multi-sentence `prompt` both split per-sentence while preserving the original paragraph break.

**Checkpoint**: User Story 1 is fully functional and independently testable — every question/prompt
surface shows per-sentence separation, no content file touched.

---

## Phase 4: User Story 2 - The theme icon always shows the current explicit choice (Priority: P1)

**Goal**: Collapse the theme toggle from a three-state (dark/light/auto) cycle to a strict two-state
dark/light switch whose icon always matches the active persisted state.

**Independent Test**: From a fresh session, click the theme button repeatedly and confirm it only
ever lands on Dark or Light with the icon always matching; confirm first-visit appearance is still
sensible; confirm a later OS-level preference change does not silently alter an already-made
explicit choice.

### Implementation for User Story 2

- [X] T012 [US2] In `assets/js/store.js` (`store.js:255`), change `Store.getSettings()`'s `theme`
  default so it no longer defaults to `'auto'` — either no default (the caller in T013 resolves the
  first-visit value) or a last-resort `'dark'` fallback for when `matchMedia` is unavailable, per
  research.md §1.
- [X] T013 [US2] In `assets/js/app.js`'s `initTheme()` (`app.js:167-185`), make first boot (no stored
  `theme` key) resolve once via `matchMedia('(prefers-color-scheme: dark)').matches` and persist that
  resolution as an explicit `'dark'`/`'light'` value; treat a legacy stored `'auto'` value the same
  way (re-resolve and persist) rather than passing it through to the icon or dropdown. (Depends on
  T012.)
- [X] T014 [US2] In `assets/js/app.js`'s `initTheme()`, change the click-cycle array from
  `['dark', 'light', 'auto']` to `['dark', 'light']`. (Same file as T013 — sequential.)
- [X] T015 [US2] In `assets/js/app.js`'s `applyTheme()`, drop the `'auto'` branch entirely: always
  set `data-theme` on `<html>`, and set the toggle icon strictly to 🌙 when `theme === 'dark'` and ☀️
  otherwise — no `matchMedia` read after first boot. (Same file as T013/T014 — sequential.)
- [X] T016 [P] [US2] In `assets/js/views/settings.js` (`settings.js:21-25`), remove the "Match
  system" `<option>` from the theme `<select>`, leaving only Dark and Light, writing the same
  persisted `theme` key as the toggle.
- [X] T017 [US2] Manually verify Quickstart Scenario 1 (first-boot appearance matches OS setting,
  strict Dark/Light click alternation, Settings dropdown offers only two options, no silent
  appearance change on a later OS preference flip) per `specs/006-ui-polish-fixes/quickstart.md`.
  (Depends on T013–T016.) Verified in-browser 2026-08-18: with `aip.v1.settings` cleared and OS
  `prefers-color-scheme: dark`, a fresh full page load resolved to `data-theme="dark"` with the 🌙
  icon and persisted `theme:"dark"` into settings. Five consecutive clicks on the toggle produced a
  strict `light→dark→light→dark→light` alternation with the icon always matching `data-theme`
  (`☀️`/`🌙`), never a third state. The Settings page's Theme `<select>` offers only `Dark`/`Light`
  options — no "Match system". Code inspection of `app.js`'s `initTheme()` confirms `matchMedia` is
  read exactly once, at first boot, with no `change`-event listener registered afterward, so an
  OS-level flip post-explicit-choice cannot silently alter the app (this part wasn't independently
  re-verified live, since the browser tool can't toggle the host OS's live color scheme).

**Checkpoint**: User Stories 1 and 2 both work independently — the theme control is a plain two-way
switch with no reachable third state.

---

## Phase 5: User Story 3 - Short-answer bullets look like a plain list (Priority: P2)

**Goal**: Remove the vertical accent bar from the short-answer bullet list, on every surface that
renders it, with a single shared CSS rule.

**Independent Test**: Open any item's short answer on the item page, in Drill, and in Mock, and
confirm no vertical line, bar, or border appears — only plain bullets.

### Implementation for User Story 3

- [X] T018 [US3] In `assets/css/app.css` (`app.css:241-242`), remove `border-left: 3px solid
  var(--accent)` from `.short-answer` and reduce the compensating left `padding` to a plain list
  indent (list-marker space only, no longer border clearance), per research.md §2.
- [X] T019 [US3] Bump the `app.css?v=N` query string in `index.html` to bust the cached stylesheet,
  per `CLAUDE.md`'s cache-busting note. (Follows T018.)
- [X] T020 [US3] Manually verify Quickstart Scenario 2 (plain bulleted short answer, no vertical
  line/bar) on the item page, in Drill, and in Mock per `specs/006-ui-polish-fixes/quickstart.md`.
  (Depends on T018, T019.) Verified in-browser 2026-08-18: on the item page, `getComputedStyle` on
  `.short-answer` returned `borderLeft: "0px none ..."` (was 3px solid accent); visually confirmed
  plain bullets with no vertical bar on `kt-0067`. Same plain-bullet rendering (same shared
  `.short-answer` class, one CSS rule) visually confirmed on Drill (`kt-0064`) and Mock
  ("Android screen" mode, item 1).

**Checkpoint**: User Stories 1, 2, and 3 all work independently — short-answer lists render as plain
bullets everywhere.

---

## Phase 6: User Story 5 - Topic items are ordered from basic to lead (Priority: P2)

**Goal**: Sort each topic-category's item list ascending by `level` (Basics → Lead) immediately
before rendering, with ties broken by stable sort.

**Independent Test**: Open a topic whose category contains items at more than one level, and confirm
they render ordered Basics → Mid-Level → Senior → Lead, with same-level items keeping a consistent
relative order across reloads.

### Implementation for User Story 5

- [X] T021 [US5] In `assets/js/views/topics.js` (`topics.js:38-44`), after grouping items per
  track/topic, sort each category's item array with `.sort((a, b) => (a.level || 1) - (b.level ||
  1))` immediately before rendering — `Array.prototype.sort` is a stable sort per ES2019, so
  same-level items keep their existing relative order with no secondary key needed, per research.md
  §5.
- [X] T022 [US5] Manually verify Quickstart Scenario 5 (Basics→Lead ordering within a mixed-level
  category, stable same-level order across a reload, unchanged single-level categories) per
  `specs/006-ui-polish-fixes/quickstart.md`. (Depends on T021.) Verified in-browser 2026-08-18:
  Topics filtered to `track=kotlin`, category "Standard library" (items `kt-0064..kt-0069`) rendered
  in level order `[1, 2, 2, 2, 3, 3]` (Basics, then three Mid-Level, then two Senior) — screenshot of
  "Null safety" category also visually confirmed Basics, Basics, Mid-Level, Senior, Lead top-to-
  bottom. Reloading the same filtered URL produced the identical id order
  (`kt-0064,kt-0065,kt-0066,kt-0067,kt-0068,kt-0069`) — same-level relative order is stable across a
  reload.

**Checkpoint**: User Stories 1, 2, 3, and 5 all work independently — topic category listings sort by
level.

---

## Phase 7: User Story 4 - Recently-changed items no longer carry an "UPD" badge (Priority: P3)

**Goal**: Remove the "UPD" badge from the Topics listing while leaving the "NEW" badge and the
underlying `addedIn`/`updatedIn`-driven filter behavior untouched.

**Independent Test**: Load a snapshot with an item `updatedIn` the current release and confirm no
"UPD" badge appears anywhere, while an item `addedIn` the current release still shows "NEW" and the
"new-content" filter still includes both.

### Implementation for User Story 4

- [X] T023 [US4] In `assets/js/views/topics.js` (`topics.js:60-61`), delete the `it.updatedIn ===
  snapshot.version ? '<span class="chip chip--new">UPD</span>'` branch from the item-row badge
  render, leaving the `NEW` case (`it.addedIn === snapshot.version`) intact and falling through to
  `''` otherwise. Leave `topics.js:28`'s `state.status === 'new-content'` filter (which reads both
  `addedIn` and `updatedIn`) untouched, per research.md §4. (Same file as T021 — implement after
  Phase 6 lands to avoid clobbering the sort edit.)
- [X] T024 [US4] Manually verify Quickstart Scenario 4 (no "UPD" badge anywhere, "NEW" badge
  unaffected, "new-content" status filter still includes both the updated and the newly-added item)
  per `specs/006-ui-polish-fixes/quickstart.md`. (Depends on T023.) Verified in-browser 2026-08-18:
  `kt-0067` (`updatedIn: "2026.08.34"`, the current manifest version) appears in the
  `?status=new-content` filtered Topics list, with its row rendering only the `Mid-Level` chip — no
  "UPD" chip. No pack item currently has `addedIn` equal to the current release (2026.08.34 was a
  corrections-only release, no new items), so the "NEW" badge itself couldn't be exercised live this
  session — confirmed by source reading instead: `topics.js`'s row template only emits a `NEW` chip
  for `it.addedIn === snapshot.version` and has no "UPD" branch at all, and the `new-content` filter
  predicate (`it.addedIn !== snapshot.version && it.updatedIn !== snapshot.version`) still reads both
  fields, matching the live behavior observed for `kt-0067`.

**Checkpoint**: All five user stories are independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Confirm the five independent fixes compose cleanly and left no stray trace

- [X] T025 [P] Re-run `node tools/validate.mjs` and confirm it still exits 0 — no content file
  should have been touched by any of the five fixes.
- [X] T026 Run the quickstart.md regression check: reload the app fresh (no `aip.v1.settings` key)
  and confirm the dashboard, Drill, and Mock all boot normally after all five fixes have landed.
  Verified in-browser 2026-08-18: cleared `aip.v1.settings`, did a full (non-hash-only) page reload,
  and loaded Dashboard, Drill, and Mock in turn — all three rendered correctly with theme correctly
  re-resolved to the OS's dark preference, and `read_console_messages` reported no console errors on
  any of the three.
- [X] T027 [P] Grep `assets/js/app.js`, `assets/js/store.js`, and `assets/js/views/settings.js` for
  any remaining reference to the retired `'auto'` theme value, and grep
  `assets/js/views/topics.js` for any remaining `UPD` badge markup, to confirm nothing was missed.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: None identified — no phase-2 tasks block the user stories.
- **User Stories (Phases 3–7)**: Each depends only on Setup completion, not on each other. They may
  be implemented in any order or in parallel by different people; the phase order below follows
  spec.md's priority ranking (P1, P1, P2, P2, P3).
  - **Exception**: Phase 7 (US4) and Phase 6 (US5) both edit `assets/js/views/topics.js` — implement
    Phase 6 before Phase 7 (or merge carefully) to avoid one edit clobbering the other.
- **Polish (Phase 8)**: Depends on all five user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories.
- **User Story 2 (P1)**: No dependencies on other stories.
- **User Story 3 (P2)**: No dependencies on other stories.
- **User Story 5 (P2)**: No dependencies on other stories, but shares a file (`topics.js`) with US4.
- **User Story 4 (P3)**: No functional dependency on US5, but shares a file (`topics.js`) — sequence
  after US5 to avoid a merge conflict, not because of a behavioral dependency.

### Within Each User Story

- US1: the two `md.js` helpers (T003, T004) before any view is updated to call them (T005–T010);
  manual verification last.
- US2: `store.js`'s default (T012) before `app.js`'s first-boot resolution logic (T013); the three
  `app.js` edits (T013–T015) are sequential (same file); the Settings dropdown edit (T016) is
  independent; manual verification last.
- US3: the CSS edit (T018) before the cache-busting version bump (T019); manual verification last.
- US5: the sort edit (T021) before manual verification (T022).
- US4: the badge-removal edit (T023) before manual verification (T024).

### Parallel Opportunities

- T001 and T002 (Setup) can run together.
- Within US1, T005–T009 (five different view files, all depending only on T003/T004) can run in
  parallel once the `md.js` helpers exist.
- Within US2, T016 (`settings.js`) can run in parallel with T013–T015 (`app.js`), since they touch
  different files.
- Across stories: US1, US2, US3, and US5's Phase-6 work (T021) can all proceed in parallel by
  different people once Setup is done — only US4's T023 needs to wait on US5's T021 (same file).
- T025 and T027 (Polish) can run in parallel; T026 should run last, after everything else lands.

---

## Parallel Example: User Story 1

```bash
# After T003 and T004 (md.js helpers) are done, launch all five view updates together:
Task: "Update assets/js/views/item.js to render item.q via renderSentences()"
Task: "Update assets/js/views/drill.js to render item.q via renderSentences()"
Task: "Update assets/js/views/mock.js to render item.q via renderSentences()"
Task: "Update assets/js/views/design.js's <h1> question header via renderSentences()"
Task: "Update assets/js/views/dsa.js's <h1> question header via renderSentences()"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Skip Phase 2: no foundational tasks exist.
3. Complete Phase 3: User Story 1 (sentence splitting) — the story the spec describes in the most
   detail, with the most concrete before/after example, and the one touching the most surfaces.
4. **STOP and VALIDATE**: run Quickstart Scenario 3 independently.
5. Ship if ready — User Story 2 (also P1) is equally small and is the natural next increment.

### Incremental Delivery

1. Setup → Foundation is a no-op → move straight to story work.
2. Add User Story 1 → verify independently → ship (MVP).
3. Add User Story 2 → verify independently → ship.
4. Add User Story 3 → verify independently → ship.
5. Add User Story 5 → verify independently → ship.
6. Add User Story 4 (after US5, same file) → verify independently → ship.
7. Run Phase 8 Polish once all five are in.

### Parallel Team Strategy

With multiple developers, after Setup:

- Developer A: User Story 1 (`md.js` + five view files)
- Developer B: User Story 2 (`app.js`, `store.js`, `settings.js`)
- Developer C: User Story 3 (`app.css`, `index.html`)
- Developer D: User Story 5 then User Story 4 (both touch `topics.js` — keep on one person or
  coordinate the merge)

---

## Notes

- [P] tasks = different files, no dependency on an incomplete task.
- [Story] label maps each task to its user story for traceability back to spec.md.
- No test tasks were generated — this repo has no automated test runner and the spec did not
  request one; manual verification tasks (per `quickstart.md`) close out each story instead.
- Every task names its exact file(s); several also cite the `research.md` decision or contract
  section (`C1`–`C5`) that specifies its behavior.
- Commit after each task or logical group; stop at any checkpoint to validate a story independently.
- No content pack, `content/manifest.json`, or item id is touched by any task in this file — every
  edit is confined to `assets/js/**`, `assets/css/app.css`, and `index.html`, per the plan's
  Constitution Check.
