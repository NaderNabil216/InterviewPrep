# Feature Specification: Dashboard Progress Reflects Completed Questions

**Feature Branch**: `007-dashboard-progress-sync`

**Created**: 2026-08-20

**Status**: Draft

**Input**: User description: "the progress in dashboard is not working and synced with the questions been completed , this need to be tested and fixed"

## Problem Statement

A candidate marks question after question complete. The dashboard's progress bars stay empty and its
"known" counter stays at zero. Meanwhile the study plan happily ticks the same material off as done.
Two surfaces, one body of work, two irreconcilable answers — and the one the candidate checks first to
judge whether they are ready is the one that says they have done nothing.

The cause is that "progress" is defined three different ways over the same stored data:

| Surface | What it counts as progress today |
|---|---|
| Dashboard bars, dashboard "known" counter, plan "weakest tracks" | Only questions whose review interval has grown to 21+ days |
| Study plan task ticks | Any question with *any* stored record against it, including a typed note |
| "Unseen" counts on dashboard and plan | Any question with no stored record at all |

The first definition is the problem. Because every "Mark complete" button in the product records the
same single outcome, a question's review interval can only grow along one fixed path — **1 day, 3 days,
8 days, 20 days, then 50 days**. It first crosses the 21-day line on the **fifth** completion, which
under normal spaced review lands on **day 32** of study. The product ships a 7-day sprint and a 15-day
deep plan. For the entire life of either plan, every progress bar on the dashboard is pinned at 0% and
the "known" counter is pinned at 0 — not because the candidate is behind, but because those numbers
cannot mathematically move in the time the candidate has.

Everything downstream of that zero is broken too: the "weakest tracks" list and the "Next up"
recommendations are ordered by that same all-zero number, so their ordering carries no information and
the suggestions are not personalised at all. And the Topics filter offers a "Known" option that cannot
match a single question during a candidate's first month.

## Clarifications

### Session 2026-08-20

- Q: Under the new coverage definition, what set of status options should the Topics browser's status filter offer? → A: Not started / Completed only — the review-state option is dropped from Topics, and review state is reported by the dashboard and the drill instead.
- Q: The Topics browser hides `dsa` and `system-design` questions, yet SC-003 demands identical counts across the dashboard, plan and Topics for every track — how should those two tracks be handled? → A: Scope the cross-surface count agreement to the 11 tracks Topics covers; `dsa` and `system-design` are verified dashboard-vs-plan only.
- Q: Existing candidates' plan tasks that read as done only because a note was saved will flip back to not-done on first load — should the candidate be told, or does it change silently? → A: Silently. No notice, confirmation, or decline step; nothing stored is written or removed, and any task stays tickable by hand.
- Q: The dashboard's "due for drill" figure counts tracks the drill never offers — should it be narrowed to what the drill will present? → A: Yes. The due figure counts exactly what the review queue will offer, excluding the two workspace tracks, so the adjacent action can drive it to zero.
- Q: How should the progress-accounting check be wired in so it actually runs? → A: Its own file, runnable on its own, and also invoked by the repository's existing integrity command so a failure fails the gate that already governs release.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Completed questions show up as progress (Priority: P1)

A candidate works through questions and marks each one complete. When they return to the dashboard, the
per-track bars have moved and the headline counter has gone up by exactly the number of questions they
finished. Progress they can see is progress they actually did.

**Why this priority**: This is the reported defect and the reason the dashboard exists. Without it the
candidate has no trustworthy read on their own readiness, which is the product's entire job. Every
other story in this feature is a consequence of getting this definition right.

**Independent Test**: Starting from cleared learning history, mark a known number of questions complete
in one track, return to the dashboard, and confirm the track's bar and the headline counter both report
exactly that number and its correct percentage of the track total. Delivers the working progress
readout on its own, with no other story implemented.

**Acceptance Scenarios**:

1. **Given** a candidate with no learning history, **When** they view the dashboard, **Then** every
   track bar reads 0% and the headline completed counter reads 0.
2. **Given** a track holding 20 questions, **When** the candidate marks 5 of them complete, **Then**
   that track's bar reads 25% and shows 5 of 20.
