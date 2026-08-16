# Contract: Client Persistence

**Owner**: `assets/js/store.js` — the only module permitted to touch `localStorage` or `IndexedDB`.
**Consumers**: `content.js`, `srs.js`, every view.

The contract this feature preserves, and the two things it changes: the snapshot moves to IndexedDB and
stops being stored three times over, and every write reports whether it actually happened.

---

## 1. The invariant that does not change

Two namespaces that must never be conflated:

| | Content snapshot | Learning state |
|---|---|---|
| What | Pinned copy of the whole content set | Ratings, schedule, notes, ticks, mocks |
| Keyed by | — (one record) | **Permanent item id** |
| Written by | `applyUpdate()` only, wholesale | `srs.js#rate`, views, settings |
| On update | Replaced entirely | **Never touched** |

Updates cannot disturb progress **provided item ids are never reused or renumbered**. Moving the snapshot
to a different backing store does not weaken this — it strengthens it, by putting the two families in
physically separate stores.

---

## 2. Snapshot — **CHANGED**: IndexedDB, single copy

| | Before | After |
|---|---|---|
| Store | `localStorage["aip.v1.snapshot"]` | IndexedDB db `aip`, store `snapshot`, key `current` |
| Copies of each item | 3 (`packs[].items`, `items[]`, `byId{}`) | 1 (`packs[].items`) |
| Cost per item | 12,982 chars | 4,444 chars |
| At 629 items | ~8.17 M chars ≈ 16.3 MB | ~2.80 M chars, off the localStorage budget entirely |

**Persisted record**:

```jsonc
{ "version", "generatedAt", "stackSnapshot", "releases", "packMeta", "packs", "plans", "fetchedAt" }
```

**`stackSnapshotChecked` is deliberately not persisted.** The manifest field FR-036 adds
([content-schema §3](./content-schema.md)) is authoring evidence read by `validate.mjs`, never rendered
to the candidate. Keeping it out of the persisted record keeps this contract's projections exact and
keeps the rule simple: the snapshot carries what a view reads, and nothing else.

**Derived on load**, before the object is handed to any view — so `snapshot.items`, `snapshot.byId`, and
`snapshot.packs` all keep their current shape and no view changes:

```js
snapshot.items = Object.values(snapshot.packs).flatMap(p => p.items)
snapshot.byId  = Object.fromEntries(snapshot.items.map(i => [i.id, i]))
```

**API shape**:

```js
await Store.getSnapshot()        // Promise<snapshot|null>, derived fields populated
await Store.setSnapshot(snap)    // Promise<true> | throws StorageFailure
await Store.clearSnapshot()
```

`boot()` is already async. `applyUpdate()` becomes async; its single call site is `app.js:184`.

**Migration on boot** — idempotent, runs once:

```text
IndexedDB empty AND localStorage["aip.v1.snapshot"] present
  → parse it, rebuild derived fields, write to IndexedDB,
    then localStorage.removeItem("aip.v1.snapshot")   // frees ~2.4 MB for the candidate's own state
```

Deduplication alone was not enough: a single copy still projects to ~5.6 MB at 629 items against a ~5 MB
localStorage cap, with the candidate's progress competing for the same budget. See
[research.md R-003](../research.md).

---

## 3. Learning state — unchanged keys, `aip.v1.` in localStorage

| Key | Shape | Notes |
|---|---|---|
| `aip.v1.progress` | `{ [itemId]: { status, ease, interval, due, reps, lapses, lastRated, lastRating, notes } }` | ~130 KB at 629 items |
| `aip.v1.session` | `{ lastItemId, lastView, history }` | |
| `aip.v1.plan` | `{ mode, activePlan, startedAt, done, checked }` | **CHANGED**, §4 |
| `aip.v1.settings` | `{ theme, interviewDate, lastSeenChangelog }` | |
| `aip.v1.mockResults` | `Result[]`, capped at 50 | |
| `aip.v1.scratch.<itemId>` | per-item drafts and checklist ticks | |

No key is renamed, so an existing candidate's state is picked up as-is.

---

## 4. Plan state — **CHANGED**: mode, and completion anchored to material

```jsonc
{
  "mode": "free",          // NEW  — "free" | "7day" | "14day"; default "free" (FR-015)
  "activePlan": "14day",   // which dated plan is selected when mode !== "free"
  "startedAt": "2026-08-09",
  "done": { "kt-0001+kt-0002": true },   // NEW  — keyed by MATERIAL SIGNATURE
  "checked": { "0:2": true }             // LEGACY — read-only during migration, then dropped
}
```

**Material signature**: `[...task.itemIds].sort().join('+')`. Position-independent by construction, which
is the whole point — a hand-tick keeps meaning the material it was earned on, wherever that material
later sits.

**Mode resolution** (FR-015, acceptance 3.7 / 3.8) — an untouched candidate has no `aip.v1.plan` key at
all, which is what makes the three cases distinguishable:

```text
mode present            → use it
startedAt non-null      → they had started a dated plan; keep it, position and marks intact
otherwise               → free
```

**Tick migration** — one-time, and **necessarily before `applyUpdate()` swaps the snapshot**, because the
outgoing plan exists only inside the snapshot being replaced:

```text
for each "d:t" in checked:
    task ← outgoingSnapshot.plans[activePlan].days[d].tasks[t]
    itemIds non-empty → done[signature(itemIds)] = checked["d:t"]
    itemIds empty     → CLEARED, and listed by label in the pre-acceptance modal
```

Post-condition, and the SC-004 measurement: 0 marks end up attached to material the candidate never saw;
the only marks lost are those on tasks that pointed at no material, and they are named before the
candidate accepts.

Auto-completion (`plan.js#autoDone` — every linked item rated) already follows the material and is
unchanged.

---

## 5. Failure reporting — **NEW**

Today `store.js#write` swallows every exception into `console.error`. A `QuotaExceededError` on a rating
therefore looks exactly like success.

**Contract**:

```js
Store.write(key, value) -> true            // persisted
                        -> throws StorageFailure { key, cause, quotaExceeded }
```

| Failure | Surface | Recovery offered |
|---|---|---|
| Progress / session / plan / scratch write | **Persistent banner**, not a toast — "Your last rating could not be saved" | **Export progress** button |
| Snapshot write during `applyUpdate` | Same banner + modal stays open | Previous snapshot left intact — candidate stays on the library they had |
| Snapshot write on first boot | Blocking notice | Retry; the app still runs from the in-memory copy for that session |

A toast (`app.js:39`) auto-dismisses in 3.2 s, which is not acceptable for a silently lost rating — hence
a banner that persists until dismissed.

Before a large update is applied, `navigator.storage.estimate()` is consulted where available and the diff
modal reports projected size, satisfying SC-015's "a device that cannot store it says so rather than
failing quietly".

---

## 6. Export / import

```jsonc
{ "exportedAt", "kind": "aip-progress-export", "version": 1,
  "progress", "session", "plan", "settings", "mockResults" }
```

`plan` now carries `mode` and `done`. **`importProgress` must apply the same legacy resolution and tick
migration as boot**, so a bundle exported before the expansion reattaches correctly when re-imported after
it (acceptance 2.4). `kind` and `version` are unchanged, so old bundles remain importable.
