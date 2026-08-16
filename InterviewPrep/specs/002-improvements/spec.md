# Feature Specification: Improvements

**Feature Branch**: `002-improvements`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "now for new spec called ( Improvements ) and need to do the following: 1) the search text box in topics is not working smoothly, it takes letter by letter, this needs to be fixed. 2) DSA instead of having a draft notes window, this should be a small compiler or integration with a free compiler with a run button and showing error and success. 3) using simpler english if possible for all 629 questions. 4) the feedback below each and every question needs to just be mark as complete to follow up with the progress, no more actions needed. 5) update button is not needed, the syncing needs to be automatic based on the content and content indexing. 6) in drill or mock or anywhere that shows a timer, the timer should count only when the question is visible, but once the answer is revealed the timer is paused until the next question appears. 7) what's new tab is not needed. 8) system design questions need to revise the content — the screen flow itself is not right; it should be like the interviewee asks the interviewers some questions to gather all the info he needs, then he would be able to tell the whole plan — take another look at the design system section as a whole, may check online for solid valid examples. 9) staff/monster is just not right, use lead. 10) the update label is not needed after the auto sync. 11) site is taking too much time to load at the start, try to segment the load and add a loading indicator if needed, since it's now on GH Pages."

## Clarifications

### Session 2026-08-14

- Q: The spec's automatic-sync story (US3) requires silent, buttonless, confirmation-free content
  updates, but the project constitution's Principle III ("A Release Is Offered, Never Imposed")
  requires a candidate be able to see what's arriving and decline it before it applies — how should
  this conflict be resolved? → A: Silent auto-apply, no confirmation step of any kind (matches US3
  literally). The project constitution's Principle III is formally amended, as part of this
  feature's planning work, to permit unconfirmed automatic releases when the release is
  non-destructive to learning state (i.e., ticks are re-anchored, never dropped, per Principle II
  and the existing `migrateTicks()` guarantee) — the amendment is a prerequisite deliverable of the
  plan for User Story 3, not an incidental side effect.
- Q: None of the ~629 items carry test-case data (input/expected-output pairs) today — only a
  prompt, hints, and a reference solution — so what determines DSA Run pass/fail? → A:
  Execute-and-display only, no automated grading. Run compiles and executes the candidate's code
  and shows the real output, or a compile/runtime error message, on the same page; there is no
  `tests` field, no hidden test cases, and no automated correctness verdict — the candidate judges
  correctness by comparing the shown output against the prompt themselves, exactly as they would
  running the code locally.
