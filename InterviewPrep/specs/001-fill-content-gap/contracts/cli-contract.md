# Contract: CLI Tooling

**Scope**: `tools/*.mjs`, `tools/serve.sh`, and the authoring workflow
`.claude/workflows/fill-content-gap.js`. These are the only executable interfaces this project exposes —
there is no package.json, no test runner, and no linter. `validate.mjs` is the closest thing to a test
suite and is the gate FR-022 / SC-011 refer to.

---

## 1. `node tools/validate.mjs`

**Exit codes**: `0` = zero errors (warnings permitted) · `1` = one or more errors.
**Invariant**: must exit `0` after any content edit, and before any release is offered to a candidate.

### Existing gates (kept)

| Gate | Severity |
|---|---|
| Required fields `id track topic level type q` present | error |
| Duplicate id **within registered packs** | error |
| `level` ∈ 1–4 | error |
| `refs[].checked` present; `refs[].url` is http(s) | error |
| Plan `itemIds` resolve to real items | error |
| Item `track` differs from pack `track` | warning |
| `addedIn` missing, or with no matching `releases[]` entry | warning |
| `dsa` without `pattern`; `design` without `requirements` | warning |

### NEW gates

| # | Gate | Severity | Driver |
|---|---|---|---|
| 1 | **Id uniqueness across every `content/packs/*.json` on disk**, registered or not | error | FR-016/017 |
| 2 | `qa` `answer` > 350 words or < 80 words | error | FR-032 |
| 2b | `qa` `answer` outside 120–250; plus a summary line reporting in-band % against the ≥90% target | warning | SC-016 |
| 3 | Any item with zero `refs` entries | error | SC-017 |
| 4 | Per-track counts vs the FR-002 table, and total ≥ 600 — printed as a table | warning during stages, **error at delivery** (`--final`) | FR-002/SC-001 |
| 5 | Library difficulty mix vs 10/30/45/15 ±5pp, **plus per-level floors**: ≥3 items at each level per track (≥2 for `system-design`/`behavioral`, `cheatsheets` exempt) | warning during stages, **error at `--final`** | FR-005/SC-014 |
| 6 | `releases[]` strictly descending under **numeric** `YYYY.MM.N` comparison | error | R-009 |
| 7 | `dsa` missing `pattern`/`hints`/`complexity`/`starter`; `design` missing `requirements`/`rubric`/`timerMinutes` — promoted from warning | error | FR-006 |
| 8 | Near-duplicate `q` across **every `content/packs/*.json` on disk, registered or not** (normalised token overlap over threshold), reporting both ids — **unadjudicated pairs**, i.e. absent from `duplicates.json` | warning during stages, **error at `--final`** | FR-004/SC-020 |
| 9 | `refs[].url` host outside the FR-025 primary-source allowlist, reported with its item id | warning during stages, **error at `--final`** | FR-025 |
| 10 | For items whose `addedIn` **or** `updatedIn` equals `manifest.version`: every `refs[].checked` within the 30 days before that release's `date`. Items the release does not touch are not examined | error | FR-024/SC-009 |
| 11 | `manifest.stackSnapshotChecked` within 30 days before the current release's `date` | error at release | FR-036 |
| 12 | Every shipped track's outline record carries a frozen `scope[]`, and every subject maps to ≥1 existing item id or a recorded `dropped` reason | warning during stages, **error at `--final`** | FR-003/SC-019 |
| 13 | **Version-claim screen** — flags items whose prose matches the FR-023 claim patterns, reporting the flagged id set, its size, and how many the current release ships. Names the set SC-009 (b)/(c) are audited over; never decides whether a reference *sources* a claim | warning always | FR-023/SC-009 |
| 14 | **Plan study budget** — each dated plan carries `pace.dailyMinutes`, and the summed working time of every referenced item slot at the SC-002 paces is ≤ `days.length × pace.dailyMinutes` | error | FR-008/SC-006 |

Gate 1 is the highest-value addition: with twelve tracks authored in parallel, a collision between a
registered and an unregistered pack is invisible today — the exact blind spot that let
`coroutines-g-5.json` sit unnoticed.

**Gates 1 and 8 both read from disk rather than from `manifest.packs[]`**, and gate 8's reason is the
ordering: near-duplicates are adjudicated *before* a stage is registered, because that is the last point
at which a pair can still be merged or differentiated rather than rationalised after shipping. A screen
limited to registered packs would see none of the stage's own new material and would report zero pairs
every time it mattered. Every other gate reads the registered library.

Gate 14's paces are the SC-002 figures: `qa` 5 min, `dsa` 20, `design` 45, any item in the `behavioral`
track 8, `concept` 0 (cheat sheets are consulted, not studied). Every entry in every task's `itemIds`
counts once per occurrence — a deliberate second pass is scheduled work.

