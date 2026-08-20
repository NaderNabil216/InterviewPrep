# Phase 0 Research: Dashboard Progress Reflects Completed Questions

**Feature**: `007-dashboard-progress-sync` | **Date**: 2026-08-20 | **Plan**: [plan.md](./plan.md)

The spec carries no `[NEEDS CLARIFICATION]` markers — five questions were already resolved in its
Clarifications session. What this document resolves is the set of technical unknowns that the spec
deliberately leaves open, each recorded as **Decision / Rationale / Alternatives considered**.

Every claim below about current behaviour was established by reading the code at
`/Users/nn/InterviewPrep` on 2026-08-20 (manifest `2026.08.34`, 629 items, 89 packs, 13 tracks) and,
where noted, by executing it under Node v26.3.1.

---

## §1 — What "completed" reads from a stored learning record

**Decision**: A record counts as a completion **iff it carries a review schedule**, i.e.
`!!(rec && rec.due)`. Nothing else is consulted — not `status`, not `interval`, not `reps`.

**Rationale**: `srs.js#rate()` is the only writer of a review schedule, and it writes `due`
unconditionally on every call. `store.js#setItemProgress()` merges, so a record can also be created
by a caller that writes only working material — `item.js` line 100 writes `{ notes }` and nothing
else. That gives a clean, already-stored discriminator with no migration:

| Record shape | Created by | `due` present | Completed |
|---|---|---|---|
| `{ status, ease, interval, reps, lapses, due, lastRated, lastRating }` | `rate()` | yes | **yes** |
| `{ notes }` | the notes textarea | no | **no** |
| `{ notes, …rate fields }` | both, in either order | yes | **yes** |

This is exactly how FR-018 words the rule ("a stored record that carries no review schedule"), and
it satisfies FR-002 (counts from the moment it is marked — `rate()` sets `due` on the first call),
FR-003 (a record is one record however often it is re-rated), FR-004 (`due` never goes away when a
question falls due again) and FR-005 (working material alone never creates a `due`).

It also decides the awkward legacy case correctly. Records written by the pre-006 four-button rating
UI could carry `lastRating: 'again'` with `reps: 0` and `interval: 0` — the candidate *did* rate
them, and `rate()` set `due` to today, so they count. A `reps > 0` test would silently discount them.

**Alternatives considered**:
- **`reps > 0`** — rejected: an `again` rating resets `reps` to 0 (`srs.js:22`), so a rated question
  would read as not completed. Undercounts real history, violating FR-023's spirit.
- **`lastRated` present** — equivalent in practice (`rate()` writes both) but a weaker match to
  FR-018's wording, and it invites a future writer to stamp `lastRated` without a schedule.
- **A new explicit `completed: true` flag** — rejected outright: it would require writing to every
  existing record to be meaningful, which FR-022 forbids. Read-time derivation is the requirement,
  not an optimisation.

---

## §2 — Loading one module in both the browser and Node, with no build step and no `package.json`

**Decision**: The shared definition lives in `assets/js/progress.js` as a plain ES module that
**imports nothing**. The browser loads it through the existing `<script type="module">` graph;
`tools/check-progress.mjs` imports it directly by relative path. No rename, no duplicate, no
`package.json`.

**Rationale**: Node's module-syntax detection (default since Node 22.7) loads an extension-less-typed
`.js` file containing `export`/`import` syntax as ES module when no `package.json` sets a type.
Verified on this machine:

```
$ node -v
v26.3.1
$ node run.mjs          # run.mjs: import { hi } from "./pure.js"
imported .js as ESM: ok
```

No warning is emitted. This keeps the module named like its ten siblings in `assets/js/`, keeps the
browser path unchanged, and — decisively — keeps **one** copy of the accounting. FR-006 forbids a
surface applying its own variant of the definition; a second copy inside `tools/` would be precisely
that, and would be free to drift from the app while its own check kept passing.

