# UX Requirements Quality Checklist: Study Surface UI Polish

**Purpose**: Author self-review of requirements quality across all five user stories (theme toggle,
short-answer styling, sentence-splitting, UPD badge removal, level-sort) before proceeding to
`/speckit-tasks` — a standard-depth pass, not a formal release gate.
**Created**: 2026-08-18
**Feature**: [spec.md](../spec.md)

**Note**: This checklist validates the *requirements* (spec.md, plan.md, data-model.md,
contracts/ui-behavior.md) for completeness, clarity, consistency, and measurability. It is not a
test plan and does not verify the implementation. `[x]` means the reviewer judges that item's
requirements-quality criterion satisfied — it does not mean any code has been written or tested.

## Requirement Completeness

- [ ] CHK001 Are the exact persisted theme values and every transition between them — including the
  legacy `'auto'` migration path — fully enumerated in one place? [Completeness, Spec §Assumptions,
  Data-model §Theme preference]
- [ ] CHK002 Is the sentence-splitting requirement's scope of applicable fields (`q`, `prompt`) and
  surfaces fully enumerated across item page, Drill, Mock, Design, and DSA? [Completeness, Spec
  §FR-006, Plan §Project Structure]
- [ ] CHK003 Are requirements defined for how the level-sort behaves when an item's `level` field is
  missing or undefined? [Completeness, Spec §Edge Cases, Contracts §C5]
- [ ] CHK004 Is the full set of surfaces where an "UPD" badge could appear enumerated, so removal
  scope isn't left to be discovered during implementation? [Completeness, Spec §FR-010]
- [ ] CHK005 Are requirements defined for what happens on a candidate's first visit if the device
  exposes no usable system-preference signal (e.g. `matchMedia` returns no match)? [Gap, Spec §FR-003]

## Requirement Clarity

- [ ] CHK006 Is "each sentence appears as its own visually separated line or block" (FR-006) specific
  enough to distinguish a required rendering mechanism from mere inline whitespace? [Clarity, Spec
  §FR-006]
- [ ] CHK007 Is "sensible initial appearance" (FR-003) defined precisely enough to be objectively
  checked, rather than left to subjective judgment? [Clarity, Spec §FR-003]
- [ ] CHK008 Is "stable" order (FR-013) defined against an explicit baseline (e.g. original pack
  order) rather than left implicit? [Clarity, Spec §FR-013]
- [ ] CHK009 Is "or any equivalent updated-label" in FR-010 bounded clearly enough that implementers
  know which labels are in scope for removal versus which similar-looking labels (e.g. "NEW") are
  explicitly excluded? [Clarity, Spec §FR-010, §FR-011]

## Requirement Consistency

- [ ] CHK010 Do FR-001–FR-004 (toggle button) and the Settings-dropdown constraint in Plan agree on
  exactly the same two persisted values, with no path left able to reintroduce a third? [Consistency,
  Spec §FR-001, Plan §Constraints, Contracts §C1]
- [ ] CHK011 Are the sentence-splitting rules in the spec's Edge Cases section consistent with the
  more detailed splitting/non-splitting rules in the contracts? [Consistency, Spec §Edge Cases,
  Contracts §C3]
- [ ] CHK012 Is the Assumptions section's scoping of "topic items listing" to `topics.js` only
  consistent with User Story 5's Independent Test, which does not itself name or exclude other
  listing surfaces? [Consistency, Spec §Assumptions vs User Story 5]

## Acceptance Criteria Quality

- [ ] CHK013 Can SC-001's "100% of the time" claim be objectively checked given the described
  verification method, or does it need an explicit sampling/test procedure spelled out? [Measurability,
  Spec §SC-001]
- [ ] CHK014 Is SC-003 ("without first having to mentally re-split") measurable, or does it lack an
  objective proxy (e.g. rendered line count equals sentence count)? [Measurability, Spec §SC-003]
- [ ] CHK015 Does SC-005 state a clear pass/fail condition for a category where every item already
  shares one level (nothing to reorder)? [Measurability, Spec §SC-005, Acceptance Scenario 3]

## Scenario Coverage

