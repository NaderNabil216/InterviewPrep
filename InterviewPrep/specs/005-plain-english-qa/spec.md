# Feature Specification: Very Simple English for Questions and Short Answers

**Feature Directory**: `specs/005-plain-english-qa`

**Feature Branch**: `feat/005-plain-english-qa` (off `main`, after `feat/004`'s content deliveries merge)

**Created**: 2026-08-18

**Status**: Ready for planning — no open questions; all scope decisions recorded in this spec.

**Input**: User description: "i want the questions asking way and short answer to be in very very
simple direct voice base humanized english , as most of the questions is not understandable
specially for the not that good english talking people , need it to be more and more clear."

## Why This Feature Exists

A candidate with modest English opens the app and the first thing they hit is a question. Too
often that question is phrased the way a syllabus lists a topic — "Explain declaration-site vs
use-site variance" — and the short answer under it reads like reference documentation: "Nullability
is part of the type system. `String` and `String?` are different types, so the compiler checks them
at compile time." Both are correct. Both are hard for someone whose English is not strong, and the
register matters most exactly when English is a second language: interview answers are *said out
loud*, and a candidate can only say what they can parse.

Two earlier features touched this ground and deliberately stopped short:

- `002-improvements` (US7, released `2026.08.17`) rewrote every short answer into *plainer* English
  — "simpler wording wherever that's possible without losing technical accuracy". That standard is
  permissive: it allows any sentence that is *a little* simpler, and its gate is a human read-through
  against the deep answer, not a defined register.
- `004-kotlin-qa-clarity` (in flight) makes the 70 Kotlin questions sound conversational and the
  deep answers spoken. It explicitly excludes the short answer, and its question standard is
  "how an interviewer would say it" — not "how a non-native speaker can parse it first time".

This feature is the next step, library-wide: a **defined, stricter register** for the two fields a
candidate reads first — the question and the short answer — so that even a candidate whose English
is basic understands each one on the first read. Not "plainer where possible": every field is held
to the same standard, judged against a fixed worked exemplar, in reviewed batches.

## Scope-Defining Constraints

1. **Item identifiers do not change.** Rewording a field is not renaming an item. Every candidate's
   ratings, due dates, notes, plan ticks and mock results survive untouched. (Constitution I, II.)
2. **Nothing is "simpler" if it stops being true.** The register changes; the technical content is
   preserved. Every claim, API name, keyword, version number and caveat the current text carries
   must still be findable in the rewrite — and every `refs` entry must still support a claim that is
   actually still made. (Constitution IV.)
3. **The technical vocabulary is not jargon to be removed.** `crossinline`, `String?`,
   `remember { }`, `value class` and their kin are the exact words an interviewer will use. "Very
   simple English" governs the *sentences around* those terms, never the terms themselves.
4. **This is prose only, not a content-model change.** No field is added, removed or renamed; no
   item is added or retired; no short answer gains or loses bullets (all carry exactly 3 today).
5. **No app code and no validator changes.** Readability cannot be decided mechanically — it is
   judged by humans against a fixed exemplar. The validator's existing gates still run on every
   batch; no new gate is added.

## The Register: Very Simple English (VSE)

The normative definition of "very very simple direct voice humanized english" for this feature is a
**worked exemplar plus floor rules**, judged by comparison — the same review mechanism `004` settled
on for its voice standard, applied to the fields this feature owns.

**Exemplar A — the question.** What the register does to a question:

> **Original.** "Explain declaration-site vs use-site variance, and what `in`/`out`/star-projection
> mean."
>
> **Not the target — conversational but still one long parse.** "Walk me through the difference
> between declaration-site and use-site variance, and what `in`/`out` and star-projection do."
>
> **The target.** "What is the difference between declaration-site variance and use-site variance?
> And when do you use `in` or `out`? What is star-projection?"

What the exemplar demonstrates: the question splits into short, single-idea sentences; the
instruction verb is gone; the reader is addressed directly ("when do *you* use"); every technical
term (`declaration-site`, `use-site`, `in`, `out`, `star-projection`) is kept verbatim.

**Exemplar B — the short-answer bullet.** What the register does to a bullet:

> **Original.** "Nullability is part of the type system. `String` and `String?` are different types,
> so the compiler checks them at compile time."
>
> **Not the target — shorter, but still written.** "Nullability is part of the type system, meaning
> `String` and `String?` are distinct types that the compiler verifies during compilation."
>
> **The target.** "Kotlin puts nullability into the type system. `String` and `String?` are two
> different types. The compiler checks this when you build."

What the exemplar demonstrates: one idea per sentence; everyday verbs ("puts into", "build")
replace formal ones ("verifies during compilation"); the reader is addressed ("when *you* build");
"compile time" becomes the plain "when you build" without losing the fact; the terms `String` /
`String?` stay verbatim.

The floor rules, subordinate to the exemplars:

- **One idea per sentence.** A sentence carrying two ideas in a relative clause is split.
- **Short sentences.** A short-answer sentence over ~18 words, or a question sentence over ~12
  words, is a signal that the idea should split — not a hard ban, but a trigger for rework.
- **Everyday words.** Prefer the word a friend would use in a chat ("use", "start", "build",
  "check") over the formal one ("invoke", "utilize", "verify", "construct") — *unless* the formal
  word is the technical term itself. The exception is decidable in practice: `propagate` in
  "exception propagation", `emit` in Flow's `emit { }`, "implement" in "implement an interface"
  are the interviewer's vocabulary and stay; "utilize", "construct", "commence" are never
  technical and go. Where a word is doing both jobs, the sentence around it decides — the word
  itself is kept.
- **No idioms, no figurative phrasal verbs, no double negatives.** "get around your validation
  rules" is out; "bypass your validation rules" is not simpler, so "pass validation without going
  through the checks you wrote" — or a rework of the sentence itself — is in. "Not uncommonly",
  "cannot not" and their kin are out.
- **No filler and no hedging words.** "actually", "just", "essentially", "really" add nothing and
  cost a non-native reader a word to skip.
- **Direct address.** The short answer speaks to the reader as "you". A question about a practice
  asks "when do *you* …".
- **Active voice, point first.** The fact arrives before its consequence.
- **Contractions are allowed and welcome.** This is chat register, not exam register.
- **The sentence is the unit, the field is the limit.** The register governs prose. Code samples
  are untouched; the technical terms inside the prose are untouched; a term that must stay is kept
  even where a rule above would otherwise prefer a different word.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Any interview question, understood on the first read (Priority: P1)

A candidate whose English is basic opens a question — on any of the 10 tracks that carry
question-and-answer items — and knows what they are being asked without re-reading. The question is
a short, plain, spoken sentence or two; a two-part question stays one question but each part is
simple on its own; no question opens with a textbook instruction verb; no idioms or filler words
stand between the candidate and the subject. The technical terms an interviewer will actually use
are all still there.

**Why this priority**: The question is the highest-leverage field in the library — it is what a
candidate reads on every surface: topic lists, search results, the front of every drill card, the
mock interview. It is also the field the user named first. It is 545 short strings, so the whole
slice can be authored and reviewed in per-pack batches without any app change.

**Independent Test**: Read every rewritten question aloud at a normal pace and confirm each parses
on the first pass with no re-read; confirm no question opens with a listed instruction verb; confirm
each still names the same subject and keeps every code-formatted span of the original; confirm
`node tools/validate.mjs` exits 0 and no item identifier changed.

**Acceptance Scenarios**:

1. **Given** a rewritten question, **When** a candidate with basic English reads it once,
   **Then** they can say what it asks without re-reading or translating it.
2. **Given** a rewritten question, **When** it is compared to its previous wording, **Then** it
   asks about exactly the same subject, and every API name, keyword and code-formatted span in the
   original is still present, spelled identically.
3. **Given** a question that originally asked two things, **When** it is rewritten, **Then** both
   parts survive, each phrased as a short, simple sentence.
4. **Given** a rewritten question, **When** it opens with a word, **Then** that word is not an
   instructional verb — "Explain", "Distinguish", "Describe", "Define", "List", "Write",
   "Compare and contrast" — and is not a soft stem doing the same job ("Walk me through…",
   "Tell me about…", "Can you explain…").
5. **Given** a rewritten question, **When** it appears where its text is truncated (the
   previous/next control on the question page, `stripMarkdown(q).slice(0, 40)`), **Then** it
   remains distinguishable from its neighbours from that visible prefix alone.
6. **Given** a rewritten question, **When** it is measured against its original, **Then** it is no
   longer than the original — a longer question is reworked, or the reason for the exception is
   recorded.

---

### User Story 2 - Short answers that read like a friend explaining (Priority: P1)

A candidate reveals the answer in Drill or Mock, or opens a question page, and the short answer —
the say-out-loud answer — reads the way a patient friend would explain it in a chat: three bullets,
one idea each, plain words, short sentences, addressed to "you". Every fact the current bullet
carries is still there, and the bullets still match the deep answer underneath them.

**Why this priority**: The short answer is what a candidate actually rehearses saying out loud, and
it is the field the user named second. It is the same size as the question slice (545 items, 3
bullets each = 1635 bullets) and reuses the same batch rhythm and review gate.

**Independent Test**: Read every rewritten bullet and confirm each is a short, single-idea sentence
in plain words with no idioms and no filler; confirm every claim of the pre-rewrite bullet still
appears; confirm each bullet still describes the same deep answer; confirm `node
tools/validate.mjs` exits 0 after each batch.

**Acceptance Scenarios**:

1. **Given** a rewritten short answer, **When** a candidate with basic English reads it once,
   **Then** each bullet is a plain, single-idea sentence they can say back without re-reading.
2. **Given** a rewritten bullet, **When** it is compared to its pre-rewrite text, **Then** every
   technical claim, version number, API name and caveat in the original is still present — the
   rewrite simplified the sentence, not the content.
3. **Given** a rewritten bullet, **When** it is read against the item's deep answer, **Then** it
   still describes that answer — no fact added, none contradicted.
4. **Given** a rewritten short answer, **When** it is counted, **Then** it still has exactly 3
   bullets — the shape never changes.
5. **Given** a rewritten bullet, **When** its sentence count and length are checked, **Then** it
   has one idea per sentence and stays at or under 25 words, or the reason for a recorded exception
   is stated.
6. **Given** a bullet carrying a version or date claim, **When** it is rewritten, **Then** the
   claim still has a supporting source and every retained source still supports a claim the
   rewritten item actually makes.

---

### User Story 3 - Task prompts and reference sheets made clearer (Priority: P2)

A candidate on the DSA page, the system-design page or a cheat sheet meets prompts and short
descriptions in the same plain, short-sentence register, so the *clarity* half of this feature
covers the whole library — but the *form* is preserved: a coding task stays a coding task, a design
scenario stays a scenario, and a cheat sheet's description stays a reference, not a chat message.

**Why this priority**: These 84 items (60 DSA problems, 19 design scenarios, 5 cheat sheets) are a
small minority of the library and their register is already task-shaped rather than interview-shaped,
so the conversational half of VSE does not apply to them — only the plain-words/short-sentences
half. They are a genuine part of "most of the questions is not understandable", just a smaller one.

**Independent Test**: Read each of the 84 prompts and their short answers; confirm each either was
simplified or is recorded as already simple; confirm task, scenario and reference form is intact;
confirm `node tools/validate.mjs` exits 0.

**Acceptance Scenarios**:

1. **Given** a DSA problem prompt, **When** it is reviewed, **Then** it reads in plain words and
   short sentences, and still states exactly the same task, inputs and constraints — the
   instructional form of a task prompt is preserved, not removed.
2. **Given** a design scenario prompt, **When** it is reviewed, **Then** it reads in plain words
   and short sentences, and still sets up the same scenario and requirements.
3. **Given** a cheat-sheet question or short answer, **When** it is reviewed, **Then** it reads in
   plain words and short sentences, and its compact reference form is preserved — it is not forced
   into conversational register.
4. **Given** a non-qa item's short answer, **When** it is rewritten, **Then** every technical
   claim it carried is still present and still matches the item's content.
5. **Given** the 84 non-qa items, **When** the feature is complete, **Then** each one is either
   simplified or recorded as already meeting the plain-words standard — none is skipped silently.

---

### Edge Cases

- **A two-part question.** "What does `data class` generate, and when is it the wrong choice?" —
  both parts must survive as short simple sentences. The item is one question; splitting its
  *wording* into two sentences is fine, splitting the item is not.
- **A scenario-length question.** The longest qa question runs to 215 characters (a behavioural
  scenario). Very simple English is shorter, so these must come down hard — but the scenario's
  substance (who said what, what you must argue) must survive.
- **A term that *is* the jargon.** "platform type", "declaration-site variance" cannot be replaced
  by plain words — they are the interviewer's vocabulary. The sentence around them simplifies; the
  term stays. Constraint 3.
- **A qualifier that will not fit the word bound.** A bullet carries a caveat that cannot survive
  inside 25 words without losing its precision. Preservation wins: the bullet stays longer than the
  bound, and the exception is recorded with its reason (FR-012a). Never delete a caveat to fit a
  word count.
- **A bullet that stops matching its deep answer.** The read-through compares each rewritten bullet
  against the item's deep answer. If the deep answer was already rewritten by `004` and the two now
  disagree, `005` repairs the short answer only and records it; the deep answer is `004`'s field.
- **A version claim in a bullet.** Bullets carry claims like "Kotlin 2.4 is the current release
  (Jun 2026)". Rewriting must not drop the claim, and must not *invent* a version or date claim
  without a source — the refs check runs in both directions (FR-014).
- **Two questions drifting together.** The library screens every question pair for
  near-duplication and requires every flagged pair to be adjudicated. A uniform simple register
  moves questions toward each other — it replaces distinguishing words with common ones — so the
  rewrite can manufacture near-duplicates out of questions that were previously distinct, including
  across tracks (FR-022).
- **The truncated preview.** Questions are cut to the first 40 characters of
  `stripMarkdown(q)` on the previous/next control. Simpler questions share openings ("What is…?"),
  so the distinguishing subject words must survive within the opening — not merely somewhere in
  the full question.
- **A question that grows.** Simplifying usually shortens; occasionally a plain rephrase is longer.
  A longer question is reworked or the exception recorded (FR-008). The signal is about length;
  the rule is that nothing is deleted to fit it.
- **Overlap with `004` on the Kotlin packs.** Both features touch the `q` field of the same 70
  items. `004`'s deliveries have merged on `main` before `005` begins (FR-021, Assumptions), so
  the two never edit the same file concurrently.
- **A claim that quietly disappears.** The gravest failure mode: a sentence gets simpler, drops a
  qualifier, and becomes false — or drops the only claim a source was cited for. No mechanical
  check can catch this; the per-batch human read-through is the only defence, and it is mandatory
  (FR-020).

## Requirements *(mandatory)*

### Functional Requirements

**The question field, qa items (US1)**

- **FR-001**: All 545 question-and-answer items' `q` field MUST be rewritten in Very Simple
  English — the register defined by the exemplars above. "Most of the questions" is the whole qa
  library, not a subset: the register has no per-track exceptions.
- **FR-002**: The register is defined by the worked exemplars, which are the normative standard.
  A reviewer judges a rewrite by comparing it against Exemplar A, and a rewrite that reads like the
  "not the target" version fails the gate even though it may be shorter than the original. The
  floor rules are subordinate to the exemplars: where a rule and the exemplar appear to conflict,
  the exemplar wins.
- **FR-003**: No rewritten qa question MAY open with an instructional verb. The named list —
  "Explain", "Distinguish", "Write", "Describe", "Define", "List", "Compare and contrast" — is a
  **floor, not a ceiling**: closed for mechanical screening, open for review. A question opening
  with any of those seven fails automatically; a question opening with a soft stem that does the
  same job — "Walk me through…", "Tell me about…", "Talk me through…", "Can you explain…" — fails
  the review step. This extends the rule `004` established for Kotlin to all 545 qa questions.
- **FR-004**: A rewritten question MUST ask about the same subject as the original and MUST retain
  every code-formatted span of the original — the identifiers, keywords, annotations, operators and
  API names the original marked as code — spelled identically.
- **FR-005**: A question that originally asked two things MUST still ask both, each phrased as a
  short, simple sentence. The item is not split, and neither part is silently dropped.
- **FR-006**: A rewritten question MUST contain no idioms, no figurative phrasal verbs, no double
  negatives, and no filler or hedging words ("actually", "just", "essentially", "really").
- **FR-007**: A rewritten question MUST remain distinguishable from its neighbours where its text
  is truncated — the previous/next control shows the first 40 characters of `stripMarkdown(q)`
  (`assets/js/views/item.js:88-89`). The test is whether a candidate can tell the two apart from
  the visible prefix; the subject must appear within it, not merely somewhere in the full
  question.
- **FR-008**: A rewritten question MUST NOT be longer than its original. Where the only way to be
  simple is longer, the item is reworked; if it still cannot balance, the exception is **recorded
  with its reason** — never left as an unexplained growth.
- **FR-008a**: Where the no-growth rule and simplicity collide, a question MAY stay longer than
  its original **only as a recorded exception naming the item and the reason** — never an
  unexplained growth, and never by deleting content to fit the bound. The exception is the escape
  from FR-008, not the budget.
- **FR-009**: A rewritten question MUST NOT introduce a claim that requires a source. Questions
  ask about versions and defaults ("What's new in Kotlin 2.x?") but MUST NOT assert them; an
  assertion that appears in a rewrite needs a source the item already carries or the rewrite is a
  defect. A version- or date-bearing assertion **retained** from the baseline is subject to the
  FR-014 both-directions check exactly like a bullet's claim — the refs check is not a
  bullet-only mechanism.

**The short answer field, qa items (US2)**

- **FR-010**: All 545 qa items' `shortAnswer` — 1635 bullets — MUST be rewritten in Very Simple
  English, per the Exemplar B standard. Each bullet MUST carry exactly one idea, expressed in one
  or two short sentences in plain words, active voice, addressed directly ("you").
- **FR-011**: A rewritten bullet MUST preserve every technical claim, version number, API name and
  caveat present in the pre-rewrite bullet. For this requirement a claim is any assertion a reader
  could act on or be wrong about — version numbers, behavioural statements, limitations, causal
  links, recommendations. "Simpler" never means "less true".
- **FR-012**: A rewritten bullet MUST be at or under 25 words. This is a review signal with a
  defined exception, not a gate: a bullet over the bound is reworked first, and if a qualifier
  genuinely cannot survive inside the bound, the bullet stays longer and the exception is recorded
  with its reason (FR-012a). The word bound never causes a caveat to be deleted.
- **FR-012a**: Where the word bound and claim preservation collide, **preservation wins** — no
  claim, qualifier or caveat is ever deleted to fit a word count, and no material is relocated to
  another field to do it. The collision is resolved by rebalancing within the rewrite; if that
  fails, the item is accepted as a recorded exception naming the item and the reason. The exception
  path is unbounded by design — preservation always wins — but it is never invisible: every
  exception is recorded with its reason, and the batch record's length figures (FR-023) make
  erosion visible across batches rather than a drift discovered only at the end.
- **FR-013**: A rewritten bullet MUST still match the item's deep answer: every fact the bullet
  asserts appears in the deep answer, and nothing in the bullet contradicts it. This is checked per
  item in the batch read-through, not assumed.
- **FR-014**: Every version- or date-bearing claim in a rewritten bullet MUST still be supported
  by a source the item carries, and every retained source MUST still support a claim the rewritten
  item actually makes. The check runs in both directions, because a sentence made concrete in the
  simple register can assert something the original merely gestured at. On the release boundary
  the same check is performed as the gate-13 audit: the validator names up to 10 version-claim
  items the release touches, and each named claim must survive in the rewritten text and still be
  supported by a retained source; the audit is recorded with the release.
- **FR-015**: A rewritten short answer MUST still have exactly 3 bullets. Merging, splitting or
  reordering bullets is a content edit, not a register change, and is out of scope.

**Task prompts and reference sheets, non-qa items (US3)**

- **FR-016**: The 84 non-qa items (60 DSA problems, 19 design scenarios, 5 cheat sheets) MUST have
  their `q` and `shortAnswer` reviewed against the plain-words, short-sentences half of the VSE
  register and simplified wherever that improves clarity. The task, scenario and reference forms
  MUST be preserved; the conversational half of the register (direct address, chat tone) does NOT
  apply to them.
- **FR-017**: FR-011, FR-012, FR-012a, FR-013 and FR-014 bind on the non-qa fields too — the
  25-word bound and its recorded-exception path included — so a simplified prompt or description
  preserves every claim, stays at or under 25 words per bullet or carries a recorded exception,
  still matches its item's content, and keeps its sources honest.
- **FR-017a**: A non-qa item that is already as simple as the standard requires MUST be recorded
  as such in its batch record rather than skipped silently — "reviewed, no change needed" is a
  verdict, not an omission. The verdict is a non-qa mechanism: a qa item is always rewritten
  (FR-001), never recorded as "already simple".

**Integrity, shared by all three stories**

- **FR-018**: No item identifier may be changed, reused, reassigned or renumbered; no item may be
  added or removed; no content field may be added to or removed from the content model; and no
  short answer may gain or lose bullets. This feature touches prose only.
- **FR-019**: The rewrite MUST proceed in per-pack batches, and `node tools/validate.mjs` MUST
  exit 0 after every batch.
- **FR-019a**: A batch MUST introduce no new warning. "New" is measured against a run recorded
  immediately before the batch, not against a remembered baseline — the library's checks are
  date-relative and warnings can appear for reasons unrelated to the batch. Any new warning MUST be
  diagnosed and attributed before the batch is accepted.
- **FR-020**: Because no mechanical check can tell whether simplified text is still true, each
  batch MUST include an explicit human read-through — performed by whoever authored the batch,
  before it is committed — answering two questions per item, and a batch passes only if both hold
  for every item:
  1. **Is it still true?** Every claim in the pre-rewrite field is still present (FR-011,
     FR-017).
  2. **Does it read simple?** The rewrite reads like the exemplar's target version, not like its
     "not the target" version.
  The validator's exit code alone never certifies a batch. These questions fail independently:
  text can be perfectly accurate and still hard to parse, and it can sound friendly while having
  quietly dropped a caveat.
- **FR-021**: "The pre-rewrite text" MUST be a single fixed baseline for the whole feature — the
  content as it stood when the feature began — identified once by revision hash and recorded in
  the first task record. The Kotlin carve-out that would have given that track a second (pre-`004`)
  claim baseline is moot: `004`'s content deliveries merged on `main` before this feature began
  (recorded at planning, manifest `2026.08.19`), so current `main` is both the starting text and
  the claim baseline for every track, and the two features never edit the same file concurrently.
- **FR-022**: Rewriting questions changes the input to the library's near-duplicate screening
  (gate 8), which compares question wording across the whole library and requires every flagged
  pair to be adjudicated. Any pair newly flagged by a batch MUST be adjudicated in that batch —
  verdict and reason recorded — and not deferred to the end of the feature.
- **FR-023**: The record a batch leaves MUST be sufficient evidence for the success criteria:
  per item, the count of claims checked against the baseline, the source-to-claim mapping from
  FR-014, any recorded exception under FR-012a/FR-008, and the verdict for non-qa items under
  FR-017a. "0 claims lost" is supported by evidence, not by assertion.
- **FR-024**: Every touched item MUST carry `updatedIn` set to the release version that ships it,
  and each release MUST be registered through the manifest tooling — never hand-edited. Each
  release's summary MUST say plainly what changed (questions and short answers reworded in simple
  English). A track's release ships only when every item on that track has both fields rewritten —
  a candidate never sees a track where some items are simple and others are not. Each release's
  date MUST fall inside the validator's ref-freshness windows — gate 10 per track, gate 11 for the
  stack snapshot — so the date is projected and decided at a calendar checkpoint before the track's
  final batch begins, never discovered blocked at the release gate. A track whose items were all
  recorded "already simple" under FR-017a ships no release at all: no edit, no stamp, no version
  bump. If the calendar tightens, two completed tracks MAY share one release — one `releases[]`
  entry naming both, both tracks' items carrying the same `updatedIn` — only when both tracks are
  complete; per-track releases remain the plan.
