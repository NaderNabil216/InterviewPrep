# Contract: The Batch Gate and the Release Gate

**Feature**: `005-plain-english-qa` · **Spec**: [../spec.md](../spec.md) · **Research**:
[../research.md](../research.md) (R-002, R-005, R-007..R-012) · **Register**:
[./vse-register.md](./vse-register.md) · **Data model**: [../data-model.md](../data-model.md)

This is the acceptance contract — the interface between a batch of rewritten prose and the commit
that records it. One batch = **one pack file** (the cross-track reference batch is the single
exception, R-003). 90 batch records total: the reference batch + 89 pack-batches. Every batch is
committed on its own, and its record is written inline under its task in `tasks.md`.

## The batch gate — four steps, in order, before commit

### Step 1 — validator

```bash
cd /Users/nn/InterviewPrep && node tools/validate.mjs
```

Required: **exit 0 and no new warning**, where "new" means against a run recorded **immediately
before this batch** (FR-019a) — not against a remembered figure. The tree stood at
`All good (0 warning(s))` on 2026-08-18 at manifest `2026.08.19`; several gates are date-relative,
so the clean baseline is an assumption with a shelf life. Capture the "before" run, diff, and
**diagnose any new warning rather than merely counting it**:

| New warning | Cause | Remedy |
|---|---|---|
| gate 8, unadjudicated near-duplicate | two questions drifted together under the rewrite (V16) | adjudicate the pair now, in this batch, with verdict + reason (step 3.2) |
| anything else | a real defect — the batch touched a frozen field, or the register broke content | fix the batch; do not paper over it |

Gate 2b cannot fire: `answer` is frozen in this feature.

### Step 2 — scope check

