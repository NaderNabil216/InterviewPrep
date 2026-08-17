# Implementation Plan: Labelled Answer Sections and Plain-Spoken Kotlin Q&A

**Branch**: `feat/004-kotlin-qa-clarity` (off `main`) — feature state is tracked in
`.specify/feature.json`, not parsed from the branch name; the branch does not exist yet |
**Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-kotlin-qa-clarity/spec.md`

## Summary

Two changes that share a feature and almost nothing else. The first is presentation: seven fixed
labels (FR-001) that make an item's existing structure visible, applied on the three surfaces that
reveal an item's content — the question page, the Drill reveal, the Mock reveal — and keyed to the
**item's type**, never to the page it renders on. That predicate is the whole design: search, Drill
and Mock all route non-Q&A items through Q&A-shaped layouts, so a per-page rule would leak labels
onto DSA problems, design scenarios and cheat sheets by three separate paths. One new 20-line module
(`assets/js/sections.js`) holds the seven strings and the predicate; three views import it; `md.js`
is not touched, because `renderCodeBlock()` is shared with the DSA page and a label emitted from
inside it would leak there. The predicate cuts both ways, and the second edge is the easier one to
miss: three sections already carry a heading, and those headings render for **unlabelled** items too
— all 84 of them show `Sources`, and the 60 DSA items also show `Likely follow-ups`. Replacing them
unconditionally would delete a heading from content that gets no label back, which is what SC-007a
forbids, so the swap is gated on the same predicate
([contract §Replaced markup](./contracts/section-label-contract.md#replaced-markup--conditional-on-islabelleditem),
check C10).

The second is authoring: 70 Kotlin questions rewritten as spoken English, then 70 deep answers plus
their traps, follow-ups and code captions rewritten in the same register, in 14 per-pack batches
each, gated by `validate.mjs` plus a named two-question human read-through (still true? still sounds
right?). The two halves ship separately and in that order — labels as app code with no content
release at all, then one release for the questions, then one for the answers (FR-022a).

The riskiest thing here is not the code. It is **word budget**: `validate.mjs` gate 2b holds the
library at 545/545 Q&A answers inside the 120–250-word band, and Kotlin's answers already sit at the
top of it — median 231 words, maximum exactly 250, zero headroom. FR-014 forbids shortening and the
FR-013a exemplar's target rewrite is *longer* than the version it beats, so the natural drift of
this rewrite is upward, straight through the gate. Research R-006 turns that into a hard per-item
authoring ceiling. The second risk is a calendar one: both content releases stamp `updatedIn` on all
70 items, which pulls all 87 of their refs into gate 10's 30-day freshness window, and the oldest is
dated 2026-08-07 — so **both releases must be dated on or before 2026-09-06** or the refs must be
re-verified first (R-007).

## Technical Context

**Language/Version**: JavaScript, ES2020 modules, no transpile and no build step — unchanged from
`001-fill-content-gap` and `002-improvements`. Node.js ≥ 18 for `tools/`. Content is JSON authored by
hand in the restricted markdown dialect `md.js` implements.

**Primary Dependencies**: none, added or existing. This feature introduces no runtime dependency of
any kind — unlike `002-improvements`, nothing here makes a network call, and the one external-service
contract this repo has (Judge0 CE, on the DSA page) is untouched. Browser platform APIs only;
`color-mix()` in CSS is already in use (`.traps-box`, `assets/css/app.css:256`) and is the only
platform feature the new styling needs.

**Storage**: unchanged, and deliberately so. No new localStorage key, no snapshot shape change, no
IndexedDB migration. The content edits flow through the existing snapshot-replacement path; learning
state is not read or written by anything in this feature. Plan ticks are keyed by material signature
(`[...itemIds].sort().join('+')`), and rewriting an item's prose changes no id, so no signature moves
and `migrateTicks()` has nothing to re-anchor — a strictly weaker case than the one Principle III's
amendment was written for.

**Testing**: `node tools/validate.mjs` (existing 15 gates, unchanged — this feature adds none), plus
a `fielddiff`-style scope check per batch adapted from
`specs/002-improvements/verification/fielddiff.mjs`, plus the manual browser walkthrough in
[quickstart.md](./quickstart.md). The "no unit-test runner, and none is added" posture holds. The
current baseline is **0 errors and 0 warnings** (`validate.mjs`, 2026-08-17, manifest `2026.08.17`),
which is what makes a per-batch *zero-new-warnings* gate meaningful rather than noise — though
"no new warning" is measured against a run captured immediately before each batch, not against that
figure, since several gates are date-relative and this runs across 28 batches (FR-020a).

The 2026-08-17 requirements review added four checks the validator cannot make, all of which live in
the batch scope check or the walkthrough rather than in the app:

| Check | Why the validator cannot | Where |
|---|---|---|
| Fenced block in `code[].caption` | `caption` is absent from gate 15's `PROSE_FIELDS` list | scope check (FR-018) |
| `traps`/`followUps` entry counts unchanged | no gate constrains their cardinality | scope check (P12) |
| Answer within ±15% of baseline | the word band's floor is 42 words below the track's minimum, so it cannot see a large deletion | D3-1a (P7a) |
| Label contrast in both themes | not a content rule at all | D1-9, measured on the built page (C12) |

Gate 8 needs no new tooling but does need new *attention*: D2 rewrites 70 of its inputs, so it can
flag pairs that have nothing to do with a content error and everything to do with the rewrite
(FR-020b).

**Target Platform**: evergreen desktop browsers over `http://localhost:8777` (dev) and GH Pages
(prod), plus the browser print path — cheat sheets are the printed surface today, and the question
page shares the same global `@media print` block, which is why FR-007 exists.

