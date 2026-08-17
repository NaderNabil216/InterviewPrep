# Contract: Prose voice and the batch gate

**Feature**: `004-kotlin-qa-clarity` · **Spec**: [../spec.md](../spec.md) · **Research**:
[../research.md](../research.md) (R-006, R-008..R-011) · **Data model**:
[../data-model.md](../data-model.md)

This is the authoring contract for deliveries 2 and 3 — the interface between whoever writes a batch
and whoever accepts it. The app has no test runner, so this document plus `validate.mjs` is the whole
of the quality apparatus for 70 items of rewritten prose.

## The target voice is an exemplar, not a rule list

FR-013a is **normative**. A rewrite is judged by holding it against the three-way exemplar, not by
scoring it against a checklist:

> **Original — reference documentation** (26 words). "Note that SAM conversion is not caching;
> consequently, invoking `removeListener` with a fresh lambda will construct a distinct instance,
> with the result that no removal occurs."
>
> **Not the target — shorter, but still documentation** (19 words). "SAM conversion isn't caching, so
> calling `removeListener` with a fresh lambda constructs a distinct instance and no removal occurs."
>
> **The target** (22 words). "SAM conversion doesn't cache. Write `removeListener { ... }` and you
> make a brand new object — not the one you added. Nothing gets removed."

Word counts added here under the normative counter, because they carry the point that FR-014 and
SC-001a make separately: **the target is longer than the version it beats.** Brevity is not the axis.
A rewrite that reads like the middle version fails even though it is the shortest of the three.

What the exemplar demonstrates — a reading aid, strictly *subordinate* to the exemplar itself:
sentences break where a speaker would breathe; the point lands first and the consequence follows;
the reader is addressed directly ("you make"); the formal connectives ("note that", "consequently",
"with the result that") are gone.

**Reference batch (R-011)**: `kotlin-a.json` is authored and reviewed first in each delivery and,
once accepted, is held alongside FR-013a as a set of worked examples over real item shapes. Where the
reference batch and the exemplar appear to disagree, **the exemplar wins**.

## What may change, per field

Authoritative table in [../data-model.md](../data-model.md) §1 and §5. In brief:

- **D2** — `q` only (plus `updatedIn`).
- **D3** — `answer`, `traps[]`, `followUps[]`, `code[].caption` (plus `updatedIn`). Two fields are
  **conditionally** allowed, each requiring a recorded reason:
  - `shortAnswer`, as a mismatch repair (FR-023a, R-010) — where the rewritten answer leaves it
    contradicting or no longer describing the answer. Register difference alone is not a mismatch:
    the short answers were written by an earlier feature against a different standard and will always
    read differently.
  - `q`, as a repair (FR-023b) — where writing the answer reveals the D2 question asks the wrong
    thing, is ambiguous, or has drifted from the item's subject. This carve-out exists so the
    alternative is not "knowingly ship a question the author has already judged wrong because its
    delivery closed". A repaired question is held to P8–P10, exactly as if it were authored in D2.
- **Never** — `id`, `code[].src`, `code[].lang`, `refs[]`, `level`, `topic`, `track`, `tags`,
  `addedIn`, `type`. Also never: the **count** of `traps[]` or `followUps[]` entries (P12).

## Invariants a rewrite must hold

