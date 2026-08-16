# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A local, offline-capable Android interview study site. Vanilla HTML/CSS/ES modules + JSON content
packs. **No build step, no npm, no package.json, no framework, no CDN, no test suite.** Node is used
only for the CLI tools under `tools/`. It **is** a git repository, working through PRs off `main`.

Two distinct kinds of work happen here, and they barely overlap:
1. **App code** — `index.html`, `assets/js/**`, `assets/css/app.css`
2. **Content** — `content/manifest.json`, `content/packs/*.json`, `content/plans/*.json`

## Commands

```bash
bash tools/serve.sh              # serve on http://localhost:8777 (caching disabled)
bash tools/serve.sh 9000         # different port

node tools/validate.mjs          # content integrity — MUST exit 0 after any content edit
node tools/sync-manifest.mjs                 # dry run: report pack files missing from the manifest
node tools/sync-manifest.mjs --write
node tools/sync-manifest.mjs --write --release 2026.08.7 --summary "..."
node tools/check-refs.mjs        # network-probe every ref URL (all packs)
node tools/check-refs.mjs kotlin-g   # only packs whose filename contains this string
```

The site **must** be served over `http://localhost` — `fetch()` of local JSON is blocked over
`file://`, and `app.js` hard-stops with a notice if `location.protocol === 'file:'`.

There is no linter and no automated test runner. `validate.mjs` is the closest thing to a test suite;
verifying app-code changes means loading the site in a browser.

## The snapshot / progress split — the central invariant

`store.js` owns all persistence, in two physically separate stores that must never be conflated —
the snapshot in IndexedDB, the learning state in localStorage under the `aip.v1.` prefix:

- **the content snapshot** — a pinned copy of the whole content set, stored in **IndexedDB**
  (db `aip`, store `snapshot`, key `current`) as a *single* copy inside `packs`; `items` and `byId`
  are derived in memory on load, never persisted. Replaced *wholesale* on update. The old
  `aip.v1.snapshot` localStorage key is migrated once on boot and then removed.
- **`aip.v1.progress` / `.session` / `.plan` / `.mockResults` / `.scratch.<id>`** — the user's learning
  state, keyed by **permanent item id**. `.plan` carries `mode` (`free | 7day | 14day`, default
  `free`) and `done`, keyed by **material signature** `[...itemIds].sort().join('+')` — never by
  `dayIdx:taskIdx`, which silently marked unread material as done when a plan was re-authored.

Everything renders from the snapshot, so the site works offline and instantly. New content on disk
reaches a device **automatically** — there is no Update button, no "Up to date" label and no What's
New view; the candidate is told what changed by a toast, never asked to approve it:

1. Boot is two phases. `content.js#bootShell()` returns the stored snapshot instantly if present;
   on a cold cache it fetches only `content/manifest.json` and returns a minimal, **not persisted**
   placeholder so nav + dashboard render before any pack lands. `bootContent(manifest)` then fetches
   every pack and plan with `Promise.all`, builds the snapshot, persists it, and `app.js` re-renders
   the mounted view in place. Both are async — `Store.getSnapshot()`/`setSnapshot()` hit IndexedDB.
2. `app.js#initAutoSync()` runs `checkForUpdates()` after the shell-phase render, on
   `visibilitychange`/`focus`, and on the browser's `online` event.
3. `checkForUpdates()` **short-circuits when `diskManifest.version === snapshot.version`.** Content
   edits without a manifest version bump are literally unreachable by the app. Because the check now
   runs on every focus, a regression here turns one wasted fetch into a recurring one.
4. A found diff is held as `App.pendingDiff` until `App.sessionActive` is false — a sync never lands
   mid-Drill or mid-Mock. Applying it re-anchors ticks via `store.js#migrateTicks()` **before**
   `applyUpdate(diff)` swaps the snapshot, because the outgoing plan exists only inside the snapshot
   being replaced.
5. The apply is all-or-nothing: `checkForUpdates()` fetches the complete content set before anything
   mutates, so one failed pack abandons the attempt silently — nothing persisted, no toast, no error
   shown — and the device retries at the next trigger.

Because progress is keyed by id and lives in its own namespace, updates cannot disturb it — **provided
item ids are never reused or renumbered.** Reusing an id silently corrupts a user's drill schedule.
This is the one rule in the repo with no acceptable exception.

## Content model

`content/manifest.json` is the registry: `version` (`YYYY.MM.N`), `generatedAt`, `stackSnapshot`
(version-truth strings surfaced in cheat sheets), `stackSnapshotChecked` (the date that registry was
last re-verified), `packs[]`, `plans[]`, `releases[]` (newest first, strictly descending under
**numeric** comparison — `2026.08.10` is newer than `2026.08.9`).

