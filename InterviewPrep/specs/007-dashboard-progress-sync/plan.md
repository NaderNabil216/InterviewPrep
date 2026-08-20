# Implementation Plan: Dashboard Progress Reflects Completed Questions

**Branch**: `007-dashboard-progress-sync` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-dashboard-progress-sync/spec.md`

## Summary

The product defines "progress" three incompatible ways over one body of stored learning state. This
feature collapses all three into a single read-time definition — **a question is completed once it
carries a review schedule, i.e. once `rate()` has run against it at least once** — and routes every
surface that shows or acts on completion through one new pure module.

The technical shape is deliberately narrow:

1. **New `assets/js/progress.js`** — a storage-free, pure module holding the single definition and
   every derived figure (`isCompleted`, `coverageByTrack`, `reviewQueue`, `dueCountOf`,
   `weakestTracks`, `todayLocalISO`, `statusOf`). It imports nothing. It is the only place any of
   these are computed.
2. **`assets/js/srs.js` becomes a thin storage-bound adapter** over that module: it reads
   `Store.getProgress()` and delegates. `masteryByTrack` (the `interval >= 21` reading) is replaced
   by `coverageByTrack`; `buildQueue` stops dropping note-only records; `todayISO`'s UTC arithmetic
   is replaced by the local-calendar one.
3. **Every consuming view is re-pointed** at the single definition and its labels rewritten to name
   the population each figure counts.
4. **New `tools/check-progress.mjs`** — a dependency-free Node check that imports the same pure
   module, asserts the accounting against a synthetic history with known expected results, and then
   re-runs the identical assertion battery against six deliberately-broken stand-ins for the defects
   this spec describes, requiring each to be caught. It runs standalone **and** as gate 16 of
   `node tools/validate.mjs`, so a regression fails the gate that already governs release.

No content pack, plan file, manifest entry, or item id is touched, and **nothing stored is written,
migrated, or removed** — the corrected figure is derived at read time from records already on the
device (FR-022). Because no content changes, no manifest `version` bump is required.

One in-scope change is already present, uncommitted, in the working tree: `assets/js/views/cheatsheets.js`
grew a **Mark complete** action, which is FR-028. It needs to move onto this feature's branch (see
Structure Decision below).

## Technical Context

**Language/Version**: Vanilla JavaScript (ES modules, no transpilation, no bundling) served straight
to the browser; HTML5; CSS3. Node — v26.3.1 in this environment — is used only for the repo's own
CLI tools under `tools/`.

**Primary Dependencies**: None, and none added (constitution Principle V). The feature reuses
existing modules only, and adds two first-party files (`assets/js/progress.js`,
`tools/check-progress.mjs`). `tools/check-progress.mjs` uses `node:fs`/`node:path`/`node:url` from
the standard library and nothing else.

**Storage**: Unchanged in shape and content.
- `localStorage` `aip.v1.progress` — the per-item learning records this feature *reads differently*
  and never rewrites.
- `localStorage` `aip.v1.plan` (`mode`, `activePlan`, `startedAt`, `done` keyed by material
  signature, legacy `checked`), `.session`, `.settings`, `.mockResults`, `.scratch.<id>` — read-only
  from this feature's point of view except where the candidate themselves ticks a plan task.
- IndexedDB `aip` / `snapshot` / `current` — the content snapshot. Untouched.

**Testing**: No test runner and none added. Verification is (a) `node tools/check-progress.mjs`, the
new dependency-free accounting check, which also runs inside `node tools/validate.mjs` as gate 16,
and (b) the written manual procedure in [quickstart.md](./quickstart.md), which covers every
acceptance scenario in the spec with its expected result (FR-026).

**Target Platform**: Any modern browser, mobile Android Chrome as the primary target, served over
`http://localhost` via `bash tools/serve.sh` (never `file://`). The Node check requires **Node ≥
22.7**, where ES-module syntax detection lets `tools/check-progress.mjs` import
`assets/js/progress.js` directly despite the `.js` extension and the deliberate absence of a
`package.json` — verified working on v26.3.1 (see [research.md](./research.md) §2).

**Project Type**: Single flat static web app plus a small Node CLI tool directory. No build step, no
frontend/backend split, no `src/`/`tests/` split, and none introduced.

**Performance Goals**: No regression. Every figure is an O(n) pass over the in-memory snapshot's 629
items against an object lookup — the same order of work `masteryByTrack` already does per render.
`Store.getProgress()` (one `localStorage.getItem` + `JSON.parse`) is read once per view render and
passed down, rather than once per item as `statusOf(id)` does today in Topics' 550-row list.