The module must therefore stay import-free and side-effect-free: it may not reach for `Store`,
`localStorage`, `indexedDB`, `document`, or `window`. Storage access stays in `srs.js`, which is the
adapter. This is recorded as a hard invariant in
[contracts/progress-api.md](./contracts/progress-api.md).

**Alternatives considered**:
- **Rename to `assets/js/progress.mjs`** — works everywhere (Python 3.13's `mimetypes` maps `.mjs`
  to `text/javascript`, confirmed, so `tools/serve.py` would serve it correctly, and Node needs no
  detection). Rejected as unnecessary on Node ≥ 22.7 and inconsistent with every sibling module —
  but it is the exact fallback if the check is ever run on an older Node. `tools/check-progress.mjs`
  therefore catches an import failure and prints that instruction rather than dying opaquely.
- **`assets/js/package.json` with `{"type":"module"}`** — rejected: constitution Principle V says no
  `package.json`, and the letter of that matters more here than the convenience.
- **Duplicate the logic in the check** — rejected: reintroduces multiple definitions, the exact
  defect under repair, and makes SC-010 meaningless (the check would verify its own copy).
- **Stub `globalThis.localStorage` in the check and import `srs.js`** — rejected: it makes the check
  depend on a fake browser, and it would let storage-shaped bugs hide behind the stub.

---

## §3 — Where the single definition lives, and what `srs.js` becomes

**Decision**: `assets/js/progress.js` holds every computation. `srs.js` keeps its module identity and
its currently-imported export names, and becomes a one-line-per-function adapter that reads
`Store.getProgress()` and delegates. `masteryByTrack` is **renamed** to `coverageByTrack`;
`buildQueue`, `dueCount`, `statusOf`, `isDue` and `rate` keep their names.

**Rationale**: Ten view modules import from `srs.js` today. Keeping the adapter means the change
lands as a re-pointing plus label work, not a rewrite of ten import lists. `masteryByTrack` is the
one name that must go: it *is* the wrong definition, and leaving the word "mastery" attached to a
coverage figure is how three definitions coexisted unnoticed in the first place. A rename forces
every call site to be visited deliberately — there are exactly two (`dashboard.js:41`,
`plan.js:47`).

The full consumer map, established by grep, is what the implementation must cover:

| File:line | Reads | Becomes |
|---|---|---|
| `dashboard.js:38` | `Object.values(progress).filter(p => p.status === 'known')` | completed count over `snapshot.items` |
| `dashboard.js:39` | `Object.keys(progress).length` "touched" | dropped; replaced by not-started |
| `dashboard.js:40` | `dueCount(snapshot.items)` | due over the drillable set only |
| `dashboard.js:41,50,135` | `masteryByTrack`, `m.known/m.total` | `coverageByTrack`, `m.completed/m.total` |
| `dashboard.js:47,53` | `unseen` = no record at all | not-completed |
| `plan.js:45,47,50,82` | `dueCount`, `masteryByTrack`, `m.known` | same corrections as the dashboard |
| `plan.js:131-135` | `autoDone`: `ids.every(id => progress[id])` | `ids.every(id => isCompleted(progress, id))` |
| `topics.js:30,65,97-101` | `statusOf(it.id)` ∈ new/learning/due/known | two states + dot + filter |
| `item.js:84`, `cheatsheets.js:27` | `statusOf(item.id)` printed raw | `Not started` / `Completed` |
| `dsa.js:28`, `design.js:27` | `statusOf(it.id)` dot | two states |
| `drill.js:12` | `buildQueue(non-dsa/design, 40)` | unchanged scope; queue fix is inside |

**Alternatives considered**:
- **Delete `srs.js` and import `progress.js` everywhere directly** — rejected: every view would then
  need to fetch `Store.getProgress()` itself, spreading storage access into ten files and making it
  easy for one view to read stale state mid-render.
- **Keep `masteryByTrack` as an alias** — rejected: an alias is how the old definition survives a
  refactor.

---

## §4 — "Today" on the candidate's own calendar