| # | Invariant | Source |
|---|---|---|
| P1 | Every claim in the **baseline** text is still present. A claim is anything a reader could act on or be wrong about: a version, an API name, a behavioural statement, a limitation, a caveat, a causal link, a recommendation (FR-021c) | FR-014, SC-004 |
| P2 | Nothing is deleted, and nothing is relocated to another field in order to shorten | FR-014 (Q2 decision) |
| P3 | The **paragraph-level** order of ideas is preserved — this is a translation, not a re-plan | FR-014 |
| P3a | P3 is not contradicted by FR-013a's "the point arrives first". The exemplar reorders *within* a sentence — subordinate clause becomes lead clause — which is the register change itself. P3 governs the sequence in which topics are taken up across the answer. Recasting a sentence: expected. Moving a paragraph because it reads better elsewhere: a re-plan, out of scope | FR-013a, FR-014 |
| P4 | Kotlin API vocabulary is kept verbatim: `crossinline`, `value class`, `@UnsafeVariance` and their kin are the interviewer's words, not jargon to remove | Scope constraint 3 |
| P5 | Every retained `refs[]` entry still supports a claim the rewritten text actually makes, **named explicitly** by the reviewer; and no claim of the kind that needs a source is left without one — checked in both directions, since a confident rewrite can create such a claim as well as lose one | FR-017, FR-017a, SC-005 |
| P6 | No fenced code block in any prose field, **including `code[].caption`**, which the validator's own field list does not cover | FR-018, gate 15 |
| P7 | `answer` lands in **120–250 words** under the normative counter | R-006, FR-014b |
| P7a | `answer` lands within **±15%** of its baseline word count. Outside that, the item is not rejected but is re-checked claim-by-claim and the movement is recorded with a reason | FR-014a, SC-001a |
| P7b | Where P7 and P2 collide — an item at the band ceiling that cannot absorb the register change — the resolution is fixed, not judged: rebalance within the rewrite first; if that fails, **P2 wins** and the item is recorded as a band exception. A claim is never deleted to hit a word count | FR-014b |
| P8 | A question does not open with an instructional verb — `Explain`, `Distinguish`, `Describe`, `Define`, `List`, `Write`, `Compare and contrast`. That list is a **floor for screening, not a ceiling for review** | FR-010 |
| P8a | Nor with a softened instruction — "Walk me through…", "Tell me about…", "Can you explain…". Judged by what the sentence asks the candidate to do, not by its opening word. No screen catches these | FR-010a |
| P9 | A rewritten question asks about the same subject and keeps **every code-formatted span** the original carried, spelled identically | FR-011 |
| P10 | A question's first **40 characters**, after the same normalisation the prev/next control applies, still distinguish it from its track neighbours — and "distinguish" means a reader can tell them apart, not merely that the strings differ | FR-012, FR-012a, FR-012b, R-009 |
| P11 | An item reads as one writer — answer, traps, follow-ups and caption share the register, and each is judged against the same exemplar | FR-015 |
| P12 | The **number** of traps and follow-ups an item carries does not change. Merging two traps or splitting one is a content edit, not a voice change | FR-015a |
| P13 | An answer's markdown structure — headings, tables, lists — is preserved. The register change applies to the prose inside it. Converting a table to prose or prose to a table is a re-plan | FR-013b |
| P14 | Claim preservation and the length envelope bind traps, follow-ups and captions in proportion, not only the answer | FR-015a |
| P15 | The rewrite introduces no unadjudicated near-duplicate question pair, library-wide | FR-020b, SC-010 |

P7 is the one that will bind in practice. Kotlin answers today run 162–250 words, median 231, against
a band whose ceiling is exactly the current maximum: there is **no headroom**. Per item, exceeding
250 is only a validator *warning*; in aggregate the gate 2b summary becomes an **error at `--final`**
if the library drops below 90% in band, and Kotlin is 12.8% of the library. See R-006 for the
sensitivity table.

**P7 and P7a constrain from opposite sides and neither subsumes the other.** P7 is the library's
quality band, absolute and shared with every other track. P7a is this feature's own fidelity check,
relative to each item's baseline. An answer can satisfy P7 while failing P7a — dropping from 250
words to 130 lands comfortably in the band and is exactly the silent-deletion failure SC-004 exists
to catch, since the band's floor sits 42 words below the track's actual minimum. Checking only the
band would leave that failure invisible.

**The baseline is fixed once** (FR-021b). Every comparison in P1, P3, P7a and P9 is against the
content as it stood at the start of the feature — not against the previous commit. By the time the
answers are being rewritten the questions have already changed, so a reviewer comparing against
`HEAD` would be measuring one delivery against the other's output rather than against the
documentation-register original both exist to replace. Record the baseline revision once, at the
start, and compare every batch of both deliveries against it.

## The batch gate

One batch = one pack file. 14 per delivery, 28 total. **All four steps, in order, before the batch is
committed.** Steps 1–3 are mechanical and exist to make step 4 affordable.

### Step 1 — validator

```bash
cd /Users/nn/InterviewPrep && node tools/validate.mjs
```

Required: **exit 0 and no new warning.** This is the only early signal that P7 is drifting — a
per-item over-band warning appears here, whereas the aggregate failure would not surface until
`--final`, 14 batches later.

