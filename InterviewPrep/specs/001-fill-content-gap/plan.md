# Implementation Plan: Fill the Content Gap to a Complete Study Library

**Branch**: `001-fill-content-gap` | **Date**: 2026-08-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-fill-content-gap/spec.md`

## Summary

Take the study library from 93 items to 629 across 13 tracks, without disturbing a single byte of any
candidate's learning state. The content work is the bulk — 536 new items authored by the existing
`fill-content-gap` workflow in four staged releases — but it cannot land safely on the app as it stands.
Three defects block it, and all three are fixed first, in a platform stage that ships before any content:

1. **The library will not fit.** The snapshot stores every item three times and lives in localStorage.
   Measured, that projects to ~8.17 M chars (≈16.3 MB) at 629 items against a ~5 MB cap — and the write
   failure is silent, so offline study and the candidate's own ratings would stop saving with no notice.
   Fix: persist one canonical copy, move it to IndexedDB, surface every storage failure.
2. **Re-authoring the plans would corrupt ticks.** Hand-ticks are keyed by schedule *position*
   (`dayIdx:taskIdx`), so replacing a plan's contents silently marks unread material as done. Fix: anchor
   completion to a material signature, with a one-time migration that runs before the snapshot swap.
3. **Release history renders out of order at `.10`.** String sorting puts `2026.08.10` below `2026.08.9`,
   and this feature's own release train hits exactly that. Fix: render manifest order, assert it in the
   validator.

Then four content stages, then free study plus re-authored plans last (FR-031). Every stage is registered,
validated, and link-checked before it is offered, so the library is coherent at every intermediate point.

## Technical Context

**Language/Version**: JavaScript, ES2020 modules, no transpile and no build step. Node.js ≥ 18 for the CLI
tools under `tools/` (`node:` imports, top-level `await` in `.mjs`).

**Primary Dependencies**: none. No npm, no `package.json`, no framework, no CDN. Browser platform APIs
only — `fetch`, `localStorage`, **IndexedDB** (introduced by this feature),
`navigator.storage.estimate()`. Python 3 backs `tools/serve.sh`.

**Storage**: three-way split. Content source of truth → JSON on disk under `content/`. Pinned content
snapshot → **IndexedDB** (`aip` / `snapshot` / key `current`), moved off localStorage here. Learning state
→ localStorage under `aip.v1.`, keyed by permanent item id, unchanged.

**Testing**: `node tools/validate.mjs` (content integrity — the gate FR-022/SC-011 names; extended with 14
new gates by this feature), `node tools/check-refs.mjs` (network-probes every ref URL — the SC-010 gate),
and manual browser verification over `bash tools/serve.sh`. There is no unit-test runner and none is
added; the scenarios in [quickstart.md](./quickstart.md) are the acceptance procedure.

**Target Platform**: evergreen desktop browsers served over `http://localhost:8777`. `file://` is hard-
blocked — `fetch()` of local JSON fails there and `app.js` stops with a notice.

**Project Type**: static single-page site + versioned JSON content packs + Node CLI tooling. Single
project; no client/server split, no API surface.

**Performance Goals**: first render from the persisted snapshot with zero network calls; snapshot read +
derive `items`/`byId` under ~300 ms at 629 items; a no-op update check stays one manifest fetch.

**Constraints**: offline-capable after first load; no build step and no dependencies may be introduced;
the snapshot must fit device storage with headroom (SC-015); every storage failure must be surfaced
(FR-034); **item ids are permanent — never reused, reassigned, or renumbered**, which is the one rule in
the repo with no acceptable exception.

