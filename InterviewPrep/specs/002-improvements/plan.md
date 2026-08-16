# Implementation Plan: Improvements

**Branch**: `002-improvements` (tracked via `.specify/feature.json`, not a git branch name — this repo's
Spec Kit fork keys feature state explicitly rather than parsing branch names) | **Date**: 2026-08-14 |
**Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-improvements/spec.md`

## Summary

Nine independent user-facing fixes to the live study site, none of which touch the snapshot/progress split
or reuse/renumber a single item id. Three are app-shell performance/UX fixes (debounced search, segmented
startup, silent auto-sync replacing the Update button and What's New), two are interaction simplifications
(single "Mark complete" action, reveal-gated timers), one is this app's first-ever external network
dependency (a DSA code-execution "Run" button), and three are content-only efforts (plain-English
summaries across ~629 items, a clarify-then-plan restructuring of the system-design track, and a one-line
"Lead" rename). The riskiest piece by far is DSA Run: it's the first time this offline-first site talks to
anything off-origin, and the plan for it (research.md R-007) is bring-your-own-key — the candidate supplies
their own free Judge0 CE credential, so the app never ships or exposes a shared secret on its public
GH-Pages source. User Story 3 (automatic sync) required amending the constitution's Principle III before
this plan could pass its Constitution Check; that amendment is applied as part of this plan (see below),
not deferred to implementation, per the spec's own clarification that it's a prerequisite deliverable.

## Technical Context

**Language/Version**: JavaScript, ES2020 modules, no transpile and no build step (unchanged from
`001-fill-content-gap`). Node.js ≥ 18 for `tools/`. Content authored in Kotlin (`code[]`/`starter`/
`sampleCall` fields) — DSA Run executes it via Judge0 CE's Kotlin 2.1.10 runtime (`language_id: 111`,
confirmed against `https://ce.judge0.com/languages/`, checked 2026-08-14).

**Primary Dependencies**: none added to the build. One new **runtime** dependency, scoped to a single
button: Judge0 CE's public API (`judge0-ce.p.rapidapi.com`), called directly from browser `fetch` with a
candidate-supplied RapidAPI key — no SDK, no npm package, no CDN script (see
[contracts/dsa-run-contract.md](./contracts/dsa-run-contract.md)). Everything else remains browser
platform APIs only.

**Storage**: unchanged three-way split (content on disk → IndexedDB snapshot → localStorage learning
state). Additions: `aip.v1.settings.judge0ApiKey` (new field, candidate-supplied), `aip.v1.mockResults`'
`avgScore` → `completedCount`/`completedPct` (shape change, old rows tolerated read-only). See
[contracts/storage-contract-delta.md](./contracts/storage-contract-delta.md).

**Testing**: `node tools/validate.mjs` (existing gates, plus the new `sampleCall`/`clarifyingQuestions`
required-field checks for `dsa`/`design` items, rolled out batch-gated per research.md R-006),
`node tools/check-refs.mjs`, and the manual browser scenarios in [quickstart.md](./quickstart.md) — no
change to the "no unit-test runner" posture; there still isn't one and none is added.

**Target Platform**: evergreen desktop browsers served over `http://localhost:8777` (dev) / GH Pages
(prod), unchanged. DSA Run additionally requires the candidate's browser to reach
`judge0-ce.p.rapidapi.com` — the one place this site now depends on a specific external host being
reachable, and it's designed to degrade to a clear "needs connection"/"needs setup" state rather than
break anything else when it isn't.

**Project Type**: static single-page site + versioned JSON content packs + Node CLI tooling — unchanged.
No client/server split is introduced; DSA Run is a direct browser-to-third-party-API call, not a backend
this project stands up.

**Performance Goals**: search/filter settles within 300ms of the candidate pausing, not on every keystroke
(SC-001); app shell interactive within 1 second **of first paint** on a cold cache, before all content
packs finish (SC-002) — measured on the reference environment below, with the shell-before-packs ordering
holding unconditionally even where the number doesn't (FR-005b);
automatic sync's version-compare check stays a single cheap manifest fetch, never a full re-fetch when
nothing changed (FR-011).

**Constraints**: everything except the DSA Run button remains fully offline-capable (FR-022) — this is the
one deliberate, scoped exception to the site's offline-first posture, and it's opt-in (no key configured =
no network attempt). Item ids remain permanent — nothing in this feature adds, removes, renumbers, or
reuses an id; all touched items keep their id and gain `updatedIn: <this release>`.