"New" means *new against a run recorded immediately before this batch*, not against a remembered
figure (FR-020a). The tree stood at `All good (0 warning(s))` on 2026-08-17 at manifest `2026.08.17`,
which is what makes the signal sharp — but several gates are date-relative, and across 28 batches the
clean baseline is an assumption with a shelf life, not a constant. Capture the "before" run, diff
against it, and **diagnose any new warning rather than merely counting it**: the two warnings this
feature is most likely to produce have completely different causes and remedies —

| New warning | Cause | Remedy |
|---|---|---|
| gate 2b, one item over 250 words | the register change outgrew its budget on that item | rebalance per P7b; if it will not balance, record the exception |
| gate 8, unadjudicated near-duplicate | two questions drifted together under the rewrite (P15) | adjudicate the pair now, in this batch, with a verdict and reason |

### Step 2 — scope check

Only the fields this delivery owns changed; the pack's id set is identical; no file outside
`content/packs/kotlin-*.json` moved. Adapted from
`specs/002-improvements/verification/fielddiff.mjs`, which already diffs every pack against
`git HEAD` and exits non-zero on a protected-field change, an id change or an unexpected field. This
feature needs only a different `ALLOWED`/`PROTECTED` split per delivery, plus one refinement:
`code[]` is compared **field-wise**, so `caption` may move while `src` and `lang` may not.

Fails the batch on: any id added/removed, any frozen field differing, any non-Kotlin pack touched,
**any change to the number of `traps[]` or `followUps[]` entries** (P12), and **any ` ``` ` appearing
in `code[].caption`** — which the library validator's gate 15 does not check, because `caption` is
absent from its prose-field list. That last one is the single mechanical check this feature must add
rather than inherit, and it belongs here rather than in the app's validator: it guards a field only
this feature rewrites.

Note which baseline each check uses, because they differ and the difference matters:

| Check | Compares against | Why |
|---|---|---|
| Scope check (this step) | `git HEAD` | "What did *this batch* touch?" — a question about the working tree |
| P1, P3, P7a, P9 (step 4) | the **fixed feature baseline** (FR-021b) | "What did *this feature* change?" — by D3, `HEAD` already contains D2's rewritten questions, so comparing against it would measure one delivery against the other |

### Step 3 — screens (D2 only)

Two mechanical screens, both assists to step 4 rather than gates in their own right:

1. **Question-preview collisions.** Sort the batch's rewritten questions by their first 40 characters
   — normalised exactly as `item.js:76-77` normalises them (P10, FR-012a) — and check for a collision
   with any other question on the `kotlin` track. An exact-prefix match is the alarm; near-matches
   still need the eye, because P10's standard is that a reader can tell two questions apart, not that
   the strings differ (FR-012b).
2. **Near-duplicate drift.** Confirm the validator's gate 8 flagged no new pair (P15). This screen is
   **library-wide, not track-local**: gate 8 scores every question against every other across all 629
   items, so a rewritten Kotlin question can collide with an untouched question on another track. Any
   new pair is adjudicated in this batch, with a verdict and a reason — not deferred, when 13 more
   batches would stand between the flag and its cause.

### Step 4 — the named human read-through (FR-021, FR-021a)

Performed by whoever authored the batch, per item, against the pre-rewrite text. **The validator's
exit code never certifies a batch.** Two questions, answered separately; the batch passes only if
both hold for every item:

1. **Is it still true?** Claim-by-claim comparison with the pre-rewrite text (P1, P2, P3, P5). This
   is mechanical *in kind* — the reviewer diffs meaning, not taste — which is exactly what the Q2
   decision bought and what makes SC-004 checkable at all without a test suite.
2. **Does it sound right?** The rewrite reads like FR-013a's target version, not like its middle
   version (P11, and the reference batch from R-011).

These fail **independently**: text can be perfectly accurate and still read as documentation, and it
can sound conversational while having quietly dropped a caveat. A batch where one item fails either
question does not ship as "13 of 14 items fine".

**On failure** (FR-021e): the *batch* fails, not the item. It is reworked in place and re-submitted
to the whole gate — all four steps re-run, every item re-read, not just the one that failed. There is
no per-item exception and no splitting the batch so the passing items proceed; per-item exceptions
are how a standard erodes. The one thing that is *not* a failure is FR-014b's recorded word-band
case, which is a length advisory rather than a failure of either question.

**On self-review** (FR-021f): the author and the reviewer are the same person, and this feature has
no independent check on its two highest-risk criteria. That is accepted, not overlooked — steps 1–3
exist to shrink what is left to human judgement, the reference batch fixes the standard before the
bulk of the work, and P7a makes one specific silent failure noisy. The one discipline this demands:
**read each item against the recorded baseline text, not from memory of having written it.** The
failure mode is recognition, not honesty — a rewrite you just wrote reads as complete because you
know what it was supposed to say.

**Effort** — 70 answers, 140 traps, 210 follow-ups and 70 captions, each compared claim-by-claim, and
the whole set traversed twice across the two deliveries. At ~5 items per pack the per-batch read is
small; across 28 batches it is the largest single cost in the feature and the one most likely to be
compressed under time pressure. It is planned as its own step with its own record, rather than as
something done while committing, for exactly that reason.

### Recorded outcome

Each batch records, in this feature's `tasks.md` completion record:

- pack file, item ids, delivery;
- validator result: errors, warnings, and the delta against the run recorded immediately before the
  batch — with a diagnosis for any new warning, not just a count (FR-020a);
- scope-check result, including the caption and cardinality checks;
- D2 only: the two screens' results, and any near-duplicate pair adjudicated with its verdict and
  reason (P15);
- read-through, **as evidence rather than as a tick** (FR-021d): per item, the number of claims
  compared and any that needed a decision; the source-to-claim mapping from P5, naming the claim each
  retained ref supports; and any repair made under FR-023a or FR-023b with its reason;
- word count per rewritten `answer` against its baseline (D3) — both the absolute figure for P7 and
  the percentage change for P7a, so drift is visible across batches rather than only at the end, and
  any P7b exception recorded with the item and the reason.

The distinction in the read-through line is the point of FR-021d: a tick records that someone looked,
which cannot support SC-004's "0 claims lost". Naming what was compared can.

## Release gate (per delivery, after all 14 batches)

1. `node tools/validate.mjs` — 0 errors, 0 warnings across the whole library.
2. `node tools/check-refs.mjs kotlin-` — every ref URL still resolves.
3. Cut the release with the manifest tooling — **the only writer of `manifest.json`**:

```bash
node tools/sync-manifest.mjs --write --release 2026.08.18 \
  --summary "Kotlin questions reworded in plain, spoken English (70 items)." --date <YYYY-MM-DD>
