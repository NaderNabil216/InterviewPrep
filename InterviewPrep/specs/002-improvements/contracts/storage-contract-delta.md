# Contract Delta: Storage (`localStorage` / IndexedDB)

**Feature**: `002-improvements` · **Spec**: [../spec.md](../spec.md) · **Data model**: [../data-model.md](../data-model.md)

Delta against `specs/001-fill-content-gap/contracts/storage-contract.md`. The snapshot/progress physical
split, the `aip.v1.` namespace, and IndexedDB `aip`/`snapshot`/`current` are all unchanged — this feature
adds one new settings field, changes one derived-value shape, and adds nothing to IndexedDB.

## `aip.v1.settings` — new field

| Key | Type | Notes |
|---|---|---|
| `judge0ApiKey` | string, optional | Candidate-supplied RapidAPI key for Judge0 CE (`dsa-run-contract.md`). Written only by the candidate via a Settings form field — the app never writes a default or placeholder value here, and no content release or manifest ever populates it. Omission is a normal, expected state, not an error condition to migrate away from. **Read-path restriction (FR-018a)**: the only permitted consumer is the `X-RapidAPI-Key` header on the candidate's own Run request. It is never logged to `console`, never included in a rendered error message or Run Result, never placed in a URL or query string, and never transmitted to any other host — including this site's own origin. |

## `aip.v1.mockResults` — shape change

| Field | Before | After |
|---|---|---|
| `avgScore` | float 1–4 | **removed** |
| `completedCount` | — | **added** — integer, items marked complete in the session |
| `completedPct` | — | **added** — `completedCount / itemCount`, for the existing sparkline/table display |

`mode`, `itemCount`, `date` unchanged. Existing stored `mockResults` entries from before this feature still
carry the old `avgScore` field — the landing view's rendering code should tolerate its absence (new
entries) and its presence (old entries) rather than requiring a one-time rewrite of historical rows; this
is a read-side fallback, not a migration, since past mock summaries are historical record, not live state
anything re-derives from. This behavior is required at the spec level by **FR-014b**, not merely a
contract-level convenience: old rows must keep displaying (labelled as the older metric), and must not be
back-filled into the new shape — no completion data exists for a session graded before the change.

## `aip.v1.progress` — no shape change

`rate(itemId, 'good')` writes the exact same record shape `setItemProgress` has always accepted (R-004 in
research.md). No migration is needed or performed.

## `aip.v1.scratch.<id>` — no shape change

DSA Run Result is deliberately **not** added here (see data-model.md's Ephemeral entities) — it is
view-local state, never written to `Scratch` or any other persisted key. The persisted `{ code, revealed }`
shape is unchanged.

## IndexedDB (`aip` / `snapshot` / `current`)

No change. The automatic-sync trigger (R-003) calls the same `Store.getSnapshot()`/`setSnapshot()` and
`applyUpdate()` this store already exposes — only *when* they're called changes (schedule, not click), not
their shape or the wholesale-replace semantics.

## New in-memory-only state (not in any store)

`App.sessionActive` (boolean) and the DSA view's per-request `AbortController` are runtime-only — neither
is written to `localStorage` or IndexedDB, and neither survives a reload. Listed here only so a future
storage audit doesn't go looking for them.
