# Feature Specification: Study Surface UI Polish

**Feature Directory**: `specs/006-ui-polish-fixes`

**Feature Branch**: `[006-ui-polish-fixes]`

**Created**: 2026-08-18

**Status**: Ready for planning — no open questions; all scope decisions recorded in this spec.

**Input**: User description: "i need several url enhancements : - the theme toggle button , it
shows either dark theme or light theme , however what it does is that it toggle also with match
system theme but not reflecting that on the icon , let the icon only change theme from dark to
light and vice versa . - remove the vertical line overlaying the short answer bullet points , let
it be only bullet points . - the question or the requirments , make sure if its consistant of
several quetion or several sentances , that there is a space or new line between them , to make it
more readable comfortable , question like this (You're designing a generic API. How do you decide
variance? What is @UnsafeVariance doing in List<out E>.contains? ) need to be for example not
templete (You're designing a generic API. How do you decide variance? and What is @UnsafeVariance
doing in List<out E>.contains? ) - don't show UPD label beside items . - in topic items listing ,
make sure within the same topic , in each category sort the items from basic to lead in this
sequance."

## Why This Feature Exists

Five small, unrelated frictions have accumulated across the study site's surfaces — none of them a
content problem, all of them how the interface presents content the candidate already has. Each is
independently noticeable and independently fixable, and together they are exactly the kind of
polish pass that makes daily study feel trustworthy instead of slightly off:

1. The theme button cycles through three states (Dark, Light, and a system-matching mode) but its
   icon only ever shows a moon or a sun — so a candidate can never tell, from the icon alone,
   whether they're looking at an explicit choice or at whatever the OS happens to be doing right
   now. The control looks like a two-way switch; it silently isn't one.
2. Short-answer bullets — the three-line "say it out loud" answer a candidate rehearses on every
   item page, in Drill and in Mock — are drawn with a vertical accent bar down their left edge. It
   reads as a blockquote, not a checklist, and it's the one place in the app where a plain bulleted
   list is dressed up with a decoration nobody asked for.
3. Some questions and requirement prompts pack more than one sentence — sometimes more than one
   distinct question — into a single unbroken run of text. "You're designing a generic API. How do
   you decide variance? What is `@UnsafeVariance` doing in `List<out E>.contains`?" is three ideas
   read as one wall of text with no visual seam between them. A candidate has to do the sentence
   -splitting themselves before they can even start answering.
4. The "UPD" badge next to a recently-updated item is a maintenance signal, not a study signal — it
   tells the candidate content changed under them, which reads as churn rather than help, and it
   clutters a list whose only job is to help someone find the next thing to study.
5. Within a topic's category list, items appear in whatever order they happen to sit in the pack's
   JSON file on disk — not in any order a candidate would want to study in. A Lead-level item can
   sit above three Basics items in the same category, forcing a candidate who wants to build up
   gradually to scan the whole list first.

None of these touch content packs, the manifest, or item identifiers — every fix here lives in
`assets/js/**` and `assets/css/app.css`, the app-code half of the repository.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A run-on question reads as separate, answerable ideas (Priority: P1)

A candidate opens an item — on the item page, in Drill, or in Mock — whose question or requirement
text is really two or three sentences (often two or three separate questions) run together. Today
they read as one dense block; the candidate has to parse where one idea ends and the next begins
before they can start answering out loud.

**Why this priority**: This is the readability problem the user described in the most detail and
with a concrete before/after example — it's the fix with the clearest, most direct effect on
whether a candidate can use a question the first time they read it, and it touches every surface
that shows a question (item page, Drill, Mock, topic browsing) and every design/DSA prompt.

**Independent Test**: Open an item whose question or prompt text contains more than one sentence
(especially more than one `?`), and confirm each sentence/question appears as its own visually
separated line, with normal single-sentence questions and prompts rendering exactly as before (no
extra breaks where there was only ever one idea).

**Acceptance Scenarios**:

