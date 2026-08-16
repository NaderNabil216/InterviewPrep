# Phase 0 Research: Fill the Content Gap to a Complete Study Library

**Feature**: `001-fill-content-gap` · **Date**: 2026-08-09 · **Spec**: [spec.md](./spec.md)

All measurements below were taken on 2026-08-09 against the live repository at `/Users/nn/InterviewPrep`
at manifest `2026.08.6` (93 registered items, 22 registered packs). Every number is reproducible with the
commands recorded in [quickstart.md](./quickstart.md).

---

## R-001 — The answer-length band applies to Q&A items only

**Status**: RESOLVED by the user on 2026-08-09 — *"i want the answer limit for only the Q&A"*.

**Problem**: FR-032 sets a 120–250 word band (hard ceiling 350, floor 80) and adds that "Problem Solving
and Mobile System Design items are measured on their prose only". That sentence reads two ways, and the
readings demand opposite work. Measured against the real content:

| Type | n | prose field | min | median | max | >350 | <80 |
|---|---:|---|---:|---:|---:|---:|---:|
| `qa` | 64 | `answer` | 162 | 282 | 440 | 7 | 0 |
| `concept` | 5 | `answer` | 277 | 369 | 430 | 4 | 0 |
| `dsa` | 19 | `prompt` | 32 | 59 | 87 | 0 | 18 |
| `design` | 5 | `referenceAnswer` + `prompt` + `framework` + `staffAdds` | 717 | 760 | 791 | 5 | 0 |

Reading it as an *inclusion* rule puts 18 of 19 problem statements below the floor — a DSA prompt is
terse by design — and cuts every system-design reference answer by ~60%.

**Decision**: the band governs the `answer` field of **`type: "qa"` items only**. `concept`, `dsa`, and
`design` carry no word band. The second half of FR-032 — every item reaches further depth through a
"more info" reference to a live primary source — stays **library-wide**, because the user scoped only the
*answer limit*, and SC-017 is untouched.

**Assumption flagged**: `concept` is treated as outside "Q&A". The five `concept` items are the cheat
sheets, which the spec already freezes at their current size ("Cheat Sheets stay at their current size"),
and the authoring workflow already describes them as "cheat-sheet style … carry a dense answer". If the
intent was to include them, four items need trimming and nothing else in this plan changes.

**Consequences**:

- FR-018's cited remediation counts (13 / 24 / 24) do not reproduce; see R-002.
- SC-016 is measured over `qa` items only.
- The authoring workflow's `answer: 250-550 words` instruction must drop to the band (R-007).
- The design-item instruction `referenceAnswer: 700-1200 words` **stands unchanged**.

**Alternatives rejected**: literal reading for all types (inflates 19 problem statements, guts 19 design
scenarios); cap design at 350 but exempt DSA (halves the value of the highest-effort artifact in the
library for no stated benefit).

---

## R-002 — The real remediation set for the existing 93 items

**Problem**: FR-018 states 13 answers over the ceiling, 24 under the floor, and 24 with no reference.
Those figures do not reproduce, and the plan needs an exact work list.

**Findings** (word count = the canonical counter decided at the foot of this section — tokens matching
`[A-Za-z0-9'\`_-]+` over the raw markdown source of the field. Stated here because the figures do not
survive a change of counter: whitespace-delimited tokens, which count `|` table pipes and `**bold**`
markers as words, give 48 trims and 9 over-ceiling instead of 46 and 7, and move compose and platform
from 9 trims each to 10):

- **0** `qa` answers fall below 80 or even below 120 words. The spec's "24 under floor" are exactly the
  19 `dsa` + 5 `design` items, which have **no `answer` field at all** — counted as zero words by whatever
  tool produced the figure. Under R-001 they are out of scope for the band entirely.
- **7** `qa` answers exceed 350. The spec's 13 most likely also counted the 4 over-ceiling `concept`
  items and used a different tokenizer.
- **24** items carry no `refs` array — precisely the 19 `dsa` and 5 `design` items. Every `qa` and
  `concept` item already has one.
- **46** `qa` answers exceed 250 words. SC-016 requires ≥90% of answers inside 120–250, so all 46 must be
  trimmed, not just the 7 over the ceiling.

**Per-track work list** (drives which content stage carries which remediation):

