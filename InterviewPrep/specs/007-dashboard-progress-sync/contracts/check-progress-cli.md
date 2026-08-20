# Contract: `tools/check-progress.mjs` — the progress-accounting check

**Feature**: `007-dashboard-progress-sync` | **Date**: 2026-08-20

FR-025 asks for one thing with two entry points: a check that **lives on its own and runs on its
own**, and that is **also invoked by the repository's existing integrity command**, so a failure fails
the gate that already decides whether the product is shippable and there is no second command for a
maintainer to remember. This contract fixes both entry points, the output, and — the part SC-010
actually turns on — how the check proves it can fail.

---

## C1 — Invocation

```bash
node tools/check-progress.mjs            # standalone
node tools/check-progress.mjs --verbose  # also lists each passing assertion
node tools/validate.mjs                  # runs it as gate 16
node tools/validate.mjs --final          # same; gate 16 is an error in both modes
```

| # | Constraint | Source |
|---|---|---|
| C1.1 | No third-party dependency, no `package.json`, no test framework. `node:fs`, `node:path`, `node:url` only. | FR-025, constitution V |
| C1.2 | No browser, no DOM, no storage stub. It imports the same pure `assets/js/progress.js` the app uses. | FR-025, progress-api C0 |
| C1.3 | Writes nothing — no file, no `localStorage`, no working-tree mutation. | it runs inside a release gate |
| C1.4 | Requires Node ≥ 22.7 (ES-module syntax detection). On an older runtime it MUST fail with an actionable message, never a stack trace. | [research.md](../research.md) §2 |
| C1.5 | Deterministic: no wall-clock dependence, no randomness. All dates are injected. | SC-010 repeatability |
| C1.6 | Restores `process.env.TZ` to its entry value before returning, in a `finally`. | it runs inside `validate.mjs`'s process |

## C2 — Exported API (the gate-16 entry point)

```js
export async function runProgressChecks(): Promise<{
  passed:   number,                                  // assertions that held
  failures: string[],                                // one human-readable line each; empty = pass
  defects:  { id: string, name: string, caughtBy: string | null }[],
}>
```

| # | Rule |
|---|---|
| C2.1 | MUST NOT call `process.exit`, and MUST NOT write to stdout/stderr when imported. It returns data; the caller reports. |
| C2.2 | MUST NOT throw for an assertion failure — a failure is a string in `failures`. It may only reject if the runtime itself is unusable. |
| C2.3 | A `defects[]` entry with `caughtBy === null` is itself appended to `failures`: a defect no assertion catches means the battery has a hole, which is the regression risk US6 exists to cover. |
| C2.4 | Async solely so the `assets/js/progress.js` import can be attempted inside `try`/`catch` (C1.4). |

### Standalone `main()`

Runs `runProgressChecks()`, prints the report, and exits:

| Code | Meaning |
|---|---|
| `0` | every assertion held and every defect stand-in was caught |
| `1` | at least one assertion failed, or a defect stand-in went uncaught |
| `2` | the check could not run at all (e.g. `assets/js/progress.js` not importable on this Node) |

Guarded by an `import.meta.url`/`process.argv[1]` comparison so importing the module never runs
`main()`.

## C3 — Output format

Matches `validate.mjs`'s existing vocabulary (`✓` pass, `✗` error) so a maintainer reads one style.

```
progress accounting — 41 assertions over assets/js/progress.js

  ✓ completion         9/9    FR-001..FR-005, FR-018
  ✓ coverage           11/11  FR-007, FR-012, SC-001, SC-003
  ✓ review queue       7/7    FR-010, FR-017, SC-013
  ✓ local calendar     10/10  FR-020, SC-008   (Asia/Tokyo, America/Los_Angeles × 24h)
  ✓ ranking            4/4    SC-007
  ✓ live library       structural invariants over manifest 2026.08.34

  defect stand-ins — each must be caught:
  ✓ D1 completion = interval >= 21          caught by: coverage/day-one-non-zero
  ✓ D2 completion = any stored record        caught by: completion/note-only-not-completed
  ✓ D3 note-only dropped from queue          caught by: review-queue/note-only-reachable
  ✓ D4 today = toISOString (UTC)             caught by: local-calendar/Asia-Tokyo-00:30
  ✓ D5 totals counted over progress keys     caught by: coverage/orphan-record-ignored
  ✓ D6 due counted over all item types       caught by: review-queue/due-equals-queue-size

All good — 41 assertions, 6/6 defect stand-ins caught
```

A failure line names the assertion, the expected value and the actual one:

```
  ✗ coverage/track-pct  kotlin: expected 5/20 = 25%, got 0/20 = 0%
```

## C4 — Assertion inventory

