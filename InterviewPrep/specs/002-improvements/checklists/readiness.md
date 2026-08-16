# Readiness Checklist: Improvements

**Purpose**: Pre-`/speckit-tasks` requirements-quality gate for the author. Full cross-cutting sweep
across all nine user stories, with extra depth on the three highest-risk areas: search/startup
performance SLAs, the automatic-sync + constitution-amendment story, and the DSA Run/Judge0 external
integration.
**Created**: 2026-08-14
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md) · [research.md](../research.md)

**Note**: This checklist tests the requirements themselves — completeness, clarity, consistency,
measurability, and coverage — not whether any implementation of them works. `[x]` records the
reviewer's judgment that an item's requirement-quality concern is resolved; it is never set by this
command and does not mean code exists. `/speckit-implement` reads checklist state but never modifies
checkbox markers.

**Reviewed**: 2026-08-14, by the feature author, in two passes.

**Pass 1** closed 38/55 items. `tasks.md` had already been generated before this checklist was
reviewed — the gate was skipped in practice even though this file's own purpose statement calls it a
pre-`/speckit-tasks` step. Pass 1 closed that gap retroactively with 6 edits to `spec.md` (new
FR-010a/b, FR-014a, FR-018a, FR-020a, a broadened FR-020, and two wording fixes). It left 17 items
open as needing a product decision, and left `plan.md`/`tasks.md` un-re-run against the new FRs.

**Pass 2** (same day) resolved all 17 remaining items, and spun the un-re-run plan/tasks concern out
into its own checklist, [plan-sync.md](./plan-sync.md) (12 items, all now also resolved). **55/55
checked.** Pass 2 made the product decisions Pass 1 deferred rather than deferring them again — see
Resolution Notes below for each decision and its rationale. Where a decision was genuinely
discretionary, the reasoning is recorded so it can be revisited deliberately rather than rediscovered
as an ambiguity.

## Search & Startup Performance (US1, US2 — emphasized)

- [x] CHK001 Is the exact debounce/trailing-delay value (or an acceptable range) for search-overlay
  and Topics-filter re-querying specified as a requirement, or only implied by the 300ms settle bound
  in FR-002/SC-001? [Clarity, Spec §FR-002]
- [x] CHK002 Is "no perceptible input lag" (FR-001) given any objective threshold distinct from the
  300ms result-settle bound, or does the spec rely on the settle bound alone to cover both claims?
  [Ambiguity, Spec §FR-001]
- [x] CHK003 Does the spec define what "interactive" means for the app shell within 1 second (FR-005)
  — e.g., which specific elements (nav, dashboard skeleton) must be clickable/navigable — beyond the
  two examples named? [Clarity, Spec §FR-005]
- [x] CHK004 Is the dashboard "skeleton" state's content and behavior (what placeholder is shown,
  whether counts appear as zeros/dashes) specified anywhere, or left to implementation discretion?
  [Gap, Spec §US2]
- [x] CHK005 Are the 300ms and 1-second targets specified as measured from a consistently-defined
  starting point (e.g., last keystroke, first paint) between FR-002/FR-005 and SC-001/SC-002, so the
  two sections can't be read to disagree? [Consistency, Spec §FR-002/FR-005/SC-001/SC-002]
- [x] CHK006 Is the warm-cache "feels instant" requirement (FR-006, Acceptance Scenario 3 of US2)
  given any numeric bound, or is it intentionally qualitative as a non-regression claim against
  today's behavior? [Clarity, Spec §FR-006]
- [x] CHK007 Does the spec or plan state what happens if a candidate's device is slow enough that the
  1-second shell-interactive target can't be met — is graceful degradation specified, or is the
  target treated as unconditional? [Edge Case, Gap]
- [x] CHK008 Are the search/startup performance requirements measurable by a defined method (e.g., a
  specific manual timing procedure in quickstart.md), or only asserted as success criteria with no
  verification procedure attached? [Measurability, Spec §SC-001/SC-002]

## Automatic Sync & Constitution Amendment (US3 — emphasized)

- [x] CHK009 Is the sync check's trigger set (boot, visibility/focus, online-event) specified in
  spec.md itself, or only in plan.md/research.md — and if only in the plan, is that consistent with
  FR-007's requirement-level framing ("automatically," not naming which events)? [Consistency, Spec
  §FR-007 vs Plan/R-003]
