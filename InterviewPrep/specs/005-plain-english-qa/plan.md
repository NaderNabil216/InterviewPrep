# Implementation Plan: Very Simple English for Questions and Short Answers

**Branch**: `feat/005-plain-english-qa` (off `main`) — the branch does not exist yet |
**Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-plain-english-qa/spec.md`

## Summary

A library-wide prose rewrite, and nothing else. Every one of the 629 items carries a `q` field and a
3-bullet `shortAnswer`; this feature rewrites both fields in **Very Simple English (VSE)** — the
register fixed by two worked exemplars and a set of floor rules in the spec — so that a candidate
with basic English understands each on the first read. Two tiers by item kind: the full
conversational register on the 545 `qa` items across 10 tracks (the interview questions the user is
describing), and only the plain-words / short-sentences half on the 84 `dsa` / `design` / `concept`
items, whose task, scenario and reference form is preserved.

It is **prose only, no app code and no validator change** (scope constraint 5): the entire apparatus
is authoring discipline plus the existing 15-gate `validate.mjs`. The register cannot be decided
mechanically, so it is enforced by per-pack batches — one reference batch first (FR-026), then 88
more — each gated by validator + scope check + two mechanical screens + a named two-question human
read-through (still true? reads simple?), with the outcome recorded as evidence, not as a tick
(FR-023). Batches accumulate into **one content release per track** (up to 13, versions
`2026.08.20` onward), cut only when every item on the track has both fields done (FR-024), and all
registered through `tools/sync-manifest.mjs` — never by hand.

Two findings dominate the risk picture. **Bullets are already long**: 423 of 1887 (22%) exceed the
25-word bound FR-012 sets — 413 of them (25%) on the qa tier — so the word bound will actually
bite — but preservation always wins (FR-012a), and the escape is a recorded exception, never a
deleted caveat. And the **release train is on a clock**: the oldest ref `checked` date across the
affected tracks is 2026-08-07, so every release that stamps those tracks must be dated on or
before **2026-09-06** (gate 10) — thirteen releases inside roughly nineteen days, which makes the
release window a named checkpoint before each track's final batch, with re-verification of that
track's refs as the fallback (R-007).

## Technical Context

**Language/Version**: JSON content packs authored by hand; Node.js ≥ 18 for `tools/`. No build
step, no framework, no package.json — the standing posture, unchanged. The restricted markdown
dialect `md.js` implements is untouched; code samples are untouched.

**Primary Dependencies**: none, added or existing. This feature touches no module, no stylesheet,
no view, no tooling beyond running what exists. The only new files are documentation, the batch
records in this feature's `tasks.md`, and one small scope-check script under
`specs/005-plain-english-qa/verification/` (adapted from 004's, per R-009).

**Storage**: unchanged. Content flows through the existing snapshot-replacement path (IndexedDB
`aip/snapshot/current`); learning state (`aip.v1.*` in localStorage) is not read or written. Plan
ticks key on material signatures derived from item **ids**; this feature changes no id, so no
signature moves and `migrateTicks()` is a no-op (data-model.md §4).

**Testing**: `node tools/validate.mjs` — all 15 existing gates, unchanged, baseline currently
**0 errors and 0 warnings** at manifest `2026.08.19` (measured 2026-08-18). Per batch: exit 0 and
**no new warning**, measured against a run captured immediately before that batch (FR-019a), plus a
scope check (only `q` / `shortAnswer` / `updatedIn` may differ) and the two-question human
read-through (FR-020). No test runner, none added.

**Target Platform**: static single-page site over `http://localhost` (dev) and GH Pages (prod),
evergreen browsers. Browser verification of one rewritten item per release in [quickstart.md](./quickstart.md).

**Project Type**: content-pack authoring feature on a static site + versioned JSON packs + Node CLI
tooling. No new module family, no new directory outside `specs/005-plain-english-qa/`.

**Performance Goals**: none. Nothing here is on the boot, sync or search path; the app code is not
touched.

**Constraints**:
- **The register is an exemplar, not a rule list** (FR-002, FR-026). A rewrite is judged against
  Exemplar A (questions) and Exemplar B (bullets); a rewrite that reads like the "not the target"
  version fails even when shorter. Floor rules are subordinate; the reference batch (authored and
  accepted first, cross-track) is secondary authority; where reference batch and exemplar conflict,
  the exemplar wins.
