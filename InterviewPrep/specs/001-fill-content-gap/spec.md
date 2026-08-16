# Feature Specification: Fill the Content Gap to a Complete Study Library

**Feature Branch**: `001-fill-content-gap`

**Created**: 2026-08-08

**Status**: Draft

**Input**: User description: "i want you to fill the gaps for the missing content , now its only 93 items and the target is 600 items based on the original plan , fill it and validate ."

**Clarified**: 2026-08-08 — study-plan scope resolved (see Decisions, DD-001); six further
clarifications recorded below

## Clarifications

### Session 2026-08-08

- Q: When the plans are re-authored, what happens to a candidate's completed-task marks? → A: Marks
  follow the material — hand-ticks are re-anchored to the material their task covered; only ticks on
  tasks that point at no specific material are cleared, and that is disclosed before acceptance.
- Q: The library at 629 items would exceed the storage a browser gives one site, and the failure is
  currently silent. What is required? → A: The whole expanded library must stay storable and usable
  offline, and a storage failure must be shown to the candidate rather than swallowed; the size
  reduction needed to achieve that is in scope.
- Q: How long should an item's written answer be? → A: Short-to-mid, never very long and never very
  short — the depth beyond that belongs behind a "more info" link to a live primary source.
- Q: What difficulty mix should the 536 new items be authored to? → A: Hold today's centre of gravity —
  basics 10%, mid 30%, senior 45%, staff 15% library-wide (±5 points), every track spanning all four
  levels.
- Q: Which mode is in force for a candidate who has not chosen one? → A: Free study is the default;
  a candidate who has already started a dated plan keeps it, untouched.
- Q: Do the answer-length and "more info" rules apply to the existing 93 items? → A: Yes — existing and
  new alike. The existing items are brought into compliance in this feature and each changed item is
  marked as updated in the release that changed it. *(Which kinds of item the length band covers was
  narrowed on 2026-08-09 — see the next session.)*

### Session 2026-08-09

- Q: Does the answer-length band apply to every kind of item, or only to question-and-answer items? → A:
  Only to question-and-answer items. Cheat sheets, Problem Solving exercises, and Mobile System Design
  scenarios carry no word band — a problem statement is terse by design, and a design scenario's
  reference answer is the artifact the candidate is meant to study. The "more info" reference obligation
  is unaffected and stays library-wide, on every item of every kind.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Study a track deeply enough to be interview-ready (Priority: P1)

A candidate preparing for a senior Android interview opens a track — say Jetpack Compose — and expects
the questions to cover that subject the way a real interview loop does: not a sampler of 11 questions,
but the full surface an interviewer can reach for, from the fundamentals through the internals that
separate a mid-level answer from a senior one. Today every track runs dry within one sitting, and the
candidate cannot tell whether a topic is absent because it doesn't get asked or because it was never
written.

**Why this priority**: This is the entire point of the product. A study library that runs out is not a
study library. Every other story in this feature is in service of delivering this one safely.

**Independent Test**: Pick any track, work through it end to end in a single session, and confirm the
material outlasts the session and that no major subject an interviewer would ask about is missing.
Delivering even one track at full depth is independently valuable — a candidate interviewing for a
Compose-heavy role gets real value from Compose alone.

**Acceptance Scenarios**:

1. **Given** a candidate on the Topics view, **When** they filter to any single track, **Then** the
   track shows at least its planned minimum item count and spans all four difficulty levels with real
   depth at each rather than a single token item (FR-005; Cheat Sheets excepted).
2. **Given** a candidate who has exhausted the drill queue for a track, **When** they return the next
   day, **Then** unseen material remains available rather than an empty queue.
3. **Given** a candidate reading a track's questions, **When** they compare against the subjects the
   track claims to cover, **Then** each named subject is represented by at least one item.

---

### User Story 2 - Receive a large body of new material without losing any progress (Priority: P1)

A candidate who has already been studying — with a drill schedule, ratings, notes, and ticked plan
tasks — accepts the expanded library. Their history must survive intact. They must also be told, before
they accept anything, exactly what is arriving, so a six-fold growth in the library is a deliberate
choice rather than a surprise.

**Why this priority**: Equal to P1 because silently corrupting a candidate's drill schedule days before
an interview is worse than shipping no new content at all. The safety property is not optional.

**Independent Test**: Record a candidate's full learning state, apply the expansion, and confirm every
rating, interval, due date, note, plan tick, and mock result is either byte-identical afterwards or was
changed only after the candidate was told it would be.

**Acceptance Scenarios**:

1. **Given** a candidate with existing ratings and notes, **When** they accept the expanded library,
   **Then** every previously rated item retains its rating, interval, due date, and notes.
2. **Given** a candidate on the previous library, **When** new material exists, **Then** they are
   offered a summary of what is new, changed, and removed and can decline without side effects.
3. **Given** a candidate who declines, **When** they continue studying, **Then** they see exactly the
   library they had before.
4. **Given** a candidate who has exported their progress, **When** they re-import it after the
   expansion, **Then** their history reattaches to the same items.
