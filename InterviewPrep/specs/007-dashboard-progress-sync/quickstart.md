# Verification Guide: Dashboard Progress Reflects Completed Questions

**Feature**: `007-dashboard-progress-sync` | **Date**: 2026-08-20 | **Plan**: [plan.md](./plan.md)

This is the FR-026 artifact: a written procedure covering **every acceptance scenario in the spec**,
each with its expected result, so a maintainer can confirm the feature without reading source code to
work out what should happen. Part A is automated and takes seconds. Parts B–E are a browser pass.

Every expected value below is either stated outright or read from the app itself with the helper
snippets in §0.3 — no number in this guide needs to be recomputed by hand.

---

## §0 Setup

### 0.1 Prerequisites

- Node ≥ 22.7 (`node -v`). The check imports an ES module by `.js` path; older runtimes cannot.
- Python 3 (for `tools/serve.sh`).
- A Chromium-based browser with DevTools. Everything works in Firefox except the timezone override in
  §D, which has a documented fallback.

### 0.2 Start

```bash
cd /Users/nn/InterviewPrep
node tools/validate.mjs            # must exit 0, and must now print "✓ gate 16 progress accounting"
bash tools/serve.sh                # http://localhost:8777
```

Open `http://localhost:8777` (never `file://` — the app hard-stops).

**Back up your own history first**: Settings → **⬇ Export progress.json**. Keep that file; §E needs
it, and Settings → *Import* restores it when you are done.

### 0.3 Console helpers

Paste once per page load, in DevTools on the served origin. These write only `aip.v1.progress`, the
same key the app writes.

```js
const KEY = 'aip.v1.progress';
const P = () => JSON.parse(localStorage.getItem(KEY) || '{}');
const save = p => localStorage.setItem(KEY, JSON.stringify(p));
const localISO = (o = 0) => { const d = new Date(); d.setDate(d.getDate() + o);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const snap = async () => (await (await import('/assets/js/store.js')).Store.getSnapshot());

// Library shape — use these numbers as the expected totals throughout.
const totals = async () => { const s = await snap(); const t = {};
  for (const i of s.items) t[i.track] = (t[i.track] || 0) + 1;
  console.table(t); console.log('library total', s.items.length,
    '| drillable', s.items.filter(i => i.type !== 'dsa' && i.type !== 'design').length); };

// Mark the first n questions of a track complete, due `dueOffset` local days from today.
const complete = async (track, n, dueOffset = 3) => { const s = await snap();
  const ids = s.items.filter(i => i.track === track).slice(0, n).map(i => i.id); const p = P();
  for (const id of ids) p[id] = { status: 'learning', ease: 2.5, interval: 3, reps: 1, lapses: 0,
    due: localISO(dueOffset), lastRated: new Date().toISOString(), lastRating: 'good' };
  save(p); return ids; };

// Save a note and nothing else on the first n questions of a track.
const noteOnly = async (track, n) => { const s = await snap();
  const ids = s.items.filter(i => i.track === track).slice(0, n).map(i => i.id); const p = P();
  for (const id of ids) p[id] = { notes: 'memory hook' }; save(p); return ids; };

// Mark every question of a track complete (100% coverage).
const fullCover = async (track) => { const s = await snap();
  await complete(track, s.items.filter(i => i.track === track).length); };
```

Reload the page after any helper call — these write storage directly and the view renders from a
render-time read.

### 0.4 Fixtures

| ID | How to build it |
|---|---|
| **F0** fresh | Settings → **Reset progress** → confirm → reload |
| **F1** 10 of 40 | F0, then `await complete('data-networking', 10)` |
| **F2** note-only | F0, then `await noteOnly('kotlin', 1)` |
| **F3** uneven | F0, then `await complete('data-networking', 36)` and `await complete('performance', 4)`, then `await fullCover(t)` for **every other track** — the Weakest-tracks card has only four slots and would otherwise be flooded by zero-record tracks (deterministic all-zero ordering, SC-007) |
| **F4** past-due | F0, then `await complete('kotlin', 1, -2)` |
| **F5** full track | F0, then `await complete('cheatsheets', 5)` |
| **F6** orphan | F1, then `{ const p = P(); p['zz-999-not-in-library'] = { due: localISO(1), reps: 1 }; save(p); }` |

`data-networking` and `performance` hold 40 questions each and `cheatsheets` holds 5 — confirm with
`await totals()` rather than trusting these numbers, since content grows.

---

## §A The automated check (User Story 6)