- [ ] CHK016 Are requirements defined for a candidate who has an existing `'auto'` value already
  persisted from before this fix ships (the upgrade/legacy-value path)? [Coverage, Data-model
  §Theme preference, Contracts §C1]
- [ ] CHK017 Are exception-path requirements defined for malformed or unbalanced backtick spans in
  `q`/`prompt` (e.g. an odd number of backticks) reaching the sentence-splitter? [Coverage, Gap]
- [ ] CHK018 Are recovery requirements defined for a non-numeric or out-of-range `level` value reaching
  the topic sort, beyond the already-covered missing/undefined case? [Coverage, Spec §Edge Cases,
  Contracts §C5]
- [ ] CHK019 Does the spec distinguish whether the system-preference-change behavior in FR-004 applies
  identically before and after a candidate's first explicit theme click? [Coverage, Spec §FR-003 vs
  §FR-004]

## Edge Case Coverage

- [ ] CHK020 Is the case of consecutive terminal punctuation (e.g. `?!` or `...`) addressed by the
  splitting rules, or left to fall through to whichever single rule matches first? [Edge Case, Gap]
- [ ] CHK021 Is the case of a sentence boundary that sits immediately adjacent to (but outside) a code
  span addressed, distinct from a boundary character sitting inside one? [Edge Case, Contracts §C3]
- [ ] CHK022 Is behavior specified for an item with a `prompt` but no `q` (or vice versa), so it's
  clear which surfaces apply sentence-splitting to which field? [Edge Case, Data-model §Sentence unit]
- [ ] CHK023 Does the quote-mark rule in the splitting contract cover both straight and curly quote
  styles, or is that left ambiguous? [Ambiguity, Contracts §C3]

## Non-Functional Requirements

- [ ] CHK024 Are there requirements bounding the render-time cost of running sentence-splitting across
  every displayed question, given it runs per-render over the full item set? [Gap, Plan §Performance
  Goals]
- [ ] CHK025 Are accessibility requirements defined for how newly-introduced line/block breaks in a
  split question are exposed to assistive technology? [Gap, Coverage]
- [ ] CHK026 Are requirements defined for how the two-state theme toggle communicates its current
  state to assistive technology (e.g. an accessible name or pressed-state), beyond the visual icon
  swap? [Gap, Spec §FR-002]

## Dependencies & Assumptions

- [ ] CHK027 Is the assumption that no manifest version bump is required validated against the actual
  absence of any content-facing change across all five fixes? [Assumption, Spec §Assumptions]
- [ ] CHK028 Is the assumption that a stable sort with no secondary tiebreaker is an acceptable
  candidate-facing outcome (vs., say, an alphabetical secondary key) explicitly recorded rather than
  implied? [Assumption, Spec §Assumptions, Data-model §Item level]
- [ ] CHK029 Is the dependency on `matchMedia` for first-boot theme resolution documented as a
  browser-support assumption, with any fallback behavior specified if it's unsupported? [Dependency,
  Gap]

## Ambiguities & Conflicts

- [ ] CHK030 Is it explicit that "original (pre-sort) relative order" in FR-013's tiebreaker refers to
  today's arbitrary disk/pack order, and that inheriting that arbitrariness as the tiebreak is an
  accepted outcome rather than an oversight? [Ambiguity, Spec §FR-013, Data-model §Item level]
- [ ] CHK031 Is it unambiguous whether FR-010's "anywhere in the app" is bounded to the surfaces named
  in Plan's Project Structure, or could it implicate other item-listing surfaces (e.g. search
  results) not enumerated there? [Ambiguity, Spec §FR-010, Plan §Project Structure]

## Notes

- Generated at Standard depth, balanced across all five user stories, for the spec author to
  self-review before running `/speckit-tasks`.
- 31/31 items carry at least one traceability marker (`[Spec §...]`, `[Contracts §...]`,
  `[Data-model §...]`, `[Plan §...]`, `[Gap]`, `[Ambiguity]`, or `[Assumption]`).
- `/speckit-implement` reads checklist state but does not modify checkbox markers — checking items
  off is a reviewer action, not an automated one.
