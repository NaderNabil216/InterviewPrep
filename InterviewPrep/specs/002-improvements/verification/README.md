# T058 walkthrough harness

The scripts that executed `quickstart.md`'s US1-US9 walkthrough for T058, including the DevTools
cold-cache / offline / online simulations T062 could not automate. They live here, in the Spec Kit
scaffold, rather than in the app repo — `/Users/nn/InterviewPrep` has no test runner by design
(CLAUDE.md: *no build step, no npm, no package.json, no test suite*) and this must not become one.

They are evidence and a re-runnable check, not part of the app.

## Running them

Serve the app first — `fetch()` of local JSON is blocked over `file://`:

```bash
cd /Users/nn/InterviewPrep && bash tools/serve.sh      # http://localhost:8777
```

Then, from this directory (Node ≥ 22 for the global `WebSocket`; Chrome at the path in `cdp.mjs`):

```bash
node us2.mjs        # cold cache, CPU/network throttling, warm cache
node us3.mjs        # auto-sync: apply, tick re-anchoring, mid-session hold, offline→online,
                    #   blocked-pack abandonment (FR-007a), unchanged-index cost (FR-011)
node us6.mjs        # DSA Run: needs-key, pending, re-run abort, 30s timeout, offline,
                    #   not-runnable, key hygiene  (~60s — it waits out the real 30s abort)
node us14589.mjs    # US1 debounce, US4 one-tap, US5 timer pause, US8 clarify flow, US9 Lead
node us7check.mjs   # the 14 shortAnswers rewritten in T063 render their new wording
node fielddiff.mjs  # run from /Users/nn/InterviewPrep — which fields moved vs git HEAD

node coldroutes.mjs   # cold cache on all 10 routes — the indicator must clear on every one
node coldfail.mjs     # cold cache whose content phase fails, and whether it recovers (T064)
node offlineboot.mjs  # first boot offline, then reconnect — the boot must finish itself
```

Each prints `[PASS]`/`[FAIL]` per assertion and exits non-zero on any failure. `us3.log`, `us6.log`
and `rest.log` are the recorded runs from 2026-08-16.

## How the simulations are driven

`cdp.mjs` is a small Chrome DevTools Protocol driver (launch, flat-session routing, `eval`,
`waitFor`, request recording). The DevTools actions the quickstart calls for map to:

| Quickstart step | CDP mechanism |
|---|---|
| Application → Clear site data | `Storage.clearDataForOrigin` + `Storage.getUsageAndQuota` to verify |
| Network → Offline | `Network.emulateNetworkConditions` (also fires the page's own `online` event on restore) |
| Network → Request blocking | `Network.setBlockedURLs` |
| Slow CPU / network profile | `Emulation.setCPUThrottlingRate` + throttled `emulateNetworkConditions` |
| Judge0 responses without a paid key | `Fetch.enable` + `fulfillRequest` / `failRequest` / stall |

## What the walkthrough missed the first time

`us2.mjs` and `us3.mjs` both passed while a real bug sat between them: US2 only ever cold-booted on
a *healthy* network, and US3's blocked-pack test used a *warm* snapshot, where abandoning the sync
is the correct behavior. Nobody tested a **cold cache whose content phase fails** — which stranded
the app on "Loading your library…" permanently (T064). `coldfail.mjs` and `offlineboot.mjs` exist to
keep that intersection covered.

The lesson generalises: when two suites each cover one axis, the failure tends to live in the cell
neither one visits.

## Two traps worth knowing before you edit these

- **Clear site data must be issued from `about:blank`.** An open IndexedDB connection on a live app
  page blocks `deleteDatabase`, which then completes *after* the next load and silently wipes the
  snapshot that load just wrote — which reads as a warm-cache regression that isn't one.
- **The boot-time sync check fires as soon as the shell renders.** Any scenario that needs to stage
  state first (enter a Drill session, go offline) must hold `content/manifest.json` with
  `setBlockedURLs` until it is ready, then release it.

`us3.mjs` induces stale content by ageing the **stored snapshot** in IndexedDB, not by editing
`content/manifest.json`. It drives the identical `diskManifest.version === snapshot.version` path
without mutating the repository.

## Not covered

A live Judge0 run with a real RapidAPI key (quickstart US6 steps 2-3). `us6.mjs` verifies the
response→panel mapping with intercepted payloads, and T060 already proved CORS reachability against
the real endpoint; what remains unverified is only the keyed round-trip itself.
