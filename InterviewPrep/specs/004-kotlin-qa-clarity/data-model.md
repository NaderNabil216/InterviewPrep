# Phase 1 Data Model: Labelled Answer Sections and Plain-Spoken Kotlin Q&A

**Feature**: `004-kotlin-qa-clarity` · **Plan**: [plan.md](./plan.md) · **Research**:
[research.md](./research.md)

**This feature adds no field, removes no field, and changes no field's type.** The authoritative
schema remains `specs/001-fill-content-gap/contracts/content-schema.md`, as amended by
`specs/002-improvements/contracts/content-schema-delta.md`. There is no schema delta to record here,
and that is a requirement (FR-019), not an omission.

What this document fixes instead is the part the schema cannot express: which *values* each delivery
is permitted to change, on which items, and what must be byte-identical afterwards. That is the
contract the per-batch scope check enforces.

---

## 1. Study item — the unit being rewritten

**Population**: 70 items, `track: "kotlin"`, `type: "qa"`, spread across 14 registered packs.
Verified 2026-08-17 against manifest `2026.08.17`: all 70 are `qa` (no other type appears on the
track), and all 70 carry every field below — none is optional in practice on this track.

| Field | Shape on the Kotlin track | D1 labels | D2 questions | D3 answers |
|---|---|---|---|---|
| `id` | `kt-NNNN`, 70 distinct | — | **frozen** | **frozen** |
| `q` | 52–138 chars, median 80 | read | **rewritten** | frozen |
| `shortAnswer` | 3 bullets | read | frozen | frozen, except a recorded mismatch repair (R-010) |
| `answer` | markdown, 162–250 words, median 231 | read | frozen | **rewritten** |
| `code[]` | exactly 1 block, all 70 captioned | read | frozen | `caption` **rewritten**; `src` and `lang` **frozen** (FR-016) |
| `traps[]` | exactly 2 per item, 140 total | read | frozen | **entries rewritten; count frozen at 2** (P12) |
| `followUps[]` | exactly 3 per item, 210 total | read | frozen | **entries rewritten; count frozen at 3** (P12) |
| `refs[]` | 87 total (54 items×1, 15×2, 1×3) | read | frozen | **frozen values**, but each must still support a claim the rewrite makes (FR-017) |
| `updatedIn` | `2026.08.17` today | — | → `2026.08.18` | → `2026.08.19` |
| `addedIn`, `level`, `topic`, `track`, `tags`, `type` | — | — | **frozen** | **frozen** |

Two entries deserve emphasis because they are where a scope check earns its keep:

- **`refs[]` is frozen but not inert.** No `refs` value changes in either delivery — so the scope
  check treats any `refs` diff as a batch failure — yet FR-017 still binds: a rewrite that drops the
  only claim a ref supported has stranded it without touching a byte. That is unreachable by any
  script and belongs to the human read-through.
- **`code[].caption` is a rewritten field inside an otherwise frozen one.** The scope check must
  compare `code[].src` and `code[].lang` for equality while permitting `caption` to move, rather
  than treating `code` as a single frozen blob.

### Invariants (all deliveries)

1. **Id set is identical** before and after every batch — same count, same values, no additions, no
   removals, no renumbering. (Constitution I, FR-019.)
2. **Track containment**: only files matching `content/packs/kotlin-*.json` are modified by D2 and
   D3. `coroutines-flow` and every other track are untouched.
3. **No fenced code block** in any prose field (gate 15, FR-018).
4. **`answer` stays in 120–250 words** under the normative counter (R-006).
5. **Every claim in the pre-rewrite text survives** — version numbers, API names, behavioural
   detail, caveats (FR-014, SC-004). Human-verified.

---

## 2. Answer section — the unit that gains a label

A **section** is a named region of a rendered item. Seven exist. The label strings are fixed by
FR-001 and are *not* interchangeable with the structural names this document uses to talk about them
— "deep answer" is the section, "The full picture" is what the page says.

