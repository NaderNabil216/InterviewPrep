# Phase 1 Data Model: Dashboard Progress Reflects Completed Questions

**Feature**: `007-dashboard-progress-sync` | **Date**: 2026-08-20 | **Plan**: [plan.md](./plan.md)

**Governing constraint**: this feature adds **no persisted field, no new storage key, and no
migration**. Every entity below is either (a) already stored and read differently, or (b) derived in
memory per render and never written. That is FR-022 and constitution Principle II, and it is what
makes FR-023 ("nothing a candidate earned is lost or altered") true by construction rather than by
careful coding.

---

## 1. Persisted entities — read differently, written identically

### 1.1 Question (content)

The study item. Lives in `content/packs/*.json`, reaches the device inside the IndexedDB snapshot,
and is exposed in memory as `snapshot.items` / `snapshot.byId`.

| Field | Type | Role in this feature |
|---|---|---|
| `id` | string, permanent, never reused | The only key linking a question to a learning record. Read-only here. |
| `track` | string, one of 13 | The grouping for every coverage figure. |
| `type` | `qa \| concept \| dsa \| design \| behavioral` | Decides whether the review queue can present the question (`isDrillable`). |
| `level`, `q`, `answer`, `topic`, `addedIn`, `updatedIn`, … | — | Untouched. `addedIn`/`updatedIn` still feed the Topics "New in v…" filter. |

**Not modified by this feature.** No pack, plan file, manifest entry, or id is edited, so no manifest
`version` bump is required.

Current population (manifest `2026.08.34`): 629 questions, 89 packs, 13 tracks —
`kotlin` 70, `coroutines-flow` 55, `compose` 75, `platform` 60, `architecture` 50, `dsa` 60,
`system-design` 19, `data-networking` 40, `performance` 40, `build-testing` 60, `security-kmp` 70,
`behavioral` 25, `cheatsheets` 5. All counts are read from content at runtime; none is hard-coded.

### 1.2 Learning record

One entry in the `aip.v1.progress` map in `localStorage`, keyed by question `id`. Written only by
`store.js#setItemProgress()`, which **merges** — so a record can be built up by two different callers.

| Field | Written by | Read by this feature |
|---|---|---|
| `due` | `rate()` — every call, unconditionally | **Yes — this is the completion discriminator.** Also the due comparison. |
| `interval`, `ease`, `reps`, `lapses` | `rate()` | No. Interval maths is out of scope and unchanged. |
| `lastRated`, `lastRating` | `rate()` | No. |
| `status` (`'known' \| 'learning'`) | `rate()` | **No — vestigial.** See below. |
| `notes` | the item view's notes textarea, alone | No — and its presence must never imply completion. |

**`status` is vestigial after this change.** `rate()` keeps writing it, so a record written before and
after the change has an identical shape and an old export/import round-trip is byte-compatible. But
**nothing reads it any more** — it is the `interval >= 21` definition in field form, and reading it is
how the defect would come back. The accounting never consults it. This is asserted by the check
(D1 in [contracts/check-progress-cli.md](./contracts/check-progress-cli.md)).

**Record classification** — the whole feature turns on this one table:

| Record | `due` | Completed | In review queue |
|---|---|---|---|
| absent | — | no | yes (not yet completed) |
| `{ notes: "…" }` | absent | **no** | **yes** (today: *no* — the FR-017 defect) |
| `{ …rate fields }`, `due > today` | future | **yes** | no (completed, not yet due) |
| `{ …rate fields }`, `due <= today` | past/today | **yes** | yes (due) |
| `{ notes, …rate fields }` | present | **yes** | per `due` |
| record for an id no longer in the library | any | irrelevant | **never counted, never offered** |

### 1.3 Study-plan task state

`aip.v1.plan` in `localStorage`: `{ mode, activePlan, startedAt, done, checked }`.

- `done` — `{ [materialSignature]: boolean }`, where the signature is
  `store.js#signature(itemIds)` = `[...ids].sort().join('+')`. **Untouched by this feature.** Every
  manual tick survives, byte-identical.
- `checked` — legacy positional `"dayIdx:taskIdx"` marks, still read until `migrateTicks()` clears
  them. **Untouched.**

What changes is only the *derivation* of a task's displayed done-ness:

```
taskDone(task) = manualMark(task)                 when the candidate has ticked or unticked it
               = task.itemIds.every(isCompleted)  otherwise      ← was: .every(id => progress[id])
```

`manualMark` continues to take precedence (FR-013). A task that read as done only because a note was
saved now reads as not done and is re-tickable by hand — with nothing written or removed to achieve
that (see [research.md](./research.md) §7).

### 1.4 Untouched stores

`aip.v1.session`, `aip.v1.settings`, `aip.v1.mockResults`, `aip.v1.scratch.<id>` (DSA code drafts and
design checklist ticks), and the IndexedDB `aip / snapshot / current` record. Listed here so the
verification procedure can assert they are unchanged (SC-009). Note that `scratch.<id>` is a
*separate key* from the progress record, so a DSA code draft or a design checklist tick cannot create
a progress record at all — which is why FR-005's "code draft or checklist tick must not count as
completing" already holds and only needs a regression assertion.

---

## 2. Derived values — computed per render, never stored