- **FR-025**: No candidate learning state — ratings, due dates, notes, plan ticks, mock results —
  may be written, cleared or re-keyed by this feature.
- **FR-026**: The register MUST be applied consistently across all batches, not merely within
  each. A reference batch is authored and accepted FIRST — a few items across different tracks,
  chosen for their shape variety — so later batches have concrete worked examples over real item
  shapes rather than only the abstract exemplars. Where the exemplars do not settle a judgement,
  the reference batch is the secondary authority; where the two appear to conflict, the exemplars
  win. Between the floor rules and the reference batch, the reference batch wins: it is the
  exemplars applied to real item shapes, and the floor rules are subordinate to the exemplars
  (FR-002).

### Key Entities

- **Study item**: the unit whose fields are rewritten. 629 items: 545 `qa` across 10 tracks, 60
  `dsa`, 19 `design`, 5 `concept`. Carries a permanent identifier and, relevant to this feature,
  a `q` field and a 3-bullet `shortAnswer` — every item carries both today.
- **Question field (`q`)**: the phrase a candidate reads on every surface — topic lists, search,
  drill cards, mock, the question page. The field this feature makes very simple, per item kind.
- **Short answer field (`shortAnswer`)**: the say-out-loud answer, always 3 bullets. The field this
  feature rewrites in the same register.
