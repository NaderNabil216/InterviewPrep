# Contract: user-visible surfaces — figures, populations, exact labels

**Feature**: `007-dashboard-progress-sync` | **Date**: 2026-08-20

FR-009 and FR-016 are **copy** requirements: every figure must name the population it counts, and two
figures shown side by side must be reconcilable or must say why they are not. Copy left to each view
is how three definitions and four unlabelled numbers came to coexist, so the copy is pinned here and
reviewed as a contract. Example figures below use a history of 12 completed questions against the
current 629-question library.

All labels are sentence case. No figure may use a word implying long-term mastery — "mastery",
"known", "learning" and "touched" are all retired from user-visible text (FR-009).

---

## S1 — Dashboard (`assets/js/views/dashboard.js`)

### S1.1 Hero summary line

```
Snapshot v2026.08.34 · 629 questions · 12 completed · 617 not started
```

- Population: the whole library, for all three numbers. `12 + 617 = 629`, so a reader can add the two
  visible parts and get the total — the FR-016 property, self-checking (FR-008).
- `completed` comes from `coverageTotals(...).completed`, counted **over `snapshot.items`**, so a
  record for a retired question is not counted (FR-012, edge case 1).
- Replaces `… 629 items · 43 touched · 0 known`. "touched" and "known" both go.
- Shell phase: `Snapshot v2026.08.34 · — questions · — completed · — not started` (FR-011).

### S1.2 Review queue card

| Slot | Copy |
|---|---|
| eyebrow | `Review queue` |
| heading | `7 due for review` |
| faint, `due > 0` | `Completed questions ready to come back. DSA and System Design have their own workspaces and are not counted here.` |
| faint, `due === 0` | `Nothing due right now — keep reading new material.` |
| faint, loading | `Loading your review queue…` |
| button | `Start drill →` (primary when `due > 0`) |

- Population: `dueCountOf(items.filter(isDrillable), progress)` — 550 of 629 questions. **This is the
  figure the adjacent button must be able to drive to zero** (FR-010, SC-013). It currently counts all
  629, including 79 questions the drill never offers.
- The figure is distinct from completion and is never merged into a coverage bar (FR-010).

### S1.3 Free-study "Today" card

| Slot | Copy |
|---|---|
| eyebrow | `Today · Free study` |
| heading | `7 due for review · 617 of 629 not started` |
| faint | `Due counts your review queue — DSA and System Design have their own workspaces and are not in it. Not started counts the whole library.` |

This is the one place two different populations appear in one line, so the faint line states both
(FR-016). `not started` is `coverageTotals(...).notStarted` over the full library, replacing
`unseen.length`, which excluded note-only questions from *both* sides of the ledger.

Shell phase: `— due for review · — not started`.

### S1.4 Coverage-by-track card

| Slot | Copy |
|---|---|
| eyebrow | `Coverage by track` (was `Mastery by track`) |
| row | `Kotlin` · progress bar · `12/70 · 17%` |
| loading | `Loading track coverage…` |

- FR-007 requires both the count out of the track total **and** the percentage — the current row shows
  only a percentage.
- Row order: `total` descending, as today.
- Tracks with `total === 0` are omitted (FR-012, edge case 2).
- All 13 tracks appear, `dsa` and `system-design` included: they are completable through their own
  workspaces and belong in coverage (SC-012).
- A bar may legitimately fall from 100% when a content release adds questions to that track. The
  figure is derived per render and must **not** be frozen to look tidy (edge case 3).

### S1.5 "Next up"

