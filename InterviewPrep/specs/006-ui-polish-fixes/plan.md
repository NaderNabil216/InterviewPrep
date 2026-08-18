# Implementation Plan: Study Surface UI Polish

**Branch**: `006-ui-polish-fixes` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-ui-polish-fixes/spec.md`

## Summary

Five independent, presentation-only fixes to the existing vanilla-JS study site: (1) collapse the
theme toggle from a three-state (dark/light/auto) cycle to a strict two-state dark/light switch
whose icon always matches the active state; (2) drop the vertical accent bar from the short-answer
bullet list; (3) split run-on multi-sentence questions/prompts into separate visual lines at render
time, via a new sentence-splitting helper in `md.js`, without touching any content file; (4) remove
the "UPD" badge from the Topics listing while leaving the underlying `updatedIn` signal and the
"NEW" badge untouched; (5) sort each topic-category's item list by `level` ascending (Basics →
Lead) with a stable sort. All five changes live in `assets/js/**` and `assets/css/app.css`; no
content pack, manifest, or item id is touched, and no manifest version bump is required.

## Technical Context

**Language/Version**: Vanilla JavaScript (ES modules, no transpilation/bundling), HTML5, CSS3 —
runs directly in the browser; Node is used only for the repo's own CLI tools, not for this feature.

**Primary Dependencies**: None (constitution Principle V — no npm, no framework, no CDN). Reuses
existing modules only: `assets/js/md.js`, `assets/js/app.js`, `assets/js/store.js`,
`assets/js/levels.js`, and the view modules listed under Structure below.

**Storage**: Browser `localStorage` under the `aip.v1.` prefix (`Store.getSettings().theme` for the
theme preference) — unaffected: the content snapshot in IndexedDB, and the `aip.v1.progress` /
`.session` / `.plan` / `.mockResults` learning-state stores, are untouched by every one of these
five fixes.

**Testing**: No automated test runner or linter in this repo (`node tools/validate.mjs` is the only
integrity gate, and it validates content, not app code). Verification is manual: serve the site
(`bash tools/serve.sh`) and exercise each fix in a browser per `quickstart.md`.

**Target Platform**: Any modern browser, mobile Android Chrome as the primary target, served over
`http://localhost` (never `file://`).

**Project Type**: Single static web app — no frontend/backend split, no build step.

**Performance Goals**: N/A. All five changes are render-time string/array transforms over data
already resident in memory (the in-memory snapshot); none add a network call, a new fetch, or
measurable render cost beyond what the affected views already do per render.

**Constraints**:
- No content pack, `content/manifest.json`, or item id may be edited or renumbered (constitution
  Principle I).
- The sentence-split behavior must be a pure presentation transform applied at render time — it
  must not require editing `q`/`prompt`/`shortAnswer` text in any pack file (FR-008), and it must
  not introduce a fenced code block or otherwise violate `md.js`'s restricted markdown dialect.
- The split heuristic must not break on the concrete false-positive cases named in the spec: a
  code-formatted span (`` `List<out E>.contains` ``), an abbreviation, or a decimal/version number
  (FR-007, Edge Cases).
- Theme preference must collapse to exactly two persisted values (`dark` | `light`); no code path
  may leave `auto` re-enterable as a persisted choice (see `research.md` — this also touches the
  Settings page's theme dropdown, not just the toggle button, to keep the app internally
  consistent with the spec's own Assumption that system-preference is retained *only* as the
  first-visit default).

**Scale/Scope**: ~629 items across 89 registered packs (manifest 2026.08.17, per `CLAUDE.md`); the
five fixes touch a fixed, small set of already-identified files (see Structure below) — no scope
growth expected.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Verdict | Basis |
|---|---|---|
| I. Item Identifiers Are Permanent | **PASS** | No item is added, removed, or renumbered; no pack or manifest file is touched. |
| II. Content and Learning State Are Physically Separate | **PASS** | All five fixes are render-time presentation only. The theme preference lives in `Store.getSettings()`, a UI-settings bucket already distinct from `aip.v1.progress`/`.session`/`.plan`/`.mockResults` and from the IndexedDB content snapshot; nothing here adds a new cross-reference between content and learning state. |
| III. A Release Is Offered, Never Imposed | **PASS** | No content release, sync, or diff behavior is touched. FR-011 explicitly requires the `updatedIn`/`addedIn` signals and the sync/diff logic that reads them to keep working exactly as before — only their **visible badge** for "updated" is removed. |
| IV. Every Claim Is Sourced and Dated | **PASS** | No version/date/platform-behavior claim is added, changed, or removed; nothing here touches `refs` or `stackSnapshot`. |
| V. No Build Step, No Dependencies | **PASS** | Every change is vanilla JS/CSS in existing modules; no dependency, bundler, or CDN is introduced. |

No violations. Complexity Tracking is not needed.

**Post-Phase-1 re-check**: `research.md`, `data-model.md`, and `contracts/ui-behavior.md` introduce
no new persisted entity, no cross-reference between content and learning state, and no content
edit — the theme-preference narrowing (research.md §1) stays inside the existing UI-settings
bucket, and the sentence-splitting helper (research.md §3) is confirmed render-time-only with an
explicit non-mutation invariant (data-model.md, "Sentence unit"). All five verdicts above stand
unchanged after design.

## Project Structure

### Documentation (this feature)

```text
specs/006-ui-polish-fixes/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── ui-behavior.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

This is a flat, no-build static site — there is no `src/`/`tests/` split and none is introduced.
All work happens in the existing app-code tree, one level up from this Spec Kit scaffold, at
`/Users/nn/InterviewPrep`:

```text
assets/js/
├── app.js                # theme toggle: initTheme(), applyTheme() — Story 2 (theme icon fix)
├── md.js                 # new: sentence-splitting helper — Story 1 (question/prompt readability)
├── store.js              # theme default in getSettings() — Story 2
├── levels.js             # LEVEL_LABEL / level ordering — read-only, reused by Story 5's sort
└── views/
    ├── item.js            # item.q + shortAnswer render — Story 1, Story 3
    ├── drill.js            # item.q + shortAnswer render — Story 1, Story 3
    ├── mock.js             # item.q + item.prompt + shortAnswer render — Story 1, Story 3
    ├── design.js           # item.q (h1) + item.prompt render — Story 1
    ├── dsa.js              # item.q (h1) + item.prompt render — Story 1
    ├── topics.js           # item-row render (badge, level sort) — Story 4, Story 5
    └── settings.js         # theme <select> — Story 2 (kept consistent with the toggle)

assets/css/
└── app.css                # .short-answer border-left removal — Story 3; app.css?v= bump in index.html
```

**Structure Decision**: Single flat static-site project (constitution Principle V — no build step).
No new files beyond the Spec Kit docs above; every fix lands in an existing module. `index.html`'s
`app.css?v=N` query string is bumped alongside the CSS edit per `CLAUDE.md`'s cache-busting note.

## Complexity Tracking

*No violations recorded — table intentionally omitted.*