Gates 9, 12 and 13 make `validate.mjs` read outside `content/` — the allowlist and the claim patterns are
its own data, and the scope records live under `.claude/workflows/outlines/`. That trade-off is argued in
[research.md R-013](../research.md); it is cheap to reverse.

**Deliberately not gated**, because a machine check would be theatre — enforced by the workflow's
adversarial-review pass and the release author instead: FR-035's level *assignment* (the distribution is
gated, the judgement is not), FR-018's trim-quality rule, FR-032's requirement that a dual-role reference
actually contains the further depth, and whether a flagged item's reference genuinely *sources* its
version claim (gate 13 names the set; reading it is SC-009 (b) and (c)).

**Word count** — normative, and the authority over the spec's prose figures:

```js
const words = (s) => (s || '').match(/[A-Za-z0-9'`_-]+/g)?.length ?? 0
```

**New flag**: `--final` promotes gates **4, 5, 8, 9, and 12** to errors. Used once, before the last
release is offered. The split is deliberate: each of those five is legitimately unmet mid-expansion — a
track being authored has not reached its target count, its level floors, or its full subject coverage,
and a flagged duplicate has not been adjudicated yet — so erroring on them during stages would make the
gate useless. Gates 10, 11 and 14 are errors from the start, because a stale verification date and a plan
that overruns its own timeframe are never acceptable in a release regardless of how much content has
landed. Gate 13 never errors: it is a screen that names a set for humans to audit, not a verdict.

**Output**: existing per-pack lines are kept; the per-track target table and the difficulty-mix line are
appended to the existing `Total: N items` block.

---

## 2. `node tools/sync-manifest.mjs [--write] [--release V --summary S] [--date D]`

Deterministic — no agent ever edits `manifest.json`.

| Behaviour | Status |
|---|---|
| Dry run by default; `--write` applies | kept |
| Adds every pack on disk the manifest doesn't know, inserted after the last pack of the same track | kept |
| Refuses to continue if any pack file is unparseable or missing `id`/`track`/`items` | kept |
| Refuses a `--release` that already exists | kept |
| `--release` sets `manifest.version` and `unshift`s `{version, date, summary}` | kept |
| **`--date D`, defaulting to today; also updates `generatedAt`** | **NEW** |

The `--date` flag fixes a live defect: line 94 stamps `date: manifest.generatedAt`, which is never
updated, so all five releases in this feature would be dated `2026-08-07` (R-012).

---

## 3. `node tools/check-refs.mjs [substring]`

Network-probes every `refs[].url`. Optional substring filters to packs whose filename contains it.
This is the **SC-010 / FR-026 gate**: run once per release, before it is offered. Zero dead links
required at delivery.

Note the load change: 24 items gain refs and 536 items arrive with 1–2 each, taking the library from ~140
probes to ~800. Expect the full run to take minutes.

---

## 4. `bash tools/serve.sh [port]`

Serves `/Users/nn/InterviewPrep` on `http://localhost:8777` with caching disabled. **The site must be
served over `http://localhost`** — `fetch()` of local JSON is blocked over `file://`, and `app.js` hard-
stops with a notice if `location.protocol === 'file:'`. Verifying any app-code change means loading the
site here; there is no headless test path.

---

## 5. `.claude/workflows/fill-content-gap.js`

**Invocation**: `Workflow({ name: 'fill-content-gap', args: '<wave>' })` or `'<wave>:<track>'` to run one
track at a time. Waves `wave1`…`wave4` are configured in the script.

**Pipeline**: outline (1 agent/track, checkpointed to `.claude/workflows/outlines/<track>.json`) → author
(1 agent per chunk, writes pack files directly) → adversarial review (1 agent/track, fixes in place).
It only ever **adds** pack files; registration and release bumping remain `sync-manifest.mjs`.

### CHANGED for this feature