3. **Given** a candidate who marked a question complete moments ago, **When** they return to the
   dashboard, **Then** that question is already counted — no waiting period, no threshold, no delay
   before it registers.
4. **Given** a candidate who has marked every question in a track complete once, **When** they view the
   dashboard, **Then** that track reads 100%.
5. **Given** a question the candidate completed a week ago that is now due for review again, **When**
   they view the dashboard, **Then** it still counts as completed, and the fact that it is due is
   reported separately by the review-queue count.
6. **Given** a candidate who marks the same question complete five times, **When** they view the
   dashboard, **Then** it counts once — the bar measures questions covered, not completions recorded.
7. **Given** the app is still loading its library on a cold start, **When** the dashboard renders,
   **Then** it shows a loading state rather than presenting an unknown total as a genuine zero.
8. **Given** the candidate is already viewing the dashboard, **When** they ask for the dashboard again,
   **Then** the figures shown reflect their stored history as of that moment, not as of an earlier visit.
9. **Given** a candidate carrying completions, notes, review schedules and plan ticks earned before this
   change, **When** they load the app afterwards, **Then** every one of them is still present and
   unaltered, and their completions are counted under the new definition.
10. **Given** the device cannot save learning state, **When** the candidate marks a question complete,
    **Then** they are told it was not saved, **And** the dashboard does not count it as completed.

---

### User Story 2 - Every surface agrees on what "completed" means (Priority: P2)

A candidate cross-checks the dashboard against their study plan and the two tell the same story. If the
plan says today's tasks are done, the dashboard reflects that same material as progress.

**Why this priority**: Fixing the dashboard alone would leave the contradiction between surfaces intact,
just with different numbers. A candidate who sees two different answers cannot trust either, so the
single definition is what makes the P1 fix believable.

**Independent Test**: Complete every question behind one study-plan task, then compare that task's tick
state, the dashboard bars, the plan's own per-track counts, and the Topics status filter — all four must
classify that same material identically.

**Acceptance Scenarios**:

1. **Given** a plan task linked to three questions and all three marked complete, **When** the
   candidate views the plan, **Then** the task reads as done, **And** the dashboard counts all three as
   completed.
2. **Given** a plan task linked to three questions with only two marked complete, **When** the candidate
   views the plan, **Then** the task does **not** read as done, **And** the dashboard counts exactly two.
3. **Given** any question the Topics browser lists, **When** the candidate filters Topics by completion
   state, **Then** the state shown for that question matches how the dashboard counts it, **And** for a
   question with a dedicated workspace instead, the dashboard and the study plan agree on it.
4. **Given** the Topics status filter offering exactly *not started* and *completed*, **When** the
   candidate picks either one, **Then** it matches the questions the dashboard counts that way, **And**
   no filter value exists that cannot match a question a candidate could plausibly have reached.
5. **Given** any count of completed, unseen, or due questions shown anywhere in the product, **When**
   the candidate reads its label, **Then** the label states which questions it counts, and two counts
   presented side by side draw from populations the candidate can reconcile.
6. **Given** a candidate carrying due questions in several tracks, **When** they clear the whole review
   queue the dashboard's due figure points at, **Then** that figure reads 0 — it never counts a question
   the queue will not offer.

---

### User Story 3 - Notes are notes, not completions (Priority: P3)

A candidate types a personal memory hook into a question's notes box without answering it yet. That note
is saved. It does not claim the question is done, and the question still comes up when they review.

**Why this priority**: Typing a note currently has two silent side effects — it auto-ticks study-plan
tasks the candidate never completed, and it removes the question from the review queue permanently.
The second is the more serious: material the candidate flagged as worth remembering is exactly the
material that then never comes back.

**Independent Test**: On a fresh question, type a note and save it without marking it complete. Confirm
the note persists, the question is not counted as completed anywhere, any plan task linked to it stays
unticked, and the question still appears in the review queue.

**Acceptance Scenarios**:

1. **Given** a question with no history, **When** the candidate saves a note on it and marks nothing,
   **Then** the dashboard does not count it as completed.