5. **Given** a candidate with hand-ticked tasks on a plan whose contents are being replaced, **When**
   they accept the release, **Then** each tick still marks the material it was earned on, and any tick
   that cannot be carried across because its task pointed at no specific material is cleared and named
   in the release summary before acceptance.

---

### User Story 3 - Choose a time-boxed plan or roam the whole library (Priority: P2)

A candidate with a week to prepare wants to be told what to study, in what order, and to trust that
finishing it is enough for that week. A candidate with fifteen days wants the same, deeper. And a
candidate who already knows what they're weak at — or who has finished a plan, or who has three weeks
rather than seven days — wants to ignore the schedule entirely and work the full library on their own
terms without the product treating that as an unsupported state.

The two dated plans are **suggestions sized to their timeframe**, deliberately a curated subset of the
library rather than an index of it. Alongside them sits a third choice: free study, with no day-by-day
schedule, where the whole library is the working set.

**Why this priority**: Directly below the content itself. A 629-item library with only a 7-day and a
15-day route through it either drowns the candidate or wastes most of what was written. This is what
makes the expansion usable rather than merely large.

**Independent Test**: Select each of the three modes in turn and confirm each produces a coherent,
non-empty experience — the two plans yield a day-by-day schedule drawn from the expanded library, and
free study yields the full library with the review queue and mastery tracking intact.

**Acceptance Scenarios**:

1. **Given** a candidate choosing the 7-day sprint, **When** they view it, **Then** it presents a
   schedule completable in seven days that its authors consider sufficient preparation for that
   timeframe, drawn from the expanded library rather than only from the original items.
2. **Given** a candidate choosing the 15-day plan, **When** they view it, **Then** it presents a
   deeper fifteen-day schedule on the same basis.
3. **Given** a candidate choosing free study, **When** they view their dashboard and drill queue,
   **Then** both work against the entire library and neither presents an empty or broken state where a
   daily schedule would otherwise appear.
4. **Given** a candidate on any of the three modes, **When** they navigate to any item in the library,
   **Then** nothing about their chosen mode prevents or hides it — the plan suggests, it never
   restricts.
5. **Given** a candidate who switches modes, **When** they switch, **Then** their ratings, drill
   schedule, notes, and mock history are unaffected.
6. **Given** a candidate who has started a plan and switches to free study and back, **When** they
   return, **Then** their plan position and ticks are as they left them.
7. **Given** a candidate who has never chosen a mode, **When** they open the site, **Then** they are in
   free study with the whole library available, not routed through a dated plan's curated subset.
8. **Given** a candidate who had already started a dated plan before the three modes existed, **When**
   they open the site afterwards, **Then** they are still on that plan, at the same position, with
   their marks intact.

---

### User Story 4 - Trust that every claim is current and sourced (Priority: P2)

A candidate is about to state, out loud in an interview, that some deadline, version, or API behaviour
is a certain way. They need to know when that was last verified and where it came from, because being
confidently wrong about a platform detail is a rejection.

**Why this priority**: Trust is what distinguishes this library from a scraped question dump. It ranks
below the content and the plans only because unsourced-but-correct material still teaches, whereas an
empty library and lost progress do not.

**Independent Test**: Sample any item that carries a version number or a date and confirm it links to a
primary source with a verification date; confirm no source link is dead.

**Acceptance Scenarios**:

1. **Given** any item asserting a version, date, or policy deadline, **When** the candidate looks at
   it, **Then** a source reference with a verification date is present.
2. **Given** the whole library, **When** the source links are checked, **Then** none resolve to a
   missing page.
3. **Given** a claim that has changed since it was written, **When** the library is refreshed, **Then**
   the item shows that it was updated and in which release.

---

### User Story 5 - See exactly what arrived (Priority: P3)

After accepting an expansion, a candidate wants to know what is new — as a browsable list with source
links, grouped by release, with a summary saying what moved and why it matters.

**Why this priority**: Valuable, but the candidate can navigate the expanded library through Topics,
Drill, and search without it. It is the last slice to become useful and the first that can be deferred.

**Independent Test**: After the expansion, open the What's New view and confirm every added item is
listed under its release.

**Acceptance Scenarios**:

1. **Given** an accepted expansion, **When** the candidate opens What's New, **Then** each release
   lists its added and updated items with a plain-language summary.
2. **Given** several releases delivered in sequence, **When** the candidate reads the release history,
   **Then** the releases appear in their intended order.

---

### Edge Cases

- **Hand-ticks are positional, so re-authoring a plan silently changes what they mean.** A task
  completes automatically once every item it points to has been rated — that much already follows the
  material and survives re-authoring. But a candidate can also tick a task by hand, and a hand-tick is
  recorded against the task's *position* in the schedule — day 1's third task — not against the
  material it covers. Replacing a plan's contents therefore leaves hand-ticks attached to whatever now
  occupies those positions, marking unread material as done and hiding it from the candidate. This is
  the one place where changing content can corrupt a candidate's state, and it contradicts the
  guarantee that updates never touch progress. Resolved (see Clarifications): hand-ticks are
  re-anchored to the material their task covered, and the residue — ticks on tasks that point at no
  specific material, such as reading or note-taking tasks — is cleared and disclosed before acceptance.