Each group runs against an **implementation object** — `{ isCompleted, statusOf, coverageByTrack,
coverageTotals, reviewQueue, dueCountOf, weakestTracks, notCompleted, todayLocalISO, isDrillable }` —
so the identical battery can be pointed at the real module or at a defect stand-in.

| Group | Assertions cover | Requirements |
|---|---|---|
| `completion` | no record → not completed; note-only → not completed; one `rate()` → completed; five `rate()`s → completed and counted once; past-due → still completed; `{status:'known'}` with no `due` → not completed; `statusOf` returns only the two documented values | FR-001–FR-005, FR-015, FR-018 |
| `coverage` | per-track `completed`/`total`/`pct` against known fixture counts; `completed + notStarted === total`; `pct` bounded 0–100; `total === 0` → `pct 0`, no throw; orphan record ignored; day-one history yields a **non-zero** figure; all-complete track reads 100% | FR-007, FR-008, FR-012, SC-001, SC-002, SC-003 |
| `review queue` | note-only record is offered; completed-and-not-due is not offered; completed-and-due is offered, oldest first; `dueCountOf` equals the due-bucket size; the two buckets are exhaustive (no item missing from the classification); `dsa`/`design` excluded when the drillable filter is applied; clearing the queue drives the count to 0 | FR-010, FR-017, FR-018, SC-005, SC-013 |
| `local calendar` | 24 local hours × `Asia/Tokyo` and `America/Los_Angeles`, each compared against `toLocaleDateString('sv-SE')` as an independent oracle; `offsetDays` across a month and a year boundary; the input `Date` is not mutated; a completed question with a 1-day interval becomes due exactly when the next local day starts | FR-020, SC-008 |
| `ranking` | uneven fixture ranks ascending by coverage; all-zero history is deterministic and non-empty; a 100% track ranks last and yields no `notCompleted` items; zero-total tracks excluded | SC-007, US4 |
| `live library` | per-track totals equal the sum of their packs; drillable + workspace items = library total; every track is non-empty; an empty history yields 0% for every track. All figures **derived from content**, none hard-coded. | FR-012, SC-003 |

Timezone note: the group sets `process.env.TZ`, then verifies the change took effect (a UTC instant's
local hour must shift). If it did not, the group records a **failure** — the timezone case must never
pass by not having been exercised. Under an ambient `TZ=UTC` the D4 defect is genuinely undetectable,
which is why the check sets the zone rather than trusting it.

## C5 — Defect stand-ins (SC-010)

Six alternate implementations, each mirroring a defect the spec describes. Each is run through the
whole battery and MUST produce at least one failure.

| ID | Stand-in | Spec origin |
|---|---|---|
| D1 | `isCompleted` = `record.interval >= 21` (equivalently `status === 'known'`) | Problem Statement row 1; the reported defect |
| D2 | `isCompleted` = `Boolean(record)` | Problem Statement row 2; plan auto-tick |
| D3 | `reviewQueue` buckets on record existence, so a note-only record falls out of both | US3, FR-017 |
| D4 | `todayLocalISO` = `date.toISOString().slice(0, 10)` | US5, FR-020 |
| D5 | `coverageByTrack`/`coverageTotals` count over `Object.keys(progress)` | edge case 1, FR-012 |
| D6 | `dueCountOf` ignores the drillable filter its caller applied | FR-010, SC-013 |

D1 and D2 are the two definitions being retired; D3–D6 are the four consequential defects. Together
they are the complete set the spec names, which is what makes SC-010's "fails against each of the
defects this specification describes" a measured property rather than a claim.

## C6 — Gate 16 in `tools/validate.mjs`

Added after gate 15, before the summary block, in `validate.mjs`'s existing idiom:

```js
import { runProgressChecks } from './check-progress.mjs';
// …
// ================================================================================================
// gate 16 — progress accounting (FR-025). Delegates to tools/check-progress.mjs, which is also
// runnable on its own. One gate, so a regression cannot pass unnoticed for want of a second command.
// ================================================================================================
const progress = await runProgressChecks();
for (const f of progress.failures) err(`gate 16 ${f}`);
if (!progress.failures.length) {
  console.log(`  ✓ gate 16 progress accounting: ${progress.passed} assertions, `
    + `${progress.defects.length}/${progress.defects.length} defect stand-ins caught`);
}
```

| # | Rule | Source |
|---|---|---|
| C6.1 | Gate 16 is an **error**, never a staged warning, in both default and `--final` mode. It is app-code arithmetic, not content mid-expansion, so there is no legitimate window in which it should fail. | FR-025, SC-010 |
| C6.2 | Failures go through the existing `err()` helper, so they land in `errors` and set `validate.mjs`'s exit code — the same gate that already governs release. | FR-025 |
| C6.3 | Gate 16 must not change any existing gate's verdict, output, or numbering. | regression safety |
| C6.4 | `validate.mjs` must still exit `0` on the unmodified content set after this feature. | constitution Quality Gates |