| Location | Today | Required |
|---|---|---|
| `ITEM_SHAPE_QA` | `answer: 250-550 words` | `answer: 120-250 words, hard ceiling 350` |
| `ITEM_SHAPE_DSA` | "No refs field on dsa items" | 1 ref, official source, with `checked` |
| `ITEM_SHAPE_DESIGN` | no refs field | 1 ref, official source, with `checked` |
| `outlinePrompt` STEP 3 | level mix `10/30/40/20` | `10/30/45/15` |
| `CHECKED` | defaults to `'2026-08-07'` | passed per wave as the actual authoring date (FR-024) |
| `wave1.coroutines-flow` | `gap: 47, startId: 9` | **40 items, indices 0–39, ids `co-0009`–`co-0048`** |
| `HOUSE_RULES` — levels | level named, no criteria | the FR-035 rubric verbatim + "assign the **lowest** level at which a candidate could be expected to answer it" |
| `outlinePrompt` STEP 3 | mix only | per-level floors — ≥3 at each level (≥2 for `system-design`, `behavioral`) |
| `HOUSE_RULES` — refs | "official source" | the FR-025 host allowlist; a ref serves as "more info" only if it **contains the depth**, not merely evidences the claim |
| `authorPrompt` — dedup | dedups within its own track's `existing[]` | must also dedup against the questions authored by the **other tracks in the same wave** (FR-004) |
| outline checkpoint | item outline only | additionally the frozen `scope[]`, and `coverage{}` after authoring (FR-003) |
| `outlinePrompt` STEP 4 | writes the checkpoint as **exactly** `{"specs": [...]}` | **read the file first; preserve any existing `scope[]` and `coverage{}`**, writing `{scope?, coverage?, specs}` (FR-003) |

`ITEM_SHAPE_DESIGN`'s `referenceAnswer: 700-1200 words` **stands unchanged** — the word band is a Q&A
rule (R-001).

The coroutines change is the load-bearing one: `content/packs/coroutines-g-5.json` already holds outline
indices 40–46 as `co-0049`–`co-0055`. Re-running the default `gap: 47` would mint those ids a second
time, which is the one failure mode that corrupts a candidate's history.

The STEP 4 change is the second: only kotlin, coroutines-flow and compose carry `reuseOutline: true`, so
for the other **nine** tracks the outline agent runs and rewrites its checkpoint file. Freezing `scope[]`
into that file first — which is what FR-003 requires — is otherwise destroyed by the run it exists to
constrain. Preserving is the fix; letting the outline agent *emit* the scope is not, because a scope
written while planning against the same prose was never frozen in advance.

**Pack file counts.** `chunk` is items *per pack*, not the number of packs — `coroutines-g-5` holds the
7-item tail of a 47-item run at `chunk: 10`. The four waves therefore write **67** new pack files (kotlin
12, coroutines 4, compose 7, platform 5, architecture 5, data-networking 4, performance 5, build-testing
6, security-kmp 7, dsa 6, system-design 4, behavioral 2), taking the repository from 23 pack files to 90.

**Hard rules the workflow already enforces and must keep**: never touch `manifest.json`, never touch
existing pack files, never touch `content/plans/`, use the exact assigned ids in order, never invent or
reuse an id, every item gets `addedIn: <release>`.

---

## 6. Release procedure (per content stage)

```bash
# 0. freeze each track's scope[] into outlines/<track>.json BEFORE authoring it   (FR-003)

# 1. author
#    Workflow: fill-content-gap  args: "waveN"      → writes content/packs/*-g-*.json
#    then fill coverage{} in each track's outline record                          (SC-019)

# 2. remediate that stage's existing items (FR-018) — trims + refs, each marked updatedIn
#    a trim removes elaboration, never substance; depth removed routes to "more info"

# 3. re-verify the version-truth registry; re-stamp stackSnapshotChecked          (FR-036)
#    any cheat sheet whose content moved takes updatedIn and re-dated refs

# 4. screen and adjudicate near-duplicates, while a pair can still be merged   (SC-020)
node tools/validate.mjs        # gates 1 and 8 read the new packs off disk, unregistered
#    → write every flagged pair into .claude/workflows/duplicates.json with a verdict and a reason
#    → re-run until gate 8 reports no unadjudicated pair

# 5. register + release
node tools/sync-manifest.mjs                                    # dry run: confirm the pack list
node tools/sync-manifest.mjs --write --release 2026.08.N \
     --summary "…" --date $(date +%F)

# 6. gate
node tools/validate.mjs        # MUST exit 0   (--final on the last release)
node tools/check-refs.mjs      # MUST report zero dead links
#    → audit >=10 of gate 13's flagged items (or all, if it flags fewer):
#      does the reference SOURCE the claim?                                        (SC-009 c)

# 7. verify in the browser
bash tools/serve.sh            # Update → read the diff → apply → spot-check
```

Steps 0, 3, and 4 are new, and each closes a rule that is otherwise unenforceable after the fact: a scope
frozen *after* authoring measures nothing, a version registry re-verified *sometimes* is a stale registry,
and a duplicate ledger written at the end is a rationalisation rather than an adjudication.

Step 4 running **before** step 5 is what forces gates 1 and 8 to read from disk. Adjudication is only a
real decision while the material is still unregistered and a pair can be merged or differentiated;
afterwards it is a note explaining why a shipped duplicate was allowed. Every other gate — including the
step 6 run that decides whether the release may be offered — reads the registered library, which is why
step 6 comes after step 5 rather than replacing it.
