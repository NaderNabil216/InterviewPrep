# AGENTS.md

Offline-capable Android interview study site. Vanilla HTML/CSS/ES modules + JSON content packs.
**No build step, no npm, no package.json, no framework, no test suite, and this directory is not a
git repo** (no git commands). Node is used only for the CLI tools under `tools/`.

Two barely-overlapping kinds of work:
1. **App code** — `index.html`, `assets/js/**`, `assets/css/app.css`
2. **Content** — `content/manifest.json`, `content/packs/*.json`, `content/plans/*.json`

For depth on any topic below, read `CLAUDE.md` (architecture), `tools/REFRESH.md` (content refresh),
and `.claude/AUTHORING.md` (authoring contract) before touching that area.

## Commands

```bash
bash tools/serve.sh              # serve on http://localhost:8777 (caching disabled)
bash tools/serve.sh 9000         # different port

node tools/validate.mjs          # content integrity — MUST exit 0 after any content edit
node tools/validate.mjs --final  # promotes warning-gates to errors (before final release)
node tools/sync-manifest.mjs     # dry run: report unregistered pack files
node tools/sync-manifest.mjs --write --release 2026.08.8 --summary "..." --date $(date +%F) --stack-checked $(date +%F)
node tools/check-refs.mjs        # network-probe every ref URL (all packs)
node tools/check-refs.mjs kotlin-g   # only packs whose filename contains this string
```

There is no linter or test runner. `validate.mjs` is the closest thing to tests; verifying app-code
changes means loading the site in a browser. The site **must** be served over `http://localhost` —
`fetch()` of JSON is blocked over `file://` and `app.js` hard-stops with a notice.

## The central invariant: snapshot vs progress

`store.js` keeps two physically separate stores that must never be conflated:
- **Content snapshot** in **IndexedDB** (db `aip`, store `snapshot`, key `current`) — a pinned copy
  of the whole content set. Replaced wholesale, all-or-nothing, when a sync applies.
- **Learning state** in localStorage under the `aip.v1.` prefix (`progress`, `session`, `plan`,
  `mockResults`, `scratch.<id>`) — keyed by **permanent item id**.

Consequences that trip agents up:
- Everything renders from the snapshot. **Content syncs automatically** — no Update button, no
  What's New view — on boot, `visibilitychange`/`focus` and `online`, held back while
  `App.sessionActive`. `checkForUpdates()` short-circuits when
  `diskManifest.version === snapshot.version`, so a content edit without a manifest version bump is
  unreachable by the app.
- Plan ticks are keyed by material signature `[...itemIds].sort().join('+')`, never by
  `dayIdx:taskIdx`.
- Progress survives updates only because **item ids are never reused or renumbered.** Reusing an id
  silently corrupts a user's drill schedule. This is the one rule with no exception.

## Content model

`content/manifest.json` is the registry: `version` (`YYYY.MM.N`), `generatedAt`, `stackSnapshot`
(version-truth strings shown in cheat sheets), `packs[]`, `plans[]`, `releases[]` (newest first,
strictly descending under **numeric** comparison — `2026.08.10` > `2026.08.9`).

- **A pack file on disk not listed in `manifest.packs` is invisible to the app — but its ids are
  still claimed** (`validate.mjs` reads every pack on disk). Register packs and bump releases only
  via `tools/sync-manifest.mjs --write`; never hand-edit the manifest.
- Id prefixes in use (all taken): `kt- co- cmp- pf- ar- dn- pe- bt- sk- ds- sd- bh- cs-`.
- `level` is 1–4; labels come from `assets/js/levels.js` (Basics / Mid-Level / Senior /
  Lead) — never hardcode a difficulty word in a view.
- `type` is `qa | concept | dsa | design | behavioral`. `qa` answers are authored to 120–250 words;
  `concept`/`dsa`/`design` carry no band.
- Every version- or date-bearing claim needs a `refs` entry with a `checked` date; ref hosts are
  allowlisted (gate 9). `addedIn`/`updatedIn` must be set to the new manifest version.
- `content/plans/{7day,14day}.json` reference real item ids in `task.itemIds` — `validate.mjs` fails
  on any that don't resolve, so deleting/renaming an item means fixing the plans.

### Markdown in prose fields is a restricted dialect

`md.js` supports inline code, `**bold**`, `*italic*`, links, `-`/`1.` lists, `|` tables, and
headings — **all headings render as `<h4>`**. There is **no fenced-code-block support**: never put
```` ``` ```` in any prose field. Code goes in the item's `code: [{ lang, caption, src }]` array;
the built-in highlighter only colorizes `kotlin`/`kt`/unset.

## App code

`app.js` is the shell: hash router (`#/view/param?k=v` → `parseHash`), `routes` map, theme cycling,
search overlay, automatic content sync, `toast()`/`showModal()`. Every view is
`renderView(el, { param, query, snapshot })` from `assets/js/views/<name>.js`, registered in
`routes`. Views build HTML strings, assign `el.innerHTML`, then attach listeners — no virtual DOM,
no reactivity, no re-render except navigation. Adding a view also means a `data-nav="<name>"` button
in `index.html`.

`assets/css/app.css` is versioned by query string in `index.html` (`app.css?v=5`) — bump `v` when a
stale cache would matter.

Shared modules: `store.js` (persistence), `content.js` (fetch/diff/merge), `srs.js` (SM-2-lite),
`search.js`, `md.js`, `levels.js`.

## Gotchas

- `README.md` is user-facing and its item counts drift; `node tools/validate.mjs` prints the truth
  (629 items across 89 registered packs as of manifest 2026.08.17).
- `validate.mjs` has 14 gates and a `--final` flag: several gates (per-track counts, difficulty
  mix, ref-host allowlist, near-duplicates) warn during a staged expansion and error at `--final`.
- `InterviewPrep/` (nested subdirectory of the same name) is an unused Spec Kit scaffold — ignore it
  unless explicitly asked about Spec Kit.
- `.claude/launch.json` defines a `prep-site` launch config running `python3 tools/serve.py` on 8777.