**Scale/Scope**: 629 items across 13 tracks in ~90 pack files; 536 new items authored by agents; 70
existing items remediated; 3 study modes; 5 content/mode releases plus 1 platform stage that carries no
release.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` was the unmodified Spec Kit template — every principle a
`[PRINCIPLE_N_NAME]` placeholder — until the 2026-08-09 analysis pass, which **ratified it at 1.0.0** from
the invariants this plan was already gating against informally. The five principles below are those
invariants, now with authority rather than by convention.

| Principle | Verdict | Notes |
|---|---|---|
| **I. Item identifiers are permanent** (non-negotiable) | **PASS** | Reinforced: validator gate 1 checks uniqueness across *every* pack file on disk, registered or not. The orphaned `co-0049`–`co-0055` are adopted rather than reissued (R-010), and T030 exists solely to stop the workflow minting them twice |
| **II. Content and learning state are physically separate** | **PASS** | Strengthened — they move into physically separate stores. The one indirect path by which a release *could* corrupt state, Principle II's explicit "keying progress to a position content rewrites", is the positional plan tick closed by R-005 |
| **III. A release is offered, never imposed** | **PASS** | The diff modal, the decline path, and FR-020's disclosure of every tick that will be cleared are all preserved; the update mechanism's diff/disclose/apply behaviour is explicitly out of scope |
| **IV. Every claim is sourced and dated** | **PASS** | Gates 3, 9, 10, 11 and 13 plus `check-refs.mjs`; the editorial half is assigned to named review steps (T098, T099) rather than left implicit, which is what the principle asks for |
| **V. No build step, no dependencies** | **PASS** | IndexedDB is a platform API, not a dependency. Nothing added needs npm, a bundler, or a CDN |
| **Quality Gates** — validator authority, manifest as registry, version bump required | **PASS** | `sync-manifest.mjs` stays the only writer of `manifest.json`; gate 1 makes unregistered packs visible instead of invisible; Stage A deliberately carries no release because it changes no content |

**Post-Phase-1 re-check**: unchanged, all PASS. The design added no dependency, no build step, and no new
writer of `manifest.json`. One item is tracked below.

**Post-analysis re-check (2026-08-09)**: unchanged, all PASS, now against ratified principles rather than
borrowed ones. The analysis pass strengthened two of them — Principle I gained a delivery-time check that
all 93 pre-existing identifiers survive (T101b), and Principle IV gained the gate 13 screen so SC-009 is
measured over a named set instead of asserted.

## Project Structure

### Documentation (this feature)

```text
specs/001-fill-content-gap/
├── plan.md                       # This file
├── spec.md                       # Feature specification
├── research.md                   # Phase 0 — 14 resolved decisions, all measured
├── data-model.md                 # Phase 1 — content vs learning-state entities
├── contracts/                    # Phase 1
│   ├── content-schema.md         #   item / pack / manifest / plan JSON
│   ├── storage-contract.md       #   localStorage + IndexedDB, failure reporting
│   └── cli-contract.md           #   validate / sync-manifest / check-refs / workflow
├── quickstart.md                 # Phase 1 — 9 runnable validation scenarios
├── checklists/requirements.md    # spec-quality, closed
├── checklists/content.md         # content quality & sourcing, closed 2026-08-09 (R-013)
└── tasks.md                      # Phase 2 — NOT created by /speckit-plan
```

### Source Code (repository root — `/Users/nn/InterviewPrep`)

The Spec Kit scaffold lives at `InterviewPrep/`; **all implementation happens one level up**, in the app
itself. Files this feature touches are marked.

```text
index.html                        # M  storage-failure banner; app.css?v= bump
assets/
├── css/app.css                   # M  banner + mode-chooser styles
└── js/
    ├── store.js                  # M  IndexedDB snapshot, single copy, write() reports failure
    ├── content.js                # M  persist canonical shape, derive items/byId, async applyUpdate
    ├── app.js                    # M  await applyUpdate, banner, tick migration before the swap
    ├── srs.js                    #    unchanged
    ├── search.js  md.js  levels.js  # unchanged
    └── views/
        ├── plan.js               # M  mode chooser; ticks keyed by material signature
        ├── dashboard.js          # M  free-study "today" surface replaces the plan card
        ├── whatsnew.js           # M  render manifest order; drop the string sort
        ├── cheatsheets.js        # M  one-line fix: render all cheatsheet packs, not just 'cheatsheets'
        └── topics.js item.js drill.js dsa.js design.js mock.js settings.js   # unchanged