| Track | built | `qa` answers to trim (>250w) | items needing a ref |
|---|---:|---:|---:|
| architecture | 7 | 7 | 0 |
| behavioral | 3 | 3 | 0 |
| build-testing | 2 | 2 | 0 |
| cheatsheets | 5 | 0 | 0 |
| compose | 11 | 9 | 0 |
| coroutines-flow | 8 | 0 | 0 |
| data-networking | 4 | 3 | 0 |
| dsa | 19 | 0 | 19 |
| kotlin | 13 | 7 | 0 |
| performance | 3 | 3 | 0 |
| platform | 10 | 9 | 0 |
| security-kmp | 3 | 3 | 0 |
| system-design | 5 | 0 | 5 |
| **Total** | **93** | **46** | **24** |

**Decision**: FR-018's remediation is scoped to **46 answer trims + 24 ref additions = 70 item edits**,
each marked `updatedIn` with the release that changed it. No item is renumbered, retracked, or removed.
The two sets are disjoint — every `qa` item already carries a ref, and the 24 unsourced items are
`dsa`/`design` with no `answer` field to trim — so the totals add rather than overlap. (This line read
"= 62 item edits" until 2026-08-09; the figure was an arithmetic slip, not a different measurement. The
per-track table above and the stage table in [plan.md](./plan.md) both summed to 70 throughout.)
`validate.mjs` becomes the authority on these counts (R-008), superseding the spec's prose figures.

**Decision — canonical word count**: tokens matching `[A-Za-z0-9'\`_-]+` over the **raw markdown source**
of the measured field. Markdown syntax is not stripped, `code[]` entries are never counted (they are a
separate field), and tables count as words. One algorithm, implemented once in `tools/validate.mjs` and
reused by any reporting. Chosen over "strip markdown then count" because it needs no dependency on
`md.js` from Node and is trivially reproducible.

---

## R-003 — The library cannot fit in localStorage; the snapshot moves to IndexedDB

**Problem**: FR-033/FR-034 and the "library outgrowing the space the device will give it" edge case.
`content.js#buildSnapshot` stores each item **three times** — inside `packs[packId].items`, again in the
flat `items` array, and again in the `byId` map — and `store.js#write` serialises the whole thing into a
single localStorage key.

**Measurements at 93 items**:

| Shape | chars | ≈ bytes (UTF-16) | projected to 629 items |
|---|---:|---:|---:|
| Snapshot as stored today (3 copies) | 1,207,286 | ~2.4 MB | **8,165,407 chars ≈ 16.3 MB** |
| Single canonical copy (`packs` + `plans` only) | 413,311 | ~0.8 MB | **2,795,405 chars ≈ 5.6 MB** |

A browser grants roughly **5 MB per origin** for localStorage, counted in UTF-16 code units. So:

- Today's shape at 629 items overshoots by **~3×**.
- **Deduplication alone is not sufficient** — a single copy still lands at ~5.6 MB, over the cap with no
  headroom, and SC-015 demands "room to spare". Even after the FR-032 trims (R-002 removes roughly 15% of
  `qa` answer text) it sits at ~4.8 MB, inside the cap only by a rounding error and with the user's own
  progress competing for the same 5 MB.

**Decision** — three changes, all inside `store.js` / `content.js`:

1. **Persist one canonical copy.** Store `{version, generatedAt, stackSnapshot, releases, packMeta,
   packs, plans, fetchedAt}`. Derive `items` and `byId` in memory on load. `snapshot.items`,
   `snapshot.byId`, and `snapshot.packs` all keep their current shape for every view — the only file that
   reads `snapshot.packs` is `assets/js/views/cheatsheets.js:5`, and it keeps working unchanged.
2. **Move the snapshot to IndexedDB** (database `aip`, object store `snapshot`, single record keyed
   `current`). IndexedDB's quota is a share of free disk (hundreds of MB in practice), stores structured
   clones without the UTF-16 doubling, and is already available in every target browser with no
   dependency and no build step. `boot()` and `applyUpdate()` are the only callers and `boot()` is already
   async; `applyUpdate()` becomes async and its one call site (`app.js:184`) awaits it.
3. **Keep learning state in localStorage.** `progress` / `session` / `plan` / `mockResults` /
   `scratch.<id>` stay exactly where they are under `aip.v1.`, keyed by permanent item id. At 629 items a
   full progress map is ~130 KB — nowhere near the cap once the snapshot vacates it. This preserves the
   snapshot/progress split verbatim; only the snapshot's *backing store* changes.

**Migration**: on boot, if IndexedDB holds nothing and `aip.v1.snapshot` exists in localStorage, adopt it
(rebuild the derived fields), write it to IndexedDB, then `removeItem` the localStorage copy — recovering
~2.4 MB for the candidate's own state. A candidate who never opens the site again keeps a stale but valid
localStorage copy; nothing breaks.

