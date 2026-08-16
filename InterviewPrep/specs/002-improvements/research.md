# Phase 0 Research: Improvements

**Feature**: `002-improvements` · **Date**: 2026-08-14 · **Spec**: [spec.md](./spec.md)

All code line references below were taken on 2026-08-14 against the live repository at
`/Users/nn/InterviewPrep` (the app root — **not** this Spec Kit scaffold). External-service findings are
dated where fetched; the DSA execution-provider decision (R-007) carries the most externally-sourced
claims in this document and is the one place Principle IV's dated-primary-source bar applies hardest.

---

## R-001 — The typing lag is synchronous work queued behind keystrokes, not the `<input>` itself

**Problem**: US1/FR-001 asks for "every keystroke appears immediately." A native `<input>` already renders
every keystroke synchronously regardless of JS — so what's actually being reported as "letter by letter"
lag has to be something else competing with the event loop.

**Findings**: Two call sites wire text input to search, and neither debounces:

- Search overlay (`assets/js/app.js:184-193`) runs a full linear `search()` scan (`assets/js/search.js:14-30`
  — O(n · terms · haystack-length) substring test over ~629 items, plus a full sort of every scored row)
  synchronously inside the `input` listener, then rebuilds `results.innerHTML` from scratch every
  keystroke.
- Topics keyword filter (`assets/js/views/topics.js:98`) is worse: its `input` listener calls
  `rerenderList()` → `syncQuery()` → `navigate()` → `location.hash` write → the global `hashchange`
  listener (`app.js:141`) → `render()` (`app.js:128-139`), which does `el.innerHTML = ''` and re-invokes
  `renderTopics` from scratch — a full router cycle and full view teardown/rebuild per character.

Neither is asynchronous, and nothing yields to the browser between one keystroke's handler and the next.
On a fast typist, each handler's synchronous cost (list rebuild, in the Topics case a full hash write and
view re-mount) queues up behind the input events, so the **visible list** — and on a slow enough device,
even the next keystroke's paint — lags behind actual typing. `grep -rn "debounce\|throttle" assets/js/`
returns nothing: there is no existing helper to reuse.

**Decision**: Add one small debounce helper and change what's synchronous per keystroke, not the `<input>`
handling itself:

1. New tiny helper — a `debounce(fn, ms)` closure, colocated in `assets/js/search.js` (search overlay) and
   used directly in `topics.js` (no new shared module needed for two call sites; if a third call site
   appears later, promote it to its own file).