All of these are produced by `assets/js/progress.js` from `(items, progress)` and thrown away.
Signatures and exact semantics are fixed in
[contracts/progress-api.md](./contracts/progress-api.md).

### 2.1 Completion

The single derived boolean the whole feature rests on.

```
isCompleted(progress, id)  →  boolean
  = Boolean(progress?.[id]?.due)
```

**Validation rules**
- Idempotent in the number of completions: a question marked complete five times yields the same
  `true` as one marked once (FR-003).
- Monotonic within a record's life: once `due` is written it is never removed, so completion never
  reverts — including when the question falls due again (FR-004).
- Independent of `due`'s value: a past `due` still means completed (FR-004).
- Independent of `notes`, `status`, `interval`, `reps` (FR-005, and §1.2's vestigial note).

### 2.2 Track coverage

```
coverageByTrack(items, progress)  →  { [track]: { total, completed, notStarted, pct } }
```

**Validation rules**
- `total` = count of `items` in that track — from the library, never from the progress map.
- `completed` + `notStarted` = `total`, always. The two buckets are complementary by construction,
  so no question can be missing from both or in both.
- `0 ≤ completed ≤ total`, structurally: completion is only ever tested for ids drawn from `items`.
- `pct` = `total === 0 ? 0 : Math.round((completed / total) * 100)` — bounded to 0–100 without a
  clamp, and well-defined at `total === 0` (FR-012).
- A track with `total === 0` is present in the map with `pct: 0` and is **excluded** by callers from
  the bars and from weakest-track ranking. No division by zero is reachable.
- Orphan records — a `progress` entry whose id is absent from `items` — contribute to nothing.

### 2.3 Library totals

```
coverageTotals(items, progress)  →  { total, completed, notStarted, pct }
```
Same rules as §2.2 over the whole library. `completed + notStarted === total` is what makes the
dashboard headline self-checking, and is the FR-016 property that lets a candidate reconcile the two
numbers shown next to each other.

### 2.4 Review schedule and the due population

```
dueCountOf(items, progress, today)  →  number
reviewQueue(items, progress, today, limit)  →  Question[]
```

**Validation rules**
- A question is **due** iff `isCompleted` **and** `record.due <= today`. Completion and due-ness are
  independent readings of the same record; neither substitutes for the other (FR-004, FR-010).
- `today` is the candidate's **local** calendar date (`todayLocalISO()`), used identically for the
  `due` written by `rate()` and for every `<= today` comparison (FR-020).
- The queue's two buckets — due, then not-yet-completed — are **complementary and exhaustive** over
  the input: every question is in exactly one, or is completed-and-not-yet-due. No third state
  exists, so nothing can leak out the way a note-only record does today (FR-017).
- Due ordering is oldest `due` first; not-yet-completed follow in library order. Unchanged.
- Callers pass `items.filter(isDrillable)` — 550 of 629 questions — so the figure counts exactly what
  the queue will offer and can be driven to 0 (FR-010, SC-013). Coverage figures do **not** filter
  this way: `dsa` and `system-design` are completable and stay in coverage denominators.

### 2.5 Track ranking

```
weakestTracks(coverage, limit)  →  string[]
```
Tracks with `total > 0`, sorted by `pct` ascending, then `total` descending, then track name
ascending. Fully deterministic, including the all-zero fresh-history case (SC-007, US4 #3).

### 2.6 Display status

```
statusOf(progress, id)  →  'completed' | 'not-started'
```
Exactly two values (FR-015). Both are reachable on day one. Drives the Topics status filter and dot,
the DSA and System Design list dots, and the item/cheat-sheet status line. The former
`'new' | 'learning' | 'due' | 'known'` return set is gone, along with its `.status-dot--learning`,
`--known` and `--due` CSS rules.

### 2.7 Drillability

```
isDrillable(item)  →  boolean        // item.type !== 'dsa' && item.type !== 'design'
```
A predicate over content only — no learning state involved. Extracted so the dashboard's due figure
and `drill.js`'s queue provably share one population instead of each testing the types inline.

---

## 3. Check fixtures (test-only, never shipped to a device)

`tools/check-progress.mjs` builds these in memory. They are data, not entities of the product.

| Fixture | Shape | Exercises |
|---|---|---|
| Synthetic library | ~30 questions across 4 named tracks + one empty track + one `dsa`-typed and one `design`-typed question | coverage arithmetic, zero-total, drillability |
| Fresh history | `{}` | all-zero baseline, US4 #3 stability |
| Known history | fixed counts per track, uneven on purpose | SC-001, SC-003, SC-007 |
| Note-only record | `{ notes: 'hook' }` | FR-005, FR-017, FR-018, US3 |
| Re-rated record | rated 5×, `due` far future | FR-003, FR-004 |
| Past-due record | completed, `due` in the past | FR-004, FR-010 |
| Orphan record | id absent from the synthetic library | edge case 1, FR-012 |
| Timezone matrix | 24 local hours × {`Asia/Tokyo`, `America/Los_Angeles`} | FR-020, SC-008 |
| Six defect stand-ins | alternate implementations of the definition | SC-010 |

The live-library section reads the real manifest and packs and asserts only *structural* invariants
(per-track totals equal the sum of their packs; drillable + workspace = library total; an empty
history yields 0% for every track), deriving every number from content so content growth cannot make
the check fail spuriously.