| Section | Source field | Label (FR-001) | Rendered when |
|---|---|---|---|
| Question | `q` | **Question** | always (every item has one) |
| Short answer | `shortAnswer[]` | **The 30-second answer** | `shortAnswer?.length` |
| Deep answer | `answer` | **The full picture** | `answer` non-empty |
| Code sample | `code[n]` | **Code** | once per rendered sample |
| Follow-ups | `followUps[]` | **They'll ask next** | `followUps?.length` |
| Traps | `traps[]` | **What sinks you** | `traps?.length` |
| Sources | `refs[]` | **Sources** | `refs?.length` |

### Presence rule (FR-003)

A label renders **iff** both conditions hold:

```
isLabelled(item)  AND  the section's own content is present and non-empty
```

"Present and non-empty" is defined per section shape (FR-003), and all four cases below count as
absent — a section is not "present" merely because its key exists:

| Shape | Sections | Absent when |
|---|---|---|
| List | `shortAnswer`, `followUps`, `traps`, `refs`, `code` | missing; length 0; or every entry blank after trimming |
| Text | `q`, `answer` | missing; empty; or whitespace only |

The two conditions are independent and both are checked. The type predicate alone would be enough
for the 545 Q&A items as they stand today (89 of them have no `code[]`, which the existing
`.map()` already handles; every other section is present on all 545), but the second condition is
what makes FR-003 true by construction rather than by census — and FR-003a says the requirement may
**not** rest on that census, because "every Q&A item happens to carry every section" is a fact about
today's content, not a property of the content model. The one place it is load-bearing right
now is the deep answer: `item.js:44` renders `<div class="answer-body">` **unconditionally**, so an
item with no `answer` produces an empty body — visible today when a `dsa` item is opened through
search. Gating the label on `answer` being non-empty means that even if the type predicate were ever
loosened, no label would appear over emptiness.

### Surface matrix (FR-005, FR-006)

| Section | Item page (`item.js`) | Drill reveal (`drill.js`) | Mock reveal (`mock.js`) |
|---|---|---|---|
| Question | ✓ | ✓ | ✓ |
| The 30-second answer | ✓ | ✓ | ✓ |
| The full picture | ✓ | ✓ | ✓ |
| Code | ✓ per sample (max 2) | ✓ first sample only | ✓ first sample only |
| They'll ask next | ✓ | — not rendered | — not rendered |
| What sinks you | ✓ | — not rendered | — not rendered |
| Sources | ✓ | — not rendered | — not rendered |

"— not rendered" is the existing behaviour and is unchanged: Drill and Mock have never shown
follow-ups, traps or sources. FR-005 requires the same *names* wherever a section appears, not that
every surface show every section.

Mock's reveal body reads `item.answer || item.referenceAnswer` (`mock.js:143`). For a labelled item
this is always `answer`, because `referenceAnswer` exists only on `design` items, which are never
labelled. So "The full picture" can never end up over a reference answer, and the spec's edge case on
that point resolves to "cannot occur" rather than "handled".

**"Cannot occur" is a fact about today's content, not a guarantee** — which is why FR-005a states the
rule anyway: the label shown must describe the field actually rendered. Nothing in the content model
prevents a future item kind from carrying both a `referenceAnswer` and a labelled type, and if that
happens, the derivation above silently stops holding while the code keeps working. Stating the
requirement costs nothing now and is the difference between a fact and an assumption.

### Item kinds and their labelling (R-002)

| `type` | Count | Labelled | Reachable labelled-layout routes |
|---|---|---|---|
| `qa` | 545 | **yes, on all 3 surfaces** | item page, Drill, Mock (android mode) |
| `dsa` | 60 | **no** | item page via search/topics; Mock coding mode |
| `design` | 19 | **no** | item page via search/topics; Mock design mode |
| `concept` (cheat sheets) | 5 | **no** | item page via search/topics; **Drill queue** (not excluded there) |

---

## 3. Content release — how the rewrite reaches a device

| | Delivery 1 | Delivery 2 | Delivery 3 |
|---|---|---|---|
| Content | none | 70 `q` | 70 `answer` + 140 `traps` + 210 `followUps` + 70 captions |
| Version | **no bump** | `2026.08.18` | `2026.08.19` |
| Date | n/a | ≤ 2026-09-06 | ≤ 2026-09-06 |
| Batches | n/a | 14 (one per pack) | 14 (one per pack) |
| Reaches device by | page load (`app.css?v=7`) | auto-sync | auto-sync |

