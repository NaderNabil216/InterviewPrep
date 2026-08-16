# Phase 1 Data Model: Improvements

**Feature**: `002-improvements` · **Date**: 2026-08-14 · **Spec**: [spec.md](./spec.md) ·
**Research**: [research.md](./research.md)

This feature does not touch the CONTENT/LEARNING-STATE split documented in
`specs/001-fill-content-gap/data-model.md` — it operates entirely *within* that model. Nothing here
introduces a new store, changes what family an entity belongs to, or gives content a way to reach into
learning state. Only entities this feature adds, extends, or retires are described below; everything else
(Study Item's core fields, Library Registry, Plan State's tick-signature keying, Store's
`localStorage`/IndexedDB split) is unchanged and is not repeated here.

Field-level deltas are in [contracts/content-schema-delta.md](./contracts/content-schema-delta.md); the
new external interface is in [contracts/dsa-run-contract.md](./contracts/dsa-run-contract.md); storage
additions are in [contracts/storage-contract-delta.md](./contracts/storage-contract-delta.md).

---

## Entity map (deltas only)

```text
CONTENT (on disk, versioned, replaced wholesale)
  Study Item
    ├── (dsa items)    + sampleCall            ← NEW: authored Kotlin call expression, feeds generated driver
    └── (design items) requirements[] SPLIT →  clarifyingQuestions[]  (step 1, new)
                                                requirements[]         (step 2, unchanged shape, clarify-flavored
                                                                        bullets removed — see migration note)
                        framework (framework item sd-0000 only) — rewritten in place, same field, two
                                                                   labeled phases instead of one flat sequence

LEARNING STATE (candidate's device, keyed by item id) — no schema change to persisted progress:
  Progress Record        unchanged shape; rate() always called with a fixed outcome (R-004) — the record
                          it writes is byte-for-byte the same shape "Good" produces today
  Mock Results            avgScore (1–4) RETIRED → completedCount / completedPct (new shape, same store key)
  Settings                + judge0ApiKey (new, candidate-supplied, never shipped by the app)
  Scratch (per item)      DSA scratch entries gain a transient, NOT-persisted in-memory Run Result
                          (see below) — the persisted `{ code }` shape is unchanged, satisfying FR-021
  Session (in-memory App state) + sessionActive flag — gates when a pending auto-sync diff may apply (R-003)

EPHEMERAL (neither content nor learning state — exists only for the duration of one interaction)
  Content Sync Diff       same descriptor `checkForUpdates()` already returns today; now computed on a
                          schedule (R-003) instead of on click, and applied without a confirm step
  DSA Run Result          real stdout, or a compile/runtime-error message, from one Judge0 submission —
                          held in view-local state only; never written to Scratch or any other persisted
                          store, so navigating away and back re-shows the persisted code but not a stale
                          result (matches FR-021's "code persists," not "last run result persists")
  Timer Pause State       Drill: `pausedMs` accumulator + `revealedAt` timestamp, both view-local, reset
                          per session. Mock: `revealed` boolean gating the existing `timeLeft` countdown,
                          also view-local. Neither is persisted — a Drill/Mock session's elapsed/remaining
                          time has never survived a reload, and this feature doesn't change that.
```

---

## CONTENT entity changes

### Study Item — `type: "dsa"` addition

| Field | Type | Required | Notes |
|---|---|---|---|
| `sampleCall` | string | ✔ (new, batch-gated) | A single Kotlin expression invoking the item's function with authored literal arguments, e.g. `"threeSum(intArrayOf(-1,0,1,2,-1,-4))"`. Appended inside a generated `fun main() { println(${sampleCall}) }` wrapper around the candidate's editor contents when "Run" is pressed (R-007). Not itself executed as a test — there is no expected-output comparison anywhere in this field or elsewhere in the schema, per the spec's "execute-and-display only" decision. |

Every other `dsa`-type field (`pattern`, `prompt`, `hints[]`, `complexity`, `starter`, `code[]`) is
unchanged. `sampleCall` is authored in the same batched, `validate.mjs`-gated process as the rest of this
feature's content work (R-006) — not required to land in one pass across all ~19+ existing DSA items, but
gated per batch like the short-summary rewrite.

### Study Item — `type: "design"` restructuring

| Field | Type | Required | Notes |
|---|---|---|---|
| `clarifyingQuestions` | array of string, min 3 entries | ✔ (new, on every design item including the framework item `sd-0000`; no exemption — FR-027b) | The subset of what today lives inside one flat `requirements[]` array that reads as "ask this before proposing anything" — split out so the view (below) can gate on it as Step 1. Order matters: rendered in authored order, all before any Step-2 content is reachable. **Plain question strings only** — never objects, never question/answer pairs, no authored answer per question (FR-027a); the answers live in the Step-2 plan content the candidate reveals afterward. |
| `requirements[]` | array of string | ✔ (existing field, content re-scoped) | Retained as the Step-2 "cover this in your plan" checklist (design.js's existing "tick as you cover them out loud" behavior, unchanged) — but re-authored per item to remove the clarify-flavored bullets now living in `clarifyingQuestions[]`, so the two lists are disjoint, not overlapping. |
| `framework` | string (markdown) | conditionally required (existing field — required in practice on the framework item `sd-0000`, optional pointer on scenarios) | Content, not shape, changes: `sd-0000`'s current flat 8-section sequence is rewritten into two explicitly labeled phases — "Phase 1 — Clarify" and "Phase 2 — Plan" — so it documents the same two-step structure the view now enforces (FR-029). Scenario items that only *point* at the framework (e.g. `sd-0001`'s short pointer paragraph) are updated to reference the two-phase structure by name, not restated in full. |