- **Free study has no day to show.** Surfaces that ask "what should I do today" have a schedule to read
  from in the other two modes. In free study they must present something useful — due reviews, unseen
  material, weakest tracks — rather than an empty slot or an error.
- **Orphaned material from an interrupted earlier attempt.** Seven Coroutines & Flow items already
  exist on disk from a previous partial run, holding permanent identifiers `co-0049`–`co-0055` and
  tagged for release `2026.08.7`, but they are not part of the published library. Authoring the
  coroutines gap without accounting for them would mint those same identifiers twice, and duplicate
  identifiers are exactly what corrupts a candidate's progress history. This material must be either
  adopted as-is or retired, and the remaining coroutines gap authored *around* the identifiers it has
  already claimed.
- **New material that is invisible.** The library is only offered to the candidate when the published
  release marker changes. Material that is written and stored but not accompanied by a release marker
  change is unreachable — indistinguishable, from the candidate's side, from never having been written.
- **A pack of material that is never registered.** Material stored but not listed in the library
  registry does not exist for the candidate, for the What's New view, or for the integrity check. This
  is precisely the state the orphaned coroutines material is in today.
- **Identifier reuse across a six-fold expansion.** With twelve tracks authored in parallel, the
  greatest risk is two tracks, or two chunks of the same track, claiming one identifier. Every
  identifier must be unique library-wide, not merely within its own pack.
- **The library outgrowing the space the device will give it.** The candidate's device keeps its own
  copy of the whole library — that is what makes the site instant and offline-capable — and a browser
  caps how much one site may keep. At the current per-item weight and the current stored shape, which
  keeps each item three times over, the expanded library lands past that cap. The failure is silent
  today: the copy simply does not save, offline study stops working, and once the space is full the
  candidate's own ratings and notes stop saving too. Both the size and the silence must be addressed,
  which is also why an item's answer is bounded rather than open-ended.
- **A drill queue that becomes unusable at scale.** A queue built as "everything due, then everything
  unseen" behaves differently at 629 items than at 93. A candidate in free study needs a queue that
  stays a manageable daily portion rather than an undifferentiated backlog.
- **Release markers that read out of order.** Sequential releases within one month reach a two-digit
  suffix (`…08.9` then `…08.10`). Ordering shown to the candidate must follow the intended sequence,
  not a naive text sort that places `08.10` before `08.9`.
- **Difficulty and type balance drifting during a large authoring effort.** The library currently skews
  to senior-level material. A large expansion authored track-by-track can amplify that skew until a
  candidate at the basics level has nothing to start with.
- **Partial delivery.** If the expansion is delivered in stages and only some stages complete, the
  library must be coherent and usable at every intermediate point, never half-registered. The plans
  must not be re-authored against material that has not yet landed.

## Requirements *(mandatory)*

### Functional Requirements

#### Library size and coverage

- **FR-001**: The library MUST contain at least 600 study items in total, up from the current 93.
- **FR-002**: Each track MUST reach at least its planned minimum item count:

  | Track | Now | Planned minimum |
  |---|---:|---:|
  | Kotlin | 13 | 70 |
  | Coroutines & Flow | 8 | 55 |
  | Jetpack Compose | 11 | 75 |
  | Platform & Framework | 10 | 60 |
  | Architecture & DI | 7 | 50 |
  | Data, Networking & Persistence | 4 | 40 |
  | Performance & App Health | 3 | 40 |
  | Build, Tooling & Testing | 2 | 60 |
  | Security, KMP & Modern Android | 3 | 70 |
  | Problem Solving | 19 | 60 |
  | Mobile System Design | 5 | 19 |
  | Behavioral & Interview Craft | 3 | 25 |
  | Cheat Sheets | 5 | 5 |
  | **Total** | **93** | **629** |

- **FR-003**: Each track's new material MUST cover the subjects that track declares in scope, with no
  declared subject left unrepresented. A track's declared scope is the per-track scope definition listed
  under Dependencies; it is the authority on what that track must cover. Each track's scope definition
  MUST be frozen before that track's material is authored and recorded alongside the release that
  delivers it, so "declared" means a fixed, quotable list rather than whatever the definition happens to
  say later. Coverage MUST be demonstrable as a mapping from each declared subject to at least one item
  that addresses it. A declared subject deliberately left out MUST be recorded as such, with the reason,
  rather than silently omitted.
- **FR-004**: No item may duplicate another item in the library. Two items are duplicates when a correct
  answer to one is a correct answer to the other — the rule is about the knowledge being tested, not the
  wording. This applies both to new material against the existing 93 items **and to new material against
  other new material authored in the same expansion**, which is the greater risk while twelve tracks are
  written in parallel. Every release MUST be screened for near-duplicates before it is offered, and every
  pair the screen flags MUST be resolved — differentiated, merged, or deliberately accepted with the
  reason recorded — leaving no flagged pair unadjudicated. The screen may over-report; a human decides.