D1 ships no content, so `checkForUpdates()` short-circuits exactly as it does today
(`diskManifest.version === snapshot.version`) and nothing is fetched — the labels arrive with the
JS/CSS, on the next load. This is why the labels can ship first and alone.

D2 and D3 each land as **one** snapshot replacement covering all 70 items. FR-022b: the 14 batches
are an authoring rhythm; a batch passing its gate does not cut a release, and a half-rewritten track
is never published.

### State of one item across the feature

| | id | `q` | `answer` | `updatedIn` | Candidate's progress row |
|---|---|---|---|---|---|
| Before | `kt-0004` | documentation register | documentation register | `2026.08.17` | untouched |
| After D1 | `kt-0004` | unchanged | unchanged | `2026.08.17` | untouched |
| After D2 | `kt-0004` | **spoken** | unchanged | `2026.08.18` | untouched |
| After D3 | `kt-0004` | spoken | **spoken** | `2026.08.19` | untouched |

`updatedIn` moving twice is expected (FR-022a), and has one visible side effect worth knowing about:
Topics renders a `UPD` chip when `updatedIn === snapshot.version` (`topics.js:59`), so all 70 Kotlin
items carry that chip after D2 and again after D3. That is correct — they were updated — and it is
the only place either release changes anything outside the item's own prose.

---

## 4. Learning state — untouched, and structurally unable to be touched

| Store | Key | This feature |
|---|---|---|
| `aip.v1.progress` | item id | not read, not written |
| `aip.v1.session` | — | not read, not written |
| `aip.v1.plan` | material signature = `[...itemIds].sort().join('+')` | not read, not written |
| `aip.v1.mockResults` | — | not read, not written |
| `aip.v1.scratch.<id>` | item id | not read, not written |
| IndexedDB `aip/snapshot/current` | `current` | replaced wholesale by D2 and D3, as by any release |

The guarantee here is stronger than "we were careful". Every bridge between content and learning
state is the **item id set**: progress rows key on it, plan ticks key on a signature *derived* from
it. This feature changes no id, so no key on either side moves, and `migrateTicks()` — the machinery
that exists to re-anchor ticks when material changes — has nothing to do. A candidate's ratings, due
dates, notes, plan ticks and mock history come through both releases byte-identical (FR-023, SC-008,
Constitution II).

Notes are the one place a candidate can *perceive* a change: a note written under `kt-0004`'s old
wording is now read under its new wording. It is preserved either way; FR-011's rule that a rewritten
question asks about the same subject is what keeps it meaningful.

---

## 5. What a batch changes — the scope check's input

Per delivery, the diff against `git HEAD` restricted to `content/packs/kotlin-*.json` must show:

| | D2 (questions) | D3 (answers) |
|---|---|---|
| Allowed to differ | `q`, `updatedIn` | `answer`, `traps`, `followUps`, `code[].caption`, `updatedIn`, plus `shortAnswer` **only** with a recorded mismatch-repair note (FR-023a) and `q` **only** with a recorded repair note (FR-023b) |
| Must be identical | everything else, including `id`, `answer`, `traps`, `followUps`, `code[].src`, `code[].lang`, `refs`, `level`, `topic`, `tags`, `addedIn`, `type`, `track` | everything else, including `id`, `code[].src`, `code[].lang`, `refs`, `level`, `topic`, `tags`, `addedIn`, `type`, `track` |
| Item count per pack | unchanged | unchanged |
| `traps` / `followUps` entry counts | n/a | **unchanged** — 2 and 3 per item (P12) |
| ` ``` ` in `code[].caption` | n/a | **zero** — gate 15 does not cover `caption` (FR-018) |
| Files outside `kotlin-*` | zero | zero |

Any deviation fails the batch before the human read-through begins — the point being that the
reviewer spends their attention on truth and voice, not on bookkeeping a script can do (R-008).