**Scale/Scope**: ~629 existing items get a `shortAnswer` rewrite (US7); ~19+ existing DSA items gain
`sampleCall` (US6, batched); the system-design track's items (framework item + all scenarios) are
restructured with `clarifyingQuestions[]` (US8, batched); five app-shell/interaction changes touch
`search.js`, `topics.js`, `app.js`, `content.js`, `srs.js`, `dsa.js`, `drill.js`, `mock.js`, `item.js`,
`design.js`, `dashboard.js`, `levels.js`, `store.js`, `settings.js`, `index.html`, `app.css`. No new pack
files, no new item ids, one constitution amendment.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Pre-research | Post-design |
|---|---|---|
| **I. Item identifiers are permanent** (non-negotiable) | PASS — no user story adds, removes, or renumbers an item; content changes are field-level edits (`shortAnswer`, `sampleCall`, `clarifyingQuestions`, `framework`) on existing ids, each gaining `updatedIn` | **PASS**, unchanged — confirmed in data-model.md: every content delta is additive/re-scoped fields on existing ids, batch-gated by `validate.mjs` the same as any other content edit |
| **II. Content and learning state are physically separate** | PASS at face value — no user story proposes writing progress from content or vice versa | **PASS** — explicitly checked in data-model.md's design-item migration note: `requirements[]`'s re-scope is a content-field edit, and nothing in Learning State references a position inside an item's own fields (Progress Record and Plan State key everything by item id), so the split holds even as `design` items' internal field content changes |
| **III. A release is offered, never imposed** | **CONFLICT** — US3's silent, buttonless, no-decline auto-apply is a direct textual conflict with this principle as ratified | **PASS via amendment** — `.specify/memory/constitution.md` amended in this plan (v1.0.0 → v1.1.0, dated 2026-08-14) to narrow the principle for the one case where nothing is lost: releases whose only tick-level effect is re-anchoring, never dropping. Every other release shape (one that would drop a tick, or remove item state the candidate can't recover) still requires the original disclose-before-apply behavior, unchanged. This is the explicit, dated amendment the constitution's own Amendment and Review section requires — not a silent exception |
| **IV. Every claim is sourced and dated** | Flagged as needing research — the DSA execution-provider choice makes several external claims (availability, language support, integration pattern) that must be dated and sourced, not asserted | **PASS** — research.md R-007 cites and dates every external claim (Piston's Discord-gated policy since Feb 15 2026, Judge0 CE's Kotlin 2.1.10 support confirmed against `ce.judge0.com/languages/`, the free-RapidAPI-key browser-integration pattern), and is explicit about the one claim it can't source (Judge0's RapidAPI-gateway CORS policy) rather than asserting it — flagged as a first-task smoke test instead |
| **V. No build step, no dependencies** | Flagged as needing research — does adding an external code-execution call count as a "dependency" this principle forbids? | **PASS, with a recorded exception** — see Complexity Tracking below. No npm package, bundler, or CDN script is added; the one new dependency is a runtime HTTP call behind an opt-in button, architecturally identical in kind to `content.js`'s existing `fetch()` of same-origin JSON, just pointed at a candidate-authorized external host instead |
| **Quality Gates** (validator authority, manifest registry, version-bump gating) | PASS — no new pack files, `sync-manifest.mjs` still the only manifest writer, this feature ships under a normal version bump like any other release | **PASS**, unchanged — `validate.mjs` gains two new required-field checks (`sampleCall`, `clarifyingQuestions`), both batch-gated exactly like every existing content-completeness gate |

## Project Structure

### Documentation (this feature)

```text
specs/002-improvements/
├── plan.md                          # This file
├── research.md                      # Phase 0 output
├── data-model.md                    # Phase 1 output
├── quickstart.md                    # Phase 1 output
├── contracts/
│   ├── dsa-run-contract.md          # New external interface: app ↔ Judge0 CE
│   ├── content-schema-delta.md      # sampleCall, clarifyingQuestions — delta vs 001's content-schema.md
│   └── storage-contract-delta.md    # judge0ApiKey, mockResults shape — delta vs 001's storage-contract.md
├── checklists/
│   └── requirements.md              # Spec-quality checklist (pre-existing, already passing)
└── tasks.md                         # Phase 2 output (/speckit-tasks — not created by this command)
```