- **FR-005**: Every track MUST span all four difficulty levels, and the library as a whole MUST hold
  its centre of gravity at senior depth without losing its entry point: the finished library MUST sit
  at roughly **10% basics, 30% mid, 45% senior, 15% staff**, within ±5 percentage points on each band.
  Spanning is not satisfied by a token item: every track of 40 or more items MUST hold **at least 3
  items at each of the four levels**, and the two smaller drillable tracks — Mobile System Design (19)
  and Behavioral & Interview Craft (25) — **at least 2 at each**. Cheat Sheets are exempt: they are five
  reference one-pagers, frozen at their current size by this feature's scope, and are not drilled by
  level. No track may be authored entirely at one level, and a candidate MUST be able to start from the
  bottom in any track.
- **FR-035**: Difficulty levels MUST be assigned against a stated standard rather than by feel, since
  FR-005's distribution target is otherwise satisfiable by relabelling:

  | Level | An item belongs here when |
  |---|---|
  | 1 — Basics | A candidate in their first Android role can answer it. One concept, no trade-off to weigh, no production experience required. |
  | 2 — Mid-Level | It requires applying the concept correctly in a real app — knowing the API, its common misuse, and what breaks. One or two moving parts. |
  | 3 — Senior | It requires explaining *why*, and choosing between defensible options under stated constraints. Expects internals or failure modes learned by shipping. |
  | 4 — Staff | It requires reasoning about consequences beyond one screen or module — cross-team or cross-module trade-offs, migration and rollout risk, or platform internals most seniors never reach for. |

  An item MUST be assigned the **lowest** level at which a candidate could be expected to answer it.
  Level inflation is the failure mode this rule exists to prevent: the library already sits at 54%
  senior against a 45% target, and the expansion must pull the basics and mid bands up rather than
  relabel its way there.
- **FR-006**: Problem Solving items MUST carry the working aids that track promises — a pattern label,
  progressive hints, complexity, and a starting point to write against. Mobile System Design items MUST
  carry a requirements checklist, a scoring rubric, and a time budget.
- **FR-032**: A **question-and-answer item's** written answer MUST be short-to-mid length: substantial
  enough to actually teach the point, never an essay. The target band is **120–250 words**, with a hard
  ceiling of **350 words**; answers below 80 words are too thin to count. The band applies to
  **question-and-answer items only**. Cheat sheets, Problem Solving exercises, and Mobile System Design
  scenarios carry **no word band**: a problem statement is terse by design, and a design scenario's
  reference answer is the artifact the candidate studies rather than a summary of one. Word counts MUST
  be produced by a single canonical counting method applied uniformly to every measured answer, so the
  thresholds above are decidable rather than a matter of tooling.

  Separately, and for **every item in the library of every kind, existing and new alike**: depth beyond
  what the item itself says MUST NOT be written out at length — it MUST be reached through a "more info"
  reference, and every item MUST carry at least one such reference to a live primary source the
  candidate can open to read further.

  A single reference MAY satisfy both this obligation and FR-023's dated source for a version claim, and
  usually should: they are the same kind of artifact, and one well-chosen primary page is more useful to
  a candidate than two. It qualifies for both only when it is primary (FR-025), carries a verification
  date (FR-024), **and** actually contains the further depth rather than merely evidencing the claim. A
  reference that only evidences a claim leaves the "more info" obligation unmet, and a second reference
  is then required.

#### Study modes

- **FR-007**: The candidate MUST be able to choose between exactly three study modes: the 7-day sprint,
  the 15-day deep plan, and free study.
- **FR-008**: The 7-day sprint MUST be a curated selection from the expanded library, deliberately
  smaller than the library, sized so a candidate can complete it in seven days and judged by its
  authors to be sufficient preparation for that timeframe. Each dated plan MUST **declare the daily
  study budget it is sized against**, in minutes per day, and the material it schedules MUST fit that
  budget at the working paces SC-002 states. Without a declared budget "completable in seven days" is
  unfalsifiable — it depends entirely on how long the candidate is assumed to study.
- **FR-009**: The 15-day deep plan MUST be a curated selection on the same basis, sized for fifteen
  days and going deeper than the sprint.
- **FR-010**: Both dated plans MUST draw on the expanded library rather than only on the original 93
  items, and MUST distribute their coverage across tracks in proportion to **interview weight** rather
  than to track size. Interview weight is how much of a real senior Android loop a track accounts for; it
  is deliberately not the track's size, because the two largest tracks by item count are not the two most
  asked about. It is fixed here so a plan can be judged rather than argued about:

  | Track | Interview weight |
  |---|---:|
  | Jetpack Compose | 14% |
  | Kotlin | 12% |
  | Coroutines & Flow | 12% |
  | Architecture & DI | 12% |
  | Platform & Framework | 10% |
  | Problem Solving | 8% |
  | Data, Networking & Persistence | 7% |
  | Performance & App Health | 7% |
  | Build, Tooling & Testing | 5% |
  | Security, KMP & Modern Android | 5% |
  | Mobile System Design | 5% |
  | Behavioral & Interview Craft | 3% |
  | Cheat Sheets | 0% |
  | **Total** | **100%** |

  Weight is measured as a track's share of a plan's **referenced item slots** — every entry in every
  task's `itemIds`, counted once per occurrence, because a deliberate second pass is scheduled work.
  Each track's share MUST fall within **±5 percentage points** of its weight, and every track carrying a
  non-zero weight MUST be represented by **at least one item** in each plan, so the tolerance can never
  silently drop a track. Cheat Sheets carry no weight: they are reference one-pagers a candidate consults,
  not material a plan schedules, and a plan MAY link them freely without it counting either way.