2. **Given** the same question, **When** the candidate opens the review queue, **Then** the question is
   still offered — saving a note never removes a question from review.
3. **Given** a plan task linked only to questions the candidate has merely noted, **When** they view the
   plan, **Then** the task is not ticked.
4. **Given** the same question, **When** the candidate views it in Topics, **Then** its state is
   consistent with it being reachable in review and not yet completed.
5. **Given** an existing candidate whose stored history already contains note-only records, **When**
   they load the app after this change, **Then** those questions become reachable in review again and
   stop counting toward plan ticks, with their notes intact, **And** they are shown no notice and asked
   for no confirmation — the corrected reading simply applies.

---

### User Story 4 - Recommendations point at genuinely weak tracks (Priority: P4)

The dashboard's "weakest tracks" list and its "Next up" suggestions are ordered by where the candidate
has actually covered the least, so the next thing offered is the thing most worth doing.

**Why this priority**: These surfaces are already visible and already claim to be personalised. They are
currently ordered by a value that is identical for every track, so the ordering is arbitrary and the
claim is false — but the harm is a weaker suggestion rather than a wrong number, so it ranks below the
counts themselves.

**Independent Test**: Complete most questions in one track and none in another, then confirm the
uncovered track is listed as weaker and that "Next up" draws from it.

**Acceptance Scenarios**:

1. **Given** track A at 90% completed and track B at 10%, **When** the candidate views the dashboard,
   **Then** track B is ranked as weaker than track A.
2. **Given** the ranked weakest tracks, **When** the candidate reads "Next up", **Then** every suggested
   question is one they have not completed, drawn from those weakest tracks.
3. **Given** a candidate with no history at all, **When** they view "Next up", **Then** they are still
   offered a stable, non-empty set of questions rather than an empty or arbitrary list.
4. **Given** a track the candidate has fully completed, **When** the dashboard ranks weakest tracks,
   **Then** that track is not suggested as a source of new material.

---

### User Story 5 - Due dates follow the candidate's own calendar day (Priority: P4)

A question scheduled for review "tomorrow" becomes due when tomorrow starts where the candidate is
sitting, not on some other clock.

**Why this priority**: Review scheduling is compared against a differently-computed notion of "today"
than the rest of the product uses, so for a window of hours each night the due count and the review
queue are off by a day. Real but narrow, and it does not touch the completed counts.

**Independent Test**: With the device clock set inside the small hours in a timezone offset from UTC,
confirm the due count and the review queue agree with the candidate's local calendar date.

**Acceptance Scenarios**:

1. **Given** a candidate in a timezone ahead of UTC at 01:00 local, **When** they open the dashboard,
   **Then** the due count matches what their local calendar date implies.
2. **Given** a candidate in a timezone behind UTC late in the evening, **When** they open the review
   queue, **Then** no question scheduled for tomorrow is offered early.
3. **Given** a question completed today with a one-day interval, **When** the candidate returns the next
   local day, **Then** it is due exactly once that day arrives.

---

### User Story 6 - The progress accounting can be re-verified on demand (Priority: P5)

Anyone maintaining the product can re-run a check that proves the progress numbers add up, without
clicking through the app question by question.

**Why this priority**: The request explicitly asks for this to be tested, and the arithmetic at the
heart of the defect — how a review interval grows and when a question crosses a threshold — is exactly
the kind of thing that silently regresses. It ranks last because it protects the fix rather than
delivering it.

**Independent Test**: Run the check against a synthetic history with known expected counts and confirm
it reports pass; change one count deliberately and confirm it reports failure.

**Acceptance Scenarios**:

1. **Given** a synthetic learning history with a known number of completed questions per track, **When**
   the check runs, **Then** it confirms the computed counts and percentages match the expected values.
2. **Given** a deliberately broken definition of completion, **When** the check runs, **Then** it fails
   and names the mismatch.
3. **Given** the check, **When** it runs, **Then** it completes without a browser and without adding any
   third-party dependency to the repository.
4. **Given** the surfaces this feature touches, **When** a maintainer needs to confirm them in a real
   browser, **Then** a written step-by-step verification procedure covering each acceptance scenario is
   available and states its expected result.