**Project Type**: static single-page site + versioned JSON content packs + Node CLI tooling.
Unchanged. No new module family, no new directory.

**Performance Goals**: none newly introduced. The labelling adds seven `<div>`s to a render path that
already builds its HTML as one string; the predicate is a single `item.type === 'qa'` comparison per
render. Nothing here is on the boot path, the sync path, or the search index rebuild.

**Constraints**:
- **Word band (R-006)** — every rewritten Kotlin `answer` must land in 120–250 words under
  `validate.mjs`'s normative counter (the alphanumeric-run regex at `tools/validate.mjs:37`, counted
  over raw markdown — markdown syntax is not stripped and table cells count). Kotlin's
  current maximum is exactly 250, so the practical ceiling is *no growth on the longest items* and
  roughly +8% on the median one. FR-014 (nothing deleted, nothing relocated) sets the floor from the
  other side; the two together define the whole authoring envelope.
- **Length envelope (R-014)** — additionally, every rewritten `answer` lands within **±15%** of its
  baseline word count, or carries a recorded reason. The band and the envelope constrain from
  opposite sides and neither subsumes the other: the band's floor (120) sits 42 words below the
  track's actual minimum (162), so band-only checking would let an answer lose a third of its
  content silently. Where the two collide — an item at the ceiling that cannot absorb the register
  change — FR-014b fixes the resolution: rebalance, then if that fails, keep the content and record
  the band exception. A claim is never deleted to hit a word count.
- **Ref freshness (R-007)** — both content releases must be dated on or before **2026-09-06**
  (gate 10) and **2026-09-13** (gate 11), or the corresponding re-verification runs precede them.
  FR-022c turns that from a note into a control: the projection is checked **before the final batch
  of each delivery**, when there is still time to act, rather than at the release gate, when the
  release is what is blocked.
- **Accessibility (R-012)** — labels render as `<h4>`, and label text meets WCAG AA 4.5:1 in **both**
  themes. Deriving a colour from a theme token makes it resolve in both; it does not make it readable
  in both. The chosen treatment measures 7.77 dark / 4.71 light; the originally proposed one measured
  3.06 in light.