- **Content release**: the versioned registry entry that carries a track's rewrite to a
  candidate's device. Without it the edits exist on disk but are unreachable by the app.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the 545 qa questions read as Very Simple English — 0 open with a listed
  instruction verb, 0 use a soft stem in its place, 0 contain an idiom, a double negative or a
  filler word, and 0 are longer than their original without a recorded reason.
- **SC-002**: 0 technical claims lost across all rewritten fields, where "claim" is FR-011's
  definition — for every rewritten question and bullet, each claim in the baseline text is still
  present after. Confirmed by the per-batch read-through and evidenced per FR-023.
- **SC-003**: 100% of the 545 qa short answers have exactly 3 bullets, each at or under 25 words
  or carrying a recorded exception, and each still matching its item's deep answer.
- **SC-004**: 0 unsupported sources and 0 unsourced version/date claims remain on any rewritten
  item.
- **SC-005**: `node tools/validate.mjs` exits 0 after every batch and at the end of the feature; 0
  of the 629 item identifiers differ from their pre-feature values; and no batch ships with a new
  warning left unattributed.
- **SC-006**: 0 unadjudicated near-duplicate question pairs remain — every pair a batch newly
  flags is resolved in that batch with a verdict and a reason.
- **SC-007**: 84 of 84 non-qa items are reviewed and either simplified or recorded as already
  simple, with their task, scenario and reference form intact.