5. **Given** the repository's existing integrity command, **When** a maintainer runs it, **Then** the
   progress-accounting check runs as part of it, **And** a failing check fails that command rather than
   passing unnoticed.

### Edge Cases

- **A question is retired from the library while the candidate has it completed.** Its record is keyed by
  a permanent identifier that is never reused, so the record survives; it must not be counted against a
  total it is no longer part of, and percentages must stay within 0–100%.
- **A track total of zero.** A track present in the library with no countable questions must not produce
  a division by zero or a nonsense percentage — it is either omitted or shown as having nothing to do.
- **Content arrives while the candidate is studying.** New questions raise a track's total, so a bar that
  read 100% can legitimately drop. The number must stay correct; it must not be frozen to look tidy.
- **The library is still loading.** An unknown total must render as a loading state, never as 0%.
- **Learning history is imported from a file exported before this change.** Old records carry the old
  shape. They must be interpreted under the new definition without rewriting or discarding them.
- **A saved note on a question that was already completed.** Saving the note must leave the completion
  and the review schedule exactly as they were.
- **Questions with a dedicated workspace rather than a flashcard flow.** These are completable and belong
  in coverage totals, but neither the review queue nor the topic browser offers them. Any two counts
  shown together must not imply otherwise, and their cross-surface agreement is checked between the
  dashboard and the study plan rather than against the topic browser. In particular the dashboard's due
  figure counts only what the review queue will present, so it excludes them.
- **The candidate is already on the dashboard and asks for it again.** They are entitled to current
  numbers, not a stale screen.
- **A track whose own view offers no completion action.** Reference material presented in a dedicated
  read-only view is still counted in a track total, so its bar cannot leave 0% however thoroughly it is
  read. Either the action reaches that view or the track is not counted — it may not be counted and be
  uncompletable at once.
- **Learning history cannot be saved.** A failed write must not be presented as a recorded completion.

## Requirements *(mandatory)*

### Functional Requirements

**Definition of completion**

- **FR-001**: The system MUST define a question as *completed* when the candidate has marked it complete
  at least once, at any time, in any of the places the product offers that action.
- **FR-002**: A question MUST count as completed from the moment it is marked, with no threshold, waiting
  period, or number of repetitions required first.
- **FR-003**: A question MUST count at most once toward completion totals regardless of how many times it
  is marked complete.
- **FR-004**: A question MUST remain counted as completed once it is completed, including after it falls
  due for review again.
- **FR-005**: Saving a note, a code draft, a checklist tick, or any other working material against a
  question MUST NOT count as completing it.
- **FR-006**: The system MUST use this single definition of completion everywhere completion is shown or
  acted upon, with no surface applying its own variant.

**What the dashboard shows**

- **FR-007**: The dashboard MUST show, per track, the number of completed questions out of that track's
  total, together with the corresponding percentage.
- **FR-008**: The dashboard MUST show a library-wide completed count alongside the library total.
- **FR-009**: The dashboard MUST label each figure so the candidate can tell what population it counts
  and must not present a completion figure under a word that implies long-term mastery.
- **FR-010**: The dashboard MUST continue to report the number of questions due for review as a figure
  distinct from completion, and that figure MUST count exactly the questions the review queue will
  offer — a candidate acting on the adjacent affordance MUST be able to drive it to zero. Questions with
  a dedicated workspace, which the review queue does not offer, MUST NOT be counted in it; their due
  state is reported where those questions are done.
- **FR-011**: While the library has not finished loading, the dashboard MUST show a loading state for
  each figure rather than a zero.
- **FR-012**: Percentages MUST be bounded to 0–100% and MUST be well-defined when a track total is zero.

**Cross-surface consistency**

- **FR-013**: A study-plan task linked to questions MUST read as complete when, and only when, every
  question it links to is completed under FR-001, unless the candidate has ticked or untied it by hand,
  which continues to take precedence.
- **FR-014**: The study plan's own per-track figures MUST report the same completion counts as the
  dashboard for the same tracks.