2. Search overlay: keep updating a "typing…" placeholder state synchronously (so the box never looks
   frozen), but only call `search()` + rebuild `results.innerHTML` on a **trailing** debounce of ~150ms.
   300ms (FR-002's settle bound) is the outer limit the user perceives as instant; 150ms leaves headroom
   for the scan itself plus render.
3. Topics filter: stop routing every keystroke through `navigate()`/`hashchange`/full view re-mount.
   Filter input become a local, in-view listener that (a) updates `state.q` and re-renders **only the
   item-list container** by re-running `applyFilters` + the list template — not the whole view — on the
   same ~150ms trailing debounce, and (b) calls `syncQuery()` (the URL/hash sync) separately, also
   debounced, so the address bar catches up after typing stops rather than fighting every keystroke.
4. Empty/no-match state (FR-003): unchanged logic, just gated by the same debounce so it doesn't flash
   between real keystrokes.

**Alternatives rejected**: memoizing `search()` results per prefix (real complexity for ~629 items and a
free-text query — the benefit is marginal next to just not re-running it every keystroke); a virtual-DOM
diff of the results list (a framework-shaped fix for a two-call-site problem, against Principle V).

---

## R-002 — Startup segmentation: split "shell ready" from "content ready"

**Problem**: US2/FR-004–006 want a visible loading indicator immediately and an interactive shell within
1s on a cold cache, without regressing the instant warm-cache path.

**Findings**: `content.js#boot()` (`content.js:51-65`) is one undifferentiated `await` chain on first
visit: `loadManifestAndPacks()` fetches the manifest, then fetches **every pack sequentially in a `for`
loop with `await` inside** (`content.js:12-23`), then every plan file, before `boot()` resolves at all.
`app.js#main()` (`app.js:357-379`) makes it worse by also `await`-ing `initUpdateButton()`'s silent
background check (`app.js:304-337`) — a network round-trip — **before** the first `render()` call
(`app.js:377-378`). Nothing in `index.html`/`app.css`/`app.js` renders any loading indicator or skeleton
today (`grep` for `skeleton|loading|spinner|shell` across all three turns up nothing but an unrelated CSS
comment). On a warm cache, `Store.getSnapshot()` already returns instantly and this whole chain is
short-circuited — that path is fine and must not regress.

**Decision**: Split `boot()` into two phases the caller can await independently:

1. **Shell phase** (new, fast): `main()` shows a loading indicator synchronously on first paint (a small
   `#boot-status` element already in `index.html`'s static markup, not injected by JS — so it's visible
   even before any module finishes evaluating), then resolves the stored snapshot (`Store.getSnapshot()`,
   instant on warm cache) or, on a true cold cache, resolves just the manifest fetch — enough to render
   nav and a dashboard **skeleton** without waiting on any pack. Skeleton counts render as neutral
   placeholders, never as zeros a candidate could mistake for real values (FR-005a). This satisfies
   "interactive within 1 second **of first paint**" because rendering the shell no longer has a
   pack-fetch or update-check in its `await` chain — and note that the ordering guarantee (shell before
   packs), not the 1-second number, is what holds unconditionally on a slow device (FR-005b).
2. **Content phase** (existing work, restructured): `loadManifestAndPacks()`'s pack loop changes from
   sequential `for`-`await` to `Promise.all(manifest.packs.map(...))` — the packs have no dependency on
   each other, so this is a straightforward parallelization, not a redesign — and resolves in the
   background while the shell is already interactive. When it resolves, the dashboard/topics views
   re-render from the now-complete snapshot; until then they show the skeleton state from phase 1.
3. `initUpdateButton()`'s network round-trip moves off the `main()` critical path entirely (it already
   only sets a badge/pending-diff; see R-004 — it's being replaced outright, not just deferred).
4. Warm-cache path: unchanged in substance — `Store.getSnapshot()` resolving immediately means phase 1
   and phase 2 both resolve on the same tick, so "shell then content" collapses to what today's instant
   render already does. No regression, just a phase split that only matters when phase 2 is actually slow.

**Alternatives rejected**: a bundler-based code-split (violates Principle V — no build step); lazy-loading
view modules on first navigation (real win for parse/eval time, but the measured bottleneck here is
network — sequential pack fetches — not JS payload size; revisit only if profiling after this change shows
otherwise).

---

## R-003 — Automatic sync: trigger, cadence, and the disclosure surface that replaces the modal

**Problem**: US3/FR-007–011 remove the manual Update button, its label, and What's New, but FR-010 still
requires the tick-preservation guarantee, and the Edge Cases require the sync to (a) never fire mid-session
and (b) never re-fetch when nothing changed.

**Findings**: The mechanism that must be preserved is exact and already documented in code —
`assets/js/app.js:259-283`, with the load-bearing comment at `assets/js/store.js:178-179`: `migrateTicks
(App.snapshot, planState)` must run **while `App.snapshot` still holds the outgoing snapshot** (the
outgoing plan's `itemIds` are only reachable there), and `Store.setPlanState(...)` must be written
**before** `applyUpdate(diff)` swaps IndexedDB — because the outgoing plan doesn't exist anywhere else.
Today that ordering is inside a click handler; automating the trigger must reproduce the same three-step
sequence (migrate → write plan state → swap snapshot) with no click in the loop. Separately,
`checkForUpdates()` (`content.js:69-106`) already short-circuits on a cheap manifest-version string
compare (`content.js:73`) before touching any pack content — that's FR-011 for free, it just needs to be
called on a schedule instead of once per button click.

**Decision**:

1. **Trigger cadence**: check on (a) boot, after the shell phase renders (never blocking first paint —
   this is exactly what today's badge-only background check already does, just repurposed), (b) the
   `visibilitychange`/`focus` events (candidate returns to an already-open tab), and (c) the browser's
   `online` event (covers the offline-then-reconnect edge case) — no polling interval while the tab is
   backgrounded, since (a)+(b)+(c) cover every point a candidate could plausibly see new content.
2. **Safe-point gating**: the check itself can run anytime (it's one cheap manifest fetch), but *applying*
   a found diff is gated on `!App.sessionActive` — a flag Drill/Mock session views set on entry and clear
   on exit/completion (new, small addition to `App` state). If a diff is pending when a session starts,
   the apply is deferred until the session ends or the candidate navigates away from it — never mid-Drill.
3. **Apply sequence**: reuse `migrateTicks`/`applyUpdate` exactly as today, called automatically instead of
   from a confirm-click, preserving the documented ordering constraint verbatim (this is a non-negotiable
   port, not a rewrite — see Constitution Check).
4. **Disclosure surface** (replaces the modal, since there is no more confirm step to gate): a
   non-blocking toast, fired *after* the swap completes, naming what changed at a glance — e.g. `"Content
   updated — 12 new, 3 changed. 2 plan ticks re-anchored."` — reusing the existing `toast()` helper
   (`app.js`). This isn't a consent step (none is required per the constitutional amendment below); it's
   a same-guarantee-as-before *notice*, satisfying "candidate can see what arrived" without a decline
   affordance, which the spec's clarification explicitly ruled out requiring.
5. **Removal**: `#update-btn` markup (`index.html:60-63`) and its CSS (`app.css:155-162`), the
   `data-nav="whatsnew"` button, the `whatsnew` route/view file, and `initUpdateButton()` itself are all
   deleted outright, not hidden — FR-008/009 are explicit that no surface remains.
6. **Constitutional amendment (prerequisite deliverable)**: Principle III as written requires a decline
   path before *any* release applies. The spec's clarification session resolved this in the user's favor
   for the narrow case where ticks are re-anchored, never dropped — this is not "shipping something that
   conflicts with a principle" (out of bounds per Amendment and Review), it's the dated, explicit amendment
   that section requires. Applied in this plan as `.specify/memory/constitution.md` v1.0.0 → v1.1.0 (see
   plan.md's Constitution Check).

**Alternatives rejected**: a service-worker-driven background sync (real capability, but a new API surface
and failure mode for a one-developer static site — disproportionate to the actual requirement, which is
"don't make the candidate click a button"); polling on a fixed interval regardless of tab visibility
(wastes the exact cheap-compare property FR-011 asks to preserve, for no benefit over visibility/online
events).

---

## R-004 — "Mark complete" maps to a single fixed SM-2 rating; Mock's average-score summary needs a new shape

**Problem**: US4/FR-012–014 replace four graded buttons with one action everywhere, while FR-013 requires
Drill ordering and mastery percentages to keep working unchanged.

**Findings**: `srs.js#rate(itemId, rating)` takes a string enum (`'again'|'hard'|'good'|'easy'`,
`srs.js:14-41`) and is the only place a rating's *meaning* is interpreted — `buildQueue()` (`srs.js:57-70`)
and `masteryByTrack()` (`srs.js:78-90`) only ever read the **derived** `due`/`status` fields `rate()`
writes, never the rating string itself. `store.js#setItemProgress` (`store.js:231-236`) is a generic
shallow merge with no branching on rating value. So nothing outside `srs.js` needs to change shape — a
fixed call `rate(itemId, 'good')` produces the exact same progress-record shape as today's "Good" button
already does, and every downstream consumer is unaffected. The one place with a real information loss:
Mock's `RATE_SCORE` map (`mock.js:13`) and the `avgScore` it derives (`mock.js:92-93`) for
`Store.addMockResult` and the dashboard sparkline (`mock.js:15-53`) — a fixed rating collapses that to a
constant, so the "1–4 self-assessed score" summary loses its meaning.

**Decision**:

1. Every `.rate-row`/`.rate-btn[data-rate]` block (five call sites: `item.js:69-89`, `dsa.js:88-112`,
   `design.js:115-120,178`, `drill.js:74-95`, `mock.js:124-143`) becomes a single button, label "Mark
   complete", calling `rate(item.id, 'good')`. `'good'` is chosen over introducing a new rating value
   because it's already the "normal progression, no ease adjustment" branch (`srs.js:26-28`) — the
   natural single outcome — versus `hard`/`easy` which nudge `ease`, and `again` which resets/lapses.
2. Drill's per-rating `results` tally (`drill.js:28,43`) collapses to a single "completed" count.
3. Mock's `avgScore`/`RATE_SCORE` (`mock.js:13,92-93`) is replaced with a completion count/percentage
   (e.g. "9/10 answered") in `Store.addMockResult` and the landing sparkline/table — the self-graded score
   concept is retired along with the graded buttons that produced it, consistent with FR-012 removing
   graded choices everywhere a question's answer is reviewed, Mock included.
4. Idempotency (Edge Cases: repeated taps on the same item): `rate()` already always recomputes from the
   *current* progress record and writes forward — the existing spaced-repetition math doesn't distinguish
   "first time marked" from "re-marked," so two taps just advance the item twice through the normal
   interval-growth curve like double-tapping "Good" today would. This is called out in the plan's Edge
   Case handling, not silently accepted: it's identical to today's existing double-click behavior, not a
   new risk introduced by this feature.

**Alternatives rejected**: adding a dedicated internal rating value (e.g. `'complete'`) distinct from
`'good'` — more surface area in `srs.js` for identical resulting math, since the only difference would be
the label written to `lastRating`, which nothing reads back today.

---

## R-005 — Timer pause: an accumulator for Drill's elapsed clock, an interval gate for Mock's countdown

**Problem**: US5/FR-015–017 require the timer to freeze the instant an answer is revealed and resume when
the next question appears, without touching Mock's overall session deadline.

**Findings**: Drill's on-screen clock (`drill.js:29-30,102-113`) is a **timestamp diff**,
`Date.now() - startedAt`, redrawn every second by `setInterval` — stopping the interval alone doesn't pause
it, because the underlying diff keeps growing the moment the interval resumes; it needs an explicit paused
duration to subtract. Mock's clock (`mock.js:80-143`) is the opposite shape — a single decrementing integer
`timeLeft = mode.minutes * 60`, ticked by one `setInterval` per session (`mock.js:82-86`) that is **never
per-question** and is never reset by `draw()` (`mock.js:89`) re-rendering the next item — so it is
*already* the overall session budget FR-017 requires stay untouched, which makes pausing it trivial:
stopping/restarting the same interval around reveal/advance doesn't touch `timeLeft`'s value while paused,
so the budget preserves itself with no extra bookkeeping.

**Decision**:

1. **Drill**: on `reveal()` (`drill.js:82-88`), record `revealedAt = Date.now()`. On advancing to the next
   question (`drill.js:93-94`, re-entering `draw()`), add `Date.now() - revealedAt` to a running
   `pausedMs` accumulator and clear `revealedAt`. The displayed clock becomes `Date.now() - startedAt -
   pausedMs`, computed the same way every tick — frozen the instant `revealedAt` is set (no visible
   catch-up jump), because the interval keeps rendering the same subtraction while `revealedAt` holds the
   answer-reveal timestamp constant. *(Edge case — indefinitely long reveal: this is naturally unbounded
   and correct; `pausedMs` just keeps growing while paused, nothing drifts or resumes on its own.)*
2. **Mock**: gate the `timeLeft--` line (`mock.js:83`) behind a `revealed` boolean already tracked in this
   view (`mock.js:80`); set it `true` in the `#reveal-btn` handler (`mock.js:132-137`) and back to `false`
   at the top of `draw()` (`mock.js:89`) when the next item renders. The `setInterval` itself can keep
   running (it's cheap) — it just skips decrementing while `revealed` is true, so `timeLeft` (and thus the
   overall countdown FR-017 protects) is provably untouched during a pause.
3. Design's separate manual Start/Pause scenario-prep timer (`design.js:98-177`) is unrelated — it has no
   reveal step and no "next question" concept — and stays out of scope, as the spec's own Assumptions
   note.

**Alternatives rejected**: re-basing Drill's clock on a decrementing/incrementing counter like Mock's
(would require restructuring an existing, working elapsed-time display without a behavioral gain — the
accumulator approach is a strictly smaller diff).

---

## R-006 — Content simplification and system-design restructuring reuse the existing batch-and-validate process; no new tooling

**Problem**: US7 (plain-English rewrite, ~629 items) and US8 (clarify-then-plan restructuring) are both
large content efforts. Do they need new authoring tooling?

**Decision**: No. Both proceed exactly the way `tools/REFRESH.md` and this repo's existing content
workflow already require any bulk content change to proceed: batched per track/pack, `node
tools/validate.mjs` passing after every batch before the next one starts, `updatedIn` set to this feature's
manifest version on every touched item (never `addedIn` — no item is new). `.claude/workflows/
fill-content-gap.js` is explicitly *not* revived for this (per the outer `CLAUDE.md`'s own note that it's
unused and content is authored directly) — these are edits to existing items' `shortAnswer` /
`framework` / `requirements` fields, not new-item authoring, so that workflow's outline→author→review shape
for *net-new* items doesn't fit anyway. See [data-model.md](./data-model.md) for the two content-schema
changes this does require (a `sampleCall` field for DSA, a `clarifyingQuestions[]` split for design) and
[quickstart.md](./quickstart.md) for the batch-by-batch validation loop.

---

## R-007 — DSA Run: provider selection, driver-wrapping, and the bring-your-own-key architecture

**Problem**: US6/FR-018–022 is the app's first-ever external network dependency (confirmed: `grep -rn
"fetch(" assets/js/` finds exactly one call site, `content.js:7`, fetching same-origin content JSON — Run
would be the first call to anything off-origin). It needs a real code-execution service reachable directly
from a static GH-Pages site with no backend to hide a secret behind, executing **Kotlin** (the app's only
authored language) with no automated grading, per the spec's clarifications.

**Findings — provider options, checked 2026-08-14**:

| Option | Self-serve? | Reachable from browser JS? | Kotlin? | Key exposure |
|---|---|---|---|---|
| Piston (`emkc.org` public instance) | **No** — [the project's own readme](https://github.com/engineer-man/piston/blob/master/readme.md) states *"The Piston API is no longer freely available to the public (as of Feb 15, 2026)"*; authorization requires messaging the maintainer on Discord and is granted only for "good cause non-commercial educational projects," explicitly excluding "assignments" and similar | Undocumented (readme doesn't address CORS) | Yes, per its runtimes list | N/A — gated by manual approval, not a key model |
| Judge0 CE, via [RapidAPI's free Basic plan](https://rapidapi.com/judge0-official/api/judge0-ce/pricing) | Yes — RapidAPI signup, no maintainer approval | Yes — this is the standard integration pattern documented in multiple public tutorials (e.g. a React-based "build your own online compiler" walkthrough) that call the RapidAPI Judge0 endpoint with `fetch` directly from client-side code, no backend proxy | **Yes** — confirmed directly against [`ce.judge0.com/languages/`](https://ce.judge0.com/languages/): `{"id":111,"name":"Kotlin (2.1.10)"}` (and an older `id:78`, "Kotlin (1.3.70)", also present) | A key embedded in the app's own source would be world-readable on GH Pages regardless of provider — see decision below |

Piston is ruled out on self-serve grounds alone: a personal side-project cannot depend on a discretionary,
per-request Discord approval to ship a feature. Judge0 CE is self-serve, documented to work as a direct
browser-side `fetch` target in practice, and confirmed to support Kotlin. [`ce.judge0.com`](https://ce.judge0.com/)
documents a synchronous submission mode (`POST /submissions?wait=true`, avoiding a submit-then-poll dance)
and a `status` object on the response (`id`/`description` — e.g. Accepted, Compilation Error, Runtime
Error, Time Limit Exceeded) that maps directly onto FR-019's "real output, or a readable
compile/runtime-error message" — there is no `expected_output`/pass-fail field this app needs to populate,
matching the spec's "execute-and-display only" decision. The RapidAPI free Basic plan's exact request quota
isn't published without a signed-in account; that number should be confirmed at whichever point a
candidate actually subscribes, not asserted here as an unverified figure.

**Decision — bring-your-own-key, not an embedded shared key**:

1. The app never ships its own Judge0 API key. A candidate who wants DSA Run pastes their own free RapidAPI
   key into a new Settings field; it's stored client-side (`localStorage`, alongside the app's other
   per-device settings) and sent only as the `X-RapidAPI-Key` header on the candidate's own Run requests.
   This isn't a workaround for CORS or rate limits — it's the only architecture that doesn't put a shared
   secret in a public GH-Pages page's source for anyone to read and spend against. It also fits the
   project's existing framing better than any alternative: "every candidate's learning history living only
   on their own device" (constitution preamble) extends naturally to "every candidate's own API credential,
   too." No Run capability is offered until a key is present; its absence is just another "needs
   connection"-shaped empty state (FR-020's message covers "missing key" the same way it covers "offline").
2. **Generated driver** (FR-019a/b): a new per-item content field, `sampleCall` — a single authored Kotlin
   expression that invokes the item's function with literal sample arguments (e.g. `threeSum(intArrayOf
   (-1,0,1,2,-1,-4))`), chosen over structured per-argument fields because DSA signatures vary in arity and
   type across ~all items and a free-form call expression is the one shape that fits every signature
   uniformly. The submitted `source_code` is the candidate's editor contents plus a generated
   `fun main() { println(${sampleCall}) }` appended — never the bare candidate function, which (per the
   spec's clarification) would compile but print nothing.
3. **Request lifecycle**: `POST` with `language_id: 111` (Kotlin 2.1.10 — the most recent Judge0-supported
   version), `wait=true`, an `AbortController` per DSA view instance so a second "Run" press while one is
   in flight aborts the first cleanly (Edge Cases) rather than racing two results onto the page. A request
   timeout (client-side, generous — code execution plus a JVM/Kotlin compile is not instant) covers the
   "request fails" branch of FR-020 alongside outright network failure and a missing key.
4. **Everything else offline, unchanged** (FR-022): this is the only `fetch` target added anywhere in
   `assets/js/**`, gated entirely behind the Run button; no other view, route, or boot path gains a network
   call.

**Alternatives rejected**: Piston (self-serve blocker, above); Glot.io (a real search turned up an [open,
unresolved CORS issue](https://github.com/prasmussen/glot-run/issues/22) reporting browser `fetch` calls
failing with a missing `Access-Control-Allow-Origin` header — a documented dead end for this app's
no-backend constraint); JDoodle (its own developer-facing guidance is to proxy calls through a backend
specifically because of CORS/key-exposure concerns — the app has no backend to put one behind); a
self-hosted judge (violates Principle V — "no build step, no dependencies," and this project is a static
site with no server process to run one on).

**Residual risk, flagged rather than papered over**: no source consulted here states Judge0's RapidAPI
gateway's CORS policy in so many words — the decision rests on the pattern being the standard, widely
reproduced integration shape in public tutorials, not on a CORS policy document. The first implementation
task for User Story 6 should be a five-minute browser smoke test (one `fetch` call from `tools/serve.sh`'s
`localhost` origin) confirming this before any editor/driver work is built on top of it.

---

## R-008 — Level label rename: confirmed single point of change, plus a doc-only cleanup list

**Problem**: US9/FR-031–032 need "Lead" everywhere "Staff/Monster" appears, without touching the
underlying level number or any stored data.

**Findings**: `assets/js/levels.js:1-12` is the **only** place the string is defined
(`LEVEL_LABEL = {1: 'Basics', 2: 'Mid-Level', 3: 'Senior', 4: 'Staff/Monster'}`); a repo-wide grep for
`"Staff/Monster"|"Monster"|"Staff"` across `assets/js/**` returns no other hit — every view imports
`LEVEL_LABEL`/`levelLabel()` rather than hardcoding a label, confirming the CLAUDE.md claim that this is
already centralized. Outside rendered UI, the same string is echoed in four doc/comment locations that
don't affect any candidate but would drift from the app if left alone: `CLAUDE.md:83`, `AGENTS.md:59-60`,
`.claude/workflows/fill-content-gap.js:250` (a comment inside a script already marked unused), and this
Spec Kit scaffold's own `specs/001-fill-content-gap/contracts/content-schema.md:20`.

**Decision**: Change exactly one line — `LEVEL_LABEL[4]` — from `'Staff/Monster'` to `'Lead'`. No item
data, filter logic, or stored progress references this string (level filtering and storage key on the
numeric `level` field throughout, per FR-032). Update the four doc/comment occurrences above in the same
change for consistency, since they're free and prevent a future author copying stale phrasing into new
content — this is documentation hygiene, not a functional requirement of the spec.

**Alternatives rejected**: none — this is a one-line change with no competing approach.