**Alternatives rejected**: keep localStorage and trim harder (no headroom, violates SC-015 "room to
spare"); `CompressionStream` + base64 into localStorage (base64 re-inflates by 33%, and localStorage's API
is synchronous while compression is not); Cache API holding raw pack responses (workable, but re-parses
every pack on every boot and spreads the snapshot across many keys, complicating the wholesale-swap
invariant).

---

## R-004 — Storage failures must be surfaced, not swallowed

**Problem**: FR-034. `store.js#write` catches every exception and calls `console.error`. A
`QuotaExceededError` on a rating write therefore looks identical to success: the candidate keeps
studying, the rating is gone, and nothing on screen says so.

**Decision**:

- `write()` returns `true` on success and **throws `StorageFailure { key, cause, quotaExceeded }`** on
  failure; every mutating `Store` method propagates that failure rather than absorbing it. A boolean
  return was considered and rejected: an ignored return value is indistinguishable from today's
  swallowed `console.error`, which is the exact defect FR-034 exists to close. The normative form is
  [contracts/storage-contract.md §5](./contracts/storage-contract.md).
- On failure the app raises a **persistent** banner (not a 3.2s toast — a lost rating must not scroll
  past) naming what failed to save and offering **Export progress** so the candidate can rescue their
  history. `toast()` already exists in `app.js:39`; the banner is a new sibling in `index.html`.
- Snapshot writes to IndexedDB reject rather than throw synchronously; `applyUpdate()` surfaces the same
  banner and **leaves the previous snapshot in place**, so a failed update degrades to "you are still on
  the old library" rather than to an empty app.
- Before a large update is applied, `navigator.storage.estimate()` is consulted where available and the
  diff modal reports the projected size, satisfying the "says so rather than failing quietly" half of
  SC-015.

**Alternative rejected**: `try`/`catch` at each call site (the same handler duplicated across nine
`Store` methods and every view).

---

## R-005 — Plan completion must be re-anchored from schedule position to material

**Problem**: FR-020 and the spec's headline edge case. `assets/js/views/plan.js:5` keys a hand-tick as
`` `${dayIdx}:${taskIdx}` `` — a *position*. Re-authoring a plan leaves every hand-tick pointing at
whatever now occupies that slot, marking unread material as done. This is the one path by which a content
release can corrupt candidate state, and it contradicts the snapshot/progress guarantee.

**Decision**:

- Completion is keyed by a **material signature**: the task's `itemIds`, sorted, joined with `+`. Two
  tasks covering the same material read as the same completion, wherever they sit in whatever plan.
- `planState.checked` gains a sibling `planState.done` holding signature keys. `checked` is retained
  read-only for one release so the migration can run, then dropped.
- **One-time migration**, run at first boot after the modes release: for each entry in `checked`, resolve
  `dayIdx`/`taskIdx` against the **outgoing** plan, take that task's `itemIds`, and write the signature
  into `done`. A tick whose task has no `itemIds` (reading and note-taking tasks) has no material to
  follow and is **cleared**.
- **Ordering constraint, load-bearing**: the migration must run *before* `applyUpdate()` swaps the
  snapshot, because the outgoing plan only exists inside the snapshot being replaced. The modes release
  therefore runs migration inside the confirm handler, ahead of the swap, and the pre-acceptance modal
  lists every tick that will be cleared — satisfying FR-020's disclosure clause and acceptance scenario
  2.5.
- Auto-completion (`autoDone`, `plan.js:28`) already follows the material and needs no change.

**Alternative rejected**: keep positional keys and re-author the plans so positions coincide — brittle,
unverifiable, and explicitly forbidden by FR-020's closing sentence.

---

## R-006 — Free study is a third value of the existing mode selector

**Problem**: FR-007–FR-015. `store.js:47` defaults `getPlanState()` to `{ activePlan: '14day' }`, so a
candidate who has chosen nothing is silently routed through a dated plan (violates FR-015), and
`dashboard.js:37` renders "Today's plan" from that default.

**Decision**:

- `planState` gains an explicit `mode` field: `'free' | '7day' | '14day'`, default `'free'`.
- **Legacy resolution**, satisfying acceptance scenarios 3.7 and 3.8: if `mode` is absent, a candidate
  with a non-null `startedAt` is treated as being on `activePlan` (they had started a dated plan and keep
  it, position and marks intact); everyone else resolves to `'free'`. Distinguishable because an
  untouched candidate has no `aip.v1.plan` key at all.