```bash
node tools/check-progress.mjs
echo "exit: $?"
```

| Scenario | Steps | Expected |
|---|---|---|
| **US6 #1** synthetic history with known counts | run the command above | report lists assertion groups all passing; final line `All good — N assertions, 6/6 defect stand-ins caught`; exit `0` |
| **US6 #2** a broken definition is caught and named | the six built-in defect stand-ins already do this — read the `defect stand-ins` block | every `D1`–`D6` line shows `caught by: <assertion>`; none says `caught by: —` |
| **US6 #2** (manual confirmation) | edit `assets/js/progress.js` so `isCompletedRecord` returns `rec.interval >= 21`, re-run, then **revert** | exit `1`; failures name the mismatch, e.g. `✗ coverage/day-one-non-zero kotlin: expected 5/70, got 0/70` |
| **US6 #3** no browser, no dependency | `grep -n "require\|from '" tools/check-progress.mjs` | only `node:fs` / `node:path` / `node:url` and the relative import of `assets/js/progress.js` |
| **US6 #4** written procedure exists | this document | every acceptance scenario below has a stated expected result |
| **US6 #5** runs inside the integrity command | `node tools/validate.mjs; echo "exit: $?"` | prints `✓ gate 16 progress accounting: …`; exit `0`. Repeat with the broken definition above: `validate.mjs` prints `✗ gate 16 …` and exits `1` |

Also confirm the check is order-independent and clock-independent: run it twice and compare output —
it must be byte-identical.

---

## §B Progress that reflects completions (User Story 1)

| # | Scenario | Fixture / steps | Expected |
|---|---|---|---|
| 1 | No history → all zero | **F0**, open Dashboard | hero: `629 questions · 0 completed · 629 not started`; every coverage bar `0/N · 0%`; Review queue `0 due for review` |
| 2 | 10 of 40 → 25% | **F1**, open Dashboard | `Data & Networking` row reads `10/40 · 25%` with the bar a quarter filled; hero `10 completed · 619 not started` |
| 3 | No threshold, no delay | **F0**, open any Kotlin question, **Mark complete**, then Dashboard | Kotlin reads `1/70 · 1%` immediately; hero `1 completed`. **No** waiting period, and in particular not the 32 days the old reading required |
| 4 | A whole track → 100% | **F5**, Dashboard | `Cheat Sheets` reads `5/5 · 100%` |
| 5 | Completed **and** due still counts as completed | **F4**, Dashboard | Kotlin reads `1/70 · 1%` **and** Review queue reads `1 due for review` — completion and due-ness reported separately, not one instead of the other |
| 6 | Five completions count once | **F0**, open one question and press **Mark complete** five times (reload between presses) | that track reads `1/N`, never `5/N`; hero `1 completed` |
| 7 | Cold start shows loading, not zero | DevTools → Application → clear IndexedDB `aip`, then hard-reload and watch the first paint | hero shows `— questions · — completed · — not started`; coverage card `Loading track coverage…`; Review queue `Loading your review queue…`. Never `0%` presented as real |
| 8 | Re-requesting the current surface is fresh | **F0**, open Dashboard; in a second tab (or the console) run `await complete('compose', 3)`; back on the Dashboard **click the top-bar Dashboard button** | figures update to `3 completed` without a reload. Before the fix this button was a no-op |
| 9 | Pre-existing history survives | **§E** below | — |
| 10 | A failed save is not a completion | **F0**; paste the stub below; open a question; **Mark complete** | the persistent storage banner appears (`Your last rating could not be saved.`); **no** "Marked complete" toast; the status line still reads `Not started`; Dashboard still `0 completed`. Then reload to clear the stub |

```js
// US1 #10 — make the progress write fail. Reload to undo.
const orig = Storage.prototype.setItem;
Storage.prototype.setItem = function (k, v) {
  if (k === 'aip.v1.progress') { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; }
  return orig.call(this, k, v);
};
```

---

## §C Every surface agrees (User Story 2)