- **FR-011**: Free study MUST present no day-by-day schedule and MUST treat the entire library as the
  working set.
- **FR-012**: In free study, the candidate MUST still be offered a useful starting point on each visit —
  material due for review, unseen material, and where they are weakest — in place of a daily schedule.
- **FR-013**: A chosen mode MUST NOT restrict navigation: every item in the library MUST remain
  reachable through browsing, search, and drilling in all three modes.
- **FR-014**: Switching between modes MUST NOT alter ratings, drill schedule, notes, or mock history,
  and MUST NOT discard a started plan's position or completed-task marks.
- **FR-015**: Free study MUST be selectable without the candidate first starting or abandoning a dated
  plan, and MUST be the mode in force for any candidate who has not chosen one. A candidate MUST NOT be
  routed through a dated plan's curated subset by default, because a dated plan asserts a deadline the
  candidate has not stated. A candidate who has already started a dated plan MUST keep it, with their
  position and marks untouched.

#### Integrity and safety

- **FR-016**: Every item MUST carry an identifier that is unique across the entire library.
- **FR-017**: Identifiers already in use MUST NOT be reused, reassigned, or renumbered — including the
  seven identifiers claimed by the orphaned coroutines material.
- **FR-018**: The 93 existing items MUST remain in the library, keeping their identifiers. They MUST
  additionally be brought into compliance with FR-032. Measured on 2026-08-09 by the canonical counting
  method FR-032 requires, that is **70 items**: **46 question-and-answer answers exceed the 250-word
  band and MUST be trimmed into it** (7 of those also breach the 350-word ceiling), and **24 items carry
  no reference and MUST each be given one** — the 19 Problem Solving exercises and 5 Mobile System Design
  scenarios, which are the only items in the library with no source. No existing answer falls below the
  80-word floor, so no item needs filling out. Any item so changed, or otherwise deliberately corrected,
  MUST be marked as updated in the release that changed it. No existing item may be renumbered,
  retracked, or removed.

  A trim is a **removal of elaboration, never of substance**. Cutting an answer from 440 words to 250 is
  a large edit, so each trimmed item MUST still answer its own question completely enough to teach the
  point; MUST NOT lose a claim, caveat, or correction that changes whether the answer is right; MUST
  leave the spoken answer, traps, code, and follow-ups untouched, since the band governs the written
  answer alone; and MUST route any depth actually removed to the item's "more info" reference rather than
  simply dropping it. A trim that cannot meet this is a signal the item should be split, not squeezed.
- **FR-019**: Accepting the expansion MUST NOT alter any candidate's ratings, drill schedule, notes,
  mock results, or settings.
- **FR-020**: Re-authoring a plan MUST NOT leave a candidate's completed-task marks pointing at
  different material than they were earned on. Marks MUST follow the material: a hand-ticked task's
  mark MUST be carried across to the material that task covered in the outgoing plan, so it still
  reads as complete wherever that material now sits, and MUST NOT transfer to material the candidate
  never saw. A mark that cannot be carried across — because its task pointed at no specific material —
  MUST be cleared, and the clearing MUST be stated in the release summary before the candidate accepts.
  After this release, completion MUST be anchored to material rather than to schedule position, so
  later plan edits carry no such risk.
- **FR-021**: Every study plan task MUST resolve to material that exists in the library.
- **FR-022**: The library MUST pass its integrity check with zero errors before being offered to a
  candidate.
- **FR-033**: The whole expanded library MUST remain storable on the candidate's device and usable
  offline, within the storage a browser grants one site. Reducing the stored size to achieve this is in
  scope — today the same item is kept three times over in the stored copy, which alone would put the
  expanded library past the limit.
- **FR-034**: A failure to store the library or the candidate's learning state MUST be surfaced to the
  candidate, never silently swallowed, and MUST NOT leave the candidate believing that ratings, notes,
  or accepted releases were saved when they were not.

#### Sourcing and freshness