- **FR-015**: The Topics browser MUST classify each question consistently with how the dashboard counts
  it, using exactly two states — *not started* and *completed* — for both its status filter and its
  per-question status indicator. It MUST NOT offer a review-state filter option: review state is
  reported by the dashboard's due figure and by the review queue, not by the topic browser. Every
  option the filter offers MUST be reachable. The browser is not required to list questions it
  deliberately excludes because they have a dedicated workspace view (the `dsa` and `system-design`
  tracks); for those, cross-surface agreement is required between the dashboard and the study plan.
- **FR-016**: Where two counts drawn from different populations are shown together, each MUST be labelled
  with the population it covers.

**Review queue integrity**

- **FR-017**: A question MUST be reachable through the review queue unless it is completed and not yet
  due — in particular, holding only notes or other working material MUST NOT remove it from review.
- **FR-018**: The system MUST treat a stored record that carries no review schedule as not yet completed
  and as still awaiting review.
- **FR-019**: Existing candidates carrying such records MUST have those questions become reachable in
  review again on first load after this change, with their notes and any other working material intact.
  This correction MUST apply automatically and silently — no notice, confirmation, or decline step —
  because nothing stored is written, altered, or removed by it. A study-plan task that read as done only
  because a note was saved simply reads as not done, and remains tickable by hand under FR-013.

**Scheduling correctness**

- **FR-020**: The system MUST decide whether a question is due by comparing its schedule against the
  candidate's own local calendar date, using one consistent notion of "today" across every surface.

**Reachability of completion**

- **FR-027**: Every track counted in a progress figure MUST be completable to 100% through the surfaces the
  product directs a candidate to for that material. No track may be counted in a denominator while the
  view built for reading it offers no way to mark its questions complete.
- **FR-028**: The cheat sheets view MUST offer the same complete action as every other reading surface, so
  the five sheets it presents are completable where they are read rather than only by locating them in the
  topic browser. The action MUST NOT appear in a printed or saved sheet.

**Freshness**

- **FR-021**: Progress figures MUST reflect the candidate's stored history as of the moment the surface
  is displayed, including when the candidate asks for a surface they are already viewing.

**Preservation of learning history (non-negotiable)**

- **FR-022**: This change MUST NOT rewrite, migrate, or discard any stored learning record. The revised
  completion figure MUST be derived at read time from information already stored on the device.
- **FR-023**: No completion, note, review schedule, interval, or plan tick that a candidate has earned
  MUST be lost or altered by this change.
- **FR-024**: A failure to save learning state MUST NOT be presented to the candidate as a successfully
  recorded completion.

**Verification**

- **FR-025**: The system MUST provide a check that verifies the completion accounting against a synthetic
  history with known expected results, runnable without a browser and without adding any third-party
  dependency. The check MUST live on its own and be runnable on its own, and MUST also be invoked by the
  repository's existing integrity command, so that a failure fails the same gate that already decides
  whether the product is shippable — there is no second command for a maintainer to remember.
- **FR-026**: The feature MUST ship a written verification procedure covering each acceptance scenario in
  this specification, each with its expected result.

### Key Entities

- **Question**: One study item in the library. Carries a permanent identifier that is never reused, plus
  the track it belongs to. The library total and each track total are counts of these.
- **Learning record**: What the candidate has accumulated against one question — whether and when they
  marked it complete, its review schedule, and any notes or working material. Keyed by the question's
  permanent identifier and owned entirely by the candidate; never written by a content release.
- **Completion**: The derived yes/no answer to "has the candidate marked this question complete at least
  once", read from the learning record. The single input to every completion figure in the product.
- **Track coverage**: For one track, the number of its questions that are completed, its total, and the
  percentage between them. What a dashboard bar renders.
- **Review schedule**: The date a completed question next comes up, compared against the candidate's
  local calendar date to decide whether it is due. Independent of completion.
- **Study-plan task**: A unit of plan work naming the questions it covers. Reads as done when all of them
  are completed, or when the candidate has ticked it by hand.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A candidate who marks any number of questions complete sees the dashboard's per-track and
  library-wide figures change by exactly that number, on their next look at the dashboard.
