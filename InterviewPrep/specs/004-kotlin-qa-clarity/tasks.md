# Tasks: Labelled Answer Sections and Plain-Spoken Kotlin Q&A

**Input**: Design documents from `specs/004-kotlin-qa-clarity/` (plan.md, spec.md, research.md,
data-model.md, contracts/, quickstart.md)

**Prerequisites**: plan.md ✔ · spec.md ✔ · research.md ✔ · data-model.md ✔ · contracts/ ✔ · quickstart.md ✔

**Tests**: Not requested as a test suite anywhere in spec.md — this project has no unit-test runner and
none is added (plan.md's Technical Context, Constitution V). Verification is `node tools/validate.mjs`
(content gates) plus the per-delivery scope check (T002) and the manual browser scenarios in
quickstart.md; all are referenced inline below, not as a separate Tests sub-phase.

**Repository root for all app file paths below**: `/Users/nn/InterviewPrep` (the git repo root — the
app, **not** this Spec Kit scaffold directory). Spec Kit scaffold paths (`specs/004-kotlin-qa-clarity/…`)
are tracked in the same repo and called out explicitly where used.

**Organization**: Grouped by user story per spec.md's priorities and the three-delivery plan (FR-022a):
- **US1 (P1)** — Delivery 1: the labels. App code only; no content release, no manifest bump.
- **US2 (P2)** — Delivery 2: the 70 rewritten questions. One content release (`2026.08.18`).
- **US3 (P3)** — Delivery 3: the 70 rewritten answers + traps + follow-ups + captions. A second content
  release (`2026.08.19`). US3 edits the same pack files US2 touched, so it starts only after US2's
  release is cut (FR-022d's bounded interim state).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps to spec.md's user stories (US1–US3)
- File paths are exact and taken from the live repository as of 2026-08-17 (research.md's line refs);
  re-check line numbers if other tasks have already landed and shifted them.

---

## Phase 1: Setup

- [X] T001 Create the feature branch and pin the baselines: in `/Users/nn/InterviewPrep`, create
  `feat/004-kotlin-qa-clarity` off `main` (plan.md Branch line — the branch does not exist yet). Then
  verify the environment: `bash tools/serve.sh` (site **must** be served over `http://localhost:8777` —
  `fetch()` of local JSON is blocked over `file://`), and confirm `node tools/validate.mjs` exits 0
  with `All good (0 warning(s))` (quickstart.md Prerequisites; baseline is 0 errors **and** 0 warnings
  at manifest `2026.08.17`). Record the **FR-021b fixed feature baseline**, which every batch of *both*
  content deliveries compares its read-through against and which MUST NOT change for the feature's
  duration: `git rev-parse HEAD > specs/004-kotlin-qa-clarity/baseline.txt` — this must be the commit
  whose `content/packs/kotlin-*.json` is the documentation-register original, taken *before* the first
  D2 batch. Also capture a validator run to
  `specs/004-kotlin-qa-clarity/verification/validate-baseline.log` — the per-batch "no new warning"
  gate (FR-020a) is a delta against a run recorded *immediately before* each batch, and this is the
  first one. Confirm `node tools/check-refs.mjs` exits clean as an extra sanity read.

**Checkpoint**: Environment verified clean, baselines pinned. No project init or dependency install
exists in this repo (no build step, no npm) — this phase is intentionally thin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The one piece of shared plumbing both content deliveries' batch gates (US2, US3) rely on.
**US1 does NOT depend on this phase** — it is app code and may start immediately after Setup.

- [X] T002 Build the per-batch scope check at `specs/004-kotlin-qa-clarity/verification/scope-check.mjs`,
  adapted from `specs/002-improvements/verification/fielddiff.mjs` (which already diffs every pack
  against `git HEAD` and exits non-zero on a protected-field change, an id change or an unexpected
  field). CLI: `node scope-check.mjs --delivery q <pack-file>` and
  `node scope-check.mjs --delivery answers <pack-file>`. Per data-model.md §5, the allowed/protected
  split is: **D2 (`q`)** — allowed to differ: `q`, `updatedIn`; **D3 (`answers`)** — allowed: `answer`,
  `traps`, `followUps`, `code[].caption`, `updatedIn`, plus `shortAnswer` or `q` **only** with a
  recorded repair note passed as `--repair shortAnswer:<id>:<reason>` / `--repair q:<id>:<reason>`
  (FR-023a, FR-023b); everything else frozen. The one refinement over `fielddiff.mjs`: `code[]` is
  compared **field-wise** (R-010/R-016), so `caption` may move while `src` and `lang` may not. Fails
  the batch on: any id added/removed (FR-019), any frozen field differing, any change to the number of
  `traps[]` or `followUps[]` entries (P12, validator cannot see it), any ` ``` ` appearing in
  `code[].caption` (FR-018 — `caption` is absent from gate 15's `PROSE_FIELDS` list at
  `tools/validate.mjs:195-196`), and any file outside `content/packs/kotlin-*.json` differing.

**Checkpoint**: The scope check exists for both deliveries; US2 and US3 batch gates can now run their
mechanical step 2 (prose-voice-contract §The batch gate).

---

## Phase 3: User Story 1 - Every answer section says what it is (Priority: P1) 🎯 MVP

**Goal**: Every content section of a question-and-answer item is preceded by a visually highlighted
label, on all three surfaces that reveal an item (the question page, the Drill reveal, the Mock
reveal), keyed to the item's **type** — never to the page it renders on (FR-006). DSA problems, design
scenarios and cheat sheets (84 items) gain nothing and lose nothing, on any route (FR-008a, SC-007a).

**Independent Test** (quickstart.md D1-1…D1-9, run as T009): serve the site, hard-refresh, open
`#/item/kt-0004` and confirm seven labels in FR-001's order (`Question` · `The 30-second answer` ·
`The full picture` · `Code` · `They'll ask next` · `What sinks you` · `Sources`), all one treatment;
open a Q&A item with no code sample (89 exist) and confirm no empty labelled section; open the DSA
page, the system-design page and a printed cheat sheet and confirm all three are visually unchanged;
reach a `dsa` item through search (routes it to the question-and-answer page) and confirm it shows no
label and still carries its `Likely follow-ups` and `Sources` headings.

### Implementation for User Story 1

- [X] T003 [US1] Create `assets/js/sections.js` — the single source of the label vocabulary and the
  predicate, modelled on `assets/js/levels.js` (R-001). Export exactly (a) `SECTION_LABEL`, an object
  with these seven keys and strings, in this order — `question: 'Question'`,
  `shortAnswer: 'The 30-second answer'`, `answer: 'The full picture'`, `code: 'Code'`,
  `followUps: "They'll ask next"` (plain ASCII `'`, per the contract's DOM section — the string a view
  emits must equal the string a check asserts), `traps: 'What sinks you'`, `refs: 'Sources'` (FR-001;
  these strings are user-visible copy, changing one later is a content decision, FR-001b) — and
  (b) `isLabelled(item)`, defined as `item?.type === 'qa'` (R-002): total (returns `false` for
  `null`/`undefined`/unknown/absent `type` — FR-006b), type-keyed never page-keyed (no `track`,
  `route`, `view`, `pack` or `param` may appear — FR-006), and the **only** definition in the codebase
  (FR-006c).
- [X] T004 [P] [US1] Add the `.section-label` pill to `assets/css/app.css` plus its `@media print`
  fallback, and retire `.traps-box h4` (line 257 — safe because no unlabelled item carries `traps`,
  R-013). The treatment is exactly the contract's Style section: `display:inline-block; font-size:11px;
  font-weight:800; letter-spacing:.07em; text-transform:uppercase; color:var(--accent-strong);
  background:color-mix(in srgb, var(--accent) 8%, var(--bg-card)); border:1px solid color-mix(in srgb,
  var(--accent) 30%, var(--border)); border-radius:999px; padding:3px 10px; margin:18px 0 8px;` plus
  `.section-label:first-child { margin-top:0; }`. **No per-section variants of any kind** (FR-002 — one
  class, ten identical properties across all seven labels, C14), and **no `white-space:nowrap`** (the
  pill wraps its own text at extreme narrow widths, FR-001a). `@media print`: `background:none;
  border:0; border-bottom:1px solid #000; border-radius:0; color:#000; padding:0 0 1px; margin:12px 0
  5px;` — browsers do not print backgrounds, so the underline is the print distinction (FR-007,
  FR-007a, R-005). R-012's two token choices (`--accent-strong` on an **8%** tint) are load-bearing:
  the originally proposed 14% tint fails light-theme AA (3.06:1); this pair measures 7.77 dark / 4.71
  light (FR-026). The pill must remain visually distinct from `.answer-body h4` (line 247,
  accent-coloured, same `<h4>` tag — FR-002a).
- [X] T005 [US1] `assets/js/views/item.js` — emit the seven labels, every one gated on **both**
  `isLabelled(item)` **and** the section's own content being present and non-empty (FR-003: a missing
  field, an empty list, a list of blank entries, or whitespace-only text all count as absent; no label
  may ever appear over emptiness — FR-003a, and the `answer-body` at line 44 renders unconditionally
  today, so gate the deep-answer label on `answer` non-empty). Emit a label as
  `<h4 class="section-label">…</h4>` — an `<h4>`, never a `<div>` (FR-024, FR-025; matches the two
  headings it replaces), **outside** the section's existing container, never wrapping it (`.short-answer`,
  `.answer-body`, `.code-block`, `.traps-box`, `.refs-box` stay byte-identical in structure). New
  labels: before the question (line 37), before `shortAnswer` (line 39), before the deep answer (line
  44), and before **each** rendered code sample (line 46 — emitted by the caller immediately before
  `renderCodeBlock(block)`, never from inside `md.js`, which is shared with `views/dsa.js:80` and would
  leak the label onto the DSA page, R-003; one label per rendered sample, up to 2). The three headings
  that exist today (lines 48-62) are **conditionally** swapped: labelled item → `<h4
  class="section-label">They'll ask next</h4>` / `<h4 class="section-label">What sinks you</h4>` /
  `<h4 class="section-label">Sources</h4>`; unlabelled item → the existing markup **byte for byte**:
  `<h4 style="margin-top:18px;">Likely follow-ups</h4>`, `<h4>⚠ Traps that get people rejected
  here</h4>`, `<strong>Sources</strong>` (FR-006d, R-013 — the unlabelled branch is what SC-007a and
  contract C10 assert on). No emoji/icon in any label — the traps danger meaning is carried by the
  wording "What sinks you", not by colour (FR-028).
- [X] T006 [P] [US1] `assets/js/views/drill.js` — inside the reveal body (lines 77-81), emit
  `Question`, `The 30-second answer`, `The full picture` and `Code` labels, each gated on
  `isLabelled(item)` **and** the section's content being non-empty, using the same
  `<h4 class="section-label">` markup as T005 (FR-005 — same names wherever a section appears; Drill
  has never shown follow-ups, traps or sources and still must not, so only the four). The code sample
  is `.slice(0, 1)` (line 80) so at most one `Code` label can render; a `qa` item with no `code[]`
  (89 exist) renders none (FR-003). Import `isLabelled`/`SECTION_LABEL` from `../sections.js` — do not
  hardcode a string or a type test (R-001).
- [X] T007 [P] [US1] `assets/js/views/mock.js` — same four labels in the reveal body (lines 141-145),
  with the same gating. The deep answer renders `item.answer || item.referenceAnswer` (line 143): the
  label shown MUST describe the field actually rendered (FR-005a) — today `referenceAnswer` exists only
  on unlabelled `design` items, so `The full picture` can never land above one, but the label must
  track `item.answer`'s presence, not the `||` expression, so a future labelled kind carrying only a
  reference answer cannot get a misdescribing label. The `item.prompt` block (line 140) renders only
  for `design` items (unlabelled) — no label there. Same import and markup conventions as T006.
- [X] T008 [US1] Bump the `app.css?v=6` query string in `index.html` (line 8) to `?v=7` — the labels
  ship as app code with no content release, so the stylesheet cache-bust is the only thing that gets
  the new CSS to devices (FR-029; the ES modules carry no version marker and that is accepted — every
  verification of this delivery must be done after a hard refresh). Must land after T004 (same file's
  CSS).
- [X] T009 [US1] Run the full Delivery 1 walkthrough, quickstart.md **D1-1…D1-9**, in a browser served
  via `bash tools/serve.sh` from `/Users/nn/InterviewPrep`, **after a hard refresh** (FR-029 — cached
  modules render the new stylesheet against old markup until revalidated). Cover: D1-1 (seven pills in
  FR-001's order on `#/item/kt-0004`; all one treatment; distinguishable from the in-answer heading
  "What inlining buys you"); D1-2 (same four strings in `#/drill/kt-0004` reveal and `#/mock/android`);
  D1-3 (a `qa` item with no `code[]` — use the quickstart one-liner to find one — shows no `Code`
  label and no empty block); D1-4 (zero `.section-label` nodes on all six non-Q&A routes: search→dsa,
  search→cheat sheet, Topics→design, drill cheat sheet, mock coding, mock design);
  D1-4a (**C10** — on a `dsa` item via search, the `Likely follow-ups` `<h4>` and the
  `.refs-box strong` `Sources` heading are still present, per the contract's executable snippet); D1-5
  (DSA page, system-design page, cheat-sheets page and one sheet: zero `.section-label`); D1-6 (print
  preview of the item page: labels legible as underlined black text; printed cheat sheet unchanged);
  D1-7 (320px viewport: no label overflows); D1-8 (grep hygiene: `type === 'qa'` matches nothing
  outside `sections.js`, exactly `item.js drill.js mock.js` import `sections.js`, and `md.js`/`dsa.js`/
  `design.js`/`cheatsheets.js` contain no `section-label`/`SECTION_LABEL` — C9); D1-9 (every label is
  an `<h4>` in outline order — C11; **contrast measured on the built page in both themes, recorded** —
  C12, expect ≈7.8 dark / ≈4.7 light with the pill tint present; dark → light → auto theme cycle —
  C13; the ten FR-002 properties identical across all seven labels — C14; traps identifiable with
  colour disregarded). Record the outcome inline under this task.

**Checkpoint**: User Story 1 is fully functional and independently testable (quickstart.md D1). This is
the MVP — it ships value across all 545 Q&A items with zero content changes, and it is where the
feature can stop and demo.

---

## Phase 4: User Story 2 - Kotlin questions sound like a person asking (Priority: P2)

**Goal**: All 70 Kotlin questions read as spoken English an interviewer would actually say, with no
instructional-verb opener (down from 5 today: `kt-0004`, `kt-0005`, `kt-0007`, `kt-0031`, `kt-0048`),
each asking about exactly the same subject and keeping every code-formatted span of the original
(FR-009–FR-012). Ship as one content release, `2026.08.18` (R-007), cut only after all 14 batches pass.

**Independent Test** (quickstart.md D2-1…D2-5): read all seventy questions end to end and confirm each
reads as spoken English with no instructional opener; confirm each still names the same Kotlin subject
and every API name of the original (D2-3); confirm no first-40-char preview collisions (D2-2) and no
new near-duplicate pair (D2-4a); confirm `node tools/validate.mjs` exits 0 and every item identifier
is byte-identical (scope check, D2-3).

**The batch gate** (prose-voice-contract §The batch gate — all four steps, in order, before the batch
is committed; one batch = one pack file). **Step 1 — validator**: capture `node tools/validate.mjs`
output *immediately before* the batch, then after; the batch requires exit 0 **and no new warning**
against the before-run (FR-020a — a new gate-2b warning means an item outgrew its word budget, a new
gate-8 pair means two questions drifted together; diagnose, don't count). **Step 2 — scope check**:
`node specs/004-kotlin-qa-clarity/verification/scope-check.mjs --delivery q content/packs/<pack>.json`
(T002) — must report only `q` and `updatedIn` differing, id set identical. **Step 3 — screens**
(quickstart.md D2-2, D2-4a): the first-40-character preview-collision one-liner (normalised as
`i.q.replace(/[\`*]/g,'').slice(0,40)` — the same normalisation `item.js:76-77` applies, FR-012a) must
report no collision with any other `kotlin` question, and near-duplicates only as exact-prefix alarms
(FR-012b — the standard is that a reader can tell two questions apart); `node tools/validate.mjs
2>&1 | grep -A2 'gate 8'` must report no **new** pair — gate 8 is **library-wide**, so a collision can
be cross-track, and any new pair is adjudicated **in this batch** with a verdict and a reason (FR-020b,
R-015). **Step 4 — the named human read-through** (FR-021, FR-021a): per item, against the **fixed
baseline** (T001's `baseline.txt` — never against `HEAD`, FR-021b), answer (1) *is it still true?* —
claim-by-claim (P1, P2, P3) and (2) *does it sound right?* — reads like FR-013a's target, not like a
syllabus instruction wearing a conversational stem (P8a: "Walk me through…", "Tell me about…", "Can you
explain…" judged by what they ask the candidate to do). If any item fails either question the **batch**
fails and is reworked and re-gated in full (FR-021e). Each batch records, inline under its task below,
as evidence rather than as ticks (FR-021d): pack file, item ids, validator delta with diagnosis, scope
check result, both screens' results and any adjudicated pair, and the read-through outcome (claims
compared, any that needed a decision).

Authoring rules for every rewritten `q` (prose-voice-contract P8–P10): no instructional-verb opener
(floor, not ceiling — FR-010), no softened instruction (FR-010a), same subject + every code-formatted
span verbatim (FR-011), the first ~40 characters still distinguish the question from its track
neighbours — in practice **lead with the subject** (R-009, FR-012).

### Implementation for User Story 2 — 14 per-pack batches

- [X] T010 [US2] **Reference batch (R-011)**: rewrite `q` (and set `updatedIn` to `2026.08.18`) for all
  **8 items** in `content/packs/kotlin-a.json`, per the authoring rules above, then run the full batch
  gate (validator → scope check → screens → read-through). This pack goes **first** in the delivery:
  once accepted it is held alongside FR-013a as the worked reference batch that batches 2–14 are judged
  against (FR-013d) — the exemplar stays normative and wins any conflict (FR-013c). Record the outcome
  and any near-duplicate adjudication inline under this task.
- [X] T011 [US2] **FR-022c named checkpoint — Delivery 2**: before the final D2 batch (T024) is begun,
  compare the projected release date for `2026.08.18` against both freshness windows — gate 10 closes
  **2026-09-06** (oldest Kotlin ref `checked` is 2026-08-07) and gate 11 closes **2026-09-13**
  (`stackSnapshotChecked` is 2026-08-14, R-007). Decide and record: comfortably inside → proceed; in
  either window's final week → finish the delivery now or schedule re-verification work before the
  release; past a window → genuine re-verification (re-reading the primary source and re-dating
  `checked`, or `--stack-checked`) is required and is planned as its own work. The decision is taken
  now, while there is still time to act — never discovered as a blocked release gate.
  **Record (2026-08-17):** today is 8 days before the projected cut of `2026.08.18`; gate 10 closes
  in 20 days, gate 11 in 27 days — comfortably inside both windows → **proceed, no re-verification**.
- [X] T012 [P] [US2] Batch: rewrite `q` + `updatedIn` for all **5 items** in `content/packs/kotlin-b.json`,
  run the full batch gate (steps 1–4 above), record the outcome inline under this task.
- [X] T013 [P] [US2] Batch: rewrite `q` + `updatedIn` for all **5 items** in `content/packs/kotlin-g-1.json`,
  run the full batch gate, record the outcome inline under this task.
- [X] T014 [P] [US2] Batch: rewrite `q` + `updatedIn` for all **5 items** in `content/packs/kotlin-g-2.json`,
  run the full batch gate, record the outcome inline under this task.
- [X] T015 [P] [US2] Batch: rewrite `q` + `updatedIn` for all **5 items** in `content/packs/kotlin-g-3.json`,
  run the full batch gate, record the outcome inline under this task.
- [X] T016 [P] [US2] Batch: rewrite `q` + `updatedIn` for all **5 items** in `content/packs/kotlin-g-4.json`,
  run the full batch gate, record the outcome inline under this task.
- [X] T017 [P] [US2] Batch: rewrite `q` + `updatedIn` for all **5 items** in `content/packs/kotlin-g-5.json`,
  run the full batch gate, record the outcome inline under this task.
- [X] T018 [P] [US2] Batch: rewrite `q` + `updatedIn` for all **5 items** in `content/packs/kotlin-g-6.json`,
  run the full batch gate, record the outcome inline under this task.
- [X] T019 [P] [US2] Batch: rewrite `q` + `updatedIn` for all **5 items** in `content/packs/kotlin-g-7.json`,
  run the full batch gate, record the outcome inline under this task.
- [X] T020 [P] [US2] Batch: rewrite `q` + `updatedIn` for all **5 items** in `content/packs/kotlin-g-8.json`,
  run the full batch gate, record the outcome inline under this task.
- [X] T021 [P] [US2] Batch: rewrite `q` + `updatedIn` for all **5 items** in `content/packs/kotlin-g-9.json`,
  run the full batch gate, record the outcome inline under this task.
- [X] T022 [P] [US2] Batch: rewrite `q` + `updatedIn` for all **5 items** in `content/packs/kotlin-g-10.json`,
  run the full batch gate, record the outcome inline under this task.
- [X] T023 [P] [US2] Batch: rewrite `q` + `updatedIn` for all **5 items** in `content/packs/kotlin-g-11.json`,
  run the full batch gate, record the outcome inline under this task.
- [X] T024 [P] [US2] **Final D2 batch** (do not begin until T011's checkpoint is decided): rewrite `q` +
  `updatedIn` for both **2 items** in `content/packs/kotlin-g-12.json`, run the full batch gate, record
  the outcome inline under this task. After this batch, all 70 questions are rewritten — 0
  instructional openers, down from 5 (D2-1).
- [X] T025 [US2] **Release gate — Delivery 2** (quickstart.md D2 Release gate + D2-5): from
  `/Users/nn/InterviewPrep`, run `node tools/validate.mjs` (0 errors, 0 warnings, whole library),
  `node tools/check-refs.mjs kotlin-` (every ref URL still resolves), then cut the release — the **only**
  writer of `content/manifest.json`:
  `node tools/sync-manifest.mjs --write --release 2026.08.18 --summary "Kotlin questions reworded in
  plain, spoken English (70 items)." --date <YYYY-MM-DD>` with the date **on or before 2026-09-06**
  (R-007 — if the FR-022c checkpoint at T011 decided re-verification was needed, it is done before
  this), then run `node tools/validate.mjs` again — gates 6, 10 and 11 only have something to say once
  the release exists. **No release is cut mid-delivery** (FR-022b): all 14 batches pass before this
  task runs, and a candidate never sees a half-rewritten track. Then D2-5: with the site open, switch
  away and back and expect the sync toast naming the release summary, `UPD` chips on the Kotlin Topics
  rows (`topics.js:59` — expected, both deliveries stamp all 70 items), and a candidate's own ratings,
  due dates, notes and plan ticks intact (FR-023, SC-008). Record the outcome inline.
  **Record (2026-08-17):** `node tools/validate.mjs` clean (0 warnings, whole library);
  `node tools/check-refs.mjs kotlin-` → 60 unique URLs, 60 ok, 0 broken. Release cut via
  `sync-manifest.mjs --write --release 2026.08.18 --summary "Kotlin questions reworded in plain,
  spoken English (70 items)." --date 2026-08-17`; post-cut validator clean, gates 6/10/11 active and
  passing. D2-5 device walkthrough (`verification/d25.mjs`, headless Chrome on `localhost:8777`)
  7/7 PASS: snapshot lands on `2026.08.18` (89 packs); 70 `UPD` chips, all on Kotlin Topics rows;
  sync toast `Content updated — 0 new, 70 changed.` after booting from a store rewound to
  `2026.08.17`; rating (`learning`, due 2026-08-18) and a notes entry on kt-0001 both intact after
  the release. **Out-of-scope finding:** pre-existing bug — `srs.js rate()` throws on a notes-only
  partial progress record (`getItemProgress` returns `{notes}` → `ease/interval` destructure as
  undefined → NaN → `todayISO` throws), so rating an item right after writing notes silently fails;
  reproduced via CDP, not caused by this feature, filed for a follow-up fix. T011 checkpoint
  (2026-08-17): comfortably inside both freshness windows → proceeded, no re-verification.

**Checkpoint**: All 70 questions shipped as release `2026.08.18`. Every Kotlin item now pairs a
rewritten question with an unrewritten answer — the accepted, bounded interim register split
(FR-022d), which ends with Delivery 3.

---

## Phase 5: User Story 3 - Kotlin answers sound like a person explaining (Priority: P3)

**Goal**: All 70 deep answers, 140 traps, 210 follow-ups and 70 code captions rewritten in the
FR-013a exemplar's register — short sentences, point first, direct address — with every technical
claim, version number, API name and caveat preserved (FR-013–FR-018). Ship as the second content
release, `2026.08.19` (R-007). This is the largest authoring effort in the feature and the highest-risk
for silently losing a fact, which is why it lands last and in reviewed batches.

**Independent Test** (quickstart.md D3-1…D3-6): read a rewritten pack's answers against the
pre-rewrite baseline side by side and confirm every technical claim survives (P1, P2, P3); hold each
against the FR-013a exemplar and confirm it reads like the target version, not the middle one
(FR-013a); every answer lands in **120–250 words** (D3-1) and within **±15% of its baseline word
count** or carries a recorded reason (D3-1a); traps/follow-ups entry counts unchanged (D3-1b); no
fenced block in any prose field including captions (D3-2); `code[].src`/`code[].lang` byte-identical
(D3-3); each retained ref still supports a claim the rewritten text actually makes (D3-5); the item
reads as one writer (D3-6); `node tools/validate.mjs` exits 0 per batch.

**The batch gate** — steps 1, 2 and 4 of Phase 4's gate apply unchanged, with the wider allowed-field
set for the scope check: `node specs/004-kotlin-qa-clarity/verification/scope-check.mjs --delivery
answers content/packs/<pack>.json` (T002 — allowed: `answer`, `traps`, `followUps`, `code[].caption`,
`updatedIn`, plus `shortAnswer`/`q` **only** with a recorded repair note; frozen: `id`, `code[].src`,
`code[].lang`, `refs`, `level`, `topic`, `track`, `tags`, `addedIn`, `type`, and the **count** of
`traps[]`/`followUps[]` entries). Step 3 (screens) is D2-only. Then the per-batch mechanical checks of
quickstart.md D3-1 (word band one-liner), D3-1a (**length envelope against the baseline** — the band
alone cannot see an answer fall from 250 to 130 words, since its floor sits 42 words below the track's
actual minimum; anything outside ±15% is **not** automatically rejected but is re-checked claim-by-claim
and the movement recorded with a reason), D3-1b (entry counts), D3-2 (no ` ``` ` in any
`code[].caption` — the validator's gate 15 does not cover `caption`, which is the single mechanical
check this feature must add rather than inherit), D3-3 (code untouched — proven by the scope check).
Then step 4, the named read-through, per item against the **fixed baseline** (T001), now answering
three things: (1) *is it still true?* — claim-by-claim (P1, P2, P3), where a claim is FR-021c's
generous unit (a version, an API name, a behavioural statement, a limitation, a caveat, a causal link,
a recommendation; each counts separately); (2) *does it sound right?* — reads like the exemplar's
target, judged against FR-013a **and** the accepted D3 reference batch (T026, FR-013d); and (3) the
**P5 source mapping** — for each retained ref, name the claim in the *rewritten* text it supports, in
both directions (a confident spoken rewrite can *create* a claim that needs a source — FR-017a). Any
repair under FR-023a (a short answer left contradicting or no longer describing its rewritten answer —
register difference alone is never a mismatch) or FR-023b (a rewritten answer revealing its D2
question asks the wrong thing) is made in the batch that found it, held to the owning delivery's
standards, and recorded with its reason. Batch failures are whole-batch failures reworked and re-gated
in full (FR-021e); the only advisory is a recorded P7b word-band exception (FR-014b: rebalance within
the rewrite first — the words freed by dropping formal connectives are the budget that pays for short
sentences — and if it will not balance, **FR-014 wins** and the item is recorded, because a claim is
never deleted to hit a word count).

Authoring rules (prose-voice-contract P1–P7, P11–P14): voice only, nothing deleted, nothing relocated
between fields (FR-014 — Q2 decision); paragraph-level order of ideas preserved (P3 — recasting a
sentence is the register change; moving a paragraph is a re-plan); markdown structure — headings,
tables, lists — preserved as-is, register applies to the prose inside them (P13); Kotlin API
vocabulary kept verbatim (`crossinline`, `value class`, `@UnsafeVariance` — the interviewer's words,
P4); traps, follow-ups and captions rewritten in the same voice with claim preservation and the length
envelope in proportion (P11, P14); the **number** of traps and follow-ups never changes (P12). The
practical word-budget constraint (R-006): Kotlin answers run 162–250 words against a band ceiling of
exactly 250 — zero headroom — so the register change must be *traded, not added*: the longest items
may not grow at all and the median has roughly +8% to spend.

### Implementation for User Story 3 — 14 per-pack batches

- [ ] T026 [US3] **Reference batch (R-011)**: rewrite `answer`, `traps[]`, `followUps[]` and
  `code[].caption` (and set `updatedIn` to `2026.08.19`) for all **8 items** in
  `content/packs/kotlin-a.json`, then run the full D3 batch gate (validator → scope check → D3-1…
  D3-3 → read-through). This pack goes **first** in the delivery: once accepted it is the worked
  reference batch for the remaining 13 (FR-013d). Record the outcome, the source-to-claim mapping and
  any repairs inline under this task.
- [ ] T027 [US3] **FR-022c named checkpoint — Delivery 3**: before the final D3 batch (T040) is begun,
  repeat T011's comparison for the projected `2026.08.19` release date against the same two windows
  (≤ **2026-09-06** gate 10, ≤ **2026-09-13** gate 11), decide and record. If T011's decision for
  Delivery 2 was "re-verify", that work may already be done — this checkpoint still re-checks the
  projection.
- [ ] T028 [P] [US3] Batch: rewrite `answer`/`traps`/`followUps`/`code[].caption` + `updatedIn` for all
  **5 items** in `content/packs/kotlin-b.json`, run the full D3 batch gate, record the outcome inline
  under this task.
- [ ] T029 [P] [US3] Batch: rewrite the four owned fields + `updatedIn` for all **5 items** in
  `content/packs/kotlin-g-1.json`, run the full D3 batch gate, record the outcome inline under this
  task.
- [ ] T030 [P] [US3] Batch: rewrite the four owned fields + `updatedIn` for all **5 items** in
  `content/packs/kotlin-g-2.json`, run the full D3 batch gate, record the outcome inline under this
  task.
- [ ] T031 [P] [US3] Batch: rewrite the four owned fields + `updatedIn` for all **5 items** in
  `content/packs/kotlin-g-3.json`, run the full D3 batch gate, record the outcome inline under this
  task.
- [ ] T032 [P] [US3] Batch: rewrite the four owned fields + `updatedIn` for all **5 items** in
  `content/packs/kotlin-g-4.json`, run the full D3 batch gate, record the outcome inline under this
  task.
- [ ] T033 [P] [US3] Batch: rewrite the four owned fields + `updatedIn` for all **5 items** in
  `content/packs/kotlin-g-5.json`, run the full D3 batch gate, record the outcome inline under this
  task.
- [ ] T034 [P] [US3] Batch: rewrite the four owned fields + `updatedIn` for all **5 items** in
  `content/packs/kotlin-g-6.json`, run the full D3 batch gate, record the outcome inline under this
  task.
- [ ] T035 [P] [US3] Batch: rewrite the four owned fields + `updatedIn` for all **5 items** in
  `content/packs/kotlin-g-7.json`, run the full D3 batch gate, record the outcome inline under this
  task.
- [ ] T036 [P] [US3] Batch: rewrite the four owned fields + `updatedIn` for all **5 items** in
  `content/packs/kotlin-g-8.json`, run the full D3 batch gate, record the outcome inline under this
  task.
- [ ] T037 [P] [US3] Batch: rewrite the four owned fields + `updatedIn` for all **5 items** in
  `content/packs/kotlin-g-9.json`, run the full D3 batch gate, record the outcome inline under this
  task.
- [ ] T038 [P] [US3] Batch: rewrite the four owned fields + `updatedIn` for all **5 items** in
  `content/packs/kotlin-g-10.json`, run the full D3 batch gate, record the outcome inline under this
  task.
- [ ] T039 [P] [US3] Batch: rewrite the four owned fields + `updatedIn` for all **5 items** in
  `content/packs/kotlin-g-11.json`, run the full D3 batch gate, record the outcome inline under this
  task.
- [ ] T040 [P] [US3] **Final D3 batch** (do not begin until T027's checkpoint is decided): rewrite the
  four owned fields + `updatedIn` for both **2 items** in `content/packs/kotlin-g-12.json`, run the
  full D3 batch gate, record the outcome inline under this task.
- [ ] T041 [US3] **Release gate — Delivery 3** (quickstart.md D3 Release gate): as T025, with
  `--release 2026.08.19 --summary "Kotlin answers, traps and follow-ups reworded in plain, spoken
  English (70 items)." --date <YYYY-MM-DD>` (≤ **2026-09-06**; the FR-022c decision at T027 governs),
  then validate again (gates 6, 10, 11) and confirm the device-side outcome: sync toast, `UPD` chips,
  progress intact (FR-023, SC-008). This release **must** follow Delivery 2 without an intervening
  feature — the interim register split ends here (FR-022d). Record the outcome inline under this task.

**Checkpoint**: All 70 items fully rewritten — the register split this feature exists to close is
closed. Both content releases shipped; no candidate saw a half-rewritten track at any point.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T042 Run the final acceptance gate (quickstart.md Final acceptance): from `/Users/nn/InterviewPrep`,
  `node tools/validate.mjs --final` must exit 0 — this promotes the staged gates, including the gate 2b
  in-band summary (≥ 90% with all 70 Kotlin answers in the 120–250 band; baseline was 100%) and gate 8
  (0 unadjudicated near-duplicate pairs). Then confirm the whole-feature table: the 70 Kotlin ids are
  byte-identical to pre-feature (SC-006); 0 instructional openers (SC-002); zero `.section-label` on
  the 84 non-Q&A items on every route, and `Sources` on 84/84 with `Likely follow-ups` on 60/60 `dsa`
  still present (SC-007a, C10); 7/7 labels render as `<h4>` in FR-001's order (SC-009, C11); label
  contrast ≥ 4.5:1 in both themes (C12); every answer within ±15% of its baseline or flagged with a
  recorded reason (SC-001a); `traps` 2/2 and `followUps` 3/3 on all 70 (P12); 0 fenced blocks in
  captions (FR-018); both release dates decided at the FR-022c checkpoints, not at the gate; progress
  intact after both releases (SC-008); `releases[]` has two new entries strictly descending
  numerically (gate 6). Record the outcome inline.
- [ ] T043 Close the feature record in this `tasks.md`: consolidate the 28 batch outcomes (T010-T024,
  T026-T040), the two release-gate records (T025, T041), the D1 walkthrough record (T009) and the final
  acceptance (T042) into a coherent completion record; re-run T009's D1-8 grep hygiene checks against
  the final tree (the predicate still lives in exactly one place — C9); and record the FR-001b /
  FR-030 consequence explicitly: the seven label strings shipped as app code with **no release entry,
  no sync notice and no rollback other than shipping a fix**, so any later change to one of them is a
  content decision that must be recorded in the feature record that makes it, because the release notes
  cannot carry it.

---

## Requirement → Task Coverage

Every functional requirement in spec.md, and the task(s) that discharge it. Maintained so coverage is
checkable at a glance rather than by diffing spec.md against this file by hand. **If you add an FR to
spec.md, add its row here in the same edit.**

| FR | Task(s) | | FR | Task(s) |
|---|---|---|---|---|
| FR-001 | T003, T005, T006, T007 | | FR-016 | T026-T040 (scope check) |
| FR-001a | T004, T009 (D1-7) | | FR-017 | T026-T040 (read-through) |
| FR-001b | T003, T043 | | FR-017a | T026-T040 (read-through) |
| FR-002 | T004, T009 (D1-9/C14) | | FR-018 | T002, T026-T040 |
| FR-002a | T004 | | FR-019 | T001, T002, T010-T040 |
| FR-003 | T005, T006, T007 | | FR-020 | T010-T040 (batch gate) |
| FR-003a | T005 | | FR-020a | T001, T010-T040 (step 1) |
| FR-004 | T003, T005 | | FR-020b | T010-T024 (screens), T042 |
| FR-005 | T005, T006, T007 | | FR-021 | T010-T040 (step 4) |
| FR-005a | T007 | | FR-021a | T010-T040 (step 4) |
| FR-006 | T003 | | FR-021b | T001 |
| FR-006a | T003, T009 (D1-4) | | FR-021c | T026-T040 (read-through) |
| FR-006b | T003 | | FR-021d | T010-T040 (batch record) |
| FR-006c | T003, T043 (C9) | | FR-021e | T010-T040 (step 4) |
| FR-006d | T005, T009 (D1-4a) | | FR-021f | T010-T040 (step 4) |
| FR-007 | T004, T009 (D1-6) | | FR-022 | T025, T041 |
| FR-007a | T004 | | FR-022a | T009, T025, T041 |
| FR-008 | T005 | | FR-022b | T025, T041 |
| FR-008a | T005, T006, T007, T009 (D1-5) | | FR-022c | T011, T027 |
| FR-009 | T010-T024 | | FR-022d | T025, T041 |
| FR-010 | T010-T024 | | FR-023 | T002 (scope check), T025, T041 |
| FR-010a | T010-T024 (read-through) | | FR-023a | T026-T040 (repairs) |
| FR-011 | T010-T024 | | FR-023b | T026-T040 (repairs) |
| FR-012 | T010-T024 (screens) | | FR-024 | T003, T005-T007, T009 (D1-9) |
| FR-012a | T010-T024 (screens) | | FR-025 | T003, T005 |
| FR-012b | T010-T024 (screens) | | FR-026 | T004, T009 (D1-9/C12) |
| FR-013 | T026-T040 | | FR-027 | T004, T009 (D1-9/C13) |
| FR-013a | T026-T040 (read-through) | | FR-028 | T003, T004, T009 (D1-9) |
| FR-013b | T026-T040 | | FR-029 | T008, T009 (hard refresh) |
| FR-013c | T026-T040 | | FR-030 | T009, T043 |
| FR-013d | T010, T026 | | | |
| FR-014 | T026-T040 | | **SC-001** | T009 (D1-1) |
| FR-014a | T026-T040 (D3-1a) | | **SC-001a** | T026-T040, T042 |
| FR-014b | T026-T040 (P7b) | | **SC-002** | T010-T024, T042 |
| FR-015 | T026-T040 | | **SC-003** | T026-T040 |
| | | | **SC-004** | T026-T040 (read-through) |
| | | | **SC-005** | T026-T040 (read-through) |
| | | | **SC-006** | T001, T002, T010-T040, T042 |
| | | | **SC-007** | T009 |
| | | | **SC-007a** | T009 (D1-4, D1-4a, D1-5), T042 |
| | | | **SC-008** | T025, T041 |
| | | | **SC-009** | T009 (D1-9), T042 |
| | | | **SC-010** | T010-T024, T042 |

## Cross-Story File Overlap

Which files more than one story writes to, and the resulting ordering constraint. Surfaced here rather
than left to be discovered by reading plan.md's file list — every row is a potential same-file conflict
if two stories are worked concurrently.

| File | Stories (tasks) | Constraint |
|---|---|---|
| `assets/js/sections.js` | US1 only (T003) | New file; the views' labels depend on it existing. |
| `assets/js/views/item.js`, `drill.js`, `mock.js` | US1 only (T005, T006, T007) | Different files, all after T003; no other story touches them. |
| `assets/css/app.css` | US1 (T004) | Single CSS-touching task; `index.html`'s cache-bust bump (T008) must land after it. |
| `content/packs/kotlin-*.json` (14 files) | US2 (T010-T024), US3 (T026-T040) | **Same files, sequential deliveries.** D3's scope check diffs against `git HEAD`, so a D3 batch for a pack requires D2's batch for that pack to be committed; the feature-wide rule is US2 fully (through T025's release) before US3 begins. Within each delivery the 14 packs are disjoint files and fully parallel. |
| `content/manifest.json` | US2 (T025), US3 (T041) | Written only by `tools/sync-manifest.mjs`; `.19` must follow `.18`. |

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start immediately.
- **Foundational (Phase 2)**: depends on Setup. **Blocks only US2 and US3** (T002 gates their batches);
  US1 may start in parallel with it.
- **User Stories (Phases 3-5)**: US1 (P1) first; US2 (P2) after Foundational; US3 (P3) after US2's
  release (T025) — same pack files, sequential deliveries, FR-022d.
- **Polish (Phase 6)**: depends on all three stories being complete.

### User Story Dependencies

- **US1 (P1)**: independent of Foundational. Internal order: T003 (sections.js) → T005/T006/T007
  (views, parallel); T004 (CSS) is independent of T003 and may run alongside it; T008 after T004;
  T009 (walkthrough) last.
- **US2 (P2)**: depends on T001 (baseline.txt — every read-through compares against it) and T002
  (scope check). Internal order: T010 (kotlin-a reference batch) first — batches T012-T024 are judged
  against it; T011 (FR-022c checkpoint) before T024 begins; T025 (release) after all 14 batches.
- **US3 (P3)**: depends on US2's T025 (release cut — same pack files, and D3's scope check compares
  against `git HEAD`). Internal order mirrors US2: T026 first, T027 before T040, T041 last.

### Within Each User Story

- The batch gate's steps are strictly ordered per batch: validator (before/after) → scope check →
  screens (D2 only) → the named read-through → commit + record. A batch is the unit of acceptance;
  there are no per-item exceptions (FR-021e).
- US1: module before views; CSS cache-bust bump last; walkthrough last.

### Parallel Opportunities

- US1's T004/T005/T006/T007 are four different files (plus T003's new module) — the four may run
  together once T003 exists; T004 needs no one.
- US2's thirteen non-reference batches (T012-T024) touch thirteen different pack files — fully
  parallel with each other once T010 has fixed the standard (R-011) and T011's checkpoint is decided.
- US3's thirteen non-reference batches (T028-T040) — same, once T026 has fixed the standard.
- The two deliveries are **not** parallel: they edit the same pack files and their scope checks diff
  against `git HEAD`.

---

## Parallel Example: User Story 1 (labels)

```bash
# After T003 (sections.js) exists, launch the four independent files together:
Task: "Add the .section-label pill + print fallback to assets/css/app.css (T004)"
Task: "Label all seven sections in assets/js/views/item.js (T005)"
Task: "Label the four sections in assets/js/views/drill.js (T006)"
Task: "Label the four sections in assets/js/views/mock.js (T007)"
```

## Parallel Example: User Story 2 (the largest parallel batch)

```bash
# After T010 (kotlin-a, the reference batch) is accepted and T011's checkpoint is decided,
# launch every remaining D2 pack together — 13 disjoint files, no ordering:
Task: "Rewrite q in content/packs/kotlin-b.json, run the batch gate (T012)"
Task: "Rewrite q in content/packs/kotlin-g-1.json, run the batch gate (T013)"
Task: "Rewrite q in content/packs/kotlin-g-2.json, run the batch gate (T014)"
Task: "Rewrite q in content/packs/kotlin-g-3.json, run the batch gate (T015)"
Task: "Rewrite q in content/packs/kotlin-g-4.json, run the batch gate (T016)"
Task: "Rewrite q in content/packs/kotlin-g-5.json, run the batch gate (T017)"
Task: "Rewrite q in content/packs/kotlin-g-6.json, run the batch gate (T018)"
Task: "Rewrite q in content/packs/kotlin-g-7.json, run the batch gate (T019)"
Task: "Rewrite q in content/packs/kotlin-g-8.json, run the batch gate (T020)"
Task: "Rewrite q in content/packs/kotlin-g-9.json, run the batch gate (T021)"
Task: "Rewrite q in content/packs/kotlin-g-10.json, run the batch gate (T022)"
Task: "Rewrite q in content/packs/kotlin-g-11.json, run the batch gate (T023)"
Task: "Rewrite q in content/packs/kotlin-g-12.json, run the batch gate (T024)"
# Only T024 must wait for T011; the rest are independent of each other.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) — branch, baseline, validator clean.
2. Complete Phase 2 (Foundational) — T002 is only needed by the content deliveries, so it can even
   wait; US1 is the MVP and needs none of it.
3. Complete Phase 3 (US1) — labels on 545 items, three surfaces, zero content changes.
4. **STOP and VALIDATE**: run quickstart.md D1-1…D1-9. This alone delivers the visible half of the
   request — a candidate can now tell where the sayable answer ends and the background reading begins.
5. US1 needs no manifest bump and no release — it is on the page with the next load (FR-029, FR-030).

### Incremental Delivery

1. Setup + US1 → labels live (Delivery 1). No release entry; ships as app code.
2. US2's 14 batches, gated one by one → **one** release `2026.08.18` (Delivery 2, FR-022b).
3. US3's 14 batches, gated one by one → **one** release `2026.08.19` (Delivery 3) — completes the
   feature; the interim question/answer register split ends here (FR-022d).
4. Polish: `--final` acceptance + completion record.

### Parallel Team Strategy

With multiple contributors:

- One contributor: US1 (all app code, ~90 lines of JS + ~20 lines of CSS — small and self-contained).
- One contributor: build T002's scope check (needed before US2/US3 batches).
- One contributor per US2 pack batch once the reference batch (T010) is accepted — 13-way parallel.
- After US2's release (T025): the same 13-way parallel for US3.
- The D1 walkthrough (T009) can be performed by anyone while US2 batches are in flight — it verifies
  US1 only.

---

## Notes

- [P] tasks touch different files with no incomplete-task dependency between them.
- [Story] labels map every task back to its spec.md user story for traceability.
- No task in this feature adds, removes, renumbers or reuses an item id — content tasks only ever set
  `updatedIn` (never `addedIn`), per this repo's one non-negotiable invariant (Constitution I, FR-019).
- The seven label strings are **user-visible copy shipped with no release entry** (FR-001b, FR-030):
  a later change to one reaches candidates with no notice of any kind and no rollback other than a
  fix, and must be recorded in the feature record that makes it (T043).
- The baseline in `specs/004-kotlin-qa-clarity/baseline.txt` (T001) is the reference for P1, P3, P7a
  and P9 of **both** deliveries — never compare a rewrite against `HEAD` once D2's questions have
  changed, or you measure one delivery against the other (FR-021b).
- The validator's exit code never certifies a batch (FR-021). Steps 1–3 exist to make step 4 — the
  named human read-through — affordable; the read-through is where SC-004 and SC-005 are actually
  discharged, and its record must name what was compared, not merely that a comparison happened
  (FR-021d).
- Re-verification (if a release date slips past 2026-09-06 / 2026-09-13) means re-reading the primary
  source and re-dating `checked` on that basis. Re-stamping a date to satisfy a gate without re-reading
  the source is a Principle IV violation wearing a gate fix as a disguise — it is never the answer
  (R-007, prose-voice-contract Release gate).
- Stop at any Checkpoint to validate a delivery independently before moving on — every phase above is
  designed to be shippable on its own: D1 ships as app code, D2 and D3 ship as one release each.