- **FR-023**: Every claim carrying a version number, date, or policy deadline MUST carry a source
  reference with the date it was verified. Because SC-009 measures this at 100%, what counts as such a
  claim MUST be decidable rather than a matter of taste. A claim qualifies when it states any of: a
  release or API version; a platform requirement level; a date or deadline, including a deprecation or
  compliance cut-off; that something is new, deprecated, removed, stable, or experimental; that a
  default, limit, or platform behaviour *currently* has some value. Statements of durable engineering
  reasoning — why a pattern works, what a trade-off costs — carry no such claim and need no dated source
  beyond the "more info" reference FR-032 already requires of every item.

  Those classes MUST additionally be reduced to a **version-claim screen** — a mechanical pass over each
  item's prose that flags the items likely to carry such a claim — so SC-009 can be measured over a named
  set rather than over "every claim" in the abstract. The screen MAY over-report, exactly as the
  near-duplicate screen may (FR-004); a human decides. What it MUST NOT do is under-report silently, so
  its patterns are kept deliberately broad and are recorded alongside the release.
- **FR-024**: Verification dates on new material MUST be the date the claim was actually checked, not
  copied from older material or defaulted. The date MUST fall within 30 days before the release that
  **ships** the item — the release that introduces it, or that updates it. A reference already older than
  that window when its item is about to ship MUST be re-verified and re-dated, or the item held back;
  items a release does not touch keep the dates they were shipped with.
- **FR-025**: Source references MUST point at primary documentation: material published by whoever owns
  the thing being described — the platform, language, library, or standard's own documentation, API
  reference, release notes, source repository, or official engineering blog. Tutorials, aggregators,
  question-and-answer sites, conference write-ups, model-generated summaries, and any source that is
  itself reporting on a primary source do not qualify, however accurate they are, because they carry no
  guarantee of being updated when the underlying fact changes.
- **FR-026**: Every source reference MUST resolve to a live page at the time of delivery.
- **FR-036**: The library's version-truth registry — the platform, language, and tooling versions
  surfaced to the candidate in the cheat sheets — MUST be re-verified at every release, and no item may
  assert a version fact that contradicts it. Where re-verification changes a cheat sheet's content, that
  sheet MUST be marked as updated in the release that changed it and its references re-dated under
  FR-024. This is the one thing about Cheat Sheets that this feature does change: they stay at five items
  and are not otherwise rewritten, but a stale version truth on a reference one-pager is exactly the kind
  of confident wrongness the library exists to prevent.

#### Delivery and disclosure

- **FR-027**: Each stage of the expansion MUST be published as a distinct release with a plain-language
  summary the candidate reads before deciding to accept it.
- **FR-028**: Every new item MUST be attributed to the release that introduced it, so it appears in
  What's New.
- **FR-029**: The library MUST be internally coherent after every stage — never partially registered,
  never containing material attributed to a release that does not exist.
- **FR-030**: A candidate MUST be able to see the full list of what is new, changed, and removed, and
  MUST be able to decline, before anything replaces the library they are studying from.
- **FR-031**: The plans MUST be re-authored only after all content stages have landed, so they are
  never written against material that does not yet exist.

### Key Entities

- **Study Item**: One question or exercise. Carries a permanent identifier, a track, a topic, a
  difficulty level (1 basics → 4 staff), a type, the question itself, a spoken-length answer, a
  written answer behind it — length-bounded for question-and-answer items (FR-032) — the traps that get
  candidates rejected, follow-ups, dated
  sources that double as the "more info" route to further depth, and the releases that introduced and
  last changed it. The identifier is the anchor a candidate's entire history hangs from.
- **Track**: A subject area (Kotlin, Compose, Platform, …) with a declared scope of subjects it must
  cover and a planned minimum size.
- **Content Pack**: A named bundle of items belonging to one track, which must be registered in the
  library registry to be visible.
- **Library Registry**: The authoritative list of what the library contains — its release marker, the
  current platform version truths surfaced in cheat sheets, the registered packs and study modes, and
  the release history.
- **Release**: A dated, versioned, summarised increment to the library. Candidates accept or decline
  releases; items are attributed to them.
- **Study Mode**: How a candidate is routed through the library — a dated plan with a day-by-day
  schedule, or free study with none. Three exist: 7-day sprint, 15-day deep plan, free study.
- **Plan Task**: One unit of work within a dated plan's day, pointing at specific items, which a
  candidate can complete. Its completion mark is part of the candidate's own state.
- **Progress Record**: A candidate's per-item learning state — rating history, scheduling interval, due
  date, notes — keyed by item identifier and owned entirely by the candidate.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The library contains at least 600 items across its 13 tracks, and every track meets or
  exceeds the planned minimum in FR-002.
- **SC-002**: A candidate can study any single drillable track for at least three hours without
  exhausting its unseen material. Measured at a stated working pace — **5 minutes** for a
  question-and-answer item (read it, answer aloud, check the traps and follow-ups), **20 minutes** for a
  Problem Solving exercise, **45 minutes** for a Mobile System Design scenario, **8 minutes** to draft
  and rehearse a Behavioral story. Against the FR-002 minimums the thinnest tracks clear it: 40 items ×
  5 min = 3h20m, Behavioral's 25 stories × 8 min = 3h20m, Mobile System Design's 19 scenarios = over 14
  hours. Cheat Sheets are reference one-pagers rather than drillable material and are excluded.
- **SC-003**: Zero duplicate identifiers exist library-wide, and zero previously published identifiers
  changed meaning.