- The Plan view leads with a three-way mode chooser; picking free study hides the day grid and shows the
  free-study surface instead. Switching writes only `mode` — `progress`, `done`, `startedAt`, notes, and
  mock history are never touched (FR-014).
- **Free study's "today" surface** (FR-012, and the "free study has no day to show" edge case): the
  dashboard's plan card is replaced, not blanked, with due-for-review count, the next unseen items drawn
  from the weakest tracks, and the mastery table that already exists. `srs.js#buildQueue` and
  `masteryByTrack` supply all of it with no new scheduling logic.
- Navigation is untouched in every mode: Topics, search, Drill, DSA, and Design already route over
  `snapshot.items` and never consult plan state (FR-013).

**Alternative rejected**: free study as a fourth nav destination — the spec calls it "a third selection
alongside the two plans, not a separate destination".

---

## R-007 — The authoring workflow contradicts the spec in four places

*Extended 2026-08-09 to nine, following the spec amendments in R-013.*

**Problem**: `.claude/workflows/fill-content-gap.js` is the dependency that produces all 536 new items.
Its `HOUSE_RULES` and item shapes predate this spec.

| Location | Says today | Must say | Driver |
|---|---|---|---|
| `ITEM_SHAPE_QA` | `answer: 250-550 words` | `answer: 120-250 words, hard ceiling 350` | FR-032, R-001 |
| `ITEM_SHAPE_DSA` | "No refs field on dsa items" | 1 ref, official source, with `checked` | SC-017, FR-023 |
| `ITEM_SHAPE_DESIGN` | (no refs field) | 1 ref, official source, with `checked` | SC-017, FR-023 |
| `outlinePrompt` STEP 3 | level mix `10/30/40/20` | `10/30/45/15` | FR-005, SC-014 |
| `HOUSE_RULES` — levels | level named, no criteria | the FR-035 rubric verbatim, plus "assign the **lowest** level at which a candidate could be expected to answer it" | FR-035 |
| `outlinePrompt` STEP 3 | mix only | per-level floors: ≥3 items at each level (≥2 for `system-design`, `behavioral`) | FR-005, SC-014 |
| `HOUSE_RULES` — refs | "official source" | the FR-025 host allowlist, and the rule that a ref must *contain the depth* to serve as "more info", not merely evidence the claim | FR-025, FR-032 |
| `authorPrompt` — dedup | dedups against `existing[]` for its own track | must also dedup against the ids and questions authored by the other tracks in the same wave | FR-004 |
| outline checkpoint | `outlines/<track>.json` holds the item outline | additionally holds the **frozen `scope[]`** for that track and, after authoring, the `coverage{}` map | FR-003, SC-019 |
| `outlinePrompt` STEP 4 | writes the checkpoint as **exactly** `{"specs": [...]}` | must **read the file first and preserve any existing `scope[]` / `coverage{}`**, writing `{scope?, coverage?, specs}` | FR-003 |

`ITEM_SHAPE_DESIGN`'s `referenceAnswer: 700-1200 words` stays as written (R-001).

**The STEP 4 row is load-bearing and was nearly missed.** Only kotlin, coroutines-flow and compose carry
`reuseOutline: true`, so for the other nine tracks the outline agent runs and overwrites its checkpoint
file wholesale. Freezing `scope[]` into that file beforehand — which is what FR-003 requires, and what the
stage tasks do — would be silently destroyed by the very run it is meant to constrain. The fix must be
*preserve*, not *let the outline agent emit the scope*: a scope the outline agent writes while planning
against the same prose is not frozen in advance, and SC-019 would then measure the agent against its own
homework.

