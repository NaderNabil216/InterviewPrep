# Phase 1 Data Model: Fill the Content Gap to a Complete Study Library

**Feature**: `001-fill-content-gap` · **Date**: 2026-08-09 · **Spec**: [spec.md](./spec.md) ·
**Research**: [research.md](./research.md)

Two families of data live in this system and must never be conflated. **Content** is authored on disk,
versioned, and replaced wholesale. **Learning state** belongs to the candidate, is keyed by permanent item
id, and is never touched by a content release. Every entity below is marked with which family it belongs
to.

Field-level JSON contracts are in [contracts/content-schema.md](./contracts/content-schema.md); the
persistence contract is in [contracts/storage-contract.md](./contracts/storage-contract.md).

---

## Entity map

```text
CONTENT (on disk, versioned, replaced wholesale)
  Library Registry (manifest.json)
    ├── Release[]        newest first, YYYY.MM.N
    ├── StackSnapshot    version-truth strings
    ├── PackMeta[]       ordered, grouped by track
    │     └── Content Pack (packs/*.json)
    │           └── Study Item ×N        ← id is permanent, the anchor for everything below
    └── PlanMeta[]
          └── Dated Plan (plans/*.json)
                └── Day[] → Plan Task[] → itemIds[] ──┐
                                                      │ resolves to
LEARNING STATE (candidate's device, keyed by item id) │
  Progress Record   { [itemId]: {...} } ←─────────────┘
  Plan State        { mode, activePlan, startedAt, done{}, checked{} }
  Session, Settings, Mock Results, Scratch
```

The arrow is the whole design: content points at items by id, learning state points at items by id, and
the two never point at each other. Reusing an id is the only way to break it.

---

## CONTENT entities

### Study Item

One question or exercise. The atomic unit of the library. Lives inside a Content Pack's `items[]`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | ✔ | `<prefix>-<4 digits>`. **Permanent. Never reused, reassigned, or renumbered.** |
| `track` | string | ✔ | Must equal the owning pack's `track` |
| `topic` | string | ✔ | Free-text bucket; reuse existing names within a track |
| `level` | 1\|2\|3\|4 | ✔ | Labels come from `assets/js/levels.js`, never hardcoded in a view |
| `type` | `qa`\|`concept`\|`dsa`\|`design` | ✔ | Governs which further fields are required |
| `q` | string | ✔ | The question as an interviewer would ask it |
| `tags` | string[] | | 2–4 lowercase kebab tags |
| `refs` | Ref[] | ✔ | **≥1, library-wide** (SC-017). Each needs `checked` |
| `addedIn` | version | ✔ | The release that introduced it |
| `updatedIn` | version | | The release that last changed it |

Per-type additions:

| Type | Adds | Prose field | Word bound |
|---|---|---|---|
| `qa` | `shortAnswer[3]`, `answer`, `code[]`, `followUps[]`, `traps[]` | `answer` | **120–250, ceiling 350, floor 80** |
| `concept` | `answer` | `answer` | none |
| `dsa` | `pattern`, `prompt`, `hints[3]`, `code[]`, `complexity`, `followUps[]`, `starter` | `prompt` | none |
| `design` | `prompt`, `framework`, `requirements[12-16]`, `referenceAnswer`, `rubric[10-14]`, `staffAdds[4-6]`, `diagram`, `timerMinutes` | `referenceAnswer` | none (target 700–1200) |

The word bound applies to `qa` only — resolved by the user on 2026-08-09, see
[research.md R-001](./research.md). Counting algorithm is fixed in R-002 and implemented once in
`tools/validate.mjs`.

**Validation rules**

- `id` unique across **every** `content/packs/*.json` on disk, registered or not (R-008 gate 1).
- `track` matches the owning pack; `level` in 1–4; `addedIn` resolves to a `releases[]` entry.
- Every `refs[]` entry carries `title`, an `http(s)` `url`, and a `checked` date.
- `qa.answer` inside bounds; ≥90% of all `qa` answers inside 120–250 library-wide (SC-016).
- No near-duplicate `q` against any existing item (FR-004).

**State transitions** — an item has no runtime state. Its lifecycle is editorial:

```text
authored ──► addedIn = R      (appears in What's New under R as NEW)
   │
   └─ edited ──► updatedIn = R'   (appears under R' as UPD)

never: renumbered · retracked · removed
```

### Content Pack

A named bundle of items for exactly one track. `{ id, title, track, items[] }`.

- A pack on disk that is **not** listed in `manifest.packs[]` does not exist — not to the app, not to
  `validate.mjs`, not to the candidate. `content/packs/coroutines-g-5.json` is in that state today
  (R-010).
- Registered by `tools/sync-manifest.mjs --write`, which inserts each pack after the last pack of the same
  track so track ordering never jumps.
- Pack ids follow `<track-base>-<n>` for generated packs (`kotlin-g-1`, `coroutines-g-5`, …).

### Library Registry (`content/manifest.json`)

The authoritative list of what the library contains.

| Field | Notes |
|---|---|
| `version` | `YYYY.MM.N`. **The update trigger** — content edits without a bump are unreachable |
| `generatedAt` | ISO date; stamped on release (fixed in Stage A, R-012) |
| `stackSnapshot` | Version-truth strings surfaced in cheat sheets; the single source of truth for version claims in authored content |
| `packs[]` | Ordered `PackMeta { id, title, track, file }`, grouped by track |
| `plans[]` | `PlanMeta { id, title, file }` |
| `releases[]` | **Newest first**, `{ version, date, summary }` |

**Validation rule (new)**: `releases[]` must be strictly descending under a *numeric* `YYYY.MM.N`
comparison — `2026.08.10` sorts above `2026.08.9`, which string comparison gets backwards (R-009).