content/
├── manifest.json                 # M  via sync-manifest.mjs only — 5 releases
├── packs/*.json                  # +  67 new packs; 70 existing items remediated
└── plans/{7day,14day}.json       # M  re-authored in Stage F
tools/
├── validate.mjs                  # M  14 new gates, --final flag (promotes 4,5,8,9,12)
├── sync-manifest.mjs             # M  --date flag; stamps generatedAt
├── check-refs.mjs                #    unchanged
├── serve.sh serve.py             #    unchanged
└── REFRESH.md                    # M  Q&A-only word band; FR-018 trim rules for remediation
.claude/workflows/
├── fill-content-gap.js           # M  house rules vs FR-032/SC-017/FR-035/FR-025; cross-track
│                                 #    dedup; coroutines id range
├── outlines/*.json               # +  9 more track outlines cached; each gains frozen scope[]
│                                 #    and coverage{} (FR-003/SC-019)
└── duplicates.json               # +  near-duplicate adjudication ledger (FR-004/SC-020)
```

**Structure Decision**: single project, unchanged. The app is vanilla ES modules loaded directly by
`index.html`; views are `renderView(el, { param, query, snapshot })` modules registered in the `routes`
map in `app.js`. This feature adds **no new view and no new module** — free study is a third value of the
existing mode selector rendered by `views/plan.js`, not a fourth destination. The only structural change
is that `store.js` gains an IndexedDB path alongside its existing localStorage one, which keeps all
persistence in the one module that is already allowed to touch it.

## Implementation Stages

Sequencing is derived in [research.md R-011](./research.md). Stage A must precede all content: by Stage B
the snapshot already passes 2 MB, and today's code would fail to save it without saying so.

| Stage | Release | Work | Gate |
|---|---|---|---|
| **A — Platform** | *(none — app code is not in the snapshot)* | IndexedDB + single-copy snapshot + migration (R-003); storage-failure banner (R-004); material-signature ticks + migration (R-005); What's New ordering (R-009); 14 validator gates + `--final` (R-008); `sync-manifest --date` (R-012); workflow house rules incl. the FR-035 rubric, cross-track dedup and **checkpoint preservation so a frozen `scope[]` survives the outline run** (R-007); cheatsheets one-liner (R-012) | `validate.mjs` exits 0 on unchanged content; quickstart Scenario 1 |
| **B — Content 1** | `2026.08.7` | kotlin 57, coroutines **40** (+7 adopted from `coroutines-g-5`), compose 64 = **168**; remediate 16 trims; freeze scope + fill coverage; re-verify version truths | Scenarios 2, 5, 8, 9 |
| **C — Content 2** | `2026.08.8` | platform 50, architecture 43, data-networking 36, performance 37 = **166**; remediate 22 trims; freeze scope + fill coverage; re-verify version truths | Scenarios 2, 5, 8, 9 |
| **D — Content 3** | `2026.08.9` | build-testing 58, security-kmp 67 = **125**; remediate 5 trims; freeze scope + fill coverage; re-verify version truths | Scenarios 2, 5, 8, 9 |
| **E — Content 4** | `2026.08.10` | dsa 41, system-design 14, behavioral 22 = **77**; remediate 3 trims + **24 ref additions**; freeze scope + fill coverage; re-verify version truths | Scenarios 2, 5, 7, 8, 9 (`.10` proves the ordering fix) |
| **F — Modes** | `2026.08.11` | Free study + mode chooser (R-006); tick migration executed; both plans re-authored against the full library, each declaring the `pace.dailyMinutes` its schedule fits | Scenarios 3, 4, 6, 8, 9; `validate.mjs --final` (gate 14 checks both plans against their own budgets) |

536 new items = 168 + 166 + 125 + 77. With the 93 existing → **629**.

Each track's FR-018 remediation (46 answer trims + 24 ref additions = 70 items, per-track table in
[research.md R-002](./research.md)) rides in the stage that expands that track, so no track is ever
half-compliant. Every remediated item gets `updatedIn` set to that stage's release.

**Four obligations recur in every content stage** (B–E), added by the 2026-08-09 spec amendments and
analysis pass, and sequenced in [contracts/cli-contract.md §6](./contracts/cli-contract.md): a track's
`scope[]` is frozen *before* it is authored and its `coverage{}` filled after (FR-003/SC-019); the
version-truth registry is re-verified and `stackSnapshotChecked` re-stamped (FR-036); every near-duplicate
pair the screen flags is adjudicated into `duplicates.json` **before the stage is registered**
(FR-004/SC-020); and at least ten of gate 13's flagged items are read to confirm their reference sources
its claim (SC-009). None can be done retroactively — a scope frozen after authoring measures nothing, and
a duplicate adjudicated after registration can no longer be merged — which is why they are stage work
rather than a delivery checklist item.

## Key Decisions Carried Into Implementation

Full reasoning and measurements in [research.md](./research.md); the normative forms are in
[contracts/](./contracts/).

- **R-001 — the word band is a Q&A rule.** Resolved by the user on 2026-08-09. 120–250 words (ceiling 350,
  floor 80) governs `answer` on `type: "qa"` only. `concept`, `dsa`, and `design` carry no band; the
  literal reading would have put 18 of 19 problem statements *below* the floor and halved every system-
  design reference answer. The mandatory "more info" reference stays library-wide.
  *Assumption flagged*: `concept` (the 5 cheat sheets, already frozen at current size by the spec) is
  treated as outside "Q&A". Including it would add 4 trims and change nothing else.
- **R-002 — the remediation set is 46 trims + 24 ref additions = 70 items**, which is what FR-018 now
  states; the spec's earlier 13/24/24 figures counted `dsa`/`design` items' *missing* `answer` field as
  zero words. `validate.mjs` and the canonical word-count algorithm are the authority — and the counter
  is load-bearing, not incidental: whitespace-delimited counting gives 48 trims and 9 ceiling breaches
  instead of 46 and 7, moving compose and platform from 9 trims each to 10.
- **R-003 — dedup alone is insufficient.** One canonical copy still projects to ~5.6 MB at 629 items, over
  the cap with no headroom. Both changes are required: single copy *and* IndexedDB.
- **R-005 — the migration ordering is load-bearing.** Ticks must be re-anchored *before* `applyUpdate()`
  swaps the snapshot, because the outgoing plan exists only inside the snapshot being replaced.
- **R-010 — the orphaned coroutines pack is adopted**, and it changes how Stage B runs: it holds outline
  indices 40–46, so the remaining coroutines authoring is 40 items (`co-0009`–`co-0048`), not the 47 the
  wave config currently specifies. Re-running the default would mint those seven ids twice.
- **R-014 — the cross-artifact analysis pass of 2026-08-09** re-measured every numeric and line-number
  claim in these documents against the live repository and resolved 19 findings, none critical. Four
  changed real work: `write()` throws rather than returning a boolean (the two documents disagreed);
  gate 8 reads packs off disk, because adjudication happens before registration and a registered-only
  screen would have reported zero pairs every time; `outlinePrompt` STEP 4 must preserve a frozen
  `scope[]` instead of overwriting the checkpoint, which would silently have undone the freeze for **nine**
  of the twelve tracks; and the adopted coroutines pack is re-dated, its refs carrying the workflow's
  `2026-08-07` default rather than a date anything was checked on. Three criteria that were asserted
  became measurable — SC-006 via a declared `pace.dailyMinutes` and gate 14, SC-009 via the gate 13
  version-claim screen, SC-018 via a baseline id capture — and FR-010's "interview weight" became a table.
  Full record in [research.md R-014](./research.md).
- **R-013 — the spec was amended on 2026-08-09**, closing all 17 items of
  [checklists/content.md](./checklists/content.md). Two new requirements (FR-035 level rubric, FR-036
  version-truth currency), two new criteria (SC-019 subject coverage, SC-020 duplicate adjudication), and
  tightened wording on FR-003/004/005/018/023/024/025/032 and SC-002/009/014. For this plan it means four
  more validator gates, five more workflow house rules, one new manifest field
  (`stackSnapshotChecked`), two new authoring-evidence records under `.claude/workflows/`, and the three
  recurring stage obligations above. **No change to Stage A's app-code work** — storage, tick migration,
  free study, and release ordering are untouched by the amendments.

## Complexity Tracking

> Filled because one design decision adds a moving part that a reviewer should be able to challenge.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| IndexedDB introduced alongside localStorage in `store.js` | FR-033/SC-015 require the whole 629-item library to be storable with room to spare. Measured: today's shape projects to ~16.3 MB and a deduplicated shape to ~5.6 MB, both over the ~5 MB localStorage cap | **Dedup only** leaves ~5.6 MB — still over, and the candidate's progress competes for the same budget. **Trim harder** buys ~0.8 MB and fails SC-015's "room to spare". **Compress into localStorage** needs base64 (+33%) and an async codec behind a synchronous API. **Cache API** re-parses every pack on every boot and spreads the snapshot across many keys, complicating the wholesale-swap invariant |
| `applyUpdate()` becomes async | Consequence of the above | Keeping it synchronous is impossible against IndexedDB; the blast radius is one call site (`app.js:184`) |

Deliberately **not** taken on, per the spec's own scoping: the drill queue's shape at 629 items (recorded
as a follow-up), and `checkForUpdates()` refetching ~60 packs when versions differ (acceptable on
localhost).