**Decision**: patch the workflow before Stage 1 authoring runs. `CHECKED` must also be passed per-wave as
the actual authoring date rather than defaulting to `'2026-08-07'`, or FR-024 ("verification dates must be
the date the claim was actually checked") is violated by construction.

**Not patchable into the workflow**: FR-018's trim-quality rule governs the 70 remediation edits, which are
hand edits to existing packs — the workflow never touches existing pack files and must not start. That
rule lands in `tools/REFRESH.md` and in the release procedure instead.

---

## R-008 — `validate.mjs` becomes the gate for every new invariant

**Problem**: FR-022/SC-011 require the integrity check to report zero errors, but today it checks only
required fields, id uniqueness *within registered packs*, level range, ref shape, and plan resolution. It
cannot see the new rules, and it cannot see unregistered pack files at all — the exact blind spot that let
`coroutines-g-5.json` sit unnoticed.

**Decision** — extend `tools/validate.mjs` with these gates (errors unless noted):

1. **Library-wide id uniqueness across every `content/packs/*.json` on disk**, registered or not. This is
   the single highest-value gate: with twelve tracks authored in parallel, a collision between a
   registered and an unregistered pack is invisible today.
2. **`qa` answer bounds** — error above 350 or below 80; warning outside 120–250; a summary line reporting
   the in-band percentage against the ≥90% target (SC-016).
3. **Every item carries ≥1 `refs` entry** with a `checked` date (SC-017). Error.
4. **Per-track minimum counts** from FR-002, and the library total ≥600. Warning until the final stage,
   error at delivery — reported as a table so partial stages stay readable.
5. **Library difficulty mix** against 10/30/45/15 ±5pp, **plus the per-level floors**: every track of 40+
   items holds ≥3 items at each of the four levels, `system-design` and `behavioral` ≥2, `cheatsheets`
   exempt (FR-005, SC-014). Warning during stages, error at `--final` — the mix is only meaningful at full
   size, but the floors are the part that fails silently: measured 2026-08-09, **no track currently spans
   all four levels at all**.
6. **`releases[]` ordered strictly descending** by numeric `YYYY.MM.N` comparison (R-009).
7. **`design` items carry `requirements`, `rubric`, `timerMinutes`; `dsa` items carry `pattern`, `hints`,
   `complexity`, `starter`** (FR-006). Currently warnings; promoted to errors.
8. **Near-duplicate question detection** across **every `content/packs/*.json` on disk, registered or
   not** (FR-004) — normalised `q` token overlap above a threshold, reported with both ids. A flagged
   pair is a **warning while it is unadjudicated and an error at `--final`**: SC-020 requires zero
   unadjudicated pairs, so the pair must appear in the adjudication ledger (below) with a verdict before
   delivery. The threshold stays a tooling knob, not a requirement — over-reporting is acceptable because
   a human decides.

   **It reads from disk for the same reason gate 1 does, and the ordering depends on it.** Adjudication
   happens *before* a stage is registered — that is the only point at which a pair can still be merged
   or differentiated rather than rationalised after shipping — so a screen limited to `manifest.packs[]`
   would see none of the stage's own new material and would report zero pairs every time. Reading disk
   makes the newly authored packs screenable the moment the workflow writes them.

*Added 2026-08-09 with the spec amendments (R-013):*

9. **Reference host allowlist** (FR-025) — any `refs[].url` whose host is outside the primary-source list
   is reported with its item id. Warning during stages, error at `--final`. The list is data, not code, so
   adding a newly-official host is a one-line change rather than a code edit.
10. **Reference freshness** (FR-024) — for every item whose `addedIn` **or** `updatedIn` equals the
    manifest's current `version`, each `refs[].checked` must fall within the 30 days before that release's
    `date`. Error. Items the release does not touch are not examined, which is what makes this affordable
    at 629 items. This gate is what makes SC-009 measurable rather than aspirational.
11. **Version-truth freshness** (FR-036) — `manifest.stackSnapshotChecked` must fall within 30 days before
    the current release's `date`. Error at release. This is a single date, not a per-entry one: the
    registry is re-verified as a unit.
12. **Scope coverage** (FR-003, SC-019) — for every track that has shipped, its outline record carries a
    frozen `scope[]`, and every subject in it maps to ≥1 existing item id or carries a recorded
    `dropped` reason. Warning during stages (a track mid-authoring is legitimately incomplete), error at
    `--final`.

*Added by the 2026-08-09 analysis pass, closing two criteria that were asserted rather than measured:*

13. **Version-claim screen** (FR-023, SC-009) — a broad regex pass over each item's prose flagging the
    items that likely assert a version, date, deadline, or currency claim: `\d+\.\d+`, `API \d+`,
    `Android \d+`, `SDK \d+`, an ISO date, and the words *deprecated · removed · stable · experimental ·
    as of · currently · no longer · minimum · required by*. It reports the flagged id set, its size, and
    how many of the flagged items the current release ships. Warning always — the screen names the set
    SC-009 (b) and (c) are measured over; it never decides whether a reference sources a claim, which is
    the part FR-023 keeps editorial. Deliberately over-broad: under-reporting would shrink the audit set
    silently, which is the one failure mode that matters.
14. **Plan study budget** (FR-008, SC-006) — each dated plan carries `pace.dailyMinutes`, and the summed
    working time of every referenced item slot, at the SC-002 paces (`qa` 5 · `dsa` 20 · `design` 45 ·
    any item in `behavioral` 8 · `concept` 0), is at or below `days.length × pace.dailyMinutes`. Error —
    a plan that cannot be finished in its own timeframe is the failure SC-006 exists to catch, and unlike
    the coverage gates it is fully decidable, so there is no reason to defer it to `--final`.

`tools/check-refs.mjs` already network-probes every ref and remains the SC-010/FR-026 gate, run once per
release before it is offered.

**Deliberately not gated** — these are editorial and are reviewed by the workflow's adversarial-review
agent and the release author, because a machine check would be theatre: FR-035's level *assignment* (the
distribution is gated, the judgement is not), FR-018's trim-quality rule, and FR-032's requirement that a
dual-role reference *actually contains the further depth* rather than merely evidencing the claim.

