# Tasks: Dashboard Progress Reflects Completed Questions

**Input**: Design documents from `/specs/007-dashboard-progress-sync/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: This repository has no test runner and none is added (constitution Principle V). The spec
*does* explicitly request verification (US6, FR-025, FR-026), which takes two forms and both are
tasked below: `tools/check-progress.mjs` (a dependency-free Node accounting check, also wired in as
gate 16 of `tools/validate.mjs`) and the written browser procedure in
[quickstart.md](./quickstart.md). No unit-test framework, no TDD ordering.

**Organization**: Tasks are grouped by user story. Note the shape of this feature honestly: it is a
defect fix whose whole correction is the extraction of **one pure module**
(`assets/js/progress.js`) plus the `srs.js` adapter over it. That extraction lands in Phase 2, so
the *behaviour* behind US3 (review-queue reachability) and US5 (local calendar date) is delivered
there rather than in its own phase. Those two phases therefore own the residual surface work, the
negative requirements (nothing written, no notice shown), and the verification that proves the
behaviour — and each is still independently testable exactly as its spec Independent Test states.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)

## Path Conventions

Implementation happens **one level up from this Spec Kit scaffold**, in the app repository at
`/Users/nn/InterviewPrep`. All source paths below are relative to that root (`assets/js/…`,
`tools/…`, `index.html`). Paths under `specs/007-dashboard-progress-sync/` are relative to
`/Users/nn/InterviewPrep/InterviewPrep`. Flat static site, no `src/`, no `tests/`, no build step.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Get onto the right branch with the one in-scope change that is already written, and
record the pre-change baseline the preservation criterion (SC-009) is measured against.

- [x] T001 Create branch `fix/007-dashboard-progress-sync` off `main` and carry the uncommitted FR-028 change to `assets/js/views/cheatsheets.js` (the `rate-row`, `#mark-complete` handler and status line, +18/−2) onto it, leaving `fix/006-ui-polish-fixes` untouched — per plan.md "Branch note"
- [x] T002 Record the pre-change baseline in `specs/007-dashboard-progress-sync/tasks.md` notes: run `node tools/validate.mjs` from `/Users/nn/InterviewPrep` and confirm it exits `0` with 15 gates, so gate 16's arrival is provably the only new verdict (contracts/check-progress-cli.md C6.3, C6.4)
- [x] T003 [P] Build the SC-009 preservation baseline: in the served app (`bash tools/serve.sh`) create a mixed history (some completions, some note-only records, one manual plan tick, one drill session, one mock result), then Settings → **⬇ Export progress.json** and save it as `before.json` outside the repo — per quickstart.md §E step 1. Also confirm `node -v` is ≥ 22.7, which `tools/check-progress.mjs` requires (research.md §2)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the single definition of completion and make `srs.js` a thin adapter over it.
Every user story reads through this module; FR-006 forbids any surface computing these values
itself, so nothing downstream can start until it exists.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

**Note on ordering**: `assets/js/progress.js` is one file, so T004–T009 are sequential. T011's
removal of `masteryByTrack` breaks the `dashboard.js` and `plan.js` import lines immediately, so
T012 is its mandatory same-commit partner — the app must never be left unable to load a view.
Likewise T013 must land with T011, because `statusOf` starts returning `not-started`/`completed` the
moment the adapter delegates and the old `.status-dot--new`/`--learning`/`--known`/`--due` rules
would leave every dot unstyled.

