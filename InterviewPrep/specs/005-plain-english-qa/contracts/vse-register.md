# Contract: The Very Simple English Register

**Feature**: `005-plain-english-qa` · **Spec**: [../spec.md](../spec.md) · **Research**:
[../research.md](../research.md) (R-003, R-004, R-006, R-011) · **Data model**:
[../data-model.md](../data-model.md)

This is the authoring contract — the interface between whoever writes a batch and whoever accepts
it. The app has no test runner, so this document plus `validate.mjs` and the batch gate
([batch-gate.md](./batch-gate.md)) is the whole of the quality apparatus for 629 rewritten questions
and 1887 rewritten bullets.

## The register is an exemplar, not a rule list

FR-002 is **normative**. A rewrite is judged by holding it against the spec's two worked exemplars,
not by scoring it against the floor rules. This contract quotes them in full so the reviewer never
has to leave this document.

### Exemplar A — the question

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

### Exemplar B — the short-answer bullet

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

### The floor rules (subordinate to the exemplars)

- **One idea per sentence.** A sentence carrying two ideas in a relative clause is split.
- **Short sentences.** A bullet sentence over ~18 words, or a question sentence over ~12 words, is
  a signal that the idea should split — not a hard ban, a trigger for rework.
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
- **Contractions are allowed and welcome.** Chat register, not exam register.
- **The sentence is the unit, the field is the limit.** The register governs prose. Code samples
  are untouched; the technical terms inside the prose are untouched; a term that must stay is kept
  even where a rule above would otherwise prefer a different word.

## The two tiers

The register applies in full to **`qa` items** (545) and in its plain-words half to the **84
non-qa items** (60 `dsa`, 19 `design`, 5 `concept`). The tier is a property of `type`
(data-model.md §2).

| Rule | qa items | dsa / design / concept |
|---|---|---|
| One idea per sentence, short sentences, everyday words | **yes** | **yes** |
| No idioms / phrasal verbs / double negatives / filler | **yes** | **yes** |
| Direct address ("you") | **yes** | **no — form preserved: task stays a task, scenario stays a scenario, reference stays a reference** (FR-016) |
| Chat tone, contractions | **yes** | **no** |
| Word bound: bullet ≤ 25 words (FR-012) | **yes** | **yes** (FR-017 binds FR-011/013/014; the bound is a floor rule, not conversation) |
| Question ≤ original length (FR-008) | **yes** | **yes** |

## What may change, per field

Authoritative table in [../data-model.md](../data-model.md) §1 and §5. In brief:

- **`q`** — rewritten, both tiers.
- **`shortAnswer`** — all 3 bullets rewritten; **the count of bullets never changes** (FR-015,
  FR-018). Entries are not merged, split or reordered.
- **`updatedIn`** — set to the track's release version at release time, touched items only.
- **Never** — `id`, `answer`, `traps[]`, `followUps[]`, `code[]`, `refs[]`, `level`, `topic`,
  `track`, `tags`, `addedIn`, `type`. On non-qa items also never: `prompt`, `hints`, `sampleCall`,
  `referenceAnswer`, `framework`, `summary`, `label`, `description`.
- **Repairs** — a bullet that stops matching its item's deep answer is repaired (the spec's edge
  case; the repair is recorded). The deep answer itself is 004's field and is not touched.

## Invariants a rewrite must hold