- **The word bound is a signal with a recorded-exception path** (FR-012/FR-012a). Bullets at or
  under 25 words under the validator's own counter; over is reworked first, and where a qualifier
  cannot survive inside the bound, preservation wins and the exception is recorded with its reason.
  Measured today: **423/1887 bullets (22%) exceed 25 words** (413/1635, 25%, on the qa tier) — the
  bound is a real load factor, not a formality (R-006).
- **A rewritten question is never longer than its original** (FR-008), raw `q.length`, with the
  same recorded-exception path (FR-008a). Measured: questions run 34–215 characters, median ~85
  (R-004).
- **The first ~40 characters must distinguish** (FR-007). The prev/next control truncates
  `stripMarkdown(q).slice(0, 40)`; a rewrite must keep the subject within that prefix, track-scoped
  (R-005).
- **Ref freshness windows** (gates 10/11, R-007): a release touching a track whose oldest ref was
  `checked` 2026-08-07 must be dated ≤ **2026-09-06**; tracks with oldest ref 2026-08-09
  (`build-testing`, `dsa`, `system-design`) close **2026-09-08**; `stackSnapshotChecked`
  (2026-08-14) closes every release at **2026-09-13**.
- **No new warning survives a batch** (FR-019a), measured against a pre-batch run — including the
  two warnings this feature is most likely to produce (a gate-2b drift is not expected since
  `answer` is untouched, but gate 8 near-duplicates are, because the rewrite feeds the screen:
  R-008).
- **Item ids are permanent, and `answer`/`traps`/`followUps`/`code`/`refs` are frozen** — this
  feature rewrites `q` and `shortAnswer` only; every other field is byte-identical after every batch
  (FR-018, scope check).
- **Zero-new near-duplicates** (FR-022): any question pair newly flagged by gate 8 in a batch is
  adjudicated in that same batch, with a verdict and reason, in `.claude/workflows/duplicates.json`
  (currently empty).

**Scale/Scope**:
- **Prose**: 629 questions + 1887 short-answer bullets (629 items × exactly 3 bullets — verified:
  every item carries 3 today). 545 qa items across 10 tracks; 84 non-qa items (60 `dsa`, 19
  `design`, 5 `concept`).
- **Batches**: 89 per-pack batches (73 qa packs, 16 non-qa packs) + 1 cross-track reference batch
  first = 90 batch records, one commit each, each carrying the full gate.
- **Releases**: up to 13 (one per track), versions `2026.08.20` … `2026.08.32`, each cut with
  `tools/sync-manifest.mjs --write --release … --summary … --date …`. A track with zero edits
  (possible on the non-qa tracks if every item is recorded "already simple") ships no release.
- **0** new pack files, **0** new item ids, **0** new validator gates, **0** constitution
  amendments, **0** app code changes.

## Constitution Check

*GATE: must pass before Phase 0 research; re-checked after Phase 1 design.*