---

## R-009 — Release version ordering breaks at `.10`

**Problem**: `assets/js/views/whatsnew.js:5` sorts releases with a string comparison. The planned wave
versions run `2026.08.7 → 2026.08.8 → 2026.08.9 → 2026.08.10`, and `'2026.08.10' < '2026.08.9'` is true
as a string — so the final and largest release would render in the middle of the history. The bug is
guaranteed to fire on this feature's own releases.

**Decision**: delete the sort. `manifest.releases[]` is already authoritatively newest-first —
`sync-manifest.mjs:94` `unshift`s each new release — so the view renders manifest order verbatim, and
`validate.mjs` gate 6 (R-008) asserts that order holds using a numeric comparator that splits on `.` and
compares each component as an integer.

**Alternative rejected**: sort numerically in the view — duplicates the ordering rule in two places and
leaves the manifest free to drift.

---

## R-010 — The orphaned coroutines pack is chunk 5 of an interrupted wave-1 run

**Problem**: `content/packs/coroutines-g-5.json` holds `co-0049`–`co-0055`, tagged `addedIn: 2026.08.7`,
unregistered and therefore invisible to the app, to `validate.mjs`, and to the candidate.

**Finding**: it is not stray material. The cached outline
`.claude/workflows/outlines/coroutines-flow.json` holds 47 specs, and the wave-1 config assigns
`startId: 9, chunk: 10` — so spec indices 40–46 map to ids `co-0049`–`co-0055` and to pack file
`coroutines-g-5`. The orphan is exactly the fifth authoring chunk, already written and already reviewed
against that outline.

**Decision**: **adopt it**, per the spec's stated assumption. Consequences, which change how Stage 1 runs:

- The remaining coroutines gap is **40 items, not 47** — outline indices 0–39, ids `co-0009`–`co-0048`,
  packs `coroutines-g-1` … `coroutines-g-4`.
- The pack must be re-reviewed against the amended house rules (R-007) before registration, since it was
  authored under `answer: 250-550 words` and may carry answers over the 350 ceiling.
- Its `addedIn: 2026.08.7` already matches the Stage 1 release, so registering it in that release is
  coherent with no edit to the items' provenance.
- `co-0009`–`co-0048` must be authored **around** the claimed ids. The workflow assigns ids positionally
  from `startId`, so wave 1 must run coroutines with an explicit index range rather than the default
  `gap: 47`.

**Alternative rejected**: retire the seven items and renumber — throws away reviewed work and, worse,
normalises id reuse, the one rule the repo holds without exception.

---

## R-011 — Delivery sequencing

**Problem**: FR-029 (coherent after every stage), FR-031 (plans re-authored only after all content
lands), and FR-033 (storage must hold before the library grows).

**Decision** — six stages, in this order:

| Stage | Release | Content | Why here |
|---|---|---|---|
| A — Platform | none | Storage, tick re-anchoring, ordering fix, validator gates, workflow patch | Must precede growth: at Stage B the snapshot already passes 2 MB and the current code would silently fail to save it |
| B — Stage 1 | `2026.08.7` | kotlin 57, coroutines 40 (+7 adopted), compose 64 | Outlines already cached for all three; language and UI foundations |
| C — Stage 2 | `2026.08.8` | platform 50, architecture 43, data-networking 36, performance 37 | Platform and architecture |
| D — Stage 3 | `2026.08.9` | build-testing 58, security-kmp 67 | Heaviest scope per item |
| E — Stage 4 | `2026.08.10` | dsa 41, system-design 14, behavioral 22 | Three distinct item shapes; the `.10` release that proves R-009 |
| F — Modes | `2026.08.11` | Free study, mode chooser, tick migration, both plans re-authored | FR-031: after all content |