**Constraints**:
- **No stored record may be written, migrated, or removed by this change** (FR-022, FR-023,
  constitution Principle II). Every corrected figure is derived at read time. The one exception is
  the candidate's own deliberate action (marking complete, ticking a task), which is unchanged.
- No item id, content pack, `content/manifest.json` entry, or `content/plans/*.json` file may be
  edited (constitution Principle I).
- No third-party dependency, `package.json`, bundler, or CDN (constitution Principle V). The shared
  pure module must be loadable by both a browser `<script type="module">` graph and a Node `.mjs`
  CLI without a build step or a duplicate copy — the latter would reintroduce exactly the
  multiple-definitions defect this feature exists to remove (FR-006).
- `node tools/validate.mjs` must still exit `0` after the change, now including gate 16.
- `assets/css/app.css` changes require bumping `app.css?v=` in `index.html` (currently `v=8` → `v=9`).
- The corrected reading must apply silently: no notice, confirmation, or decline step (FR-019).

**Scale/Scope**: 629 items across 89 registered packs in 13 tracks (manifest `2026.08.34`, confirmed
by reading the packs). 11 of the 13 tracks are covered by the Topics browser; `dsa` (60 items,
`type: dsa`) and `system-design` (19 items, `type: design`) are reached through dedicated workspaces
and are excluded from Topics and from the review queue. The feature touches 1 new app module, 1 new
CLI tool, 10 existing app modules, 1 stylesheet, `index.html`, and `tools/validate.mjs`. No content
files.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Verdict | Basis |
|---|---|---|
| **I. Item Identifiers Are Permanent** (NON-NEGOTIABLE) | **PASS** | No item is added, removed, renumbered, or re-keyed. No pack file, no `content/manifest.json`, no `content/plans/*.json` is touched. Learning records stay keyed by the same permanent ids they already use; the feature only changes how those records are *read*. A record whose id has been retired from the library is explicitly excluded from every total (all counting iterates over `snapshot.items`, never over `Object.keys(progress)`) — which also fixes the current dashboard headline, the one place that counts over progress keys and so counts orphans. |
| **II. Content and Learning State Are Physically Separate** | **PASS** | No new path from content to learning state is created, and one existing indirect path is *narrowed*: the plan-tick reading stops depending on the mere existence of a record and starts depending on an explicit completion, while tick identity remains the material signature `signature(itemIds)` from `store.js`, never a `dayIdx:taskIdx` position. Zero writes to `aip.v1.progress` are introduced. The whole correction is read-time (FR-022), which is what makes "no migration" achievable rather than aspirational. |
| **III. A Release Is Offered, Never Imposed** | **PASS** | No content release, diff, sync, or `migrateTicks()` behaviour is touched. FR-019's silent correction is **not a release**: nothing arrives from disk, and nothing stored is written, altered, or removed — a plan task that read as done only because a note was saved simply stops *reading* as done, while `aip.v1.plan.done` itself is byte-identical and every affected task stays tickable by hand. Nothing becomes unrecoverable, so the principle's disclosure trigger ("changes anything the candidate cannot get back") is not met and the v1.1.0 amendment is not even needed. See [research.md](./research.md) §7 for the full argument. |
| **IV. Every Claim Is Sourced and Dated** | **PASS** | No version, date, deadline, default, or platform-behaviour claim is added, changed, or removed. No `refs`, no `stackSnapshot`, no `stackSnapshotChecked`. |
| **V. No Build Step, No Dependencies** | **PASS** | Vanilla ES modules and CSS only; the new CLI check uses Node's standard library only. No `package.json`, no bundler, no CDN, no test framework. The shared pure module is a single plain `.js` ES module consumed unmodified by both the browser and Node — no duplicate, no transpile, no rename (research.md §2). Verification remains "load the site and run the repo's own tooling", with the tooling strictly extended. |

No violations. Complexity Tracking is not needed.

**Post-Phase-1 re-check**: The Phase 1 artifacts introduce no persisted entity, no schema change and
no content edit. [data-model.md](./data-model.md) records the derived-only nature of every new value
and pins the `status` field written by `rate()` as **vestigial — written for record-shape stability,
read by nothing**, so no reader can resurrect the `interval >= 21` definition.
[contracts/progress-api.md](./contracts/progress-api.md) fixes the pure module as import-free and
side-effect-free, which is what keeps the Node check and the browser on one definition rather than
two copies. [contracts/check-progress-cli.md](./contracts/check-progress-cli.md) confirms the check
adds no dependency and returns structured failures to `validate.mjs` rather than calling
`process.exit` from inside it. All five verdicts above stand unchanged after design.