- **SC-008**: A candidate whose device holds pre-feature progress opens the app after each release
  and finds every rating, due date, note and plan tick intact — the feature changes no state and
  no app code.

## Assumptions

- "The questions" means the `q` field of every item, and "the short answer" means the
  `shortAnswer` field of every item. All 629 items carry both today, so the full scope is 629
  questions and 1887 bullets.
- The register is tiered by item kind, not by whim: the full conversational VSE applies to the 545
  qa items (the interview questions the user is describing); the plain-words, short-sentences half
  applies to the 84 dsa/design/concept items, whose task/scenario/reference form is preserved.
- This feature is a **second, stricter pass** over work `002` already shipped on the short answer
  and `004` is shipping on Kotlin questions — not a redo of either. `002`'s standard was "plainer
  wherever possible"; this feature's standard is a defined register held to every field, judged
  against fixed exemplars in reviewed batches. Where `004` has already rewritten a Kotlin question
  conversationally, `005` makes it simpler still against the single feature baseline (FR-021).
- `004`'s content deliveries (questions `2026.08.18`, answers `2026.08.19`) are merged on `main`
  before `005`'s Kotlin batches begin — recorded at planning as `fef2e12`, manifest `2026.08.19` —
  so the two features never edit the same pack file concurrently. `005` does not touch the deep
  answer, traps, follow-ups, code samples or captions — those remain `004`'s scope on Kotlin and
  out of scope everywhere else.
