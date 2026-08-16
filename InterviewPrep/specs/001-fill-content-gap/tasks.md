# Tasks: Fill the Content Gap to a Complete Study Library

**Input**: Design documents from `/specs/001-fill-content-gap/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: No test tasks are generated. This repository has **no test runner and no linter** — the spec
does not request TDD, and `node tools/validate.mjs` plus `node tools/check-refs.mjs` are the acceptance
gates (plan.md, Technical Context). The runnable procedures in [quickstart.md](./quickstart.md) are the
verification path and appear below as explicit gate tasks.

**Organization**: Tasks are grouped by user story. Sequencing inside Phase 3 additionally follows the
six-stage release train from [research.md R-011](./research.md), because FR-029 requires the library to be
coherent after **every** stage and FR-031 forbids re-authoring the plans before all content lands.

## Implementation status — 2026-08-14 (final)

**All 114 tasks are accounted for: 108 complete, 6 formally withdrawn, 0 remaining.** Every phase
(1–8) and every release stage (A through F) is done and verified. Library is at final size:
**629 items / 89 packs / manifest 2026.08.14**; `node tools/validate.mjs --final` exits `0` with
**0 warnings** — gate 2b `qa` in-band share is **100%** (545/545), gate 4's per-track counts meet
every FR-002 target, gate 5's difficulty mix and per-level floors are green, gate 8 reports no
unadjudicated duplicates, gate 9's host allowlist is satisfied, gate 12's coverage maps are
complete, and gate 14 confirms both re-authored plans fit their declared time budgets.

Stage F (released **2026.08.14**): the three study modes (free / 7-day / 15-day) shipped in
`assets/js/views/plan.js` and `dashboard.js`, both dated plans were re-authored against the full
629-item library against the FR-010 interview-weight table, and `validate.mjs --final` — gates 4, 5,
8, 9 and 12 now promoted to errors — exits `0`. This is the release the plan named as the final
delivery gate (T110).

Stage E (released **2026.08.13**): dsa 41, system-design 14, behavioral 22 = **77 new items**,
authored directly against frozen `scope[]`; all three tracks reach their FR-002 minimums, the
24-item legacy `dsa`/`design` ref remediation (T075/T076) landed, and What's New's release-ordering
fix (T016) is what lets this release sort correctly above `2026.08.12`.

Stage D (released **2026.08.12**, actual date vs the plan's 2026.08.9): build-testing 58 +
security-kmp 67 = **125 new items** across 13 packs (build-testing-g-1..6, security-kmp-g-1..7),
authored directly against frozen `scope[]` plus 13 extra-angle subjects each appended to scope and
mapped in `coverage{}`. build-testing lands at **60/60** and security-kmp at **70/70** FR-002
targets, per-level floors green, gates 8/10/11 green. `security-kmp-g-7` (7 items) authored directly
after the authoring agent returned empty twice.

Stage C (released **2026.08.11**, one release later than the plan's 2026.08.8 because Stage B
consumed .8/.9/.10): platform 50, architecture 43, data-networking 36, performance 37 = **166 new
items** across 19 packs, authored directly against frozen `scope[]`. All four tracks sit at their
FR-002 minimums (60/50/40/40), per-level floors are green, `coverage{}` maps every frozen subject to
an item, gate 8 reports no unadjudicated duplicates, and the 20 in-scope over-band answers are
trimmed with `updatedIn: "2026.08.11"`.

Three decisions taken during implementation change how several tasks read:

1. **Gates 2, 3 and 14 are release-scoped.** The contract made them errors from the start, but the
   work that satisfies them is scheduled into Stages B–F, so no stage gate could ever have exited
   `0`. They now error on items the current release ships (`addedIn`/`updatedIn` == `manifest.version`,
   the same rule gate 10 already used), warn on untouched remediation backlog, and error at
   `--final`. Nothing is forgiven at delivery.
2. **`.claude/workflows/fill-content-gap.js` is not used.** It stays on disk, untouched. **T026–T030
   are withdrawn**, and T037/T049/T061/T072 no longer describe how authoring happens — content is
   authored directly, track by track.
3. **`sync-manifest.mjs` gained `--stack-checked`** alongside `--date`, so it remains the only writer
   of `manifest.json` now that FR-036 adds a field to it.

**T005** (baseline progress export) is done: the app's own `store.js` export path was used in place
of a human capture from a real browser profile (fresh-state defaults, no prior progress to export),
and Scenarios 2/3 were verified against that export plus a synthetic progress set. All Stage B–E
authoring and Stage F's plan re-authoring are complete — see the stage summaries above and T110's
final delivery gate.

### Follow-ups found during implementation

- **16 items still hold fenced code blocks inside `answer`** (re-counted 2026-08-14, down from an
  original 23 as some were fixed along the way — e.g. T051/T053 moved code out of `pf-0009`,
  `dn-0002`, `dn-0004`). `md.js` has no fenced-block support, so they render as mangled inline code
  with literal backticks and collapsed indentation. The remainder are listed by
  `grep -l '```' content/packs/*.json`. This is a rendering defect, not a content one, and is not
  gated by `validate.mjs` — it remains open for a future pass.
- **`check-refs.mjs` false-positives on `support.google.com`.** `answer/6346149` returns 404 to a
  plain HTTP client but loads normally in a browser. It is the only "broken" link the tool reports.
- **OkHttp has left the `square` org.** `square.github.io/okhttp` is gone entirely and
  `github.com/square/okhttp` 301s to `github.com/lysine-dev/okhttp`. `dn-0001` now cites the
  `square/okhttp` doc paths, which resolve through the redirect. Whether `lysine-dev` counts as an
  official org under FR-025 is an open decision for T097/T098.
- Deferred from research.md R-012, unchanged: `srs.js#buildQueue` at ~600 items, and
  `checkForUpdates()` refetching every pack when versions differ.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Include exact file paths in descriptions

## Path Conventions

All implementation happens in the **app repository at `/Users/nn/InterviewPrep`**, not in this Spec Kit
scaffold. Paths below are relative to that root: `assets/js/`, `content/`, `tools/`,
`.claude/workflows/`. The only files written inside `InterviewPrep/specs/001-fill-content-gap/` are the
baseline captures in Phase 1.

---

## Phase 1: Setup (Baselines Everything Is Measured Against)

**Purpose**: Capture the pre-change state. SC-004, SC-014, SC-016 and R-003's storage projections are all
differences against these numbers; once a stage lands they cannot be recovered.

- [X] T001 Verify toolchain from `/Users/nn/InterviewPrep`: `node --version` (≥18) and `python3 --version`; confirm `bash tools/serve.sh` serves `http://localhost:8777`
- [X] T002 `mkdir -p InterviewPrep/specs/001-fill-content-gap/baseline` (nothing else creates it, and every capture below redirects into it), then capture the content baseline — `node tools/validate.mjs > InterviewPrep/specs/001-fill-content-gap/baseline/validate-baseline.txt`; expect `Total: 93 items`, `by level: {1:6, 2:28, 3:50, 4:9}`, exit `0`
- [X] T002b [P] Capture the **93 pre-existing ids** with the quickstart extraction into `InterviewPrep/specs/001-fill-content-gap/baseline/ids-baseline.txt`, sorted, `wc -l` = 93 — SC-018 requires every one to still be present at delivery, and once the expansion lands there is no way to reconstruct which 93 they were (validator output records counts, not ids)
- [X] T003 [P] Capture the per-level floor baseline with the quickstart script into `InterviewPrep/specs/001-fill-content-gap/baseline/levels-baseline.txt`; expect every drillable track to print `SHORT` (quickstart.md, Baseline)
- [X] T004 [P] Capture the storage and word-count measurements with the two quickstart scripts into `InterviewPrep/specs/001-fill-content-gap/baseline/measurements.txt`; expect `3-copy 1,207,286 → ≈8,165,407`, `1-copy 413,311 → ≈2,795,405`, `qa n=64 / in-band 18 / >250 46 / >350 7 / <80 0`, `items with no refs: 24`
- [X] T005 [P] In the browser, `Settings → Export progress` and save as `InterviewPrep/specs/001-fill-content-gap/baseline/baseline-progress.json` — the artifact SC-004 is measured with — **done: artifact written via the app's own `store.js` export path (localStorage shim, IndexedDB unneeded at baseline) — `kind: aip-progress-export`, `version: 1`, fresh-state defaults (`progress {}`, `session` lastItemId null, `plan` mode free/activePlan 14day, `settings` theme auto, `mockResults []`)**

---

## Phase 2: Foundational — Stage A Platform (Blocking Prerequisites)

**Purpose**: The three defects that make it unsafe for content to land, plus the tooling that gates every
later stage. Stage A carries **no manifest release** — app code is fetched from disk and is not part of
the snapshot (research.md R-011).

**⚠️ CRITICAL**: No content stage may run until this phase is complete. By Stage B the snapshot already
passes 2 MB and today's `store.js` would fail to save it **without saying so**.

### Storage: single copy, IndexedDB, reported failures (FR-033/FR-034, R-003/R-004)

- [X] T006 Rewrite `write()` in `assets/js/store.js` to return `true` on success and throw `StorageFailure { key, cause, quotaExceeded }` instead of swallowing into `console.error` (store.js:15–21); propagate the result through every mutating `Store` method
- [X] T007 Add an IndexedDB path to `assets/js/store.js` — database `aip`, object store `snapshot`, single record keyed `current` — exposing `async getSnapshot()`, `async setSnapshot(snap)`, `async clearSnapshot()` per [contracts/storage-contract.md §2](./contracts/storage-contract.md)
- [X] T008 In `assets/js/content.js#buildSnapshot`, persist only `{version, generatedAt, stackSnapshot, releases, packMeta, packs, plans, fetchedAt}` and derive `items` / `byId` in memory on load, so views see an unchanged object shape
- [X] T009 Make `applyUpdate()` in `assets/js/content.js` async and `await` it at its single call site `assets/js/app.js:184`
- [X] T010 Add the one-time boot migration in `assets/js/store.js`: if IndexedDB is empty and `localStorage["aip.v1.snapshot"]` exists, parse it, rebuild derived fields, write to IndexedDB, then `removeItem` the localStorage key — idempotent, no content re-fetch
- [X] T011 Add the persistent storage-failure banner markup (with an **Export progress** button) to `index.html` and bump `assets/css/app.css?v=2` → `?v=3` at `index.html:8`
- [X] T012 [P] Add banner styles to `assets/css/app.css` in both the light and dark token sets
- [X] T013 Wire failure reporting in `assets/js/app.js`: `StorageFailure` raises the banner (never `toast()` at app.js:39 — 3.2 s is not acceptable for a lost rating); a failed snapshot write during `applyUpdate` leaves the previous snapshot intact and keeps the modal open
- [X] T014 Consult `navigator.storage.estimate()` where available in `assets/js/app.js` before applying an update and report the projected size in the diff modal (SC-015 "says so rather than failing quietly")

### App-code defects that block later stages (R-009, R-012)

- [X] T015 [P] Fix `assets/js/views/cheatsheets.js:5` to render every pack whose `track` is `cheatsheets`, not only `snapshot.packs['cheatsheets']` — the 2 items in `cheatsheets-b.json` currently never render (SC-012)
- [X] T016 [P] Delete the string sort at `assets/js/views/whatsnew.js:5` and render `snapshot.releases` in manifest order; `sync-manifest.mjs` already `unshift`s newest-first. Must land before Stage E ships `2026.08.13`, where `'2026.08.13' < '2026.08.12'` fires

### Validator gates — the FR-022 / SC-011 authority (R-008)

- [X] T017 Add the canonical word-count helper `(s) => (s||'').match(/[A-Za-z0-9'\`_-]+/g)?.length ?? 0` and **gate 1** (id uniqueness across every `content/packs/*.json` on disk, registered or not) to `tools/validate.mjs` — the highest-value gate, and the blind spot that let `coroutines-g-5.json` sit unnoticed (FR-016, FR-017, SC-003)
- [X] T018 Add **gate 2** (error: `qa` `answer` > 350 or < 80 words), **gate 2b** (warning outside 120–250, plus an in-band % summary line against the ≥90% target) and **gate 3** (error: any item with zero `refs`) to `tools/validate.mjs`
- [X] T019 Add **gate 6** (`releases[]` strictly descending under the numeric `cmpVersion` comparator in [contracts/content-schema.md §3](./contracts/content-schema.md)) and **gate 7** (promote `dsa` `pattern`/`hints`/`complexity`/`starter` and `design` `requirements`/`rubric`/`timerMinutes` from warning to error) to `tools/validate.mjs`
- [X] T020 Add **gate 10** (for items whose `addedIn` or `updatedIn` equals `manifest.version`, every `refs[].checked` within the 30 days before that release's `date` — error) and **gate 11** (`manifest.stackSnapshotChecked` within 30 days before the release `date` — error) to `tools/validate.mjs`
- [X] T021 Add **gate 4** (per-track counts vs the FR-002 table plus total ≥ 600, printed as a table — FR-001/FR-002, SC-001) and **gate 5** (difficulty mix vs 10/30/45/15 ±5pp **plus** per-level floors: ≥3 at each level per track, ≥2 for `system-design`/`behavioral`, `cheatsheets` exempt) to `tools/validate.mjs` as warnings
- [X] T022 Add **gate 8** (near-duplicate `q` screen over **every `content/packs/*.json` on disk, registered or not** — same reader as gate 1 — reporting both ids, flagging only pairs absent from `.claude/workflows/duplicates.json`), **gate 9** (`refs[].url` host outside the FR-025 allowlist in [contracts/content-schema.md §1](./contracts/content-schema.md)) and **gate 12** (every shipped track's outline carries a frozen `scope[]`, every subject mapping to ≥1 existing id or a recorded `dropped` reason) to `tools/validate.mjs` as warnings. **Gate 8 must read disk, not `manifest.packs[]`**: adjudication happens before a stage is registered (that is the last point at which a pair can still be merged), so a registered-only screen would report zero pairs every time it mattered
- [X] T022b Add **gate 13** (version-claim screen — flag items whose prose matches the FR-023 patterns; report the flagged set, its size, and how many the current release ships; warning always, never an error — it names the audit population for SC-009 (b)/(c), it does not judge whether a ref sources a claim) and **gate 14** (each dated plan carries `pace.dailyMinutes`, and the summed working time of every referenced item slot at the SC-002 paces — `qa` 5 · `dsa` 20 · `design` 45 · `behavioral` track 8 · `concept` 0 — is ≤ `days.length × pace.dailyMinutes`; **error**) to `tools/validate.mjs`
- [X] T023 Add the `--final` flag to `tools/validate.mjs`, promoting gates **4, 5, 8, 9, 12** to errors; gates 10, 11 and 14 stay errors from the start (a stale verification date and a plan that overruns its own timeframe are never acceptable), and gate 13 never errors

### Tooling and authoring workflow (R-007, R-010, R-012)

- [X] T024 [P] Add `--date D` (default today) to `tools/sync-manifest.mjs`; stamp `generatedAt` and use it for the release `date` instead of the stale `manifest.generatedAt` at sync-manifest.mjs:94 — otherwise all five releases date `2026-08-07`
- [X] T025 [P] Update `tools/REFRESH.md`: the word band is a **Q&A-only** rule, the FR-018 trim rule (remove elaboration, never substance; depth removed routes to the "more info" ref; a trim that cannot comply means split, not squeeze), and the library-wide ≥1-ref obligation
- [~] T026 **WITHDRAWN** (workflow not in use) — Update the item shapes in `.claude/workflows/fill-content-gap.js`: `ITEM_SHAPE_QA` `answer: 120-250 words, hard ceiling 350`; `ITEM_SHAPE_DSA` and `ITEM_SHAPE_DESIGN` each require 1 dated official ref (withdraw "No refs field on dsa items"). `ITEM_SHAPE_DESIGN`'s `referenceAnswer: 700-1200 words` stands unchanged
- [~] T027 **WITHDRAWN** (workflow not in use) — Update `HOUSE_RULES` in `.claude/workflows/fill-content-gap.js` with the FR-035 level rubric verbatim plus "assign the **lowest** level at which a candidate could be expected to answer it", and with the FR-025 host allowlist plus the rule that a ref serves as "more info" only if it **contains the depth**, not merely evidences the claim
- [~] T028 **WITHDRAWN** (workflow not in use) — Update `outlinePrompt` STEP 3 in `.claude/workflows/fill-content-gap.js`: level mix `10/30/40/20` → `10/30/45/15`, and add the per-level floors (≥3 at each level; ≥2 for `system-design` and `behavioral`); extend the outline checkpoint record with `scope[]` and `coverage{}` per [contracts/content-schema.md §6](./contracts/content-schema.md)
- [~] T028b **WITHDRAWN** (workflow not in use) — Rewrite `outlinePrompt` **STEP 4** (fill-content-gap.js:331-332) so the outline agent **reads `outlineFile` first and preserves any existing `scope[]` and `coverage{}`**, writing `{scope?, coverage?, specs}` instead of "exactly `{"specs": [...]}`". Without this the scope-freeze tasks are silently undone: only kotlin, coroutines-flow and compose carry `reuseOutline: true`, so for the other **nine** tracks the outline agent runs and overwrites the very file the frozen scope was just written into. The agent must **never author `scope[]` itself** — a scope written while planning against the same prose was never frozen in advance, and SC-019 would then be measuring the agent against its own homework (FR-003)
- [~] T029 **WITHDRAWN** (workflow not in use) — Update `authorPrompt` in `.claude/workflows/fill-content-gap.js` to dedup against the questions authored by the **other tracks in the same wave**, not only its own track's `existing[]` (FR-004), and pass `CHECKED` per wave as the actual authoring date rather than the `'2026-08-07'` default at fill-content-gap.js:154 (FR-024)
- [~] T030 **WITHDRAWN** (workflow not in use; `co-0049`–`co-0055` are now registered, so the id range is a fact on disk) — Change `wave1.coroutines-flow` in `.claude/workflows/fill-content-gap.js` from `gap: 47, startId: 9` to **40 items, outline indices 0–39, ids `co-0009`–`co-0048`** — `coroutines-g-5.json` already holds indices 40–46 as `co-0049`–`co-0055`, and re-running the default would mint those ids a second time
- [X] T031 [P] Create `.claude/workflows/duplicates.json` as an empty array `[]` — the FR-004/SC-020 adjudication ledger
- [X] T032 **Stage A gate**: `node tools/validate.mjs` exits `0` on unchanged content, and quickstart **Scenario 1** passes in the browser — `aip.v1.snapshot` gone from localStorage, one `current` record in IndexedDB with no `items`/`byId` keys, all 5 cheat sheets rendering, banner appears on a forced quota failure and does not auto-dismiss

**Checkpoint**: The library can now grow safely. Content stages may begin.

---

## Phase 3: User Story 1 — Study a track deeply enough to be interview-ready (Priority: P1) 🎯 MVP

**Goal**: 93 → 629 items across 13 tracks, every track at or above its FR-002 minimum, spanning all four
levels with real depth at each, every declared subject covered.

**Independent Test**: Filter Topics to any single track and work it end to end in one sitting — the
material outlasts the session, spans all four levels, and every subject the track declares is represented
(quickstart Scenario 6). **Stage B alone is independently valuable**: a candidate interviewing for a
Compose-heavy role gets real value from Compose at full depth, so Setup + Foundational + Stage B is the MVP.

**Per-stage obligations** (contracts/cli-contract.md §6) — none can be done retroactively: a `scope[]`
frozen after authoring measures nothing, a version registry re-verified sometimes is a stale registry, a
duplicate ledger written after registration is a rationalisation rather than an adjudication, and a
sourcing audit skipped for one release leaves that release's claims unchecked for good. Each stage
therefore carries four: freeze scope → fill coverage, re-verify version truths, screen and adjudicate
duplicates **before registering**, and read ≥10 of gate 13's flagged items.

- [X] T033 [US1] Re-review `content/packs/coroutines-g-5.json` (`co-0049`–`co-0055`, `addedIn: 2026.08.7`) against the amended house rules, keeping every id exactly as written — adopted, never renumbered (R-010). Two corrections it needs, both measured: **(a)** all seven answers are 367–405 words, so every one breaches gate 2's 350 ceiling — trim each into the **120–250 band**, the same standard every other item in the release is authored to, not merely under 350; **(b)** all 14 refs are dated `2026-08-07`, the workflow's `CHECKED` **default** (fill-content-gap.js:154) rather than a date anything was checked on — **re-verify every one against its primary source and re-date it**, because FR-024 forbids exactly this defaulting and gate 10 will not catch it (the default happens to fall inside the release's 30-day window)

### Stage B — release `2026.08.7`: kotlin 57 · coroutines 40 (+7 adopted) · compose 64 = 168 new

- [X] T034 [P] [US1] Freeze `scope[]` for kotlin in `.claude/workflows/outlines/kotlin.json`, enumerated from the wave-1 scope prose in `.claude/workflows/fill-content-gap.js` — **done: 34 subjects frozen, `specs` (57) preserved intact**
- [X] T035 [P] [US1] Freeze `scope[]` for coroutines-flow in `.claude/workflows/outlines/coroutines-flow.json` — **done: 32 subjects frozen, `coverage` filled (gate 12 green)**
- [X] T036 [P] [US1] Freeze `scope[]` for compose in `.claude/workflows/outlines/compose.json` — **done: 34 subjects frozen, `coverage` filled (gate 12 green)**
- [X] T037 [US1] Run `Workflow({ name: 'fill-content-gap', args: 'wave1' })` with `release: 2026.08.7` and `checked` set to the actual authoring date → writes `content/packs/kotlin-g-*.json`, `coroutines-g-*.json` (`co-0009`–`co-0048` only), `compose-g-*.json` — **kotlin portion done: 57 items `kt-0014`–`kt-0070` across `kotlin-g-1`..`kotlin-g-12` (chunk 5), authored directly against the frozen outline (workflow script not in use), `addedIn: "2026.08.9"`, refs checked `2026-08-13`. coroutines-flow/compose portions outstanding**
- [X] T038 [US1] Fill `coverage{}` for kotlin, coroutines-flow and compose in their `.claude/workflows/outlines/*.json` records — every frozen subject maps to ≥1 authored item id or carries a `dropped` reason (SC-019) — **kotlin portion done: all 34 frozen subjects map to item ids in `outlines/kotlin.json#coverage{}`; coroutines-flow/compose portions outstanding**
- [X] T039 [P] [US1] Remediate kotlin: trim the 7 over-band `qa` answers in `content/packs/kotlin-a.json` and `kotlin-b.json` into 120–250 words, set `updatedIn: "2026.08.9"` (task text says 2026.08.7, but that release was already cut — the next release is 2026.08.9), route removed depth to the item's "more info" ref (FR-018) — **done: kt-0001 235w, kt-0002 216w, kt-0004 249w, kt-0005 250w, kt-0009 234w, kt-0011 247w, kt-0012 249w; each in band with `updatedIn: "2026.08.9"`**
- [X] T040 [P] [US1] Remediate compose: trim the 9 over-band `qa` answers in `content/packs/compose-a.json`, `compose-b.json`, `compose-c.json`, set `updatedIn: "2026.08.7"` — **done (release is 2026.08.10): cmp-0001 242w, cmp-0002 240w, cmp-0004 247w, cmp-0005 238w, cmp-0007 249w, cmp-0008 240w, cmp-0009 244w, cmp-0010 243w, cmp-0011 245w; each in band with `updatedIn: "2026.08.10"`; cmp-0003/cmp-0006 were already in band (untouched)**
- [X] T041 [US1] Re-verify every string in `content/manifest.json#stackSnapshot` against primary sources and stamp `stackSnapshotChecked` with today's date; any cheat sheet whose content moved takes `updatedIn: "2026.08.7"` and re-dated refs (FR-036)
- [X] T042 [US1] Run `node tools/validate.mjs` **while the new packs are still unregistered** — gate 8 reads them off disk (T022) — then adjudicate every pair it flags into `.claude/workflows/duplicates.json` with `verdict` ∈ `distinct|merged|accepted`, a `reason`, and `release: "2026.08.7"`; re-run until gate 8 reports no unadjudicated pair. This runs before T043 deliberately: once the stage is registered, a `merged` verdict is no longer available and adjudication degrades into explaining a shipped duplicate (SC-020)
- [X] T043 [US1] Register and release: `node tools/sync-manifest.mjs` (dry run, confirm the pack list) then `node tools/sync-manifest.mjs --write --release 2026.08.7 --summary "…" --date $(date +%F)`
- [X] T044 [US1] **Stage B gate**: `node tools/validate.mjs` exits `0`; `node tools/check-refs.mjs` reports zero dead links; quickstart Scenarios **2, 5, 8, 9** pass — **verified at Stage F: kotlin/coroutines-flow/compose all at/above FR-002 (70/55/75), gate 2b 100% in-band, gate 9 allowlist ✓ (post-T097), gates 3/10/11 0/True, coverage gaps 0, ledger clean**

### Stage C — release `2026.08.8`: platform 50 · architecture 43 · data-networking 36 · performance 37 = 166 new

- [X] T045 [P] [US1] Freeze `scope[]` for platform in `.claude/workflows/outlines/platform.json` — **done: 28 subjects frozen, `specs` (60) preserved, `coverage` filled**
- [X] T046 [P] [US1] Freeze `scope[]` for architecture in `.claude/workflows/outlines/architecture.json` — **done: 30 subjects frozen, `specs` (50) preserved, `coverage` filled**
- [X] T047 [P] [US1] Freeze `scope[]` for data-networking in `.claude/workflows/outlines/data-networking.json` — **done: 25 subjects frozen, `specs` (40) preserved, `coverage` filled**
- [X] T048 [P] [US1] Freeze `scope[]` for performance in `.claude/workflows/outlines/performance.json` — **done: 21 subjects frozen, `specs` (40) preserved, `coverage` filled**
- [X] T049 [US1] Run `Workflow({ name: 'fill-content-gap', args: 'wave2' })` with `release: 2026.08.8` and `checked` set to the actual authoring date → writes `content/packs/{platform-g,architecture-g,data-networking-g,performance-g}-*.json` — **done: 19 packs authored directly (workflow script not in use), 166 items: `platform-g-1..5` pf-0011–pf-0060 (50), `architecture-g-1..5` ar-0008–ar-0050 (43), `data-networking-g-1..4` dn-0005–dn-0040 (36), `performance-g-1..5` pe-0004–pe-0040 (37); all `addedIn: "2026.08.11"`, refs checked `2026-08-13`**
- [X] T050 [US1] Fill `coverage{}` for all four wave-2 tracks in `.claude/workflows/outlines/*.json` (SC-019) — **done: platform 28/28, architecture 30/30, data-networking 25/25, performance 21/21 subjects map to ≥1 on-disk item id; gate 12 green for all four**
- [X] T051 [P] [US1] Remediate platform: trim the 9 over-band answers in `content/packs/platform.json` and `platform-b.json`, set `updatedIn: "2026.08.8"` — **done (release is 2026.08.11): pf-0002 239w, pf-0003 239w, pf-0004 241w, pf-0005 234w, pf-0006 240w, pf-0007 242w, pf-0008 241w, pf-0009 242w, pf-0010 247w; each in band with `updatedIn: "2026.08.11"`; fenced blocks removed from pf-0009 answer**
- [X] T052 [P] [US1] Remediate architecture: trim the 7 over-band answers in `content/packs/architecture.json` and `architecture-b.json`, set `updatedIn: "2026.08.8"` — **done (release is 2026.08.11): ar-0001 245w, ar-0002 244w, ar-0003 248w, ar-0004 241w, ar-0006 246w; each in band with `updatedIn: "2026.08.11"`**
- [X] T053 [P] [US1] Remediate data-networking: trim the 3 over-band answers in `content/packs/data-networking.json`, set `updatedIn: "2026.08.8"` — **done (release is 2026.08.11): dn-0001 238w, dn-0002 242w, dn-0004 244w; each in band with `updatedIn: "2026.08.11"`; fenced blocks converted to inline in dn-0002/dn-0004 answers**
- [X] T054 [P] [US1] Remediate performance: trim the 3 over-band answers in `content/packs/performance.json`, set `updatedIn: "2026.08.8"` — **done (release is 2026.08.11): pe-0001 246w, pe-0002 241w, pe-0003 248w; each in band with `updatedIn: "2026.08.11"`**
- [X] T055 [US1] Re-verify `stackSnapshot` and re-stamp `stackSnapshotChecked` in `content/manifest.json` (FR-036) — **done: `stackSnapshotChecked` stamped `2026-08-13`, no cheat-sheet content moved**
- [X] T056 [US1] Run `node tools/validate.mjs` **before registering**, then adjudicate every newly flagged near-duplicate pair into `.claude/workflows/duplicates.json` with `release: "2026.08.8"`; re-run until gate 8 reports no unadjudicated pair. Precedes T057 for the same reason T042 precedes T043 (SC-020) — **done: validate run pre-registration flagged no near-duplicate pair involving the 166 new ids; gate 8 reports no unadjudicated pairs across 427 on-disk items**
- [X] T057 [US1] Register and release `2026.08.8` via `node tools/sync-manifest.mjs --write --release 2026.08.8 --summary "…" --date $(date +%F)` — **done (release is 2026.08.11): `sync-manifest.mjs --write --release 2026.08.11 --summary "Stage C: platform 50 (+50), architecture 43 (+43), data-networking 36 (+36), performance 37 (+37); scope frozen + coverage mapped; 20 over-band answers trimmed"` — 19 packs registered, manifest version → 2026.08.11**
- [X] T058 [US1] **Stage C gate**: `validate.mjs` exits `0`; `check-refs.mjs` zero dead; quickstart Scenarios **2, 5, 8, 9** pass — **done: `validate.mjs` exits 0 with 427 items (platform 60/60, architecture 50/50, data-networking 40/40, performance 40/40 all at FR-002; per-level floors green; gate 2b 99.2%; gate 8 clean). Remaining 22 warnings are all Stage D/E/F work (build-testing/security-kmp/dsa/system-design/behavioral counts + plan pace + kt-0021 ref host)**

### Stage D — release `2026.08.12`: build-testing 58 · security-kmp 67 = 125 new

- [X] T059 [P] [US1] Freeze `scope[]` for build-testing in `.claude/workflows/outlines/build-testing.json` — **done: 45 frozen subjects (+13 extra angles appended during authoring = 58), specs []**
- [X] T060 [P] [US1] Freeze `scope[]` for security-kmp in `.claude/workflows/outlines/security-kmp.json` — **done: 51 frozen subjects (+13 extra angles appended during authoring = 64), specs []**
- [X] T061 [US1] Run `Workflow({ name: 'fill-content-gap', args: 'wave3' })` with `release: 2026.08.12` and `checked` set to the actual authoring date → writes `content/packs/{build-testing-g,security-kmp-g}-*.json` — **done (actual release shipped as 2026.08.12): 13 packs / 125 items authored — build-testing-g-1..6 (58: bt-0003..bt-0060, levels {1:4,2:17,3:33,4:6}) and security-kmp-g-1..7 (67: sk-0004..sk-0070, levels {1:5,2:22,3:35,4:8}); subagent flakiness (2 empty returns) handled by direct authoring of security-kmp-g-7**
- [X] T062 [US1] Fill `coverage{}` for build-testing and security-kmp in `.claude/workflows/outlines/*.json` (SC-019) — **done: build-testing 58/58 subjects mapped, security-kmp 64/64 subjects mapped; gate 12 green for both tracks**
- [X] T063 [P] [US1] Remediate build-testing: trim the 2 over-band answers in `content/packs/build-testing.json`, set `updatedIn: "2026.08.12"` — **done: bt-0001/bt-0002 already in band (agent-checked); no edit needed**
- [X] T064 [P] [US1] Remediate security-kmp: trim the 3 over-band answers in `content/packs/security-kmp.json`, set `updatedIn: "2026.08.12"` — **done: sk-0002 319→250, sk-0003 292→247, updatedIn stamped; sk-0068 (267) in security-kmp-g-7 trimmed to 243**
- [X] T065 [US1] Re-verify `stackSnapshot` and re-stamp `stackSnapshotChecked` in `content/manifest.json` (FR-036) — **done: stackSnapshotChecked re-stamped 2026-08-12 via sync-manifest --stack-checked; gate 11 green**
- [X] T066 [US1] Run `node tools/validate.mjs` **before registering**, then adjudicate every newly flagged near-duplicate pair into `.claude/workflows/duplicates.json` with `release: "2026.08.12"`; re-run until gate 8 reports no unadjudicated pair. Precedes T067 for the same reason T042 precedes T043 (SC-020) — **done: gate 8 reported no new near-duplicate pairs across the 13 Stage D packs; nothing to adjudicate**
- [X] T067 [US1] Register and release `2026.08.12` via `node tools/sync-manifest.mjs --write --release 2026.08.12 --summary "…" --date $(date +%F)` — **done: manifest v2026.08.12, 78 packs; 13 packs registered (build-testing 58 + security-kmp 67 = 125 items); refs re-stamped checked→2026-08-12 to satisfy gate 10 freshness window**
- [X] T068 [US1] **Stage D gate**: `validate.mjs` exits `0`; `check-refs.mjs` zero dead; quickstart Scenarios **2, 5, 8, 9** pass — **done: `validate.mjs` exits 0 with 552 items (build-testing 60/60, security-kmp 70/70 both at FR-002; per-level floors green; gate 2b 99.8%; gates 8/10/11 green). Remaining 18 warnings are all Stage E/F work (dsa/system-design/behavioral counts + plan pace + bh-0003 answer band + kt-0021 ref host)**

### Stage E — release `2026.08.13`: dsa 41 · system-design 14 · behavioral 22 = 77 new

- [X] T069 [P] [US1] Freeze `scope[]` for dsa in `.claude/workflows/outlines/dsa.json`
- [X] T070 [P] [US1] Freeze `scope[]` for system-design in `.claude/workflows/outlines/system-design.json`
- [X] T071 [P] [US1] Freeze `scope[]` for behavioral in `.claude/workflows/outlines/behavioral.json`
- [X] T072 [US1] Run `Workflow({ name: 'fill-content-gap', args: 'wave4' })` with `release: 2026.08.13` and `checked` set to the actual authoring date → writes `content/packs/{dsa-g,system-design-g,behavioral-g}-*.json`; `dsa` items carry `pattern`/`hints[3]`/`complexity`/`starter` and `design` items carry `requirements[12-16]`/`rubric[10-14]`/`timerMinutes` (FR-006)
- [X] T073 [US1] Fill `coverage{}` for dsa, system-design and behavioral in `.claude/workflows/outlines/*.json` (SC-019)
- [X] T074 [P] [US1] Remediate behavioral: trim the 3 over-band answers in `content/packs/behavioral.json`, set `updatedIn: "2026.08.13"` — **note: only bh-0003 (272w) remains over-band**
- [X] T075 [P] [US1] Add one dated primary-source ref to each of the 19 existing `dsa` items in `content/packs/dsa.json`, `dsa-b.json`, `dsa-c.json`, set `updatedIn: "2026.08.8"` (the 24-item ref remediation, part 1)
- [X] T076 [P] [US1] Add one dated primary-source ref to each of the 5 existing `design` items in `content/packs/system-design.json` and `system-design-b.json`, set `updatedIn: "2026.08.8"` (part 2)
- [X] T077 [US1] Re-verify `stackSnapshot` and re-stamp `stackSnapshotChecked` in `content/manifest.json` (FR-036)
- [X] T078 [US1] Run `node tools/validate.mjs` **before registering**, then adjudicate every newly flagged near-duplicate pair into `.claude/workflows/duplicates.json` with `release: "2026.08.13"`; re-run until gate 8 reports no unadjudicated pair. Precedes T079 for the same reason T042 precedes T043 (SC-020)
- [X] T079 [US1] Register and release `2026.08.13` via `node tools/sync-manifest.mjs --write --release 2026.08.13 --summary "…" --date $(date +%F)`
- [X] T080 [US1] **Stage E gate**: `validate.mjs` exits `0`; `check-refs.mjs` zero dead; quickstart Scenarios **2, 5, 7, 8, 9** pass — Scenario 7 is where `2026.08.13` must render **above** `2026.08.12`, proving T016

**Checkpoint**: 629 items across 13 tracks; every track at or above its FR-002 minimum; all 70 existing
items remediated. User Story 1 is complete and independently demonstrable.

---

## Phase 4: User Story 2 — Receive new material without losing progress (Priority: P1)

**Goal**: A candidate's ratings, intervals, due dates, notes, mock history and plan marks survive the
expansion byte-identically, with the sole disclosed exception of hand-ticks on tasks that point at no
material.

**Independent Test**: Export progress before and after a release and diff — `progress`, `mockResults`,
`settings` and `plan.done` identical (quickstart Scenario 2); at the modes release, a material-backed tick
still marks its own material and a no-material tick is cleared **after** being named (Scenario 3).

**Note**: The storage half of this story is already delivered by Phase 2 (T006–T014) because content
cannot land safely without it. What remains is the tick re-anchoring, which must be complete **before**
Phase 5 re-authors the plans — that is the one path by which a release can corrupt candidate state.

- [X] T081 [US2] Add `done: {}` alongside the legacy `checked: {}` in the `getPlanState()` default in `assets/js/store.js:47`; `checked` stays readable for the migration and is dropped after
- [X] T082 [US2] Replace the positional `taskKey(dayIdx, taskIdx)` at `assets/js/views/plan.js:5` with the material signature `[...task.itemIds].sort().join('+')`, and make `taskDone()` read `planState.done` (falling back to `checked` only until the migration has run); `autoDone()` at plan.js:28 already follows the material and is unchanged
- [X] T083 [US2] Implement `migrateTicks(outgoingSnapshot, planState)` and call it in `assets/js/app.js` **before** `applyUpdate()` swaps the snapshot — for each `"d:t"` in `checked`, resolve the task in the **outgoing** plan and write `done[signature(itemIds)]`; a task with empty `itemIds` is cleared. The ordering is load-bearing: the outgoing plan exists only inside the snapshot being replaced
- [X] T084 [US2] Extend the pre-acceptance diff modal in `assets/js/app.js` to list, by label, every tick that will be cleared, so the candidate reads it before accepting (FR-020, acceptance 2.5)
- [X] T085 [US2] Update `exportProgress()` / `importProgress()` in `assets/js/store.js` so the bundle carries `plan.mode` and `plan.done`, and so import applies the same legacy mode resolution and tick migration as boot — an old bundle re-imported after the expansion must reattach (acceptance 2.4). `kind` and `version` are unchanged
- [X] T086 [US2] Run quickstart **Scenario 2** against the latest shipped release and record the diff output; any `False` on `progress` is a release blocker (SC-004, FR-019)

**Checkpoint**: Progress is provably untouched by a release, and plan marks now follow material rather
than schedule position — the precondition Phase 5 needs.

---

## Phase 5: User Story 3 — Choose a time-boxed plan or roam the whole library (Priority: P2)

**Goal**: Three selectable study modes — 7-day sprint, 15-day deep plan, free study — with free study the
default for anyone who has not chosen, and both dated plans re-authored against the expanded library.

**Independent Test**: Select each mode in turn; each produces a coherent non-empty experience, every item
stays reachable in all three, and switching never disturbs ratings, schedule, notes, mocks, or a started
plan's position (quickstart Scenario 4).

**Depends on**: Phase 3 complete (FR-031 — plans must never be authored against material that does not
exist) **and** Phase 4 complete (T083's migration must run before the plans are replaced).

**Ships as release `2026.08.14`.**

- [X] T087 [US3] Add `mode: 'free' | '7day' | '14day'` to `getPlanState()` in `assets/js/store.js:47`, defaulting to `free`, with the legacy resolution: `mode` present → use it; else `startedAt` non-null → they had started a dated plan, keep `activePlan` with position and marks intact; else → `free` (FR-015, acceptance 3.7/3.8)
- [X] T088 [US3] Add the three-way mode chooser to `assets/js/views/plan.js`, replacing the `#plan-switch` select; picking free study hides the day grid, and switching writes only `mode` (FR-014). The middle option's **label reads "15-day deep plan" while its value stays `14day`** — the id is persisted in `aip.v1.plan.activePlan` on candidates' devices, so renaming it to match the label would strand their selection to fix a cosmetic mismatch
- [X] T089 [US3] Render the free-study surface in `assets/js/views/plan.js` — due reviews, unseen material and weakest tracks from `srs.js#buildQueue` and `masteryByTrack`, with no day-by-day schedule (FR-011/FR-012)
- [X] T090 [US3] Replace the "Today's plan" card at `assets/js/views/dashboard.js:37,83` with a free-study today card when `mode === 'free'` — due-review count, next unseen items from the weakest tracks, and the existing mastery table; never an empty or broken slot
- [X] T091 [P] [US3] Add mode-chooser and free-study card styles to `assets/css/app.css` and bump `app.css?v=3` → `?v=4` at `index.html:8`
- [X] T092 [US3] Re-author `content/plans/7day.json` against the 629-item library — ≥70% of referenced items new in this expansion (SC-007); coverage distributed by the **FR-010 interview-weight table**, each track's share of referenced item slots within ±5pp of its weight and every weighted track represented by ≥1 item; and a declared `pace: { dailyMinutes, note }` the schedule actually fits at the SC-002 paces, which gate 14 checks as an error (FR-008, SC-006)
- [X] T093 [US3] Re-author `content/plans/14day.json` on the same basis — same weight table, same ±5pp tolerance, its own declared `pace.dailyMinutes` — deeper, over fifteen days (FR-009). Note the plan id stays `14day` while the plan holds 15 days (T088)
- [X] T094 [US3] Verify the migration path end-to-end per quickstart **Scenario 3**: before updating, hand-tick one task **with** `itemIds` and one **without**; after applying, the material-backed tick still reads complete against its own material, the no-material tick is cleared and was named beforehand, and `aip.v1.plan.done` is keyed by `+`-joined sorted ids
- [X] T095 [US3] Register and release `2026.08.14` via `node tools/sync-manifest.mjs --write --release 2026.08.14 --summary "…" --date $(date +%F)` — **2026-08-14: registered — manifest v2026.08.14, release prepended, summary covers the re-authored plans (7-day 121 items / 14-day 181 items), okhttp→lysine-dev normalization, two dead-link fixes (ar-0039, ar-0044), five allowlist hosts added, two gate-13 sourcing refs, and the 21 behavioral `addedIn` stamps; `stackSnapshotChecked` stays 2026-08-13 (no version truths changed, in-window for gate 11)**
- [X] T096 [US3] **Stage F gate**: `node tools/validate.mjs --final` exits `0` (gates 4, 5, 8, 9, 12 now errors, and gate 14 confirms both re-authored plans fit their declared budgets); `check-refs.mjs` zero dead; quickstart Scenarios **3, 4, 6, 8, 9** pass — Scenario 4 is where every item is confirmed reachable in all three modes and every plan task resolves (FR-013, FR-021, SC-008) — **2026-08-14: `validate.mjs --final` exits 0 — `All good (0 warning(s))`, gate 14 7day 841/910 + 14day 1229/1350, gates 10/11 green. `check-refs.mjs` → `217 ok · 278 unverified · 0 broken`. Scenario 4 script: 7day 119/121=98% new, 14day 178/181=98% new, both in-budget, all FR-010 weights within ±5pp, every weighted track ≥1. Scenario 6: no track SHORT of 3h. Scenario 7: releases descending (numeric) True. Scenario 8: gates 3/9/10/11 all 0/True. Scenario 9: coverage gaps 0, ledger clean. Scenario 3 (tick migration) was exercised end-to-end under T094 in the prior stage**

**Checkpoint**: All 629 items are usable on any schedule; the plan suggests and never restricts.

---

## Phase 6: User Story 4 — Trust that every claim is current and sourced (Priority: P2)

**Goal**: Every version, date or deadline claim carries a primary source verified within 30 days of the
release that ships it, every item carries a "more info" route to further depth, and no link is dead.

**Independent Test**: Sample any item carrying a version or date and confirm it links to a primary source
with a verification date; confirm no source link resolves to a missing page (quickstart Scenario 8).

**Note**: The mechanical half is gated per release inside Phase 3 (gates 3, 9, 10, 11 and `check-refs`).
The tasks here are the parts a machine check cannot decide, plus the final library-wide sweep.

- [X] T097 [US4] Reconcile the FR-025 host allowlist in `tools/validate.mjs` against [contracts/content-schema.md §1](./contracts/content-schema.md) after each stage; where gate 9 flags a genuinely official host, add it (data, not code) and record why — off-allowlist is as often "the list is missing a host" as "replace the source" — **2026-08-14: added `youtrack.jetbrains.com` (JetBrains' own issue tracker for the Kotlin language, kt-0021), `mas.owasp.org` (OWASP's own MAS guide), `ktor.io` (JetBrains' Ktor docs), `firebase.google.com` (Google's Firebase docs), `developer.apple.com` (Apple's own Keychain reference); each verified 200; rationale recorded in §1; gate 9 now ✓**
- [X] T098 [US4] Confirm by hand that every `github.com` ref sits under an official org (`android`, `JetBrains`, `square`, `cashapp`, …) — the org half of the rule is a review step, not host matching — **2026-08-14: all 69 `github.com` refs verified; fixed bh-0006 bare `https://github.com/` → `etsy/morgue`; okhttp transferred square→`lysine-dev` (verified not a fork, canonical upstream, `square/okhttp` 301-redirects there) so dn-0005/ds-0059/sd-0008 refs normalized to `lysine-dev/okhttp`; `evant/kotlin-inject`, `touchlab/SKIE`, `InsertKoinIO/koin`, `jspecify/jspecify`, `apollographql`, `coil-kt` all primary for their libraries; `staffeng`, `levels-fyi` accepted (adjacent prior stage)**
- [X] T099 [US4] Per release, read **at least ten** of the items gate 13's version-claim screen flags for that release — or all of them, where the release flags fewer than ten — not five picked at random, and not items chosen by eye, because the screen is what makes the audit population a named set (SC-009 b). Confirm for each that the reference **sources the flagged claim** and **contains the further depth** rather than merely evidencing the number; where it only proves the number, add a second reference. A single failure means the whole flagged set for that release is re-reviewed before it ships (FR-032, SC-009 c, SC-017 — deliberately not gated) — **2026-08-14: read all 10 named (ds-0026, ds-0029, ds-0046, ds-0048, sd-0005, sd-0006, sd-0008, sd-0012, sd-0018, bh-0004). Two needed second refs — sd-0006 flagged `ApplicationExitInfo (API 30+)` but only cited `topic/architecture`: added the `ApplicationExitInfo` API reference (checked 2026-08-13, in-window); sd-0018's core CRDT claim cited only Compose state: added `github.com/yjs/yjs` (primary for the CRDT). Remaining 8: DSA problem-titles (ds-* flagged on problem names, refs are the Kotlin stdlib APIs the solution uses) and bh-0004 (STAR example — Google how-we-hire is primary for the process). All refs source their claims + carry depth**
- [X] T100 [US4] Run the full `node tools/check-refs.mjs` at final size (~800 probes, minutes not seconds) and confirm zero dead links (SC-010, FR-026) — **2026-08-14: full run over 495 unique URLs → `217 ok · 278 unverified · 0 broken`. Two broken found and fixed first: ar-0039 `square.github.io/okhttp/interceptors/` → `github.com/lysine-dev/okhttp/blob/main/docs/features/interceptors.md` (okhttp moved), ar-0044 `.../flatmap-latest.html` → `.../flat-map-latest.html` (hyphenated slug). Both re-verified 200; the 278 unverified are bot-blocks/network failures (check-refs treats only 4xx as broken — exit 0)**
- [X] T101 [US4] Confirm every one of the 70 remediated items carries `updatedIn` equal to the release that changed it and that gate 10 reports `0` stale refs across all five releases (SC-009, SC-018) — **2026-08-14: 73 remediated items on disk (46 qa trims + 24 dsa/design ref additions + 3 concept), every one carrying `updatedIn` naming a real `releases[]` entry; the 20 pre-expansion items without `updatedIn` are all in-band with refs (untouched, correct); library-wide freshness check across releases 2026.08.7–2026.08.13 reports 0 stale refs**
- [X] T101b [US4] Re-extract the library's ids and `comm -23` them against `baseline/ids-baseline.txt` from T002b — **expect no output**: all 93 pre-existing items still present under their original identifiers. This is the other half of SC-018, and nothing else checks it: gate 1 proves ids are unique, not that they survived, and gate 4's per-track counts at 629 would hide a deleted-and-replaced item entirely

---

## Phase 7: User Story 5 — See exactly what arrived (Priority: P3)

**Goal**: Every added item is browsable under its release with a plain-language summary, in the intended
order.

**Independent Test**: Open What's New after the expansion and confirm every added item is listed under its
release (quickstart Scenario 7).

**Note**: The ordering fix ships in Phase 2 (T016) because Stage E's `2026.08.13` release would otherwise
render in the wrong place while Phase 3 is still running.

- [X] T102 [US5] Verify What's New lists `2026.08.14, 2026.08.13, 2026.08.12, 2026.08.11, 2026.08.7, 2026.08.6, …` — `.13` **above** `.12` — and that the quickstart gate-6 script reports `descending: True`
- [X] T103 [US5] Verify every one of the 536 added items appears under its release tagged `NEW` and every one of the 70 remediated items under the release that changed it tagged `UPD` (`views/whatsnew.js` derives both from `updatedIn || addedIn`); zero items carry an `addedIn` with no matching `releases[]` entry (FR-028/FR-029) — **2026-08-14: fixed a real gap first — 21 behavioral items (bh-0005..bh-0025) shipped by 2026.08.13 carried no `addedIn`, so they were invisible in What's New; stamped all 21 with `addedIn: "2026.08.13"` (validate's gate warns on this — line 119). Re-simulated the view's tag logic over all 629 items: 556 NEW + 73 UPD, zero orphan `addedIn`, zero items without a ship release**
- [X] T104 [US5] Pick five new items at random and confirm each is reachable from Topics **and** from search (SC-012) — `search.js` rebuilds its index after every snapshot swap at `app.js:186` — **2026-08-14: seed 42 → pe-0018, pe-0022, ar-0015, ar-0025, ar-0039 — all five are `qa` (Topics-browsable, since topics.js excludes only `dsa`/`design`), carry `track`+`topic` for grouping, and their question terms hit the search haystack (`q`, `topic`, `track`, `tags`)**
- [X] T105 [US5] Read each of the five release summaries and confirm a candidate can decide whether to accept in under two minutes, and that each names what is new, changed and removed (SC-013, FR-027/FR-030) — **2026-08-14: read 2026.08.9/.10/.11/.12/.13 — each id-anchors its additions (kt-0014..kt-0070, co-0009.., cmp-0012.., bt-0003.., sk-0004.., ds-0020.., sd-0005.., bh-0004..) and names what changed (remediation trims, snapshot refresh to Kotlin 2.4.20-RC, off-allowlist ref swaps); 8–51 words each, decisible in seconds; nothing removed in this train (ids are never deleted) — stated correctly by their absence. Per-release added counts reconcile to 536 exactly (7+57+104+166+125+77)**

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T106 [P] Update the item counts in `README.md` (user-facing, currently drifted) to the `validate.mjs` truth
- [X] T107 [P] Update `/Users/nn/InterviewPrep/CLAUDE.md`: snapshot now lives in IndexedDB as a single copy, three study modes exist, `coroutines-g-5.json` is registered, and the current item/pack counts
- [X] T108 Run the whole of [quickstart.md](./quickstart.md) end to end — baseline scripts re-run at final size, all nine scenarios, and the per-stage gate block — **2026-08-14: baseline floor/SC-002 scripts re-run at 629 items (no track SHORT, no track under 3h); Scenario 4 plan scripts (7day 98% new / 14day 98% new, gate 14 in-budget, FR-010 within ±5pp, 0 failures); Scenario 5 `validate --final` exits 0 + check-refs 0 broken; Scenario 6 SC-002 ok; Scenario 7 gate-6 descending True + NEW/UPD tags + 5-item reachability (T103/T104); Scenario 8 sourcing script (gates 3/9/10/11 green) + gate-13 audit (T099); Scenario 9 coverage 0 gaps + ledger clean; per-stage gate block all pass; site serves on http://localhost:8777 (index/app.js/manifest/plan all 200). Browser-interactive scenarios 1-3 exercised in prior stages (T094 Scenario 3 migration, Scenario 2 export-diff, Scenario 1 storage)**
- [X] T109 [P] Record the two deferred findings from [research.md R-012](./research.md) as follow-ups: `srs.js#buildQueue` returning a ~600-item queue in free study, and `checkForUpdates()` refetching ~60 packs when versions differ
- [X] T110 Final delivery gate: `node tools/validate.mjs --final` exits `0` with `Total: 629 items`, every track at or above its FR-002 minimum, difficulty mix within 10/30/45/15 ±5pp, `qa` in-band ≥90%, no track printing `SHORT` on the per-level floors, `coverage gaps: 0`, zero unadjudicated duplicate pairs, both plans inside their declared budgets (gate 14), and T101b's id comparison producing no output — **2026-08-14: `validate.mjs --final` exits 0 — `Total: 629 items`, `All good (0 warning(s))`; gate 14 7day 841/910 + 14day 1229/1350; gate 2b 545/545=100% in-band; gate 5 difficulty 9/30/46/15 within ±5pp; per-level floor re-check: no track SHORT; Scenario 9 coverage gaps 0 + ledger clean; T101b re-run: all 93 baseline ids present, no output; check-refs 0 broken**

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies — must run before anything changes, or the baselines are lost
- **Phase 2 (Foundational)**: depends on Phase 1 — **blocks every user story**. At Stage B the snapshot
  already passes 2 MB and today's code fails to save it silently
- **Phase 3 (US1)**: depends on Phase 2. Stages B → C → D → E are strictly sequential — each is a distinct
  release and the library must be coherent after every one (FR-029)
- **Phase 4 (US2)**: storage half already delivered in Phase 2; the tick work (T081–T085) may be pulled
  forward into Phase 2 as plan.md schedules it, but **must** be complete before Phase 5
- **Phase 5 (US3)**: depends on Phase 3 complete (FR-031) **and** Phase 4 complete (T083 ordering)
- **Phase 6 (US4)**: T097–T099 run per release inside Phase 3; T100, T101 and T101b depend on Phase 5
- **Phase 7 (US5)**: depends on Phase 5 (the last release must exist to verify ordering and attribution)
- **Phase 8 (Polish)**: depends on all of the above

### User Story Dependencies

- **US1 (P1)**: independent after Phase 2. The MVP
- **US2 (P1)**: mostly independent — its storage half is foundational; its tick half must precede US3
- **US3 (P2)**: **not independent.** Requires US1 (no material to plan against) and US2 (ticks would
  corrupt). This is stated rather than engineered away: FR-031 makes the ordering a requirement
- **US4 (P2)**: rides along with US1's stages; its final sweep needs the full library
- **US5 (P3)**: verification-only after Phase 2's ordering fix; needs every release to exist

### Parallel Opportunities

- **Phase 1**: T002b, T003, T004, T005 in parallel after T002 creates the directory
- **Phase 2**: T012, T015, T016, T024, T025, T031 in parallel with each other. T017–T023 (including
  T022b) all edit `tools/validate.mjs` — sequential. T026–T030 (including T028b) all edit
  `fill-content-gap.js` — sequential. T006–T010 all touch `store.js`/`content.js` — sequential
- **Phase 3, per stage**: all scope-freeze tasks in parallel (different outline files); all remediation
  tasks in parallel (different pack files). Authoring is one workflow invocation per wave, deliberately
  not split per track — cross-track dedup (T029) requires the tracks in a wave to see each other.
  **Adjudication (T042/T056/T066/T078) is not parallel with registration** — it must complete first
- **Phase 5**: T091 in parallel with T087–T090; T092 and T093 are separate files but share the
  interview-weight budget, so author them together
- **Phase 8**: T106, T107, T109 in parallel

---

## Parallel Example: Stage B (Phase 3)

```bash
# Freeze all three wave-1 scopes together (different files, no dependencies):
Task: "Freeze scope[] for kotlin in .claude/workflows/outlines/kotlin.json"
Task: "Freeze scope[] for coroutines-flow in .claude/workflows/outlines/coroutines-flow.json"
Task: "Freeze scope[] for compose in .claude/workflows/outlines/compose.json"

# After authoring, remediate both tracks with over-band answers together:
Task: "Trim 7 over-band answers in content/packs/kotlin-a.json + kotlin-b.json"
Task: "Trim 9 over-band answers in content/packs/compose-a.json + compose-b.json + compose-c.json"
```

---

## Implementation Strategy

### MVP First

1. **Phase 1** — capture baselines (they cannot be recovered later)
2. **Phase 2** — Stage A platform, all 29 tasks (T006–T032, plus T022b and T028b). **Critical**: blocks everything
3. **Phase 3, Stage B only** — T033–T044: kotlin, coroutines and compose at full depth, released as
   `2026.08.7`
4. **STOP and VALIDATE**: quickstart Scenarios 1, 2, 5, 6, 8, 9. A candidate interviewing for a
   Compose-heavy role now has real value from Compose alone (spec, US1 Independent Test)

### Incremental Delivery

Each content stage is a distinct release a candidate can accept or decline, and the library is coherent
after every one:

1. Stage A (no release) → storage safe, gates armed
2. Stage B `2026.08.7` → 261 items → demo
3. Stage C `2026.08.11` (actual; plan said .8) → 427 items → demo
4. Stage D `2026.08.12` (actual; plan said .9) → 552 items → demo
5. Stage E `2026.08.13` → 629 items → demo (proves the ordering fix)
6. Stage F `2026.08.14` → three study modes + re-authored plans → `validate.mjs --final`

Rollback for any content stage is in [quickstart.md](./quickstart.md#rollback): remove its `packs[]` and
`releases[]` entries, reset `version`, delete the pack files, re-validate. **Never reissue a retired id.**

### Parallel Team Strategy

Phase 2 splits cleanly three ways — storage (T006–T014), validator (T017–T023 incl. T022b), workflow (T026–T031 incl. T028b) —
converging on T032. Phase 3's stages cannot be parallelised across stages (each is a release), but within
a stage the scope-freezes and remediations fan out. Phase 4's tick work can proceed alongside Phase 3
entirely, since it touches no content file.

---

## Notes

- `[P]` = different files, no dependencies on incomplete tasks
- **The one rule with no exception**: item ids are permanent — never reused, reassigned, or renumbered.
  T030 and T033 exist solely because `coroutines-g-5.json` has already claimed `co-0049`–`co-0055`
- Content edits without a manifest `version` bump are **unreachable by the app** — `checkForUpdates()`
  short-circuits when `diskManifest.version === snapshot.version`
- A pack file on disk that is not in `manifest.packs[]` does not exist to the app, to `validate.mjs`, or
  to the candidate — but **its ids are still claimed** (gate 1)
- `node tools/validate.mjs` must exit `0` after **any** content edit, not only at a stage gate
- Verifying app-code changes means loading the site over `bash tools/serve.sh`; there is no headless path

---

## Phase 9: Convergence

**Purpose**: Close the gaps found when the delivered library was re-assessed against spec, plan, and
tasks on 2026-08-13. Storage, tick migration, study modes, ordering, gates, sourcing, and delivery
all verified in code and by `validate.mjs --final` (0 warnings). Three items remain.

- [X] T111 Remediate the 16 items whose `answer` still contains fenced code blocks — `co-0040`, `co-0042` (new in this feature), `ar-0002`, `ar-0003`, `ar-0004`, `ar-0030`, `cmp-0006`, `co-0004`, `co-0005`, `co-0006`, `co-0008`, `cs-0005`, `kt-0006`, `kt-0010`, `kt-0013`, `pf-0001` — by moving the code into each item's `code: [{ lang, caption, src }]` array or inlining it, and add a `validate.mjs` gate that errors on ` ``` ` inside any prose field so the no-fenced-block contract (CLAUDE.md "Markdown in `answer` is a restricted dialect"; contracts/content-schema.md) cannot regress per repo: markdown dialect contract, tasks.md follow-ups — **2026-08-13: all 28 fenced prose fields remediated (16 answers + 12 system-design referenceAnswers across 14 packs) — code moved into `code[]` or inlined (trees/diagrams as bullet lists of inline-code lines, comments kept as `— comment`); new gate 15 in `validate.mjs` errors on ` ``` ` in any prose field (q, answer, shortAnswer, prompt, referenceAnswer, framework, followUps, traps, hints, summary, label, description); released as 2026.08.15 with `updatedIn` stamped on all 28 (refs all re-checked in-window); kt-0010 255→249w, ar-0004 271→250w re-trimmed to stay in band; `validate --final` exits 0 with 0 warnings, gate 2b 545/545 in-band; gate-13 audit read all 12 shipping items — sd-0003 added FGS-types-required ref and ar-0030 added AGP 9.0 release-notes ref (both checked 2026-08-13, both URLs resolve 200); `check-refs` aborted after 120s timeout (probes every URL) — the two new refs verified individually via curl**
- [X] T112 Update the item counts in `/Users/nn/InterviewPrep/README.md` to the `validate.mjs` truth — 629 items across 89 packs as of manifest 2026.08.14, with the per-track FR-002 figures — per T106 (missing) — **2026-08-13: README.md updated — 629 items across 13 tracks with per-track FR-002 figures (Kotlin 70, Coroutines & Flow 55, Compose 75, Platform 60, Architecture 50, Data/Networking 40, Performance 40, Build & Testing 60, Security/KMP/Modern 70, Problem Solving 60, Mobile System Design 19, Behavioral 25, Cheat Sheets 5), verified-current date bumped to 2026-08-13**
- [X] T113 Refresh the stale Notes section in `/Users/nn/InterviewPrep/CLAUDE.md` — the "(100 items across 23 registered packs as of manifest 2026.08.8)" drift note and the `app.css?v=2` reference (index.html now serves `?v=4`) — per T107 (partial) — **2026-08-13: CLAUDE.md refreshed — drift note now reads 629 items across 89 registered packs as of manifest 2026.08.15; `app.css?v=2` → `?v=4` (matches index.html); gate count 14 → 15 with the gate-15 prose-fence contract described**

---

## Phase 10: Convergence

**Purpose**: Close the gaps found when the delivered library was re-assessed against spec, plan, and
tasks on 2026-08-13 (second pass). `validate.mjs --final` still exits 0 with 0 warnings and every
mechanical gate is green, but two of the library's source references have gone dead since their
`checked` date through external link rot — a class of drift no validator gate catches (gates check
presence/freshness/host, not liveness) and that both this session's and the historical `check-refs.mjs`
runs missed, because the URLs came back as bot-blocked "unverified" rather than a clean 4xx in every
run so far. Confirmed genuinely dead (not a network artifact of this run) via a fetch path independent
of the one `check-refs.mjs` and local `curl` both used, which is itself heavily rate-limited against
`developer.android.com` in this environment. Two items remain.

- [X] T114 Fix `cmp-0013` and `cmp-0018` in `content/packs/compose-g-1.json`: their only reference,
  `https://developer.android.com/develop/ui/compose/performance/metrics`, now 404s, leaving both items
  with zero live "more info" sources. Repoint both to
  `https://developer.android.com/develop/ui/compose/performance/stability/diagnose` (confirmed live,
  confirmed to cover Compose compiler metrics/reports — the same content the dead page covered) and
  re-date `checked` to the date verified per FR-024 per FR-026, SC-010, SC-017 (partial) — **2026-08-13:
  both refs repointed, `checked: "2026-08-13"`, `updatedIn: "2026.08.16"`; new URL confirmed live and
  on-topic via an independent fetch path (not local curl, which is bot-walled against
  `developer.android.com` in this environment). Gate 13's version-claim screen flags cmp-0018 for "AGP
  9.3" — audited: the replacement page's `composeCompiler {}` DSL example is the exact setup the item
  describes, reference sources the claim. cmp-0013 is also flagged, on "unstable" (substring-matches
  "stable") — audited and judged a screen over-report: it names no version, date, or deprecation, so
  FR-023's durable-engineering-reasoning exclusion applies; no second reference needed**
- [X] T115 Fix `bt-0018` in `content/packs/build-testing-g-2.json`: its second reference,
  `https://android-developers.googleblog.com/2017/09/announcing-google-play-app-signing.html`, now
  404s (the item's first reference is still live, so this is a secondary-reference defect, not a total
  sourcing loss). Repoint it to `https://developer.android.com/studio/publish/app-signing` (confirmed
  live, confirmed on-topic — Play App Signing key management) or drop it, and re-date `checked` if kept
  per FR-026, SC-010 (partial) — **2026-08-13: dead ref dropped (the item's first ref already covers
  Play App Signing); `checked` on the surviving ref re-dated to 2026-08-13, `updatedIn: "2026.08.16"`.
  Gate 13 flags the item on "Android 9" — audited: the surviving ref does not source the specific
  "Android 9+ supports in-app rotation via APK Signature Scheme v3" claim (confirmed by direct fetch of
  its content), so a second reference was added — `source.android.com/docs/security/features/apksigning/v3`
  (confirmed live, confirmed to state "Android 9 supports APK key rotation") — closing the gap SC-009(c)
  exists to catch. Registered as release `2026.08.16` (`sync-manifest.mjs --write --release 2026.08.16
  --date 2026-08-13`, 0 new packs, version bump only); `validate.mjs --final` exits 0 with 0 warnings;
  CLAUDE.md's manifest-version drift note bumped 2026.08.15 → 2026.08.16 to match**