- **SC-004**: 100% of a candidate's pre-existing learning state survives the expansion — measured by
  comparing a full progress export taken before and after — with the sole permitted exception of
  hand-ticks on plan tasks that point at no specific material, which may be cleared only where the
  candidate was told in advance. 0 hand-ticks end up attached to material the candidate never saw.
- **SC-005**: All three study modes are selectable, and each produces a non-empty, coherent experience
  on first open.
- **SC-006**: The 7-day sprint is completable within seven days and the 15-day plan within fifteen, at
  the daily study budget the plan itself declares (FR-008). Measured arithmetically, not by stopwatch:
  the summed working time of everything a plan schedules — at the SC-002 paces, counting every
  referenced item slot — is at or below `days × declaredDailyMinutes` for both plans, with 0 plans
  missing a declared budget.
- **SC-007**: Both dated plans draw at least 70% of their referenced material from items that did not
  exist before this expansion.
- **SC-008**: 100% of the library is reachable in every mode, and 100% of plan tasks resolve.
- **SC-009**: 100% of claims carrying a version, date, or deadline — as FR-023 defines them — carry a
  source reference verified within the 30 days before the release that ships the item, whether that
  release introduced it or updated it. Because "every claim" cannot be counted by reading alone, this is
  measured in three parts, all of which must hold: **(a)** every item a release ships carries at least
  one reference and every one of those references is dated inside the release's 30-day window — 0
  exceptions, mechanically checked; **(b)** the version-claim screen FR-023 defines runs over the whole
  library each release, and every item it flags is confirmed by the authoring review pass to carry a
  reference that actually sources the flagged claim; **(c)** the release author re-reads a sample of at
  least **10 flagged items** per release — or all of them, where a release flags fewer than 10 — finding
  0 whose reference fails to source its claim. A single
  failure in (c) means the whole flagged set for that release is re-reviewed before it ships.
- **SC-010**: 0 source references resolve to a missing page at delivery time.
- **SC-011**: The integrity check reports 0 errors.
- **SC-012**: Every added item is discoverable through both search and its track's listing, and appears
  in What's New attributed to its release.
- **SC-013**: A candidate can read what a release contains and decide whether to accept it in under two
  minutes.
- **SC-014**: Every drillable track offers at least 3 items at each of the four difficulty levels (at
  least 2 in Mobile System Design and Behavioral; Cheat Sheets exempt per FR-005), and the finished
  library's difficulty mix lands within ±5 percentage points of 10% basics / 30% mid / 45% senior / 15%
  staff — so roughly 250 of the 629 items sit at basics or mid and a candidate can start from the bottom
  in any track. Measured on 2026-08-09, no track currently spans all four levels and the library sits at
  6% / 30% / 54% / 10%, so this is a criterion the expansion must actively meet rather than preserve.
- **SC-015**: The complete library stores successfully on a standard browser with room to spare, and
  a candidate who goes offline after accepting it retains full access to every item; a device that
  cannot store it says so rather than failing quietly.
- **SC-016**: Measured across every question-and-answer item in the library, existing items included: at
  least 90% of written answers fall in the 120–250 word band, 0 exceed 350 words, and 0 fall below 80
  words. Cheat sheets, Problem Solving exercises, and Mobile System Design scenarios are outside this
  measurement, carrying no band under FR-032.
- **SC-017**: 100% of items carry at least one "more info" reference, and those references satisfy
  SC-010.
- **SC-018**: Every one of the 93 pre-existing items is still present under its original identifier,
  and each of the 70 changed to meet FR-018 is attributed to the release that changed it and appears in
  What's New as updated.
- **SC-019**: Every subject named in every track's frozen scope definition maps to at least one item,
  with 0 unmapped subjects — or, where a subject was deliberately dropped, a recorded reason (FR-003).
- **SC-020**: 0 near-duplicate pairs remain unadjudicated at delivery: every pair the release screen
  flags is differentiated, merged, or accepted with a recorded reason (FR-004).

## Decisions

- **DD-001 — Study plans: RESOLVED (2026-08-08).** Both dated plans are re-authored against the
  expanded library, and a third free-study mode is added. The dated plans remain deliberately curated
  subsets — their value is being *sufficient for their timeframe*, not being comprehensive — while free
  study is what makes the full 629 items usable for a candidate on any other schedule. This resolves
  what was raised as an open question during specification: the alternatives considered were leaving
  both plans untouched (rejected: strands ~85% of the new material behind no route) and re-authoring
  the 15-day plan only (rejected: leaves the 7-day sprint recommending an arbitrary older subset).
  Consequence: FR-007–FR-015 and FR-020 enter scope, and the plan work is sequenced after all content
  stages (FR-031).

## Assumptions

- **The original plan's per-track targets are the authority on "600".** The planned per-track minimums
  sum to 629 items, which satisfies and slightly exceeds the 600 the request names. The per-track table
  governs; 600 is the floor, not the ceiling.
- **The expansion is delivered in four staged content releases, then a fifth for the study modes.**
  Staging keeps each release summary readable, lets a candidate accept material as it becomes ready, and
  limits the damage if one stage has to be redone. Content groupings follow the original plan: language
  and UI foundations first, then platform and architecture, then build/testing and security/KMP, then
  problem solving, system design, and behavioral.
