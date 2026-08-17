# Specification Quality Checklist: Labelled Answer Sections and Plain-Spoken Kotlin Q&A

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-17
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

### Validation iteration 1 — 2026-08-17

Two [NEEDS CLARIFICATION] markers were raised and put to the user:

1. **FR-008** — labelling scope: whole library or Kotlin track only. The rendering surfaces are
   shared across all 13 tracks, so scoping to one track is extra machinery for an intentionally
   inconsistent result. No default was safe to assume: one option changes 629 items' presentation,
   the other changes 70 and creates follow-up work.
2. **FR-014** — rewrite depth: voice-only translation, or voice plus editorial trimming. The phrase
   "no need to be complex" supports both readings, and they imply different review gates
   (mechanical claim-comparison vs. subjective judgement) and different risk to senior-level depth.

Everything else was resolved with documented defaults rather than a marker — notably the field
coverage of the rewrite, the exclusion of `shortAnswer` (already rewritten by `002-improvements`
US7), the exclusion of the `coroutines-flow` track, and the per-pack batching with a named human
read-through gate carried over from `002-improvements` FR-025a.

**Terminology check**: the spec deliberately avoids field names, view names and file paths in
requirements, referring instead to "question", "short answer", "deep answer", "code sample",
"follow-ups", "traps" and "sources" as a candidate would perceive them. Item identifiers appear
only where a requirement is about identifier permanence or where naming the five affected items
makes a criterion checkable.

**Factual claims verified against the repository** (2026-08-17):

- 70 Kotlin items across 14 registered packs, all of the question-and-answer type.
- All 70 carry every prose field the spec names — none is optional in practice on this track.
- Exactly 5 questions open with an instructional verb (`kt-0004`, `kt-0005`, `kt-0007`, `kt-0031`,
  `kt-0048`), matching SC-002's baseline.
- Longest question is 138 characters; navigation previews truncate near 40.
- `shortAnswer` was rewritten library-wide by `002-improvements` US7, shipped in release
  `2026.08.17`, with `answer`/`q`/`traps` explicitly left untouched — which is precisely the gap
  this feature closes on the Kotlin track.

### Constitution alignment

- **I (identifiers permanent)** — FR-019, SC-006.
- **II (content and learning state separate)** — FR-023, SC-008.
- **III (a release is offered, never imposed)** — content-only release carrying nothing
  unrecoverable; covered in Assumptions.
- **IV (every claim sourced and dated)** — FR-017, SC-005.
- **V (no build step, no dependencies)** — final Assumptions bullet, Out of Scope.
- **Quality gates** — FR-020 (validator exits 0, per-pack batches), FR-021 (named human
  read-through), FR-022 (release registered through the manifest tooling).

### Validation iteration 2 — 2026-08-17 (post-decision)

Both questions answered by the user; answers written back into the spec:

- **Q1 → label every track.** FR-008 now states it outright. Knock-on effects applied: US1 reframed
  from "a Kotlin question" to any question in the library, its independent test broadened to cheat
  sheets / DSA / system-design, SC-001 broadened to the whole library, and a new Assumptions bullet
  records that the two halves of this feature deliberately have different scopes (labels on 629
  items, prose rewrite on 70). FR-006 is promoted from edge case to a load-bearing requirement,
  since shared presentation now carries labels on content types it was not written for.
- **Q2 → voice only, nothing deleted or relocated.** FR-014 now forbids both deletion and
  relocation-to-shorten, and states that answers stay roughly their current length. SC-001a added:
  a markedly shorter rewrite is a review failure, not a win. This is what keeps FR-021's
  read-through mechanical — a reviewer compares claims rather than exercising editorial judgement,
  which is the only reason SC-004 is checkable without a test suite.

All checklist items now pass. No marker remains.

### Validation iteration 3 — 2026-08-17 (post-`/speckit-clarify`)

Five clarifications integrated. Checklist re-evaluated against the updated spec: **16/16 → 16/16**,
no item changed state. What the session improved behind the already-passing marks:

- **"Requirements are testable and unambiguous"** — was passing on structure, now materially
  stronger. FR-001 fixes the seven label strings in a table instead of describing them; FR-013a
  replaces "conversational register" with a three-way worked exemplar (documentation → tidied
  documentation → target) that a reviewer can hold a rewrite against; FR-021a splits the batch gate
  into two independently-failing checks.
- **"Success criteria are measurable"** — SC-003 was the weakest criterion in the spec, resting on
  the undefined adjective "conversational". It now points at the FR-013a exemplar and explicitly
  says brevity is not evidence of passing.
- **"Scope is clearly bounded"** — the Q1 decision recorded at `/speckit-specify` said "every
  track", which read as all 629 items. Clarification narrowed it to the 545 question-and-answer
  items and added FR-008a naming the 84 deliberately untouched ones. The superseded wording in the
  Q1 option table is annotated rather than deleted, so the decision history stays readable.

**Three app behaviours were verified against the code during this session** and are now recorded in
the spec because each one creates a path the labelling could otherwise leak down:

1. Search indexes all 629 items and every result opens on the question-and-answer page.
2. The Drill queue excludes only DSA and design items — cheat sheets are eligible as drill cards.
3. Mock's Coding and System-design modes render DSA and design items through the same reveal
   presentation a question-and-answer item uses.

FR-006 closes all three at once by keying the labelling to item kind rather than to page.

**One reviewer-facing risk remains, by design**: FR-013a's exemplar is a single worked example, and
the 70 items it governs vary in shape. A reviewer applying it to an item structured very differently
from the SAM-conversion example is extrapolating. This was the user's explicit choice over a rule
checklist, and it is recorded here so `/speckit-plan` sizes the review step accordingly rather than
discovering it mid-batch.

### Status

**Complete — ready for `/speckit-plan`.** No open questions, no unresolved markers, five
clarifications integrated.