- [x] CHK010 Does the spec define "non-destructive to learning state" precisely enough to be checked
  against an arbitrary future release (e.g., does it enumerate every release shape that qualifies, or
  only the tick-re-anchoring case already named)? [Clarity, Spec §Assumptions]
- [x] CHK011 Is the post-apply notice (a toast naming what changed) a requirement anywhere in
  spec.md's FRs, or does it exist only in plan.md/research.md as an implementation choice not
  mandated by any FR or acceptance scenario? [Gap, Spec §FR-007-011]
- [x] CHK012 Is the requirement covering a sync-eligible diff arriving mid-Drill/Mock (deferred until
  session end) traceable to a specific FR, or only to the spec's Edge Cases section with no FR a
  reviewer could cite? [Traceability, Spec §Edge Cases]
- [x] CHK013 Does the spec define how "session active" is bounded (e.g., does leaving a session via
  browser back count as ending it) precisely enough to rule out an indefinitely deferred sync?
  [Ambiguity, Gap]
- [x] CHK014 Is there a requirement covering a sync that fails partway (e.g., manifest fetched but a
  pack fetch fails), or is only the happy path specified? [Edge Case, Gap]
- [x] CHK015 Is the constitutional amendment's scope (releases that only re-anchor ticks) checked
  against every release shape this feature's own content efforts (US7's rewrite, US8's restructure)
  could produce, confirming an ordinary content-only release falls inside the narrowed principle
  rather than needing its own carve-out? [Consistency, Constitution v1.1.0 vs Spec §US7/US8]
- [x] CHK016 Does the spec or plan state what happens if the candidate is offline across multiple
  releases (does the eventual sync apply only the latest, or is there a requirement about
  intermediate releases)? [Edge Case, Gap]
- [x] CHK017 Is SC-003's "zero UI surfaces reference Update/Up to date/What's New" scoped precisely
  enough to check exhaustively (does it include Settings, help text, in-app documentation), or does
  its scope stop at primary navigation only? [Measurability, Spec §SC-003]