Setup: **F0**, then Plan → **15-day deep plan** → **Start plan today**. Pick a Day-1 task with an
`open →` link and three or more linked questions; note its label.

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 1 | All questions done → task done, dashboard counts them | open the task, mark **every** linked question complete, return to Plan | the task is ticked and shows the `auto` chip; Dashboard's hero completed count has risen by exactly the number of questions in that task |
| 2 | Partially done → task not done | **F0**, same task, complete all but one | task **unticked**; Dashboard counts exactly the number you completed |
| 3 | Topics state matches the dashboard | **F1**, Topics → filter *Completed*, track *Data & Networking* | exactly 10 questions listed, each with a filled `completed` dot — the same 10 the dashboard counts. For `dsa` / `system-design` (absent from Topics by design) compare Dashboard against Plan → Weakest tracks instead |
| 4 | Two reachable status options only | Topics → open the status dropdown | exactly `Any status`, `Not started`, `Completed`, `✨ New in v2026.08.34`. No `Learning`, `Due for review` or `Known`. Under **F1** both `Not started` and `Completed` return non-empty results |
| 4b | Legacy bookmark degrades gracefully | navigate to `#/topics?status=known` | the full library lists (filter falls back to *Any status*) — never an empty "No items match" over a full library |
| 5 | Every count names its population | read the Dashboard hero, Review-queue card, free-study card, coverage rows; then Plan's three free-study cards | each figure states what it counts; `completed + not started = total` on both surfaces; the free-study card's faint line states that *due* excludes DSA and System Design while *not started* covers the library |
| 6 | The due figure can be driven to 0 | **F4** plus `await complete('compose', 2, -1)`; note the Review-queue figure; click **Start drill →** and mark every card complete | on returning to the Dashboard the figure reads `0 due for review`. It must never count a question the drill did not offer |

Cross-check for **SC-003** in one pass, per track: Dashboard coverage row `n/total` = Plan → Weakest
tracks `n/total` = Topics *Completed* count for that track (11 Topics tracks); Dashboard = Plan for
`dsa` and `system-design`.

---

## §D Notes, review reachability, recommendations, and dates (User Stories 3–5)

### User Story 3 — notes are notes

Setup: **F0**. Open a fresh Kotlin question, type into **Your notes**, click outside the box to fire
the save, and do **not** press Mark complete.

| # | Scenario | Expected |
|---|---|---|
| 1 | Note ≠ completion | Dashboard hero still `0 completed`; that track still `0/70 · 0%` |
| 2 | Still offered in review | **Start drill →**: the noted question appears in the queue. This is the defect that removed it permanently |
| 3 | Plan task stays unticked | a plan task linked only to noted questions is **not** ticked |
| 4 | Topics state is consistent | the question shows the `not-started` dot and matches the *Not started* filter |
| 5 | Existing note-only history is silently corrected | **F2** (a note-only record already on disk), reload | the question is offered in the drill again; any plan task that read as done because of it now reads as not done; **no notice, confirmation or decline step appears**; the note is still in the textarea; the checkbox is still tickable by hand and stays ticked once ticked |

### User Story 4 — recommendations point at genuinely weak tracks

| # | Scenario | Fixture | Expected |
|---|---|---|---|
| 1 | Weaker track ranks lower | **F3** (`data-networking` 90%, `performance` 10%) | Plan → Weakest tracks lists `Performance` above `Data & Networking` |
| 2 | Next up is uncompleted material from weak tracks | **F3**, Dashboard → *Next up* | every suggested question is one you have **not** completed, drawn from the lowest-coverage tracks |
| 3 | No history → stable, non-empty | **F0**, reload three times | *Next up* is non-empty and lists the **same** questions each time |
| 4 | A finished track is not a source | **F5** (`cheatsheets` at 100%) | no cheat sheet appears in *Next up* |

### User Story 5 — due dates follow the candidate's local calendar day

Preferred method: DevTools → ⋮ → More tools → **Sensors** → *Location* → a preset or custom entry
with **Timezone ID** `Asia/Tokyo`, then reload. Fallback: change the OS timezone. `§A`'s check already
covers all 24 hours in two zones exhaustively (SC-008), so this is a spot-check of the browser path.

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 1 | Ahead of UTC at 01:00 local | timezone `Asia/Tokyo`; `await complete('kotlin', 1, 0)` (due today, local); reload at a local hour before the UTC offset | Review queue counts that question **today**. Before the fix it was withheld until the UTC date caught up |
| 2 | Behind UTC late evening | timezone `America/Los_Angeles`; `await complete('compose', 1, 1)` (due tomorrow, local); reload late local evening | the question is **not** offered — no early release |
| 3 | One-day interval becomes due exactly on the next local day | `await complete('kotlin', 1, 1)`, then advance the OS/emulated date by one day and reload | the question is due, on the first local day, not a day early or late |

---

## §E Nothing a candidate earned is lost (SC-009, US1 #9)

1. On the **pre-change** build, create a mixed history: some completions, some notes, at least one
   manual plan tick, one drill session, one mock result. Settings → **Export progress.json** → save as
   `before.json`.