**Decision**: Replace `srs.js#todayISO()`'s `new Date().toISOString().slice(0, 10)` with local
calendar-field formatting, exported as `progress.js#todayLocalISO(date = new Date(), offsetDays = 0)`
with an injectable date so it can be checked without touching a clock.

**Rationale**: `toISOString()` is UTC by definition, so the current comparison is against the UTC
calendar date while every other date in the app (`new Date(str + 'T00:00:00')` in `dashboard.js:8`,
`plan.js:121`, and `setHours(0,0,0,0)`) is local. The window of disagreement is the UTC offset. This
machine's zone is `Africa/Cairo` (UTC+3), so between 00:00 and 03:00 local, `todayISO()` returns
*yesterday* — reviews scheduled for today are withheld, and `plan.js`'s day index disagrees with the
drill queue. Both `rate()`'s `due: todayISO(interval)` write and every `<= today` read go through
one function, so a single fix covers writes and reads together.

**Alternatives considered**:
- **`toLocaleDateString('sv-SE')`** — also yields local `YYYY-MM-DD`, and is used by the check as an
  *independent oracle* precisely because it shares no arithmetic with the implementation. Rejected as
  the implementation itself: it depends on ICU locale data being present, where `getFullYear()` /
  `getMonth()` / `getDate()` cannot fail.
- **Storing timestamps and comparing instants** — rejected: it changes the stored record shape,
  which FR-022 forbids, to fix a display-day problem.

---

## §5 — The review-queue leak on note-only records

**Decision**: `reviewQueue()` classifies by completion, not by record existence:
a question goes to the *due* bucket when it is completed **and** `due <= today`; otherwise, if it is
not completed, it goes to the *not-yet-completed* bucket. Nothing falls through.

**Rationale**: today `buildQueue` (`srs.js:60-64`) buckets on `if (!p) unseen.push(it)` /
`else if (p.due <= today) due.push(...)`. A note-only record makes `p` truthy, so the question is not
unseen; `p.due` is `undefined`, and `undefined <= '2026-08-20'` is `false`, so it is not due either.
It leaves the queue **permanently**. Material the candidate flagged as worth remembering is exactly
the material that then never comes back — the most damaging of the three defects, and the reason US3
exists. Bucketing on `isCompleted` closes the hole by construction: the two buckets are
complementary, so there is no third state to leak into.

FR-019's "become reachable in review again on first load" then needs no migration step at all — the
records were never modified, only misread, so correcting the read restores them.

**Alternatives considered**:
- **Keep the existing buckets and add `|| !p.due` to the unseen test** — same outcome, but it leaves
  a two-condition classification where a future field could open a third gap. Bucketing on the single
  definition is what FR-006 asks for.
- **Stop `item.js` from creating a record for a note** — rejected: it would discard the note, which
  is the candidate's data (FR-023), and would not help the records already on devices.

---

## §6 — Scoping the due figure to what the review queue actually offers

**Decision**: `progress.js` exports `isDrillable(item)` — `item.type !== 'dsa' && item.type !== 'design'` —
and the dashboard's and plan's due figures are computed over `items.filter(isDrillable)`. The 60
`dsa` and 19 `design` items are excluded.

**Rationale**: `dashboard.js:40` calls `dueCount(snapshot.items)` over all 629 items, while
`drill.js:12` builds its queue from `snapshot.items.filter(it => it.type !== 'dsa' && it.type !== 'design')`
— 550 items. So the "N due for drill" figure sitting directly above a **Start drill** button counts
up to 79 questions that button will never present, and the candidate cannot drive the number to zero.
That is the FR-010 / SC-013 defect. Putting the predicate in the shared module and using it in both
places makes the figure and the queue provably the same population, and removes the duplicated
inline type test from `drill.js`.

Coverage bars are *not* scoped this way: `dsa` and `system-design` are completable (both workspaces
call `rate()` — `dsa.js:116`, `design.js:209`) and belong in coverage totals per the spec's edge
cases. Only the review-queue figure narrows.