- [x] T004 Create `assets/js/progress.js` with the module header documenting invariants C0.1–C0.6 (imports nothing, touches no storage or DOM, no module-scope side effects, every function pure, no bare `Date` in a comparison path, no hard-coded track names), and implement `isCompletedRecord(record)` and `isCompleted(progress, id)` — `isCompleted` defined in terms of `isCompletedRecord` so there is one predicate, not two (contracts/progress-api.md C1, FR-001–FR-005, FR-018)
- [x] T005 Add `statusOf(progress, id)` returning exactly `'completed' | 'not-started'` (kebab-case, doubling as CSS class suffix and Topics `?status=` value) and `isDrillable(item)` (`item.type !== 'dsa' && item.type !== 'design'`) to `assets/js/progress.js` (contracts/progress-api.md C2, C3, FR-015, FR-010)
- [x] T006 Add `todayLocalISO(date = new Date(), offsetDays = 0)` to `assets/js/progress.js`: formats from `getFullYear()`/`getMonth()`/`getDate()` with zero-padding, **never** `toISOString()`; advances whole local calendar days via a **cloned** `Date` so the argument is not mutated; result is `<=`-comparable with stored `due` strings (contracts/progress-api.md C4, FR-020)
- [x] T007 Add `coverageByTrack(items, progress)`, `coverageTotals(items, progress)` and `notCompleted(items, progress)` to `assets/js/progress.js`: totals counted over `items` and never over `Object.keys(progress)`, `completed + notStarted === total` per track, `pct = total === 0 ? 0 : Math.round((completed / total) * 100)` with no clamp needed, orphan records contributing to nothing (contracts/progress-api.md C5–C7, FR-007, FR-008, FR-012, FR-016, edge cases 1–2)
- [x] T008 Add `dueCountOf(items, progress, today = todayLocalISO())` and `reviewQueue(items, progress, today = todayLocalISO(), limit = Infinity)` to `assets/js/progress.js`. The queue must classify with **one** `isCompleted` test and two branches — due (`isCompleted && record.due <= today`, sorted by `due` ascending) then pending (`!isCompleted`, input order) — so the buckets are complementary and exhaustive and a note-only record provably lands in `pending` rather than falling out of both (contracts/progress-api.md C8, C9.1–C9.4, FR-010, FR-017, FR-018)
- [x] T009 Add `weakestTracks(coverage, limit = Infinity)` to `assets/js/progress.js`: tracks with `total > 0` only, sorted `pct` ascending, then `total` descending, then track name ascending — deterministic and non-empty on an all-zero fresh history (contracts/progress-api.md C10, research.md §10, SC-007, US4 #3)
- [x] T010 Review `assets/js/progress.js` against every C0 invariant before any consumer is wired: zero `import` statements, zero references to `Store`/`localStorage`/`indexedDB`/`document`/`window`/`location`/`fetch`, no `Date.now()` or bare `new Date()` inside a comparison path, no mutation of the `items` or `progress` arguments, no hard-coded track name, count or total — this is quickstart.md step V0 and a violation of C0.1/C0.2 breaks the Node check outright
- [x] T011 Rewrite `assets/js/srs.js` as the storage-bound adapter over `assets/js/progress.js` (contracts/progress-api.md C11): keep the module path and the currently-imported export names; `rate()` keeps its interval maths and still writes the vestigial `status` field for record-shape stability but takes its `due` from `todayLocalISO(new Date(), interval)`; `statusOf`, `isDue`, `buildQueue`, `dueCount` each read `Store.getProgress()` once and delegate; `masteryByTrack` is **removed, not aliased**, and `coverageByTrack(items)` replaces it. Reimplement none of the rules — the adapter holds storage access only. `rate()` continues to return the stored record and to **throw** `StorageFailure` on a failed write
- [x] T012 Re-point the two former `masteryByTrack` call sites mechanically so the module graph resolves in the same commit as T011: the import line and usages in `assets/js/views/dashboard.js` (lines 4, 41, 50, 135 — `m.known` → `m.completed`) and `assets/js/views/plan.js` (lines 4, 47, 50, 82). Figures, labels and copy are US1/US2 work; this task only keeps every view loadable
- [x] T013 Replace the status-dot rules in `assets/css/app.css` (lines 216–219): drop `.status-dot--new`, `--learning`, `--known`, `--due` and add `.status-dot--not-started` (`var(--blue)`) and `.status-dot--completed` (`var(--accent)`); rename `.mastery-row` and `.mastery-row + .mastery-row` (lines 226–227) to `.coverage-row`, widening the grid to `160px 1fr 96px` so `12/70 · 17%` fits. Leave the print block at line 352 alone — `.rate-row` is already hidden in print (contracts/ui-surfaces.md S5)
- [x] T014 [P] Bump `assets/css/app.css?v=8` → `?v=9` in `index.html` line 8 — pairs with T013, since a stale cache here shows unstyled dots (CLAUDE.md cache-busting rule)

**Checkpoint**: `assets/js/progress.js` holds the single definition and passes its C0 self-review;
every view still loads; `node tools/validate.mjs` still exits `0` (15 gates — gate 16 arrives in
US6). The dashboard bars already move on the first completion, though their labels still say
"mastery" and "known". User story work can now begin.

---

## Phase 3: User Story 1 - Completed questions show up as progress (Priority: P1) 🎯 MVP

**Goal**: The dashboard's per-track bars and headline counter report exactly the questions the
candidate has marked complete — immediately, once each, with a loading state instead of a false
zero, current as of the moment the surface is displayed, and never counting a completion that failed
to save.

**Independent Test**: From cleared learning history (quickstart.md fixture **F0**), mark a known
number of questions complete in one track, return to the dashboard, and confirm the track's bar and
the headline counter both report exactly that number and its correct percentage of the track total.
Delivers the working progress readout with no other story implemented.

- [x] T015 [US1] Rewrite the hero summary line in `assets/js/views/dashboard.js` (line 64) to `Snapshot v… · 629 questions · 12 completed · 617 not started` from `coverageTotals(snapshot.items, progress)`, so the two visible parts add to the total; delete the `knownCount` (`p.status === 'known'`) and `seenCount` (`Object.keys(progress).length`) computations at lines 38–39 — the latter is the one place today that counts over progress keys and so counts orphan records. Shell phase renders `—` for all three (contracts/ui-surfaces.md S1.1, S6, FR-008, FR-009, FR-011, FR-012)
- [x] T016 [US1] Rewrite the coverage card in `assets/js/views/dashboard.js` (lines 130–143): eyebrow `Coverage by track`, `.coverage-row` markup, trailing cell `${m.completed}/${m.total} · ${m.pct}%` from `coverageByTrack`, rows ordered by `total` descending as today, tracks with `total === 0` omitted, all 13 tracks otherwise present including `dsa` and `system-design`, loading copy `Loading track coverage…` (contracts/ui-surfaces.md S1.4, FR-007, FR-012, SC-012)
- [x] T017 [US1] Rewrite the review-queue card in `assets/js/views/dashboard.js` (lines 89–93) to compute its figure as `dueCountOf(snapshot.items.filter(isDrillable), progress)` — 550 of 629 questions, not all 629 — with heading `7 due for review` and the three faint variants from the contract (`due > 0`, `due === 0`, loading), so the adjacent **Start drill →** button can drive the figure to zero (contracts/ui-surfaces.md S1.2, FR-010, SC-013)
- [x] T018 [US1] Rewrite the free-study Today card in `assets/js/views/dashboard.js` (lines 111–113, 128): heading `7 due for review · 617 of 629 not started` with `notCompleted(snapshot.items, progress)` replacing the `unseen` computation at line 47, plus the faint line naming both populations (`Due counts your review queue — DSA and System Design have their own workspaces and are not in it. Not started counts the whole library.`); empty-state copy becomes `You have completed every question — drill what is due.` (contracts/ui-surfaces.md S1.3, FR-016)
- [x] T019 [US1] In `assets/js/views/item.js`: render the status line (line 84) as `Status: Completed · next review 2026-08-23` / `Status: Not started` instead of printing the raw `statusOf` token, and wrap the `#mark-complete` handler's `rate()` call (line 95) in `try`/`catch` so a `StorageFailure` shows no "Marked complete" toast and leaves the status line reading `Not started` — the persistent storage banner `store.js` already raises is the candidate's notice (contracts/ui-surfaces.md S4, research.md §12, FR-024, US1 #10)
- [x] T020 [P] [US1] Guard the `rate()` call in the `#mark-complete` handler of `assets/js/views/drill.js` (lines 107–117) with `try`/`catch`: on failure do **not** absorb paused time, do **not** increment `completed`, do **not** advance `i`, do **not** `draw()` — a frozen card with the banner is correct; a counted completion that was never stored is not (FR-024)
- [x] T021 [P] [US1] Guard the `rate()` call in the `#mark-complete` handler of `assets/js/views/mock.js` (lines 167–172) the same way: no `completedCount++`, no `idx++`, no `draw()` on a failed write (FR-024)
- [x] T022 [P] [US1] Guard the `rate()` call in `assets/js/views/dsa.js` (lines 115–118): no success toast on `StorageFailure` (FR-024)
- [x] T023 [P] [US1] Guard the `rate()` call in `assets/js/views/design.js` (lines 208–211): no success toast on `StorageFailure` (FR-024)
- [x] T024 [P] [US1] Guard the `rate()` call in the cheat-sheet `#mark-complete` handler in `assets/js/views/cheatsheets.js`: no success toast and no re-render claiming completion on `StorageFailure` (FR-024, FR-028)
- [x] T025 [US1] In `assets/js/app.js#navigate()` (lines 118–124), call `render()` directly when the composed hash equals `location.hash` instead of assigning it — assigning an identical hash fires no `hashchange`, which is why pressing **Dashboard** while on the dashboard is currently a no-op and the figures stay as they were on arrival (research.md §9, contracts/ui-surfaces.md S7, FR-021, US1 #8)
- [x] T026 [US1] In `assets/js/views/topics.js`, switch the debounced keyword sync (`debouncedSync` → `syncQuery`, line ~112) from `navigate()` to `history.replaceState()`. **Must land with T025**: without it, typing and deleting back to the original text makes the synced hash equal the current one, T025's force-render fires mid-typing, `el.innerHTML` replaces the input and focus and caret are lost. The track/level/status selects keep using `navigate()` — a `change` event means the value genuinely differs (research.md §9)
- [x] T027 [US1] Verify User Story 1 end to end against `specs/007-dashboard-progress-sync/quickstart.md` §B, scenarios 1–8 and 10 (fixtures F0, F1, F4, F5, the cold-start IndexedDB clear, the second-tab freshness check, and the `Storage.prototype.setItem` failure stub), confirming each stated expected result

**Checkpoint**: User Story 1 is fully functional and independently testable. The reported defect is
fixed: a first-day completion moves the bar, where it previously took 32 days.

---

## Phase 4: User Story 2 - Every surface agrees on what "completed" means (Priority: P2)

**Goal**: The study plan, the Topics browser and the two workspace lists classify the same material
the same way the dashboard does, with every figure labelled by the population it counts and no
unreachable filter option left on offer.

**Independent Test**: Complete every question behind one study-plan task, then compare that task's
tick state, the dashboard bars, the plan's own per-track counts, and the Topics status filter — all
four must classify that same material identically.

- [x] T028 [US2] Change `autoDone(task)` in `assets/js/views/plan.js` (lines 131–135) from `ids.every(id => progress[id])` to `ids.every(id => isCompleted(progress, id))`. `manualMark` keeps precedence in both directions and no stored tick is written, cleared or re-keyed — tick identity stays the material signature from `store.js#signature()` (FR-013, FR-019, data-model.md §1.3)
- [x] T029 [US2] Rewrite the three free-study cards in `assets/js/views/plan.js` (lines 63–86): card 1 `Due for review` from the same `dueCountOf(items.filter(isDrillable), progress)` call the dashboard makes, with the faint line naming the workspace exclusion; card 2 `Not started` replacing the `Unseen` card and its "Items you have not rated yet" copy, from `coverageTotals(...).notStarted`; card 3 rows reading `12/70 completed` instead of `${m.known}/${m.total} known`, empty state `Mark a few questions complete to see this.` (contracts/ui-surfaces.md S2.1, FR-014, FR-016)
- [x] T030 [US2] Update the dated-plan copy in `assets/js/views/plan.js`: the `auto` chip tooltip becomes `Auto-completed: every question this task links to is marked complete` (was "…has been rated"), and the Next up muted line (line 89) becomes `Questions you have not completed, from the tracks you have covered least.` (contracts/ui-surfaces.md S2.2)
- [x] T031 [US2] Rewrite the status filter in `assets/js/views/topics.js` (lines 95–101) to exactly four options — `all`, `not-started`, `completed`, `new-content` — dropping `Learning`, `Due for review` and `Known` (the last being the option that could not match anything for 32 days), and make any `?status=` value outside those four fall back to `all` so legacy bookmarks like `#/topics?status=known` show the library rather than an empty result (contracts/ui-surfaces.md S3.1, research.md §8, FR-015, SC-006)
- [x] T032 [US2] Update the per-question status indicator and header in `assets/js/views/topics.js`: the dot at line 65 uses the two-state class from `statusOf`, the filter comparison at line 30 matches the two-state value, and the header line at line 83 reads `142 of 550 questions match your filters.` — "questions", not "items" (contracts/ui-surfaces.md S3.2, FR-015)
- [x] T033 [P] [US2] Update the list status dot in `assets/js/views/dsa.js` (line 28) to the two-state class, so the workspace list cannot keep a four-state reading (FR-006)
- [x] T034 [P] [US2] Update the list status dot in `assets/js/views/design.js` (line 27) to the two-state class (FR-006)
- [x] T035 [P] [US2] In `assets/js/views/cheatsheets.js`, render the sheet status line as `Status: Completed · next review …` / `Status: Not started` instead of the raw token (line 27), and use the two-state class for the sheet-card dots (line 50) (contracts/ui-surfaces.md S4, FR-006)
- [x] T036 [US2] Verify User Story 2 against `specs/007-dashboard-progress-sync/quickstart.md` §C, scenarios 1–6 including 4b, then run the per-track cross-check: for each of the 11 Topics tracks confirm dashboard `n/total` = plan weakest-track `n/total` = Topics *Completed* count, and for `dsa` and `system-design` confirm dashboard = plan (SC-003, SC-004, SC-013)

**Checkpoint**: User Stories 1 and 2 both work. Every surface in the product reports one definition
of completion, and every figure on screen names what it counts.

---

## Phase 5: User Story 3 - Notes are notes, not completions (Priority: P3)

**Goal**: Saving a note records the note and nothing else: it does not count as completion, does not
tick a plan task, and — the serious half — never removes the question from review.

**Independent Test**: On a fresh question, type a note and save it without marking it complete.
Confirm the note persists, the question is not counted as completed anywhere, any plan task linked
to it stays unticked, and the question still appears in the review queue.

**Behaviour already delivered**: T008's exhaustive queue bucketing and T011's `buildQueue`
delegation close the FR-017 leak; T028 stops a note from ticking a plan task. This phase owns the
negative requirements — that nothing is written and nothing is announced — and the proof.

- [x] T037 [US3] Confirm the note-saving path in `assets/js/views/item.js` (the `#notes` `change` handler, line ~98) still writes only `{ notes }` through `Store.setItemProgress`, which merges, so a note can never introduce a `due` field and therefore can never read as a completion. Add no write and no `rate()` call here. Also confirm `Store.setScratch` (`aip.v1.scratch.<id>`, used by `dsa.js` and `design.js`) remains a separate key that cannot create a progress record at all — which is what makes FR-005's "code draft or checklist tick must not count" hold by construction (data-model.md §1.2, §1.4, FR-005, FR-018)
- [x] T038 [US3] Confirm FR-019's correction is silent: review the full branch diff and verify no `toast()`, `showModal()`, banner, confirmation or decline path was added for it, and that no code writes, clears or re-keys `aip.v1.progress` or `aip.v1.plan.done` in service of it — the corrected reading is derived at render time from records already on the device (research.md §7, FR-019, FR-022)
- [x] T039 [US3] Verify User Story 3 against `specs/007-dashboard-progress-sync/quickstart.md` §D "User Story 3", scenarios 1–5 — including fixture **F2** (a note-only record already on disk), confirming the question is offered in the drill again, any plan task that read as done because of it now reads as not done, the note is still in the textarea, the checkbox is still tickable by hand, and **no notice appears** (SC-005)

**Checkpoint**: Note-only questions are back in the review queue and count as progress nowhere.

---

## Phase 6: User Story 4 - Recommendations point at genuinely weak tracks (Priority: P4)

**Goal**: The weakest-track ranking and "Next up" are ordered by real coverage, so the next thing
offered is the thing most worth doing — replacing an ordering that was identical for every track.

**Independent Test**: Complete most questions in one track and none in another, then confirm the
uncovered track is listed as weaker and that "Next up" draws from it.

- [x] T040 [US4] Replace the inline weakest-track sort in `assets/js/views/dashboard.js` (lines 48–55) with `weakestTracks(coverage, 3)` and source "Next up" from `notCompleted(snapshot.items, progress)` filtered to those tracks, 2 per track, 5 maximum — so a fully completed track contributes nothing and a merely-noted question is now offered (contracts/ui-surfaces.md S1.5, US4 #2, US4 #4)
- [x] T041 [US4] Replace the inline weakest-track sort in `assets/js/views/plan.js` (lines 48–52) with the same shared `weakestTracks(coverage, 4)` ordering and source its Next up list from `notCompleted`, so the plan and the dashboard rank tracks identically rather than by two copies of the same expression (FR-006, FR-014)
- [x] T042 [US4] Verify User Story 4 against `specs/007-dashboard-progress-sync/quickstart.md` §D "User Story 4", scenarios 1–4 (fixtures **F3** uneven and **F5** full track), including reloading three times on **F0** to confirm the fresh-history suggestion set is non-empty and identical each time (SC-007)

**Checkpoint**: The "personalised" claim on both surfaces is now true.

---

## Phase 7: User Story 5 - Due dates follow the candidate's own calendar day (Priority: P4)

**Goal**: "Tomorrow" means tomorrow where the candidate is sitting, on both sides of the comparison
— the `due` that `rate()` writes and the `today` every read compares against.

**Independent Test**: With the device clock inside the small hours in a timezone offset from UTC,
confirm the due count and the review queue agree with the candidate's local calendar date.

**Behaviour already delivered**: T006's `todayLocalISO` and T011's use of it on both the write and
read sides. This phase owns the sweep that proves no UTC arithmetic survives, plus the browser
spot-check.

- [x] T043 [US5] Sweep `assets/js/` for surviving UTC date arithmetic in any due comparison: `grep -rn "toISOString().slice(0, 10)" assets/js/` must return no hit that participates in a `due` comparison, and `assets/js/srs.js` must hold no local `todayISO` helper of its own. `lastRated: new Date().toISOString()` is a full timestamp, not a calendar date, and stays as it is (FR-020, contracts/progress-api.md C4)
- [x] T044 [US5] Verify User Story 5 against `specs/007-dashboard-progress-sync/quickstart.md` §D "User Story 5", scenarios 1–3, using DevTools → Sensors → Timezone ID `Asia/Tokyo` and `America/Los_Angeles` (OS timezone change as the documented fallback). §A's `local calendar` assertion group covers all 24 hours in both zones exhaustively; this is the browser-path spot-check (SC-008)

**Checkpoint**: All five candidate-facing stories are complete and independently verified.

---

## Phase 8: User Story 6 - The progress accounting can be re-verified on demand (Priority: P5)

**Goal**: One dependency-free check, runnable on its own and also run by the command that already
gates a release, that proves the accounting adds up **and** proves it can fail — by re-running the
identical assertion battery against six stand-ins for the defects this spec describes.

**Independent Test**: Run the check against a synthetic history with known expected counts and
confirm it reports pass; change one count deliberately and confirm it reports failure.

- [x] T045 [US6] Create `tools/check-progress.mjs`: `node:fs`/`node:path`/`node:url` imports only plus the relative import of `assets/js/progress.js`; the import attempted inside `try`/`catch` so a runtime older than Node 22.7 produces an actionable message rather than a stack trace and exit code `2`; `process.env.TZ` captured on entry and restored in a `finally`; writes no file and mutates no working tree (contracts/check-progress-cli.md C1.1–C1.6, C2.4)
- [x] T046 [US6] Build the in-memory fixtures in `tools/check-progress.mjs` per data-model.md §3: a ~30-question synthetic library across 4 named tracks plus one empty track, one `dsa`-typed and one `design`-typed question; and the histories — fresh `{}`, known-uneven counts, note-only `{ notes: 'hook' }`, re-rated (5×, `due` far future), past-due, and an orphan record whose id is absent from the library. All dates injected, never read from the wall clock (C1.5)
- [x] T047 [US6] Add the assertion runner to `tools/check-progress.mjs` — every group runs against an **implementation object** (`{ isCompleted, statusOf, coverageByTrack, coverageTotals, reviewQueue, dueCountOf, weakestTracks, notCompleted, todayLocalISO, isDrillable }`) so the identical battery can be pointed at the real module or at a defect stand-in — plus the `completion` group: no record → not completed; note-only → not completed; one rating → completed; five ratings → completed and counted once; past-due → still completed; `{ status: 'known' }` with no `due` → **not** completed (the vestigial-field assertion); `statusOf` returns only the two documented values (contracts/check-progress-cli.md C4, FR-001–FR-005, FR-015, FR-018)
- [x] T048 [US6] Add the `coverage` group to `tools/check-progress.mjs`: per-track `completed`/`total`/`pct` against the known fixture counts; `completed + notStarted === total`; `pct` bounded 0–100; `total === 0` yields `pct 0` and no throw; the orphan record is ignored; a day-one history yields a **non-zero** figure (the SC-002 assertion, and the one D1 must fail); an all-complete track reads 100% (FR-007, FR-008, FR-012, SC-001–SC-003)
- [x] T049 [US6] Add the `review queue` group to `tools/check-progress.mjs`: a note-only record is offered; completed-and-not-due is not; completed-and-due is, oldest first; `dueCountOf` equals the due-bucket size for the same arguments; the classification is exhaustive — no fixture item is missing from all three states; `dsa`/`design` are excluded once the drillable filter is applied; clearing the queue drives the count to 0 (FR-010, FR-017, FR-018, SC-005, SC-013)
- [x] T050 [US6] Add the `local calendar` group to `tools/check-progress.mjs`: 24 local hours × `Asia/Tokyo` and `America/Los_Angeles`, each compared against `toLocaleDateString('sv-SE')` as an independent oracle; `offsetDays` across a month and a year boundary; the input `Date` is not mutated; a completed question with a 1-day interval becomes due exactly when the next local day starts. The group sets `process.env.TZ` and then **verifies the change took effect** (a fixed UTC instant's local hour must shift) — recording a failure if it did not, because under an ambient `TZ=UTC` the D4 defect is genuinely undetectable and must never pass by not having been exercised (FR-020, SC-008)
- [x] T051 [US6] Add the `ranking` group to `tools/check-progress.mjs`: the uneven fixture ranks ascending by coverage; an all-zero history is deterministic and non-empty; a 100% track ranks last and yields no `notCompleted` items; zero-total tracks are excluded (SC-007, US4)
- [x] T052 [US6] Add the `live library` group to `tools/check-progress.mjs`: read the real `content/manifest.json` and its registered packs and assert only **structural** invariants — per-track totals equal the sum of their packs, drillable + workspace items equal the library total, every registered track is non-empty, an empty history yields 0% for every track. Every figure derived from content, none hard-coded, so content growth cannot fail the check spuriously (FR-012, SC-003, contracts/check-progress-cli.md C0.6/C4)
- [x] T053 [US6] Add the six defect stand-ins to `tools/check-progress.mjs` and run each through the whole battery: **D1** `isCompleted = record.interval >= 21`, **D2** `isCompleted = Boolean(record)`, **D3** `reviewQueue` buckets on record existence so a note-only record falls out of both, **D4** `todayLocalISO = date.toISOString().slice(0, 10)`, **D5** coverage counted over `Object.keys(progress)`, **D6** `dueCountOf` ignores the drillable filter. Record which assertion caught each; a stand-in with `caughtBy === null` is itself appended to `failures`, because a defect no assertion catches means the battery has a hole (contracts/check-progress-cli.md C5, C2.3, SC-010)
- [x] T054 [US6] Export `runProgressChecks()` from `tools/check-progress.mjs` returning `{ passed, failures, defects }`: it must not call `process.exit`, must not write to stdout or stderr when imported, and must not throw for an assertion failure — a failure is a string in `failures`, and it may only reject if the runtime itself is unusable (contracts/check-progress-cli.md C2.1–C2.4)
- [x] T055 [US6] Add `main()` to `tools/check-progress.mjs`, guarded by an `import.meta.url`/`process.argv[1]` comparison so importing the module never runs it: prints the report in `validate.mjs`'s existing `✓`/`✗` vocabulary per contract C3 (per-group counts with the requirement ids they cover, the `defect stand-ins` block, a failure line naming assertion, expected and actual), supports `--verbose` to list each passing assertion, and exits `0` all-clear / `1` any failure or uncaught stand-in / `2` unable to run
- [x] T056 [US6] Wire gate 16 into `tools/validate.mjs` after gate 15 and before the summary block, in the file's existing idiom: `import { runProgressChecks } from './check-progress.mjs';`, then `await` it and route each failure through the existing `err()` helper prefixed `gate 16 `, printing the pass line otherwise. Gate 16 is an **error** in both default and `--final` mode — it is app-code arithmetic, not content mid-expansion, so there is no legitimate window in which it should fail — and it must not change any existing gate's verdict, output or numbering (contracts/check-progress-cli.md C6.1–C6.4, FR-025)
- [x] T057 [US6] Verify User Story 6 against `specs/007-dashboard-progress-sync/quickstart.md` §A: `node tools/check-progress.mjs` exits `0` with `All good — N assertions, 6/6 defect stand-ins caught`; every `D1`–`D6` line names a catching assertion; two consecutive runs are byte-identical; `grep -n "require\|from '" tools/check-progress.mjs` shows only the standard-library and relative imports; then break `isCompletedRecord` to `rec.interval >= 21`, confirm both the standalone check and `node tools/validate.mjs` exit `1` and name the mismatch, and **revert** (SC-010)

**Checkpoint**: The accounting is protected by the same gate that already decides whether the
product is shippable. All six user stories are complete.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [x] T058 [P] Sweep the retired vocabulary out of user-visible text and class names: `grep -rn "mastery\|Mastery\|known\|Known\|learning\|Learning\|touched\|unseen\|Unseen" assets/js/ assets/css/app.css index.html` and confirm every remaining hit is either the `status: 'known' | 'learning'` value `rate()` still writes for record-shape stability (read by nothing) or genuinely unrelated prose. Leaving the word "mastery" on a class name is how the retired definition survives a refactor (FR-009, contracts/ui-surfaces.md S5)
- [x] T059 [P] Audit the branch diff for any new write path to learning state: no added `Store.setItemProgress`, `Store.setProgress`, `Store.setPlanState` or `migrateTicks` call outside the candidate's own deliberate actions (marking complete, saving a note, ticking a task), which are unchanged. The whole correction must be read-time (FR-022, FR-023, constitution Principle II)
- [x] T060 Run the SC-009 preservation comparison in `specs/007-dashboard-progress-sync/quickstart.md` §E: export `after.json` and diff it against T003's `before.json` with the supplied `node -e` script. Required result — `progress records changed: 0`, and `plan.done`, `plan.checked` and `mockResults` all identical. Any reported change means FR-022/FR-023 is violated and the feature must not ship. Then confirm the *reading* changed as intended: pre-existing completions now count, and note-only questions are back in the queue
- [x] T061 Work the edge-case table in `specs/007-dashboard-progress-sync/quickstart.md` §F: fixture **F6** orphan record (counted nowhere, no percentage over 100%), zero-total track, content arriving mid-study (a bar legitimately drops below 100% and is not frozen), library still loading, import of a pre-change export, a note on an already-completed question, workspace questions in coverage but not in the due figure, the cheat-sheet **Mark complete** action present in the view and **absent** from print preview (⌘P), and the failed-write banner
- [x] T062 Complete the §G sign-off table in `specs/007-dashboard-progress-sync/quickstart.md`, confirming every one of SC-001 to SC-013 against the section that evidences it, and restore your own `progress.json` via Settings → *Import*
- [x] T063 [P] Update `/Users/nn/InterviewPrep/CLAUDE.md`: `validate.mjs` now carries **16** gates (gate 16 is an error in both modes, never staged), the shared-modules list gains `progress.js` (the single pure definition — `isCompleted`/`coverageByTrack`/`reviewQueue`/`weakestTracks`/`todayLocalISO`, imports nothing), and the `srs.js` description becomes the storage adapter with `masteryByTrack` gone. Add `node tools/check-progress.mjs` to the Commands block
- [x] T064 Run `node tools/validate.mjs` from `/Users/nn/InterviewPrep` and confirm it exits `0` and prints `✓ gate 16 progress accounting: N assertions, 6/6 defect stand-ins caught`, with no existing gate's verdict changed from T002's baseline (contracts/check-progress-cli.md C6.3, C6.4)
- [x] T065 Record per-task completion in `specs/007-dashboard-progress-sync/tasks.md` (this file), matching the convention features 001–006 follow — this file is where the completion record lives
- [x] T066 Commit the branch and open the PR against `main`, noting in the body that no content pack, plan file, manifest entry or item id was touched and therefore no manifest `version` bump is required

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies. T003's `before.json` must be captured on the **pre-change**
  build, so it cannot be deferred past Phase 2.
- **Foundational (Phase 2)**: depends on Setup. **Blocks every user story** — every figure in the
  product reads through `assets/js/progress.js`.
- **US1 (Phase 3)**: depends on Phase 2 only. This is the MVP.
- **US2 (Phase 4)**: depends on Phase 2. Independently testable, though its cross-check in T036
  compares against the dashboard, so running it after US1 is the cheaper order.
- **US3 (Phase 5)**: depends on Phase 2 for the queue fix and on T028 (US2) for the plan-tick half
  of its Independent Test. Its own tasks are independent.
- **US4 (Phase 6)**: depends on Phase 2. T040/T041 touch files US1/US2 also touch, so it follows
  them rather than running beside them.
- **US5 (Phase 7)**: depends on Phase 2 only. Fully independent of US1–US4.
- **US6 (Phase 8)**: depends on Phase 2 (it imports the same module). Independent of US1–US5, since
  it never loads a view — it can be built in parallel with the whole browser-facing half.
- **Polish (Phase 9)**: depends on all six stories.

### Within Phase 2

T004 → T005 → T006 → T007 → T008 → T009 → T010 are strictly sequential (one file). T011 depends on
T004–T009. **T012 must land in the same commit as T011** (the `masteryByTrack` removal breaks two
import lines). **T013 must land with T011** (`statusOf`'s return set changes the moment the adapter
delegates). T014 pairs with T013.

### Within the user stories

- Phase 3: T015 → T016 → T017 → T018 are sequential (all `dashboard.js`). T019 is `item.js` and
  independent of those. T020–T024 are five different files and fully parallel. **T025 and T026 land
  together** — T025 alone introduces the focus-loss defect T026 prevents. T027 last.
- Phase 4: T028 → T029 → T030 are sequential (all `plan.js`). T031 → T032 are sequential (both
  `topics.js`) and independent of the `plan.js` chain. T033–T035 are three different files and
  parallel. T036 last.
- Phase 5: T037, T038 independent; T039 last.
- Phase 6: T040 (`dashboard.js`), T041 (`plan.js`) are different files but both follow US1/US2's
  edits to those files; T042 last.
- Phase 7: T043 → T044.
- Phase 8: T045 → T046 → T047 (the runner) → then T048, T049, T050, T051, T052 each add a group to
  the same file, so sequential in practice → T053 → T054 → T055 → T056 → T057.
- Phase 9: T058, T059, T063 are parallel; T060 → T061 → T062 are a single browser pass; T064 → T065
  → T066 close it out.

### Parallel Opportunities

- **T013 ‖ T014** — stylesheet and `index.html` (must both land with T011).
- **T020 ‖ T021 ‖ T022 ‖ T023 ‖ T024** — the five save-failure guards, five separate view files.
- **T033 ‖ T034 ‖ T035** — the three two-state status indicators outside Topics.
- **Phase 8 ‖ Phases 3–7** — `tools/check-progress.mjs` shares no file with any view and loads no
  browser. One person can build the check while another re-points the surfaces.
- **T058 ‖ T059 ‖ T063** — two greps and a docs edit.

---

## Parallel Example: User Story 1

```bash
# After T015-T019, launch the five save-failure guards together (FR-024) — five separate files:
Task: "Guard the rate() call in assets/js/views/drill.js — no advance, no counter on failure"
Task: "Guard the rate() call in assets/js/views/mock.js — no advance, no counter on failure"
Task: "Guard the rate() call in assets/js/views/dsa.js — no success toast on failure"
Task: "Guard the rate() call in assets/js/views/design.js — no success toast on failure"
Task: "Guard the rate() call in assets/js/views/cheatsheets.js — no success toast on failure"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1: Setup — get on the branch, capture `before.json` on the pre-change build.
2. Phase 2: Foundational — `assets/js/progress.js` + the `srs.js` adapter + the stylesheet. **This
   is the feature**; everything after it is re-pointing and copy.
3. Phase 3: User Story 1.
4. **STOP and VALIDATE**: run quickstart.md §B (T027). The reported defect is fixed — a first-day
   completion moves the bar, where it previously took 32 days.
5. Ship-able at this point: the dashboard tells the truth. The plan and Topics still show their own
   labels, but they now read the same underlying definition, so no surface contradicts another on
   the *numbers*.

### Incremental Delivery

1. Setup + Foundational → the single definition exists, the app loads, bars already move.
2. + US1 → the dashboard is correct and labelled (**MVP**).
3. + US2 → every surface agrees, and the unreachable *Known* filter is gone.
4. + US3 → note-only questions are back in the review queue.
5. + US4 → recommendations are genuinely personalised.
6. + US5 → due dates match the candidate's calendar at every hour.
7. + US6 → the accounting is protected by the release gate.
8. + Polish → preservation proven (SC-009), vocabulary swept, docs current.

### Parallel Team Strategy

Phase 2 is one file and one adapter — one person, no split. After it:

- Developer A: US1 → US2 → US4 (the `dashboard.js`/`plan.js`/`topics.js` chain, in that order,
  since they share files).
- Developer B: US6 in full (`tools/check-progress.mjs` + gate 16) — shares no file with A.
- Developer C: US3 + US5 (both small, both mostly confirmation and verification), then joins the
  Phase 9 browser pass.

---

## Notes

- **[P] means different files.** Three of the four largest files in this feature —
  `dashboard.js`, `plan.js`, `topics.js` — are each touched by two or three stories, so their tasks
  are deliberately sequential across phases rather than marked parallel.
- **Nothing stored is written, migrated or removed by this feature.** Every corrected figure is
  derived at render time from records already on the device. T059 and T060 are the tasks that prove
  it; a non-zero diff in T060 blocks the release.
- **No content file is touched** — no pack, no `content/manifest.json`, no `content/plans/*.json`,
  no item id. Therefore no manifest `version` bump, and `releases[]` gains no entry.
- **`status: 'known' | 'learning'` keeps being written by `rate()` and read by nothing.** It is the
  `interval >= 21` definition in field form; keeping the write preserves record shape for old
  exports, and T047's assertion is what stops a future reader resurrecting it.
- Commit after each task or logical group; T011+T012+T013 are one such group and must not be split
  across commits.
- Stop at any checkpoint to validate the story independently.