1. **Given** a question composed of two or three sentences (e.g. a statement followed by two
   questions), **When** the item is displayed, **Then** each sentence appears as a visually
   distinct line or block instead of one unbroken run of text.
2. **Given** a question that is already a single sentence, **When** it is displayed, **Then** it
   renders exactly as it does today — no spurious line breaks are introduced.
3. **Given** text containing a period that is not a sentence boundary (an abbreviation, a version
   number, a decimal, a code identifier like `List<out E>.contains`), **When** the item is
   displayed, **Then** that period does not trigger a false break.
4. **Given** the same multi-sentence question rendered on the item page, in Drill, and in Mock,
   **When** each surface is checked, **Then** the sentence separation appears consistently on all
   of them.
5. **Given** any existing item in the current content set, **When** this fix ships, **Then** no
   content file is edited to achieve the separation — it is a presentation change, not a rewording
   or re-authoring pass.

---

### User Story 2 - The theme icon always shows the current explicit choice (Priority: P1)

A candidate taps the theme button to switch between a dark and a light appearance. Today the
button's underlying state actually cycles through three values, one of which just mirrors whatever
the operating system is currently set to — but the icon only ever draws a moon or a sun, so the
candidate can't tell from looking at it whether they picked "dark", picked "light", or landed on
"whatever the system says right now" (which can silently flip when the OS theme changes). The
button should behave like — and look like — a plain two-way switch.

**Why this priority**: A control whose visible state doesn't match its actual state is a small but
constant trust problem, and it's the first thing named in the request. It's a fast, contained fix
entirely within the app shell.

**Independent Test**: Click the theme button repeatedly from a fresh session and confirm it only
ever lands on two states — Dark and Light — with the icon always matching whichever one is
currently active; confirm the app still opens in a sensible appearance on first visit.

**Acceptance Scenarios**:

1. **Given** a candidate clicks the theme button once, **When** the icon updates, **Then** it shows
   the moon only when the app is now explicitly in Dark, and the sun only when it is now explicitly
   in Light — never an in-between or ambiguous state.
2. **Given** a candidate clicks the theme button repeatedly, **When** each click is observed,
   **Then** the app alternates strictly between Dark and Light — no third state is reachable through
   the button.
3. **Given** a candidate opens the app for the first time with no stored preference, **When** the
   page loads, **Then** the initial appearance is still sensible (e.g. matching the device's current
   preference), and the very next click begins the plain Dark/Light alternation.
4. **Given** the candidate's device changes its system-level light/dark preference while the app is
   open, **When** the candidate has already made an explicit Dark or Light choice, **Then** the
   app's appearance and icon do not silently change out from under them.

---

### User Story 3 - Short-answer bullets look like a plain list (Priority: P2)

A candidate reveals the short answer on an item page, in Drill, or in Mock. Today the three bullets
sit inside a box with a vertical accent line running down the left side, like a quoted callout. The
candidate wants to see a plain bulleted list — nothing else.

**Why this priority**: Purely visual, single CSS rule, no behavioral risk — a quick, contained
polish item.

**Independent Test**: Open any item's short answer on the item page, in Drill, and in Mock, and
confirm no vertical line, bar, or border appears alongside or behind the bullet list — only the
bullets themselves.

**Acceptance Scenarios**:

1. **Given** an item's short answer is shown, **When** the candidate looks at it, **Then** they see
   a plain bulleted list with no vertical line or accent bar next to it.
2. **Given** the short answer appears on the item page, in Drill, and in Mock, **When** each surface
   is checked, **Then** all three show the same plain bulleted presentation.

---

### User Story 4 - Recently-changed items no longer carry an "UPD" badge (Priority: P3)

A candidate browses the Topics list and sees badges next to some items. Today, an item changed in
the currently-installed content release carries an "UPD" badge. That badge is a maintenance detail,
not something that helps a candidate decide what to study, and it should no longer appear anywhere.