| # | Invariant | Source |
|---|---|---|
| V1 | Every claim in the **baseline** text is still present. A claim is anything a reader could act on or be wrong about: a version, an API name, a behavioural statement, a limitation, a caveat, a causal link, a recommendation (FR-011's definition) | FR-011, FR-017, SC-002 |
| V2 | Nothing is deleted and nothing is relocated to another field in order to shorten | FR-012a, spec edge cases |
| V3 | The order of ideas is preserved — this is a translation, not a re-plan. Recasting a sentence: expected. Moving a whole bullet: a content edit | FR-011, FR-015 |
| V4 | Technical vocabulary is kept verbatim: `crossinline`, `String?`, `remember { }`, `value class`, `platform type` and their kin are the interviewer's words, not jargon to remove. The register governs the sentences *around* them | Scope constraint 3 |
| V5 | Every code-formatted span of the original question survives **spelled identically** — identifiers, keywords, annotations, operators, API names | FR-004 |
| V6 | Every retained `refs[]` entry still supports a claim the rewritten text actually makes, named explicitly by the reviewer; and no claim of the kind that needs a source is left without one. Checked **both directions**, because a sentence made concrete in the simple register can assert something the original merely gestured at | FR-014, SC-004 |
| V7 | A qa question does not open with an instructional verb — `Explain`, `Distinguish`, `Describe`, `Define`, `List`, `Write`, `Compare and contrast`. That list is a **floor for screening, not a ceiling for review** | FR-003 |
| V7a | Nor with a soft stem doing the same job — "Walk me through…", "Tell me about…", "Talk me through…", "Can you explain…". Judged by what the sentence asks the candidate to do, not by its opening word. No screen catches these | FR-003 |
| V8 | A question that originally asked two things still asks both, each a short simple sentence. The item is not split and no part is dropped | FR-005 |
| V9 | A rewritten question is **not longer than its original** — raw `q.length` — and a longer rewrite is reworked; if it still cannot balance, the item is accepted only as a **recorded exception** naming the item and the reason (FR-008a). Never an unexplained growth | FR-008, FR-008a, R-004 |
| V10 | The first **40 characters** (`stripMarkdown(q).slice(0, 40)`, exactly as `item.js:88-89` renders) distinguish the question from its track neighbours — "distinguish" means a reader can tell them apart, not merely that the strings differ | FR-007, R-005 |
| V11 | A bullet is at or under **25 words** under the validator's normative counter. The count is mechanical: it is exactly what the validator's `words()` regex counts over the raw bullet text, code-formatted spans and symbol-bearing tokens included — a backtick-delimited identifier contributes its tokens as the regex sees them, with no manual adjustment or discounting. Over is reworked first; where a qualifier genuinely cannot survive inside the bound, **preservation wins** — the bullet stays longer and the exception is recorded with the item and the reason. A caveat is never deleted to fit the number | FR-012, FR-012a, R-006 |
| V12 | Each bullet is one idea in one or two short sentences; the ~18-word sentence signal marks where to split — the signal is per sentence (split on `.?!`), since bullets routinely carry two sentences | FR-010, floor rules, R-006 |
| V13 | A rewritten bullet still matches its item's deep answer: every fact it asserts appears there, nothing contradicts it. Checked per item in the read-through, never assumed | FR-013 |
| V14 | No idioms, no figurative phrasal verbs, no double negatives, no filler or hedging words ("actually", "just", "essentially", "really") in any rewritten field | FR-006 |
| V15 | A rewritten question introduces no assertion that needs a source the item does not already carry — asking "What's new in Kotlin 2.x?" is fine; asserting an answer without a source is a defect | FR-009 |
| V16 | The rewrite introduces no unadjudicated near-duplicate question pair, library-wide | FR-022, SC-006, R-008 |
| V17 | Non-qa items keep their form: a task prompt states exactly the same task, inputs and constraints; a scenario sets up the same situation and requirements; a cheat-sheet description stays a compact reference | FR-016, FR-017 |
| V18 | A non-qa item that is already as simple as the standard requires is recorded as such ("reviewed, no change needed" is a verdict, not an omission) | FR-017a, R-011 |

### The two things V1 and V13 are *not* permitted to ride on

The validator's exit code never certifies a batch, and a batch where text is accurate but still hard
to parse, or friendly but quietly shorter on claims, does not pass as "some items fine". Both
questions in the read-through (batch-gate.md step 4) fail **independently** and the batch is the
unit of failure: reworked in place, re-gated in full, every item re-read.

## The baseline is fixed once

Every comparison in V1, V3, V9 and V11 is against the **recorded feature baseline** — `git HEAD`
at the moment the first batch begins, hash written into the first task record (R-001) — never
against the previous commit. By batch 40, HEAD is full of this feature's own output; comparing
against it would measure a batch against its own ancestors. FR-021's Kotlin carve-out (a pre-004
baseline) is moot: 004 is merged, so current main is both the starting text and the claim baseline
for every track.

## The reference batch is the secondary authority

The cross-track reference batch (research.md R-003) is authored and accepted **first** and, once
accepted, is held alongside the exemplars as worked examples over real item shapes. Where the
reference batch and an exemplar appear to disagree, **the exemplar wins** (FR-026). Between the
floor rules and the reference batch, **the reference batch wins**: it is the exemplars applied to
real item shapes, and the floor rules are subordinate to the exemplars (FR-002).
