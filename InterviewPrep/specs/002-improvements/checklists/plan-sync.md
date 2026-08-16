# Plan/Tasks Sync Checklist: Improvements

**Purpose**: Pre-`/speckit-implement` gate testing whether `plan.md` and `tasks.md` actually reflect the
six requirement edits made to `spec.md` during the 2026-08-14 `readiness.md` review (new FR-010a,
FR-010b, FR-014a, FR-018a; broadened FR-020; new FR-020a) — the review's own notes state this
re-check "should happen before implementation starts on the affected stories (US3, US4, US6)" but was
never done. This checklist does not re-litigate `readiness.md`'s 17 still-open items; it tests a
narrower, different question — traceability and consistency between spec.md's requirement text and the
plan/task documents that are about to be executed.

**Created**: 2026-08-14
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md) · [tasks.md](../tasks.md)

**Note**: This checklist tests the requirements and their downstream planning artifacts — traceability,
consistency, completeness — not whether any implementation of them works. `[x]` records the reviewer's
judgment that an item's concern is resolved; it is never set by this command and does not mean code
exists. `/speckit-implement` reads checklist state but never modifies checkbox markers.

## FR Traceability From the 2026-08-14 Readiness Review

- [x] CHK001 Does any task in `tasks.md` cite **FR-010a** (the post-apply sync notice) by ID, or is
  T010's `toast()` behavior traceable only by narrative resemblance to the requirement text?
  [Traceability, Spec §FR-010a vs tasks.md T010]
- [x] CHK002 Does `tasks.md` cite **FR-010b** (deferred-apply while a Drill/Mock session is active)
  anywhere in T009/T010, or does confirming coverage require re-reading the FR text and inferring it
  matches the `App.sessionActive` gating described there? [Traceability, Spec §FR-010b vs tasks.md
  T009/T010]
- [x] CHK003 Does `tasks.md` T017 cite **FR-014a** (Mock's completion-count summary), or does the
  `completedCount`/`completedPct` rewrite carry no requirement-ID reference a reviewer could use to
  confirm the task fully discharges it? [Traceability, Spec §FR-014a vs tasks.md T017]
- [x] CHK004 Do `tasks.md` T023/T024/T026 or `plan.md`'s Storage/Complexity Tracking sections cite
  **FR-018a** by ID anywhere, given `plan.md` cites the unlettered "FR-018" once but never the lettered
  sub-requirement that actually carries the client-side-only/never-logged guarantees? [Traceability,
  Spec §FR-018a vs plan.md/tasks.md]
- [x] CHK005 Does `tasks.md` T026 cite **FR-020** (as broadened) or **FR-020a**, or is the
  needs-key/needs-connection split and the abort-on-second-press behavior traceable only via
  `contracts/dsa-run-contract.md` rather than the spec requirements that now also govern them?
  [Traceability, Spec §FR-020/FR-020a vs tasks.md T026]
- [x] CHK006 Is there a single place in `plan.md` or `tasks.md` that enumerates every FR added or
  changed during the 2026-08-14 readiness review (FR-010a, FR-010b, FR-014a, FR-018a, FR-020, FR-020a)
  and confirms each has an owning task, or does establishing that coverage today require a manual
  line-by-line diff between `spec.md` and `tasks.md`? [Completeness, Gap]

## Requirement Content Not Yet Reflected in Design Docs

- [x] CHK007 Is FR-018a's **"never logged"** guarantee reflected anywhere in `plan.md`, `data-model.md`,
  or the `dsa-run-contract.md`/`storage-contract-delta.md` contracts — each of which documents
  "client-side only" and "transmitted only on Run requests" but none of which mentions logging — or does
  a future implementer have no design-level artifact to check this clause against? [Gap, Spec §FR-018a
  vs contracts/plan.md]
- [x] CHK008 Does `plan.md`'s Performance Goals section, `research.md`'s shell-phase description, or
  `quickstart.md`'s US2 verification step state the "within 1 second" target as measured **from first
  paint** (matching SC-002's reworded text), or do all three still describe it as "within 1 second on a
  cold cache" with no shared, explicit measurement start point? [Consistency, Spec §SC-002 vs
  plan.md/research.md/quickstart.md]

## Elaborations in Plan/Contracts With No Spec-Level Anchor

- [x] CHK009 Does `spec.md`'s US4 (or FR-014a) address how a pre-existing `mockResults` row (old
  `avgScore`-only shape) should display once the shape changes, or is the read-side fallback described
  only in `storage-contract-delta.md`/`tasks.md` T017, with no spec-level acceptance scenario a reviewer
  could verify it against? [Gap, Traceability, Spec §US4 vs storage-contract-delta.md]

## Readiness Findings Not Yet Reconciled With Plan/Tasks

- [x] CHK010 `readiness.md`'s CHK015 asks whether the constitution amendment's "releases that only
  re-anchor ticks" scope covers an ordinary US7/US8 content-only release; does `tasks.md`'s
  manifest-bump task (T056) or `plan.md` state which of the amendment's criteria that release satisfies,
  or is the connection between "batch content release" and "non-destructive release" left unstated at
  the plan/task level too? [Consistency, Gap, Spec vs Constitution v1.1.0 vs tasks.md T056]