Rows are unchanged in shape. The source becomes
`weakestTracks(coverage, 3)` → `notCompleted(items, progress)` filtered to those tracks, 2 per track,
5 maximum — replacing "no record at all" with "not completed" (US4 #2). A fully completed track
contributes nothing (US4 #4). Empty-state copy when nothing is left: `You have completed every
question — drill what is due.`

---

## S2 — Study plan (`assets/js/views/plan.js`)

### S2.1 Free-study cards

| Card | eyebrow | figure | faint |
|---|---|---|---|
| 1 | `Due for review` | `7` | `Reviews ready in your drill queue. DSA and System Design have their own workspaces and are not counted here.` |
| 2 | `Not started` | `617` | `Questions you have not marked complete, out of 629 in the library.` |
| 3 | `Weakest tracks` | rows `Kotlin` / `12/70 completed` | empty: `Mark a few questions complete to see this.` |

- Card 1's population is identical to S1.2's, from the same call with the same arguments — that
  identity is what SC-003/SC-004 check between the two surfaces.
- Card 2 replaces the `Unseen` card and its `Items you have not rated yet` copy.
- Card 3's rows replace `${m.known}/${m.total} known` and use the shared `weakestTracks` order
  (limit 4, as today).
- The "Next up" section's muted line becomes `Questions you have not completed, from the tracks you
  have covered least.`

### S2.2 Dated plan (7-day / 15-day)

- Per-day counter `2/5` is unchanged in shape; what changes is which tasks count, via `autoDone`
  (FR-013).
- The `auto` chip's tooltip becomes `Auto-completed: every question this task links to is marked
  complete` (was "…has been rated").
- Manual ticks continue to win over the derived value, in both directions (FR-013). No stored tick is
  written, cleared, or re-keyed by this feature.
- A task whose questions were only noted now reads as **not** done, silently, with the note intact and
  the checkbox available (FR-019).

---

## S3 — Topics browser (`assets/js/views/topics.js`)

### S3.1 Status filter — exactly two completion states

```
<option value="all">Any status</option>
<option value="not-started">Not started</option>
<option value="completed">Completed</option>
<option value="new-content">✨ New in v2026.08.34</option>
```

- `Learning`, `Due for review` and `Known` are removed. `Known` was the unreachable option SC-006
  names — it could not match anything for 32 days.
- `✨ New in v…` is retained: it filters on `addedIn`/`updatedIn`, is not a review-state option, and is
  reachable on day one of any release ([research.md](../research.md) §8).
- **Legacy URLs**: `#/topics?status=known` (and `learning`, `due`, `new`) exist in candidates'
  history. Any `status` value outside the four above falls back to `all`, so an old bookmark shows the
  library rather than an empty result.

### S3.2 Per-question dot and header

- `<span class="status-dot status-dot--not-started">` / `--completed`.
- Header line: `142 of 550 questions match your filters.` ("questions", not "items".)
- The browser continues to exclude `dsa`/`design` types. For those two tracks, cross-surface agreement
  is checked dashboard-vs-plan instead (spec clarification, SC-003).

---

## S4 — Item, cheat sheets, DSA, System Design, drill, mock

| Surface | Change |
|---|---|
| `item.js` status line | `Status: Completed · next review 2026-08-23` / `Status: Not started`. Was printing the raw `statusOf` token (`learning`). |
| `cheatsheets.js` detail | Same status line, plus the **Mark complete** action required by FR-028 — already present in the working tree. The action must not appear in print; `@media print { .rate-row { display: none !important; } }` at `app.css:352` already ensures this, so no new print rule is needed. |
| `cheatsheets.js` list | Sheet cards' dots use the two-state classes. |
| `dsa.js`, `design.js` lists | Dots use the two-state classes (FR-006 — the workspace lists must not keep a four-state reading). |
| `drill.js`, `mock.js` | No label change. Both gain the FR-024 guard: a failed write neither advances the card nor increments the session counter. |
| all five `rate()` call sites | On `StorageFailure`, no success toast, no counter, no advance. The persistent storage banner raised by `store.js` is the candidate's notice (FR-024). |

---

## S5 — Stylesheet and cache busting (`assets/css/app.css`, `index.html`)

| Change | Detail |
|---|---|
| Status dots | Replace `.status-dot--new` / `--learning` / `--known` / `--due` with `.status-dot--not-started` (`var(--blue)`) and `.status-dot--completed` (`var(--accent)`). The removed rules have no remaining referents. |
| Coverage row | Rename `.mastery-row` → `.coverage-row` (and `.mastery-row + .mastery-row`), widening the trailing column from `46px` to fit `12/70 · 17%` — `grid-template-columns: 160px 1fr 96px`. Leaving the word "mastery" in the class name is how the retired definition survives a refactor. |
| Print | No change. `.rate-row` is already hidden in print. |
| Cache | `index.html`: `assets/css/app.css?v=8` → `?v=9` (per `CLAUDE.md` — a stale cache here would show unstyled dots). |

---

## S6 — Loading states (FR-011)

`dashboard.js`'s existing shell-phase marker (`snapshot.items.length === 0`) is retained and is the
**only** gate — never a per-value check, so a genuine zero still renders as `0` once content has
loaded.

| Figure | Shell phase |
|---|---|
| hero counts | `—` for each of the three |
| due for review | `—` + `Loading your review queue…` |
| free-study heading | `— due for review · — not started` |
| coverage card | `Loading track coverage…` |
| Next up | `Loading your library…` |

`plan.js` and `topics.js` render from the same snapshot and inherit the same behaviour: with zero
items they show zero rows, which is the existing accepted state for those views and is not changed
here.

---

## S7 — Freshness (FR-021)

`app.js#navigate()` renders directly when the target hash equals `location.hash`, so asking for a
surface you are already on re-reads stored history. This makes the top-bar **Dashboard** button, the
brand button, and any in-view `data-nav` pointing at the current view all re-read progress.

`topics.js`'s debounced keyword sync switches to `history.replaceState()` so it never triggers that
re-render mid-typing — without which the new path would destroy the focused input when a candidate
types and deletes back to the original text ([research.md](../research.md) §9).