- **SC-002**: On the first day of study, a candidate who completes questions sees a non-zero progress
  figure — down from the current 32 days before any figure can move.
- **SC-003**: For each of the 11 tracks the Topics browser covers, the completion count shown on the
  dashboard, the count shown in the study plan, and the count derivable from the Topics browser are
  identical — across 100% of those tracks. For the two tracks reached through a dedicated workspace
  instead (`dsa`, `system-design`), the dashboard and study-plan counts are identical, across 100% of
  both. No track is exempt from cross-surface agreement; only the set of surfaces compared differs.
- **SC-004**: A candidate who completes all questions behind a plan task sees that task done and sees the
  same questions counted on the dashboard, with zero contradictory pairs across the whole plan.
- **SC-005**: Zero questions become unreachable in review as a result of the candidate saving notes or
  other working material — measured across a history containing note-only records.
- **SC-006**: Both of the two status options the Topics browser offers — *not started* and *completed* —
  can be made to match at least one question through ordinary use on the first day of study, and no
  third, unreachable option is offered.
- **SC-007**: The weakest-track ranking places tracks in genuine ascending order of completion, verified
  against a history with deliberately uneven coverage.
- **SC-008**: Due counts agree with the candidate's local calendar date at every hour of the day,
  including the hours where the current behaviour is off by one.
- **SC-009**: 100% of learning records present before the change are still present, unaltered, and
  correctly interpreted afterwards — no completion, note, schedule, or plan tick lost.
- **SC-010**: The verification check passes against the corrected behaviour and fails against each of the
  defects this specification describes, so a regression is caught rather than assumed absent — and it
  runs as part of the integrity command that already gates a release, so catching it never depends on
  someone remembering to run it.
- **SC-012**: Every track shown in a progress figure can be driven to 100% by a candidate using only the
  views the product points them at for that track — verified per track, all 13 of them.
- **SC-011**: A maintainer can confirm every acceptance scenario in this specification by following the
  written procedure, without reading source code to work out what the expected result is.
- **SC-013**: The dashboard's due figure can be driven to 0 by clearing the review queue it points at,
  from any starting history — no counted question is left that the queue cannot offer.

## Assumptions

- **"Completed" means the candidate pressed the complete action, not that they answered correctly.** The
  product offers a single "Mark complete" action wherever a question can be finished; there is no
  self-graded scale to distinguish a confident answer from a shaky one. Coverage is therefore what the
  candidate has been through, which is what the request asked for.
- **Long-term mastery stops being the dashboard's headline figure.** Per the chosen direction, one signal
  with one definition is shown, rather than layering a second mastery reading beside it. The underlying
  review scheduling is unchanged and continues to govern when questions come back; it is simply no longer
  what the progress bars measure.
- **The revised figure is derivable from history already on the device.** Existing records distinguish a
  question that was marked complete from one that only holds a note, so the new definition can be read
  from what is already stored — which is what makes FR-022's no-migration requirement achievable rather
  than aspirational.
- **Percentages are rounded for display**, so a track showing 100% means every question in it is
  completed and nothing is hidden by rounding at the boundary.
- **This feature changes how progress is read, not how review intervals are calculated.** Interval growth
  and the review queue's ordering are out of scope except where a defect breaks them, namely the two
  named in US3 and US5.
- **The repository has no automated test runner and none is added.** Verification therefore takes the form
  of a check runnable with the platform tooling already in use, plus a written manual procedure — not a
  new testing framework.
- **The corrected reading applies silently to existing candidates.** A plan task that read as done only
  because a note was saved will read as not done afterwards, with no notice. This is not a content
  release being imposed on a candidate: nothing on disk arrives, nothing stored is written, altered or
  removed, and every affected task stays tickable by hand. The visible change is the defect being
  removed, not history being lost.
- **Only one candidate's history exists per device**, held locally, with no account and no server, so
  there is no multi-user or synchronisation dimension to this feature.
- **The dashboard is the primary surface under repair**; the study plan, Topics browser, and review queue
  are in scope only to the extent that they must agree with it and that the two integrity defects in US3
  and US5 must be fixed.