- [x] CHK011 `readiness.md`'s CHK024/CHK026/CHK030/CHK032 (DSA Run risk cluster: missing-`sampleCall`
  fallback, Run timeout value, in-flight loading state, CORS fallback) are marked unresolved at the spec
  level — do `tasks.md`'s US6 implementation tasks (T025/T026) make an implicit choice on any of these
  that the spec doesn't yet sanction, or do they correctly leave all four open pending the product
  decision `readiness.md` calls for? [Consistency, Gap, Spec vs tasks.md T025/T026]

## Task-to-Requirement Coverage

- [x] CHK012 Is **FR-011** ("MUST NOT perform a full re-fetch when the on-disk content index is
  unchanged") assigned to any task in Phase 5 (US3), or does it rely entirely on today's existing
  `checkForUpdates()` short-circuit with no task confirming that behavior survives T010's rewrite of the
  update flow? [Gap, Spec §FR-011 vs tasks.md Phase 5]

## Resolution Notes (2026-08-14)

**All 12 items resolved.** Three were confirmed defects found while drafting the checklist; the rest
were open questions that the resolution pass answered by editing the planning artifacts.

**CHK001-CHK006, CHK012 — traceability.** The finding was stark: `tasks.md` cited an FR ID exactly
**once** in the entire file (`FR-017` in T019). Every other requirement — including all six added
during the readiness review — was traceable only by narrative resemblance. Fixed by:
- Adding explicit **`(FR-…)` citations** to T003, T006, T007, T009, T010, T017, T022, T023, T024,
  T025, T026, T049, T054, and the new tasks below.
- Adding a **Requirement → Task Coverage** table mapping all 50 FRs to owning tasks, with a standing
  rule that a new FR must gain a row in the same edit that adds it. CHK006 asked whether coverage
  could be established without a manual spec-vs-tasks diff; now it can.
- **CHK012**: FR-011 had no owning task. New **T010a** verifies the version-compare short-circuit
  survives T010's rewrite — which matters more after this feature than before it, since T010 moves the
  check from one click to three recurring triggers, turning a single wasted fetch into a repeating one
  on every tab focus.

**CHK007 — FR-018a's "never logged" had no design-level artifact.** Confirmed: `plan.md`,
`data-model.md`, and both contracts documented "client-side only" and "Run-requests-only" but none
mentioned logging at all. Added a **Key handling (FR-018a)** section to `dsa-run-contract.md` and a
read-path restriction to `storage-contract-delta.md`, both spelling out: never to `console`, never in
a rendered error or Run Result, never in a URL, never to any other host — and that a failed request
surfaces fixed copy rather than a dump of the outgoing request that would echo the header onto the
page. T026 and a new quickstart step now check it.

**CHK008 — the "1 second" measurement anchor was inconsistent.** Confirmed: SC-002 had been reworded
to "within 1 second **of first paint**" during Pass 1, but `plan.md`, `research.md`, and
`quickstart.md` all still said "within 1 second on a cold cache" — no shared start point. All three
now state the first-paint anchor, and all three now also carry FR-005b's distinction between the
number (calibrated) and the ordering (unconditional).

**CHK009 — legacy `mockResults` rows had no spec anchor.** The read-side fallback existed only in
`storage-contract-delta.md` and T017. Added **FR-014b**: pre-change sessions must keep displaying
(labelled as the older metric), must not vanish or render blank, and must not be back-filled — no
completion data exists for a session graded before the change. Past results are a record the candidate
earned; this feature must not erase them.

**CHK010 — amendment eligibility was unstated at the task level.** T056 (the manifest bump, where the
release is actually cut) now carries the structural argument for why this feature's content releases
qualify for silent auto-apply, plus the boundary condition: a future release that removes or renumbers
an item falls *outside* the amendment and needs the original disclose-before-apply behavior.

**CHK011 — US6 tasks vs the four open DSA decisions.** Resolved in the readiness pass rather than
here: FR-019c, FR-020b, FR-020c, and FR-022a now exist, T022 is marked a go/no-go gate, and T026's
body was extended with all four behaviors. The tasks no longer make implicit choices the spec doesn't
sanction, because the spec now sanctions them explicitly.

## Notes

- Focus: whether `plan.md`/`tasks.md` trace to, and stay consistent with, the six FR edits made to
  `spec.md` during today's `readiness.md` review pass — a narrower, complementary scope to that
  checklist's own 17 still-open items (not duplicated here).
- Depth: Standard — targeted at the specific gap `readiness.md`'s Resolution Notes called out
  ("Nothing in `plan.md`/`tasks.md` was re-run against the new FRs"), not a full re-review of either
  document.
- Audience/timing: the feature author, gating `/speckit-implement` on US3/US4/US6 specifically, per
  `readiness.md`'s own recommendation.
- Every item above was checked against the live content of `spec.md`, `plan.md`, `tasks.md`, and the
  `contracts/`/`research.md`/`quickstart.md` files as of 2026-08-14; re-run this checklist if any of
  those documents change again before implementation starts.
