# Browser-pass harness for quickstart.md (feature 007)

The script that executed `quickstart.md`'s §B–§F walkthrough end-to-end in headless Chrome for the
browser pass of feature 007 (single definition of progress). It lives here, in the Spec Kit
scaffold, rather than in the app repo — `/Users/nn/InterviewPrep` has no test runner by design
(CLAUDE.md: *no build step, no npm, no package.json, no test suite*) and this must not become one.

It is evidence and a re-runnable check, not part of the app.

## Running it

Serve both builds first — `fetch()` of local JSON is blocked over `file://`:

```bash
cd /Users/nn/InterviewPrep && bash tools/serve.sh          # feature branch — http://localhost:8777
git worktree add /tmp/aip-before <origin/main commit>      # pre-change build for §E
python3 -m http.server 8778 -d /tmp/aip-before             # http://localhost:8778
```

Then, from this directory (Node ≥ 22 for the global `WebSocket`; Chrome at the path in
`browser-pass.mjs`):

```bash
node browser-pass.mjs
```

Prints one `✓`/`✗` per assertion and exits non-zero on any failure. `browser-pass.log` is the
recorded run from 2026-08-20: **45/45 checks passed** (feature branch `fix/007-dashboard-progress-sync`
vs `origin/main` @2653621).

## How the scenarios are driven

`browser-pass.mjs` is a small Chrome DevTools Protocol driver (headless launch, `eval`, `waitFor`,
`nav`, two-tab `openTab`). The DevTools actions the quickstart calls for map to:

| Quickstart step | CDP mechanism |
|---|---|
| Sensors → Location → Timezone ID | `Emulation.setTimezoneOverride` (§D US5) |
| Settings → Reset progress | localStorage `reset()` helper + reload (the quickstart's own fixture F0) |
| Settings → Export / Import | `Store.exportProgress()` / `Store.importProgress` through the page (§E, §F) |
| Drill / Mark complete / notes | real DOM clicks and input events on the live app |
| Content arriving mid-study (§F) | the driver adds one synthetic item to `content/packs/cheatsheets.json` and bumps `content/manifest.json` to `2026.08.35`, dispatches `online`, asserts the 100% bar drops to `5/6 · 83%`, then restores both files byte-for-byte in a `finally` |
| DevTools timezone spot-check vs the local-calendar battery | §A's `node tools/check-progress.mjs` already exhausts all 24 hours in two zones; §D US5 spot-checks the browser path |

Fixtures (`F0`–`F6`) and helpers (`complete`, `noteOnly`, `fullCover`, `planSig`,
`reviewQueueHas`, …) are duplicated verbatim from `quickstart.md` so the document stays the single
source of truth.

## Two traps worth knowing before you edit these

- **`indexedDB.deleteDatabase` must not be awaited and races the app's open connection.** The
  reset helper fires it and moves on; a later `deleteDatabase` can complete mid-scenario and wipe
  the snapshot the next boot just fetched, so every snapshot read after a reset goes through the
  polling `snap()` helper (10 s).
- **`Runtime.evaluate` shares one global scope with the page; a reload wipes it.** Anything staged
  on `window` (e.g. the §E export bundle for §F's import) must be re-set after the reload that
  follows it, and `const` helpers must be re-injected after every `reload()`.

## What the walkthrough missed the first time

- **The Weakest-tracks card has four slots and ranks zero-record tracks first.** US4 #1's original
  F3 seed (36 + 4 completions, nothing else) left the card showing four all-zero tracks, so
  "Performance above Data & Networking" was unconfirmable. The F3 fixture now also covers every
  other track 100% (`fullCover`), which pins the two weak tracks into the card — the quickstart's
  fixture, not the app, was amended (the ranking contract in `data-model.md` already specified
  deterministic all-zero ordering, SC-007).
- **Cross-build record equality must normalise timestamps.** §E seeds the same state on
  `origin/main` (8778) and the branch (8777) ~1 s apart; `lastRated` and mock `at` necessarily
  differ, so the comparison strips `lastRated`/`at`/`exportedAt` before diffing.

## Not covered

The quickstart's §A automated battery is `node tools/check-progress.mjs` — run separately (see
`tools/REFRESH.md`); `browser-pass.mjs` only re-verifies §B–§F against a live browser.