### Source code (repository root: `/Users/nn/InterviewPrep`, the app — not this Spec Kit scaffold)

This is a single static-site project, unchanged in kind from `001-fill-content-gap` — no client/server
split, no new top-level directory. Concrete files this feature touches:

```text
index.html                    # remove #update-btn markup + data-nav="whatsnew"; add a static loading-shell
                               #   element (visible before any module evaluates)
assets/css/app.css            # remove .update-btn* rules; add loading-shell + single-action rate-btn styles
assets/js/
├── app.js                    # initUpdateButton() removed; new scheduled silent-sync trigger; shell/content
│                              #   boot-phase split in main(); whatsnew route removed from `routes`
├── content.js                 # boot() split into shell-fast + content-phase; pack fetch loop parallelized
│                              #   (Promise.all); checkForUpdates() called on a schedule, not a click
├── search.js                  # debounce wrapper around search()
├── srs.js                     # unchanged signature; callers now always pass a fixed rating (see below)
├── store.js                   # + getSettings/setSettings judge0ApiKey; mockResults shape change;
│                              #   + sessionActive flag plumbing
├── levels.js                  # LEVEL_LABEL[4]: 'Staff/Monster' → 'Lead'
└── views/
    ├── topics.js               # debounced in-place filter re-render; deferred hash sync
    ├── dashboard.js            # shell-phase skeleton: neutral placeholders for every content-derived
    │                            #   count/percentage instead of misleading zeros (FR-005a)
    ├── item.js                 # rate-row → single Mark-complete button
    ├── drill.js                # rate-row → single button; pausedMs/revealedAt timer accumulator;
    │                            #   sessionActive flag on entry/exit
    ├── mock.js                 # rate-row → single button; revealed-gated countdown; avgScore → completed
    │                            #   metric; sessionActive flag on entry/exit
    ├── dsa.js                  # scratchpad textarea → code editor + Run button + Run Result panel
    ├── design.js               # rate-row → single button; two-phase clarify/plan render, gated
    └── whatsnew.js              # deleted
content/packs/*.json           # dsa packs: + sampleCall per item; system-design.json: + clarifyingQuestions,
                               #   requirements[] re-scoped, framework rewritten (sd-0000 + scenarios);
                               #   every pack: shortAnswer rewrite (US7)
tools/validate.mjs             # + gate checks for sampleCall (dsa), clarifyingQuestions (design)
.specify/memory/constitution.md # Principle III amendment (already applied — see Constitution Check)
```

**Structure Decision**: no new project, no new directory shape — every change lands inside the existing
`assets/js/{,views/}`, `content/packs/`, and `tools/` layout `001-fill-content-gap`'s plan already
described. The only structurally new thing is the DSA-Run request path, and it's a `fetch()` call inside
`assets/js/views/dsa.js`, not a new module family.

## Complexity Tracking

> Recorded per the constitution's Amendment and Review section: a justified exception, with the simpler
> alternative rejected and why.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| First external, non-content network dependency (Judge0 CE), scoped to the DSA "Run" button | US6/FR-018-022 explicitly ask for real code execution with real output — no client-side Kotlin compiler/interpreter exists to run this offline, and authoring one is far outside this project's scope (a JVM-class language, not a toy interpreter) | Self-hosting a judge (rejected in research.md R-007 — requires a server process this static-only project has no home for, a Principle V violation of its own); shipping an embedded/shared API key (rejected — a public GH-Pages page's source is world-readable, so any embedded secret is trivially harvested and abused against the developer's own quota); making Run mandatory/blocking (rejected by design — it's opt-in, gated on a candidate-supplied key, and every other view keeps working with zero network calls, satisfying FR-022) |
| Constitution amendment narrowing Principle III | US3's silent, no-decline auto-sync is the literal feature the user asked for, and the spec's clarification session resolved the conflict explicitly rather than leaving it implicit | Keeping a blocking modal/consent step for every sync (rejected — this is precisely the manual-chore UX the user asked to remove, and the spec's clarification explicitly rules it out); scoping the amendment to *all* releases rather than just tick-preserving ones (rejected — would remove the disclosure guarantee even for a release that *drops* state, which nothing in the spec asks for and the constitution's core failure mode exists specifically to prevent) |
