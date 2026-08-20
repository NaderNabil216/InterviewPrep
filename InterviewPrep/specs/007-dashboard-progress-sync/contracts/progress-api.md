# Contract: `assets/js/progress.js` — the single definition of progress

**Feature**: `007-dashboard-progress-sync` | **Date**: 2026-08-20

This is the interface the whole feature hangs from: the one module that decides what "completed"
means, consumed unmodified by the browser app and by `tools/check-progress.mjs`. Its exported surface
is a contract because FR-006 forbids any surface from applying its own variant — a caller that
recomputes one of these values inline is a defect regardless of whether it happens to agree.

---

## C0 — Module invariants (non-negotiable)

| # | Invariant | Why |
|---|---|---|
| C0.1 | **Imports nothing.** No `import` statement of any kind. | It must load in Node without a browser, and in the browser without a build step ([research.md](../research.md) §2). |
| C0.2 | **Touches no storage and no DOM.** No `Store`, `localStorage`, `indexedDB`, `document`, `window`, `location`, `fetch`. | Purity is what lets one copy serve both consumers. Storage access lives in `srs.js`. |
| C0.3 | **No side effects at module scope** beyond `const` declarations. No timers, no logging, no mutation of inputs. | Importing it must be free and repeatable. |
| C0.4 | **Every function is pure**: same arguments → same result, and no argument is mutated. `progress` and `items` are read-only inputs. | Callers pass live snapshot arrays and the parsed progress map; mutating either would corrupt state a view is mid-render on. |
| C0.5 | **No `Date.now()` or bare `new Date()` inside a comparison path.** Anything date-dependent takes the date as an argument, defaulted. | Makes FR-020/SC-008 checkable without touching a system clock. |
| C0.6 | **No hard-coded track names, track counts, or item totals.** | Content grows; the module must not need editing when it does. |

A violation of C0.1 or C0.2 breaks the Node check outright and is caught immediately. C0.4–C0.6 are
review obligations, called out in [quickstart.md](../quickstart.md) step V0.

---

## C1 — `isCompleted(progress, id) → boolean`

The definition. `progress` is the `aip.v1.progress` map; `id` is a permanent question id.

```
isCompleted(progress, id)  ≡  Boolean(progress && progress[id] && progress[id].due)
```

| Input | Result | Requirement |
|---|---|---|
| no record | `false` | FR-001 |
| `{ notes: 'hook' }` | `false` | FR-005, FR-018 |
| record with any truthy `due` | `true` | FR-001, FR-002 |
| `due` in the past | `true` | FR-004 |
| rated 5× | `true` (counted once by every caller) | FR-003 |
| `{ status: 'known' }` with no `due` | `false` | data-model §1.2 — `status` is vestigial |
| `progress` is `null`/`undefined` | `false` | shell-phase safety |

A companion `isCompletedRecord(record) → boolean` is exported for callers that already hold the
record. `isCompleted` MUST be defined in terms of it, so there is one predicate, not two.

---

## C2 — `statusOf(progress, id) → 'completed' | 'not-started'`

Exactly two values, both reachable on the candidate's first day (FR-015, SC-006). Returns
`'completed'` iff `isCompleted`. No third value may be added; a review-state value in particular is
forbidden — review state is reported by the due figure and by the queue, not by a per-question badge.

The strings double as CSS class suffixes (`.status-dot--completed`, `.status-dot--not-started`) and as
Topics' `?status=` query values, so they MUST stay kebab-case and URL-safe.

---

## C3 — `isDrillable(item) → boolean`

```
isDrillable(item)  ≡  item.type !== 'dsa' && item.type !== 'design'
```

Content-only; no learning state. The single source for "can the review queue present this?", replacing
the inline test at `drill.js:12` and fixing the dashboard's mismatched due figure (FR-010). Over the
current library this admits 550 of 629 questions.

---

## C4 — `todayLocalISO(date = new Date(), offsetDays = 0) → 'YYYY-MM-DD'`

The candidate's **local** calendar date, formatted from `getFullYear()` / `getMonth()` / `getDate()`
with zero-padding. Never `toISOString()`.

| Property | Requirement |
|---|---|
| At 00:30 local in any zone, returns that local date — not the UTC one | FR-020, SC-008 |
| `offsetDays` advances by whole local calendar days, handling month/year and DST boundaries via `Date#setDate` | FR-020 |
| Does not mutate the `date` argument | C0.4 — clone before `setDate` |
| Result is directly comparable with stored `due` strings by `<=` | keeps the existing record format |

Used by both sides of the comparison: `rate()` writes `due: todayLocalISO(new Date(), interval)`, and
every read compares against `todayLocalISO()`.

---