**Alternatives considered**:
- **Make the drill offer `dsa`/`design` items too** — rejected: a code editor and a 45-minute design
  timer are not flashcards, and the spec puts interval and queue behaviour out of scope.
- **Hard-code the two track names instead of the two types** — rejected: `type` is what `drill.js`
  already gates on, and it survives a future pack landing a `dsa` item under another track.

---

## §7 — Why FR-019's silent correction is not a "release" under Principle III

**Decision**: Apply the corrected reading with no notice, confirmation, or decline step, and record
the Principle III verdict as **PASS** without invoking the v1.1.0 amendment.

**Rationale**: Principle III governs *content reaching a candidate* — "a release that changes
anything the candidate cannot get back MUST say so before it is applied". Three things are true here
and none of them is a release:

1. **Nothing arrives from disk.** No manifest version bump, no pack fetch, no snapshot swap. This is
   app code shipped with the site.
2. **Nothing stored is written, altered, or removed.** `aip.v1.progress` is untouched.
   `aip.v1.plan.done` is untouched — the `done` map still holds every manual tick, keyed by the same
   material signatures. Only `plan.js#autoDone()`'s *reading* changes.
3. **Nothing becomes unrecoverable.** A task that read as done only because a note was saved reads
   as not done, and `manualMark()` still takes precedence over `autoDone()` — so the candidate can
   tick it by hand and it stays ticked. The note itself is untouched and still displayed.

The disclosure trigger is therefore not met. The v1.1.0 amendment (which permits silent application
for tick *re-anchoring*) is not needed and is not being stretched. This is the one Constitution
verdict a reviewer would reasonably challenge, so the argument is recorded here in full rather than
left to a one-line table cell.

**Alternatives considered**:
- **Show a one-time notice explaining that some plan ticks were auto-ticked in error** — rejected by
  the spec's own clarification session (2026-08-20: "Silently. No notice, confirmation, or decline
  step"). It would also be a confusing message about a defect the candidate never knew existed, on a
  surface where the correct state is now simply displayed.
- **Grandfather the old reading for existing records** — rejected: it would keep two definitions
  alive forever, and would keep note-only questions out of the review queue, which is the harm US3
  names.

---

## §8 — Topics' status filter: two states, "New in this release", and legacy bookmarks

**Decision**: `statusOf()` returns exactly `'not-started' | 'completed'`. The Topics filter offers
`Any status` / `Not started` / `Completed` / `✨ New in v<version>`. Any `?status=` value that is not
one of those four falls back to `all`.

**Rationale**: FR-015 requires exactly two *completion* states for the filter and the per-question
dot, and forbids a review-state option — `learning`, `due` and `known` all go. `known` was the
unreachable option SC-006 names: with one **Mark complete** action the interval path is fixed at
1 → 3 → 8 → 20 → 50 days, so `interval >= 21` is first met on the *fifth* completion, which under
normal spaced review lands on day 32 — beyond the life of both the 7-day sprint and the 15-day deep
plan.

`✨ New in v<version>` is kept. It is a **content-recency** filter over `addedIn`/`updatedIn`, not a
review-state one, so FR-015's prohibition does not reach it; and SC-006's clause is "no third,
**unreachable** option is offered" — this one matches items on day one of any release. Removing a
working, reachable feature would be a scope change the spec does not ask for. Flagged here because it
is the one place where a strict reading of "exactly two states" and the spec's own qualifier pull
apart; the qualifier governs.

The legacy fallback matters because `topics.js` syncs its filters into the URL
(`#/topics?status=known`), so those URLs exist in candidates' history and bookmarks. Today they would
match nothing and render "No items match" over a full library. Falling back to `all` shows the
library instead.

**Alternatives considered**:
- **Drop `new-content` too, for a literal "exactly two options"** — rejected per the above.
- **Map `known` → `completed` and `new`/`learning`/`due` → `not-started` for old URLs** — rejected as
  over-clever: `known` meant something different, so honouring it would show a *different* set than
  the bookmark implied. `all` is honest.