2. Check out the feature branch, reload, and read the Dashboard.
3. Settings → **Export progress.json** → save as `after.json`.
4. Compare:

```bash
node -e '
const a=require("/abs/path/before.json"), b=require("/abs/path/after.json");
const keys=new Set([...Object.keys(a.progress),...Object.keys(b.progress)]);
let diff=0;
for(const k of keys){ if(JSON.stringify(a.progress[k])!==JSON.stringify(b.progress[k])){ diff++; console.log("CHANGED",k); } }
console.log("progress records changed:",diff);
console.log("plan.done identical:",JSON.stringify(a.plan.done)===JSON.stringify(b.plan.done));
console.log("plan.checked identical:",JSON.stringify(a.plan.checked)===JSON.stringify(b.plan.checked));
console.log("mockResults identical:",JSON.stringify(a.mockResults)===JSON.stringify(b.mockResults));
'
```

**Expected**: `progress records changed: 0`, and all three `identical: true`. Every completion, note,
interval, due date, manual tick and mock result is byte-identical — the corrected figure is read from
them, never written back. If any line reports a change, the feature has violated FR-022/FR-023 and
must not ship.

Then confirm the *reading* changed as intended: pre-existing completions are counted on the Dashboard
(US1 #9), and any note-only question is back in the drill queue (US3 #5).

Also check **F6**: an orphan record (an id no longer in the library) leaves the hero count and every
bar unchanged, and no percentage exceeds 100%.

---

## §F Edge cases

| Edge case | How to check | Expected |
|---|---|---|
| Retired question with a completion | **F6** | record survives in the export; counted nowhere; all percentages within 0–100% |
| Track total of zero | inspect `coverageByTrack` output for a synthetic empty track (covered by §A's `coverage` group) | no division by zero, no `NaN%`, track omitted from the bars |
| Content arrives mid-study | with a track at 100%, add a question to one of its packs, bump `manifest.version`, re-run `node tools/validate.mjs`, then focus the tab | the bar legitimately drops below 100% and the count is correct. It must **not** be frozen to look tidy |
| Library still loading | US1 #7 above | loading state, never `0%` |
| History imported from a pre-change export | Settings → *Import* `before.json` | records load unchanged and are interpreted under the new definition; nothing is rewritten or discarded |
| Note on an already-completed question | complete a question, then add a note | completion and the `next review` date are unchanged |
| Workspace questions (`dsa`, `system-design`) | Dashboard | they appear in coverage bars; they are **not** in the Review-queue figure; the free-study card's faint line says so |
| Read-only reference track | Cheat Sheets → open a sheet | a **Mark complete** action is present, and the `cheatsheets` track can reach 100% from that view. Print preview (⌘P) shows **no** rate row |
| Learning state cannot be saved | US1 #10 above | banner shown; not counted as completed |

---

## §G Sign-off

Feature is verifiable when all of these hold:

| Success criterion | Confirmed by |
|---|---|
| SC-001 figures change by exactly the number completed | §B 2, 3, 6 |
| SC-002 non-zero on day one | §B 3 |
| SC-003 counts identical across surfaces, all 13 tracks | §C 3 + the per-track cross-check |
| SC-004 no contradictory plan/dashboard pair | §C 1, 2 |
| SC-005 zero questions lost to review by note-saving | §D US3 2, 5 |
| SC-006 both status options reachable, no third unreachable one | §C 4 |
| SC-007 genuine ascending weakest-track order | §D US4 1 |
| SC-008 due counts match the local calendar at every hour | §A `local calendar` group + §D US5 |
| SC-009 100% of prior records present and unaltered | §E |
| SC-010 check passes on the fix, fails on each defect, runs in the release gate | §A |
| SC-011 every scenario confirmable from this document | this document |
| SC-012 every counted track reachable to 100% | §F read-only reference track + §B 4 |
| SC-013 due figure drivable to 0 | §C 6 |

Verification record: `node verification/browser-pass.mjs` executed §B–§F headlessly and passed
**45/45** on 2026-08-20 (branch `fix/007-dashboard-progress-sync` vs `origin/main` @2653621);
§A's `node tools/check-progress.mjs` passed 109 assertions with 6/6 defect stand-ins caught on the
same date, and `node tools/validate.mjs` (and `--final`) exit 0.

Finally: `node tools/validate.mjs` exits `0`, and Settings → *Import* has restored your own
`progress.json`.