- [x] CHK018 Does FR-010 ("preserve/re-anchor... exactly as the current manual update flow does
  today") point to a single unambiguous existing behavior, given today's flow is click-triggered and
  includes an item-level diff modal this feature removes — is it clear which parts of "today's flow"
  (the migration mechanics) survive versus which parts (the modal) don't? [Clarity, Spec §FR-010]

## DSA Run / Judge0 Integration (US6 — emphasized)

- [x] CHK019 Does the spec itself (not only research.md/contracts/) state that the app will never
  embed or ship its own API key, or is bring-your-own-key only a planning-phase decision with no
  candidate-facing requirement it can be checked against? [Traceability, Gap]
- [x] CHK020 Is the Settings surface for entering a Judge0/RapidAPI key — its existence, location,
  and any validation behavior (e.g., rejecting an obviously-malformed key before a request is sent) —
  specified as a requirement, or left entirely to the plan/contract? [Gap, Spec §US6]
- [x] CHK021 Are the distinct failure states the DSA Run contract defines (`needs-key`,
  `needs-connection`, `compile-error`, `runtime-error`, `output`) each traceable to an FR, or does
  FR-020 name only one generic "needs a connection" state while the contract defines four more?
  [Consistency, Spec §FR-020 vs contracts/dsa-run-contract.md]
- [x] CHK022 Does any requirement address a stored API key that is well-formed but rejected by Judge0
  (expired, over quota) — is that folded into "needs-connection," or left unaddressed? [Edge Case,
  Gap]
- [x] CHK023 Is "no automated pass/fail verdict exists" (FR-019) stated clearly enough that a future
  reader won't mistake `status.description` (e.g., "Accepted") for a correctness verdict rather than
  a compiler/runtime status label? [Ambiguity, Spec §FR-019]
- [x] CHK024 Does a requirement specify what Run does if an item's `sampleCall` field is missing
  (e.g., its content-authoring batch hasn't landed yet) — is a defined fallback required, or is
  "every DSA item has sampleCall before Run ships" an unstated precondition? [Gap, Dependency]
- [x] CHK025 Is the abort-and-supersede behavior for a second Run press while one is in flight (Edge
  Cases) backed by an FR, or does it exist only in the Edge Cases list and research.md/contract, with
  no FR a reviewer could cite? [Traceability, Spec §Edge Cases]
- [x] CHK026 Does the spec specify a maximum wait/timeout for a Run request, or leave "generous but
  bounded" (plan/research language) as the only guidance, with no concrete value to hold an
  implementation to? [Measurability, Gap]
- [x] CHK027 Is the security/privacy handling of the candidate's API key specified — e.g., required
  to be stored client-side only, transmitted only on the candidate's own Run requests, and never
  logged? [Gap, Non-Functional/Security]
- [x] CHK028 Does FR-022 ("no part of the site other than DSA Run may introduce a required network
  call") have a corresponding verification method (e.g., a quickstart scenario that goes offline and
  exercises every other view), or is it asserted with no systematic way to check it? [Measurability,
  Spec §FR-022]
- [x] CHK029 Is FR-021's persistence requirement ("at least matching... the current scratch/notes
  area") specific enough to know which storage mechanism qualifies, or does "at least matching" leave
  room for a materially less durable choice to still pass? [Clarity, Spec §FR-021]
- [x] CHK030 Does any requirement address what the candidate sees while a Run request is in flight
  (a pending/loading state), or is that left unspecified between "press Run" and "result shown"?
  [Gap, Scenario Coverage]
- [x] CHK031 Is there a requirement or acceptance scenario covering an unusually large/slow result
  (e.g., Judge0's own Time Limit Exceeded) — does that get its own defined presentation, or does it
  fall silently into the generic runtime-error bucket? [Edge Case, Gap]
- [x] CHK032 Is the residual risk research.md flags (Judge0's RapidAPI CORS policy unconfirmed)
  reflected anywhere in the spec/plan as a requirement-level contingency, or only as a to-do note for
  the first implementation task with no fallback requirement behind it? [Assumption, Gap]

## Progress Feedback & Timers (US4, US5)

- [x] CHK033 Is "Mark complete" required to behave identically (not necessarily look identical)
  across all three surfaces per FR-014, or does the spec leave that distinction — surface-specific
  presentation vs. a strictly uniform single-action rule — implicit? [Clarity, Spec §FR-014]
- [x] CHK034 Does FR-013's "one consistent, fixed outcome" specify which existing internal rating
  that maps to, or is that left as a planning-phase choice with no requirement-level constraint on
  which rating a future implementer could pick? [Gap, Spec §FR-013]
- [x] CHK035 Is the idempotency requirement for repeated "Mark complete" taps (Edge Cases) precise
  enough to distinguish "acceptable re-advancement through the normal curve" from "corruption," given
  today's scheduling math doesn't distinguish first-mark from re-mark either? [Ambiguity, Spec
  §Edge Cases vs R-004]
- [x] CHK036 Does Mock's replacement metric for `avgScore` (a completion count/percentage) have a
  corresponding spec-level requirement, or is retiring the self-graded score concept only a plan-level
  consequence with no FR describing what candidates see instead? [Traceability, Gap]
- [x] CHK037 Is FR-015/016's timer-pause requirement scoped clearly enough to bound which on-screen
  clocks it covers, so a future additional timer elsewhere in the app isn't ambiguously in or out of
  scope? [Clarity, Spec §FR-015]
- [x] CHK038 Does the spec define timer-resume behavior for backward navigation (if a candidate can
  return to a previous question), or is that scenario entirely unaddressed? [Edge Case, Gap]
- [x] CHK039 Is FR-017's "must not pause or otherwise alter the overall session time budget"
  independently measurable (e.g., via an acceptance scenario checking the deadline value directly),
  or does verifying it depend on reading the implementation? [Measurability, Spec §FR-017]
- [x] CHK040 Does the Edge Cases entry on an indefinitely-paused timer specify any upper bound on
  realistic session length, or is "must not overflow/drift" left entirely unquantified? [Ambiguity,
  Spec §Edge Cases]

## Content Rewrite & System Design Restructure (US7, US8)

- [x] CHK041 Is "simplified without losing technical accuracy" (FR-023) given any acceptance
  criterion beyond human read-through, or does the spec rely entirely on reviewer judgment with no
  objective check? [Measurability, Spec §FR-023]
- [x] CHK042 Does the spec assign who verifies a rewritten `shortAnswer` still matches the deeper
  `answer` field (Acceptance Scenario 1 of US7), or is that check left unassigned to any role? [Gap,
  Spec §US7]
- [x] CHK043 Is the batch unit for the 629-item rewrite ("per track/pack," FR-025) precise enough to
  know the expected number of batches, or is batch size/boundary left fully to the implementer? [
  Clarity, Spec §FR-025]
- [x] CHK044 Does the spec specify the structural shape of `clarifyingQuestions` content (e.g.,
  candidate picks from a fixed set vs. free-form) precisely enough to match the Assumptions section's
  "scripted/content-driven" constraint, or does that distinction live only in Assumptions rather than
  in FR-027 itself? [Consistency, Spec §Assumptions vs FR-027]
- [x] CHK045 Is there a requirement describing what happens to a system-design scenario that resists
  clean restructuring into clarify-then-plan — is a per-scenario exception allowed, or is 100%
  conformance mandatory with no escape hatch named? [Edge Case, Gap]
- [x] CHK046 Does SC-008 have a verification method independent of the framework item it's compared
  against, given that item is being rewritten in the same effort — is there a risk of the yardstick
  and the thing being measured changing together with no independent check? [Ambiguity, Spec §SC-008]
- [x] CHK047 Is FR-030's "every existing system design scenario's content MUST be reviewed and
  updated" scoped to structural sequencing only, or does it also require prose rewriting — is that
  boundary as explicit as FR-024's boundary for the `shortAnswer` rewrite? [Clarity, Spec §FR-030 vs
  FR-024]

## Naming Change (US9)

- [x] CHK048 Does SC-009's "no occurrence... anywhere in the rendered UI" have a defined verification
  method (e.g., a full-site text search procedure), or is exhaustiveness asserted with no check beyond
  the single known source location research.md identifies? [Measurability, Spec §SC-009]
- [x] CHK049 Is FR-032 ("MUST NOT alter... filtering behavior") checked against every surface level 4
  is filtered/displayed on (chips, dropdowns, cheat sheets, per Acceptance Scenario 2 of US9), or does
  the requirement assert the outcome without enumerating the surfaces it must hold across? [Coverage,
  Spec §FR-032]

## Cross-Cutting Consistency, Dependencies & Traceability

- [x] CHK050 Do any two of the nine user stories impose requirements touching the same file/view in
  ways that could conflict (e.g., US4's single-button rate-row and US6's DSA-view restructuring both
  touching `dsa.js`; US4 and US8 both touching `design.js`) — is that overlap called out as a
  sequencing/dependency concern anywhere, or only discoverable by reading plan.md's file list? [
  Dependency, Plan §Project Structure]
- [x] CHK051 Is there a requirement establishing rollout order across the three batched,
  independently-progressing content efforts (US6's `sampleCall`, US7's `shortAnswer` rewrite, US8's
  `clarifyingQuestions`) — can they proceed in any order, or does sequencing depend on the plan alone
  with nothing at the spec level constraining it? [Gap, Spec vs Plan]
- [x] CHK052 Are all nine user stories' stated priorities (P1×4, P2×3, P3×3) internally consistent
  with each story's own "Why this priority" rationale, or does any story's rationale argue for a
  different relative priority than its assigned label? [Consistency, Spec §User Scenarios]
- [x] CHK053 Does the spec's Assumptions section account for every external dependency this feature
  introduces, or are dependencies mentioned only in the plan/research (e.g., `tools/validate.mjs`
  gaining new required-field gates) omitted from the spec-level Assumptions? [Traceability, Spec
  §Assumptions vs Plan]
- [x] CHK054 Does a requirement address the capability loss from removing the manual Update flow's
  item-level diff modal — the only place a candidate previously saw exactly what changed before
  accepting it — with an equivalent, or is that loss unaddressed by any FR? [Gap, Spec §US3 vs
  current behavior]
- [x] CHK055 Does every functional requirement carry a unique, stable identifier suitable for
  cross-referencing from tasks.md and code comments, and are the two lettered sub-requirements
  (FR-019a, FR-019b) applied as a consistent pattern rather than a one-off not used elsewhere in the
  document? [Consistency, Spec §Functional Requirements]

## Resolution Notes — Pass 1 (2026-08-14)

**Spec edits made to close items** (all in `spec.md`):

- Added **FR-010a** (post-apply sync notice) and **FR-010b** (defer apply while
  `Drill`/`Mock` is active) — closes CHK011, CHK012, CHK018, CHK054. These four items all had the
  same root cause: the toast-disclosure and session-gating behavior were fully designed in
  `research.md` R-003 and the constitution's Principle III amendment, but no FR said so — a real
  traceability gap, not a nitpick.
- Added **FR-014a** (Mock's completion-count summary replaces `avgScore`) — closes CHK036.
- Added **FR-018a** (no shipped/shared API key; candidate's key is client-side-only, Run-only,
  never logged) — closes CHK019, CHK027.
- Broadened **FR-020** to name `needs setup` (missing key) as its own distinct message alongside
  `needs a connection`, and added **FR-020a** (second Run press aborts the first) — closes CHK020,
  CHK021, CHK025.
- Reworded **SC-002** to say "within 1 second **of first paint**", matching FR-005/US2's Acceptance
  Scenario 2 — closes CHK005.
- Reworded the "Mark complete" idempotency Edge Case: the old text promised repeated taps are
  "idempotent," which `research.md` R-004 directly contradicts (a second tap *does* re-advance the
  item through the SM-2 curve, same as double-clicking "Good" today). The spec now states the actual,
  already-agreed behavior instead of a claim the implementation was never going to satisfy — closes
  CHK035.
- The lettered-suffix pattern (`FR-019a/b`) is now used six more times, so CHK055's "is this a
  reusable pattern or a one-off" is answered by the edits above, not just asserted.

## Resolution Notes — Pass 2 (2026-08-14): the remaining 17

Each decision below is recorded with its rationale, so a later reader can revisit it deliberately
rather than rediscover it as an ambiguity.

**CHK044 — `clarifyingQuestions` shape (the blocker Pass 1 flagged highest).** Settled as a **flat
array of plain question strings**, with no authored answer per question. The Assumptions text was the
wrong half of the contradiction and has been rewritten; `data-model.md` and `content-schema-delta.md`
were already correct. Evidence gathered before deciding: both schema docs already agreed on flat
strings; every sibling list on a design item (`requirements[]`, `rubric[]`, `staffAdds[]`) is a flat
string array; `design.js` already renders `requirements[]` as a persisted checkbox checklist the new
field can reuse verbatim; and **no array-of-objects question/answer pattern exists anywhere in the
629-item content set** — only `refs[]` and `code[]` use objects at all. A pair shape would have been
novel in the schema, novel in the view, and unsupported by precedent. New **FR-027a** now states the
shape at requirement level rather than leaving it in Assumptions. The candidate marks which questions
they'd have asked; the answers those questions would have elicited are what the Step-2 plan lays out.

**CHK024, CHK026, CHK030, CHK032 — the DSA Run risk cluster.** All four now have requirements:
- **FR-019c** — an item with no `sampleCall` yet renders Run *disabled* with a "not runnable yet"
  note and sends no request. A missing sample input is a normal mid-rollout state, not an error, so
  the Run UI can ship before the content batches finish.
- **FR-020c** — Run times out at **30 seconds**, then falls through to "needs a connection". Generous
  because JVM-family compilation isn't instant; fixed because an unbounded spinner is the failure
  mode being designed out. Paired with the existing `AbortController`, since `fetch` has no native
  timeout.
- **FR-020b** — an explicit pending state, visually distinct from both idle and finished, that clears
  any previous result the moment a new run starts (so a stale output can't be read as current).
- **FR-022a** — if the CORS smoke test fails, the required response is to **drop US6 from the release
  and keep the notes area** — explicitly *not* to add a proxy or backend, which would trade a
  Principle V violation for a CORS fix. T022 is now marked a go/no-go gate for the whole story.

**CHK045, CHK046, CHK047 — US8 content scope.**
- **FR-027b** — **no exemptions.** Minimum 3 clarifying questions on every design item including the
  framework item. A scenario that can't yield three real ones is underspecified and gets expanded,
  not excused. Enforced by T003's validator gate, not left to reviewer diligence.
- **SC-008 reworded** — conformance is verified against the spec's own structural definition
  (FR-027/027a/027b/FR-028), *not* against the framework item, which is rewritten in this same effort
  and so cannot be its own yardstick. The framework item is checked against that same definition as
  one more conforming item. This breaks the circularity CHK046 identified.
- **FR-030 scoped to structure** — splitting clarify-flavored bullets out of `requirements[]` and
  fixing framework pointer text. It explicitly does *not* authorize general prose rewriting; the only
  prose-quality rewrite in this feature is US7's, scoped to `shortAnswer`, which reaches these same
  packs via T042. Mirrors FR-024's boundary language, which is what CHK047 asked for.

**CHK004, CHK007, CHK014 — startup/sync edge cases.**
- **FR-005a** — the skeleton shows neutral placeholders (`—`) for every content-derived figure, never
  zeros. This matters more than it first looks: on a cold cache `snapshot.items` is `[]`, so
  `dashboard.js`'s counts and mastery percentages would all render `0`/`0%` — indistinguishable from
  a candidate who has genuinely studied nothing. New task **T007a** owns it.
- **FR-005b** — the 1-second target is calibrated against a reference environment; on slow devices the
  *number* may slip but the *ordering* (shell before packs) holds unconditionally. The ordering is the
  real requirement; the number is calibration.
- **FR-007a** — sync is **all-or-nothing**. Any pack/plan fetch failure abandons the whole attempt:
  snapshot untouched, no tick migration, nothing persisted, no toast, no error shown. Retried at the
  next natural trigger. New task **T010b** owns it, and guards specifically against a partial
  `Promise.all` failure letting `applyUpdate()` swap in an incomplete snapshot.

**CHK015, CHK050, CHK051 — consistency/sequencing, now written down.**
- **CHK015** — an ordinary content release from this feature is *comfortably* inside the amendment,
  not at its edge, and the argument is structural rather than a judgment call: every content task
  edits fields on existing items only, so no plan's item-id set changes, so no material signature
  changes, so ticks aren't merely re-anchored — they're untouched. Recorded in Assumptions and at
  T056, where the release actually gets cut.
- **CHK050** — `tasks.md` gained a **Cross-Story File Overlap** table naming all nine multi-story
  files and the ordering each implies (notably `design.js`, where US8's T054 rewrites `renderDetail()`
  wholesale *including* the rate-row US4's T015 touches — the one overlap that was genuinely easy to
  trip over).
- **CHK051** — the three content efforts are **field-disjoint and may run in any order**, including
  concurrently on the same pack file. Stated in Assumptions. The only intra-story ordering is US8's
  framework-first rule.

**CHK033, CHK042 — clarity/process.**
- **FR-014** now separates *behavior* (must be identical across all three surfaces) from
  *presentation* (may differ per view layout) — the distinction CHK033 found implicit.
- **FR-025a** names the owner and the step: whoever authors a batch does an explicit read-through
  comparing each rewritten `shortAnswer` against that item's `answer`/`traps` before committing. It is
  part of the batch gate, not a discretionary spot-check, precisely because no validator can catch a
  summary that got simpler but stopped being true.

**CHK052 — the item's premise was wrong, and is corrected here.** The real distribution is **P1×3
(US1/US2/US3), P2×3 (US4/US5/US9), P3×3 (US6/US7/US8)** — not the "P1×4, P2×3, P3×3" the item
asserted. Re-run against the true counts, the priorities are internally consistent, but Pass 1 was
right that US4's and US9's rationales argued *cost/frequency* rather than *relative urgency*. Both
have been rewritten to argue placement explicitly (why not P1, why not P3) rather than merely
describing the change's size.

## Notes

- Focus areas: full cross-cutting sweep of all nine user stories, with emphasized depth on
  search/startup performance (US1/US2), automatic sync + constitution amendment (US3), and DSA
  Run/Judge0 integration (US6) — the three areas judged highest-risk (numeric SLAs, a silent
  data-preserving auto-apply exception to a non-negotiable-adjacent principle, and the app's first
  external network dependency, respectively).
- Depth: Standard — thorough but not an exhaustive formal gate.
- Audience/timing: the feature author, self-checking spec/plan solidity before running
  `/speckit-tasks`.
- This is a separate, reviewer-owned artifact from `checklists/requirements.md` (the built-in
  spec-quality checklist already passing) — it does not duplicate that file's items and is not
  superseded by it.
- Check items off as the underlying requirement-quality concern is resolved (typically by editing
  spec.md/plan.md), not when related code is written.