- **Remediation of the existing 93 items rides along with its own track's content stage.** An item is
  brought within the answer-length band, or given its "more info" source, in the same release that
  expands the track it belongs to, so each track lands complete and internally consistent in one step
  rather than in a separate cleanup pass at the end.
- **The orphaned coroutines material is adopted rather than discarded.** Identifiers are permanent by
  policy; the seven existing items are treated as already-authored and the remaining coroutines gap is
  authored around the identifiers they hold. This is cheaper and safer than renumbering, and is
  revisited only if that material fails review on its merits.
- **New material is authored at senior depth by default**, matching the existing library's centre of
  gravity and each track's declared scope — but "by default" means the plurality, not the whole: the
  target mix in FR-005 governs, and roughly two items in five are authored at basics or mid.
- **Free study is a third selection alongside the two plans, not a separate destination.** A candidate
  chooses it where they already choose between the sprint and the deep plan.
- **Cheat Sheets stay at their current size.** They are reference one-pagers, not drillable items, and
  the plan does not grow them. Their version-truth content is re-verified at every release under FR-036,
  which is the only change they take; they are exempt from the answer-length band (FR-032), from the
  four-level span (FR-005), and from the three-hour study depth criterion (SC-002), all because they are
  reference material rather than questions.
- **The interview-weight table in FR-010 is an editorial judgement, not a measurement.** It was authored
  on 2026-08-09 to make FR-010 checkable, because "in proportion to interview weight" had no referent and
  a plan could therefore not be judged against it at all. The figures reflect what a senior Android loop
  actually spends its time on — UI, language, concurrency and architecture carry over half between them,
  and behavioral craft is small per plan slot but disproportionately decisive. If they are wrong, the
  table is the thing to revise; FR-010's *shape* — weight, not track size, with a stated tolerance — is
  what the requirement is really asserting, and that stands either way.
- **The study paces behind SC-002 are estimates, not measurements.** Five minutes for a Q&A item, twenty
  for a Problem Solving exercise, forty-five for a design scenario, eight to rehearse a behavioral story.
  They are stated so the criterion is checkable at all; if they are wrong, the per-track minimums in
  FR-002 — not the criterion — are what should be revisited, since the minimums came from the original
  plan and SC-002 is derived from them.
- **Each track's scope definition is frozen when that track's stage begins.** FR-003 measures coverage
  against a fixed list; a definition that keeps moving cannot be a coverage target. Refinements found
  while authoring are recorded against the next stage rather than applied retroactively to a track
  already delivered.
- **Level assignment is an editorial judgement bounded by a rubric, not a measurement.** FR-035 makes the
  four levels decidable enough to review and to argue about; it does not make them automatable. The
  distribution in FR-005 is the machine-checkable part, and it is only meaningful if the rubric is
  applied honestly — which is why FR-035 requires the lowest defensible level rather than the flattering
  one.
- **Product behaviour changes are limited to what the three study modes and safe storage require.**
  Adding free study, anchoring plan completion to material rather than schedule position, storing the
  library compactly enough to fit the device, and reporting a storage failure instead of hiding it are
  all in scope. The drill scheduling algorithm and the progress model are otherwise used as they are,
  and the update mechanism changes only in how much it stores and how it reports failure — not in how
  it diffs, discloses, or applies a release. Any further shortcoming the expansion reveals — for
  example a daily review queue that feels unmanageable at 629 items — is recorded as a follow-up rather
  than fixed here.
- **The existing authoring, registration, and validation tooling is a dependency**, including the
  per-track scope definitions and gap table that already encode the original plan.
- **Content is written offline against primary documentation** current as of the release date, with the
  platform version truths of August 2026 as the baseline.

### Out of Scope

- Rewriting or rebalancing the existing 93 items beyond what FR-018 requires — trimming the 46
  over-band question-and-answer answers, giving the 24 unsourced items a "more info" source, and
  correcting outright errors found along the way. Their questions, tracks, levels, and identifiers stay as they are.
- Growing the Cheat Sheets track.
- Adding study modes beyond the three named here, or per-candidate custom plan building.
- Changing the drill scheduling algorithm, or changing how the update mechanism diffs, discloses, and
  applies a release. How much it stores and how it reports a storage failure are in scope (FR-033,
  FR-034); nothing else about it is.
- Translating or localising content.
- Adding new tracks beyond the 13 that exist.

### Dependencies

- The per-track scope definitions and gap table from the original plan, which specify exactly what each
  track must cover and where its identifier numbering resumes. These scope definitions are the authority
  FR-003 measures coverage against; each is frozen and recorded before its track is authored.
- A near-duplicate screen over the whole library, run per release, whose flagged pairs a human
  adjudicates (FR-004, SC-020). It may over-report; it must not be the decider.
- Access to primary platform, language, and library documentation for verification.
- The library's integrity check and registration tooling.
- Completion of all four content stages before the study modes can be authored (FR-031).
