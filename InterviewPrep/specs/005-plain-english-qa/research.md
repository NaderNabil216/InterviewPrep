# Phase 0 Research: Very Simple English for Questions and Short Answers

**Feature**: `005-plain-english-qa` · **Plan**: [plan.md](./plan.md) · **Spec**: [spec.md](./spec.md)

Every figure below was measured against the working tree at manifest `2026.08.19` (004's answer
delivery, the feature's starting point) on 2026-08-18, not recalled. The commands that produced them
are reproducible from `/Users/nn/InterviewPrep`.

The spec left no `NEEDS CLARIFICATION` markers — scope decisions are all recorded. What Phase 0 had
to resolve was the set of questions that only measurement answers: how long are the questions, how
long are the bullets, how many will the word bound actually bind, how many releases fit inside the
ref-freshness windows, and what the rewrite will do to the library's near-duplicate screen.

---

## R-001 — The fixed baseline (FR-021): the concurrency carve-out is moot

**Decision**: the feature baseline is the working tree at feature start, recorded once by revision
hash. For every track — including Kotlin — the claim baseline **and** the starting text are the
same: current `main` content. The comparison rule from FR-021's second sentence survives (Kotlin's
starting text is 004's shipped output); the *exception* it was written for does not.

**Rationale**: FR-021 defines the baseline as "the content as it stood when the feature began" and
adds a special rule for the Kotlin track "whose questions 004 rewrites concurrently" — the claim
baseline there being the pre-004 original. That concurrency is over: 004's question delivery
(`2026.08.18`) and answer delivery (`2026.08.19`) are both merged on `main` (`fef2e12`), the
manifest now reads `2026.08.19`, and 005 begins from exactly the state the spec's Assumptions say it
begins from ("004's content deliveries land before 005's Kotlin batches begin"). There is no
concurrent editing partner, so there is no need for a second baseline: current `main` is both the
starting text and the claim baseline, for all 13 tracks. The reviewer compares every batch against
this single recorded revision (004 did the same: its baseline was `727b5a0`, recorded once).

Practical consequence: the baseline revision is `git rev-parse HEAD` **at the moment the first batch
begins** (that is, after the 005 branch exists and before any content edit lands on it), written into
the first task record. Everything in FR-011/FR-013/FR-023 ("the pre-rewrite text") then refers to it
unambiguously. A reviewer must not compare against the previous *commit* — by batch 40, HEAD is full
of 005's own output.

---

## R-002 — The batch model: one pass per pack, both fields, 89 packs

**Decision**: a batch is **one pack file**, and each batch rewrites **both** owned fields (`q` and
`shortAnswer`) of every item in it in a single pass. 73 qa packs + 16 non-qa packs = **89 batch
records**, each committed on its own, preceded by the cross-track reference batch (R-003) = **90
commits** of content. No pack is visited twice.

**Rationale**: the spec's rhythm is "per-pack batches" (FR-019) and its release rule is "a track's
release covers both fields for every item on the track at once" (FR-024) — neither says the two
fields must be separate deliveries. 004 needed two deliveries because its two halves had different
owners and different risks (questions vs answers+traps+follow-ups+captions). Here both fields are
the same register, judged against the same two exemplars in the same read-through; splitting them
would double the gates and the record-keeping without buying anything. One pass per pack keeps the
scope check simple (one allowed-field set), keeps the "before" run meaningful (each pack is gated
once against the immediately-preceding validator state), and lets a track's release come as soon as
its last pack passes.

Pack census (registered packs, 89 total; all carry exactly 3 bullets per item today):

| Track | Items | Packs | Batch count |
|---|---|---|---|
| kotlin | 70 | kotlin-a(8) b(5) g-1..g-11(5 each) g-12(2) | 14 |
| compose | 75 | a(6) b(2) c(3) g-1..g-7 | 10 |
| platform | 60 | (6) b(4) g-1..g-5 | 7 |
| architecture | 50 | (4) b(3) g-1..g-5 | 7 |
| build-testing | 60 | (2) g-1..g-6 | 7 |
| security-kmp | 70 | (3) g-1..g-7 | 8 |
| coroutines-flow | 55 | a(8) g-1..g-5 | 6 |
| data-networking | 40 | (4) g-1..g-4 | 5 |
| performance | 40 | (3) g-1..g-5 | 6 |
| behavioral | 25 | (3) g-1 g-2 | 3 |
| **qa subtotal** | **545** | | **73** |
| dsa | 60 | (6) b(8) c(5) g-1..g-6 | 9 |
| system-design | 19 | (3) b(2) g-1..g-3 | 5 |
| cheatsheets | 5 | (3) b(2) | 2 |
| **non-qa subtotal** | **84** | | **16** |
| **Total** | **629** | **89 packs** | **89 batches** |

The 16 non-qa packs are small (2–8 items each) and their batches run the identical gate — the
difference is only the register tier applied (R-011), not the mechanics.

---

## R-003 — The reference batch (FR-026): cross-track, shape-varied, authored first

**Decision**: the first batch is a **cross-track set of 10 items, one per kind of shape**, chosen to
span the register's hardest cases, authored and accepted before any per-pack batch. It is not
aligned to a pack: it edits several files in one commit, and the scope check runs per touched file.

**Rationale**: FR-026 demands a reference batch "across different tracks, chosen for their shape
variety" so later batches are judged against worked examples over *real* item shapes, not just the
two abstract exemplars. The shapes that stress the register, with concrete homes:

| Shape stress | Example candidate |
|---|---|
| Scenario-length question (the longest in the library, 215 chars) | `ar-0001` (architecture, "layered architecture / MVVM vs MVI") — must come down hard without losing the substance |
| Two-part question | `dn-0001` (interceptors + token refresh), `pf-0007` (launch modes + when they matter) |
| Code-span-heavy question | any `kt-` item — 004's register already, simplifies further |
| Version-claim bullet (FR-014 binding both ways) | `bt-0001` ("AGP 9 (Jan 2026)… AGP 9.3 is current as of Jul 2026") |
| Qualifier-heavy bullet near the 25-word bound | measured >25w bullets (R-006) — e.g. `sk-0001`'s TEE/StrongBox bullet |
| Non-qa: DSA task prompt (form must survive) | `ds-0001` (Two Sum) |
| Non-qa: design scenario (scenario form) | `sd-0000` (the framework item) |
| Non-qa: cheat-sheet description (reference form) | `cs-0001` (version matrix) |
| Behavioral scenario (direct address in the second person) | `bh-0001` (STAR story bank) |
| A bullet whose deep answer was rewritten by 004 (mismatch-repair edge) | any `kt-` bullet read against its `answer` |

Ordering inside the batch: qa items first (they set the register's full register), non-qa items
last (they set its half). **10 items is a single working session of read-through** — small enough to
review honestly, large enough to span every shape the 89 pack-batches will meet. The reference batch
is the secondary authority per FR-026; the exemplars win on conflict.

---

## R-004 — Question lengths: the no-growth rule and its measure

**Decision**: FR-008 is enforced on **raw `q.length`** — the rewrite may not exceed the original's
character count, and a longer rewrite is reworked, with the exception recorded. The 40-character
preview (R-005) is a separate screen with its own normalisation.

**Rationale**: measured over all 629 questions:

- **qa**: 34–215 chars, median 85. Longest: architecture (215, a behavioral-style scenario — the
  spec's own edge case), then build-testing (189), security-kmp (168), coroutines-flow (163).
- **dsa / design / concept**: 13–68 chars, median 45 — already task-shaped and short.

Raw `q.length` is the right measure because code-formatted spans must survive **spelled identically**
(FR-004), so markdown characters are stable content, not noise; and because the reviewer's editor
shows exactly this number. `stripMarkdown` exists only for rendering surfaces (search rows, the
prev/next button) and must not be imported into the gate. The 5 character-overflow cases expected
(simple rephrases occasionally need an extra word) all take the recorded-exception path — the rule
is "rework first", and its spirit is that a candidate never meets a longer wall of text than the one
that already existed.

---

## R-005 — The 40-character preview screen: track-scoped, mechanical, an assist

**Decision**: a per-batch screen computes `stripMarkdown(q).slice(0, 40)` — exactly what
`item.js:88-89` renders on the prev/next buttons — for the batch's rewritten questions and compares
the prefixes against **every other question on the same track** (not just the batch's pack). An
exact-prefix collision fails the batch; near-matches go to the human eye. The screen is a review
assist, not a validator gate.

**Rationale**: FR-007 is about one control (`item.js:88-89`, which strips backticks and `*` then
cuts 40 chars), and that control navigates **within a track** — the prev/next pair are the item's
track neighbours. 539 of 545 qa questions are longer than 40 chars today, so truncation is the norm,
and VSE will make the norm harder: the register replaces distinguishing phrasing with common
openings ("What is…", "When do you…"). The subject must land inside the prefix. The screen is cheap
(one sort by prefix per batch) and catches exactly the failure FR-007 names — two neighbours that
become indistinguishable at 40 chars. The handful of questions at or under 40 characters (6 of 545,
raw) are their own prefix: an exact-prefix collision there means two identical questions, which
gate 8 flags independently — the screen still runs on them, and its verdict folds into the gate 8
adjudication rather than standing alone.

---

## R-006 — Bullet word counts: the bound will bind, and the data says where

**Decision**: the 25-word bound (FR-012) is measured with **the validator's own normative counter**
(`tools/validate.mjs` — `words()`, `[A-Za-z0-9'`_-]+` runs over the raw bullet). It is a review
signal with a recorded-exception path, never a gate (FR-012a). The ~18-word *sentence* signal from
the floor rules is per sentence (split on `.?!`), since bullets routinely carry two sentences. The
count is fully mechanical: code-formatted spans and symbol-bearing tokens count exactly as the
regex tokenizes them over the raw bullet text — a backtick-delimited identifier contributes its
tokens as the regex sees them (`` `String?` `` tokenizes as `` `String `` + `` ` ``), with no
manual adjustment or discounting.

**Rationale**: measured over all 1887 bullets (figures re-verified on 2026-08-18 against the
committed tree `fef2e12`, manifest `2026.08.19`, with the validator's counter — they supersede the
first-pass measurement taken while planning):

| Track | Bullets | >18w | >25w |
|---|---|---|---|
| architecture | 150 | 141 | **90** |
| build-testing | 180 | 173 | **100** |
| data-networking | 120 | 118 | **71** |
| platform | 180 | 168 | **70** |
| kotlin | 210 | 152 | 34 |
| security-kmp | 210 | 204 | 8 |
| performance | 120 | 103 | 25 |
| coroutines-flow | 165 | 50 | 10 |
| compose | 225 | 56 | 4 |
| behavioral | 75 | 27 | 1 |
| dsa | 180 | 123 | 7 |
| system-design | 57 | 57 | 3 |
| cheatsheets | 15 | 0 | 0 |
| **Total** | **1887** | **1372 (73%)** | **423 (22%)** |

The qa tier accounts for 413 of the over-bound bullets (25.3% of its 1635); the remaining 10 sit on
the plain-words tier (7 dsa + 3 system-design).

Two readings. **The bound is not decorative**: more than a fifth of the library's bullets must
lose substantial length, and on three tracks (architecture, build-testing, data-networking) more
than half of all bullets are over, with platform close behind (39%). **The register has the budget
to pay for it**: the floor rules
(one idea per sentence, everyday words, no filler/hedging, active voice) remove the formal
connectives and passives 002 left in ("…are stored in…", "…is verified during…"), and the 73%
above-18-words figure shows the sentence-splitting work is the bulk of it — splitting alone
usually lands a bullet under 25 words, and splitting is *the* register change, not a content
deletion. Where a caveat genuinely cannot survive inside the bound, FR-012a wins: the bullet stays
longer and the exception is recorded. Never is a claim deleted to fit the number.

The dsa/system-design numbers matter too: those 10 over-bound bullets (7 dsa + 3 system-design) sit
on the **plain-words tier** (R-011), where the conversational half of the register does not apply —
but the word bound still binds, because FR-017 now binds FR-011/FR-012/FR-012a/FR-013/FR-014 onto
non-qa fields and the bound is part of the register's floor rules, not its conversational layer.

---

## R-007 — The release train: 13 tracks, one clock, named checkpoints

**Decision**: one release per track, versions `2026.08.20` … `2026.08.32`, each cut with
`tools/sync-manifest.mjs --write --release <v> --summary "…" --date <YYYY-MM-DD>`. Per track, the
release date must be ≤ the track's own gate-10 window; all releases must be ≤ **2026-09-13** for
gate 11. **Before each track's final batch is begun**, the projected date is checked against the
windows and a decision recorded — the checkpoint pattern 004 proved (its FR-022c), placed where
there is still time to act.

**Rationale**: gate 10 examines only the items the *current* release touches (`updatedIn ===
manifest.version`), so the window is per-track. Measured ref `checked` dates:

- **10 tracks** (architecture, behavioral, cheatsheets, compose, coroutines-flow,
  data-networking, kotlin, performance, platform, security-kmp): oldest ref **2026-08-07** →
  gate 10 closes **2026-09-06**.
- **3 tracks** (build-testing, dsa, system-design): oldest ref **2026-08-09** → gate 10 closes
  **2026-09-08**.
- Gate 11 (`stackSnapshotChecked` 2026-08-14) binds every release: ≤ **2026-09-13**.

So the calendar is: thirteen releases inside 19 days (to 2026-09-06). That is a real schedule — one
cut roughly every 1.5 days — and it is the feature's softest constraint, which is exactly why it
must be a checkpoint rather than a hope. Three resolutions, decided per track before its last batch:

| Projection | Decision |
|---|---|
| Comfortably inside both windows | proceed; no action |
| Inside either window's final week | finish the track now, or schedule re-verification before the release |
| Past a window | **re-verify that track's refs** — `node tools/check-refs.mjs <track>` probes liveness (bare track name — a trailing hyphen misses the hyphen-less base packs), but gate 10's `checked` date asserts the claim was *re-read*; re-stamping a date without re-reading the primary source is a Principle IV violation dressed as a gate fix. A track's own refs are the whole of its exposure: 25–135 refs per track |

The version sequence follows the manifest tooling: `sync-manifest.mjs` prepends one release per
call and refuses duplicates; `2026.08.20` follows `2026.08.19` in the strictly-descending numeric
comparison gate 6 requires. **Release summaries** (what the sync toast shows, per FR-024 — "say
plainly what changed"):

- qa track: *"Questions and short answers reworded in simple English (N items)."*
- non-qa track: *"Task prompts and descriptions simplified (N items)."* (only if ≥1 item was
  touched — R-011)

**Coalescing escape hatch**: if the calendar tightens, two *completed* tracks may share one release
date and one `releases[]` entry (the tool accepts one version per call; the items of both tracks
carry that same `updatedIn`). This stays within FR-024 ("a track's release ships only when every
item on that track has both fields rewritten" — both tracks are complete) and reduces the number of
clock-ticking releases. It is the fallback, not the plan: per-track releases keep the summary honest
about what a candidate's `UPD` chip (topics renders it when `updatedIn === snapshot.version`)
means.

Gate 13 adds a per-release human audit: it names up to 10 version-claim items shipped by the current
release for a source-support check. That is FR-014's evidence on the release boundary, and each
release's audit is recorded with the release task.

---

## R-008 — The rewrite perturbs gate 8, and the volume will be real

**Decision**: gate 8's near-duplicate screen is an output of **every** batch. After each batch,
`screened` pairs across all 629 items are checked; any pair the batch newly flags is adjudicated in
that batch — verdict (`distinct` / `merged` / `accepted`) and reason appended to
`.claude/workflows/duplicates.json` (currently 0 entries, 0 flagged pairs today). No new pair is
ever deferred.

**Rationale**: gate 8 (`validate.mjs:439-449`) tokenizes `item.q`, drops a 50-word stoplist, and
flags pairs above a 0.6 Jaccard threshold **library-wide**. 004's R-015 established the direction of
the effect when 70 questions were rewritten; 005 rewrites **545** — every qa question in the
library. VSE replaces distinguishing terse phrasing with common words, the tokenizer discards the
commonest of those as stopwords, and the token sets shrink toward the shared vocabulary. Expect
flagged pairs to appear, including **cross-track** pairs (a rewritten data-networking question
colliding with a rewritten security-kmp one — no screen is track-filtered).

Two properties force in-batch adjudication rather than end-of-feature: gate 8 is `staged()` —
warning during stages, **error at `--final`** — so the natural discovery point is after ~90
batches of work, and by then no one can reconstruct why two questions ended up alike. In-batch it
costs a minute and the reason is still fresh. The ledger format is already enforced by gate 8
(verdict ∈ {distinct, merged, accepted} + a reason), so the only new discipline is *when*: with the
batch that caused the flag, not at the end.

---

## R-009 — The batch gate: validator, scope check, screens, read-through

**Decision**: four steps per batch, in order, all required before commit — the structure 004 proved
(R-008 there), re-parameterised for this feature's field set:

1. `node tools/validate.mjs` — exit 0 **and no new warning** vs the run recorded immediately before
   this batch (FR-019a). Expected new-warning classes and their remedies: only gate 8 pairs (R-008).
   Gate 2b cannot fire — `answer` is frozen.
2. **Scope check** — new `specs/005-plain-english-qa/verification/scope-check.mjs` adapted from
   004's: diffs the pack against `git HEAD`; allowed to differ: `q`, `shortAnswer`, `updatedIn`;
   must be identical: everything else, including **bullet count = exactly 3** (FR-015, FR-018),
   item id set, `answer`, `traps`, `followUps`, `code`, `refs`, `level`, `topic`, `tags`, `addedIn`,
   `type`, `track`; no fenced block in either field (gate 15 covers both, so this is inherited, not
   re-implemented). Reference-batch commits span several files; the check runs per touched file.
3. **Screens** — the 40-character preview screen (R-005, track-scoped) and the gate 8 near-duplicate
   screen (R-008, library-wide). Both are assists that produce the read-through's inputs.
4. **The two-question human read-through** (FR-020) — per item, against the **recorded feature
   baseline** (R-001), never against memory: *is it still true?* (every claim of the pre-rewrite
   field still present; FR-011/FR-013/FR-014) and *does it read simple?* (reads like the exemplar's
   target, not like its "not the target" version; FR-002). A batch where either fails for any item
   is reworked in place and re-submitted to the whole gate — there is no per-item exception and no
   splitting of batches.

**Rationale**: the read-through is the only defence against the feature's gravest failure mode — a
sentence made simpler that quietly stopped being true or dropped the only claim a source supported
(FR-020 names it). Steps 1–3 exist to make step 4 affordable: the reviewer never has to verify that
ids survived, that no other field moved, or that the batch broke nothing mechanical. The scope-check
script is the third generation of a pattern (`002`'s `fielddiff.mjs` → `004`'s `scope-check.mjs`);
it lives in the Spec Kit's `verification/` directory, keeping the app's no-tooling posture intact.

---

## R-010 — Exceptions: how FR-008 / FR-012 collisions are recorded, not hidden

**Decision**: three kinds of recorded exceptions exist, each with its own record line and none
silent: (a) **word-bound** (FR-012a) — a bullet stays over 25 words because a qualifier cannot
survive inside the bound; (b) **length** (FR-008, FR-008a) — a question stays longer than its
original because simple phrasing genuinely costs more characters; (c) **mismatch repair** (the
spec's edge case on bullets that stop matching their deep answer) — the short answer is repaired to
match its item's `answer` and the repair is recorded. The batch record carries item id + reason for
each. The exception path is unbounded by design — there is no cap and no trend gate, because
preservation always wins over a bound — but it is never silent: every exception names item and
reason, and the batch record's length figures (R-012) make erosion visible across batches, which is
the guardrail (SC-001 and SC-003 count recorded exceptions; they do not cap them).

**Rationale**: the spec's edge cases are explicit that preservation wins over every bound and that
exceptions are "recorded with their reason — never left as an unexplained growth" (FR-008) and
"never delete a caveat to fit a word count" (FR-012a). What is *not* an exception: anything that
reads like the "not the target" exemplar (fails step 4), anything that drops a claim (fails step
4), any bullet-count change (fails step 2). The record format (R-012) makes exceptions visible in
the same place as the claims they protect, so the reviewer's second question — "is the bound being
eroded quietly?" — is answerable from the record at any point mid-feature.

---

## R-011 — The non-qa tier: half the register, full gate, per-item verdicts

**Decision**: the 84 non-qa items (60 dsa, 19 design, 5 concept) are rewritten under the
**plain-words / short-sentences half** of VSE only — no direct address, no chat tone, task/scenario/
reference form preserved (FR-016) — and every item ends the feature with a verdict: **simplified**
or **already simple** (FR-017a: "reviewed, no change needed" is a verdict, not an omission). A
non-qa track ships a release only if at least one of its items was touched; untouched items keep
their `updatedIn` and no release is cut for that track.

**Rationale**: US3 is explicitly the clarity half of the feature ("a smaller one" than the qa
story), and the spec's tiering is by item kind, not by authoring convenience. Measured on today's
content: dsa questions run 21–90 chars and their bullets are already terse and task-shaped —
`ds-0001`'s "Walk the array once, storing value to index in a `HashMap`" is close to the plain-words
standard already. The honest expectation is a mixed verdict distribution: some items simplify, some
are recorded already-simple. FR-017a exists precisely so that "none of these needed anything" is
*evidence* (every item has a verdict) rather than a claim about effort. The full four-step gate
still runs on every non-qa batch — including the word bound (R-006's dsa/system-design rows) and
the preview screen — because FR-017 binds FR-011/FR-013/FR-014 to these fields.

---

## R-012 — The batch record: evidence, not ticks (FR-023)

**Decision**: each batch's record (inline under its task in `tasks.md`) contains, per item: the
claim count compared against the baseline, the source-to-claim mapping (which retained `refs[]`
entry supports which surviving claim — the FR-014 both-directions check, named), any recorded
exception (R-010) with its reason, the bullet word counts and question lengths (new vs baseline, so
drift is visible across batches), the two screens' outcomes and any adjudicated near-duplicate pair,
the validator delta (diagnosis for any new warning), and the scope-check result. The non-qa
verdict (simplified / already simple) replaces the claim count's role on US3 batches.

**Rationale**: SC-002 ("0 claims lost") cannot be supported by a tick that records that someone
looked; it is supported by records that name what was compared (FR-023's own wording: "'0 claims
lost' is supported by evidence, not by assertion"). 004 proved the format in its task records; the
only additions here are the two length figures (question chars and bullet words against baseline),
because this feature's bounds are on those, and the non-qa verdict line, because FR-017a demands a
verdict where 004 had none.

---

## R-013 — Track ordering: Kotlin first, non-qa last, releases as tracks complete

**Decision**: the authoring order is: reference batch (R-003) → the 10 qa tracks (kotlin first, then
compose, coroutines-flow, platform, build-testing, security-kmp, architecture, data-networking,
performance, behavioral) → the 3 non-qa tracks (dsa, system-design, cheatsheets). A track's release
is cut when its last batch passes; the calendar checkpoint (R-007) runs before each track's final
batch.

**Rationale**: the spec binds no order, but three considerations do. (1) **Kotlin first**: it is the
one track whose questions are already in a spoken register (004's delivery), so its first batch is
the cheapest and it answers early the question that defines the whole feature — what "simpler
still" means over 004's output — while the reference batch is fresh. It also keeps 005 clear of
004's still-recent answers. (2) **Front-load the heavily-trafficked qa tracks** (compose,
coroutines) so the releases with the widest candidate exposure ship early and the calendar clock
(R-007) has slack when the largest word-bound loads (architecture, build-testing, data-networking,
platform — R-006) arrive. (3) **Non-qa last**: P2 priority, smallest exposure, and the verdict-heavy
work (R-011) is also the lowest-risk — it should not delay a single qa release. The order is a
plan-level commitment; the batch-by-batch sequence inside it is fixed in `tasks.md`.

---

## Consolidated decisions

| # | Decision | Drives |
|---|---|---|
| R-001 | Fixed baseline = `git HEAD` at feature start, recorded once; FR-021's Kotlin carve-out is moot (004 merged) | FR-021, FR-020 |
| R-002 | Batch = one pack, both fields, one pass; 89 pack-batches | FR-019, FR-018 |
| R-003 | Reference batch: 10 cross-track items spanning shape extremes, authored first | FR-026 |
| R-004 | FR-008 measured on raw `q.length`; exceptions recorded, never silent | FR-008, FR-008a |
| R-005 | 40-char preview screen: `stripMarkdown(q).slice(0,40)`, track-scoped, per batch | FR-007 |
| R-006 | 25-word bound under the validator's counter; 423/1887 bullets over today (413/1635 qa); ~18-word signal per sentence | FR-012, FR-012a |
| R-007 | Up to 13 releases `2026.08.20…32`; per-track gate-10 windows (≤09-06 / ≤09-08), gate-11 ≤09-13; checkpoint before each track's final batch; coalescing escape hatch | FR-024, gates 10/11 |
| R-008 | Gate 8 near-duplicates adjudicated in the batch that causes them, ledger-only | FR-022, SC-006 |
| R-009 | Batch gate = validator + scope check + 2 screens + 2-question read-through; new `scope-check.mjs` | FR-019, FR-019a, FR-020, FR-023 |
| R-010 | Recorded-exception taxonomy: word-bound (FR-012a), length (FR-008), mismatch repair | FR-008, FR-012a |
| R-011 | Non-qa tier: plain-words half only; per-item verdict simplified/already-simple; release only if touched | FR-016, FR-017, FR-017a |
| R-012 | Batch records are evidence-form: claims compared, source-to-claim mapping, lengths, verdicts | FR-023, SC-002 |
| R-013 | Order: reference batch → 10 qa tracks (kotlin first) → 3 non-qa tracks; release per completed track | FR-024, FR-026 |

No `NEEDS CLARIFICATION` remains.