---

## §9 — Freshness: re-rendering the surface you are already on

**Decision**: In `app.js#navigate()`, when the composed hash equals `location.hash`, call `render()`
directly instead of assigning the hash. Separately, `topics.js`'s **debounced keyword sync** switches
from `navigate()` to `history.replaceState()`.

**Rationale**: assigning an identical `location.hash` fires no `hashchange`, and `hashchange` is the
only thing wired to `render()` (`app.js:165`). So pressing **Dashboard** while on the dashboard is a
no-op and the figures stay as they were on arrival — the FR-021 / US1 #8 defect. Calling `render()`
on the equal-hash path fixes it, and `render()` re-reads `Store.getProgress()` through the view, so
the numbers are current by construction.

The Topics change is required to avoid *introducing* a defect with that fix. `topics.js`'s keyword
box already updates its own list locally (`debouncedList`, line 111) and separately syncs the URL
400 ms later (`debouncedSync` → `syncQuery` → `navigate`). If the candidate types and then deletes
back to the original text, the synced hash now equals the current one, the new force-render path
fires mid-typing, `el.innerHTML = ''` replaces the input, and focus and caret are lost. Using
`replaceState` for that one sync removes the possibility — and, incidentally, fixes the pre-existing
version of the same bug, where any keyword sync triggers a full re-mount and steals focus. The
track/level/status selects keep using `navigate()`: a `change` event means the value genuinely
differs, so the hash differs and the ordinary `hashchange` path runs.

**Alternatives considered**:
- **A `force` parameter on `navigate()`** — rejected: every caller would have to know whether it
  wants freshness, and the default would be wrong somewhere.
- **A re-entrancy guard flag around `render()`** — rejected as unnecessary once the one synchronous
  same-hash caller is removed; no view calls `navigate()` during its own render. Worth revisiting if
  a future view does.
- **Re-reading progress on a `storage` event or an interval** — rejected: much larger surface than
  the requirement, which is only about the moment a surface is displayed.

---

## §10 — Weakest-track ordering and the all-zero tie

**Decision**: `weakestTracks(coverage, limit)` sorts by completion ratio ascending, then by `total`
descending, then by track name ascending, over tracks with `total > 0`.

**Rationale**: today both `dashboard.js:50` and `plan.js:50` sort by `known/total`, which is
identically `0` for every track for the first 32 days — so the ordering carries no information and
the "personalised" claim is false (US4). Ratio ascending fixes it. The two tiebreakers make SC-007's
"genuine ascending order" and US4 #3's "stable, non-empty set" verifiable rather than dependent on
`Object.entries` insertion order: on a fresh history every ratio is 0, and the result becomes the
largest tracks first (most material to gain), deterministically. `total > 0` filtering is retained
from the current code and is also what keeps a zero-item track out of a division.

US4 #4 ("a fully completed track is not suggested as a source of new material") needs no extra rule:
`nextUp` draws from not-completed items filtered by track, so a 100% track contributes nothing.

**Alternatives considered**:
- **Sort by absolute not-completed count** — rejected: a big track at 90% would outrank a small one
  at 5%, which is the opposite of "weakest".
- **Track name as the only tiebreak** — deterministic but puts `architecture` first on a fresh
  history, which is arbitrary from the candidate's point of view. Size-first is a defensible signal.

---

## §11 — Orphan records, zero-total tracks, and percentage bounds

**Decision**: Every count iterates over `snapshot.items` and looks records up by id. Nothing ever
iterates `Object.keys(progress)`. `pct` is `total === 0 ? 0 : Math.round((completed / total) * 100)`,
and `completed` is by construction ≤ `total`.