- **Item ids are permanent** — nothing in this feature adds, removes, renumbers or reuses one. The
  70 Kotlin items keep their ids and gain `updatedIn` twice, once per content release (FR-022a).
- Offline-first is unaffected; every change is either static CSS/JS or content already fetched by
  the existing snapshot path.

**Scale/Scope**:
- **Labels**: 545 Q&A items across 10 tracks gain labels on 3 surfaces; 84 items (60 `dsa`, 19
  `design`, 5 `concept` cheat sheets) are guaranteed to gain none, on any surface. 6 files touched
  (1 new, 5 edited); ~90 lines of JS and ~20 lines of CSS.
- **Prose**: 70 Kotlin items across 14 registered packs. 70 questions (D2); then 70 answers
  (~16,200 words), 140 traps, 210 follow-ups and 70 code captions (D3). 28 authoring batches total,
  14 per content release.
- **Releases**: 2 (`2026.08.18`, `2026.08.19` — see R-007), both cut with `tools/sync-manifest.mjs`.
  0 new pack files, 0 new item ids, 0 constitution amendments, 0 new validator gates.

## Constitution Check

*GATE: must pass before Phase 0 research; re-checked after Phase 1 design.*

| Principle | Pre-research | Post-design |
|---|---|---|
| **I. Item identifiers are permanent** (non-negotiable) | PASS — the feature rewrites field *values* on existing items; nothing adds, retires, splits, merges or renumbers an item (FR-019, SC-006) | **PASS** — data-model.md fixes the per-delivery mutable-field set and excludes `id` from all three; the per-batch scope check (quickstart.md §Batch gate) fails the batch on any id appearing or disappearing from a pack, so the rule is enforced mechanically rather than by care |
| **II. Content and learning state are physically separate** | PASS at face value — no story reads or writes progress (FR-023, SC-008) | **PASS**, and more strongly than the spec claimed. Plan ticks key on *material signature*, which is derived from item **ids**; this feature changes no id, so no signature moves and `migrateTicks()` is a no-op here. The release cannot disturb learning state even indirectly, because the only bridge between the two families is the id set and it is byte-identical before and after |
| **III. A release is offered, never imposed** | PASS under the v1.1.0 amendment — a prose-only release removes nothing and drops no tick | **PASS**, comfortably inside the amendment's narrow case and in fact stricter than it: the amendment permits silent auto-apply for releases whose only tick effect is *re-anchoring*, and these two releases do not even re-anchor. Nothing unrecoverable changes, so no disclose-before-apply step is owed. The `releases[]` summary each carries is the after-the-fact notice, and R-007 fixes its wording per release |
| **IV. Every claim is sourced and dated** | Flagged for research — a rewrite can silently strand a ref by dropping the only claim it supported (FR-017, SC-005), and re-stamping all 70 items pulls every ref into gate 10's freshness window | **PASS with a dated deadline** — R-007 works out both windows from the actual data (oldest Kotlin ref `checked` 2026-08-07 → gate 10 closes **2026-09-06**; `stackSnapshotChecked` 2026-08-14 → gate 11 closes **2026-09-13**) and names the fallback if either slips. The stranded-ref risk is not mechanically checkable and is therefore assigned to the named read-through (FR-021a), per the constitution's own "where a rule cannot be decided mechanically, assign it to a named human step" |
| **V. No build step, no dependencies** | PASS — presentation plus prose | **PASS** — one new plain ES module imported by three existing ones, one CSS block, no package, no bundler, no CDN, no network call. `color-mix()` is already used in this stylesheet |
| **Quality Gates** (validator authority, manifest registry, version-bump gating) | PASS — `validate.mjs` exits 0 per batch (FR-020), releases registered through `sync-manifest.mjs` (FR-022) | **PASS** — no gate is added, weakened or bypassed. The baseline being 0 errors *and* 0 warnings lets the batch gate demand zero new warnings, which is what catches the word-band drift R-006 identifies before it accumulates into a gate-2b summary failure at `--final`. `sync-manifest.mjs` remains the only writer of `manifest.json` |

