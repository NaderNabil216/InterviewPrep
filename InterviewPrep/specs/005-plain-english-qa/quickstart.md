# Quickstart: Validating the Very Simple English Rewrite

**Feature**: `005-plain-english-qa` · **Spec**: [spec.md](./spec.md) · **Contracts**:
[register](./contracts/vse-register.md) · [batch gate](./contracts/batch-gate.md) ·
**Data model**: [data-model.md](./data-model.md)

This is a **validation guide**, not an implementation guide. It proves each batch and each release
correct end-to-end; the authoring itself is the tasks in `tasks.md`. Full mechanics live in the two
contracts — this page is the runnable sequence with the commands and the expected outcomes.

## Prerequisites

- Repo at `/Users/nn/InterviewPrep`, branch `feat/005-plain-english-qa` off `main`.
- Node ≥ 18 (only for `tools/` and the scope check).
- **Record the baseline revision once, before the first batch**: `git rev-parse HEAD` — write the
  hash into the first task record. Every read-through compares against this, never against the
  previous commit (R-001).
- The tree must validate clean before work starts:
  `node tools/validate.mjs` → `All good (0 warning(s))` at manifest `2026.08.19`.

## One batch, end to end (repeat ~90 times)

A batch = one pack file (the reference batch is the one multi-file exception). Commands:

```bash
# 0. BEFORE the batch — capture the warning baseline you will diff against:
cd /Users/nn/InterviewPrep
node tools/validate.mjs > /tmp/validate-before.log

# 1. Author: rewrite q + shortAnswer (all 3 bullets) for the pack's items,
#    held against the exemplars in contracts/vse-register.md, baseline text at hand.

# 2. Scope check (fails the batch on any change outside q/shortAnswer/updatedIn,
#    any id diff, any bullet-count change, any fenced block, any foreign file):
node InterviewPrep/specs/005-plain-english-qa/verification/scope-check.mjs content/packs/<file>.json

# 3. Screens:
#    3.1 preview collisions — sort the batch's questions by
#        stripMarkdown(q).slice(0, 40) and compare with every question on the same track
#        (an exact-prefix collision fails the batch; near-matches need the eye);
#    3.2 near-duplicate drift — diff the validator output (step 4) against the "before" log;
#        any newly flagged gate 8 pair is adjudicated NOW into
#        .claude/workflows/duplicates.json with verdict + reason.

# 4. Validator — exit 0 AND no new warning vs /tmp/validate-before.log:
node tools/validate.mjs
```

**Expected outcome of step 4**: `All good (0 warning(s))`, and the diff against the "before" log
shows no new line. Any gate-8 warning that *is* new must already have been adjudicated in step 3.2.

**Then the human step — the two-question read-through (FR-020), per item, against the baseline
text:**

1. *Is it still true?* — every claim of the pre-rewrite field present (V1, V6, V13). Count the
   claims compared; name the source-to-claim mapping.
2. *Does it read simple?* — reads like the exemplars' targets, not the "not the target" versions
   (FR-002); non-qa items keep their task/scenario/reference form (V17).

**Then the record** (inline under the batch's task, per batch-gate.md "Recorded outcome"):
validator delta + diagnosis, scope-check result, screens' outcomes + any adjudicated pair, per-item
claims compared, source-to-claim mapping, `q.length` and bullet word counts vs baseline, any
FR-008a/FR-012a exception with reason, and (non-qa) the per-item verdict **simplified** /
**already simple**.

**Then commit the batch on its own** (content edits only).

**Manual spot-check (optional per batch, mandatory once per release):** serve the site
(`bash tools/serve.sh`), open a rewritten item: question page renders the new `q`, reveal shows 3
bullets, deep answer, code and sources unchanged; prev/next buttons show distinguishable truncated
prefixes; search finds the item under its new wording; a drill card shows the new question.

## One release, end to end (per track, after the track's last batch)

```bash
cd /Users/nn/InterviewPrep
node tools/validate.mjs                     # 0 errors, 0 warnings
node tools/check-refs.mjs <track>           # e.g. kotlin / dsa / system-design — the bare track
                                            # name, not a trailing hyphen: the tool matches pack
                                            # filenames by substring, and "dsa-" misses dsa.json
# gate 13 audit: validator names up to 10 version-claim items shipped by the release —
# audit each claim against its retained source and record the audit (FR-014 evidence)
node tools/sync-manifest.mjs --write --release 2026.08.20 \
  --summary "Questions and short answers reworded in simple English (70 items)." --date <YYYY-MM-DD>
node tools/validate.mjs                     # gates 6/10/11/13 speak only once the release exists
```

**Expected outcomes**: first run `All good`; `check-refs` passes; sync-manifest reports
`Manifest version -> 2026.08.20`; the post-release validate reports `✓ gate 10 every ref on items
shipped by … verified within 30 days` and `✓ gate 11 stackSnapshot re-verified`, and names the gate
13 audit population.

**Before the final batch of each track** — the calendar checkpoint (R-007): project the release
date and compare with the track's windows (≤ **2026-09-06** for the ten tracks with oldest ref
2026-08-07; ≤ **2026-09-08** for `build-testing`/`dsa`/`system-design`; every release ≤
**2026-09-13** for gate 11). Record the decision: proceed / finish now / re-verify the track's refs.

**Per-release manual verification (SC-008):** with pre-feature progress in the browser (a rated
item, a plan with ticks, a note), load the site after the sync toast — ratings, due dates, notes
and plan ticks must be intact, and the rewritten track's items show the `UPD` chip on Topics.

## Feature completion

```bash
cd /Users/nn/InterviewPrep
node tools/validate.mjs --final    # gates 4/5/8/9/12 promoted to errors — must still exit 0
```

Plus the bookkeeping proofs (all recorded, not recalled): the id set of all 89 packs matches the
recorded baseline byte-for-byte (SC-005); all 90 batch records present with evidence-form
read-throughs; every non-qa item carries a verdict (SC-007); every release registered with its
summary and audit (FR-024); the `.claude/workflows/duplicates.json` ledger holds every adjudicated
pair with a verdict and reason (SC-006).

## What these validations prove (mapping to success criteria)

| Validation | Proves |
|---|---|
| Scope check per batch | SC-005 (ids byte-identical), FR-015 (3 bullets), FR-018 |
| Zero-new-warnings validator delta per batch | FR-019, FR-019a |
| Preview screen per batch | FR-007 (distinguishable at 40 chars) |
| Gate 8 adjudication in-batch | SC-006 (0 unadjudicated pairs) |
| Read-through record (claims + source-to-claim + lengths) | SC-001..SC-004 (claims preserved, register applied, bound exceptions recorded) |
| Non-qa verdicts per batch | SC-007 (84/84 reviewed) |
| Release gate + gate 13 audit + windows checkpoint | FR-024, SC-004, gates 10/11 |
| Browser check with pre-feature progress | SC-008 (no state touched) |