**A pack file on disk that is not listed in `manifest.packs` does not exist as far as the app and the
user are concerned — but its ids are still claimed**, and `validate.mjs` gates 1 and 8 read every
pack on disk precisely so that stays visible. Register packs with `tools/sync-manifest.mjs --write`,
which inserts each new pack after the last existing pack of the same track so track ordering never
jumps. Prefer that script over hand-editing the manifest; it also owns `--date` and
`--stack-checked`.

Item schema, id prefixes per track, and the full refresh procedure live in
**`tools/REFRESH.md`** — read it before touching content. Highlights:

- Id prefixes in use: `kt- co- cmp- pf- ar- dn- pe- bt- sk- ds- sd- bh- cs-`.
- `level` is 1–4; labels come from `assets/js/levels.js` (Basics / Mid-Level / Senior / Lead)
  — never hardcode a difficulty word in a view.
- `type` is `qa | concept | dsa | design | behavioral`; `dsa` and `design` items carry extra required
  fields (see REFRESH.md).
- Every version- or date-bearing claim needs a `refs` entry with a `checked` date; `validate.mjs`
  errors on a ref without one.
- `addedIn` on new items, `updatedIn` on changed ones, both set to the new manifest version. An
  `addedIn` with no matching `releases[]` entry is a warning — the release note the sync toast
  summarises comes from `releases[]`.
- Voice: `shortAnswer` is what you'd say out loud; `answer` is the depth behind it; `traps` are what
  gets candidates rejected.

`content/plans/{7day,14day}.json` reference real item ids in `task.itemIds`; `validate.mjs` fails on
any that don't resolve. Deleting or renaming an item means fixing the plans.

### Markdown in `answer` is a restricted dialect

`md.js` implements a deliberate subset — inline code, `**bold**`, `*italic*`, links, `-`/`1.` lists,
`|` tables, and headings. **All heading levels (`#` through `######`) render as `<h4>`**, so heading
depth carries no visual hierarchy. There is **no fenced-code-block support**: code belongs in the
item's `code: [{ lang, caption, src }]` array, which is highlighted by the built-in Kotlin
highlighter (`highlightCode` only colorizes `kotlin`/`kt`/unset; everything else is escaped plain).

## App code structure

`app.js` is the shell: a hash router (`#/view/param?k=v` → `parseHash`), the `routes` map, theme
cycling (dark → light → auto), the search overlay, the automatic content sync, and `toast()` /
`showModal()`.

Every view is `renderView(el, { param, query, snapshot })`, exported from `assets/js/views/<name>.js`
and registered in `routes` in `app.js`. Views build HTML strings, assign `el.innerHTML`, then attach
listeners — there is no virtual DOM, no reactivity, and no re-render on state change other than
navigating. Adding a view means: create the module, import it, add it to `routes`, and add a
`data-nav="<name>"` button in `index.html` (all `[data-nav]` elements are auto-wired to `navigate()`).

Shared modules: `store.js` (localStorage), `content.js` (fetch/diff/merge), `srs.js` (SM-2-lite
scheduling, `rate`/`buildQueue`/`masteryByTrack`), `search.js` (in-memory index, rebuilt after every
snapshot swap), `md.js`, `levels.js`.

`assets/css/app.css` is versioned by query string in `index.html` (`app.css?v=5`) — bump `v` when a
stale cache would matter. It carries the light/dark token sets and the print styles the cheat sheets
depend on.

## Notes

- `README.md` is user-facing and its item counts drift; `node tools/validate.mjs` prints the truth
  (629 items across 89 registered packs as of manifest 2026.08.17).
- `validate.mjs` carries 15 gates and a `--final` flag. Gates 4, 5, 8, 9, 12 are warnings during a
  staged expansion and errors at `--final`; gates 2, 3 and 14 are **release-scoped** — an error on
  an item the current release ships, a warning on untouched remediation backlog, an error at
  `--final`. Gate 15 errors on any ` ``` ` in a prose field (`q`, `answer`, `shortAnswer`,
  `prompt`, `referenceAnswer`, `framework`, `followUps`, `traps`, `hints`, `summary`, `label`,
  `description`) — `md.js` has no fenced-code support, so prose must never carry one.
- `InterviewPrep/` (a nested subdirectory of the same name) is a Spec Kit scaffold. Its tooling —
  `.specify/` templates, `.opencode/`, `speckit-*` skills — has nothing to do with this app and is
  untracked; ignore it unless explicitly asked about Spec Kit. **`InterviewPrep/specs/` is the
  exception and is tracked**: it holds the spec, plan, research, contracts, tasks and verification
  records for each feature (`001-fill-content-gap`, `002-improvements`). Read the relevant
  `specs/<feature>/` before changing what that feature built — it is where the reasoning lives, and
  `tasks.md` carries the per-task completion record.
- `.claude/launch.json` defines a `prep-site` launch config running `python3 tools/serve.py` on 8777.
