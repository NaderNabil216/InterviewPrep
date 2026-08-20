# Specification Quality Checklist: Dashboard Progress Reflects Completed Questions

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-20
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

## Validation Record

Two iterations were run against the spec as written.

### Iteration 1 — findings

1. **FR-021 (freshness), FR-023 (nothing lost) and FR-024 (failed save never reads as a completion)
   had no acceptance scenario.** Each was stated as a requirement and echoed in Edge Cases, but no
   Given/When/Then existed to verify it, so all three failed *"All functional requirements have clear
   acceptance criteria"*.
   **Resolved**: added US1 scenarios 8, 9 and 10 covering re-requesting the current surface, carrying
   pre-existing history through the change unaltered, and a save failure not being counted.

2. **Scan for implementation-detail leakage** across the whole spec for language, storage, module and
   API vocabulary returned one hit — *"not a new testing framework"* in Assumptions, which names a
   framework only to rule one out and reads at stakeholder level. Accepted as-is.

### Iteration 2 — result

All 28 functional requirements now trace to at least one acceptance scenario:

| Requirements | Covered by |
|---|---|
| FR-001 – FR-004 | US1 scenarios 1–7 |
| FR-005 | US3 scenarios 1–4 |
| FR-006 | US2 scenarios 1–5 |
| FR-007 – FR-009 | US1 scenarios 1, 2, 4 |
| FR-010 | US1 scenario 5 |
| FR-011 | US1 scenario 7 |
| FR-012 | US1 scenarios 1, 4; Edge Cases (zero-total track, retired question) |
| FR-013 – FR-014 | US2 scenarios 1, 2 |
| FR-015 | US2 scenarios 3, 4 |
| FR-016 | US2 scenario 5 |
| FR-017 – FR-018 | US3 scenarios 2, 4 |
| FR-019 | US3 scenario 5 |
| FR-020 | US5 scenarios 1–3 |
| FR-021 | US1 scenario 8 |
| FR-022 – FR-023 | US1 scenario 9; US3 scenario 5 |
| FR-024 | US1 scenario 10 |
| FR-027 - FR-028 | Edge Cases (track with no completion action); SC-012 |
| FR-025 | US6 scenarios 1–3 |
| FR-026 | US6 scenario 4 |

All 12 success criteria are stated as counts, percentages, or agreement between surfaces, and none
names a language, storage mechanism, module, or tool.

## Notes

- The one scoping decision that would have materially changed the feature — whether the dashboard should
  measure completed coverage, layer coverage against long-term mastery, or keep a mastery reading with a
  lower threshold — was settled with the user before the spec was written. Completed coverage was chosen:
  one signal, one definition, used everywhere. It is recorded in Assumptions rather than left as a
  clarification marker.
- The Problem Statement quantifies the defect (intervals 1 → 3 → 8 → 20 → 50 days, so the current
  progress figure first becomes non-zero on day 32, against 7-day and 15-day study plans). Those figures
  were verified by simulating the product's own scheduling arithmetic, not asserted.
- **Constitutional check**: FR-022 and FR-023 exist to keep this feature inside Principle II (content and
  learning state are physically separate) and Principle I (identifiers are permanent) — the fix is a
  read-side reinterpretation, not a migration. FR-025's no-third-party-dependency wording and the
  Assumptions note on having no test runner keep US6 inside Principle V.

### Iteration 3 — addendum

Confirming the completion model against the content registry surfaced one further gap, closed rather
than deferred:

- **A counted track whose own view offers no completion action can never reach 100%.** The Cheat sheets
  view renders 5 `concept` items read-only with no rating action, while those items still sit in a track
  total. They are completable only by finding them in the Topics browser instead. Left alone this
  reproduces the defect the feature exists to fix, one track smaller.
  **Resolved**: added FR-027 (reachability), a matching edge case, and SC-012 (verified per track across
  all 13). The requirement is stated as an outcome; whether it is met by extending the action to that
  view or by not counting the track is a planning decision, deliberately left open.

Also recorded from that check, as planning input rather than a spec change: all 13 tracks are homogeneous
by item type (10 pure question tracks, `dsa` 60, `system-design` 19, `cheatsheets` 5), so no track bar
mixes material reached through different views — FR-016 has no mixed-population case to resolve within a
single track.

### Iteration 4 - FR-027 resolved by decision, and built

The mechanism FR-027 deliberately left open was settled by the user: **extend the complete action to the
cheat sheets view**, rather than dropping that track from the counted totals. Recorded as FR-028.

That slice is already implemented and verified ahead of the plan, because it stands alone - it works
against the current progress model and does not depend on the coverage redefinition the rest of the
feature makes. `assets/js/views/cheatsheets.js` now offers the same `rate-row` / `rate-btn--complete`
action every other reading surface uses, shows the resulting status and next review date, and carries a
status dot per sheet on the index.

Verified headlessly against the real `store.js`, `srs.js` and `md.js` and the real content packs
(26 checks, all passing): the action is wired and records a genuine completion, repeat presses advance the
review schedule without double-counting (FR-003), the index reflects completion per sheet, and the print
path stays clean - the button sits in `.rate-row`, which the print stylesheet already hides, and the
status line carries `no-print`.

The same run also confirms the headline defect is still present and untouched by this change: with one
sheet completed, the cheatsheets track reads `known 0, learning 1, new 4`, so the dashboard bar is still
0%. That is FR-001 waiting to be built, not a regression introduced here.

**Not verified in a real browser.** The Chrome extension was not connected during this session, so the
visual result - button placement under a long sheet, dot alignment on the index cards, and an actual print
preview - is unconfirmed. The manual procedure required by FR-026 should cover it.
