# Tasks: Improvements

**Input**: Design documents from `specs/002-improvements/` (plan.md, spec.md, research.md, data-model.md,
contracts/, quickstart.md)

**Prerequisites**: plan.md ✔ · spec.md ✔ · research.md ✔ · data-model.md ✔ · contracts/ ✔ · quickstart.md ✔

**Tests**: Not requested anywhere in spec.md — this project has no unit-test runner and none is added
(plan.md's Technical Context). Verification is `node tools/validate.mjs` (content gates) plus the manual
browser scenarios in `quickstart.md`; both are referenced inline below and in the Polish phase, not as a
separate Tests sub-phase.

**Repository root for all file paths below**: `/Users/nn/InterviewPrep` (the app — **not** this Spec Kit
scaffold directory). Spec Kit scaffold paths are called out explicitly where used (e.g. US9's doc cleanup).

**Organization**: Grouped by user story per spec.md's priorities — P1: US1, US2, US3 · P2: US4, US5, US9 ·
P3: US6, US7, US8 (US6/US7/US8 keep the spec's own order; US9 is pulled forward in the P2 group only
because P2 is where its priority places it, not because it depends on US4/US5).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps to spec.md's user stories (US1–US9)
- File paths are exact and taken from the live repository as of 2026-08-14 (research.md's line refs);
  re-check line numbers if other tasks have already landed and shifted them.

---

## Phase 1: Setup

- [X] T001 Confirm baseline before touching anything: from `/Users/nn/InterviewPrep`, run
  `bash tools/serve.sh` (serves `http://localhost:8777` — required, `fetch()` of local JSON is blocked
  over `file://`) and confirm `node tools/validate.mjs` and `node tools/check-refs.mjs` both exit 0
  (quickstart.md Prerequisites)

**Checkpoint**: Environment verified clean. No project init/dependency install exists in this repo (no
build step, no npm) — this phase is intentionally thin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The one piece of shared plumbing both P1 startup/sync stories (US2, US3) build on, plus the
one shared content-schema gate both content-heavy stories (US6, US8) rely on to batch-gate correctly.
**No other story depends on this phase** — US1, US4, US5, US6 (content), US7, US8 (content), and US9 may
start immediately after Setup.

- [X] T002 [P] Split `assets/js/content.js`'s single `boot()` (lines 51-65) and its sequential
  `loadManifestAndPacks()` pack/plan loop (lines 12-23) into two independently-awaitable exports:
  `bootShell()` — returns the stored snapshot immediately via `Store.getSnapshot()` if present;
  otherwise fetches only `content/manifest.json` and returns a minimal, **not persisted** placeholder
  (`{ version, generatedAt, packMeta: manifest.packs, releases: manifest.releases || [], items: [],
  byId: {} }`) alongside the fetched `manifest` — and `bootContent(manifest)` — fetches every pack and
  plan via `Promise.all(...)` instead of today's `for`-`await` loop, builds the full snapshot with the
  existing `buildSnapshot()`, persists it via `Store.setSnapshot()`, and returns it. Remove the old
  `boot()` export (callers are rewired in T006 below).
- [X] T003 [P] In `tools/validate.mjs`'s existing gate 7 block (lines 143-162), add two new
  **`staged()`** checks (not `err()` — this is the repo's warn-during-rollout/error-at-`--final` helper,
  already used by gates 4/5/8/9/12) so the rollout doesn't fail non-`--final` runs mid-batch:
  `dsa` items missing a non-empty `sampleCall` string, and **every** `design` item (including
  `isFramework: true` items — unlike the existing `requirements`/`rubric`/`timerMinutes` check just
  below it, which explicitly excludes the framework item) missing a non-empty `clarifyingQuestions`
  array. The `clarifyingQuestions` check MUST also assert **at least 3 entries** (FR-027b) and that
  **every entry is a string** (FR-027a) — note that `validate.mjs` type-checks no array's element shape
  today, so without this the array-of-objects shape the spec rules out would pass silently.

**Checkpoint**: `bootShell`/`bootContent` exist and are ready for US2/US3 to wire up; the new gate-7
checks exist (as warnings) for US6/US8's content batches to be validated against.

---

## Phase 3: User Story 1 - Type-ahead search that keeps up with typing (Priority: P1) 🎯 MVP

**Goal**: Every keystroke in the search overlay and Topics filter appears immediately; the actual
search/filter compute+render only runs on a ~150ms trailing debounce, settling within 300ms of pausing.

**Independent Test**: Type a 10+ character query quickly in the search overlay and in Topics' keyword
filter; confirm no dropped/delayed characters, results settle within 300ms of pausing (not per
keystroke), and clearing mid-typing shows the empty/prompt state with no stale flash.

### Implementation for User Story 1

- [X] T004 [P] [US1] Add a small `debounce(fn, ms)` closure colocated in `assets/js/search.js` (no new
  shared module — `grep -rn "debounce\|throttle" assets/js/` currently returns nothing) and use it in
  `assets/js/app.js`'s search-overlay `input` listener (`initSearch()`, lines 184-193): keep the
  empty/no-match placeholder text update synchronous, but gate the `search(input.value)` call and
  `results.innerHTML` rebuild behind a ~150ms trailing debounce.
- [X] T005 [US1] In `assets/js/views/topics.js`'s `#f-q` keyword filter (lines 6-111), stop routing every
  keystroke through `navigate()` → `hashchange` → full view re-mount (`rerenderList()`/`syncQuery()` at
  lines 95-105). Make the `input` listener update `state.q` and re-render **only the `#topics-list`**
  container (re-run `applyFilters()` + the grouped-list template, lines 21-43/69-93) on the same ~150ms
  debounce imported from `search.js`; debounce the `syncQuery()` URL/hash write separately so the
  address bar catches up after typing stops, not on every keystroke. The existing empty-state markup
  (line 70) needs no change — just gate it behind the same debounce so it doesn't flash between
  keystrokes.

**Checkpoint**: User Story 1 is fully functional and independently testable (quickstart.md US1).

---

## Phase 4: User Story 2 - Fast, visibly-loading first launch (Priority: P1) 🎯 MVP

**Goal**: A visible loading indicator appears immediately on first paint; nav + dashboard become usable
within 1 second on a cold cache, before every content pack has finished fetching; warm-cache loads stay
instant.

**Independent Test**: Clear all site data, reload, and confirm a loading indicator is visible immediately,
nav/dashboard become interactive within 1 second while pack requests are still in flight (Network tab),
and total time-to-interactive beats loading everything up front; reload again without clearing storage and
confirm the warm-cache path still renders instantly.

### Implementation for User Story 2

- [X] T006 [US2] **(FR-004, FR-005, FR-005b)** Rewrite `assets/js/app.js#main()` (lines 357-379): call `bootShell()` (T002) and await
  only that before `buildIndex()` + the first `render()` — so nav + dashboard render within ~1s even on a
  true cold cache (where the shell snapshot's `items` is empty). Hide the static loading element (T007)
  right after that first render. If `bootShell()` returned a `manifest` (cold-cache path only — a warm
  cache has nothing further to fetch), call `bootContent(manifest)` **without** awaiting it; on its
  resolution set `App.snapshot`, `buildIndex(App.snapshot.items)`, and call `render()` again so the
  currently-mounted view picks up the complete data (no hash change occurs, so this re-render must be
  called explicitly, not left to the `hashchange` listener at line 141).
- [X] T007 [US2] **(FR-004)** Add a static loading element to `index.html` (e.g. `#boot-status`, "Loading your prep
  library…"), placed so it's visible by default (no `hidden` attribute) before `assets/js/app.js`
  evaluates — a sibling of `<main id="view">` inside `#app` (around line 76). T006 hides it once the
  shell-phase render completes.
- [X] T007a [US2] **(FR-005a)** `assets/js/views/dashboard.js`: make every content-derived figure render a
  neutral placeholder (e.g. `—`) instead of a real-looking zero while the shell-phase snapshot is still
  empty. On a cold cache `snapshot.items` is `[]`, so `totalItems` (line 33), `knownCount`/`seenCount`
  (lines 34-35), the `${due} due · ${unseen.length} still unseen` heading (line 112), and every
  `${pct}%` mastery bar (lines 136-137) would otherwise all render `0`/`0%` — indistinguishable from a
  candidate who has genuinely done nothing. Gate on the shell-phase marker (a snapshot with no items),
  not on each value being zero, so a real zero still displays as `0`. T006's second `render()` replaces
  the placeholders in place when the content phase resolves.
- [X] T008 [P] [US2] Add `.boot-status` styling to `assets/css/app.css` (a small centered/inline
  indicator using the app's existing `--text`/`--border`/card tokens — no new dependency). Leave the
  `app.css?v=4` query string in `index.html` untouched here; it's bumped once, in Polish, after every
  CSS-touching task in this feature lands.

**Checkpoint**: User Story 2 is fully functional and independently testable (quickstart.md US2), and does
not regress the warm-cache instant-render path.

---

## Phase 5: User Story 3 - Fully automatic content sync, no manual buttons (Priority: P1) 🎯 MVP

**Goal**: Content syncs silently based on comparing the on-disk manifest against the stored snapshot — no
Update button, no "Up to date"/"Update available" label, no What's New tab — while still preserving the
tick-re-anchoring guarantee and never applying mid-session.

**Independent Test**: Bump `content/manifest.json`'s version on a device with an older cached snapshot;
confirm the newer content applies automatically with no button press (a toast names what changed), no
Update/What's New surface exists anywhere in the nav, a pending diff does not apply mid-Drill/Mock session,
and an offline-then-reconnect device syncs once connectivity returns.

### Implementation for User Story 3

- [X] T009 [P] [US3] **(FR-010b)** Add a boolean `sessionActive` field to the `App` singleton in `assets/js/app.js`
  (alongside `snapshot`/`pendingDiff`, lines 19-22). In `assets/js/views/drill.js`'s `renderDrill()`
  (line 6), import `{ App }` from `'../app.js'` and set `App.sessionActive = true` on entry, `false` in
  the completion branch (lines 38-53) and on the empty-state "Browse topics" exit (lines 15-23). Do the
  same in `assets/js/views/mock.js`'s `runSession()` (line 67): `true` on entry, `false` in the
  completion branch (lines 90-104) and on the "Back to mock modes" exit.
- [X] T010 [US3] **(FR-007, FR-010, FR-010a, FR-010b)** Replace `assets/js/app.js`'s manual update flow — `renderDiffModal()` (lines 218-286),
  `setUpdateButton()` (lines 288-302), `initUpdateButton()` (lines 304-337) — with an automatic trigger:
  call `checkForUpdates(App.snapshot)` (a) once right after the shell-phase render from T006 (never
  blocking first paint), (b) on `visibilitychange`/`focus`, (c) on the browser's `online` event. Hold a
  found `hasUpdates: true` diff as `App.pendingDiff` until `!App.sessionActive` (T009); once clear, run
  the exact three-step sequence already documented as load-bearing at lines 262-268 — migrate ticks
  against the *outgoing* snapshot (`migrateTicks(App.snapshot, planState)`) → `Store.setPlanState(...)`
  → `applyUpdate(diff)` swaps IndexedDB → update `App.snapshot`/`buildIndex(...)` → `render()` — then
  `toast()` a summary adapted from `renderDiffModal`'s counts (e.g. `"Content updated — 12 new, 3
  changed. 2 plan ticks re-anchored."`). No modal, no confirm/cancel button, anywhere in this path.
- [X] T010a [US3] **(FR-011)** Confirm the version-compare short-circuit survives T010's rewrite: today
  `checkForUpdates()` returns early when `diskManifest.version === snapshot.version`, so an unchanged
  index costs exactly one small manifest fetch and no pack traffic. Because T010 moves this call from a
  single click to three recurring triggers (boot, `visibilitychange`/`focus`, `online`), a regression
  here turns one wasted fetch into a repeating one on every tab focus. Verify in DevTools Network that a
  focus/blur cycle against an unchanged manifest issues the manifest request and nothing more.
- [X] T010b [US3] **(FR-007a)** Make the automatic sync all-or-nothing. In the T010 apply path, fetch the
  complete new content set *before* mutating anything: if any pack or plan fetch rejects, abandon the
  attempt — leave the stored snapshot untouched, run no tick migration, persist nothing, and show no
  toast. Do not surface a failed sync as a user-visible error; the device simply keeps working on its
  existing snapshot and retries at the next natural trigger. Guard specifically against a partial
  `Promise.all` failure leaving `applyUpdate()` to swap in an incomplete snapshot.
- [X] T011 [US3] Remove the manual-update UI surfaces entirely: delete `#update-btn` markup
  (`index.html:60-63`) and the `data-nav="whatsnew"` nav button (`index.html:55`); remove the `whatsnew`
  entry from `routes` and its `renderWhatsNew` import in `assets/js/app.js` (lines 16, 34); delete
  `assets/js/views/whatsnew.js`.
- [X] T012 [P] [US3] Remove `.update-btn`, `.update-btn:hover`, `.update-btn.has-updates`,
  `.update-btn__badge` from `assets/css/app.css` (lines 155-162).

**Checkpoint**: User Story 3 is fully functional and independently testable (quickstart.md US3). All three
P1 stories (US1, US2, US3) are now complete — this is a shippable MVP increment.

---

## Phase 6: User Story 4 - One-tap progress marking (Priority: P2)

**Goal**: Every place a question's answer is reviewed shows exactly one "Mark complete" action instead of
Again/Hard/Good/Easy, mapped to a single fixed `rate(id, 'good')` call so Drill ordering and mastery
percentages are unaffected.

**Independent Test**: Open any question's answer in Topics/item detail, Drill, and Mock review; confirm
only "Mark complete" is shown, tapping it updates the status dot and schedules the item normally, and
tapping twice does not double-count or corrupt scheduling (identical to today's double-"Good" behavior).

### Implementation for User Story 4

- [X] T013 [P] [US4] `assets/js/views/item.js`: replace the 4-button `.rate-row` (lines 69-74) with one
  "Mark complete" button; its handler (lines 85-89) calls `rate(item.id, 'good')` once instead of
  `rate(item.id, b.dataset.rate)`.
- [X] T014 [P] [US4] `assets/js/views/dsa.js`: same replacement in the detail view's rate-row
  (lines 88-93, handler lines 109-112).
- [X] T015 [P] [US4] `assets/js/views/design.js`: same replacement (lines 115-120, handler line 178).
- [X] T016 [P] [US4] `assets/js/views/drill.js`: replace the 4-button rate-row (lines 74-79) with one
  "Mark complete" button; its handler (lines 89-95) calls `rate(item.id, 'good')` once, increments a
  single `completed` counter (replacing the `results = { again, hard, good, easy }` tally, line 28), and
  advances `i`/calls `draw()`. Update the completion summary (lines 40-44) to show `${completed} cards
  reviewed` instead of the per-rating breakdown.
- [X] T017 [P] [US4] **(FR-012, FR-013, FR-014, FR-014a)** `assets/js/views/mock.js`: replace the 4-button rate-row (lines 124-129) with one
  "Mark complete" button; remove `RATE_SCORE` (line 13) and `ratings.push(...)` (line 139); track a
  `completedCount` instead. On session completion (lines 90-104), replace
  `Store.addMockResult({ mode, avgScore, itemCount, date })` (line 93) with
  `Store.addMockResult({ mode, completedCount, completedPct: completedCount / items.length, itemCount,
  date })`. Update `renderLanding()`'s `sparkline()` (lines 15-21) and results table (lines 48-52) to
  read `completedPct`/`completedCount` when present, with a fallback to the legacy `avgScore`-based
  display for older stored rows that still carry only `avgScore` (storage-contract-delta.md's
  read-side-fallback note — no one-time rewrite of historical rows). Per **FR-014b** this fallback is
  required, not optional: pre-change sessions must keep displaying rather than vanishing or rendering
  blank, labelled so the old metric isn't confused with the new one, and must not be back-filled.

**Checkpoint**: User Story 4 is fully functional and independently testable (quickstart.md US4).

---

## Phase 7: User Story 5 - Timer only runs while the question is visible (Priority: P2)

**Goal**: Drill's session-elapsed clock and Mock's per-question countdown both freeze the instant an
answer is revealed and resume without a jump once the next question appears; Mock's overall session
deadline is never affected.

**Independent Test**: Start a Drill session, let the clock run, reveal an answer, wait several seconds,
confirm the displayed time didn't advance, then advance and confirm it resumes from the frozen value.
Start a Mock session, reveal an answer, confirm the countdown freezes while the overall session deadline
is unaffected by how long the reveal stays open.

### Implementation for User Story 5

> Both tasks touch the same handler/`draw()` regions US4 (T016/T017) already modifies — implement after
> T016/T017 land to avoid a same-file merge conflict.

- [X] T018 [US5] `assets/js/views/drill.js`: add a session-scoped `pausedMs` accumulator (starts `0`) and
  `revealedAt` (starts `null`) alongside `startedAt` (line 29) — both live for the whole Drill session,
  never reset per question. In `reveal()` (lines 82-88), stop the tick interval and set
  `revealedAt = Date.now()`. In the mark-complete handler (T016), before advancing `i`/calling `draw()`,
  add `Date.now() - revealedAt` to `pausedMs` and clear `revealedAt`. Change every place elapsed time is
  computed (`drill-clock`, line 60; the tick renderer, lines 103-107; the completion summary, lines
  43-44) from `Date.now() - startedAt` to `Date.now() - startedAt - pausedMs`, and restart the tick
  interval each time `draw()` renders a question so the clock resumes from its frozen value with no
  visible jump.
- [X] T019 [US5] `assets/js/views/mock.js`: gate the `timeLeft--` line (line 83) behind the existing
  `revealed` boolean (declared line 80, currently write-only). Set `revealed = true` in the
  `#reveal-btn` handler (lines 132-137) and reset it to `false` at the top of `draw()` (line 89) when
  the next item renders. Leave the `setInterval` (lines 82-87) running continuously — it only skips
  decrementing while `revealed` is true, so `timeLeft` (the overall session budget, FR-017) is
  provably untouched during a pause.

**Checkpoint**: User Story 5 is fully functional and independently testable (quickstart.md US5).

---

## Phase 8: User Story 9 - Correct top-level naming ("Lead" instead of "Staff/Monster") (Priority: P2)

**Goal**: Every UI surface reads "Lead" for the top difficulty level; no stored data, filtering, or level
numbers change.

**Independent Test**: Search the rendered UI for "Staff/Monster"/"Monster" — none remain; "Lead" appears in
chips, filter dropdowns, and cheat sheets; filtering by level 4 returns the same items as before.

### Implementation for User Story 9

- [X] T020 [P] [US9] `assets/js/levels.js`: change `LEVEL_LABEL[4]` (line 7) from `'Staff/Monster'` to
  `'Lead'`. No other code reference exists — every view already renders through `LEVEL_LABEL`/
  `levelLabel()` (confirmed by research.md R-008's repo-wide grep), so this is the only functional edit.
- [X] T021 [P] [US9] Update the four doc/comment echoes of the old label so they don't drift from the
  app (documentation hygiene, not a functional requirement): `/Users/nn/InterviewPrep/CLAUDE.md:83`,
  `/Users/nn/InterviewPrep/AGENTS.md:59-60`, `/Users/nn/InterviewPrep/.claude/workflows/fill-content-gap.js:250`,
  and `/Users/nn/InterviewPrep/InterviewPrep/specs/001-fill-content-gap/contracts/content-schema.md:20` —
  all currently read `Staff-Monster`/`Staff/Monster`; change each to `Lead`.

**Checkpoint**: User Story 9 is fully functional and independently testable (quickstart.md US9). All P2
stories (US4, US5, US9) are now complete.

---

## Phase 9: User Story 6 - Runnable code for DSA problems (Priority: P3)

**Goal**: DSA problem pages get a code editor + "Run" button (replacing the plain scratch textarea) that
executes the candidate's code via Judge0 CE using a candidate-supplied, bring-your-own RapidAPI key, and
shows real output or a readable compile/runtime error — no automated grading, no shared embedded key.

**Independent Test**: Paste a RapidAPI Judge0 CE key in Settings, open a DSA item, write a solution, press
Run, and confirm real `stdout` appears (or a readable error on a broken solution); confirm "needs
setup"/"needs connection" states show correctly with no key / offline; confirm the rest of the site works
fully offline throughout.

### Implementation for User Story 6

- [X] T022 (CANCELLED per user decision — provider to change) [US6] **(FR-022a)** **Do this first — and treat its result as a go/no-go gate for the whole
  story.** If this test fails, FR-022a requires dropping US6 from the release and keeping the existing
  notes area; it explicitly forbids working around the block with a proxy or backend. Do not begin
  T023-T026 until this passes. Smoke test the residual risk research.md R-007 flags rather than
  building on top of an unconfirmed assumption: while serving via `bash tools/serve.sh`
  (`http://localhost:8777`), issue one `fetch()` `POST` from that origin to
  `https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true` with a real RapidAPI
  Judge0 CE key (`X-RapidAPI-Key`/`X-RapidAPI-Host` headers, `language_id: 111`, a trivial
  `source_code`) and confirm the response isn't blocked by CORS.
- [X] T023 [P] [US6] **(FR-018a)** `assets/js/store.js`: add `judge0ApiKey` (optional string, no default value) to
  `getSettings()`'s default shape (lines 247-253).
- [X] T024 [P] [US6] **(FR-018a)** `assets/js/views/settings.js`: add a "Judge0 CE API key" card (a text input,
  alongside the existing Theme card at lines 18-26) writing via
  `Store.setSettings({ judge0ApiKey: e.target.value || null })`; help text notes it's optional,
  candidate-supplied, and never shipped by the app.
- [X] T025 [US6] **(FR-018, FR-021)** `assets/js/views/dsa.js`: replace the plain `<textarea class="scratchpad">`
  (lines 84-87) with a code editor (a styled, monospace-friendly `<textarea>` is sufficient — no new
  editor dependency, per Principle V) pre-filled from `Store.getScratch(item.id).code`/`item.starter`
  exactly as today, plus a "Run" button and an empty Run Result panel below it. Add minimal CSS for the
  editor/run-result panel to `assets/css/app.css` (e.g. a colored-left-border result box similar to the
  existing `.traps-box`).
- [X] T026 [US6] **(FR-019, FR-019a, FR-019c, FR-020, FR-020a, FR-020b, FR-020c, FR-018a)** `assets/js/views/dsa.js`: implement the Run request per
  `contracts/dsa-run-contract.md`. On click: if `!Store.getSettings().judge0ApiKey`, render the
  `needs-key` state with no request sent. Otherwise `POST
  https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true` with `language_id: 111`
  and `source_code` = current editor contents + a generated `\n\nfun main() {\n    println(${item.
  sampleCall})\n}` driver, `X-RapidAPI-Key`/`X-RapidAPI-Host` headers. Map the response to the Run
  Result panel per the contract's table (`output`/`compile-error`/`runtime-error` from
  `status.id`/`stdout`/`compile_output`/`stderr`, or `needs-connection` on network failure/timeout/
  offline). Use one `AbortController` per view instance so pressing Run again aborts the prior in-flight
  request before sending the new one. Keep the Run Result in view-local state only (never
  `Store.setScratch`) so navigating away and back restores the code but not the last result.
  Additionally, per the requirements added after the 2026-08-14 readiness review:
  **(a)** if `item.sampleCall` is absent or empty, render the `not-runnable` state with Run disabled
  and send no request (FR-019c) — this is the normal state for a pack whose `sampleCall` batch
  (T027-T035) hasn't landed, not an error;
  **(b)** set the `pending` state the instant a request is sent, clearing any previous result from the
  panel so a stale output can't be read as the current one (FR-020b);
  **(c)** abort at **30 seconds** and fall through to `needs-connection` (FR-020c) — pair the
  `AbortController` with a timer, since `fetch` has no native timeout;
  **(d)** never let the candidate's key reach `console`, a rendered error message, or a URL (FR-018a) —
  on failure show the contract's fixed copy, never a dump of the outgoing request.

### Content — `sampleCall` authoring, batched per pack (US6, gated by T003's staged validate.mjs check)

- [X] T027 [P] [US6] Author `sampleCall` for the 6 items in `content/packs/dsa.json` — one Kotlin
  expression per item invoking its function with literal sample args (e.g.
  `threeSum(intArrayOf(-1,0,1,2,-1,-4))`); set `updatedIn` to this feature's release version;
  `node tools/validate.mjs` stays clean (warning-only until `--final`) after this batch.
- [X] T028 [P] [US6] Same for the 8 items in `content/packs/dsa-b.json`.
- [X] T029 [P] [US6] Same for the 5 items in `content/packs/dsa-c.json`.
- [X] T030 [P] [US6] Same for the 7 items in `content/packs/dsa-g-1.json`.
- [X] T031 [P] [US6] Same for the 7 items in `content/packs/dsa-g-2.json`.
- [X] T032 [P] [US6] Same for the 7 items in `content/packs/dsa-g-3.json`.
- [X] T033 [P] [US6] Same for the 7 items in `content/packs/dsa-g-4.json`.
- [X] T034 [P] [US6] Same for the 7 items in `content/packs/dsa-g-5.json`.
- [X] T035 [P] [US6] Same for the 6 items in `content/packs/dsa-g-6.json`.

**Checkpoint**: User Story 6 is fully functional and independently testable (quickstart.md US6).

---

## Phase 10: User Story 7 - Plainer English in question summaries (Priority: P3)

**Goal**: All ~629 items get a plain-English `shortAnswer` rewrite — scoped to that field only, `answer`/
`traps`/other prose untouched — landed in per-track batches, each gated by `node tools/validate.mjs`.

**Independent Test**: Open rewritten items across tracks; confirm plain, direct wording, `answer`/`traps`
byte-identical to before, and `node tools/validate.mjs` exits 0 after each batch.

### Implementation for User Story 7 — batched per track, all independently parallelizable

> **Every T036-T048 batch carries the same two-part gate (FR-025, FR-025a)**: `node tools/validate.mjs`
> exits 0, **and** whoever authored the batch does an explicit read-through comparing each rewritten
> `shortAnswer` against that same item's `answer`/`traps` before committing. The validator cannot detect
> a summary that got simpler but stopped being true, so the human pass is a required step in the batch's
> definition of done, not a discretionary spot-check. This is not restated on each task below — it
> applies to all thirteen.

- [X] T036 [P] [US7] Rewrite `shortAnswer` in plain English across `content/packs/kotlin-*.json`
  (14 packs); leave `answer`/`traps`/other fields untouched; set `updatedIn` to this feature's release
  version on each touched item; `node tools/validate.mjs` exits 0 after this batch.
- [X] T037 [P] [US7] Same for `content/packs/coroutines-*.json` (6 packs, `coroutines-flow` track).
- [X] T038 [P] [US7] Same for `content/packs/compose-*.json` (10 packs).
- [X] T039 [P] [US7] Same for `content/packs/platform*.json` (7 packs).
- [X] T040 [P] [US7] Same for `content/packs/architecture*.json` (7 packs).
- [X] T041 [P] [US7] Same for `content/packs/dsa*.json` (9 packs, 60 items — independent of T027-T035's
  `sampleCall` authoring on the same files; different field, no ordering requirement).
- [X] T042 [P] [US7] Same for `content/packs/system-design*.json` (5 packs, 19 items — independent of
  US8's `clarifyingQuestions`/`requirements`/`framework` work on the same files; different field).
- [X] T043 [P] [US7] Same for `content/packs/data-networking*.json` (5 packs).
- [X] T044 [P] [US7] Same for `content/packs/performance*.json` (6 packs).
- [X] T045 [P] [US7] Same for `content/packs/build-testing*.json` (7 packs).
- [X] T046 [P] [US7] Same for `content/packs/security-kmp*.json` (8 packs).
- [X] T047 [P] [US7] Same for `content/packs/behavioral*.json` (3 packs).
- [X] T048 [P] [US7] Same for `content/packs/cheatsheets*.json` (2 packs).

**Checkpoint**: `node tools/validate.mjs`'s item count confirms all ~629 items carry an `updatedIn` for
this release and a rewritten `shortAnswer` (quickstart.md US7). User Story 7 is independently testable
batch-by-batch, without waiting for the rest of this phase.

---

## Phase 11: User Story 8 - Clarify-then-present system design flow (Priority: P3)

**Goal**: Every system design scenario opens with a clarifying-questions step before any solution content,
matching real system-design interviews; the framework item documents the two-phase structure every
scenario follows.

**Independent Test**: Open the framework item and confirm it documents two labeled phases; open any
scenario and confirm `clarifyingQuestions[]` is presented first, with the full plan reachable only as a
distinct next step.

### Content — `clarifyingQuestions`/`requirements` split, batched per pack (gated by T003)

> T049 must land first — the other packs' scenario items reference the two-phase framework structure by
> name (research.md R-006/data-model.md).
>
> **Shape and scope rules for every T049-T053 batch** (settled after the 2026-08-14 readiness review):
> `clarifyingQuestions[]` is a flat array of **plain question strings** — never objects, never
> question/answer pairs, no authored answer per question (FR-027a). **At least 3 per item, on every
> item including `sd-0000`, with no exemption** — a scenario that can't yield three real clarifying
> questions gets expanded, not excused (FR-027b). And the work is **structural**: split clarify-flavored
> bullets out of `requirements[]` and fix framework pointer text — do **not** take the opportunity to
> rewrite scenario prose generally (FR-030). The only prose rewrite in this feature is US7's, scoped to
> `shortAnswer`, and it reaches these same packs through T042.

- [X] T049 [US8] **(FR-027a, FR-027b, FR-029, FR-030)** `content/packs/system-design.json` (3 items, includes the framework item `sd-0000`):
  rewrite `sd-0000`'s `framework` field into two explicitly labeled phases ("Phase 1 — Clarify", "Phase
  2 — Plan") replacing today's flat 8-section sequence, and add `clarifyingQuestions[]` to `sd-0000`
  itself; re-scope the pack's other 2 scenario items' `requirements[]` to remove clarify-flavored
  bullets into a new `clarifyingQuestions[]` (the two lists become disjoint per item), updating any
  pointer text that references the framework. Set `updatedIn` on every touched item;
  `node tools/validate.mjs` stays clean (warning-only until `--final`) after this batch.
- [X] T050 [P] [US8] `content/packs/system-design-b.json` (2 items): same `clarifyingQuestions`/
  `requirements` split, referencing the two-phase framework by name (depends on T049).
- [X] T051 [P] [US8] `content/packs/system-design-g-1.json` (4 items): same (depends on T049).
- [X] T052 [P] [US8] `content/packs/system-design-g-2.json` (5 items): same (depends on T049).
- [X] T053 [P] [US8] `content/packs/system-design-g-3.json` (5 items): same (depends on T049).

### App code — two-step render

- [X] T054 [US8] **(FR-027, FR-027a, FR-028)** `assets/js/views/design.js`'s `renderDetail()` (lines 45-179): implement a two-step
  render — Step 1 shows `clarifyingQuestions[]` (e.g. as a checklist/reveal, mirroring today's
  requirements-checklist interaction style) with no solution content visible; an explicit "proceed"
  action gates Step 2, which reveals `framework`/`requirements[]`/the reference-architecture block/
  `rubric`/`staffAdds` exactly as today. Keep the timer and `Store.getScratch`/`setScratch` persistence
  behavior unchanged — only the reveal sequencing changes. (No file dependency on the content tasks
  above — different file — but logically completes this story together with them.)

**Checkpoint**: User Story 8 is fully functional and independently testable (quickstart.md US8). All P3
stories (US6, US7, US8) are now complete.

---

## Phase 12: Polish & Cross-Cutting Concerns

- [X] T055 [P] Bump the `app.css?v=4` query string in `index.html` (line 8) to `?v=5` once every
  CSS-touching task above (T008, T012, T025) has landed, per the project's cache-busting convention.
- [X] T056 Once every US6/US7/US8 content batch (T027-T035, T036-T048, T049-T053) is complete, run
  `node tools/sync-manifest.mjs --write --release <next-version> --summary "..."` from
  `/Users/nn/InterviewPrep` to bump `content/manifest.json`'s version and add a `releases[]` entry —
  required for US3's new automatic sync to ever reach a device already on the prior snapshot (per
  CLAUDE.md: content edits without a version bump are unreachable by the app).
  **Amendment eligibility (constitution v1.1.0, Principle III)**: before publishing, confirm this
  release qualifies for silent auto-apply. It does, structurally: every content task in this feature
  edits *fields on existing items* only — no item is added, removed, or renumbered — so no plan's
  item-id set changes, so no plan's material signature changes, so plan ticks are not merely
  re-anchored but left untouched. That is inside the amendment's "non-destructive to learning state"
  scope, not at its boundary. If a future release in this feature ever *does* remove or renumber an
  item, it falls outside the amendment and the original disclose-before-apply behavior is required
  for it.
- [X] T057 Run `node tools/validate.mjs --final` and `node tools/check-refs.mjs` from
  `/Users/nn/InterviewPrep` — both must exit 0 (quickstart.md's Regression check, and the constitution's
  Quality Gates section).
- [X] T058 Manually walk through `quickstart.md`'s US1-US9 scenarios in a browser served via
  `bash tools/serve.sh`, including the DevTools cold-cache/offline/online simulations called out for
  US2, US3, and US6.
  **Walkthrough outcome (2026-08-16, Chrome 151 headless + CDP against `http://localhost:8777`,
  served content 2026.08.17).** The DevTools simulations T062 could not automate are now covered:
  cold-cache wipes via `Storage.clearDataForOrigin`, offline via
  `Network.emulateNetworkConditions`, partial failure via `Network.setBlockedURLs`, CPU/network
  throttling via `Emulation.setCPUThrottlingRate`, and Judge0 responses via `Fetch` interception.
  **All 76 browser assertions pass** across five suites (US2 · US3 · US6 · US1/4/5/8/9 · US7
  render), alongside the content-side verifications described under US7 and US8 (git field-diff,
  validator gate-is-real test, ref probe). The per-story counts below are scenario groupings. The
  single scenario that was *not* performed is stated under US6.
  - **US2 (11/11)** — cold cache: `#boot-status` visible at first contentful paint, shell
    interactive **27 ms** after it with **89 pack fetches still in flight**, all 8 nav buttons live;
    dashboard shows `— items · — touched · — known`, never `0`; figures fill in at 154 ms with the
    indicator never reappearing and no second navigation. Under 6× CPU + slow-3G the 1 s bound
    lapses (1673 ms, allowed by FR-005b) but the **ordering holds** — 89 packs still pending at
    shell-interactive. Warm cache: full library on first paint, **0 pack fetches**, 42 ms.
  - **US3 (17/17)** — staleness was induced by ageing the *stored snapshot* in IndexedDB rather than
    editing `content/manifest.json`, which drives the identical version-compare path without
    touching the repo. Auto-apply with no click: *"Content updated — 3 new, 5 changed. 2 plan ticks
    re-anchored."*; no modal/dialog/`#update-btn` in the DOM; `getPlanState().done` carries both
    migrated signatures with `checked` reset to `{}`. Mid-Drill the diff is **held** (still
    v2026.08.14, 0 toasts) and applies the moment the session ends. Offline: nothing mutates;
    reconnecting syncs on the browser's own `online` event with no user action. Blocking
    `content/packs/kotlin-a.json` abandons the sync cleanly — old version retained, no toast, plan
    ticks untouched, no banner or error copy — and the next trigger completes it once unblocked.
    FR-011: 5 focus+visibilitychange cycles = **10 manifest requests, 0 pack requests**.
  - **US6 (18/18, one scenario not performed)** — needs-key sends no request; pending state is distinct and clears the
    prior output; a second Run aborts the first so only `SECOND-RUN-ONLY` ever renders (FR-020a);
    a stalled request aborts at **30.1 s** (FR-020c); offline leaves the editor untouched; the
    not-runnable item disables Run, sends nothing, and reads as idle rather than an error; the key
    appears only in `X-RapidAPI-Key` — never console, DOM, or URL. Response→panel mapping was
    exercised with intercepted Judge0 payloads (`status.id` 3/6/11 → output/compile-error/
    runtime-error). **Not performed: quickstart US6 steps 2-3 with a live RapidAPI key** — a real
    keyed round-trip needs a paid credential this environment does not have. CORS reachability was
    already proven in T060, so what remains unverified is only the live call itself.
  - **US1 (7/7)** — 15 keystrokes produce **1 list rebuild** and **1 hash write**, settling **155 ms**
    after the final keystroke; the overlay likewise collapses 22 keystrokes into 1 result render;
    clearing restores the full list and the prompt state with no stale flash.
  - **US4 (7/7)** — one "Mark complete" on item/DSA/design/drill, no Again/Hard/Good/Easy anywhere;
    one tap → `reps=1`, two taps → `reps=2, ease=2.5` with no corruption; mastery still computes.
    FR-014b: a legacy row renders as `2.5/4 avg score` beside a new `6/8 complete` row and was
    **not** back-filled.
  - **US5 (4/4)** — Drill clock 00:02→00:05 while visible, frozen at 00:05 across a 5 s reveal,
    resuming at 00:07 (the reveal was not counted). Mock `#session-timer` 44:59→44:56, then frozen
    across a 5 s reveal, so the session budget is untouched by reveal time (FR-017).
  - **US8 (4/4)** — `sd-0000` carries 5 clarifying questions and documents *Phase 1 — Clarify* /
    *Phase 2 — Plan*; a scenario opens on 4 questions with `#plan-phase` and `#plan-side` both
    hidden until Proceed. **The gate was proven non-vacuous**: dropping an item to 2 questions fails
    `--final` with *"design item has 2 clarifying questions, minimum is 3"*, and swapping one entry
    for a `{question, answer}` object fails with *"clarifyingQuestions must be non-empty plain
    strings"*. Both mutations were reverted and the file restored byte-identically (md5 match).
    Scope discipline (FR-030): across all 19 design items only `clarifyingQuestions`, `requirements`,
    `framework`, `shortAnswer` and `updatedIn` differ from HEAD, the two lists are disjoint on every
    item, and every entry is a plain string.
  - **US7 (3/3, after the fix in T063)** — verified against git rather than by eye: across all 89
    changed packs, `answer` and `traps` are **byte-identical to HEAD on all 629 items**, and no item
    was added, removed, or renumbered. The only non-owned field that moved is `code` on `ds-0010`,
    `ds-0016` and `ds-0048` — two `import java.util.PriorityQueue` additions and a
    `CharArray.groupingBy` → `toList().groupingBy` fix, all required for the shipped snippet to
    compile under US6's Run, so they belong to US6 and touch no prose field.
  - **US9 (2/2)** — `grep -rn "Staff/Monster\|Monster"` over the whole app tree returns **no hits**;
    the level filter reads *All levels, Basics, Mid-Level, Senior, Lead* and 80 level-4 items carry
    a chip reading *Lead*.
  - No console errors in any run beyond the deliberately induced offline/blocked fetch failures.

- [X] T063 Close the US7 gap the T058 walkthrough exposed: **14 items carried a `shortAnswer` that
  was byte-identical to HEAD** — `ar-0015`, `ar-0020`, `ar-0023`, `ar-0025`, `ar-0028`, `ar-0029`,
  `ar-0030`, `ar-0034`, `ar-0035`, `ar-0037`, `ar-0044`, `bt-0046`, `co-0031`, `pe-0019`. All 14
  already carried `updatedIn: 2026.08.17`, so the release metadata claimed a rewrite that had not
  happened, and the T036-T048 checkpoint ("all ~629 items … a rewritten `shortAnswer`") was not in
  fact met. The 14 were rewritten in the same voice as the rest of the pass — long em-dash-chained
  clauses split into separate sentences, formal verbs plainened — with each bullet checked against
  that item's own `answer`/`traps` for truth, per the FR-025a human read-through the phase note
  requires. Edits were applied as exact JSON-string replacements so pack formatting and key order
  are untouched (42/42 bullets replaced; `performance-g-2.json` does not survive a
  `JSON.stringify` round-trip, so reserialization was deliberately avoided). Re-verified: all 629
  `shortAnswer`s now differ from HEAD, `answer`/`traps` still 0 changes, `node tools/validate.mjs
  --final` exits 0, `node tools/check-refs.mjs` exits 0 (259 ok · 237 unverified · **0 broken**),
  and all 14 render their new wording in the browser. **No manifest bump was required**: release
  2026.08.17 is still uncommitted and unpublished, so amending it in place keeps this feature's
  `updatedIn` at a single version — had 2026.08.17 already shipped, these 14 would have needed a
  new release entry instead.

- [X] T064 Fix the cold-cache content phase stranding the app on the loading state, reported from
  real use as *"the loading indicator takes forever loading"*.
  **The defect.** On a cold cache, if the content phase rejected for any reason — a flaky network,
  one slow pack, a dropped connection — `main()`'s `.catch()` logged and gave up. The app kept the
  shell placeholder snapshot (`items: []`) and the dashboard sat on *"Loading your library…"*,
  *"Loading track mastery…"* and `— items` **forever**. Nothing recovered it: `bootShell()` gives
  the placeholder the *disk* manifest's version, so the auto-sync's
  `diskManifest.version === snapshot.version` short-circuit (FR-011, correct in itself) concluded
  there was nothing to fetch while the library was in fact empty. Reloading was the only way out,
  and on a still-flaky network it would strand again. No error was shown, so the app looked
  permanently mid-load.
  **Why the T058 walkthrough missed it.** US2 only cold-booted on a healthy network, and US3's
  blocked-pack test (FR-007a) ran against a *warm* snapshot, where abandoning the sync is exactly
  right. The failure lived in the one cell neither suite visited: cold cache **and** a failed fetch.
  Ten-route cold-boot coverage (`coldroutes.mjs`) was also added while diagnosing, and rules out the
  first hypothesis — that some non-dashboard route threw before `hideBootStatus()`; all 10 clear the
  indicator in ~100 ms.
  **The fix** (`assets/js/app.js`): the manifest is parked in `App.contentPhasePending` and the
  content phase becomes a retryable `runContentPhase()`. `checkAndHoldDiff()` runs it — instead of
  the version compare it cannot learn anything from — whenever a boot is still owed, so the existing
  focus / visibilitychange / online triggers finish an interrupted first load with no user action,
  which is US3 step 6's reconnect promise generalised to first boot. A `contentPhaseInFlight` guard
  keeps repeated focus events from launching overlapping 89-pack fetches, and the cold path no
  longer fires a redundant boot-time sync check, since it has just read everything fresh from disk.
  The candidate keeps seeing loading placeholders rather than an error, per FR-007a's "don't surface
  a failed sync" — the difference is that the load now actually completes.
  **Verified**: `coldfail.mjs` — stranded before, recovers to 629 items after; `offlineboot.mjs` —
  a first boot with packs unreachable shows placeholders, then completes itself on reconnect; US2
  13/13 stable over three consecutive runs and US3 18/18 with no regression.
  **One T058 assertion was also wrong and is corrected**: US2.1 demanded the loading indicator be
  visible at first contentful paint, but on a fast localhost cold cache the shell renders within
  ~2 ms of first paint, so the loading state may correctly never appear — the check flapped
  true/false/null across runs. It now asserts what is deterministic (the served markup ships
  `#boot-status` un-hidden, and the app hides it once the shell renders) and leaves the
  visible-at-paint proof to the 6x-CPU run, where it is stable and actually meaningful.

---

## Requirement → Task Coverage

Every functional requirement in spec.md, and the task(s) that discharge it. Maintained so coverage is
checkable at a glance rather than by diffing spec.md against this file by hand. **If you add an FR to
spec.md, add its row here in the same edit** — a requirement with no row is a requirement no one owns.

| FR | Task(s) | | FR | Task(s) |
|---|---|---|---|---|
| FR-001 | T004, T005 | | FR-019 | T026 |
| FR-002 | T004, T005 | | FR-019a | T026 |
| FR-003 | T004, T005 | | FR-019b | T027-T035 |
| FR-004 | T006, T007, T008 | | FR-019c | T026 |
| FR-005 | T002, T006 | | FR-020 | T026 |
| FR-005a | T007a | | FR-020a | T026 |
| FR-005b | T006 | | FR-020b | T026 |
| FR-006 | T002, T006 | | FR-020c | T026 |
| FR-007 | T010 | | FR-021 | T025 |
| FR-007a | T010b | | FR-022 | T058 (verification) |
| FR-008 | T011, T012 | | FR-022a | T022 (go/no-go gate) |
| FR-009 | T011 | | FR-023 | T036-T048 |
| FR-010 | T010 | | FR-024 | T036-T048 |
| FR-010a | T010 | | FR-025 | T036-T048 |
| FR-010b | T009, T010 | | FR-025a | T036-T048 (phase note) |
| FR-011 | T010a | | FR-026 | T036-T048, T057 |
| FR-012 | T013-T017 | | FR-027 | T049-T053, T054 |
| FR-013 | T013-T017 | | FR-027a | T003, T049-T053, T054 |
| FR-014 | T013-T017 | | FR-027b | T003, T049-T053 |
| FR-014a | T017 | | FR-028 | T054 |
| FR-014b | T017 | | | |
| FR-015 | T018, T019 | | FR-029 | T049 |
| FR-016 | T018, T019 | | FR-030 | T049-T053 |
| FR-017 | T019 | | FR-031 | T020 |
| FR-018 | T025 | | FR-032 | T020, T058 (verification) |
| FR-018a | T023, T024, T026 | | | |

## Cross-Story File Overlap

Which files more than one story writes to, and the resulting ordering constraint. Surfaced here rather
than left to be discovered by reading plan.md's file list — every row is a potential same-file conflict
if two stories are worked concurrently.

| File | Stories (tasks) | Constraint |
|---|---|---|
| `assets/js/app.js` | US2 (T006), US3 (T009, T010, T010a, T010b, T011) | Sequence T006 → T009/T010 → T011. T010's sync trigger hooks the shell-phase render T006 creates, so T006 must land first. |
| `assets/js/views/drill.js` | US3 (T009), US4 (T016), US5 (T018) | Same handler/`draw()` region. Order: T009 → T016 → T018. |
| `assets/js/views/mock.js` | US3 (T009), US4 (T017), US5 (T019) | Same reveal/tick region. Order: T009 → T017 → T019. |
| `assets/js/views/dsa.js` | US4 (T014), US6 (T025, T026) | T014 replaces the rate-row; T025/T026 replace the scratchpad below it. Different regions, but do T014 first — T025 restructures the surrounding markup. |
| `assets/js/views/design.js` | US4 (T015), US8 (T054) | T054 rewrites `renderDetail()` wholesale, including the rate-row T015 touches. Do T015 first, or fold it into T054. |
| `assets/css/app.css` | US2 (T008), US3 (T012), US6 (T025), Polish (T055) | Additive/disjoint rule blocks; any order. T055 (cache-bust bump) must be last. |
| `index.html` | US2 (T007), US3 (T011), Polish (T055) | Disjoint elements; any order. T055 last. |
| `content/packs/dsa*.json` | US6 (T027-T035: `sampleCall`), US7 (T041: `shortAnswer`) | Field-disjoint — no ordering requirement. Consider one combined pass per file to avoid two diffs. |
| `content/packs/system-design*.json` | US7 (T042: `shortAnswer`), US8 (T049-T053: `clarifyingQuestions`/`requirements`) | Field-disjoint — no ordering requirement. Same combined-pass suggestion. |

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start immediately.
- **Foundational (Phase 2)**: depends on Setup. **Only blocks US2 and US3** (T002) **and the content
  batch gating for US6/US8** (T003) — every other story may start in parallel with Phase 2.
- **User Stories (Phases 3-11)**: proceed in priority order (P1 → P2 → P3) or in parallel by story, per
  the per-story notes below.
- **Polish (Phase 12)**: depends on all desired user stories being complete (T056/T057/T058 specifically
  need every content batch across US6/US7/US8 done first).

### User Story Dependencies

- **US1** (P1): independent — no dependency on Foundational or any other story.
- **US2** (P1): depends on **T002** (Foundational). **T007a** (dashboard skeleton placeholders) depends
  on T006 existing, since it gates on the shell-phase snapshot T006 introduces.
- **US3** (P1): depends on **T002** (Foundational, for the shell-phase render T010 hooks its check
  after) and internally, **T009** (sessionActive) before **T010** (the trigger that reads it).
  **T010a** (FR-011 short-circuit check) and **T010b** (FR-007a all-or-nothing) both verify/extend
  T010's rewritten sync path, so both come after T010.
- **US4** (P2): independent — no dependency on Foundational or any other story.
- **US5** (P2): independent of Foundational, but its two tasks (**T018**, **T019**) touch the same
  `drill.js`/`mock.js` regions **US4's T016/T017** modify — implement US4 before US5 to avoid a
  same-file merge conflict.
- **US9** (P2): fully independent — no dependency on anything else in this feature.
- **US6** (P3): **T022** (smoke test) should run before T025/T026 (editor/driver work) so no UI is built
  on an unconfirmed CORS assumption. The content batches (T027-T035) have no code dependency and may
  proceed in parallel with T022-T026, but rely on **T003** (Foundational) existing to be gated
  meaningfully.
- **US7** (P3): fully independent of every other story — its 13 track batches (T036-T048) may all run
  in parallel with each other and with US6/US8, including on the overlapping `dsa*.json`/
  `system-design*.json` files (different field, no shape conflict).
- **US8** (P3): content tasks **T050-T053** depend on **T049** (framework rewritten first — later packs
  reference it by name); the app-code task **T054** has no file dependency on the content tasks but
  relies on **T003** (Foundational) to gate the schema requirement.

### Parallel Opportunities

- All Setup/Foundational [P] tasks (T002, T003) run in parallel.
- US1's two tasks (T004, T005) — different files, run in parallel.
- US2's T006 depends on T002; T007/T008 are independent of each other and of T006 (different files).
- US3's T009/T012 are [P]; T010 depends on T009, T011 is independent of T009/T010 (all different files
  except T010/T011 both touching `app.js` — sequence T010 before T011 if working the same file by hand).
- US4's five tasks (T013-T017) — five different files, fully parallel.
- US6's nine content-batch tasks (T027-T035) — nine different files, fully parallel; independent of
  T022-T026 (app code).
- US7's thirteen track-batch tasks (T036-T048) — thirteen different file globs, fully parallel; the
  single largest parallel opportunity in this feature.
- US8's four non-framework pack tasks (T050-T053) — parallel with each other, once T049 lands.

---

## Parallel Example: User Story 7 (largest parallel batch)

```bash
# Once Setup is done, launch every track's shortAnswer rewrite together — no shared files, no ordering:
Task: "Rewrite shortAnswer in plain English across content/packs/kotlin-*.json"
Task: "Rewrite shortAnswer in plain English across content/packs/coroutines-*.json"
Task: "Rewrite shortAnswer in plain English across content/packs/compose-*.json"
Task: "Rewrite shortAnswer in plain English across content/packs/platform*.json"
Task: "Rewrite shortAnswer in plain English across content/packs/architecture*.json"
Task: "Rewrite shortAnswer in plain English across content/packs/dsa*.json"
Task: "Rewrite shortAnswer in plain English across content/packs/system-design*.json"
Task: "Rewrite shortAnswer in plain English across content/packs/data-networking*.json"
Task: "Rewrite shortAnswer in plain English across content/packs/performance*.json"
Task: "Rewrite shortAnswer in plain English across content/packs/build-testing*.json"
Task: "Rewrite shortAnswer in plain English across content/packs/security-kmp*.json"
Task: "Rewrite shortAnswer in plain English across content/packs/behavioral*.json"
Task: "Rewrite shortAnswer in plain English across content/packs/cheatsheets*.json"
```

## Parallel Example: User Story 4

```bash
# Five different view files, one action each — no shared state, no ordering:
Task: "Replace rate-row with Mark complete in assets/js/views/item.js"
Task: "Replace rate-row with Mark complete in assets/js/views/dsa.js"
Task: "Replace rate-row with Mark complete in assets/js/views/design.js"
Task: "Replace rate-row with Mark complete in assets/js/views/drill.js"
Task: "Replace rate-row with Mark complete in assets/js/views/mock.js"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3, all P1)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (US1), Phase 4 (US2), Phase 5 (US3) — independently, in parallel if staffed.
3. **STOP and VALIDATE**: run quickstart.md's US1/US2/US3 scenarios. This alone removes the laggy
   search, the blank cold-cache load, and every manual-update surface — the three most visible daily
   annoyances named in the spec's Input.

### Incremental Delivery

1. Setup + Foundational → MVP (US1, US2, US3) → validate → ship.
2. Add US4, US5, US9 (P2 — one-tap marking, timer pause, Lead rename) → validate independently → ship.
3. Add US6 (DSA Run) → validate → ship (the riskiest, most novel piece, scoped last per the spec).
4. Add US7 (plain-English rewrite) and US8 (system-design restructuring) — both proceed batch-by-batch
   and can be delivered incrementally across many small releases rather than one big-bang change; each
   batch is independently valid the moment `node tools/validate.mjs` exits 0 for it.
5. Polish: bump the manifest release version once all content batches land, run the `--final` regression
   gate, and do a full manual quickstart walkthrough.

### Parallel Team Strategy

With multiple contributors, after Foundational (T002/T003) lands:

- One contributor: US2 → US3 (shares `app.js`/`content.js` context from Foundational).
- One contributor: US1 (fully independent).
- One contributor: US4 → US5 → US9 (same-file sequencing within this group, as noted above).
- One contributor (or several, in parallel): US6's app-code tasks (T022-T026), while others pick up
  US6/US7/US8's content-batch tasks — these are the most parallelizable work in the whole feature
  (22 independent pack/track files across the three content stories).

## Notes

- [P] tasks touch different files with no incomplete-task dependency between them.
- [Story] labels map every task back to its spec.md user story for traceability.
- No task in this feature adds, removes, renumbers, or reuses an item id — content tasks only ever set
  `updatedIn` (never `addedIn`), per this repo's one non-negotiable invariant.
- The constitution's Principle III amendment (v1.0.0 → v1.1.0, permitting US3's silent auto-apply for
  non-destructive releases) is **already applied** as part of plan.md's own Constitution Check — it is
  not a task here.
- Content tasks across US6/US7/US8 touch overlapping pack files (`dsa*.json`, `system-design*.json`) —
  there's no schema conflict (each story owns a different field), but if the same person is authoring
  more than one of these stories' batches for the same pack, consider combining those edits into one
  pass over the file to avoid redundant diffs.
- Stop at any Checkpoint to validate a story independently before moving on — every phase above is
  designed to be shippable on its own.

---

## Phase 13: Convergence

- [X] T059 Implement FR-020a's re-run semantics in `assets/js/views/dsa.js`: allow pressing Run again
  while a previous run is in flight to abort that prior request (via the existing `AbortController`,
  which is currently only used for the 30s timeout) and start the new one, instead of the current
  `if (runBusy) return` + disabled-button no-op at lines 134-146 — only the newest run's result may
  ever render, per FR-020a, `dsa-run-contract.md`'s one-in-flight rule (lines 53-55), and
  quickstart.md US6 step 6, which cannot pass as written today (partial)
- [X] T060 Resolve the DSA code-execution provider decision and the FR-022a go/no-go gate: the T022
  smoke test was cancelled ("provider to change") yet the Run UI ships against
  `judge0-ce.p.rapidapi.com` on the spec's only load-bearing unverified assumption. Either re-run the
  direct-browser CORS smoke test against the current Judge0 integration and record the outcome, or
  apply the planned provider change across `assets/js/views/dsa.js`,
  `specs/002-improvements/contracts/dsa-run-contract.md`, `research.md` R-007, and `quickstart.md`
  US6 — per FR-022a, if the direct browser call proves impossible, drop US6 from the release and keep
  the existing notes area (partial)
  **Smoke-test outcome (2026-08-14, replaces T022's cancellation)**: the FR-022a direct-browser
  assumption is **proven**. OPTIONS preflight to `judge0-ce.p.rapidapi.com/submissions` with
  `Origin: http://localhost:8777` returns 200 with `access-control-allow-origin` echoing the origin,
  `access-control-allow-methods` including POST, and `access-control-allow-headers` covering
  `content-type, x-rapidapi-key, x-rapidapi-host` — exactly the request the app sends. An actual POST
  (no key → expected 401) carries the same allow-origin header on the real response path. Judge0 CE
  stays the provider; no integration change needed.
- [X] T061 Finish T021's label-hygiene pass: `.claude/AUTHORING.md:41` still reads "4 Staff" — change
  it to "Lead" so no "Staff/Monster"/"Monster" echo remains outside the historical spec docs, per
  SC-009/T021 (partial)
- [X] T062 Complete the manual US1-US9 browser walkthrough (quickstart.md scenarios — T058 remains
  open), after T059/T060 land, including the US6 FR-020a re-run scenario and the US2/US3
  cold-cache/offline/online simulations, per plan verification and FR-022/FR-032 (partial)
  **Automated headless walkthrough (2026-08-14, Chrome headless + CDP over `http://localhost:8777`,
  served snapshot v2026.08.17)**: US1 topics-filter debounce + no-match + clear-restore, search
  overlay settle + prompt state — PASS. US2 boot-status hidden after shell, dashboard from snapshot,
  629 items, no leftover shell placeholders — PASS. US3 no Update/Up-to-date strings, no What's New
  nav, `#/whatsnew` falls back to dashboard — PASS. US4 single Mark complete on item/dsa/design/
  drill/mock, no Again/Hard/Good/Easy — PASS. US5 drill clock advances while visible, frozen while
  revealed, resumes after mark; mock countdown frozen on reveal — PASS. US6 editor, enabled Run,
  needs-key state, fake-key 401 → needs-connection, button re-enabled, re-press works (FR-020a), code
  persists across navigation — PASS. US7 shortAnswer rendered — PASS. US8 Phase-1 Clarify ≥3
  questions, plan hidden → proceed → revealed — PASS. US9 level-4 chip reads Lead, no Staff/Monster —
  PASS. No console errors/warnings. Not automatable without a real key/DevTools: a live Judge0 run
  with the candidate's key, and the offline/online DevTools simulations (CORS reachability itself was
  proven in T060).