### Release

A dated, versioned, summarised increment. Candidates accept or decline it; items are attributed to it.

- `version` is the manifest `version` after the release lands.
- `summary` is plain language, read before the candidate decides (FR-027, SC-013).
- An `addedIn` with no matching release means the item never appears in What's New.

Six releases in this feature: Stage A carries **no** release (app code only, not part of the snapshot),
then `2026.08.7` … `2026.08.11` (R-011).

### Dated Plan → Day → Plan Task

`content/plans/{7day,14day}.json` — `{ id, title, description, pace, days[] }`, each day
`{ title, focus, tasks[] }`, each task `{ kind, label, itemIds[] }`.

- **The `14day` id holds the 15-day plan.** The file, the plan id, and `planState.activePlan` all say
  `14day`; the title the candidate reads says "15-day deep plan", and the file really does hold 15 days.
  The id is **not** renamed: it is persisted on candidates' devices under `aip.v1.plan.activePlan`, and
  renaming it would strand their selection to fix a cosmetic mismatch — the wrong trade in a feature whose
  premise is that updates never disturb stored state.
- `kind` ∈ `read | drill | dsa | design`, and drives which view "open →" routes to.
- Every id in `itemIds[]` must resolve to a real item — `validate.mjs` fails otherwise.
- **New**: `pace: { dailyMinutes, note }` declares the daily budget the plan is sized against (FR-008).
  The schedule must fit it at the SC-002 paces — gate 14, an error. This is what makes SC-006 measurable;
  "completable in seven days" means nothing until the assumed study day is stated.
- A task with an empty `itemIds[]` has **no material**. This is the sole source of the ticks that FR-020
  permits to be cleared (R-005).
- **New**: a task's identity for completion purposes is its **material signature** — `itemIds` sorted and
  joined with `+` — not its position in the schedule.

---

## LEARNING STATE entities

All under the `aip.v1.` localStorage prefix, owned entirely by the candidate, never written by a content
release.

### Progress Record — `aip.v1.progress`

`{ [itemId]: { status, ease, interval, due, reps, lapses, lastRated, lastRating, notes } }`

- `status` ∈ `new | learning | known`; `due` is an ISO date; intervals in whole days.
- Written only by `srs.js#rate`. Untouched by `applyUpdate` — that is the central invariant.
- At 629 items a fully populated map is ~130 KB, comfortably inside localStorage once the snapshot
  vacates it (R-003).

### Plan State — `aip.v1.plan`

| Field | Type | Notes |
|---|---|---|
| `mode` | `free`\|`7day`\|`14day` | **New.** Default `free` (FR-015) |
| `activePlan` | `7day`\|`14day` | Which dated plan is selected when `mode` ≠ `free` |
| `startedAt` | ISO date \| null | Day 1 anchor |
| `done` | `{ [materialSignature]: true }` | **New.** Completion anchored to material (R-005) |
| `checked` | `{ "dayIdx:taskIdx": bool }` | **Legacy.** Read-only during migration, then dropped |

**Mode resolution** (legacy candidates, FR-015 + acceptance 3.7/3.8):

```text
mode present?            → use it
else startedAt non-null? → they had started a dated plan → activePlan, position and marks intact
else                     → free
```

An untouched candidate has no `aip.v1.plan` key at all, which is what makes the three cases
distinguishable.

**Tick migration** — one-time, at first boot after the modes release, and **necessarily before**
`applyUpdate()` swaps the snapshot, because the outgoing plan only exists inside the snapshot being
replaced:

```text
for each "d:t" in checked:
    task ← outgoingPlan.days[d].tasks[t]
    task.itemIds non-empty? → done[signature(task.itemIds)] = checked["d:t"]
    task.itemIds empty?     → cleared, and named in the pre-acceptance summary
```

### Session, Settings, Mock Results, Scratch

`aip.v1.session` (`lastItemId`, `lastView`, `history`), `aip.v1.settings` (`theme`, `interviewDate`,
`lastSeenChangelog`), `aip.v1.mockResults` (capped at 50), `aip.v1.scratch.<itemId>` (code drafts,
checklist ticks). Unchanged by this feature except that every write now reports failure (R-004).

### Progress Export bundle

`{ exportedAt, kind: 'aip-progress-export', version: 1, progress, session, plan, settings, mockResults }`
— the artifact SC-004 is measured with (export before, export after, compare). Gains `plan.mode` and
`plan.done`; `importProgress` must apply the same legacy resolution and tick migration as boot, so an old
export re-imported after the expansion reattaches correctly (acceptance 2.4).

---

## Derived, not stored

### Content Snapshot

The pinned copy the whole app renders from. **Persisted shape changes in this feature** (R-003):

| Field | Persisted | Derived on load |
|---|---|---|
| `version`, `generatedAt`, `stackSnapshot`, `releases`, `packMeta`, `packs`, `plans`, `fetchedAt` | ✔ | |
| `items` (flat array) | | ✔ flatten `packs` |
| `byId` (id → item) | | ✔ index `items` |

Storing all three cost 12,982 chars per item; storing one costs 4,444. Views see an identical object
either way. The snapshot moves from localStorage to IndexedDB in the same change — deduplication alone
still lands at ~5.6 MB at 629 items, over the ~5 MB localStorage cap with no headroom.

### Search index

`search.js` builds an in-memory index from `snapshot.items`. Rebuilt after every snapshot swap
(`app.js:186`). Never persisted.

### Free-study "today"

Computed per visit from `srs.js#buildQueue` + `masteryByTrack` — due count, next unseen from the weakest
tracks, mastery table. No stored schedule, which is exactly what makes free study a mode rather than a
plan (R-006).