536 new items: 168 + 166 + 125 + 77. With 93 existing → **629**. Each track's FR-018 remediation
(R-002) rides in the same stage that expands it, so no track is ever half-compliant.

**Stage A carries no manifest bump** and is therefore invisible to `checkForUpdates()` by design — app
code is fetched from disk on every load and is not part of the snapshot. `assets/css/app.css?v=` in
`index.html:8` is bumped so the banner and mode-chooser styles are not served stale.

---

## R-012 — Findings recorded, not acted on

- **`cheatsheets-b` items never render.** `views/cheatsheets.js:5` reads only
  `snapshot.packs['cheatsheets']`, so the 2 items in `cheatsheets-b.json` are absent from the Cheat Sheets
  view (reachable only via search or a direct `#/item/` link). Discovered while confirming the single
  reader of `snapshot.packs` for R-003; fixed in Stage A as a one-line change because that exact line is
  being touched, and it is SC-012's requirement for the items that already exist.
- **`sync-manifest.mjs` stamps release dates from a stale field.** Line 94 sets `date:
  manifest.generatedAt` and never updates `generatedAt`, so all five releases in this feature would be
  dated `2026-08-07`. Stage A adds a `--date` flag defaulting to today and updates `generatedAt`.
- **Drill queue shape at 629 items.** `srs.js#buildQueue` returns everything due followed by everything
  unseen, capped at 9999. In free study that is a 600-item queue. The spec explicitly records this as a
  follow-up rather than in-scope work, and this plan honours that.
- **`checkForUpdates()` refetches all packs** when versions differ — **~90** sequential requests at final
  size. Acceptable on localhost; recorded in case it becomes noticeable. (The figure read "~60" until the
  2026-08-09 analysis pass: `chunk` in the wave config is items *per pack*, not the number of packs, so
  the four waves produce 67 new pack files — 12 kotlin, 4 coroutines, 7 compose, 5 platform, 5
  architecture, 4 data-networking, 5 performance, 6 build-testing, 7 security-kmp, 6 dsa, 4 system-design,
  2 behavioral — on top of the 23 that exist today.)

---

## R-013 — Spec amendments of 2026-08-09 and where they land

**Status**: the spec was amended after this research was written, closing all 17 items of
[checklists/content.md](./checklists/content.md). This section records what changed and what it costs, so
the earlier sections can stay as the history of how each decision was reached.

**What the spec gained**

| Change | Requirement | Consequence here |
|---|---|---|
| Word band scoped to Q&A; canonical count required | FR-032, SC-016 | already how R-001/R-002 read it — the spec now agrees |
| Remediation restated as 46 trims + 24 refs = **70** items | FR-018 | corrected in this file, plan.md, content-schema.md; **62 was an arithmetic slip** over two disjoint sets |
| Trim-quality rule (elaboration, never substance) | FR-018 | not gateable; lands in `tools/REFRESH.md` and the release procedure (R-007) |
| Declared scope frozen + subject→item coverage | FR-003, SC-019 | new outline fields + validator gate 12 |
| Duplicates: knowledge-tested definition, new-vs-new, adjudication | FR-004, SC-020 | gate 8 promoted; new adjudication ledger |
| Per-level floors, Cheat Sheets exempt | FR-005, SC-014 | gate 5 extended |
| Level rubric + lowest-defensible-level rule | **FR-035** | workflow house rules (R-007); deliberately not gated |
| Claim classes that trigger a dated source | FR-023 | makes SC-009 assessable; gate 10 |
| Freshness anchored to the **shipping** release | FR-024, SC-009 | new gate 10 |
| Primary source defined + disqualified forms | FR-025 | new gate 9 (host allowlist) |
| One reference may serve both roles, conditionally | FR-032 | house rule; the "contains the depth" half is editorial |
| Version-truth registry re-verified every release | **FR-036** | new `manifest.stackSnapshotChecked`; gate 11 |
| Study paces behind the three-hour criterion | SC-002 | no tooling; derived from the FR-002 minimums gate 4 already checks |

**Two new artifacts, and why they live outside `content/`**