**Verdict: PASS on all six, pre- and post-design. No violations to justify.**

## Project Structure

### Documentation (this feature)

```text
specs/004-kotlin-qa-clarity/
├── plan.md                            # This file
├── spec.md                            # Input
├── research.md                        # Phase 0 output — R-001..R-011
├── data-model.md                      # Phase 1 output
├── quickstart.md                      # Phase 1 output — validation walkthrough per delivery
├── contracts/
│   ├── section-label-contract.md      # UI contract: the 7 labels, the predicate, the surface matrix
│   └── prose-voice-contract.md        # Authoring contract: what may change per field, and the batch gate
├── checklists/
│   └── requirements.md                # Spec-quality checklist (pre-existing, passing 16/16)
└── tasks.md                           # Phase 2 output (/speckit-tasks — NOT created by this command)
```

### Source code (repository root: `/Users/nn/InterviewPrep` — the app, not this Spec Kit scaffold)

```text
assets/js/
├── sections.js                # NEW — SECTION_LABEL (the 7 fixed strings) + isLabelled(item);
│                              #   same shape and purpose as levels.js: one place that owns a
│                              #   user-visible vocabulary so no view hardcodes it
└── views/
    ├── item.js                # label q / shortAnswer / answer / each code sample; convert the
    │                          #   existing followUps <h4>, traps <h4> and refs <strong> to the
    │                          #   same treatment (FR-002) — but ONLY when isLabelled(item):
    │                          #   unlabelled items keep those three headings verbatim (SC-007a)
    ├── drill.js               # label q / shortAnswer / answer / the one code sample it shows
    └── mock.js                # same as drill.js, on the reveal body
assets/css/app.css             # + .section-label (one class, no variants) and its @media print
                               #   fallback; retire .traps-box h4 — safe because no unlabelled item
                               #   carries traps. There is NO .refs-box strong rule to retire; the
                               #   <strong> renders at the browser default and stays
index.html                     # app.css?v=6 → ?v=7 (stale-cache guard, per CLAUDE.md)
content/packs/kotlin-a.json    # D2: q ×70 · D3: answer, traps[], followUps[], code[].caption
content/packs/kotlin-b.json    #   — 14 pack files, 70 items, 5 items each except kotlin-a (8)
content/packs/kotlin-g-1..12.json  #   and kotlin-g-12 (2)
content/manifest.json          # written ONLY by tools/sync-manifest.mjs --write --release …
                               #   twice: 2026.08.18 (questions), 2026.08.19 (answers)
```

**Not touched, and deliberately**: `assets/js/md.js` (its `renderCodeBlock()` is shared with the DSA
page — R-003), `assets/js/views/dsa.js`, `design.js`, `cheatsheets.js` (FR-008a), `store.js`,
`content.js`, `srs.js`, `search.js` (FR-023), `tools/validate.mjs` (no new gate), every pack outside
the `kotlin` track including `coroutines-flow`.

**Structure Decision**: no new project shape. The one structurally new thing is
`assets/js/sections.js`, and it is deliberately modelled on the existing `assets/js/levels.js` — a
tiny module whose entire job is to stop views from hardcoding a user-visible string. `CLAUDE.md`
already states that rule for difficulty labels ("never hardcode a difficulty word in a view"); FR-001
fixes seven strings and FR-005 requires them identical across three surfaces, which is the same
problem and gets the same answer. Putting the predicate in the same module makes FR-006 structural:
there is one definition of "is this item labelled", not three that could drift.

## Complexity Tracking

> Filled only when the Constitution Check records a violation.

**None.** All six checks pass pre-research and post-design with no exception claimed, so there is
nothing to justify here. For contrast, `002-improvements` had to record two entries in this section
(an external network dependency and a constitution amendment); this feature adds no dependency,
needs no amendment, and introduces no new gate, module family or storage key.