Only the fields this feature owns changed; the pack's id set is identical; no file outside the
batch's packs moved; `shortAnswer` is still exactly 3 bullets. Implemented as
`specs/005-plain-english-qa/verification/scope-check.mjs`, adapted from 004's `scope-check.mjs`
(which was adapted from 002's `fielddiff.mjs`), created in Phase 2:

```bash
node InterviewPrep/specs/005-plain-english-qa/verification/scope-check.mjs <content/packs/<file>.json>
```

The check compares the pack against `git HEAD` and fails the batch on: any id added or removed; any
diff outside `{q, shortAnswer, updatedIn}`; any `shortAnswer` length ≠ 3; any ` ``` ` in `q` or
`shortAnswer`; any file outside the batch's packs touched since the previous commit. The reference
batch spans several files: the check runs once per touched file.

Note which baseline each check uses, because they differ and the difference matters:

| Check | Compares against | Why |
|---|---|---|
| Scope check (this step) | `git HEAD` | "What did *this batch* touch?" — a question about the working tree |
| V1, V3, V9, V11 (step 4) | the **recorded feature baseline** (R-001) | "What did *this feature* change?" — by batch 40, HEAD is full of the feature's own output |

### Step 3 — screens (both are assists to step 4, not gates in their own right)

1. **Question-preview collisions (V10, R-005).** Sort the batch's rewritten questions by
   `stripMarkdown(q).slice(0, 40)` — normalised exactly as `item.js:88-89` — and compare each
   prefix against **every other question on the same track**. An exact-prefix collision is an
   alarm; near-matches still need the eye, because V10's standard is that a reader can tell two
   questions apart, not that the strings differ (FR-007).
2. **Near-duplicate drift (V16, R-008).** Confirm gate 8 flagged no new pair. This screen is
   **library-wide, not track-local**: gate 8 scores every question against every other across all
   629 items, so a rewritten question can collide with one on another track. Any new pair is
   adjudicated in this batch — verdict (`distinct` / `merged` / `accepted`) and reason appended to
   `.claude/workflows/duplicates.json` — never deferred to the end of the feature.

### Step 4 — the named human read-through (FR-020)

Performed by whoever authored the batch, per item, against the **recorded baseline text** — never
from memory of having written it (the failure mode is recognition, not honesty). Two questions,
answered separately; the batch passes only if both hold for every item:

1. **Is it still true?** Claim-by-claim comparison with the baseline field (V1, V3, V6, V13). This
   is mechanical *in kind* — the reviewer diffs meaning, not taste — which is what makes SC-002
   checkable at all without a test suite.
2. **Does it read simple?** The rewrite reads like the exemplar's target version, not like its
   "not the target" version (FR-002), and on the non-qa tier preserves its task/scenario/reference
   form (V17).

These fail **independently**: text can be perfectly accurate and still hard to parse, and it can
sound friendly while having quietly dropped a caveat.

**On failure** (FR-020): the *batch* fails, not the item. It is reworked in place and re-submitted
to the whole gate — all four steps re-run, every item re-read, not just the one that failed. There
is no per-item exception and no splitting the batch so the passing items proceed. The one thing that
is *not* a failure: a recorded exception under FR-008a (question length) or FR-012a (bullet word
bound), which is an advisory with a record line, decided by the "preservation wins" rule, not by
taste.

**On self-review**: the author and the reviewer are the same person, and this feature has no
independent check on its two highest-risk criteria. That is accepted, not overlooked — steps 1–3
shrink what is left to judgement, the reference batch fixes the standard before the bulk of the
work (FR-026), and the evidence-form record makes each read-through auditable.

**Effort**: 629 questions and 1887 bullets, each compared claim-by-claim, plus 84 non-qa verdicts.
Per-pack the read is small (2–11 items); across 90 batches it is the largest single cost in the
feature and the one most likely to be compressed under time pressure. It is planned as its own step
with its own record, not as something done while committing.

### Recorded outcome (FR-023, R-012)

Each batch record, inline under its task, contains:

- pack file, item ids, batch kind (qa tier / non-qa tier);
- validator result: errors, warnings, and the delta against the run recorded immediately before the
  batch — with a diagnosis for any new warning, not just a count (FR-019a);
- scope-check result;
- screens: preview-collision outcome; any near-duplicate pair adjudicated, with verdict and reason
  (V16);
- read-through, as evidence rather than as a tick: per item, the **number of claims compared** and
  any that needed a decision; the **source-to-claim mapping** from V6 (which retained ref supports
  which surviving claim); and any mismatch repair with its reason;
- lengths: per item, question `q.length` new vs baseline (V9) and per bullet word count new vs
  baseline (V11) — so drift is visible across batches, not only at the end;
- any recorded exception under FR-008a / FR-012a with item id and reason;
- non-qa batches additionally: per-item verdict — **simplified** or **already simple** (FR-017a).

The distinction between a tick and evidence is the point of FR-023: a tick records that someone
looked, which cannot support SC-002's "0 claims lost". Naming what was compared can.

## Release gate (per track, after the track's last batch)

1. `node tools/validate.mjs` — 0 errors, 0 warnings across the whole library.
2. `node tools/check-refs.mjs <track>` — every ref URL of the track still resolves. Use the bare
   track name (`kotlin`, `dsa`, `system-design`), not a trailing hyphen: the tool matches pack
   *filenames* by substring, and a hyphenated filter misses the hyphen-less base packs
   (`dsa.json`, `system-design.json`, `build-testing.json`, …).
3. **Gate 13 audit** — the validator names up to 10 version-claim items shipped by the release;
   audit each: the version/date claim survives in the rewritten text (V1) *and* is still supported
   by the item's retained ref (V6). Record the audit with the release task.
4. Cut the release with the manifest tooling — **the only writer of `manifest.json`**:

```bash
node tools/sync-manifest.mjs --write --release 2026.08.20 \
  --summary "Questions and short answers reworded in simple English (70 items)." --date <YYYY-MM-DD>
```

5. `node tools/validate.mjs` again — gates 6, 10, 11 and 13 only have something to say once the
   release exists. Gate 10 checks every ref on the newly-stamped items against the 30-day window;
   gate 11 checks `stackSnapshotChecked`; gate 13 names the audit population.

**Dates are load-bearing (R-007).** Per track, the release date must be ≤ the track's gate-10
window (≤ **2026-09-06** for the ten tracks whose oldest ref is `checked` 2026-08-07; ≤
**2026-09-08** for `build-testing`, `dsa`, `system-design`, whose oldest is 2026-08-09) and every
release must be ≤ **2026-09-13** for gate 11. If a release would fall outside a window, the fix is
a genuine re-verification of that track's refs — re-reading the primary sources and re-dating
`checked`, or re-verifying the `stackSnapshot` registry and passing `--stack-checked`. Re-stamping
a date to satisfy a gate without re-reading the source is a Principle IV violation wearing a gate
fix as a disguise.

**The checkpoint that keeps this from being discovered at the gate.** Before the **final batch of
each track** is begun, compare the projected release date against the track's windows and record
the decision:

| Projection | Decision |
|---|---|
| Comfortably inside both windows | proceed; no action |
| Inside either window's final week | finish the track now, or schedule re-verification before the release |
| Past either window | re-verification is required and is planned as its own work, before the release |

The point of placing it before the *last* batch rather than at the release gate is that at the
release gate there is no time left to spend: the release is what is blocked.

**Release summaries** say plainly what changed (FR-024): qa track — *"Questions and short answers
reworded in simple English (N items)."*; non-qa track — *"Task prompts and descriptions simplified
(N items)."* — and a non-qa track whose every item was recorded "already simple" ships **no
release at all** (R-011): no edit, no stamp, no version bump.

**If the calendar tightens**: two *completed* tracks may coalesce into one release (R-007), both
tracks' items carrying the same `updatedIn` and one `releases[]` entry naming both. This stays
inside FR-024. It is the fallback, not the plan.

## What a passing feature looks like (final gate)

- All 90 batch records present, each with evidence-form read-through, screens, lengths, exceptions
  and (non-qa) verdicts;
- `node tools/validate.mjs` exits 0 and reports **0 warnings**;
- `node tools/validate.mjs --final` exits 0 — gates 4, 5, 8, 9 and 12 promoted to errors;
- `node tools/check-refs.mjs` passes for every touched track;
- the id set is byte-identical to the recorded baseline (SC-005);
- every item on every qa track carries the register; every non-qa item carries a verdict (SC-007);
- each release registered through `sync-manifest.mjs` with its audit recorded (FR-024).