- **Frozen scope + coverage** — `.claude/workflows/outlines/<track>.json` gains `scope[]` (the track's
  declared subjects, enumerated from the wave config's scope prose and frozen before authoring) and
  `coverage{}` (subject → item ids, or a `dropped` reason). It goes here because the outline checkpoint
  already exists for this track and the scope prose it is derived from lives two files away; splitting
  them would mean maintaining the same subject list twice.
- **Duplicate adjudication ledger** — `.claude/workflows/duplicates.json`, a flat list of
  `{ ids, verdict: distinct | merged | accepted, reason, release }`.

**The trade-off a reviewer should challenge**: both make `tools/validate.mjs` read outside `content/`,
which until now it has not done. The alternative — a `content/authoring/` directory — keeps the validator
within one tree but puts authoring evidence inside the content directory, where a future reader will
reasonably expect everything to be candidate-facing, and duplicates the scope prose across two trees.
Neither is shipped to the candidate: the app fetches only `manifest.json` and the packs and plans it
registers, so an unregistered file under either path is inert. The `.claude/` choice was made on the
"one source for the subject list" argument; it is cheap to reverse.

**Unchanged by the amendments**: R-003 through R-006 and R-009 through R-012 — nothing in the amendment
set touches storage, tick migration, free study, or release ordering. Stage A's platform work is
unaffected in scope; it only gains validator gates.

---

## R-014 — Cross-artifact analysis pass of 2026-08-09 and what it changed

**Status**: a full consistency analysis was run across `spec.md`, `plan.md`, `tasks.md`, this file, the
three contracts and `quickstart.md`, with every numeric and line-number claim re-measured against the live
repository. 19 findings, 0 critical. All are resolved; this section records what moved and why, so the
sections above stay the history of how each decision was first reached.

**What held.** All 14 code citations resolve to the exact lines claimed. The FR-002 "Now" column, the
93-item / 22-pack baseline, the 6/28/50/9 level split, 64 `qa` items, 24 unsourced items, 46 trims, and
every per-file remediation count in the stage tasks reproduce exactly. The stage arithmetic closes:
168 + 166 + 125 + 77 = 536, + 93 = 629. Every track's `startId` is correct, including `system-design`,
whose ids uniquely start at `sd-0000` — so `startId: 5` is right rather than an off-by-one.

**What changed** (each fixed in place above and in the artifact named):

| Finding | Where it was | Resolution |
|---|---|---|
| `write()` documented as returning a boolean here, as throwing in the contract and tasks | R-004 | R-004 rewritten to the throwing form; the boolean is recorded as considered and rejected |
| Findings prefaced "whitespace-delimited tokens", contradicting the canonical counter decided in the same section | R-002 | Preface corrected; the divergence (48/9 vs 46/7) is stated so the counter can never be swapped silently |
| Gate 8 screened only registered packs, but adjudication happens before registration | R-008 §8 | Gate 8 now reads every pack on disk, like gate 1 |
| `outlinePrompt` STEP 4 overwrites the checkpoint wholesale, destroying a frozen `scope[]` | R-007 | New table row: read-merge-preserve `scope[]`/`coverage{}` |
| SC-009 asserted 100% but was verified by a 5-item read | spec SC-009, R-008 | New gate 13 version-claim screen; SC-009 restated as three measurable parts |
| SC-006 measured against "a pace the plan states", which no schema defined | spec FR-008/SC-006, R-008 | Plans declare `pace.dailyMinutes`; new gate 14 checks the schedule fits it |
| FR-010's "interview weight" was undefined | spec FR-010 | Per-track weight table, ±5pp tolerance, ≥1 item per weighted track |
| Pack-count estimates low by ~75% | R-012, plan.md | 67 new packs / 90 total; refetch note now ~90 |
| SC-018's "all 93 still present" had no check and no baseline | tasks T002/T101 | Baseline captures the id list; delivery re-checks it |
| Adopted coroutines refs dated by the workflow's `2026-08-07` default — FR-024 forbids exactly that | tasks T033 | T033 re-verifies and re-dates all 14 refs |
| Adopted pack held to ">350" while everything else is authored to 120–250 | tasks T033 | Same band as all other material |

Six lower-severity items — a stale "13/24/24" cross-reference in two files, a mislabelled step number in
the CLI contract, the `14day` id versus its "15-day" label, a coarser host check in the quickstart script
than the contract defines, an uncreated baseline directory, and the level rubric duplicated in four
places — were corrected in place without changing any decision.

**Not changed, deliberately**: the `14day` plan id stays as it is despite the plan holding 15 days. It is
persisted in `aip.v1.plan.activePlan` on candidates' devices; renaming it would strand their selection to
save a cosmetic inconsistency, which is the wrong trade for a feature whose whole point is that updates
never disturb stored state.