## C5 — `coverageByTrack(items, progress) → { [track]: TrackCoverage }`

`TrackCoverage` = `{ total: number, completed: number, notStarted: number, pct: number }`.

| # | Guarantee | Requirement |
|---|---|---|
| C5.1 | `total` counts `items`, never `Object.keys(progress)` | FR-012, edge case 1 |
| C5.2 | `completed + notStarted === total` for every track | FR-016 reconcilability |
| C5.3 | `0 ≤ completed ≤ total` structurally, with no clamp | FR-012 |
| C5.4 | `pct = total === 0 ? 0 : Math.round((completed / total) * 100)` | FR-012 |
| C5.5 | A track appears iff at least one item names it; a `total: 0` track yields `pct: 0` and no division | FR-012, edge case 2 |
| C5.6 | Records for ids absent from `items` contribute to nothing | edge case 1 |
| C5.7 | Called with the full library (`items`), **not** the drillable subset — `dsa` and `system-design` are counted | spec edge case, SC-012 |

## C6 — `coverageTotals(items, progress) → TrackCoverage`

The same shape over the whole library. `completed + notStarted === total` is the property the
dashboard headline is built on, so a reader can add the two visible numbers and get the third
(FR-008, FR-016).

---

## C7 — `notCompleted(items, progress) → Question[]`

`items` filtered to those failing `isCompleted`, in input order. Replaces the three inline
`items.filter(i => !progress[i.id])` "unseen" computations at `dashboard.js:47`, `plan.js:46` and
`plan.js:52` — which today exclude note-only questions from "unseen" while also refusing to count
them as progress, so those questions appear nowhere at all.

---

## C8 — `dueCountOf(items, progress, today = todayLocalISO()) → number`

Count of `items` that are **completed and due**: `isCompleted(progress, id) && progress[id].due <= today`.

Callers pass `items.filter(isDrillable)`. The contract obligation is SC-013: after the queue built
from the same arguments is fully cleared, this MUST return 0.

## C9 — `reviewQueue(items, progress, today = todayLocalISO(), limit = Infinity) → Question[]`

```
due       = items where isCompleted && record.due <= today      → sorted by record.due ascending
pending   = items where !isCompleted                            → input order
return [...due, ...pending].slice(0, limit)
```

| # | Guarantee | Requirement |
|---|---|---|
| C9.1 | The two buckets are complementary and exhaustive: every item is in `due`, in `pending`, or is completed-and-not-yet-due. **No item can fall out of all three.** | FR-017 |
| C9.2 | A note-only record puts its question in `pending` | FR-017, FR-018, US3 #2 |
| C9.3 | `dueCountOf(items, progress, today)` equals the size of the `due` bucket for the same arguments | FR-010, SC-013 |
| C9.4 | Ordering and the `limit` cap match today's `buildQueue` | out-of-scope preservation |

C9.1 is the invariant that closes the leak. It must hold as a property of the classification (one
`isCompleted` test, two branches), not as the coincidence of two independent conditions.

---

## C10 — `weakestTracks(coverage, limit = Infinity) → string[]`

Input is a `coverageByTrack` result. Tracks with `total === 0` are excluded. Sort order:

1. `pct` ascending
2. `total` descending
3. track name ascending

| Property | Requirement |
|---|---|
| Genuine ascending order of completion | SC-007 |
| Deterministic and non-empty on an all-zero fresh history | US4 #3 |
| A 100% track ranks last and contributes no `notCompleted` items to "Next up" | US4 #4 |

---

## C11 — `srs.js`, the storage adapter

`srs.js` keeps its module path and its currently-imported export names, reads
`Store.getProgress()` once per call, and delegates. It MUST NOT reimplement any rule above.

| `srs.js` export | Delegates to | Change |
|---|---|---|
| `rate(itemId, rating)` | — | interval maths **unchanged**; `todayISO` → `todayLocalISO`. Still writes the vestigial `status`. |
| `statusOf(id)` | `P.statusOf` | return set becomes two values |
| `isDue(id)` | `P.dueCountOf`-equivalent single-item test | now local-date based |
| `buildQueue(items, limit)` | `P.reviewQueue` | note-only records no longer vanish |
| `dueCount(items)` | `P.dueCountOf` | callers pass the drillable subset |
| `coverageByTrack(items)` | `P.coverageByTrack` | **renamed** from `masteryByTrack`; `known` → `completed` |
| `masteryByTrack` | — | **removed**, not aliased ([research.md](../research.md) §3) |

`rate()`'s return value stays the stored record, and it still **throws** `StorageFailure` on a failed
write rather than returning a falsy value — every call site must treat a throw as "not completed"
(FR-024, research.md §12).
