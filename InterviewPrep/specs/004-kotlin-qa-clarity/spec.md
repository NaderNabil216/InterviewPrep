# Feature Specification: Labelled Answer Sections and Plain-Spoken Kotlin Q&A

**Feature Directory**: `specs/004-kotlin-qa-clarity`

**Feature Branch**: `feat/004-kotlin-qa-clarity` (off `main`) — not yet created

**Created**: 2026-08-17

**Status**: Ready for planning — Q1 and Q2 resolved 2026-08-17 (decisions recorded in
[Open Questions](#open-questions))

**Input**: User description: "i want you accross the kotlin QA question , to add a highlighted label
for each section ( short answer , full answer , ... ) and revice the language of the question , and
making the question and the answer in simple direct english , no need to be sofisticated or complex ,
more into humanized chat not documentational reading."

## Why This Feature Exists

A Kotlin question page today is a wall. The candidate opens `kt-0034` and gets, in order and with no
signposting: a bold question, a bulleted block behind an accent bar, a longer block of prose, a code
sample, then three labelled boxes (follow-ups, traps, sources). Nothing on the page says that the
bulleted block *is the answer you would say out loud* and the prose block *is the depth behind it* —
the distinction the content was authored around. A candidate skimming five minutes before a call
cannot tell where the sayable answer ends and the background reading begins, so they read all of it
or none of it.

The second half of the problem is voice. Feature `002-improvements` (US7) already rewrote the short
summary of all 629 items into plain English, and it deliberately stopped there: `answer`, `q`,
`traps` and the rest were left byte-identical by design. The result on the Kotlin track is a split
personality — a plain-spoken summary sitting directly beneath a question that opens "Explain
declaration-site vs use-site variance" and above an answer written like reference documentation.
Five of the seventy questions still open with an instructional verb (`Explain`, `Distinguish`), and
the deep answers read as specification prose rather than as a colleague talking.

That register is actively wrong for the job. This content exists to be **said out loud in a room**.
A candidate rehearses by reading it back; prose written to be *cited* does not rehearse well. The
ask is to finish on the Kotlin track what US7 started on one field — make the question sound like a
person asking it and the answer sound like a person answering it — and to label the sections so the
structure the content already has becomes visible.

## ⚠ Scope-Defining Constraints

1. **Item identifiers do not change.** Rewording a question is not renaming an item. All seventy
   Kotlin identifiers, and every candidate's ratings, due dates, notes and plan ticks hanging from
   them, survive this feature untouched. (Constitution I, II.)
2. **Nothing is a "simplification" if it stops being true.** The register changes; the technical
   content is preserved. Every version number, API name, behavioural claim and caveat that the
   current text carries must still be findable in the rewritten text — and every `refs` entry must
   still support a claim that is actually still made. (Constitution IV.)
3. **The Kotlin API vocabulary is not jargon to be removed.** `crossinline`, `value class`,
   `@UnsafeVariance` and their kin are the exact words the interviewer will use. "Simple direct
   English" governs the sentences around those terms, never the terms themselves.
4. **This is presentation plus prose, not a content-model change.** No new item field is invented,
   no field is deleted, no item is added or retired.

## Clarifications

### Session 2026-08-17

- Q: Should the labels cover the DSA and system-design pages too, or only the question-and-answer pages? → A: The question-and-answer page only (545 `qa` items across 10 tracks). The DSA page, the system-design page and the printable cheat sheets keep their current presentation untouched.
- Q: Should a section label depend on the kind of item, so DSA problems, design scenarios and cheat sheets stay unlabelled wherever they appear — including inside Drill and Mock? → A: Yes. Labelling is decided by item kind, not by page. Question-and-answer items are labelled on every surface; DSA, design and cheat-sheet items are labelled on none.
- Q: What wording should the section labels use? → A: Question · The 30-second answer · The full picture · Code · They'll ask next · What sinks you · Sources.
- Q: Should the whole feature reach the device as one content release at the end, or should the rewritten questions ship as soon as they're done and the answers follow later? → A: Three separate deliveries. The labels ship on their own as app code with no content release; the 70 rewritten questions ship as one release; the rewritten answers ship as a second release.
- Q: How should a reviewer decide whether a rewritten answer actually sounds conversational, rather than just shorter? → A: By comparison against a worked exemplar — the target is the "Rewrite 2" style recorded in FR-013a, not a checklist of rules.

### Requirements review — 2026-08-17

A requirements-quality review of this spec and its planning artifacts produced two checklists,
[checklists/ux.md](./checklists/ux.md) (presentation) and
[checklists/authoring.md](./checklists/authoring.md) (prose). Their findings are resolved here. No
decision taken in the clarification session above was reopened; what changed is that terms which were
carrying weight while undefined now have definitions, and dimensions that were absent are stated.

The additions in summary:

| Area | Added | Closing |
|---|---|---|
| Label vocabulary | rendered order, ASCII apostrophe, repeated-section rule, change process | FR-001, FR-001b |
| Presentation | measurable "indistinguishable", distinction from in-answer headings, per-shape emptiness, quantified narrow width | FR-002, FR-002a, FR-003, FR-003a, FR-001a |
| Predicate | totality over unknown item kinds, single definition, all routes, **unlabelled items keep their existing headings** | FR-006b, FR-006c, FR-006a.3, FR-006d |
| Print | pass conditions, background-independent distinction, every label-bearing surface | FR-007, FR-007a |
| Accessibility | headings, programmatic association, AA contrast in both themes, theme states, non-colour affordance | FR-024 – FR-028, SC-009 |
| Label delivery | module caching stated as an accepted constraint; no-release delivery has no rollback but a fix | FR-029, FR-030 |
| Questions | banned-opener list as floor not ceiling, softened instructional stems, "symbol" defined, truncation normalisation and what "distinguishable" means | FR-010, FR-010a, FR-011, FR-012a, FR-012b |
| Voice | applying a one-sentence exemplar to other shapes, structure preserved, secondary authority, cross-batch consistency | FR-013b, FR-013c, FR-013d |
| Length | ±15% envelope, and a fixed ordering for the case where the word band and "delete nothing" collide | FR-014a, FR-014b, SC-001a |
| Field scope | traps/follow-ups/captions held to the same rules, cardinality frozen, captions inside the fenced-block rule | FR-015, FR-015a, FR-018 |
| Sources | positive per-reference obligation, "requires a source" defined, both directions checked | FR-017, FR-017a |
| Batch gate | warning attribution, near-duplicate adjudication, fixed baseline, claim granularity, evidence standard, failure path, self-review accepted with compensating controls | FR-020a, FR-020b, FR-021b – FR-021f, SC-010 |
| Releases | "half rewritten" disambiguated, interim register split accepted and bounded, freshness-window checkpoint, short-answer and question repair carve-outs | FR-022b, FR-022c, FR-022d, FR-023a, FR-023b |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Every answer section says what it is (Priority: P1)

A candidate opens a question — on any track, Kotlin being where the gap was noticed — and can tell,
without reading a word of the content, which part is the answer they would give out loud, which part
is the deeper explanation, which part is the code example, and which parts are follow-ups, traps and
sources. Each section carries a visually highlighted label. The three sections that are unlabelled
today — the question itself, the short answer, and the code example — gain one; the three that
already carry plain headings (follow-ups, traps, sources) are brought into the same consistent,
highlighted treatment.

**Why this priority**: It is the smallest change with the widest reach — one presentation change
makes the existing structure legible across 545 items at once, and it delivers value even if not a
single word of content is ever rewritten. It is also the half of the request that no amount of
content authoring can substitute for.

**Independent Test**: Serve the site, open any question-and-answer item, and confirm each section is
preceded by a distinct highlighted label; open one of the 89 items that carry no code sample and
confirm no empty labelled section appears; open the DSA page, the system-design page and a printed
cheat sheet and confirm all three are visually unchanged; then reach a DSA item through search —
which routes it to the question-and-answer page — and confirm it shows no label that misdescribes
it.

**Acceptance Scenarios**:

1. **Given** any question with a short answer, a deep answer and a code sample, **When** the
   candidate opens its page, **Then** each of those three sections is preceded by its own
   highlighted label naming what the section is.
2. **Given** the same question, **When** the candidate looks at the follow-ups, traps and sources
   sections, **Then** those labels use the same highlighted treatment as the new ones, so the page
   reads as one labelling system rather than two.
3. **Given** an item that carries no code sample, **When** its page renders, **Then** no code label
   appears — a label is never shown for a section that has no content.
4. **Given** a candidate revealing a question-and-answer item inside a Drill or Mock session,
   **When** the answer appears, **Then** the short answer and deep answer are distinguishable there
   by the same labels used on the question-and-answer page.
5. **Given** the DSA page, the system-design page or a printable cheat sheet, **When** the candidate
   opens it, **Then** it looks exactly as it did before this feature — no labels were added there.
6. **Given** a DSA problem, a design scenario or a cheat sheet reached by any route that renders it
   through a labelled layout — search opening it on the question-and-answer page, a cheat sheet
   surfacing as a drill card, or Mock's Coding or System-design mode — **When** it renders,
   **Then** it shows no labels at all.
7. **Given** a candidate printing from the question-and-answer page, **When** the print output is
   produced, **Then** the labels remain legible and do not disrupt the existing print layout.

---

### User Story 2 - Kotlin questions sound like a person asking (Priority: P2)

A candidate reading the Kotlin track sees questions phrased the way an interviewer would actually
say them across a table, not the way a syllabus would list them. "Explain declaration-site vs
use-site variance, and what `in`/`out`/star-projection mean" becomes something a human says out
loud. The technical subject of every question is unchanged — only its phrasing.

**Why this priority**: Questions are the highest-leverage words in the library. They appear in the
topic lists, in search results, on the front of every drill card, and in the mock interview — a
candidate sees a question many more times than they read its answer. They are also only seventy
short strings, so the whole slice can land and be reviewed quickly.

**Independent Test**: Read all seventy Kotlin questions end to end and confirm each reads as spoken
English with no instructional verb opener; confirm each still names the same Kotlin subject as
before; confirm `node tools/validate.mjs` exits 0 and no item identifier changed.

**Acceptance Scenarios**:

1. **Given** a rewritten Kotlin question, **When** a candidate reads it aloud, **Then** it sounds
   like something an interviewer would say, and no question opens with a textbook instruction verb
   such as "Explain", "Distinguish" or "Describe".
2. **Given** a rewritten question, **When** it is compared to its previous wording, **Then** it asks
   about exactly the same Kotlin subject, and every API name in the original is still present.
3. **Given** a rewritten question, **When** it appears in a topic list, a search result or on the
   front of a drill card, **Then** it is short enough to read at a glance in those surfaces without
   being cut off mid-thought.
4. **Given** the batch of rewritten questions, **When** the batch is committed, **Then**
   `node tools/validate.mjs` exits 0 and every item identifier is byte-identical to before.

---

### User Story 3 - Kotlin answers sound like a person explaining (Priority: P3)

A candidate reading the deep answer on a Kotlin question hears a colleague explaining the thing over
coffee: short sentences, direct wording, the point first. The reference-documentation register —
long qualified sentences, formal connectives, passive constructions — is gone. The traps,
follow-ups and code captions on the same item get the same treatment, so the item does not read as
two different writers. Everything the answer currently teaches, it still teaches.

**Why this priority**: It is by far the largest authoring effort in this feature and the one with
the highest risk of quietly losing a technical fact, so it lands last and in reviewed batches — but
it is what turns the page from documentation into rehearsal material.

**Independent Test**: Read a rewritten pack's answers against the pre-rewrite versions side by side
and confirm every technical claim survives; hold each against the FR-013a exemplar and confirm it
reads like the target version, not the middle one; confirm `node tools/validate.mjs` exits 0 after
each pack.

**Acceptance Scenarios**:

1. **Given** a rewritten deep answer, **When** a reviewer compares it against the previous version,
   **Then** every technical claim, version number, API name and caveat in the original is still
   present in the rewrite.
2. **Given** a rewritten deep answer, **When** a reviewer holds it against the FR-013a exemplar,
   **Then** it reads like the exemplar's target version rather than its middle version — spoken
   explanation, not tidied documentation.
3. **Given** an item whose sources support specific claims, **When** its answer is rewritten,
   **Then** every retained source still supports a claim the rewritten answer actually makes, and no
   claim requiring a source is left without one.
4. **Given** an item's traps, follow-ups and code captions, **When** its answer is rewritten,
   **Then** those fields are rewritten in the same voice so the item reads consistently.
5. **Given** a rewritten pack, **When** it is committed, **Then** `node tools/validate.mjs` exits 0,
   including the gate forbidding fenced code blocks in prose fields, and the item's code samples are
   unchanged.

---

### Edge Cases

- **An item is missing a section.** All seventy Kotlin items happen to carry every field today, but
  other tracks do not — 89 of the 545 question-and-answer items carry no code sample at all. A label
  must never render for an absent or empty section, and must never render an empty labelled
  container.
- **A non-question-and-answer item reaches a labelled layout.** Three verified routes do this, and
  FR-006 closes all of them by keying the labelling to item kind rather than to page:
  search opens any of the 629 items on the question-and-answer page; the Drill queue excludes only
  DSA and design items, so cheat sheets are eligible as drill cards; and Mock's Coding and
  System-design modes render DSA and design items through the same reveal presentation. DSA and
  design items carry no deep answer, so that section currently renders as an empty body for them —
  a label must not appear over it.
- **Reveal presentation is shared, so a fix in one place is a fix in three.** The same corollary
  cuts the other way: a labelling rule applied per surface rather than per item kind would have to
  be re-derived on the question-and-answer page, the Drill reveal and both Mock reveals
  independently, and any one of them could drift.
- **Reveal surfaces.** Drill shows a short answer, a deep answer and one code sample behind a
  reveal; Mock shows a short answer plus either a deep answer or a reference answer. Labels must be
  correct in both, including the case where a Mock item has a reference answer rather than a deep
  answer.
- **A candidate's saved note under a reworded question.** Notes are keyed to the item identifier, so
  they survive — but a note written against the old wording is now read under new wording. The
  rewrite must not change what a question is *about*, or a candidate's own note stops making sense.
- **Print.** The print styles are global, so labels on the question-and-answer page reach printed
  output even though the cheat sheets themselves gain none. Any label that prints must not break
  the existing layout.
- **A question that grows too long to preview.** Conversational phrasing is usually longer than
  telegraphic phrasing. Question previews are truncated in navigation — roughly the first 40
  characters — so a rewrite that pushes the distinguishing words past that point makes two adjacent
  questions look identical. Kotlin questions run to 138 characters today, so most are already
  truncated; the constraint is on the opening words, not on total length.
- **A claim that quietly disappears.** The gravest failure mode: a sentence gets simpler, drops a
  qualifier, and becomes false — or drops the only claim a source was cited for, leaving an
  unsupported reference. No mechanical check can catch this.
- **A rewrite that reaches for a fenced code block.** Prose fields must never contain one; the
  validator errors on it. Code belongs in the item's code samples. The one prose field this feature
  rewrites that the validator does **not** cover is the code sample caption, which is why FR-018
  names it explicitly.
- **Two questions drifting together.** The library screens every question pair for near-duplication
  and requires each flagged pair to be adjudicated. Rewriting seventy questions into one
  conversational register pushes them toward a shared vocabulary — the distinguishing words are
  often exactly the terse, technical phrasing being softened — so the rewrite can manufacture
  near-duplicates out of questions that were previously distinct. The screen runs against the whole
  library, not just the Kotlin track, so a rewritten Kotlin question can collide with an untouched
  one on another track (FR-020b).
- **An unlabelled item losing a heading it already had.** Three sections carry a heading today, and
  two of them render for non-question-and-answer items too — every one of the 84 shows a sources
  heading, and the DSA problems also show a follow-ups heading. Replacing those headings with labels
  unconditionally would delete them from items that receive no label in return, and no check that
  counts labels can see it happen (FR-006d, SC-007a).
- **The gap between the two content releases.** For as long as the answers delivery takes, every
  Kotlin item pairs a rewritten question with an unrewritten answer — the same register split this
  feature exists to close, reintroduced along a different seam. It is accepted, but only as a
  transient (FR-022d).

## Requirements *(mandatory)*

### Functional Requirements

**Labelled sections (US1)**

- **FR-001**: Every content section of a question-and-answer item MUST be preceded by a visually
  highlighted label. The label wording is fixed (Clarification, 2026-08-17) and is the canonical
  vocabulary for this feature — these exact strings, in this order:

  | Section | Label | Labelled today? |
  |---|---|---|
  | The question | **Question** | no |
  | The say-out-loud answer | **The 30-second answer** | no |
  | The deeper explanation | **The full picture** | no |
  | Each code sample | **Code** | no — carries a caption only |
  | Likely follow-up questions | **They'll ask next** | yes, as "Likely follow-ups" |
  | Rejection traps | **What sinks you** | yes, as "⚠ Traps that get people rejected here" |
  | Source references | **Sources** | yes, unchanged |

  The order of that table is the **rendered order**, not merely a listing order: where two labelled
  sections both appear, they appear in this sequence. The apostrophe in "They'll ask next" MUST be a
  plain ASCII `'`, so that the string a surface emits and the string a check asserts are the same
  string. Where a section kind repeats on one page — an item carrying two code samples — the label
  repeats verbatim; distinguishing one sample from the other is the job of the sample's own caption,
  not of the label.

- **FR-001a**: These labels are longer than the headings they replace, so they MUST remain legible
  down to a **320px viewport** and in print, without wrapping into an unreadable stack, splitting a
  label across lines, overflowing its container, or crowding the content beneath them.
- **FR-001b**: The seven strings are user-visible copy. Changing one after this feature ships is a
  content decision, not a refactor, and MUST be treated as one — but because the labels ship as app
  code with no version bump, no release entry and therefore no sync notice, a candidate gets **no
  indication that the wording changed**. Any later change to these strings MUST therefore be recorded
  in the feature record that changes it, since the release notes cannot carry it.
- **FR-002**: All section labels MUST share one consistent visual treatment, so that sections
  labelled today and sections newly labelled are indistinguishable in style. "Indistinguishable" is
  measurable rather than impressionistic: **every** one of typeface, size, weight, letter-spacing,
  capitalisation, colour, background, border, corner radius and padding MUST be identical across all
  seven. No per-section variant of any of those properties is permitted, including for the traps
  label, whose section keeps its own distinct container styling.
- **FR-002a**: A section label MUST be visually distinguishable at a glance from the headings that
  appear *inside* a deep answer. Those headings are accent-coloured, and every heading level in the
  supported markdown dialect renders identically, so a treatment that amounts to "accent-coloured
  bold text" would make a label and an in-answer heading read as the same rank — which would defeat
  FR-001 on exactly the items whose answers are most structured.
- **FR-003**: A label MUST NOT render when its section is absent or empty. "Empty" is defined per
  section shape, and all four cases MUST be treated as absent: a missing field; a list with no
  entries; a list whose entries are all blank; and a text field that is blank or contains only
  whitespace. This rule is checked independently of item kind at every place a label could render, so
  that no label can appear over emptiness even if the set of labelled item kinds later widens.
- **FR-003a**: FR-003 MUST hold by construction rather than by census. It is true today that every
  question-and-answer item carries every section except code, but no requirement here depends on
  that: a labelled item missing any section MUST render neither that section's label nor an empty
  container for it.
- **FR-004**: The short answer and the deep answer MUST be labelled distinctly enough that a
  candidate can tell which is the say-out-loud answer and which is the supporting depth **from the
  labels alone, without reading either section's content**. "The 30-second answer" and "The full
  picture" satisfy this by naming the *use* of each section rather than its length, which is the
  distinction the content was authored around.
- **FR-005**: A question-and-answer item MUST carry its labels on every surface that reveals its
  content — the question-and-answer page, the Drill reveal, and the Mock reveal — using the same
  names in each. This requires the same *names* wherever a section appears; it does not require every
  surface to show every section. Drill and Mock have never shown follow-ups, traps or sources, and
  this feature does not add them.
- **FR-005a**: Where a reveal surface can show either a deep answer or a reference answer, the label
  shown MUST describe the field actually rendered. It is true today that only unlabelled item kinds
  carry a reference answer, so "The full picture" cannot currently land above one — but that is a
  property of today's content, not a guarantee, and this requirement holds regardless of which item
  kinds carry which fields later.
- **FR-006**: Whether a section is labelled MUST be decided by the **kind of item**, never by the
  page it happens to render on. A question-and-answer item is labelled on every surface; a DSA
  problem, a design scenario and a cheat sheet are labelled on **no** surface. (Clarification,
  2026-08-17.)
- **FR-006b**: The rule deciding which item kinds are labelled MUST be **total** — defined for every
  item, including one whose kind is absent, unrecognised, or introduced by a later feature. An
  unrecognised kind MUST default to **unlabelled**, because the failure this rule exists to prevent
  is a label appearing over content it does not describe, and defaulting the other way would make
  every future content type a silent regression.
- **FR-006c**: There MUST be exactly **one** definition of which items are labelled, shared by every
  surface that renders one. No surface may carry its own copy of that rule, and no part of it may be
  expressed in terms of a route, a page, a track or a pack.
- **FR-006a**: FR-006 exists because verified paths would otherwise carry the labelling onto content
  it was not designed for, and none is prevented by FR-008a alone:
  1. **Search.** All 629 items are indexed and every search result opens on the question-and-answer
     page, so a DSA problem, a design scenario or a cheat sheet can render through that layout.
  2. **Drill and Mock.** The Drill queue excludes only DSA and design items, so cheat sheets are
     eligible to appear as drill cards; Mock's Coding mode renders DSA items and its System-design
     mode renders design items, both through the same reveal presentation a question-and-answer item
     uses.
  3. **Every other route to the same page.** The question-and-answer page is the library's universal
     item destination, not a question-and-answer-only one: the topic lists, the dashboard and the
     study plan all open items there too. A page-keyed rule would have had to be re-derived at each
     of them; the item-kind rule closes all of them at once, which is the point of FR-006c.
- **FR-006d**: An item that is **not** labelled MUST render exactly what it renders today, including
  any heading it already carries. Three sections carry a heading before this feature, and those
  headings appear for unlabelled items too. Replacing such a heading unconditionally would delete it
  from content that then receives no label in its place — a regression on precisely the routes
  FR-006a enumerates, and one invisible to any check that merely counts labels.
- **FR-007**: Labels MUST NOT degrade the existing print output. Cheat sheets, the main printed
  surface, are untouched by FR-008a; this requirement guards the question-and-answer page, which the
  same print styling also covers. "Not degraded" has three conditions, all of which MUST hold in
  printed output: every label is legible; every label is still distinguishable from the body text
  around it; and no page's existing layout, pagination or spacing changes other than by the space the
  labels themselves occupy. These conditions bind on **every surface that renders a label and can be
  printed**, not on the question-and-answer page alone — the print styling is global, so a surface is
  covered by it whether or not anyone anticipated printing that surface. In practice the printed
  surfaces are the cheat sheets, which gain no labels at all, and the question-and-answer page, which
  is why it gets the explicit walkthrough; the requirement is stated at the level of "renders a
  label" so that adding a label somewhere new cannot quietly fall outside it.
- **FR-007a**: Browsers do not print background colours by default, so a label whose only visual
  distinction is a background tint would print as undifferentiated text — legible, but no longer a
  label, failing FR-007's second condition. The printed form of a label MUST therefore carry a
  distinction that does not depend on background rendering.
- **FR-008**: The labelling MUST apply to the **question-and-answer page on every track**, not to
  Kotlin alone — labels describe a section's structure, which is the same on all tracks, so there is
  no track-conditional presentation. That is 545 question-and-answer items across 10 tracks.
  (Decision, 2026-08-17; see [Open Questions](#open-questions) Q1.)
- **FR-008a**: DSA problems, design scenarios and cheat sheets MUST keep their current presentation
  unchanged on every surface — no labels are added to them by this feature, on their own pages or
  anywhere else. Those three layouts already carry their own structure (timers, hint accordions,
  rubrics, print styling) and are not the wall this feature exists to fix. That leaves 84 items
  deliberately untouched: 60 DSA problems, 19 design scenarios and 5 cheat sheets. (Clarification,
  2026-08-17.)

**Labels: accessibility and theming (US1)**

Added 2026-08-17 during the requirements review recorded in
[checklists/ux.md](./checklists/ux.md). The labels are this delivery's entire user-visible output,
and the original requirement set addressed only their layout. These requirements close that.

- **FR-024**: A section label MUST be exposed to assistive technology as a **heading** introducing
  its section. The three sections that carry a heading today are already navigable that way; a
  treatment that rendered all seven as generic containers would strip that from two sections that
  have it and withhold it from five that would gain it, leaving a page whose visible structure has no
  programmatic counterpart.
- **FR-025**: The relationship between a label and the section it introduces MUST be programmatic,
  not merely visual adjacency. Satisfying FR-024 satisfies this: a heading conventionally introduces
  the content that follows it, which is the association assistive technology already relies on.
- **FR-026**: Label text MUST meet **WCAG 2.1 AA contrast (4.5:1)** against its own rendered
  background, in **both** the light and the dark theme. The labels are small text at any weight, so
  the 3:1 large-text allowance does not apply. This is not automatically satisfied by deriving the
  colour from a theme token: the same token pair can pass in one theme and fail in the other, and
  verifying only the theme the author happens to be using is how that gets missed.
- **FR-027**: The labels MUST render correctly in every theme state the app offers — light, dark, and
  the automatic state that follows the system setting — with no state left visually broken or
  illegible.
- **FR-028**: Where a label's section conveys meaning through colour — the traps section, whose
  container is tinted to signal danger — that meaning MUST also be carried by something other than
  colour. This feature removes the warning glyph the traps heading carries today, so the label
  wording itself becomes the non-colour carrier and MUST therefore state the section's nature rather
  than merely name it. "What sinks you" satisfies this; a neutral label such as "Traps" alongside a
  tint would not.

**Labels: how they reach a device, and how a mistake is corrected (US1)**

- **FR-029**: The labels ship as app code with no content release, so they reach a device through the
  browser's ordinary caching of the site's own assets rather than through the content sync. The
  stylesheet is cache-busted by an explicit version marker and MUST be bumped; the ES modules carry
  **no such marker**, and this feature does not add one — introducing a module-versioning scheme is a
  change to how the whole site loads, disproportionate to seven labels. The consequence MUST
  therefore be stated rather than left implicit: a device holding cached modules can render the new
  stylesheet against old markup until those modules are revalidated. Every verification of this
  delivery MUST be performed after a hard refresh, so that what is checked is the built code and not
  a half-updated cache.
- **FR-030**: Because this delivery carries no release, it carries **no version bump, no sync trigger
  and no notice**. A defect in it is corrected the same way it shipped — as app code, taking effect
  on the next load — and there is no mechanism by which a candidate is told either that the labels
  arrived or that they later changed. This is acceptable for a presentation change that removes
  nothing and can be re-corrected freely. It is recorded because it means the labels have **no
  rollback story other than shipping a fix**, and because any later change to these strings inherits
  the same silence (FR-001b).

**Plain-spoken questions (US2)**

- **FR-009**: All 70 Kotlin questions MUST be rephrased as spoken English — the way an interviewer
  would ask it out loud.
- **FR-010**: No rewritten question may open with an instructional verb. The named list — "Explain",
  "Distinguish", "Write", "Describe", "Define", "List", "Compare and contrast" — is a **floor, not a
  ceiling**: it is closed for the purpose of mechanical screening, and open for the purpose of
  review. A question opening with any of those seven fails automatically; a question opening with a
  construction that is instructional in effect rather than in vocabulary fails the review step even
  though no screen catches it. Five items open with a listed verb today: `kt-0004`, `kt-0005`,
  `kt-0007`, `kt-0031`, `kt-0048`.
- **FR-010a**: The likeliest source of an unlisted instructional opener is the rewrite itself, because
  the conversational register invites stems that soften an instruction without removing it — "Walk me
  through…", "Tell me about…", "Talk me through…", "Can you explain…". These MUST be judged by what
  the sentence asks the candidate to do, not by whether the opening word appears in FR-010's list. A
  question that would read naturally as a spoken interviewer's opener passes; one that reads as a
  syllabus instruction wearing a conversational stem does not.
- **FR-011**: A rewritten question MUST ask about the same Kotlin subject as the original and MUST
  retain every API name, keyword and symbol the original named. For this requirement, that set is
  defined as **every code-formatted span in the original question** — the identifiers, keywords,
  modifiers, annotations and operators the original marked as code — each of which MUST still appear,
  spelled identically, in the rewrite. Prose mentions of a concept are governed by "the same subject"
  rather than by this enumeration.
- **FR-012**: A rewritten question MUST remain distinguishable from its track neighbours in the one
  place its text is truncated: the previous/next control on the question page, which shows roughly
  the first 40 characters. Everywhere else — topic lists, search results, the front of a drill card —
  the question renders in full, so total length is not constrained; where the distinguishing words
  fall is.
- **FR-012a**: FR-012's comparison MUST be made after the same text normalisation the truncated
  control itself applies, so a screening check and the control a candidate actually reads cannot
  disagree about what the first 40 characters are.
- **FR-012b**: "Distinguishable" MUST NOT be read as merely "not byte-identical". Two questions whose
  truncated previews differ only in a trailing fragment of a shared opening are not distinguishable
  to a reader scanning them. The test is whether a candidate can tell the two apart from the visible
  prefix — which in practice means the **subject** appears within it, not merely somewhere in the
  full question.

**Plain-spoken answers (US3)**

- **FR-013**: All 70 Kotlin deep answers MUST be rewritten in direct, conversational English —
  short sentences, point first, active voice.
- **FR-013a**: The target voice is defined by **worked exemplar**, not by a rule list (Clarification,
  2026-08-17). This is the normative standard for FR-013 and SC-003; a reviewer judges a rewrite by
  comparing it against this pair, and a rewrite that reads like the *middle* version fails the gate
  even though it is shorter than the original:

  > **Original — reference documentation.** "Note that SAM conversion is not caching; consequently,
  > invoking `removeListener` with a fresh lambda will construct a distinct instance, with the
  > result that no removal occurs."
  >
  > **Not the target — shorter, but still documentation.** "SAM conversion isn't caching, so calling
  > `removeListener` with a fresh lambda constructs a distinct instance and no removal occurs."
  >
  > **The target.** "SAM conversion doesn't cache. Write `removeListener { ... }` and you make a
  > brand new object — not the one you added. Nothing gets removed."

  What the exemplar demonstrates, as a reading aid and *subordinate* to the exemplar itself: the
  sentence breaks where a speaker would breathe; the point arrives first and the consequence
  follows; the reader is addressed directly ("you make"); the formal connectives ("note that",
  "consequently", "with the result that") are gone. Note also that the target is **not shorter** than
  the version it beats — length is not the axis being changed, which is the same principle FR-014
  and SC-001a state.

- **FR-013b**: The exemplar is a single sentence, and the 70 items it governs are not. Its authority
  extends to the **sentences** of a rewrite, whatever structure those sentences sit in. Applying it
  therefore MUST NOT be read as licence to restructure: an answer's headings, tables and lists are
  part of the material and are preserved as-is (FR-014), with the register change applying to the
  prose inside them. A table's cells get the same treatment its paragraphs do; converting a table to
  prose, or prose to a table, is a re-plan and is out of scope.
- **FR-013c**: Where the exemplar does not speak to a question that arises — a shape it does not
  cover, a judgement it does not settle — the reviewed reference batch named in the planning
  artifacts is the secondary authority, and the item is decided by analogy to it. Where the two
  appear to conflict, the exemplar wins. Where neither settles it, the choice is recorded with the
  batch rather than made silently, so the next batch inherits the decision instead of re-making it.
- **FR-013d**: The voice standard MUST be applied consistently across all 14 batches, not merely
  within each. The reference batch is authored and accepted first precisely so that later batches
  have concrete worked examples over real item shapes rather than only the abstract exemplar; a
  reviewer holding batch 12 against the exemplar alone is extrapolating further than one holding it
  against the exemplar plus eight accepted items.
- **FR-014**: The rewrite MUST preserve every technical claim, version number, API name, behavioural
  detail and caveat present in the original text. **This is a change of voice only — no content is
  deleted, and no material is relocated to another field to shorten the answer.** A rewritten answer
  covers exactly the same ground as the original, in the same order of ideas, in spoken register.
  Answers therefore stay roughly their current length; getting shorter is not a goal of this
  feature. (Decision, 2026-08-17; see [Open Questions](#open-questions) Q2.)
- **FR-014a**: "Roughly their current length" is bounded, so that it can be checked rather than felt.
  A rewritten answer is expected to land **within ±15% of its pre-rewrite word count**. Outside that
  envelope in either direction, the item is not automatically rejected, but it MUST be re-checked
  claim-by-claim against FR-014 before the batch is accepted, and the reason it moved recorded. This
  is the operational form of SC-001a: length is not a target, it is a **signal** that something may
  have been dropped or added.
- **FR-014b**: Independently of FR-014a, a rewritten answer MUST stay inside the library's
  established word band for answers of its kind. Where the two constrain in opposite directions —
  an item already at the band's ceiling cannot absorb the expansion a spoken register tends to
  produce — the resolution is fixed and is **not** a matter of judgement:
  1. First, rebalance *within the rewrite*. The words freed by dropping formal connectives and
     passive constructions are the budget that pays for shorter sentences and direct address. That
     trade is expected to balance on most items and is the intended path.
  2. If it cannot balance, **FR-014 wins**. No claim, qualifier or caveat is ever deleted to fit a
     word count, and no material is relocated to another field to do it either.
  3. An item that consequently sits outside the band is accepted as a **recorded exception** naming
     the item and the reason, not left as an unexplained warning. It is a per-item advisory, whereas
     deleting a caveat to avoid it would be a correctness defect — the two are not comparable, and
     this ordering says so once rather than leaving each item to re-decide it.
- **FR-015**: An item's traps, follow-ups and code sample captions MUST be rewritten in the same
  voice as its answer, so the item reads as one writer. "Same voice" is FR-013a applied to those
  fields — they are judged against the same exemplar, by the same comparison, and a section of an
  item that reads like tidied documentation fails whether it is the answer or a trap.
- **FR-015a**: Every preservation rule that binds the answer binds these fields too: FR-014's claim
  preservation, FR-014a's length envelope in proportion, and the prohibition on relocating material
  between fields. In particular the **number of traps and follow-ups an item carries MUST NOT
  change** — merging two traps into one, or splitting one into two, is a content edit, not a voice
  change, and is out of scope for this feature.
- **FR-016**: Code sample source MUST NOT be altered by this feature; only captions may change.
- **FR-017**: Every source reference retained on a rewritten item MUST still support a claim the
  rewritten text actually makes, and every claim that requires a source MUST still carry one. This
  is a **positive obligation on the reviewer**, discharged per reference: for each source an item
  carries, name the claim in the *rewritten* text that it supports. A source for which no such claim
  can be named has been stranded — and because FR-014 forbids dropping the claim in the first place,
  a stranded source means the rewrite lost something and is a defect in the rewrite, not in the
  source list.
- **FR-017a**: "A claim that requires a source" is the constitution's rule, not a new one: any
  statement of a version, a date, a deadline, a default, or current platform behaviour. The rewrite
  can create such a claim as well as lose one — a sentence made concrete and confident in the spoken
  register may assert something the original merely gestured at — so the check runs in both
  directions: every retained source still has its claim, and every claim of that kind still has a
  source.
- **FR-018**: No prose field may contain a fenced code block after the rewrite. For this requirement
  "prose field" includes **code sample captions**, which this feature rewrites and which the
  library's automated check does not cover; a caption is therefore checked as part of the batch
  rather than assumed to be covered.

**Integrity, shared by all three stories**

- **FR-019**: No item identifier may be changed, reused, reassigned or renumbered. No item may be
  added or removed, and no content field may be added to or removed from the content model.
- **FR-020**: `node tools/validate.mjs` MUST exit 0 after every batch, and the content rewrite MUST
  proceed in per-pack batches rather than as one bulk edit.
- **FR-020a**: A batch MUST additionally introduce **no new warning**. "New" is measured against a
  run recorded immediately before the batch, not against a remembered baseline — the library
  validates clean today, but several of its checks are date-relative and a warning can therefore
  appear for reasons that have nothing to do with the batch in hand. Any new warning MUST be
  diagnosed and attributed before the batch is accepted; it is never enough to observe that the count
  went up and assume the cause.
- **FR-020b**: Rewriting the questions changes the input to the library's **near-duplicate
  screening**, which compares question wording across the whole library and requires every flagged
  pair to be adjudicated. A uniform conversational register moves questions *toward* each other:
  it replaces distinguishing words with common ones and drops exactly the terse phrasing that keeps
  two questions apart. Any pair newly flagged by the rewrite MUST be adjudicated as part of the batch
  that caused it — verdict and reason recorded — and not left to surface at the end of the feature,
  when 14 batches of authoring stand between the flag and its cause.
- **FR-021**: Because no mechanical check can tell whether simplified text is still true, each batch
  MUST include an explicit human read-through comparing every rewritten field against its
  pre-rewrite version, performed by whoever authored the batch, before that batch is committed. This
  is a named, non-optional step in the batch gate — the validator's exit code alone never certifies
  a batch. (This mirrors the gate feature `002-improvements` established at *its own* FR-025a — a
  reference to that feature's spec, not to anything in this one, which now has an unrelated FR-025.)
- **FR-021a**: That read-through MUST answer two separate questions per item, and a batch passes
  only if both hold:
  1. **Is it still true?** Every claim in the pre-rewrite text is still present — a claim-by-claim
     comparison, per FR-014.
  2. **Does it sound right?** The rewrite reads like the FR-013a exemplar's target version, not like
     its middle version.

  These fail independently: text can be perfectly accurate and still read as documentation, and it
  can sound conversational while having quietly dropped a caveat.

- **FR-021b**: "The pre-rewrite text" MUST be a **single fixed baseline** for the whole feature — the
  content as it stood when the feature began — identified once and recorded, not "whatever the
  previous commit happened to contain". Without this the two content deliveries drift apart: by the
  time the answers are rewritten, the questions have already changed, and a reviewer comparing
  against the immediately preceding state would be measuring each delivery against the other's output
  rather than against the documentation-register original both are meant to replace.
- **FR-021c**: For the "is it still true?" comparison, a **claim** is any assertion a reader could
  act on or be wrong about: a version number, an API name, a behavioural statement, a limitation, a
  caveat, a causal link, or a recommendation. The unit is deliberately generous, because the failure
  being guarded against is a qualifier quietly disappearing, and a qualifier is exactly what a
  narrower definition would exclude. Where a sentence carries several, each counts separately.
- **FR-021d**: The record a batch leaves MUST be sufficient evidence for the success criteria it
  supports. A per-item tick that the comparison happened does not establish that no claim was lost;
  it establishes only that someone looked. For each item, the record MUST therefore name **what was
  compared** — the count of claims checked and any that required a decision, the source-to-claim
  mapping from FR-017, and any exception recorded under FR-014b — so that "0 claims lost" is
  supported by evidence rather than by assertion.
- **FR-021e**: When any item in a batch fails either question, the **batch** fails. It is reworked in
  the same field and re-submitted to the whole gate — every mechanical step re-run, every item
  re-read — rather than shipped with an exception for the failing item or split so the passing items
  proceed. A batch is the unit of acceptance precisely because per-item exceptions are how a
  standard erodes; the one exception this feature permits is FR-014b's recorded word-band case, which
  is a length advisory and not a failure of either question.
- **FR-021f**: The read-through is performed by the batch's author, and this feature therefore has
  **no independent reviewer** for its two highest-risk criteria. That is accepted rather than
  overlooked, and it is why the surrounding controls carry more weight than they otherwise would:
  every question a script can decide is decided by one (FR-020, FR-020a, the scope check), the
  reference batch fixes the standard before the bulk of the work begins (FR-013d), and the length
  envelope (FR-014a) exists to make one specific silent failure noisy. A reviewer who is also the
  author MUST read the item against the recorded baseline text rather than from memory of having
  written it — the failure mode being guarded against is recognition, not honesty.
- **FR-022**: Every touched item MUST carry `updatedIn` set to the release version that ships it,
  and each release MUST be registered through the manifest tooling so the change actually reaches a
  candidate's device.
- **FR-022a**: This feature ships as **three separate deliveries**, not one (Clarification,
  2026-08-17):
  1. **The labels** (US1) — app code only. No content changes, so no manifest version bump and no
     content release; they take effect as soon as they are built.
  2. **The rewritten questions** (US2) — one content release covering all 70, once every pack's
     questions are rewritten and reviewed.
  3. **The rewritten answers** (US3) — a second content release covering all 70, once every pack's
     answers are rewritten and reviewed.

  A Kotlin item is therefore touched by both content releases and its `updatedIn` moves twice —
  first to the questions release, then to the answers release. That is expected, not a defect.
- **FR-022b**: Batching (FR-020) and releasing are separate concerns and MUST NOT be conflated. The
  rewrite proceeds in 14 per-pack batches for authoring and review; those 14 batches accumulate into
  **one** release per user story. A batch passing its gate does not trigger a release, and no
  partially-rewritten set is ever released — a candidate never sees a track where some items have
  been rewritten and others have not. "Half rewritten" here means **half covered**: it is about the
  70 items within a delivery's own scope, all of which move together or not at all. It is *not* a
  claim that every field of an item is rewritten before anything ships, which FR-022a explicitly
  arranges otherwise.
- **FR-022d**: Between the two content releases, every Kotlin item carries a rewritten question above
  an answer still in the documentation register. This is the same register split this feature exists
  to close, reintroduced deliberately along a different seam, and it is **accepted for the duration of
  the second delivery only**. Two things follow. The interim state MUST be bounded — the second
  delivery follows the first without an intervening feature — and it MUST NOT be the state the
  feature comes to rest in. A delivery-2 release with no delivery-3 release behind it leaves the
  library measurably worse on its own stated terms than the two-release plan, and better than the
  starting point only on the questions.
- **FR-022c**: Both releases are constrained by a source-freshness window that closes on a fixed
  date, and by a second window on the version-truth registry. Because the authoring effort is
  substantial and the windows do not move, this MUST be managed by a **named checkpoint rather than
  by noticing at release time**: before the final batch of each delivery is begun, the projected
  release date is compared against both windows by whoever is authoring the delivery. If the
  projection lands inside either window's final week, the decision is taken then — either the
  delivery is finished inside the window, or the re-verification work is scheduled *before* the
  release rather than discovered as a blocked release gate. Re-verification means re-reading the
  primary source and re-dating it on that basis; re-stamping a date to satisfy a check without
  re-reading the source is a constitutional violation wearing a gate fix as a disguise, and is never
  the answer.
- **FR-023**: No candidate learning state — ratings, due dates, notes, plan ticks, mock results —
  may be written, cleared or re-keyed by this feature.
- **FR-023a**: The short answer is out of scope (see Assumptions) with one exception, which is a
  **requirement and not merely an allowance**: where a rewritten deep answer leaves its short answer
  contradicting it or no longer describing it, that short answer MUST be repaired in the same batch,
  and the repair recorded with its reason. "No longer matching" means the two now disagree on a fact,
  or the short answer promises something the rewritten answer no longer delivers — it does **not**
  mean the two merely differ in register, which they always will, since the short answers were
  rewritten by an earlier feature against a different standard. A repaired short answer is held to
  the same voice standard and the same claim-preservation rules as the fields the delivery owns.
- **FR-023b**: The same carve-out applies symmetrically to a question. A question is frozen once its
  delivery has shipped, but if writing an item's answer reveals that its rewritten question asks the
  wrong thing, is ambiguous, or has drifted from the item's subject, that question MUST be repairable
  in the answers delivery under the same conditions — repaired in the batch that found it, recorded
  with its reason, and held to the question requirements it was originally written against. The
  alternative is knowingly shipping a question the author has already judged wrong, because the
  delivery that owned it has closed.

### Key Entities

- **Study item (Kotlin, `qa` type)**: the unit being rewritten. 70 of them across 14 registered
  packs. Carries a permanent identifier, a question, a short answer, a deep answer, code samples,
  follow-ups, traps and sources — every one of which exists on all 70 today.
- **Answer section**: a named region of a rendered item (question, short answer, deep answer, code
  sample, follow-ups, traps, sources). The unit that gains a label. This spec uses those seven
  structural names in its own prose; the strings a candidate actually reads on screen are the fixed
  labels in FR-001, which are not interchangeable with them — "deep answer" is the section, "The
  full picture" is what the page says.
- **Content release**: the versioned registry entry that carries the rewrite to a candidate's
  device. Without it the edits exist on disk but are unreachable by the app.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On any question in the library, a candidate can point to where the say-out-loud answer
  ends and the supporting depth begins without reading either — verified by opening the page and
  identifying every section from its label alone.
- **SC-001a**: Rewritten answers stay within **±15% of their pre-rewrite word count** (FR-014a), and
  every answer that falls outside that envelope in either direction carries a recorded reason. A
  rewritten answer that has lost length is treated as a signal to re-check against FR-014, never as a
  win — 0 answers are accepted as improved *on the grounds that* they got shorter.
- **SC-002**: 100% of the 70 Kotlin questions are phrased as spoken English, and 0 open with an
  instructional verb — down from 5 today.
- **SC-003**: 100% of the 70 Kotlin items have deep answers, traps, follow-ups and code captions
  that read like the FR-013a exemplar's target version, delivered across 14 reviewed batches. The
  exemplar is the yardstick: a rewrite that reads like the exemplar's middle version — tidied
  documentation rather than a person talking — fails, and prose being shorter than the original is
  not evidence that it passed.
- **SC-004**: 0 technical claims lost, where "claim" is FR-021c's definition: for every rewritten
  item, each version number, API name, behavioural claim, limitation and caveat in the baseline text
  is still present after. Confirmed by the per-batch read-through and evidenced per FR-021d — for
  14 of 14 batches the record names what was compared, not merely that a comparison happened.
- **SC-005**: 0 unsupported sources and 0 unsourced claims requiring support remain on any rewritten
  item.
- **SC-006**: `node tools/validate.mjs` exits 0 after every batch and at the end of the feature, and
  0 of the 70 item identifiers differ from their pre-feature values.
- **SC-007**: 0 sections render an empty labelled container, and 0 labels misdescribe the content
  beneath them — checked on the question-and-answer page, the Drill reveal and the Mock reveal. A
  label "misdescribes" its content when the section it introduces is not the one FR-001's table pairs
  it with; the criterion is that every rendered label matches that table, which makes it a check of
  the seven pairings rather than a judgement about wording.
- **SC-007a**: The 84 DSA, design and cheat-sheet items render identically to their pre-feature
  output on every surface they can reach: their own pages, the question-and-answer page via search or
  a topic list, the Drill queue, and Mock's Coding and System-design modes. "Identically" means the
  rendered result is unchanged in both directions — **nothing added and nothing removed**. Counting
  labels tests only the first: it returns the same answer whether an item's existing heading survived
  or was deleted, so the criterion is met only when the headings those items carry today are
  confirmed still present (FR-006d).
- **SC-008**: A candidate whose device holds pre-feature progress opens the app after the release
  and finds every rating, due date, note and plan tick intact.
- **SC-009**: Every section label is exposed as a heading, and label text meets WCAG AA contrast
  (4.5:1) against its rendered background in **both** themes — measured, not assumed, with the
  measurement recorded for each theme (FR-024, FR-026).
- **SC-010**: 0 unadjudicated near-duplicate question pairs remain after the questions delivery.
  Every pair the rewrite newly introduces is resolved in the batch that caused it, with a verdict and
  a reason (FR-020b).

## Open Questions

Both questions that gated this spec were answered on 2026-08-17. Nothing further blocks
`/speckit-plan`.

### Question 1 — RESOLVED: the labelling applies to every track, on the question-and-answer page

**Context**: FR-008. The request says "across the kotlin QA questions", but the question page, the
Drill reveal and the Mock reveal are single shared surfaces used by all 13 tracks. Restricting
labels to Kotlin would mean conditioning presentation on an item's track — deliberate extra
machinery for a deliberately inconsistent result.

| Option | Answer | Implications |
|--------|--------|--------------|
| **A ✅** | **Label every track (Kotlin was where it was noticed)** | One consistent change, no track-conditional logic. Other tracks get labelled sections without their prose being reviewed in this feature, which is harmless — labels describe structure, not voice. *(As originally posed this option read "all 629 items gain labels at once"; the clarification below narrows that to the 545 question-and-answer items.)* |
| B | Label Kotlin only, as a pilot | Matches the literal wording of the request. Requires track-conditional presentation, and produces a library where the same section is labelled on one track and bare on twelve. Creates follow-up work to roll out later. |

**Decision (2026-08-17)**: **Option A.** Labels ship library-wide rather than Kotlin-only.

**Narrowed by clarification (2026-08-17)**: "library-wide" means *the question-and-answer page on
every track* — 545 items across 10 tracks — not every item type. The DSA page, the system-design
page and the printable cheat sheets keep their current presentation (FR-008a), because those three
layouts already carry their own structure and would have required roughly fourteen additional label
names for section kinds this feature was never about. The residual risk moves to FR-006: search
routes every item type to the question-and-answer page, so the labelling can still meet content it
was not designed for by that one path.

### Question 2 — RESOLVED: the rewrite changes voice only

**Context**: FR-014. "No need to be sophisticated or complex" reads two ways. Either the *sentences*
stop being complex while every fact stays (a translation), or the *answers* also get shorter by
dropping depth (an editorial cut). The two produce very different libraries and very different
review gates.

| Option | Answer | Implications |
|--------|--------|--------------|
| **A ✅** | **Voice only — every fact preserved, only the phrasing changes** | Answers stay as deep as they are; the page just reads like a person. Review is a mechanical claim-by-claim comparison, so the "quietly lost a fact" risk is controllable. Long answers stay long. |
| B | Voice plus trimming — simplify wording and cut secondary depth | Shorter, faster-to-skim answers. But "which depth is secondary" is a judgement call per item, the review gate becomes subjective, and depth that a senior interview actually probes could be lost. |
| C | Bounded trim — cut from the answer, but relocate into follow-ups or traps rather than delete | Shorter answer body with nothing lost from the page. Still a per-item judgement call about what to move. |

**Decision (2026-08-17)**: **Option A.** Nothing is deleted and nothing is relocated between fields
to shorten an answer. Consequence for planning: the FR-021 read-through is a mechanical
claim-by-claim comparison against the pre-rewrite text — a reviewer can diff meaning without
exercising editorial judgement, which is what makes SC-004 checkable at all. A rewritten answer that
is markedly shorter than its original is a signal to re-check it, not a success.

## Assumptions

- The rewrite covers every learner-facing prose field on a Kotlin item — question, deep answer,
  traps, follow-ups and code captions. The short answer is **excluded**: feature
  `002-improvements` (US7, release `2026.08.17`) already rewrote it in plain English across all 629
  items, and re-doing it would be churn. If a short answer no longer matches its rewritten answer,
  fixing that specific mismatch is in scope.
- "Highlighted label" means a visually distinct label — not merely a bolder line of text — using the
  presentation vocabulary the app already has. The exact visual treatment is a design decision for
  `/speckit-plan`, not a requirement here.
- **The two halves of this feature have deliberately different scopes**: labelling covers the
  question-and-answer page on every track (545 items, per Q1 as narrowed), the prose rewrite is
  Kotlin-only (70 items). This is intentional, not an oversight — a label describes a section's
  structure, which is identical on every track, whereas voice is authored per item and has to be
  reviewed per item.
- The scope is the `kotlin` track only for the content rewrite: 70 items across 14 registered packs.
  The `coroutines-flow` track is a separate track and is out of scope despite being Kotlin language
  material. No other track's prose is touched by this feature.
- All 70 Kotlin items are of the question-and-answer type; no DSA, design or behavioural item is
  touched by the content rewrite.
- The rewrite is authored per pack (14 batches), each gated by the validator plus the named human
  read-through. Those batches are an authoring rhythm, not a shipping rhythm: they accumulate into
  one release per user story (FR-022a, FR-022b).
- Release versions are assigned by the manifest tooling at release time, so this spec names two
  content releases without fixing their version strings. The `releases[]` summary each carries is
  what the sync notice shows the candidate, so each should say plainly what changed — questions
  reworded, then answers reworded.
- Rewriting a question's wording does not constitute a new item. Identifiers, level, topic, track,
  tags and `addedIn` are unchanged; only `updatedIn` moves.
- The content release reaches devices through the app's existing automatic sync, which shows a
  non-blocking notice of what changed. No candidate is asked to approve this release, and nothing
  a candidate cannot recover is changed by it.
- No new external dependency, build step or content-model field is introduced; this is prose plus
  presentation within the existing structure.

## Out of Scope

- Adding labels to the DSA page, the system-design page or the printable cheat sheets — 84 items
  that keep their current presentation (FR-008a). Their own section kinds (hints, complexity,
  starter code, rubric, clarifying questions, requirements, diagram) are not named by this feature.
- Rewriting the short answer field, already done for all 629 items by `002-improvements` US7.
- Any track other than `kotlin` for the content rewrite (`coroutines-flow` included).
- Adding, retiring, splitting or merging any Kotlin item, or changing any item's level, topic or
  tags.
- Changing code sample source, the Kotlin syntax highlighter, or the supported markdown dialect.
- Any change to scheduling, progress tracking, search behaviour or the content-sync mechanism.