- Q: SC-001/SC-002 use qualitative language ("a fraction of a second", "well before the full
  content set has finished loading") — should these be pinned to concrete numeric targets? → A:
  Yes. Search/filter results settle within 300ms of the candidate pausing (no re-query while
  actively typing); on a cold cache, the app shell (navigation + dashboard skeleton) is interactive
  within 1 second, well before all content packs finish fetching.
- Q: DSA starter code is a bare function stub with no `main()`, so running it as-is would compile
  but print nothing — what should actually execute on "Run"? → A: Auto-wrap with a generated
  driver. The system calls the candidate's function with an authored sample input and prints the
  result; every DSA item's content gets a new sample-input field authored as part of this feature
  (batched per pack, validated like the plain-English rewrite), so Run is useful the first time,
  with no candidate-authored `main()` required.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Type-ahead search that keeps up with typing (Priority: P1)

A candidate opens the search overlay (or the Topics keyword filter) and types a question, tag, or
topic name at normal typing speed. Results update smoothly as they type, without visible lag,
dropped keystrokes, or the input appearing to "catch up" one letter behind.

**Why this priority**: Search is used at the start of nearly every study session to jump to a
topic; a laggy input is the single most visible daily annoyance and erodes trust in the rest of
the site.

**Independent Test**: Open the search overlay, type a 10+ character query quickly, and confirm the
input box shows every character immediately and the result list settles within a fraction of a
second of the user pausing — independent of any other change in this spec.

**Acceptance Scenarios**:

1. **Given** the search overlay is open, **When** the user types quickly, **Then** every keystroke
   appears in the input immediately (no visible input lag), and matching results appear within
   300ms of the user pausing, without re-querying on every single keystroke while still typing.
2. **Given** the Topics view keyword filter, **When** the user types a partial word, **Then** the
   item list narrows to matches without the page stuttering or the input losing focus/characters.
3. **Given** a query that matches nothing, **When** results are shown, **Then** a clear "no
   matches" state is displayed instead of an empty flash or stale results.

---

### User Story 2 - Fast, visibly-loading first launch (Priority: P1)

A candidate opens the site (hosted on GH Pages) for the first time or after a cache clear. The
page shows a clear loading indicator immediately and becomes interactive well before every last
byte of content has arrived, instead of presenting a blank screen while all content packs load at
once.

**Why this priority**: First-load time directly affects whether a candidate keeps using the site;
this is the first impression on every fresh device and after every deploy.

**Independent Test**: Load the site fresh (empty cache) and confirm a loading indicator appears
within a fraction of a second, the shell/navigation becomes usable (interactive within 1 second)
before the full content set has finished loading, and total time-to-interactive is measurably
lower than loading everything up front.

**Acceptance Scenarios**:

1. **Given** a first-time visit with an empty cache, **When** the page starts loading, **Then** a
   visible loading indicator appears immediately (no blank white screen).
2. **Given** the app shell has loaded, **When** content packs are still being fetched in the
   background, **Then** the user can already see navigation and the dashboard skeleton — interactive
   within 1 second of first paint — rather than waiting for every pack.
3. **Given** a returning visitor with a warm cache, **When** they open the site, **Then** load
   feels instant (cached snapshot renders immediately, matching current offline-first behavior).

---

### User Story 3 - Fully automatic content sync, no manual buttons (Priority: P1)

A candidate never has to notice or press an "Update" button, see an "Up to date" / "Update
available" label, or visit a "What's New" tab. New content becomes visible automatically, based on
comparing the on-disk content index against what the candidate's device already has, the next time
they open or are already using the site.

**Why this priority**: Removes recurring UI clutter (three related surfaces: the Update button,
its label, and the What's New tab) and replaces a manual chore with a background behavior — a
simplification that touches the app shell every session.

**Independent Test**: Publish a new content release, then open the site on a device with an older
cached snapshot and confirm the newer content appears without the user pressing anything, and that
no "Update" button, status label, or "What's New" nav item is present anywhere in the UI.

**Acceptance Scenarios**:

1. **Given** the on-disk content index is newer than the device's stored snapshot, **When** the
   candidate opens or is already using the site, **Then** the newer content set is fetched and
   applied automatically, without requiring a button press.
2. **Given** an automatic sync would clear plan progress ticks (because the plan's underlying
   material changed), **When** the sync runs, **Then** the candidate's per-item progress is
   preserved exactly as it is today (re-anchored, never silently dropped) even though there is no
   manual confirmation step to warn them first.
3. **Given** the top navigation bar, **When** the user looks for an Update button, an "Up to
   date"/"Update available" label, or a "What's New" tab, **Then** none of them exist; navigation
   contains only actively-used views.
4. **Given** the device is offline when a sync would otherwise run, **When** connectivity returns,
   **Then** the sync completes automatically at that point without any user action.

---

### User Story 4 - One-tap progress marking (Priority: P2)

While reviewing a question's answer, a candidate taps a single "Mark complete" action instead of
choosing among several graded options. That single action is enough to advance the item's place in
future study queues — no further decision is required from the candidate.

**Why this priority**: P2, not P1, because nothing is broken today — the graded choice works, it is
just more decision than the candidate needs. P2, not P3, because it touches every study surface on
every session, so the friction compounds far faster than any P3 item's does.

**Independent Test**: Open any question's answer, confirm only one action ("Mark complete") is
presented, tap it, and confirm the item's status indicator updates and the item is scheduled as
"reviewed" in the study queue — verifiable without any other change in this spec.

**Acceptance Scenarios**:

1. **Given** a question's answer is revealed, **When** the candidate looks at the feedback area,
   **Then** they see exactly one action ("Mark complete") and no graded choices (no
   Again/Hard/Good/Easy buttons).
2. **Given** the candidate taps "Mark complete", **Then** the item is recorded as reviewed, its
   status dot updates, and it moves through the existing spaced-repetition queue exactly as if a
   consistent, always-the-same grade had been given — Drill ordering and mastery percentages keep
   working unchanged.
3. **Given** an item the candidate has never opened, **When** they view its dashboard status,
   **Then** it still shows as "new"/unseen until "Mark complete" is tapped at least once.

---

### User Story 5 - Timer only runs while the question is visible (Priority: P2)

During a Drill or Mock session, the on-screen timer counts up/down only while the candidate is
looking at the question itself. The instant the answer is revealed, the timer freezes; it resumes
only once the next question appears.

**Why this priority**: Timed practice is meant to measure thinking time, not reading time; a timer
that keeps running while the answer is on screen produces misleading practice data and mock
results.

**Independent Test**: Start a Drill or Mock session, let the timer run for a few seconds, reveal
the answer, wait several seconds, and confirm the displayed time did not advance during that wait;
advancing to the next question resumes the count.

**Acceptance Scenarios**:

1. **Given** a Drill or Mock question is on screen with its timer running, **When** the candidate
   reveals the answer, **Then** the timer stops advancing immediately and stays frozen at that
   value.
2. **Given** the timer is paused after an answer reveal, **When** the candidate advances to the
   next question, **Then** the timer resumes counting for that new question.
3. **Given** a Mock session with an overall session time budget, **When** any individual answer is
   revealed, **Then** only the per-question timer pauses; the total session clock/deadline is
   unaffected. *(see Assumptions)*

---

### User Story 6 - Runnable code for DSA problems (Priority: P3)

Instead of a plain scratch/notes text area, a DSA problem page gives the candidate a code editor
with a "Run" button. Running the code compiles and executes it, using an online code-execution
service while the candidate is connected, and shows the real output or a clear compile/runtime
error — there is no automated pass/fail grading, since no item carries test-case data; the
candidate judges correctness by comparing the output to the prompt themselves. The rest of the
site (browsing, reading, progress tracking) keeps working fully offline exactly as today.

**Why this priority**: Turns passive note-taking into active practice with real feedback, which is
the single biggest functional upgrade in this request — but it is scoped last because it is the
largest, most novel piece of work and introduces the app's first-ever network dependency.

**Independent Test**: Open any DSA problem while online, write a solution, press "Run", and
confirm the real program output (or a readable compile/runtime error) appears without leaving the
page; then go offline and confirm the rest of the site (Topics, Drill, Mock, cheat sheets) is
entirely unaffected and the Run button clearly communicates it needs a connection.

**Acceptance Scenarios**:

1. **Given** a DSA problem detail page, **When** the candidate opens it, **Then** they see a code
   editor pre-filled with any starter code (replacing the current plain notes/scratch area) rather
   than a plain notes/scratch area.
2. **Given** the candidate has written or edited code, **When** they press "Run" while online,
   **Then** the candidate's function is invoked with the item's authored sample input via a
   generated driver, and the real program output is shown, or — if it fails to compile or run — a
   readable compile/runtime error message is shown in its place; there is no automated "tests
   passed/failed" verdict, since no item carries hidden test cases.
3. **Given** the candidate is offline or the run request fails, **When** they press "Run", **Then**
   a clear "Run needs a connection" (or equivalent failure) message is shown instead of a silent
   failure or an indefinite spinner, and the editor's contents are not lost.
4. **Given** the candidate has written code in the editor, **When** they navigate away and return,
   **Then** their in-progress code is still there (same persistence guarantee the notes area gives
   today).
5. **Given** the candidate is entirely offline, **When** they use any other part of the site,
   **Then** nothing outside the DSA Run action is affected — no new blocking network calls are
   introduced elsewhere.

---

### User Story 7 - Plainer English in question summaries (Priority: P3)

Across the ~629 questions, the short, spoken-aloud summary that appears with each question uses
simpler wording and shorter sentences wherever that's possible without losing technical accuracy,
so a candidate can quickly grasp the gist even under interview-style time pressure.

**Why this priority**: Improves comprehension speed across the whole library, but is a large,
purely content-side effort that can proceed independently, in batches, without touching any app
code.

**Independent Test**: Open a sample of rewritten items across different tracks, and confirm the
short summary reads in plain, direct language while `node tools/validate.mjs` still exits 0 for
each batch, and the deeper `answer`/`traps` fields are unchanged.

**Acceptance Scenarios**:

1. **Given** an item that has been rewritten, **When** the candidate reads its short summary,
   **Then** it uses plain, direct wording and short sentences while still being technically
   correct and matching what the deeper `answer` field explains.
2. **Given** an item's deeper `answer`, `traps`, and other fields, **When** the short summary is
   rewritten, **Then** those other fields are left untouched — the rewrite is scoped to the short
   summary only.
3. **Given** a batch of rewritten items, **When** the batch is committed, **Then**
   `node tools/validate.mjs` exits 0 for that batch before moving to the next track.
4. **Given** the full rewrite effort, **When** it is complete, **Then** all ~629 questions have a
   plain-English short summary (tracked to completion across tracks/batches, not required to land
   as a single change).

---

### User Story 8 - Clarify-then-present system design flow (Priority: P3)

A candidate opens a system design scenario and is guided through the flow real interviews use:
first gather requirements by asking the interviewer clarifying questions (functional needs, scale,
constraints), and only after that present the end-to-end plan — instead of the current flow, which
does not reflect this order.

**Why this priority**: This is a content-and-structure overhaul of an entire track, not a small
fix; it depends on the other UI changes landing cleanly first and needs a careful pass on both
example content and screen sequencing.

**Independent Test**: Open a system design scenario and confirm the candidate is first prompted to
choose/ask clarifying questions before any solution content is shown, and that a full plan is only
revealed after that clarifying step, matching the structure of real system-design interviews.

**Acceptance Scenarios**:

1. **Given** a system design scenario is opened, **When** the candidate begins, **Then** they are
   first presented with a step to gather requirements (asking/selecting clarifying questions about
   functional scope, scale, and constraints) before any proposed solution is visible.
2. **Given** the candidate has gone through the clarifying step, **When** they choose to proceed,
   **Then** the full end-to-end plan (architecture, trade-offs, deep dive) is revealed as a
   distinct next step, not shown all at once with the clarifying questions.
3. **Given** the reusable "framework" item that anchors this track, **When** it is revised,
   **Then** it documents this clarify-first structure so every scenario item follows the same
   sequence.
4. **Given** the full set of system design scenarios, **When** they are reviewed against the new
   structure, **Then** each one's content and screen flow follows the revised clarify-then-plan
   sequence.

---

### User Story 9 - Correct top-level naming ("Lead" instead of "Staff/Monster") (Priority: P2)

Anywhere the site currently labels the highest difficulty/seniority level "Staff/Monster", it
instead reads "Lead", consistently across chips, filters, and any other place the label is shown.

**Why this priority**: P2, not P1, because a wrong label misleads but blocks nothing — no candidate
is prevented from studying by it. P2, not P3, because it is a one-line change with no dependency on
any other story, so deferring it past the P3 content efforts would delay a correct label behind
weeks of unrelated authoring for no reason.

**Independent Test**: Search the rendered UI for any occurrence of "Staff/Monster" or "Monster" and
confirm none remain; confirm "Lead" appears wherever the top difficulty level is shown (chips,
filter dropdowns, cheat sheets, etc.).

**Acceptance Scenarios**:

1. **Given** any item, filter, or chip at the top difficulty level, **When** its label is
   displayed, **Then** it reads "Lead" and never "Staff/Monster" or "Monster".
2. **Given** existing stored progress/plan data keyed by level number, **When** the label changes,
   **Then** no progress, filters, or plans are disrupted — only the displayed text changes.

---

### Edge Cases

- What happens when the search overlay query is cleared entirely mid-typing? Results should return
  to the empty/prompt state without a stale flash of the previous results.
- What happens when a candidate presses "Mark complete" more than once on the same item? It must
  not corrupt scheduling state. Each tap advances the item through the spaced-repetition curve
  exactly as an extra tap of "Good" would today — the scheduling math has never distinguished a
  first rating from a re-rating — so this is existing, accepted behavior rather than a new risk
  this feature introduces; no additional guard against repeated taps is required.
- What happens when a timer-paused Drill/Mock question is left open (answer revealed) for a very
  long time before advancing? The timer stays frozen indefinitely; it must not silently resume,
  overflow, or drift.
- What happens when the DSA "Run" action is triggered while a previous run for the same problem is
  still in flight? The prior run is superseded/cancelled cleanly rather than both results racing to
  display.
- What happens when the automatic content sync would need to run while the candidate is mid-way
  through a Drill/Mock session? The sync must not swap content out from under an in-progress
  session; it applies at a safe point (e.g., session start or next navigation).
- What happens when the on-disk content index has not changed since the candidate's last visit?
  No sync/network activity should occur — the "content indexing" comparison must be cheap and not
  refetch everything on every load.
- What happens on a first-ever visit with no stored snapshot at all? The loading indicator and
  segmented load apply the same way; there is no "old content" to compare against.

## Requirements *(mandatory)*

### Functional Requirements

**Search**

- **FR-001**: The search overlay and the Topics keyword filter MUST reflect every keystroke in the
  input field immediately, with no perceptible input lag, regardless of how fast the candidate
  types.
- **FR-002**: The system MUST avoid re-running the full search/filter computation on every single
  keystroke while the candidate is still actively typing; it MUST settle on a result set within
  300ms of the candidate pausing.
- **FR-003**: An empty or no-match query MUST show an explicit state ("type to search" / "no
  matches") rather than a stale or blank result list.

**Startup performance**

- **FR-004**: The site MUST display a visible loading indicator immediately on first paint,
  before content packs have finished loading.
- **FR-005**: The system MUST make the app shell (navigation, dashboard skeleton) usable — within 1
  second of first paint on a cold cache — before every content pack has finished fetching, rather
  than blocking on the full content set.
- **FR-005a**: During the shell phase (cold cache, before content packs resolve), the dashboard
  skeleton MUST render its real navigation chrome and section structure, and MUST show a neutral
  placeholder (e.g. "—") for every count, percentage, or list derived from content that has not
  arrived yet. It MUST NOT display a zero, an empty list, or a "0%" that a candidate could mistake
  for a real, settled value. When the content phase resolves, these placeholders are replaced with
  real values in place, without a full-page flash or a navigation reset.
- **FR-005b**: The 1-second target in FR-005 is calibrated against the reference environment named
  in the plan (an evergreen desktop browser on a broadband connection). On slower devices or
  connections the absolute time MAY exceed 1 second; what MUST hold unconditionally, at any speed,
  is the *ordering* guarantee — the shell renders and becomes interactive without waiting on any
  content pack fetch. A slow device degrades the number, never the ordering.
- **FR-006**: A returning visitor with a previously stored snapshot MUST see the app render from
  that snapshot immediately, without waiting on any network activity (preserving current
  offline-first behavior).

**Automatic sync**

- **FR-007**: The system MUST compare the on-disk content index against the device's stored
  snapshot automatically (without a manual user action) and fetch and apply newer content when a
  difference is found.
- **FR-007a**: An automatic sync MUST be all-or-nothing. If any part of fetching the new content set
  fails (the index is retrieved but one or more packs or plans fail to load), the system MUST
  abandon that sync attempt entirely: the stored snapshot is left exactly as it was, no tick
  migration runs, no partial content is persisted, and no post-apply notice (FR-010a) is shown. The
  attempt is retried at the next natural trigger, with no user action required. A failed sync MUST
  NOT be surfaced as an error the candidate has to acknowledge — a device that never successfully
  syncs simply keeps working offline on its existing snapshot, which is the current behavior.
- **FR-008**: The manual "Update"/"Up to date"/"Update available" button and label MUST be removed
  from the UI entirely; there is no user-facing control that manually triggers a sync.
- **FR-009**: The "What's New" tab/view MUST be removed from navigation and routing entirely.
- **FR-010**: When an automatic sync would clear or re-anchor plan progress ticks, the system MUST
  still preserve/re-anchor per-item progress exactly as the current manual update flow does today —
  automating the trigger MUST NOT remove the progress-preservation guarantee.
- **FR-010a**: When an automatic sync applies a diff, the system MUST show a non-blocking notice
  naming what changed (e.g., counts of new/updated/removed items and any plan ticks re-anchored)
  after the swap completes. This notice is informational only, not a consent gate — it is the
  disclosure the constitution's Principle III amendment requires in place of the removed confirm
  modal.
- **FR-010b**: An automatic sync's found diff MUST NOT be applied while the candidate is mid-way
  through a Drill or Mock session; applying it is deferred until the session ends or the candidate
  navigates away. The cheap version-compare check itself may still run at any time.
- **FR-011**: The system MUST NOT perform a full re-fetch/re-comparison when the on-disk content
  index is unchanged since the last check.

**Progress feedback**

- **FR-012**: Every question's feedback area MUST present a single "Mark complete" action in place
  of the current graded choices (Again/Hard/Good/Easy).
- **FR-013**: Tapping "Mark complete" MUST record the item as reviewed and advance it through the
  existing spaced-repetition scheduling using one consistent, fixed outcome — Drill queue ordering
  and mastery-percentage calculations MUST continue to work unchanged.
- **FR-014**: This single-action feedback MUST apply everywhere a question's answer is reviewed
  (Topics/item detail, Drill, Mock review), not only in one view. **Behavior** MUST be identical
  across all three surfaces — the same single action, recording the same outcome, with the same
  effect on scheduling — so a candidate never has to learn a per-view variant. **Presentation** need
  not be pixel-identical: each view may place, size, and label the action to fit its own layout
  (Drill's card, Mock's review row, the item detail page), and doing so is not a deviation from this
  requirement.
- **FR-014a**: Mock's session summary MUST report a completion count/percentage of items marked
  complete in place of the retired self-graded average score.
- **FR-014b**: Mock sessions the candidate completed *before* this change carry only the old
  self-graded score. Those historical rows MUST continue to display in the mock history list and
  trend view rather than disappearing or rendering blank — past results are a record the candidate
  earned, and this feature must not erase them. They are shown as-is, labelled so the older metric
  is not confused with the new one; they are NOT rewritten or back-filled into the new shape, since
  no completion data exists for them to be derived from.

**Timers**

- **FR-015**: Any on-screen timer in Drill or Mock MUST count only while the current question's
  answer is hidden (question visible, answer not yet revealed).
- **FR-016**: Revealing an answer MUST immediately pause that question's timer; the timer MUST
  remain frozen until the next question is displayed, at which point it resumes counting.
- **FR-017**: In Mock sessions, pausing a per-question timer on answer-reveal MUST NOT pause or
  otherwise alter the overall session time budget/deadline.

**DSA runnable code**

- **FR-018**: Each DSA problem's detail page MUST present a code editor (pre-filled with starter
  code where available) with a "Run" button, replacing the current plain scratch/notes text area.
- **FR-018a**: The system MUST NOT embed or ship a shared/default code-execution API key anywhere
  in the app's source. The candidate supplies their own key, entered into a Settings field, stored
  client-side, and transmitted only as part of the candidate's own Run requests — never logged and
  never sent anywhere else.
- **FR-019**: Pressing "Run" while online MUST execute the candidate's code via an online
  code-execution integration and display the real program output on success, or a readable
  compile-error/runtime-error message on failure, on the same page. There is no automated
  correctness verdict ("tests passed/failed") — no item carries hidden test-case data, so the
  candidate compares the shown output to the prompt themselves.
- **FR-019a**: The system MUST invoke the candidate's function via a generated driver (a `main()`
  that calls the function with the item's authored sample input and prints the result) rather than
  executing the bare function stub as-is, so Run produces real output without requiring the
  candidate to write their own `main()`.
- **FR-019b**: Every DSA item MUST carry an authored sample input (used by the generated driver),
  added in batches per pack with `node tools/validate.mjs` passing after each batch, the same way
  the plain-English short-summary rewrite (FR-025) proceeds.
- **FR-019c**: Because FR-019b's authoring lands in batches, the system MUST define a fallback for a
  DSA item whose sample input has not yet been authored: Run is offered in a disabled state with a
  short explanation that this problem is not runnable yet, and no execution request is sent. A
  missing sample input MUST NOT produce an error state, a failed run, or a request built from an
  empty driver. Whether every DSA item has a sample input before the Run UI ships is a rollout
  choice, not a precondition this requirement depends on.
- **FR-020**: Pressing "Run" without a configured API key, while offline, or when the execution
  request fails, MUST show a clear, distinct message for each case — "needs setup" for a missing
  key, "needs a connection" for offline or a failed/timed-out request — instead of a silent failure
  or indefinite spinner, and MUST NOT lose the candidate's in-editor code.
- **FR-020a**: Pressing "Run" again while a previous run for the same problem is still in flight
  MUST abort the previous request cleanly; only the newest run's result is ever shown, never both
  racing to display.
- **FR-020b**: While a Run request is in flight, the system MUST show an explicit pending state that
  is visually distinct from both an idle result panel and a completed result — the Run action
  indicates it is working, and the result area indicates a run is under way rather than appearing
  empty or still showing the previous run's output.
- **FR-020c**: A Run request MUST time out after 30 seconds and surface FR-020's "needs a
  connection" state at that point. The bound is deliberately generous — compiling and running a
  JVM-family language is not instant — but it is fixed and finite: no Run may spin indefinitely.
- **FR-021**: The candidate's in-progress code per DSA problem MUST persist across navigation, at
  least matching the persistence the current scratch/notes area provides.
- **FR-022**: No part of the site other than the DSA "Run" action may introduce a required network
  call — browsing, reading, and progress tracking remain fully usable offline exactly as today.
- **FR-022a**: The Run feature depends on a third-party execution service being reachable directly
  from the candidate's browser, which is an unverified assumption until tested (see Assumptions). If
  that direct browser-to-service call proves impossible, the required response is to drop User Story
  6 from this release and keep the existing notes area — NOT to introduce a proxy, backend, or any
  other intermediary the site would have to host. Every other user story in this spec MUST remain
  independently deliverable if User Story 6 is dropped this way.

**Content simplification**

- **FR-023**: The short, spoken-aloud summary field on every question MUST be reviewed and, where
  it can be simplified without losing technical accuracy, rewritten in plainer English with
  shorter sentences.
- **FR-024**: The rewrite MUST be scoped to the short-summary field only; the deeper explanation,
  traps, and other prose fields are left unchanged by this effort.
- **FR-025**: The rewrite MUST proceed in batches (e.g., per track/pack) with
  `node tools/validate.mjs` passing after each batch, rather than as one unreviewed bulk edit.
- **FR-025a**: Because no automated check can tell whether a rewritten short summary still matches
  the deeper explanation it summarizes, each batch's definition of done MUST include an explicit
  human read-through — performed by whoever authored that batch, before it is committed — comparing
  every rewritten short summary against that same item's deeper explanation and traps. This is a
  named, non-optional step in the batch gate, not a reviewer's discretionary spot-check; the
  validator's exit code alone never certifies a batch.
- **FR-026**: Every one of the ~629 questions MUST end up with a plain-English short summary by
  the time this effort is complete.

**System design flow**

- **FR-027**: Every system design scenario MUST open with a step that has the candidate gather
  requirements (functional scope, scale, constraints) before any solution content is shown.
- **FR-027a**: The clarifying step's content MUST be an ordered list of question strings, with no
  authored answer attached to any question. The candidate marks which questions they would ask; the
  system MUST NOT present a per-question answer, a multiple-choice selection among candidate
  answers, or a free-text input. This is the structural shape the whole track is authored against —
  see Assumptions for why it was chosen over an answer-carrying shape.
- **FR-027b**: Every system design item, including the framework reference item, MUST carry at
  least three clarifying questions. There is no exemption: a scenario that cannot yield three
  genuine clarifying questions is treated as an underspecified scenario to be expanded, not as a
  scenario excused from FR-027. Conformance with the clarify-then-plan structure is 100% across the
  track, with no per-scenario opt-out.
- **FR-028**: The full solution plan (architecture, trade-offs, deep dive) MUST be presented as a
  distinct step that follows the requirements-gathering step, not shown simultaneously with it.
- **FR-029**: The shared "framework" reference item for this track MUST be revised to document
  this clarify-then-plan structure so it is the template every scenario follows.
- **FR-030**: Every existing system design scenario's content MUST be reviewed and updated to match
  the revised clarify-then-plan structure and sequencing. This requirement is scoped to
  **structure**: splitting clarify-flavored bullets out of the existing requirements list into the
  new clarifying-questions list, and correcting any pointer text that references the framework's old
  shape. It does NOT authorize a general prose rewrite of scenario content — the only prose-quality
  rewrite in this feature is the short-summary effort (FR-023/FR-024), which is scoped to that field
  alone and applies to system design items exactly as it applies to every other track.

**Naming**

- **FR-031**: Every user-facing occurrence of the top difficulty/seniority level's label MUST read
  "Lead"; no occurrence of "Staff/Monster" or "Monster" may remain anywhere in the rendered UI.
- **FR-032**: Changing this label MUST NOT alter the underlying level number, stored progress, plan
  data, or filtering behavior — only the displayed text changes.

### Key Entities

- **Search Index**: The in-memory index built from the content snapshot that the search overlay
  and Topics filter both query; unchanged in shape, only in how often/when it's queried per
  keystroke.
- **Content Sync State**: The comparison between the on-disk content index and the device's stored
  snapshot version, and the automatic trigger that decides when to fetch and apply an update; no
  longer surfaced as a manual button/label.
- **Progress Record**: Per-item learning state (status, next-due scheduling data, review history),
  now driven by a single "mark complete" action instead of a graded choice, but structurally
  unchanged.
- **Timer Session**: Per-question elapsed time state within a Drill or Mock session, now with an
  explicit paused/running phase tied to whether the answer is revealed, plus (for Mock) the
  separate overall session deadline it must not interfere with.
- **DSA Run Result**: The outcome of executing a candidate's code for a problem — real program
  output on success, or a readable compile/runtime error message on failure — surfaced inline on
  the problem page. No pass/fail verdict against test cases, since none exist in the content
  model.
- **DSA Sample Input**: A new per-item content field holding the authored input(s) the generated
  driver passes to the candidate's function on Run; added to every DSA item alongside the existing
  `starter` field, authored in batches gated by `node tools/validate.mjs`.
- **System Design Session**: The two-step structure for a design scenario — a requirements-
  gathering step followed by a plan-presentation step — replacing the current single-flow content.
- **Level Label**: The display string shown for each of the four difficulty levels; only the
  top level's text changes ("Lead"), the underlying numeric level (1–4) is untouched.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Candidates typing in the search overlay or Topics filter see no dropped or delayed
  characters at normal typing speed, and results settle within 300ms of pausing.
- **SC-002**: A first-time visit shows a loading indicator immediately and the app shell becomes
  navigable within 1 second of first paint, well before the full content set has finished loading;
  a returning visit with a warm cache still feels instant.
- **SC-003**: No candidate ever needs to press a button to receive new content, and zero UI
  surfaces reference "Update", "Up to date", or "What's New".
- **SC-004**: Marking a question reviewed takes exactly one tap across every study surface, down
  from choosing among four options today.
- **SC-005**: In a timed Drill or Mock session, no time accrues while an answer is on screen; only
  active-thinking time is measured.
- **SC-006**: A candidate can write, run, and see the real output or a clear error result for a
  DSA solution without leaving the problem page, while the rest of the site remains fully usable
  with no network connection at all.
- **SC-007**: All ~629 questions have a plain-English short summary, verified in batches with
  `node tools/validate.mjs` passing throughout.
- **SC-008**: Every system design scenario follows a clarify-requirements-then-present-plan
  sequence. This is verified against the structural definition in FR-027/FR-027a/FR-027b/FR-028 —
  the fixed yardstick — and **not** against the framework reference item, which is being rewritten
  in the same effort and so cannot serve as its own measuring stick. The framework item is checked
  separately, against that same definition, as one more item that must conform to it (FR-029).
- **SC-009**: No occurrence of "Staff/Monster" or "Monster" remains anywhere in the rendered UI;
  "Lead" is used consistently instead.

## Assumptions

- The DSA "Run" feature is the first and only place this app makes an external network call; per
  the user's decision, it uses an online code-execution integration, is clearly marked as
  requiring connectivity, and every other part of the site (browsing, reading, progress tracking)
  remains fully offline-capable exactly as it is today.
- **Unverified**: that the chosen execution service accepts a request made directly from a browser
  page's own origin (rather than only from a server). This is assumed, not established — the
  planning research explicitly could not source the provider's policy on this. It MUST be proven by
  a smoke test before any Run UI is built on top of it, and FR-022a defines what happens if the
  assumption fails. This is the only load-bearing unverified assumption in this spec.
- Every DSA item needs one new authored content field (sample input for the generated driver) in
  addition to its existing `starter` code; this is a per-item content-authoring effort analogous
  in scope and process to the plain-English short-summary rewrite (batched per pack, gated by
  `node tools/validate.mjs`), tracked as part of User Story 6 rather than a one-time app-code
  change.
- "Mark complete" keeps the existing spaced-repetition engine intact under the hood — the single
  action maps to one consistent, fixed internal rating so Drill queue ordering and mastery
  percentages keep working exactly as they do today; only the on-screen choice is simplified.
- The plain-English rewrite is scoped to the short summary field only, delivered in per-track
  batches gated by `node tools/validate.mjs`, and does not touch the deeper explanation, traps, or
  other prose fields.
- Item ids, `level` numbers, and all other content-model fields defined in the project's content
  invariants are unaffected by every item in this spec — nothing here reuses, renumbers, or
  reassigns an id.
- "Automatic" content sync still respects the existing progress-preservation mechanism (tick
  re-anchoring before a snapshot swap); only the manual trigger and its UI surfaces are removed,
  not the safety behavior underneath.
- Every release this feature itself produces falls inside the narrowed Principle III (the amendment
  permitting unconfirmed auto-apply for non-destructive releases), so none of them needs its own
  carve-out. The reason is structural: this feature's three content efforts (the short-summary
  rewrite, the sample-input authoring, and the system design restructure) only ever edit **fields on
  existing items**. No item is added, removed, or renumbered, so no plan's item-id set changes, so no
  plan's material signature changes — meaning a content-only release of this feature doesn't merely
  re-anchor ticks, it leaves them untouched. That is strictly inside the amendment's "non-destructive
  to learning state" scope, not at its edge.
- The three batched content efforts (short summaries, sample inputs, clarifying questions) may
  proceed in **any order relative to one another**, including concurrently on the same pack file.
  They are field-disjoint — each writes a different field and none reads another's — so there is no
  rollout-order requirement between them. The only ordering constraints are *within* the system
  design effort, where the framework item establishes the structure the scenario items then
  reference.
- Removing the manual Update flow does not require replacing it with any other visible
  confirmation step; sync is fully silent and unobtrusive — no blocking modal, no dismissible
  toast requirement, no decline affordance. This is a deliberate, resolved exception to the
  project constitution's Principle III ("A Release Is Offered, Never Imposed"); the plan for User
  Story 3 MUST include a dated constitutional amendment recording this exception (scoped to
  non-destructive, tick-preserving releases) before implementation, per the constitution's own
  Amendment and Review rules.
- Segmenting the initial load means content packs and/or non-critical views can load progressively
  after the app shell is interactive; it does not require a rewrite of the underlying static-file
  hosting model (still GH Pages, still no build step).
- A Mock session's overall time budget/deadline is a separate concept from the per-question timer
  and is unaffected by the per-question pause behavior described in User Story 5.
- "Interviewers" in system design scenarios are not simulated at all. The clarifying step is a
  scripted, content-driven **list of question strings** — not a live conversation, not an AI, and
  **not question-and-answer pairs**: no per-question authored answer exists or is added by this
  feature. The candidate works through the list the way they already work through a scenario's
  requirements checklist — marking the questions they would have thought to ask — and the answers
  those questions would have elicited are what the plan step then lays out. This shape was chosen
  over an answer-carrying one because it matches every sibling content field (requirements, rubric,
  and staff-level additions are all flat string lists), reuses the checklist interaction the design
  view already has, and introduces no structure the content set has no precedent for. See FR-027a —
  this Assumption previously described Q&A pairs the candidate selects from, which contradicted the
  data model; the flat-list shape is the resolved decision.