- "Very simple" does not mean a restricted vocabulary list or a readability score. The standard is
  the exemplars plus the floor rules; the review mechanism is the per-batch human read-through.
  Word bounds (25 per bullet, sentence-length signals) are review signals with a recorded-exception
  path, not gates.
- Authoring proceeds in per-pack batches; batches accumulate into one content release **per
  track**. A track's release covers both fields for every item on the track at once — no
  half-simplified track is ever released. The number of releases (up to 13 tracks) and their
  version strings are settled by the manifest tooling at release time.
- No app code changes, no validator changes, no new dependencies, no build step. The site stays
  offline-capable and served over `http://localhost` as it is today.
- Content edits without a manifest version bump are unreachable by the app, so a release is only
  real when registered; `tools/sync-manifest.mjs` is the only writer of the manifest.

## Out of Scope

- The deep answer (`answer`), traps, follow-ups and code sample captions — `004` owns these on the
  Kotlin track, and no other track's prose beyond `q` and `shortAnswer` is touched.
- The section labels and question-page presentation from `004` — app code, unrelated to this
  feature.
- Adding, retiring, splitting or merging items; changing identifiers, levels, topics, tags or
  `addedIn`.
- Changing the short-answer shape (3 bullets), the content model, the code samples, the
  highlighter or the markdown dialect.
- Any change to scheduling, progress tracking, search behaviour, the content-sync mechanism, or
  the validator's gates.
- App behaviour in any non-functional dimension — performance, accessibility, security — is
  untouched; this feature changes no app code, so none of those dimensions is in scope.