**Why this priority**: Removing a label is low-risk and self-contained, but it's a labeling change,
not a structural one, so it ranks behind the readability and control-accuracy fixes.

**Independent Test**: Load a snapshot that includes an item updated in the current release and
confirm no "UPD" badge is shown beside it anywhere in the app, while confirming items newly added in
the current release still carry their existing "NEW" indicator (this change only removes the
updated-indicator, not the new-item one).

**Acceptance Scenarios**:

1. **Given** an item that was updated in the currently-installed content release, **When** it
   appears in any item listing, **Then** no "UPD" badge (or equivalent updated-label) is shown beside
   it.
2. **Given** an item that was newly added in the currently-installed content release, **When** it
   appears in any item listing, **Then** its existing "NEW" indicator still appears, unaffected by
   this change.
3. **Given** any filter or view that relies on an item being "new or updated in this release" to
   decide inclusion (not just badge display), **When** this change ships, **Then** that
   include/exclude behavior is unaffected — only the visible "UPD" badge is removed.

---

### User Story 5 - Topic items are ordered from basic to lead (Priority: P2)

A candidate opens the Topics browser and drills into a track and topic. Within each category grouping
inside that topic, items appear today in whatever order they happen to sit in on disk — a Lead-level
item might appear before several Basics-level ones in the same category. The candidate wants to study
in increasing difficulty, and today has to scan the whole category to find the easiest item first.

**Why this priority**: A genuine navigation improvement, but it's an ordering change confined to one
listing view, with a clear existing field (`level`) already available to sort by — moderate value,
low complexity.

**Independent Test**: Open a topic whose category contains items at more than one level, and confirm
the items appear ordered Basics → Mid-Level → Senior → Lead within that category, with the previous
disk-order relationship no longer visible.

**Acceptance Scenarios**:

1. **Given** a topic's category containing items at two or more levels, **When** the topic listing
   renders, **Then** items appear in ascending level order: Basics, then Mid-Level, then Senior,
   then Lead.
2. **Given** two items in the same category at the same level, **When** the listing renders,
   **Then** their relative order is stable and does not appear to shuffle between visits.
3. **Given** a category where every item is already at the same level, **When** the listing renders,
   **Then** the order is unchanged from a candidate's perspective (nothing to reorder).

---

### Edge Cases

- A question or prompt with a `?`/`.`/`!` inside a code-formatted span (` `` `) or inside an
  abbreviation, version number, or decimal must not be mistaken for a sentence break.
- A question authored with only one long sentence (no natural break point) must not be artificially
  split mid-sentence.
- A candidate who has never interacted with the theme button (first-ever visit) must still get a
  sensible initial appearance even though the click-cycle itself no longer includes a system-match
  state.
- An item missing a `level` value (if any legacy data exists) must still sort into the topic
  listing predictably rather than erroring or vanishing.
- The "✨ New in v{version}" style filters that rely on the same "changed in this release" signal as
  the removed badge must keep working — only the visible badge goes away.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The theme toggle control MUST alternate strictly between two explicit states — Dark
  and Light — with no third, system-matching state reachable by interacting with the control.
- **FR-002**: The theme toggle's icon MUST always reflect the currently active explicit state: a
  moon only when Dark is active, a sun only when Light is active — never an ambiguous or
  system-derived reading.
- **FR-003**: On a candidate's very first visit, before any explicit choice has been made, the
  system MAY still choose the initial appearance based on the device's system-level preference, but
  this MUST NOT reintroduce a third click-cycle state — the first click begins the plain
  Dark/Light alternation.
- **FR-004**: Once a candidate has made an explicit Dark or Light choice, the app's appearance MUST
  NOT silently change on its own if the device's system-level preference later changes.
- **FR-005**: The short-answer bullet list MUST render as a plain bulleted list, with no vertical
  line, bar, or border decoration, on every surface that shows it (item page, Drill, Mock).