| Principle | Pre-research | Post-design |
|---|---|---|
| **I. Item identifiers are permanent** (non-negotiable) | PASS — this feature rewrites field *values* on existing items; nothing adds, retires, splits, merges or renumbers an item (FR-018, SC-005) | **PASS** — data-model.md §1 and the scope check make the id set's byte-identity a *mechanical* condition of every batch: any id appearing or disappearing fails the batch before the read-through begins |
| **II. Content and learning state are physically separate** | PASS at face value — no story reads or writes progress (FR-025, SC-008) | **PASS**, and structurally: plan ticks key on material signatures derived from item ids; this feature changes no id, so no signature moves and `migrateTicks()` has nothing to do. The only bridge between content and learning state is the id set, and it is byte-identical before and after every batch and release |
| **III. A release is offered, never imposed** | PASS under the v1.1.0 amendment — prose-only releases remove nothing and drop no tick | **PASS**, inside the amendment's narrow case and in fact stricter: releases only *reword* existing fields, re-stamping `updatedIn` on already-shipped items; they remove nothing, re-anchor nothing, and change nothing the candidate cannot get back. The auto-apply the app already performs is the pre-existing sync path (`checkForUpdates()` on boot), and each `releases[]` summary says plainly what changed (FR-024) |
| **IV. Every claim is sourced and dated** | Flagged for research — the gravest failure mode is a sentence made simpler that quietly drops the only claim a source supported (FR-011, FR-014, FR-020); re-stamping every item also pulls refs into gate 10's freshness window | **PASS with a named mechanism** — the both-directions source-to-claim check is assigned to the per-batch human read-through (FR-014, FR-020), which records its evidence per item (FR-023); the two freshness windows are computed from the actual data (R-007: ≤ **2026-09-06** gate 10, ≤ **2026-09-13** gate 11) with re-verification as the fallback, and are checked before each track's final batch, not at the release gate |
| **V. No build step, no dependencies** | PASS — this is the purest form of the posture: no code at all | **PASS** — zero app-code edits; the only new executable artifact is a scope-check script in the Spec Kit's `verification/` directory, in the exact pattern 002 and 004 already established |
| **Quality Gates** (validator authority, manifest registry, version-bump gating) | PASS — `validate.mjs` exits 0 per batch (FR-019), releases registered through `sync-manifest.mjs` (FR-024) | **PASS** — no gate is added, weakened or bypassed; the 0-error/0-warning baseline makes the zero-new-warnings requirement a real gate rather than noise; `sync-manifest.mjs` remains the only writer of `manifest.json` |

**Verdict: PASS on all six, pre- and post-design. No violations to justify.**

## Project Structure

### Documentation (this feature)

```text
specs/005-plain-english-qa/
├── plan.md                            # This file
├── spec.md                            # Input
├── research.md                        # Phase 0 output — R-001..R-013
├── data-model.md                      # Phase 1 output
├── quickstart.md                      # Phase 1 output — per-batch and per-release validation guide
├── contracts/
│   ├── vse-register.md                # Authoring contract: the normative register, tiered by item kind
│   └── batch-gate.md                  # Gate contract: 4 steps, scope-check spec, screens, records, releases
├── checklists/
│   └── requirements.md                # Spec-quality checklist (pre-existing, from the specify phase)
├── verification/
│   └── scope-check.mjs                # Created during implementation (adapted from 004's)
└── tasks.md                           # Phase 2 output (/speckit-tasks — NOT created by this command)
```

### Source code (repository root: `/Users/nn/InterviewPrep` — the app, not this Spec Kit scaffold)

```text
content/packs/*.json                    # 89 pack files; ONLY the q and shortAnswer fields move,
                                        #   plus updatedIn on touched items
content/manifest.json                   # written ONLY by tools/sync-manifest.mjs --write --release …
                                        #   up to 13 times (2026.08.20 … 2026.08.32)
.claude/workflows/duplicates.json       # gate 8 adjudication ledger (exists, currently 0 entries)
                                        #   — appended by the near-duplicate screen, never cleared
specs/005-plain-english-qa/verification/scope-check.mjs   # NEW — per-batch diff against git HEAD
```

**Not touched, and deliberately**: every file under `assets/`, `index.html`, every `tools/`
script, `content/plans/*.json` (they reference item ids; ids do not change), and every content
field outside `q` / `shortAnswer` / `updatedIn` — in particular `answer`, `traps`, `followUps`,
`code[]` and `refs` stay byte-identical (004 owns them on the Kotlin track and everyone owns
nothing on the others).

**Structure Decision**: no new project shape. This feature follows the structure 004 proved for
prose work: the register and the gate live in `contracts/`, the gate's mechanical half is one small
script in `verification/` adapted from `004`'s `scope-check.mjs` (which was itself adapted from
`002`'s `fielddiff.mjs`), and every batch's outcome is recorded inline under its task in
`tasks.md`. The single structural novelty — the register itself — is a *document*, because the
register is judged by humans against fixed exemplars, which is exactly what no script can do
(scope constraint 5, FR-002).

## Complexity Tracking

> Filled only when the Constitution Check records a violation.

**None.** All six checks pass pre-research and post-design with no exception claimed, so there is
nothing to justify here. For contrast, `002-improvements` had to record two entries (an external
network dependency and a constitution amendment); this feature adds no dependency, needs no
amendment, introduces no new gate, no new module family, no new storage key — and no code at all.