```

4. `node tools/validate.mjs` again — gates 6, 10 and 11 only have something to say once the release
   exists. Gate 10 checks every ref on the 70 newly-stamped items against a 30-day window; gate 11
   checks `stackSnapshotChecked`.

**Dates are load-bearing (R-007).** The oldest Kotlin ref `checked` date is 2026-08-07, so gate 10's
window closes **2026-09-06**; `stackSnapshotChecked` is 2026-08-14, so gate 11's closes
**2026-09-13**. If a release would fall outside either, the fix is a genuine re-verification —
re-reading the primary source and re-dating `checked`, or re-verifying the `stackSnapshot` registry
and passing `--stack-checked`. Re-stamping a date to satisfy a gate without re-reading the source is
a Principle IV violation wearing a gate fix as a disguise.

**The checkpoint that keeps this from being discovered at the gate** (FR-022c). A deadline named in a
research note is not a control; something has to look at it while there is still time to act. So:
**before the final batch of each delivery is begun**, whoever is authoring it compares the projected
release date against both windows. Three outcomes, decided then rather than at the release gate:

| Projection | Decision |
|---|---|
| Comfortably inside both windows | proceed; no action |
| Inside either window's final week | finish the delivery now, or schedule the re-verification work **before** the release rather than hitting it as a blocked gate |
| Past either window | re-verification is required and is planned as its own work — 87 refs on 70 items, of which the 18 dated 2026-08-07 are the binding set |

The point of placing it before the *last* batch rather than at the release gate is that at the
release gate there is no time left to spend: the release is what is blocked.

Then repeat the whole delivery for `2026.08.19`. Per FR-022b, no release is cut mid-delivery: a
candidate never opens a Kotlin track that is half rewritten.