**Rationale**: `dashboard.js:38-39` currently counts over `Object.values(progress)` /
`Object.keys(progress)`. A record whose item has been retired from the library — permitted and
expected, since ids are never reused and the record must survive (constitution Principle I, and the
spec's first edge case) — is counted in the headline but absent from every track total. Iterating the
library instead makes the invariant `0 ≤ completed ≤ total` structural rather than something a
`Math.min` has to rescue, which is what FR-012 asks for. A zero-total track is excluded from the
bars and from weakest-track ranking, so no division by zero is reachable.

The related edge case — content arriving mid-study raises a track's total, so a bar that read 100%
can legitimately drop — needs no code: the figure is derived per render from the current snapshot, so
it simply stays correct. It is called out in [quickstart.md](./quickstart.md) so nobody "fixes" it.

**Alternatives considered**:
- **Clamp with `Math.min(100, pct)`** — rejected: it hides the orphan-counting bug rather than
  removing it, and a clamped wrong number is still wrong.

---

## §12 — A failed write must never read as a completion

**Decision**: Wrap each `rate()` call site in `try { … } catch { /* banner raised by store.js */ }`,
and inside the `catch` do not toast success, do not increment a counter, and do not advance a drill
or mock card.

**Rationale**: `store.js#write()` throws `StorageFailure` after announcing it, and `app.js`
registers `raiseStorageBanner` as the listener — so the candidate is already told. But the throw
currently propagates out of a DOM click listener. In `item.js`, `dsa.js`, `design.js` and
`cheatsheets.js` that happens to be safe: the `toast('Marked complete …')` line sits after the
assignment and never runs, so nothing false is shown. In `drill.js:107-117` and `mock.js:167-172`
the call is followed by `completed++; i++; draw();` — an uncaught throw leaves the card frozen with
no explanation beyond the banner, and any future reordering of those lines would count a completion
that was never stored. Explicit handling makes FR-024 a property of the code rather than a property
of statement order.

**Alternatives considered**:
- **Have `rate()` return `null` on failure instead of throwing** — rejected: it changes `store.js`'s
  documented "either returns true or throws" contract, which 002 introduced deliberately after a
  `QuotaExceededError` on a rating looked exactly like success.

---

## §13 — Reachability of 100% for every counted track (FR-027 / FR-028)

**Decision**: Every one of the 13 tracks stays in the coverage denominator, and the `cheatsheets`
track gains a **Mark complete** action in the view built for reading it. The action is already
suppressed in print by the existing `@media print { .rate-row { display: none !important; } }` rule
at `assets/css/app.css:352`.

**Rationale**: the 13 tracks divide by the view a candidate is directed to:

| Tracks | Reading surface | Completion action |
|---|---|---|
| kotlin, coroutines-flow, compose, platform, architecture, data-networking, performance, build-testing, security-kmp, behavioral (10 tracks, 545 `qa` items) | `item.js`, `drill.js`, `mock.js` | present |
| dsa (60), system-design (19) | `dsa.js`, `design.js` | present |
| cheatsheets (5 `concept` items) | `cheatsheets.js` | **was missing** |

So `cheatsheets` was the FR-027 violation: counted in a denominator while its own view offered no way
to move the numerator. A candidate could only complete a sheet by finding it in Topics — the sheets
*are* listed there, since Topics excludes `dsa`/`design` types and `concept` is neither — which is
not a surface the product points them at for sheets. Adding the action to `cheatsheets.js` is the fix
and satisfies SC-012 for all 13 tracks; dropping the track from the denominator was the alternative
and is worse, because a printed cheat-sheet skim is real study.

**Note**: this change is **already present, uncommitted**, in the working tree
(`assets/js/views/cheatsheets.js`, +18/-2, adding the `rate-row`, the `mark-complete` handler and a
status line). It belongs to this feature, not to 006, and must move onto the 007 branch.

**Alternatives considered**:
- **Exclude `cheatsheets` from coverage** — rejected by FR-027's own wording: a track may not be
  counted and uncompletable at once, and of the two ways out, counting five readable one-pagers is
  the one that matches what a candidate actually does with them.
- **Auto-complete a sheet on open** — rejected: opening is not completing, and it would reintroduce
  an implicit second definition of completion.

---

## §14 — How the check proves it fails against the defects (SC-010)

**Decision**: `tools/check-progress.mjs` expresses its assertions as a battery of pure functions over
an **implementation object** — `{ isCompleted, statusOf, coverageByTrack, reviewQueue, dueCountOf,
todayLocalISO }`. The battery is run once against the real `assets/js/progress.js` (expecting zero
failures) and then once against each of six named defect stand-ins (expecting at least one failure
each, and naming which assertion caught it).

**Rationale**: SC-010 asks for two things a plain assertion suite cannot give: that the check passes
against the corrected behaviour *and* that it **fails against each defect this specification
describes**. Running the identical battery against deliberate stand-ins turns the second half into a
measured property. A defect that no assertion catches is itself reported as a failure — that is the
signal that a gap has opened in the battery, which is exactly the "silently regresses" risk US6
names. The six stand-ins mirror the spec one-for-one:

| # | Defect stand-in | Spec origin |
|---|---|---|
| D1 | completion = `interval >= 21` | Problem Statement, row 1 |
| D2 | completion = any stored record exists | Problem Statement, row 2 |
| D3 | note-only record dropped from the review queue | US3, FR-017 |
| D4 | "today" = `toISOString().slice(0,10)` (UTC) | US5, FR-020 |
| D5 | totals counted over progress keys, so orphans count | Edge case 1, FR-012 |
| D6 | due figure computed over all items, including workspaces | FR-010, SC-013 |

The timezone assertions set `process.env.TZ` to `Asia/Tokyo` and `America/Los_Angeles` around the
date battery and restore it afterwards — verified to take effect at runtime on Node v26.3.1 — and
compare against `toLocaleDateString('sv-SE')` as an oracle that shares no arithmetic with the
implementation. If the runtime ignores the `TZ` change, the check reports that as a **failure**, so
the timezone case can never pass by not having been exercised. Under `TZ=UTC` D4 is genuinely
undetectable, which is why the check sets the zone rather than trusting the ambient one.

A short live-library section additionally loads the real manifest and packs and asserts *structural*
facts — every track total is the sum of its packs, drillable + workspace items = library total, an
empty history yields 0% everywhere — deriving each number from the content rather than hard-coding
629/13/79, so future content growth cannot make the check fail spuriously.

**Alternatives considered**:
- **Mutation testing over the real module (edit, run, revert)** — rejected: it needs to write to the
  working tree from a check that also runs inside `validate.mjs`.
- **Assertions only, no negative controls** — rejected: it satisfies FR-025 but not SC-010, and a
  suite that cannot fail is the thing US6 is trying to prevent.
- **A separate `npm test`-style command** — rejected by constitution Principle V, and by FR-025's
  explicit requirement that there be no second command for a maintainer to remember: gate 16 inside
  `validate.mjs` is the mechanism.

---

## §15 — Labelling populations (FR-016)

**Decision**: Every figure is labelled with the population it counts, and any two figures shown
together either share a population or say that they do not. The exact copy for all eleven affected
figures is fixed in [contracts/ui-surfaces.md](./contracts/ui-surfaces.md) rather than left to the
implementation.

**Rationale**: two of the current side-by-side pairs are drawn from different populations without
saying so — the dashboard's free-study card puts a due figure over 629 items next to an unseen figure
over 629 items where the due figure should be over 550, and the hero line puts "touched" next to
"known" where neither word names a population and the two cannot be reconciled by a candidate. FR-016
is a copy requirement, so pinning the copy in a contract is what makes it reviewable; leaving it to
each view is how the labels drifted apart in the first place. The headline pair becomes
`N questions · N completed · N not started`, which sums to the library total and is therefore
self-checking.

**Alternatives considered**:
- **Scope every figure to the same 550-item drillable population for consistency** — rejected:
  `dsa` and `system-design` are completable and belong in coverage (spec edge case), so hiding 79
  items from the coverage total to make two numbers add up would understate real study.