## Project Structure

### Documentation (this feature)

```text
specs/007-dashboard-progress-sync/
├── plan.md                       # This file (/speckit-plan command output)
├── research.md                   # Phase 0 output (/speckit-plan command)
├── data-model.md                 # Phase 1 output (/speckit-plan command)
├── quickstart.md                 # Phase 1 output — also the FR-026 manual procedure
├── contracts/                    # Phase 1 output (/speckit-plan command)
│   ├── progress-api.md           #   the pure module's exported surface + invariants
│   ├── ui-surfaces.md            #   per-surface figures, exact labels, populations
│   └── check-progress-cli.md     #   the check's invocation, output, exit codes, defect matrix
├── checklists/
│   └── requirements.md           # pre-existing spec-quality checklist (validated, 2 iterations)
└── tasks.md                      # Phase 2 output (/speckit-tasks — NOT created by /speckit-plan)
```

### Source Code (repository root)

Flat, no-build static site plus a Node CLI directory. All work happens one level up from this Spec
Kit scaffold, in `/Users/nn/InterviewPrep`:

```text
assets/js/
├── progress.js            # NEW — the single definition. Pure, imports nothing, storage-free.
│                          #   isCompleted, statusOf, coverageByTrack, coverageTotals,
│                          #   weakestTracks, notCompleted, reviewQueue, dueCountOf,
│                          #   todayLocalISO, isDrillable          (US1-US5)
├── srs.js                 # thin adapter over progress.js: rate() keeps its interval math;
│                          #   todayISO -> todayLocalISO (US5); buildQueue stops dropping
│                          #   note-only records (US3); masteryByTrack -> coverageByTrack (US1)
├── store.js               # UNCHANGED — read to confirm no write path is added
├── app.js                 # navigate() re-renders when the target hash equals the current one,
│                          #   so asking for the surface you are on re-reads history (FR-021)
└── views/
    ├── dashboard.js       # headline counts, coverage bars w/ n/total + %, due figure scoped to
    │                      #   the review queue, weakest tracks + Next up by coverage (US1, US2, US4)
    ├── plan.js            # autoDone() uses completion not record-existence (US2, US3);
    │                      #   free-study Due/Not-started/Weakest cards match the dashboard (US2)
    ├── topics.js          # two-state status filter + dot; legacy ?status= values fall back to
    │                      #   'all'; debounced keyword sync uses replaceState (US2, FR-021)
    ├── item.js            # status line reads Not started/Completed; save-failure guard (US1 #10)
    ├── cheatsheets.js     # Mark complete on a sheet — ALREADY IN THE WORKING TREE (FR-028)
    ├── dsa.js             # list status dot -> two states; save-failure guard
    ├── design.js          # list status dot -> two states; save-failure guard
    ├── drill.js           # save-failure guard: a failed write neither advances nor counts
    └── mock.js            # save-failure guard: same

assets/css/
└── app.css                # .status-dot--not-started / --completed replace --new/--learning/
                           #   --known/--due; .coverage-row replaces .mastery-row (3 -> 3 cols,
                           #   wider trailing cell for "12/70 · 17%")

index.html                 # app.css?v=8 -> ?v=9

tools/
├── check-progress.mjs     # NEW — dependency-free accounting check. Exports runProgressChecks()
│                          #   for gate 16; runs standalone with its own exit code. (US6)
└── validate.mjs           # gate 16 calls runProgressChecks(); each failure becomes an err()
```

**Structure Decision**: Single flat static-site project with a sibling Node CLI directory
(constitution Principle V — no build step, so no `src/`, no `tests/`, no bundle entry point). The one
structural addition is the extraction of `assets/js/progress.js` as a **pure, import-free module**.
That extraction is the feature: FR-006 demands one definition with no surface applying its own
variant, and FR-025 demands the accounting be checkable from Node — a module that touches neither
`localStorage` nor `indexedDB` is the only shape that satisfies both without a second copy of the
logic. `srs.js` keeps its existing exported names where views already import them, so the change
lands as a re-pointing rather than a rewrite of ten call sites' import lists.

**Branch note**: `git` is currently on `fix/006-ui-polish-fixes`, and
`.specify/scripts/bash/setup-plan.sh` reported an empty `BRANCH`. Implementation must start by
branching off `main` as `fix/007-dashboard-progress-sync` (matching the 006 naming in this repo's
history) and moving the uncommitted `assets/js/views/cheatsheets.js` change — which is FR-028, not
006 work — onto it.

## Complexity Tracking

*No violations recorded — table intentionally omitted.*