`referenceAnswer`, `rubric[]`, `staffAdds[]`, `timerMinutes`, `diagram`, `isFramework` — all unchanged in
shape; `referenceAnswer` is reviewed for content consistency with the new two-phase framework but keeps its
existing field role (revealed as Step 2's deep-dive, gated the same way it is today).

**Migration note**: this is a content-authoring change (batched, per-pack, `validate.mjs`-gated — R-006),
not a runtime migration. There is no candidate-facing "old design item shape" to migrate away from, because
`requirements[]`/`framework` are content fields replaced wholesale on the next release like any other
content edit — nothing in Learning State references a `requirements[]` array index or position (Progress
Record and Plan State key everything by item id, never by a position inside an item's own fields), so
Principle II is not in play here at all.

---

## LEARNING STATE entity changes

### Progress Record

No shape change. `rate(itemId, 'good')` (R-004) writes the identical `{ status, ease, interval, reps,
lapses, due, lastRated, lastRating }` shape today's "Good" button already produces. `lastRating` becomes a
constant value (`'good'`) for every future rating — nothing reads that field back today, so this has no
observable effect anywhere else in the app.

### Mock Results

| Field | Before | After |
|---|---|---|
| `avgScore` | float, 1–4, derived from `RATE_SCORE` per graded rating | **retired** |
| `completedCount` / `completedPct` | — | **new** — count (and percentage) of items in the session marked complete; replaces the self-graded average as the summary metric shown on the mock landing sparkline/table (`mock.js:15-53`) and in `Store.addMockResult` |

`mode`, `itemCount`, `date` — unchanged.

### Settings

| Field | Type | Notes |
|---|---|---|
| `judge0ApiKey` | string, optional | Candidate-supplied RapidAPI key for Judge0 CE, entered once in Settings and stored locally like every other per-device setting. Never populated by the app itself, never shipped in any content release, never transmitted anywhere but as a request header on the candidate's own Run calls (R-007). Absence is a normal, expected state — Run's UI treats "no key" as one more flavor of "Run needs setup," not an error. |

### Scratch (`aip.v1.scratch.<id>`)

Persisted shape for DSA items is unchanged (`{ code, revealed }`, per existing `store.js:264-266`) — FR-021
only requires the *code* to persist across navigation, which it already does today via the same key this
feature reuses. A Run Result is deliberately **not** added to this persisted shape (see Ephemeral, above) —
it lives only in the DSA view's in-memory state for as long as the candidate stays on the page.

### Session (in-memory `App` state)

| Field | Type | Notes |
|---|---|---|
| `sessionActive` | boolean | New. Set `true` on Drill/Mock session entry, `false` on completion or navigating away. Read by the automatic sync trigger (R-003) to defer *applying* an already-detected diff until the candidate isn't mid-session; does not defer the cheap version-compare check itself. |

---

## EPHEMERAL entities (new to this feature, never persisted)

### Content Sync Diff

Unchanged descriptor shape from `checkForUpdates()` today (`added`/`updated`/`removed`/`_diskManifest`/
etc., `content.js:69-106`). What changes is *when* it's computed (schedule, not click — R-003) and that a
found diff with `hasUpdates: true` is applied automatically once `App.sessionActive` is false, rather than
held pending a user's confirm-click.

### DSA Run Result

| Field | Type | Notes |
|---|---|---|
| `kind` | `'pending' \| 'output' \| 'compile-error' \| 'runtime-error' \| 'needs-connection' \| 'needs-key' \| 'not-runnable'` | Discriminates what the Run panel renders. `'pending'` (FR-020b) is set the moment a request is sent and clears any prior result, so a stale output can't be mistaken for the current one; `'not-runnable'` (FR-019c) covers an item whose `sampleCall` batch hasn't landed yet — Run is disabled and no request is sent. |
| `text` | string | `stdout` on `'output'`; `compile_output` or `stderr` on the error kinds; a fixed user-facing message on `'pending'`/`'needs-connection'`/`'needs-key'`/`'not-runnable'`. Never contains the candidate's API key or a dump of the outgoing request (FR-018a). |
| `statusLabel` | string, optional | Judge0's human-readable `status.description` (e.g. "Accepted", "Compilation Error"), shown alongside `text` when present. |

Never written to `Scratch` or any other persisted store (see Scratch, above) — this is intentionally
throwaway, view-local state, consistent with there being no pass/fail verdict to remember (the spec's
"execute-and-display only" decision, R-007).

### Timer Pause State

Drill: `{ startedAt, pausedMs, revealedAt }`, all view-local numbers/timestamps, reset fresh every session
— no change to the fact that Drill's clock has never survived a page reload. Mock: `{ timeLeft, revealed }`
— `timeLeft` is the pre-existing overall-session-budget integer (`mock.js:80`), untouched by this feature
except that decrementing it is now gated by the new `revealed` boolean (R-005); both remain view-local.