- **FR-006**: When a question's or a requirement/prompt's text is composed of more than one
  sentence — in particular more than one distinct question — the system MUST present each
  sentence/question as its own visually separated line or block, rather than one continuous run of
  text.
- **FR-007**: The separation in FR-006 MUST NOT introduce a break where a stretch of text is not
  actually a sentence boundary (an abbreviation, a decimal or version number, or punctuation inside
  a code-formatted span).
- **FR-008**: The separation in FR-006 MUST apply automatically at display time to text already in
  the current content set — it MUST NOT require every affected content item to be individually
  re-edited to add the separation.
- **FR-009**: A single-sentence question or prompt MUST continue to render exactly as it does today
  — no separation logic may alter text that has nothing to separate.
- **FR-010**: The "UPD" badge (or any equivalent "updated in this release" label shown beside an
  item) MUST no longer be displayed anywhere in the app.
- **FR-011**: The existing "NEW" indicator for items added in the current release, and any filter or
  view that depends on an item being new-or-updated in the current release, MUST continue to work
  exactly as before — FR-010 removes only the visible "UPD" badge, not the underlying signal or the
  "NEW" indicator.
- **FR-012**: In the topic items listing, within each topic's category grouping, items MUST be
  ordered by level in ascending order — Basics, then Mid-Level, then Senior, then Lead.
- **FR-013**: Where two or more items in the same category share the same level, their relative
  order MUST remain stable (consistent across repeated views), rather than reordering
  unpredictably.

### Key Entities

- **Theme preference**: the candidate's stored appearance choice — narrows from three possible
  values to two (Dark, Light) as the only states reachable through the toggle control.
- **Item level**: the existing 1–4 level value on every item (Basics/Mid-Level/Senior/Lead) — reused,
  unchanged, as the sort key for the topic items listing.
- **Release-change signals (`addedIn` / `updatedIn`)**: existing per-item fields — unchanged in
  meaning or storage; only the "UPD" badge that reads `updatedIn` is removed from display.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A candidate can state, from the theme button's icon alone and without clicking again,
  whether the app is currently in Dark or Light appearance, 100% of the time.
- **SC-002**: Across the item page, Drill, and Mock, zero short-answer displays show a vertical line
  or bar alongside the bullet list.
- **SC-003**: A candidate reading a multi-sentence question or requirement can identify each
  individual sentence/question as a visually separate line without first having to mentally
  re-split a run-on block of text.
- **SC-004**: Zero items anywhere in the app display an "UPD" badge, while items eligible for the
  "NEW" indicator continue to display it unchanged.
- **SC-005**: When browsing any topic category containing items of more than one level, the first
  item a candidate sees is always the lowest level present, and level only increases (or stays the
  same) moving down the list.

## Assumptions

- These five fixes are entirely app-code changes (`assets/js/**`, `assets/css/app.css`); no content
  pack, manifest, or item identifier is touched, and no manifest version bump is required for the
  fixes themselves.
- The device's system-level appearance preference is retained only as the source for the *initial*
  theme on a candidate's first visit before any explicit choice exists; it is dropped from the
  toggle's click-cycle per FR-001–FR-003.
- Sentence/question separation (FR-006–FR-009) is achieved as a presentation-time behavior applied
  to existing text, not as a rewrite pass across the content library — consistent with this being a
  UI enhancement request, not a content feature like `005-plain-english-qa`.
- "Topic items listing" refers to the Topics browser's per-category item grouping (`assets/js/views/
  topics.js`); other item-listing surfaces (System Design scenarios, DSA problems) are out of scope
  for the level-sort change unless separately requested.
- Removing the "UPD" badge is a display-only change: the underlying `updatedIn` field, the content
  sync/diff logic that uses it, and any "new or updated" filter behavior are all unaffected — only
  the visible badge disappears.
- A stable sort (ties broken by existing relative order) is an acceptable and expected behavior for
  items sharing the same level within a category — no additional tiebreaker (e.g. alphabetical) is
  required.
