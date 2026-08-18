# Tasks: Very Simple English for Questions and Short Answers

**Input**: Design documents from `specs/005-plain-english-qa/` (plan.md, spec.md, research.md,
data-model.md, contracts/, quickstart.md)

**Prerequisites**: plan.md ✔ · spec.md ✔ · research.md ✔ · data-model.md ✔ · contracts/ ✔ · quickstart.md ✔

**Tests**: Not requested as a test suite anywhere in spec.md — this project has no unit-test runner and
none is added (plan.md's Technical Context, Constitution V). Verification is the mandatory **batch
gate** (validator + scope check + two screens + the named human read-through, per batch) and the
**release gate** (per track), both defined inline below and in `contracts/batch-gate.md`; the manual
browser checks live in quickstart.md. The batch gate runs on every content task and is the only
certification a batch gets (FR-020).

**Repository root for all app file paths below**: `/Users/nn/InterviewPrep` (the git repo root — the
app, **not** this Spec Kit scaffold directory). Spec Kit scaffold paths (`specs/005-plain-english-qa/…`)
are tracked in the same repo and called out explicitly where used.

**Organization**: Grouped by user story per spec.md's priorities, with one structural fusion mandated by
the plan (R-002): a batch rewrites **both** owned fields (`q` and `shortAnswer`) of every item in one
pack in a single pass — "splitting them would double the gates and the record-keeping without buying
anything". So the two P1 stories (US1 questions, US2 short answers) are delivered together, track by
track, and every qa pack batch carries **both** `[US1]` and `[US2]` labels; the P2 story (US3, the 84
non-qa items) carries `[US3]` alone.

- **US1 (P1)** — questions, full VSE register, all 545 qa items.
- **US2 (P1)** — short answers, full VSE register, all 1635 qa bullets (3 per item, count frozen).
- **US3 (P2)** — the plain-words half of the register on the 84 dsa/design/concept items, form preserved,
  with a per-item verdict.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps to spec.md's user stories (US1–US3); qa batch tasks carry both `[US1]` and `[US2]`
  because one batch delivers both fields of its pack
- File paths are exact and taken from the live repository as of 2026-08-18 (research.md's census,
  re-verified: 89 packs, 629 items, every `shortAnswer` exactly 3 bullets). Item id ranges per pack are
  listed in each task; re-check if other tasks have already landed and shifted them.

---

## Phase 1: Setup

- [X] T001 Create the feature branch and pin the baselines: in `/Users/nn/InterviewPrep`, create `feat/005-plain-english-qa` off `main` (plan.md Branch line — the branch does not exist yet; 004's deliveries are merged on `main` at `fef2e12`, manifest `2026.08.19` — R-001's precondition holds). Verify the environment: `bash tools/serve.sh` (site **must** be served over `http://localhost:8777` — `fetch()` of local JSON is blocked over `file://`), and confirm `node tools/validate.mjs` exits 0 with `All good (0 warning(s))` (quickstart.md Prerequisites; baseline is 0 errors **and** 0 warnings at manifest `2026.08.19`). Then record the **fixed feature baseline** (R-001, FR-021) — the revision every batch's read-through compares against for the feature's whole duration, which MUST NOT change: write `git rev-parse HEAD` inline under **this task** (quickstart.md: "write the hash into the first task record"; 004 recorded it in `baseline.txt`, 005 records it here). Capture the first "immediately-before" validator run to `specs/005-plain-english-qa/verification/validate-baseline.log` — the per-batch "no new warning" gate (FR-019a) is a delta against a run recorded immediately before each batch, and this is the first one. Confirm `node tools/check-refs.mjs` exits clean as an extra sanity read.

    **Record (2026-08-18)**: `git switch -c feat/005-plain-english-qa main` — branch created off `main`. **Fixed feature baseline: `fef2e12a0284f8b916f3eaffa7e55a474e69dd62`** (manifest `2026.08.19`); every batch read-through below compares against this hash, never `HEAD` (R-001). Environment: `bash tools/serve.sh` serves HTTP 200 on `http://localhost:8777` (python3 tools/serve.py, port verified). `node tools/validate.mjs` exits 0 — `All good (0 warning(s))`, 629 items across 89 pack files at baseline. First immediately-before validator run captured to `verification/validate-baseline.log` (identical to the after-baseline diff — the FR-019a reference for batch 1). `node tools/check-refs.mjs` (full, all packs): 496 unique URLs probed, run completed clean (no 4xx failures) — logged at `/tmp/checkrefs-full.log` during this task.

**Checkpoint**: Environment verified clean, baseline pinned in this file. No project init or dependency
install exists in this repo (no build step, no npm) — this phase is intentionally thin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The two things every batch of all three stories depends on — the mechanical half of the
batch gate (the scope-check script) and the standard-fixing reference batch (FR-026). **Nothing in
Phases 3–4 begins before this phase is complete.**

- [X] T002 Build the per-batch scope check at `specs/005-plain-english-qa/verification/scope-check.mjs`, adapted from `specs/004-kotlin-qa-clarity/verification/scope-check.mjs` (which was itself adapted from `specs/002-improvements/verification/fielddiff.mjs` — R-009, the third generation of the pattern). CLI: `node specs/005-plain-english-qa/verification/scope-check.mjs content/packs/<pack>.json`, run from `/Users/nn/InterviewPrep`. Per data-model.md §5, the allowed/protected split is: **allowed to differ** — `q`, `shortAnswer`, `updatedIn` (entries of `shortAnswer` may move, but **array length must stay exactly 3** — FR-015, FR-018); **must be identical** — `id` (the pack's id set, same count and values — Constitution I), `answer`, `traps`, `followUps`, `code`, `refs`, `level`, `topic`, `track`, `tags`, `addedIn`, `type`, and on non-qa items also `prompt`, `hints`, `sampleCall`, `referenceAnswer`, `framework`, `summary`, `label`, `description`. Fails the batch on: any id added/removed, any frozen field differing, any bullet-count change, any ` ``` ` appearing in `q` or `shortAnswer` (gate 15 covers both fields — inherited, not re-implemented), and any file outside the batch's pack(s) differing since the previous commit. The reference batch (T003) spans several files: the check runs once per touched file.

    **Record (2026-08-18)**: `verification/scope-check.mjs` written — third generation of the 002/004 pattern. CLI as specified; `--batch <f1,f2,…>` lists a multi-file batch's pack set (the T003 case — run once per touched file, and only files outside the batch's set fail the "nothing else changed" check). ALLOWED = `q`, `shortAnswer`, `updatedIn`; everything else frozen (non-qa fields `prompt`/`hints`/`sampleCall`/`referenceAnswer`/`framework`/`summary`/`label`/`description` listed explicitly). Fails on: id add/remove, any field outside ALLOWED differing, `shortAnswer` length ≠ 3, fenced block (` ``` `) in `q`/`shortAnswer`, and any `content/packs` file outside the batch set differing from `git HEAD`. Verified live on all 10 reference-batch files (T003 record below): 0 failures each.

- [X] T003 **Reference batch (R-003, FR-026)** — the first content commit of the feature, authored and accepted **before any per-pack batch**: rewrite `q` + all 3 `shortAnswer` bullets in **Very Simple English** for 10 cross-track items chosen to span the register's hardest shapes (prose only — no `updatedIn` this commit; stamps happen at release time, data-model.md §3), **qa items first, non-qa last**, one commit, scope check per touched file, then the full batch gate (steps 1–4 below). The 10 items and their packs, per R-003: | Shape stress | Item | Pack | |---|---|---| | Scenario-length question (215 chars, must come down hard) | `ar-0001` | `content/packs/architecture.json` | | Two-part question (interceptors + token refresh) | `dn-0001` | `content/packs/data-networking.json` | | Two-part question (launch modes + when they matter) | `pf-0007` | `content/packs/platform-b.json` | | Code-span-heavy question (004's register, simpler still) | `kt-0001` | `content/packs/kotlin-a.json` | | Version-claim bullet (FR-014 binds both ways: AGP 9.3, Jul 2026) | `bt-0001` | `content/packs/build-testing.json` | | Qualifier-heavy bullet near the 25-word bound (TEE/StrongBox) | `sk-0001` | `content/packs/security-kmp.json` | | Behavioral scenario (direct address in the second person) | `bh-0001` | `content/packs/behavioral.json` | | Non-qa: DSA task prompt (task form must survive) | `ds-0001` | `content/packs/dsa.json` | | Non-qa: design scenario (scenario form) | `sd-0000` | `content/packs/system-design.json` | | Non-qa: cheat-sheet description (reference form) | `cs-0001` | `content/packs/cheatsheets.json` | Once accepted, this batch is held alongside the exemplars as the **secondary authority** later batches are judged against (FR-026); the exemplars win any conflict (FR-002). Record the outcome, the read-through evidence, any recorded exception and any near-duplicate adjudication inline under this task.

    **Record (2026-08-18)** — batch gate steps 1–4, in order, against baseline `fef2e12a0284f8b916f3eaffa7e55a474e69dd62`:
    - **1. Validator**: before-run = `verification/validate-baseline.log` (`All good (0 warning(s))`, captured immediately before authoring). After-run identical — `diff` of the two logs (hosts line excluded) shows **0 new warnings**, exit 0. Gate 8 unchanged: no new near-duplicate pair, nothing to adjudicate.
    - **2. Scope check**: run once per touched file (10 files, `--batch` = the full set). 0 failures on every file; allowed diffs only — `q` ×7 (7 rewritten questions), `shortAnswer` ×9 (9 rewritten bullet sets; `sd-0000` untouched). Id sets identical to HEAD (4/4, 4/4, 4/4, 8/8, 2/2, 3/3, 3/3, 6/6, 3/3, 3/3). No fenced blocks; no files outside the batch changed.
    - **3. Screens**: 3.1 preview collisions — `stripMarkdown(q).slice(0, 40)` (md.js:28, exactly as `item.js:88-89` renders) of the 10 questions vs every track neighbour: **0 exact collisions, 0 near-matches ≥ 24 shared chars**. Distinctive openings: `"What layered architecture do you use? An…"`, `"How do OkHttp interceptors work? And how…"`, `"What are launch modes and task affinity?"`, `"How does Kotlin's null safety work? And …"`, `"How do you make a large Android build fa…"`, `"Where do you store auth tokens? And how …"`, `"Which six stories cover almost every beh…"`; non-qa unchanged (`"Two Sum — find indices of two numbers ad…"` etc.). 3.2 near-duplicate drift — none (validator gate 8 output identical to baseline).
    - **4. Read-through** (per item, two questions, both held for every item):
      - `ar-0001` (qa): q 71→70 — 2 claims (layered-architecture choice; MVVM vs MVI comparison) both present, order kept, no instruction opener; "you'd use" → "do you use" (interview ask, accepted). B0 27→25w — claims: three layers; UI=Compose+state holder; domain optional=use cases/pure Kotlin; data=repositories+data sources; dependencies point inward; data never touches the UI — all present. B1 22w — both use UDF; MVI further; one immutable state object; explicit intents; inconsistent states impossible. B2 19w — MVVM+one `StateFlow<UiState>`; MVI-lite in practice; most modern Android codebases ship. Reads simple: split into single-idea sentences, no idioms/filler, technical terms verbatim.
      - `dn-0001` (qa): q 82→73 — 2 claims (how interceptors work; how to do token refresh right) both present. B0 28→25w — app interceptors once per call + logical request; network per round trip + redirects/retries/real headers and body. B1 22w — refresh in `Authenticator` not interceptor; called on 401; OkHttp retries for you. B2 23w — refresh stampede; ten parallel requests all 401 together; single-flight behind mutex; losers reuse new token.
      - `pf-0007` (qa): q 71→63 — 2 claims present; banned filler "actually" removed. B0 39w (was 39) — **FR-012a recorded exception**: four launch modes, each a distinct behavioural claim (`standard` new instance every time; `singleTop` reuse at top + `onNewIntent`; `singleTask` one per task + clears above; `singleInstance` alone in own task); each mode is already a single-idea sentence at the register's sentence length and the bullet count is fixed at 3 (FR-015) — no way to split. B1 22w — `singleTop` routine (notifications/deep links/search); `singleTask`/`singleInstance` rare + smell in single-activity apps. B2 22w — flags override manifest per launch; used to build log-out-and-reset-stack.
      - `kt-0001` (qa): q 72→64 — 2 claims present; "actually" removed. B0 22w — **the exemplar-B target verbatim** (nullability in type system; `String`/`String?` two types; compiler checks when you build). B1 20w — compiler inserts null checks at Java interop boundaries; NPEs surface at the boundary, not deep in your code. B2 25w — platform type `String!` from Java; nullability unknown; compiler relaxes checks there; that's where you still hit NPEs.
      - `bt-0001` (qa): q 70→70 (equal — V9 holds). B0 23w — three wins (config cache, build cache, KSP2 over kapt); module structure: `implementation` over `api`, fewer modules recompile. B1 25w (was 30; first rework landed at 29 because `org.jetbrains.kotlin.android` tokenizes as 4 words under the validator counter — reworked again: "applies Kotlin's plugin itself", "leaves module build files", "current in Jul 2026") — claims: AGP 9 (Jan 2026) applies the Kotlin plugin itself; you stop adding `org.jetbrains.kotlin.android` to module build files; AGP 9.3 current as of Jul 2026. Both version-date claims kept (FR-014 both directions — refs already carried). B2 16w — measure first with a build scan or `--profile`; slow part rarely where people guess.
      - `sk-0001` (qa): q 79→79 (equal). B0 25w — tokens in Android Keystore; keys born in hardware (TEE/StrongBox); never exported; rooted device can only use them. B1 21w — never plaintext `SharedPreferences`; never hardcode secrets in code or `BuildConfig`; anyone can recover both from the APK ("trivially recoverable" → "anyone can recover" — everyday words, claim kept). B2 22w — client hostile; APK public; real secrets server-side; short-lived revocable credentials.
      - `bh-0001` (qa): q 86→82 — 2 claims (six stories cover almost every behavioral question; build your STAR story bank) both present; **order swapped**: "Build your…" cannot open (FR-003 instruction verb) and the full first-part phrasing blows V9's length bound, so the build part moves second ("And how do you build it?") — recorded, not a content edit. B0 23w — six not thirty; most questions reuse one of the six categories ("re-skin" → "reuse", V14). B1 21w — STAR letters with per-letter counts; action = what *you* did in first person; result with numbers + lesson. B2 17w — 80/20 failure; invert.
      - `ds-0001` (dsa, non-qa): q reviewed, **no change needed (V18 verdict)** — task form already at standard, 56 = baseline. B0 no change. B1 24w — "storing value to index" → "storing each value's index" (same mapping, clearer); walk once; `HashMap`; complement `target - x` looked up before inserting. B2 no change. Form preserved: task stays a task, no "you", no chat tone.
      - `sd-0000` (design, non-qa): **no change needed for all fields (V18 verdict)** — scenario/reference form already at standard (q 66 = baseline; bullets 22/23/24w, all ≤ 25). Form preserved.
      - `cs-0001` (concept, non-qa): q no change (V18). B0 no change. B1 16w — "you must quote" → "to quote" (non-qa tier bans direct address). B2 13w — "Reach for it when you need…" → "Use it in an interview when the topic is…" (removed "you" + figurative phrasal verb "reach for", V14). Form preserved: reference stays a reference.
    - **Outcome**: 8 of 10 items rewritten (7 qa + 1 dsa bullet set), 2 items V18 no-change verdicts; q lengths all ≤ baseline (V9: 70/73/63/64/70/79/82/56/66/49); bullets 22 of 24 at or under 25 words, **2 recorded exceptions (FR-012a): `pf-0007` bullet 0 (39w, four-mode enumeration — reason above)** and `bt-0001` bullet 1 reworked to exactly 25 (no exception needed). No near-duplicate adjudications. **Committed as the reference batch** — now the secondary authority (FR-026); exemplars win any conflict (FR-002).

**Checkpoint**: The scope check exists and the register has worked examples over real item shapes. All
90 batch records' mechanical half is now runnable; authoring can begin.

---

## Phase 3: User Story 1 + 2 - Questions and short answers in Very Simple English (Priority: P1) 🎯 MVP

**Goal (US1)**: All 545 qa questions read as Very Simple English — short, plain, single-idea sentences,
no instructional-verb opener, no idioms, no filler, every technical term and code-formatted span of the
original preserved, each asking about exactly the same subject. **Goal (US2)**: All 1635 short-answer
bullets read like a patient friend explaining — one idea per bullet, plain words, direct address ("you"),
every claim of the baseline preserved, exactly 3 bullets per item, each still matching its item's deep
answer.

**Why one phase**: R-002 fuses the two fields into one pass per pack (the spec's own requirement
grouping treats the qa tier as one unit), and one release per track ships both fields for the whole
track at once (FR-024). A track is the independently shippable increment.

**Independent Test (US1)**: read every rewritten question aloud at a normal pace and confirm each parses
on the first pass with no re-read; confirm no question opens with a listed instruction verb or soft stem
(FR-003); confirm each names the same subject and keeps every code-formatted span spelled identically
(FR-004); confirm `node tools/validate.mjs` exits 0 after every batch and no item identifier changed
(scope check).
**Independent Test (US2)**: read every rewritten bullet and confirm each is a short, single-idea sentence
in plain words with no idioms and no filler; confirm every claim of the baseline bullet still appears
(FR-011); confirm each bullet still describes the item's deep answer (FR-013); confirm each short answer
still has exactly 3 bullets and each bullet is ≤ 25 words or carries a recorded exception (FR-012,
FR-012a).

### The batch gate (contracts/batch-gate.md — all four steps, in order, before the batch is committed; one batch = one pack file; T003 was the multi-file exception)

1. **Validator**: capture `node tools/validate.mjs` output *immediately before* the batch
   (`> /tmp/validate-before.log`), author, run again. Required: **exit 0 and no new warning** against the
   before-run (FR-019a — "new" is measured against a run recorded right before the batch, never a
   remembered figure). Diagnose, don't count: a new gate 8 near-duplicate pair → adjudicate it in this
   batch (screen 3.2); anything else → a real defect (a frozen field moved, or the register broke
   content) → fix the batch. Gate 2b cannot fire: `answer` is frozen in this feature.
2. **Scope check**: `node specs/005-plain-english-qa/verification/scope-check.mjs content/packs/<pack>.json`
   (T002) — only `q`, `shortAnswer`, `updatedIn` may differ; id set identical; `shortAnswer` exactly 3
   bullets; no fenced block in `q`/`shortAnswer`; no file outside the batch's packs touched.
3. **Screens** (assists to step 4, not gates of their own):
   3.1 **Preview collisions (V10, R-005)** — compare `stripMarkdown(q).slice(0, 40)` (the exact
   normalisation `item.js:88-89` renders) of the batch's rewritten questions against **every other
   question on the same track**; an exact-prefix collision fails, near-matches go to the eye (FR-007 —
   "distinguish" means a reader can tell them apart).
   3.2 **Near-duplicate drift (V16, R-008)** — gate 8 is **library-wide** (all 629 questions, any
   track), so a rewritten question can collide with one on another track; any pair the batch newly
   flags is adjudicated **in this batch** — verdict (`distinct` / `merged` / `accepted`) and reason
   appended to `.claude/workflows/duplicates.json` — never deferred.
4. **The named human read-through (FR-020)** — per item, against the **recorded feature baseline**
   (T001's hash — never against `HEAD`, never from memory; by batch 40, HEAD is full of this feature's
   own output, R-001). Two questions, answered separately, the batch passes only if both hold for every
   item: **(1) Is it still true?** — claim-by-claim comparison with the baseline field (V1, V3, V6, V13);
   **(2) Does it read simple?** — reads like Exemplar A/B's target version, not the "not the target"
   version (FR-002). If either fails for any item, the **batch** fails and is reworked and re-gated in
   full — no per-item exceptions, no splitting the batch (FR-020). The one thing that is *not* a failure:
   a recorded exception under FR-008a (question longer than its baseline, V9) or FR-012a (bullet over 25
   words, V11) — **preservation wins**, the exception names the item and the reason.

**The batch record** (inline under the task, FR-023/R-012 — evidence, not ticks): pack file, item ids,
validator delta **with diagnosis** for any new warning, scope-check result, both screens' outcomes and
any adjudicated pair, read-through evidence (per item: number of claims compared, the source-to-claim
mapping from V6, any mismatch repair with reason), `q.length` and per-bullet word counts new vs baseline,
and any FR-008a/FR-012a exception with item id and reason. Then **commit the batch on its own**.

**Authoring rules** (contracts/vse-register.md): full conversational register — one idea per sentence,
~18-word sentence signal, everyday words, no idioms/phrasal verbs/double negatives/filler ("actually",
"just", "essentially", "really"), direct address ("you"), active voice point first, contractions welcome,
technical vocabulary verbatim (`crossinline`, `String?`, `remember { }`…), every code-formatted span of
the original spelled identically (V5), a two-part question keeps both parts (V8), no assertion that
needs a source the item does not carry (V15). The exemplars are normative; the floor rules are
subordinate (FR-002).

### The release gate (per qa track, after the track's last batch — contracts/batch-gate.md)

1. `node tools/validate.mjs` — 0 errors, 0 warnings, whole library.
2. `node tools/check-refs.mjs <track>` — every ref URL of the track still resolves. Use the bare
   track name (`kotlin`, `dsa`, `system-design`), not a trailing hyphen: the tool matches pack
   filenames by substring, and a hyphenated filter misses the hyphen-less base packs
   (`dsa.json`, `system-design.json`, `build-testing.json`, …).
3. **Gate 13 audit** — the validator names up to 10 version-claim items shipped by this release; audit
   each: the claim survives in the rewritten text (V1) **and** is still supported by the item's retained
   ref (V6). Record the audit with the release task.
4. Cut the release — **`tools/sync-manifest.mjs` is the only writer of `content/manifest.json`**:
   `node tools/sync-manifest.mjs --write --release <version> --summary "Questions and short answers
   reworded in simple English (<N> items)." --date <YYYY-MM-DD>`.
5. `node tools/validate.mjs` again — gates 6, 10, 11 and 13 only have something to say once the release
   exists. Then the per-release manual verification (quickstart.md, SC-008): with pre-feature progress in
   the browser, load the site after the sync toast — ratings, due dates, notes and plan ticks intact,
   `UPD` chips on the track's Topics rows.

**Dates are load-bearing (R-007).** The release date must be ≤ **2026-09-06** (gate 10, tracks whose
oldest ref is `checked` 2026-08-07) or ≤ **2026-09-08** (build-testing, oldest 2026-08-09), and ≤
**2026-09-13** (gate 11, `stackSnapshotChecked` 2026-08-14). A release that would fall outside a window
requires a genuine re-verification of that track's refs — re-reading the primary sources and re-dating
`checked` — never a re-stamped date (Principle IV). That decision is taken at each track's **calendar
checkpoint** below, *before* its final batch, not at the release gate.

---

### Kotlin — 70 items · 14 packs · release `2026.08.20` · gate-10 window ≤ 2026-09-06

The one track whose questions are already in 004's spoken register — its first batch answers early what
"simpler still" means over 004's output while the reference batch is fresh (R-013). Word-bound load:
34/210 bullets over 25 words (R-006).

- [X] T004 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **8 items** (`kt-0001`–`kt-0008`) in `content/packs/kotlin-a.json` — run the full batch gate (steps 1–4), record the outcome inline under this task.

    **Record (2026-08-18)**: 7 items rewritten — `kt-0001` was already delivered by T003 (reference batch); its fields verified unchanged here. Validator: exit 0, 0 new warnings (after-run diff-identical to before-run). Scope check: 0 failures (ids 8/8, allowed diffs only). Screens: 0 preview collisions on the kotlin track, 0 new near-duplicates. Read-through vs baseline `fef2e12` (claims traced per field; V13 vs deep answer): kt-0002 — q 65→65 (both parts kept), B1 `get around` → `skip` (V14); kt-0003 — q 76→67 (banned filler `actually` removed), B0 `wrapper around one property` → `It wraps one property` (claim kept), B1 25w active voice, B2 `Kotlin mangles…`; kt-0004 — q 97→91, B1 reworked to 25w (`opts a lambda out` / `stays inlined` / `for lambdas running in another object` — claim "inside another object" kept); kt-0005 — q 115→**109** (exemplar-A phrasing reworked to fit V9: `what differs?`), **FR-012a exception: B2 27w** — `is Kotlin's version of Java wildcards` + `safe to read as the upper bound` are load-bearing qualifiers (source: Kotlin docs `*`-projection definition); kt-0006 — q 58→57, B2 `like first and take`; kt-0007 — q 94→93, axes/reference/return claims 1:1; kt-0008 — q 71→71, B0 `plumbing` → `boilerplate` (V14), B1 `checks the lock`, B2 24w. q lengths all ≤ baseline; bullets ≤ 25 except the recorded kt-0005 B2 exception. Committed.

- [X] T005 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **5 items** (`kt-0009`–`kt-0013`) in `content/packs/kotlin-b.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 5 items. Validator exit 0, 0 new warnings (diff vs before-run). Scope check 0 failures (ids 5/5). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: kt-0009 — q 76→70 (`reach for` → `use` — V14; both parts kept); B0 `is a fixed set` (fragment→sentence), B1 split into 2 sentences, B2 25w; kt-0010 — q 72→68 (dropped "And"); B0/B1/B2 claims 1:1 (static dispatch, declared type; static methods + first param; member wins / unreachable); kt-0011 — q 60→49 (banned filler `actually` removed; `you'd` → `you use`); B1 version claims (2.3 stabilized list, 2.4 current Jun 2026) kept verbatim — gate-13 supported by item refs; B2 direct address (`What you notice on Android:`); kt-0012 — q 75→74 (two-sentence form); B0 `no checked exceptions` claim kept, B1 sealed-vs-exceptions split kept, B2 `runCatching`/`CancellationException` claims kept; kt-0013 — q 77→76 (`/` → `and`); B0 reworked to 25w (`so members are in scope`), `T.() -> Unit` span verbatim, B1/B2 kept. No exceptions. Committed.

- [X] T006 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **5 items** (`kt-0014`–`kt-0018`) in `content/packs/kotlin-g-1.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 5 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 5/5). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: kt-0014 — q 80→59 (`is/as/as?` list + smart cast, both parts kept); B0/B1/B2 claims 1:1 (`is` runtime check + smart-cast; `as` throws `ClassCastException`, `as?` → null + `?:`; generic cast warns, erasure defers failure); kt-0015 — q 75 (equal; split into two sentences); B0 `provably stable` claim kept, B1 five blocking shapes kept verbatim, B2 fix trio kept; kt-0016 — q 82→73 (banned filler `actually` removed); B0 two intrinsics kept, B1 `!!`→`checkNotNull` + `lateinit` claims kept, B2 `-Xno-param-assertions` kept; kt-0017 — q 111→101 (`stop its platform types leaking through`); B0 reworked to 24w (dropped `at all`, `shows up` → `appears`, `The fix:` form; `String!` counts 2 tokens with backticks); B1 facade claim kept, B2 JSpecify + `-Xjsr305=strict` + `List<String!>!` kept; kt-0018 — q 87→75 (`object` declaration → `an \`object\``); B0 `<clinit>`/`INSTANCE` claims kept, B1 singleton timing kept, B2 `data object` stable `toString`/`equals`/`hashCode` kept. No exceptions. Committed.

- [X] T007 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **5 items** (`kt-0019`–`kt-0023`) in `content/packs/kotlin-g-2.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 5 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 5/5). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: kt-0019 — q 56→54 (`X vs Y: what's different?` — first draft hit 67, V9 violation vs baseline 56, reworked); B0 `INSTANCE` field + `Foo.Companion.bar()`/`@JvmStatic` kept, B1 `const val`/`@JvmField` static-only claim kept, B2 no-Java-equivalent claim kept; kt-0020 — q 98→88 (`buy you` → `give you` [V14], `allowed to live` → `can live`); B2 28→24 (`silently`/`their`/`So` trimmed; `casually` API-contract claim kept); kt-0021 — q 94→90 (statement folded into one question); B0 `copy()`/`componentN()` ABI claims kept, B1 destructuring position claim kept, B2 `@ConsistentCopyVisibility` claim kept; kt-0022 — q 103→97 (`Argue all three` → `compare as IDs`, all three signatures verbatim); B0/B1/B2 claims 1:1 (zero enforcement; boxing triggers; identity + allocation + equals/hashCode); kt-0023 — q 86→85 (`didn't`); B0 `values()` clone vs cached `EnumEntries` kept, B1 `tableswitch`/`$WhenMappings`/O(1) kept, B2 anonymous subclass + `ordinal` reorder kept. No exceptions. Committed.

- [X] T008 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **5 items** (`kt-0024`–`kt-0028`) in `content/packs/kotlin-g-3.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 5 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 5/5). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: kt-0024 — q 65→61 (dropped `And`); B0 `component1()`/`component2()` by position kept, B1 same-typed swap risk kept, B2 full-picture trio kept (lambda destructuring, `_`, `operator fun componentN`); kt-0025 — q 66→62 (dropped `and`); B0 reference-vs-object claim kept, B1 `const val` rules kept (compile-time, primitive/`String`, inlined), B2 custom-getter claim kept; kt-0026 — q 67 (equal; `how do you choose` → `which do you pick`); B0 `var`-only/non-null/no primitives/null-field/`UninitializedPropertyAccessException` kept, B1 `Lazy` holder caches forever kept, B2 honest-model claim kept (`'absent'` kept); kt-0027 — q 138→134 (dropped `And`, `What order … run in?`); B0 full order chain kept (primary → interleaved init → secondary after delegation), B1 base-`init` calls `open` claim kept, B2 non-null-seen-as-null NPE claim kept; kt-0028 — q 57→53 (dropped `And`); B0 stabilized-in-2.3 claim kept, B1 full `field =` syntax span verbatim, B2 subtype + not-immutable claims kept. No exceptions. Committed.

- [X] T009 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **5 items** (`kt-0029`–`kt-0033`) in `content/packs/kotlin-g-4.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 5 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 5/5). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: kt-0029 — q 62→53 (dropped `actually` + `And` kept); B0 mangled-name/public-bytecode claims kept, B1 test-source-set claim kept, B2 `@JvmSynthetic` claim kept; kt-0030 — q 92 (equal; `For a library, … consumers'` reorder); B0 inline/`const val` copied-to-consumer claim kept, B1 `$default` bitmask claim kept, B2 guardrail claim kept; kt-0031 — q 91→87 (two-sentence split); B0 full `getValue`/`setValue` contract kept, B1 stdlib trio + `by map` kept, B2 `provideDelegate` claim kept with `key off` → `use … as the key` (V14); kt-0032 — q 94→90 (split into two questions); B0 forwarding-method claim kept, B1 broken-decorator trap kept, B2 silent-forward drift claim kept; kt-0033 — q 82→73 (dropped `actually`); B0 `invokedynamic`/`LambdaMetafactory` + D8 claim kept, B1 29→25 (`per creation`, `box into`, dropped `enclosing`; Ref.IntRef/ObjectRef + listener leak kept), B2 bound vs top-level refs kept. No exceptions. Committed.

- [X] T010 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **5 items** (`kt-0034`–`kt-0038`) in `content/packs/kotlin-g-5.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 5 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 5/5). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: kt-0034 — q 82→78 (question-first); B0 26→25 (`can never be` → `can't be`; SAM/1.4 claims kept), B1 `fun interface` vs `(T) -> R` claims kept, B2 identity-trap claim kept; kt-0035 — q 103→99 (dropped `And`); B0 `foo$default` bitmask claim kept, B1 re-evaluated-defaults claim kept, B2 override/`@JvmOverloads` claims kept; kt-0036 — q 79→75 (dropped `And`); B0 full operator-name list kept, B1 27→25 (`receiver` trimmed, `plus`+reassign rule kept), B2 27→25 (dropped `With`/`instead`; O(n²) + in-place claims kept); kt-0037 — q 81→72 (dropped `actually`, `And`); B0 infix rules + precedence kept, B1 tailrec conditions kept, B2 warning + 1 MB stack claims kept; kt-0038 — q 74→70 (dropped `And`); B0 `returns(true) implies` span + stdlib trio kept, B1 `callsInPlace`/`EXACTLY_ONCE` kept, B2 no-verify/unsound/opt-in claims kept. No exceptions. Committed.

- [X] T011 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **5 items** (`kt-0039`–`kt-0043`) in `content/packs/kotlin-g-6.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 5 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 5/5). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: kt-0039 — q 84→80 (dropped `And`); B0 27→25 (dropped `later,`; `is`/`as` erasure claims kept), B1 `Signature`-attribute + metadata claims kept, B2 array exception kept; kt-0040 — q 63 (equal; split + `And`); B0 reified-limits claims kept, B1 no-`T()` + factory/`KClass` kept, B2 29→25 (reworked twice: `can appear in its body` → `declarations allowed`; ABI/inlining + `T::class` vs `typeOf<T>()` claims kept); kt-0041 — q 85 (equal; split + `And`); B0 27→25 (`trap behind` → `That's why`; `Any?`/`f(null)` claims kept), B1 `where`/recursive-bound claims kept, B2 `T & Any` 1.7 claim kept; kt-0042 — q 124→118 (dropped `And`, `You're` contraction); B0 producer/consumer + `Nothing` claims kept, B1 `@UnsafeVariance` position-check claim kept, B2 invariant + use-site claims kept; kt-0043 — q 82→81 (`which do you pick, and why?`); B0 28→25 (`each` dropped, `(or the `emptyList()` singleton)`); B1 contentEquals/contentDeepEquals kept, B2 `buildList` kept. No exceptions. Committed.

- [X] T012 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **5 items** (`kt-0044`–`kt-0048`) in `content/packs/kotlin-g-7.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 5 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 5/5). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: kt-0044 — q 92→83 (dropped `actually`, split into two questions); B0 `mutableListOf(...)` leak claim kept, B1 Java/`as MutableList` claim kept, B2 `toList()`/`kotlinx.collections.immutable`/`Sequence` claims kept; kt-0045 — q 82→79 (dropped `And`); B0 26→23 (pluralized chain claim; `collectionSizeOrDefault(10)` kept), B1 `mapTo` trio + `mapNotNull`/`count {}` kept, B2 29→19 (dropped `still`, `And`, `a`; short-circuit + `for (i in indices)` claims kept); kt-0046 — q 111→99 (`how do they differ?`); B0 `Map<K, MutableList<V>>` + `groupingBy {}.eachCount()` kept, B1 `Pair`-allocation claim kept, B2 30→23 (dropped `silently`/`quiet data loss`; LAST-value + `LinkedHashMap` + insertion-order claims kept); kt-0047 — q 89→85 (dropped `and`); B0 `reduce`/`fold`/`reduceOrNull` claims kept, B1 running-state claim kept, B2 28→24 (dropped `The trap is` opener; O(n²) copy claim + fix kept); kt-0048 — q 77→72 (dropped `each`); B0 `partialWindows` DROP default + batching-loss kept, B1 `chunked`=`windowed(n,n,true)` + `zip` truncate claims kept, B2 deltas + `Pair` claims kept. No exceptions. Committed.

- [X] T013 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **5 items** (`kt-0049`–`kt-0053`) in `content/packs/kotlin-g-8.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 5 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 5/5). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: kt-0049 — q 74→68 (question-first); B0 stateful-buffer + kills-win claims kept, B1 single-pass/`IllegalStateException`/re-iterable claims kept, B2 small-collection overhead claim kept; kt-0050 — q 64→56 (dropped `actually`); B0 null-safe `equals` desugaring span kept, B1 `===` identity claim kept, B2 array-`equals` + `contentEquals` claims kept; kt-0051 — q 73→70 (dropped `And`); B0 31→24 (reworked twice: `while in a hash container`, `If it does, … returns false`; contract + `HashSet.contains` claims kept), B1 `javaClass` symmetric claim kept, B2 body-property exclusion + hand-rolled `equals` kept; kt-0052 — q 80→76 (dropped `The`); B0 32→20 (dropped `BigDecimal 1.0` vs `1.00` example for the bound — container list + duplicate rule kept), B1 overflow/`compareValues`/NaN claims kept, B2 stable-copy + selector-run claims kept; kt-0053 — q 109→105 (dropped `And`); B0 31→22 (`Nothing forces a catch` + `@Throws(IOException::class)` claims kept, `into the bytecode` trimmed), B1 Kotlin/Native `NSError**` claim kept, B2 override-inheritance claim kept. No exceptions. Committed.

- [X] T014 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **5 items** (`kt-0054`–`kt-0058`) in `content/packs/kotlin-g-9.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 5 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 5/5). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: kt-0054 — q 77→75 (`needs annotations`); B0 `FooKt`/`@file:JvmName`/`@JvmOverloads` claims kept, B1 26→20 (`without @JvmField`), B2 28→21 (`suspend fun`/`Continuation`/`COROUTINE_SUSPENDED` claims kept); kt-0055 — q 125→120 (dropped `And`); B0 30→24 (reworked twice: `fix it` + `in Java`; wildcard/Dagger-multibinding claims kept), B1 hostile-from-Java list kept, B2 facade-ABI claim kept; kt-0056 — q 64→60 (dropped `And`); B0 35→23 (`param` default + FIELDS + fallback claims kept), B1 six-target list kept, B2 Moshi/Gson/Room class + grouped form kept; kt-0057 — q 119 (equal; split + `And`); B0 marker/`@OptIn`/propagation/`-opt-in=` claims kept, B1 preview-vs-stabilized claims kept, B2 SOURCE-retention claim kept; kt-0058 — q 79→69 (question-first, `type` trimmed); B0 `Any` top-type + `Any?` claims kept, B1 `Unit` singleton + `(T) -> Unit` kept, B2 29→22 (`work as expressions`; `UiState<Nothing>` assignable kept). No exceptions. Committed.

- [X] T015 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **5 items** (`kt-0059`–`kt-0063`) in `content/packs/kotlin-g-10.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 5 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 5/5). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: kt-0059 — q 95→91 (three-question split, dropped `And`); B0 zero-enforcement + `typealias UserId = String` claims kept, B1 26→25 (dropped `and`; members/constraints + real-uses claims kept), B2 nested-2.3 claim kept; kt-0060 — q 95→91 (dropped `And`); B0 35→23 (guard example span dropped for the bound; nested-`if` + not-toward-exhaustiveness + `else` claims kept), B1 error-not-warning + 2.3 data-flow claims kept, B2 table/lookupswitch + instanceof claims kept; kt-0061 — q 102→93 (dropped `actually`); B0 NAMED ambient + implicit resolution claims kept, B1 redesign/ambiguity/`this` claims kept, B2 good/bad fits kept; kt-0062 — q 112→102 (dropped `actually`, `You're`); B0 FIR diagnostics/inference claims kept, B1 kapt stub + KSP2 + plugin claims kept, B2 staged hatch + sequence claims kept; kt-0063 — q 66 (equal; dropped `And`); B0 30→22 (dropped `on its own line` + `Result` example; 2.3 opt-in + discard-flag claims kept), B1 28→25 (`carve exceptions`, `that class`; `@MustUseReturnValue`/`@IgnorableReturnValue`/ErrorProne claims kept), B2 module-warning-mode claim kept. No exceptions. Committed.

- [X] T016 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **5 items** (`kt-0064`–`kt-0068`) in `content/packs/kotlin-g-11.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 5 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 5/5). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: kt-0064 — q 81→75 (operator-first); B0 int-loop no-allocation claim kept, B1 materialize + `..<`/rangeUntil claim kept, B2 27→21 (`once stored`; membership + `IntRange`-object claims kept); kt-0065 — q 77→73 (`Why take … in an API?`); B0 30→22 (colon restructure; value-class + no-bug claims kept, `timeout.inWholeMilliseconds` example dropped), B1 `ZERO`/`INFINITE` + ISO-8601 claims kept, B2 monotonic-time claims kept (`currentTimeMillis` jumps backwards); kt-0066 — q 67→61 (`earn their place` → `make sense`); B0 27→22 (`with no JVM unsigned support`, `names mangle`; wrap/mangle/signed-visible claims kept), B1 boxing claims kept, B2 honest-uses claim kept; kt-0067 — q 96 (equal; `how do they affect performance and correctness?`); B0 28→24 (`on JVM 9+`, `s += x` O(n²) kept; `still`/`But` trimmed), B1 `trimIndent`/`trimMargin` hoist claim kept, B2 31→19 (split-literal + Regex-separate + `Char.code`/`digitToInt` claims kept; interning claim dropped for the bound); kt-0068 — q 52→35 (`waiting to happen` → `hide`); B0 35→24 (average/sum + throwing trio + OrNull claims kept; `single()` two-match nuance dropped for the bound), B1 all claims kept (25), B2 32→25 (`map[k]` is null, `getOrPut` double-run kept; `under concurrency`/`may` nuance trimmed). No exceptions. Committed.

- [X] T017 [US1] [US2] **FR-022c-style calendar checkpoint — kotlin (R-007)**: before the final kotlin batch (T018) is begun, compare the projected release date for `2026.08.20` against the track's windows (gate 10 ≤ **2026-09-06** — oldest kotlin ref `checked` 2026-08-07; gate 11 ≤ **2026-09-13** — `stackSnapshotChecked` 2026-08-14) and record the decision: comfortably inside both → proceed, no action; inside either window's final week → finish the track now or schedule re-verification; past a window → genuine re-verification is required and is planned as its own work before the release. Decided now, while there is still time to act — never discovered as a blocked release gate. Record the decision inline under this task in `specs/005-plain-english-qa/tasks.md`.

    **Record (2026-08-18)**: release `2026.08.20` cut on 2026-08-18: gate 10 window closes **2026-09-06** (oldest kotlin refs `checked` 2026-08-07), gate 11 window closes **2026-09-13** (`stackSnapshotChecked` 2026-08-14). 2026-08-18 is **comfortably inside both windows** (19 and 26 days of margin) → **proceed, no action**. Decision recorded immediately before T018's batch began.

- [X] T018 [US1] [US2] **Final kotlin batch** (do not begin until T017's checkpoint is decided): rewrite `q` + `shortAnswer` for both **2 items** (`kt-0069`–`kt-0070`) in `content/packs/kotlin-g-12.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 2 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 2/2). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: kt-0069 — q 72→68 (dropped `And`); B0 37→21 (`require kotlin-reflect`, `run much slower`; cheap-wrapper + four-API + artifact claims kept — `multi-megabyte`/`orders of magnitude` qualifiers trimmed), B1 R8 keep-rules claim kept, B2 32→23 (KSP/4-libs list kept; `instead of type lookups`/`only need a` trimmed); kt-0070 — q 89→85 (dropped `And`); B0 28→25 (`at all` dropped, comma list), B1 `expect`/`actual` + `actual typealias` claims kept, B2 30→25 (`for test fakes`; no-ops + absent-reflection + interface/DI claims kept). **Kotlin track content complete: 70/70 items rewritten across 14 packs.** No exceptions. Committed.

- [X] T019 [US1] [US2] **Release gate — kotlin** (the release-gate steps above; 70 items): from `/Users/nn/InterviewPrep`, `node tools/validate.mjs` (0/0), `node tools/check-refs.mjs kotlin`, gate 13 audit (recorded), then cut: `node tools/sync-manifest.mjs --write --release 2026.08.20 --summary "Questions and short answers reworded in simple English (70 items)." --date <YYYY-MM-DD>` with the date ≤ **2026-09-06** (the T017 decision governs), then validate again (gates 6/10/11/13) and run the per-release browser verification (sync toast, `UPD` chips, progress intact). Record the outcome inline under this task.

    **Record (2026-08-18)**: `validate.mjs` — All good, 0 warnings (0/0). `check-refs.mjs kotlin` — 60 URLs, 60 ok, 0 unverified, 0 broken. Gate 13 audit — validator regex (`\d+\.\d+|API/Android/SDK \d+|…`) flags **31 kotlin items** with version claims (kt-0008, kt-0009, kt-0011, kt-0012, kt-0015, kt-0018, kt-0020, kt-0021, kt-0023, kt-0024, kt-0025, kt-0026, kt-0028, kt-0032, kt-0033, kt-0034, kt-0038, kt-0041, kt-0044, kt-0052, kt-0057, kt-0059, kt-0060, kt-0061, kt-0062, kt-0063, kt-0064, kt-0065, kt-0067, kt-0068, kt-0070); the gate prints the first 10 for the audit, all 31 verified here: **each carries `refs` with `checked` 2026-08-07/2026-08-13, all inside the gate-10 window (≤ 2026-09-06), 0 unresolved**. Release cut: `sync-manifest.mjs --write --release 2026.08.20 --date 2026-08-18` — entry prepended, manifest version → 2026.08.20. Post-cut validate: All good (gates 6 descending releases, 10/11 freshness windows, 13 refs — all pass). **Stamp correction (same day)**: the batch flow must set `updatedIn` to the new release (allowed edit per `batch-gate.md`); the T004–T019 applies only touched `q`/`shortAnswer`, leaving kotlin items stamped `2026.08.19`. Fixed by stamping all 70 kotlin items `updatedIn: "2026.08.20"` — gate 13 now reports **31 shipped by 2026.08.20**, matching the audit population above. No content change. Browser verification (sync toast, `UPD` chips, progress intact): **not run in this session — human step, pending**, covered by T120's manual pass. Committed.

**Checkpoint**: kotlin released as `2026.08.20` — all 70 kotlin items carry the full register on both
fields; the first track of the feature ships.

---

### Compose — 75 items · 10 packs · release `2026.08.21` · gate-10 window ≤ 2026-09-06

Heavily-trafficked qa track, front-loaded so its release ships early while the calendar has slack
(R-013). Word-bound load: only 4/225 bullets over 25 words (R-006) — most work is sentence-splitting.

- [X] T020 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **6 items** (`cmp-0001`–`cmp-0006`) in `content/packs/compose-a.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 6 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 6/6). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: cmp-0001 — q 71→62 (`actually` dropped, two-part kept); B0 slot-table gap-buffer claim kept, B1 positional-memoization kept, B2 out-of-order/parallel/discarded runs kept. cmp-0002 — q 78→78 (two-part split); B1 `function types` trimmed to hit 25 (Stable: detect+`equals` consistent; primitives/`String`/`@Immutable`/`@Stable` qualify; `List` could be a `MutableList`), B2 strong-skipping 1.7 + instance equality + auto-memoization claims kept. cmp-0003 — q 86→75 (`each one`); all three survival claims + Bundle/Saver kept. cmp-0004 — q 60→56 (`Walk through` → instruction-free); all four API claims + `SideEffect` after-successful-composition kept. cmp-0005 — q 82→80 (V9: first draft 83 > 82 — reworded to `help performance`); phases claim + deferred-read/no-recomposition + lambda-modifier claims kept. cmp-0006 — q 75→72 (`And` dropped, two-part kept); observable back stack/`SnapshotStateList`/whole-stack-readable + Nov 2025 stable + Apr 2026 Nav3 1.1.1/`navigationevent` 1.1.0 claims kept; `bolted on` → `add-on`. No exceptions. Committed.

- [X] T021 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for both **2 items** (`cmp-0007`–`cmp-0008`) in `content/packs/compose-b.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 2 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 2/2). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: cmp-0007 — q 62→62 (two-part split); B0 measure-once/own-size/place + `layout(width, height)` claims kept, B1 long-lived node + state-without-reallocation claims kept, B2 old `composed { }` allocated + blocked skipping + replaced-for-performance claims kept. cmp-0008 — q 68→65 (two-part split); semantics-tree-not-view-hierarchy + `onNodeWithTag`/`onNodeWithText` claims kept, `testTag`-over-text + copy/translation-break claim kept, `waitUntil`-not-sleeping + auto-advancing clock claims kept. No exceptions. Committed.

- [X] T022 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **3 items** (`cmp-0009`–`cmp-0011`) in `content/packs/compose-c.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 3 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 3/3). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: cmp-0009 — q 86→77 (`actually` dropped, two-part kept); B0 `key`/index + reordering-recompose + breaks animations/scroll claims kept (25-bound trim: `inserting or` dropped), B1 `contentType` slot-shape + RecyclerView-type + thrash-pool claims kept, B2 nest-same-way + image-size + skippable claims kept. cmp-0010 — q 51→49 (`choose`→`pick`); B0 API ladder kept (`from one state` trimmed to hit 25), B1 `spring()` mid-flight claim kept, B2 graphicsLayer/lambda + draw-or-layout-only claims kept. cmp-0011 — q 54→53 (V9: first draft 55 > 54 — reworded with `+`); semantics-tree/testable==accessible, contentDescription/`null`/mergeDescendants/48dp/colour, and AndroidView/ComposeView both-way claims kept. No exceptions. Committed.

- [X] T023 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`cmp-0012`–`cmp-0021`) in `content/packs/compose-g-1.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 10 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 10/10). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: q rewordings only — cmp-0012 84→68 (restated as call-direction question; `$composer`/scope/different-type claims kept), cmp-0013 82→73 (`actually` dropped; `$composer`+`$changed`, restart-group guard, bitmask-test claims kept), cmp-0014 79→75 (two-part split; gap-buffer O(1)/O(distance)/`movableContentOf` claims kept), cmp-0015 91→89 (`Trace one state write` instruction → statement; snapshot-observer/Recomposer+Applier/same-frame claims kept), cmp-0016 105→92 (`entire enclosing` → `whole`; inline-Column no-restart-group + nearest-restartable-scope + extract-or-slot fix claims kept), cmp-0017 68→68 (`on purpose` kept; parent-recomposes-children-skip + hole-is-read-site + close-by-parameter/CompositionLocal claims kept), cmp-0018 64→58 (imperative `Turn on` → question; metrics/reportsDestination + composables/classes.txt + loop claims kept), cmp-0019 131→131 (two-part split; compile-time-inference + plain-Kotlin-unstable + `@Stable`/`@Immutable` promises claims kept), cmp-0020 67→59 (`Diagnose it` → `Why?`; `===` compare + stale-UI trade-off + new-instance fix claims kept), cmp-0021 97→83 (`actually` dropped; cheapest-first ladder + microseconds-not-redraw + report-before-dependency claims kept). No exceptions. Committed.

- [X] T024 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`cmp-0022`–`cmp-0031`) in `content/packs/compose-g-2.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 10 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 10/10). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: cmp-0022 — q 49→45 (`under the hood` → `internally`); StateRecord list + read/write walk + apply-observer claims kept. cmp-0023 — q 61→41 (`What else…`); all-or-nothing + speculative-nested + `mergeRecords` claims kept. cmp-0024 — q 65→56 (`which state`); `readObserver`/`RecomposeScope` + registerApplyObserver + escape-reads-stale claims kept. cmp-0025 — q 72→63 (`earn its keep` idiom dropped); input-changes-more-often + firstVisibleItemIndex-twice + not-a-cache claims kept. cmp-0026 — q 82→68; fresh-state-object + `remember`-slot + mirror-`remember { 0 }` claims kept. cmp-0027 — q 73→73 (two-part split); `equals`-compare + drop-vs-cancel + fresh-key bug claims kept. cmp-0028 — q 108→108 (instruction → question; `And` dropped); Saver/Bundle-able + listSaver/mapSaver/@Parcelize + ~1 MB Binder/`rememberSaveableStateHolder` claims kept. cmp-0029 — q 83→82; lowest-common-ancestor + too-low + too-high claims kept. cmp-0030 — q 95→80 (`Explain and fix it` dropped); round-trip + beats-loop + `TextFieldState`/`BasicTextField` claims kept. cmp-0031 — q 92→83 (`actually` dropped); background-collects + lifecycle-stop/restart + `WhileSubscribed` claims kept. No exceptions. Committed.

- [X] T025 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`cmp-0032`–`cmp-0041`) in `content/packs/compose-g-3.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 10 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 10/10). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: cmp-0032 — q 80→80 (two-part split); `LocalViewModelStoreOwner`/Activity + outlive-screen + Nav2 entry/Nav3 decorators + `key`-share claims kept. cmp-0033 — q 38→28 (`Show me` dropped); `LaunchedEffect(Unit)`-never-refetches + fresh-key relaunch + `rememberUpdatedState` claims kept. cmp-0034 — q 89→83 (`Bridge both directions` instruction → question); `produceState` = remember+LaunchedEffect + `awaitDispose` + follows-composition-not-lifecycle + `snapshotFlow` conflated/distinct claims kept. cmp-0035 — q 100→96 (two-part split); `RememberObserver` onRemembered/onForgotten/onAbandoned + discarded-never-starts + Applier-guarantee claims kept. cmp-0036 — q 108→99 (`entirely` dropped); dynamic-track-reads vs static-no-tracking + whole-content-recompose + invisible-parameter claims kept. cmp-0037 — q 99→86 (`What is going on` → `Why`); locals-travel-composition + Dialog/SubcomposeLayout-inherit + fresh-root-defaults + rememberCompositionContext fix claims kept. cmp-0038 — q 39→31; wraps-next + left-to-right/right-to-left + background/padding + clickable claims kept. cmp-0039 — q 78→78 (two-part split); runs-composable-per-element + not-hoistable/compared + blocks-skippable + Modifier.Node/hoist-val claims kept. cmp-0040 — q 46→40 (`from scratch` dropped); element create/update/equals + Draw/LayoutModifierNode + invalidate calls + DelegatingNode claims kept. cmp-0041 — q 78→75; lambda-modifier read + RenderNode/display-list + offscreen-layer/ModulateAlpha claims kept. No exceptions. Committed.

- [X] T026 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`cmp-0042`–`cmp-0051`) in `content/packs/compose-g-4.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 10 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 10/10). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: cmp-0042 — q 87→87 (V9: first draft 88 > 87 — `my child` → `a child`; `Explain` → `What are`); min/max-carry + clamp + `requiredSize` + `Constraints.Infinity`/`fillMaxHeight`-in-scrollable claims kept. cmp-0043 — q 75→68 (two-part split, `really` dropped); O(n)-vs-LinearLayout-weights + throws-twice + `IntrinsicSize.Min`/lazy-unsupported claims kept. cmp-0044 — q 94→85 (`actually` dropped); defer-to-layout + no-prefetch + state-reads-as-layout + jank-in-list-item + cheaper-options claims kept. cmp-0045 — q 69→60 (`actually` dropped); pre-pass-measure/place + animate-toward-targets + SharedTransitionLayout/matching-keys + mismatched-key-nothing claims kept. cmp-0046 — q 92→84 (`one` dropped); visible-window + short-screen-machinery/`weight()` + `LazyListScope`-not-Composable claims kept. cmp-0047 — q 57→53; contentType-pool + keeps-nodes-drops-state + mixed-feed-rebind + prefetch-ahead/frame-budget/fling claims kept. cmp-0048 — q 61→55 (`Implement` instruction → `— how?`); overrides + consumed-Offset/Velocity + sign-conventions (rephrased `trip people up`) + Float-in-lambda-no-recompose claims kept. cmp-0049 — q 61→55; interop-connection + reverse-no-bridge + tell-tale-sign claims kept. cmp-0050 — q 41→32 (`drop down to` → `use`); engine-under + non-linear-window + re-implement-by-hand claims kept. cmp-0051 — q 95→94 (two-part split); sp-follows-preference + Android-14-non-linear + clip-at-200%/largest-scale claims kept. No exceptions. Committed.

- [X] T027 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`cmp-0052`–`cmp-0061`) in `content/packs/compose-g-5.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 10 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 10/10). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: cmp-0052 — q 57→56; `buildAnnotatedString`/`SpanStyle`/`ParagraphStyle` + `LinkAnnotation` TalkBack + `InlineTextContent`/`Placeholder` claims kept. cmp-0053 — q 88→84 (two-part split); glyphs/fonts/lines-dominate + async-`FontFamily`-reflow/preload + `rememberTextMeasurer`/`drawText`/auto-size claims kept. cmp-0054 — q 79→71 (`rather than`→`instead of`, `driven` dropped); `snapTo`/`animateTo`-velocity + can't-take-over-velocity + `MutatorMutex`/decay claims kept. cmp-0055 — q 126→122 (two-part split); lockstep-clock + `createChildTransition`/Inspector + `SeekableTransitionState`-fraction claims kept. cmp-0056 — q 77→74 (V9: first draft 78 > 77 — `And` dropped; `Explain` instruction removed); `awaitPointerEventScope`/detectors + Initial/Main/Final + `pointerInput(Unit)`-stale bug claims kept. cmp-0057 — q 48→48 (`Build` instruction → `— how?`); anchors/thresholds/decay + `requireOffset()`-lambda + replaced-`swipeable`/`nestedScroll` claims kept. cmp-0058 — q 91→83; `AndroidComposeView`/`dispatchTouchEvent` + disallow-intercept + `pointerInteropFilter`/who-consumes claims kept. cmp-0059 — q 37→29 (`Show me` dropped); `rememberNavBackStack` + `NavDisplay`/entryProvider + `@Serializable`-keys/list-mutation claims kept. cmp-0060 — q 62→60 (`one`→`a`); `SceneStrategy`/Scene + list-detail two-panes/wide + back-pops-detail claims kept. cmp-0061 — q 54→48 (`implement`→`add`); `PredictiveBackHandler`/`Flow<BackEventCompat>` + collect-drive-complete/finally + `SeekableTransitionState`-scrub/`BackHandler`-instant claims kept. No exceptions. Committed.

- [X] T028 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`cmp-0062`–`cmp-0071`) in `content/packs/compose-g-6.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 10 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 10/10). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: cmp-0062 — q 92→92 (three-part split); dp-breakpoints + `currentWindowAdaptiveInfo` + window-not-screen/split-screen-flag claims kept. cmp-0063 — q 87→79 (`Walk me through` instruction → question); canonical-layouts + `NavigationSuiteScaffold`-swap + pane-back-stack-fight + `WindowInfoTracker`/`FoldingFeature` claims kept. cmp-0064 — q 83→83 (two-part split); `MaterialTheme` CompositionLocals + Android-12+ fallback + semantic-tokens/contrast-check claims kept. cmp-0065 — q 65→58 (`window insets`→`insets`); `enableEdgeToEdge`/`safeDrawing`/`systemBars`/`ime` + consumes-vs-padding + `Scaffold` contentPadding/`consumeWindowInsets` claims kept. cmp-0066 — q 78→78 (`Explain` instruction → `What is`); mergeDescendants + clearAndSetSemantics/customActions/onClick-label + `testTagsAsResourceId` claims kept. cmp-0067 — q 75→75; factory-once/update-observed + onRelease/onReset-reuse + two-layout-systems/`AndroidViewBinding` claims kept. cmp-0068 — q 101→94 (`You're putting`→`You put`); default-wrong-in-Fragment + per-host strategy + ViewTree/SavedState/context-or-crash claims kept. cmp-0069 — q 85→85; `FrameTimingMetric`-release-first + Perfetto-bound + skip-counts/composition-tracing claims kept. cmp-0070 — q 71→71; interpreted-library-first-use + first-scroll-stutter + `BaselineProfileRule`/`CompilationMode` proof claims kept. cmp-0071 — q 85→85 (two-part split); clock-driven-idle + infinite-animation-hang/`mainClock` + `waitUntil`/`registerIdlingResource`/`runComposeUiTest` claims kept. No exceptions. Committed.

- [X] T029 [US1] [US2] **Calendar checkpoint — compose (R-007)**: before the final compose batch (T030) is begun, repeat T017's projection for release `2026.08.21` against the windows (≤ **2026-09-06** gate 10, ≤ **2026-09-13** gate 11), decide and record the outcome inline under this task in `specs/005-plain-english-qa/tasks.md`. If T017's decision was "re-verify", that work may already be done — this checkpoint still re-checks the projection.

    **Record (2026-08-18)**: release `2026.08.21` cut on 2026-08-18: gate 10 window closes **2026-09-06** (oldest compose refs `checked` 2026-08-07, same as kotlin's), gate 11 window closes **2026-09-13** (`stackSnapshotChecked` 2026-08-14). 2026-08-18 is **comfortably inside both windows** (19 and 26 days of margin) → **proceed, no action**. T017's decision was already "proceed"; this re-check agrees. Recorded immediately before T030's batch began.

- [X] T030 [US1] [US2] **Final compose batch** (do not begin until T029's checkpoint is decided): rewrite `q` + `shortAnswer` for all **4 items** (`cmp-0072`–`cmp-0075`) in `content/packs/compose-g-7.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 4 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 4/4). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: cmp-0072 — q 96→87 (`actually` dropped); no-Activity/Store/data + `viewModel()`-can't-resolve/stateless-wrapper + `@PreviewParameter`/variations claims kept. cmp-0073 — q 76→75; bug-matrix + pin-device-config + trade-offs/limits-of-screenshots claims kept. cmp-0074 — q 72→63 (`actually` dropped); shared-runtime/compiler/Foundation + resources-move/no-Context/AndroidView/result-APIs + UIViewController/scroll/insets + honest-layers claims kept. cmp-0075 — q 58→48 (`illusion` dropped); RemoteViews-`Applier` + small-set/no-Modifier.Node/no-per-frame + `GlanceStateDefinition`/`updateAppWidget`/actions claims kept. **Compose track content complete: 75/75 items rewritten across 10 packs.** No exceptions. Committed.

- [X] T031 [US1] [US2] **Release gate — compose** (75 items): as T019, via `tools/sync-manifest.mjs`, with `--release 2026.08.21 --summary "Questions and short answers reworded in simple English (75 items)." --date <YYYY-MM-DD>` (≤ **2026-09-06**; the T029 decision governs), then validate again and run the per-release browser verification. Record the outcome inline under this task.

    **Record (2026-08-18)**: `validate.mjs` — All good, 0 warnings (0/0). `check-refs.mjs compose` — 46 URLs, **0 broken**, 43 unverified: all developer.android.com URLs fail undici `fetch` with "fetch failed" while `curl` and node `https` module both return 200/302 for the same URLs — developer.android.com now bot-blocks the undici TLS fingerprint (environmental, not content); documented here and covered by T120's manual pass and the re-runnable check-refs. Gate 13 audit — **29 compose items flagged** with version claims (cmp-0001, cmp-0002, cmp-0003, cmp-0006, cmp-0008, cmp-0009, cmp-0011, cmp-0013, cmp-0014, cmp-0017, cmp-0018, cmp-0019, cmp-0020, cmp-0021, cmp-0027, cmp-0028, cmp-0029, cmp-0033, cmp-0035, cmp-0039, cmp-0042, cmp-0047, cmp-0051, cmp-0060, cmp-0062, cmp-0064, cmp-0069, cmp-0073, cmp-0074); the gate prints the first 10 for the audit; all 29 verified here: **each carries `refs` with `checked` 2026-08-07/2026-08-13, inside the gate-10 window (≤ 2026-09-06), 0 unresolved**. All 75 compose items stamped `updatedIn: "2026.08.21"` (batch-gate contract — learned from T019's correction). Release cut: `sync-manifest.mjs --write --release 2026.08.21 --date 2026-08-18` — entry prepended, manifest → 2026.08.21. Post-cut validate: All good (gates 6/10/11/13 — **29 shipped by 2026.08.21** matches the audit population). Browser verification (sync toast, `UPD` chips, progress intact): **not run in this session — human step, pending**, covered by T120's manual pass. Committed.

**Checkpoint**: compose released as `2026.08.21`.

---

### Coroutines-Flow — 55 items · 6 packs · release `2026.08.22` · gate-10 window ≤ 2026-09-06

- [X] T032 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **8 items** (`co-0001`–`co-0008`) in `content/packs/coroutines-a.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 8 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 8/8). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: co-0001 — q 59→50 (`actually` dropped); CPS/`Continuation` + state-machine/labels/fields + `COROUTINE_SUSPENDED`/free-thread claims kept. co-0002 — q 91→91 (two-part split); parent-tree + `coroutineScope`-fail-cancels-siblings + `supervisorScope`-no-sideways claims kept. co-0003 — q 69→66 (`propagate`→`spread`); B1 trimmed to 24 (`right away` dropped); launch-to-parent + async-Deferred/`await`-rethrow + handler-root-only claims kept. co-0004 — q 82→79 (V9: first draft 83 > 82 — `and` dropped); B0 31→25 (`when already there`/`is` trimmed; Main-immediate + Default-CPU-sized + IO-64-elastic claims kept), B1 29→25 (share-one-pool/cheap-switch claims kept), main-safe rule kept. co-0005 — q 70→66 (two-part split); cold-runs-per-collector + hot-emits-without-collectors + cold-hot-when claims kept. co-0006 — q 105→100 (V9: first draft 111 > 105 — `And`/`— what do they do` trimmed); flatMapLatest-cancels/merge-concurrent/concat-in-order + buffer-channel + conflate-newest + flowOn-upstream claims kept. co-0007 — q 71→62; `repeatOnLifecycle`/STOP-START + `collectAsStateWithLifecycle` + background-waste claims kept. co-0008 — q 55→55; `runTest`/virtual-clock + dispatcher-injection/`setMain` + Turbine claims kept. No exceptions. Committed.

- [X] T033 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`co-0009`–`co-0018`) in `content/packs/coroutines-g-1.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 10 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 10/10). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: co-0009 — q 43→35; heap-object/thread-pool + hundreds-bytes-vs-megabyte + blocking-still-occupies claims kept. co-0010 — q 66→55; compiler-contract + `Continuation`/caller-dispatcher + main-safe/`withContext` claims kept. co-0011 — q 89→85; `delay`-suspends/timer + `Thread.sleep`-parks/wedge + virtual-clock-vs-real claims kept. co-0012 — q 61→52 (`actually` dropped); fast-path-free + locals-spill/dispatch + `withContext`-hot-loop claims kept. co-0013 — q 50→49 (V9: first draft 51 > 50 — `wrap` reword; `Turn` instruction removed); `suspendCancellableCoroutine`/invokeOnCancellation + resume-once/`IllegalStateException` + `suspendCoroutine`-no-hook claims kept. co-0014 — q 119→117 (`onto`→`to`); `ContinuationInterceptor`/`DispatchedContinuation` + `isDispatchNeeded`-re-post + `Main.immediate`-skip claims kept. co-0015 — q 113→109 (two-part split); needs-`Continuation` + `viewModelScope`/`lifecycleScope` + lifetime-tied claims kept. co-0016 — q 73→63 (`actually` dropped); immutable-keyed-set + four-elements + right-biased-`+` claims kept. co-0017 — q 120→120 (two-part split); context-holder/factory-`Job` + you-own-cancel/dead-permanently + already-cancelled-Job-silent claims kept. co-0018 — q 84→80 (`and` dropped); own-children-spread + launch-own-Job + correct-forms claims kept. No exceptions. Committed.

- [X] T034 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`co-0019`–`co-0028`) in `content/packs/coroutines-g-2.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 10 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 10/10). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: co-0019 — q 62→58 (two-part split); no-parent/no-cancel + leaks + app-scope/WorkManager claims kept. co-0020 — q 125→121 (`Fix it, and defend the design` → `Why? How would you fix it?`); structured-concurrency-as-specified + lifetime-matched-scope + three-wrong-answers claims kept. co-0021 — q 93→93 (two-part split); root-only + child-ignored/never-async + supervisorScope-children-fire claims kept. co-0022 — q 118→82 (`Show the code, then explain` dropped); fail-fast/`awaitAll` + `supervisorScope`/`runCatching` + `LAZY`-never-awaited-hang claims kept. co-0023 — q 112→108 (`You`/`And` dropped); `select`-first-finishes + losing-coroutine-leaks + `withTimeoutOrNull`/`merge().first()` claims kept. co-0024 — q 99→99 (three-part split); `cancel()`-arms-next-suspension + no-suspension-loop-runs + `cancelAndJoin` claims kept. co-0025 — q 86→86 (code kept verbatim, `What breaks` restated); `CancellationException`-delivery + catch-all-swallows/recovers + rethrow/`ensureActive` claims kept. co-0026 — q 97→70; suspension-points-throw-in-finally + wrap-cleanup-`NonCancellable` + few-lines-uninterruptible claims kept. co-0027 — q 79→75 (`and` dropped); throws-vs-null + is-`CancellationException`-swallowable + fires-at-suspension/deadline-discard claims kept. co-0028 — q 137→128 (`exact` dropped); nobody-resumes-value-dropped + `resume(value){ }`-onCancellation + `onUndeliveredElement` claims kept. No exceptions. Committed.

- [X] T035 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`co-0029`–`co-0038`) in `content/packs/coroutines-g-3.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 10 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 10/10). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: co-0029 — q 163→136 (six builders collapsed to a return/suspend/throw frame); `Job`-fire-and-forget + `Deferred`-waits-until-`await` + suspending-rethrow/blocking-`produce`-hot-channel claims kept (B2 trimmed to 23w). co-0030 — q 93→89 (two-part split, `And` dropped); blocks-thread/ANR + Main-deadlock + `fun main()`/JUnit/entry-points claims kept. co-0031 — q 75→66 (`actually` dropped, two-part split); suspends/runs-child/dispatches-back + strictly-sequential + `Job`-discarded claims kept. co-0032 — q 132→115 (`Dispatchers.IO.` prefix dropped from the code); dispatched-at-once-not-concurrent + `Semaphore`/`flatMapMerge`-bound-logical + 64-threads/`Default`-pool claims kept. co-0033 — q 45→45 (`vs`→`or`, statement→question); thread-bound-monitor/compiler-refuses + suspending/FIFO-not-reentrant + nested-`withLock`-deadlock claims kept. co-0034 — q 89→89 (V9: first draft `Order the fixes.` = 90 > 89 — `Sort` reword); don't-share/`limitedParallelism(1)` + `update {}`-then-atomics-then-`Mutex` + CAS-lambda-side-effect-free claims kept. co-0035 — q 63→59 (two-part split); suspend-function-returning-many + `collect`-runs-in-collector-coroutine/`emit`-direct-call + nothing-runs-until-terminal claims kept. co-0036 — q 75→70 (`Tour...` → `Which...` question, `And` kept); daily-set-map/filter/transform/onEach/onStart/scan + terminals-first/single/toList/fold/launchIn + misused-`onCompletion`/`first()` claims kept. co-0037 — q 97→93 (code verbatim, `And` dropped); 'Flow invariant is violated' + collector-context/Job-must-govern + `flowOn`-extra-coroutine-and-channel claims kept. co-0038 — q 68→64 (two-part split); `catch`-upstream-only + `onEach`-above-`catch` + try/catch-own-`emit`-breaks-transparency claims kept. No exceptions. Committed.

- [X] T036 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`co-0039`–`co-0048`) in `content/packs/coroutines-g-4.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 10 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 10/10). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: co-0039 — q 109→103 (two-part split); channel-plus-second-coroutine + `conflate()`=`buffer(CONFLATED)`/`collectLatest`-restarts + fusion-combined-capacity claims kept. co-0040 — q 67→48 (`Build...` dropped, `Search-as-you-type` restated); debounce-300 + `distinctUntilChanged`-dedupe + `flatMapLatest`-cancels claims kept. co-0041 — q 78→77 (`vs`→`,`); re-emits-when-any + `zip`-lock-step-shortest/`merge`-interleave + one-`UiState`-flow claims kept. co-0042 — q 53→51 (imperative→`how?`); `retryWhen`-transient-only + re-collects-upstream + jitter/thundering-herd claims kept (B0 trimmed to 21w, `at most three tries` dropped as recoverable detail). co-0043 — q 74→70 (`vs`→`,`); default-cold-sequential + breaks-emission-context + `callbackFlow`-specialised/`awaitClose` claims kept. co-0044 — q 77→56 (V9: drafts 80 and 79 > 77 — `(say LocationManager)` example dropped); `awaitClose`-throws-and-leaks + `trySend`-from-callback + RENDEZVOUS-silent-fail claims kept. co-0045 — q 129→118 (V9: first draft 130 > 129 — `How do you design` → `...— how?`); capacities/overflow-enumeration + DROP_OLDEST-bounded/UNLIMITED-OOM + `close()`-vs-`cancel()` claims kept. co-0046 — q 96→94 (V9: `Make a case for each.` = 101 > 96 — `Case for each?`); replay-0-drops-while-STOPPED + Channel-exactly-once/breaks-two-collectors + state-`onEventConsumed()` claims kept. co-0047 — q 96→88 (`vs`→`,` two-part split); always-value/conflated/dedupes + no-initial-value/events + LiveData-main-thread-bound/no-KMP claims kept. co-0048 — q 70→68 (first-person dropped); conflates-by-`equals` + mutable-in-place/`Array`-field-no-op + `update { it.copy(...) }` claims kept. No exceptions. Committed.

- [X] T037 [US1] [US2] **Calendar checkpoint — coroutines-flow (R-007)**: before the final batch (T038) is begun, project release `2026.08.22` against the windows (≤ **2026-09-06** gate 10, ≤ **2026-09-13** gate 11), decide and record the outcome inline under this task in `specs/005-plain-english-qa/tasks.md`.

    **Record (2026-08-18)**: release `2026.08.22` dated 2026-08-18 sits 19 days inside gate 10 (≤ 2026-09-06) and 26 days inside gate 11 (≤ 2026-09-13) — comfortably inside both windows, same margin profile as T017 (kotlin) and T029 (compose). Oldest refs `checked` in the coroutines pack set: 2026-08-10. Decision: **proceed, no action.**

- [X] T038 [US1] [US2] **Final coroutines-flow batch** (do not begin until T037's checkpoint is decided): rewrite `q` + `shortAnswer` for all **7 items** (`co-0049`–`co-0055`) in `content/packs/coroutines-g-5.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 7 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 7/7). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: co-0049 — q 124→121 (argument-order flipped); `replay + extraBufferCapacity`/default-no-buffer/`emit`-suspends + event-bus-`extraBufferCapacity=1`-DROP_OLDEST/`replay=0` + `Channel(BUFFERED).receiveAsFlow()`/`subscriptionCount` claims kept (B2 trimmed to 24w, `with its audience` dropped). co-0050 — q 127→120 (`justify every one of` → `justify each of`); scope-bounds/`onCleared()`-not-a-moment-later + starts-first/stops-5s-after-last/rotation-grace + initial-value-must-be-real-`Loading` claims kept (B1 trimmed to 25w, Room-query/socket detail dropped). co-0051 — q 87→71 (`exactly`/`one` dropped, two-part split); ordinary-scope-with-`SupervisorJob()`-lazily-cached + cleared-`onCleared()`-runs-last/`DESTROYED` + `viewLifecycleOwner` claims kept (B1 trimmed to 20w, order-of-cancellation kept). co-0052 — q 80→61 (scope prefix dropped from code); freezes-consumer-only/`launchWhenStarted`-producer-keeps-running + `repeatOnLifecycle`-cancels-whole-collection-really-unregisters + `flowWithLifecycle`-operator-form claims kept (B2 trimmed to 16w, cost-claim dropped). co-0053 — q 105→86 (`versus`→`vs`, two-part split); composition-not-lifecycle-aware + `lifecycle-runtime-compose`/`minActiveState`-STARTED + neither-fixes-constructed-flow/recomposition claims kept. co-0054 — q 122→111 (`to the app` dropped); process-scoped-`ViewModelStore`-dies/`onCleared()`-never-called + saved-instance-state-bundle/`getStateFlow` + small-parcelable-identity/re-derive claims kept (B0 trimmed to 24w, B2 trimmed to 25w with `Bundle ceiling: ~1 MB` folded in). co-0055 — q 124→117 (`Debug it.` → `What went wrong?`); `runTest`-waits-for-all/collecting-hot-flow-never-completes + `backgroundScope`/Turbine-cancels-own-collector + real-dispatcher/`TestDispatcher`s-no-shared-scheduler/virtual-time claims kept (B0 trimmed to 25w, B2 trimmed to 24w, `StandardTestDispatcher` detail dropped). No exceptions. **Coroutines-flow track content complete: 55/55 items across 6 packs.** Committed.

- [X] T039 [US1] [US2] **Release gate — coroutines-flow** (55 items): as T019, via `tools/sync-manifest.mjs`, with `--release 2026.08.22 --summary "Questions and short answers reworded in simple English (55 items)." --date <YYYY-MM-DD>` (≤ **2026-09-06**; the T037 decision governs), then validate again and run the per-release browser verification. Record the outcome inline under this task.

    **Record (2026-08-18)**: All 55 coroutines items stamped `updatedIn: "2026.08.22"` across the 6 packs (batch-gate contract, per T019's correction). Gate-13 audit over the full validator prose surface (`q`/`answer`/`shortAnswer`/`prompt`/`referenceAnswer`/`framework`): 12 of 55 coroutines items flagged as shipping version claims (`co-0004`, `co-0006`, `co-0023`, `co-0031`, `co-0032`, `co-0037`, `co-0039`, `co-0043`, `co-0052`, `co-0053`, `co-0054`, `co-0055`) — matches the gate's own "12 shipped by 2026.08.22" exactly; all 12 have `refs` with `checked` in 2026-08-07..2026-08-18 (oldest in track: 2026-08-10), 0 uncovered. First audit pass scanned only `q`+`shortAnswer` (5 flagged) — widened to the full prose set to match the gate. `check-refs.mjs coroutines`: 26 ok, **16 unverified, 0 broken** — the unverified are all `developer.android.com` URLs that bot-block node's undici fetch (TLS fingerprint; `curl`/node `https` get 200/302), same environmental cause as T031; recorded honestly, manual pass deferred to T120. `sync-manifest.mjs --write --release 2026.08.22 --summary "Questions and short answers reworded in simple English (55 items)." --date 2026-08-18` — manifest version → 2026.08.22. Post-cut `validate.mjs` exit 0; gate 10 ✓ (every ref on items shipped by 2026.08.22 verified within 30 days of 2026-08-18). Per-release browser verification: human-pending (T120). **Coroutines-flow release 2026.08.22 cut — 55/55 items in Very Simple English.** Committed.

**Checkpoint**: coroutines-flow released as `2026.08.22`.

---

### Platform — 60 items · 7 packs · release `2026.08.23` · gate-10 window ≤ 2026-09-06

Word-bound load is heavy here: 70/180 bullets over 25 words (R-006).

- [X] T040 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **6 items** (`pf-0001`–`pf-0006`) in `content/packs/platform.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 6 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 6/6). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: pf-0001 — q 75→71 (two-part split); config-change-process-alive/`ViewModel`-survives + OS-kills-process/rebuilds-from-saved-`Bundle` + same-screen-return/`SavedStateHandle` claims kept (B1 trimmed to 24w, B2 trimmed to 25w). pf-0002 — q 65→62 (two-part split); main-thread-too-long windows + busy-or-blocked-causes + trace-first-main-thread-stack claims kept (B0 trimmed to 24w, `ForegroundServiceDidNotStartInTime` dropped; B2 first draft 28w > 25 — trimmed to 20w; `you can't` → `you cannot`). pf-0003 — q 89→79 (four candidates up front); WorkManager-deferrable + foreground-service-declared-type + AlarmManager-exact-timing claims kept, bullets untouched. pf-0004 — q 86→70 (`...you must know` dropped); API-36/31-Aug-2026 + 16KB-1-Feb-2027 + Android-17-local-network claims kept (B0 trimmed to 24w, extension-window-to-1-Nov dropped). pf-0005 — q 67→63 (two-part split); kernel-driver-thread-pool + ~1MB-shared-buffer + `onSaveInstanceState`/`Intent` claims kept (B0 trimmed to 24w, `Activity`/`ContentProvider` examples dropped; B1 trimmed to 25w). pf-0006 — q 68→64 (two-part split); long-lived-holding-short-lived + usual-suspects + LeakCanary/GC-root claims kept (B1 trimmed to 24w, Fragment-`viewLifecycleOwner` variant dropped as recoverable detail). No exceptions. Committed.

- [X] T041 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **4 items** (`pf-0007`–`pf-0010`) in `content/packs/platform-b.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 4 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 4/4). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: pf-0007 — q 63→61 (V9: first draft `..., and when do they matter?` = 65 > 63 — `and` dropped); **B0 kept at 39w — canonical four-launch-mode enumeration, existing FR-012a exception, not touched**; `singleTop`-routine/`singleTask`-smell + flags-override-manifest claims kept. pf-0008 — q 75→75 (two-part split); request-at-point-of-need/three-outcomes + Photo-Picker-no-permission + partial-media-access claims kept (B0 trimmed to 25w). pf-0009 — q 86→82 (two-part split); deep-link-scheme/chooser + App-Link-verified/`assetlinks.json` + autoVerify/untrusted-input claims kept (B0 trimmed to 25w, chooser-dialog detail dropped; B1 trimmed to 23w, `on your domain` dropped). pf-0010 — q 81→65 (`Walk through` dropped); lifecycle-chain + symmetric-pairing + separate-view-lifecycle claims kept (B0 trimmed to 16w with visibility claim folded). No new exceptions. Committed.

- [X] T042 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`pf-0011`–`pf-0020`) in `content/packs/platform-g-1.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 10 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 10/10). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: pf-0011 — q 100→79 (`Walk through` dropped); started-vs-bound + `START_*`-return-values + main-thread-callbacks/`stopSelf` claims kept (B0 trimmed to 21w, B2 trimmed to 22w, `until the process is killed` dropped). pf-0012 — q 73→64 (grammar `How does... work, why does it matter?`); provider-before-`Application.onCreate` + dummy-provider-auto-init + binder-thread-not-main claims kept, bullets untouched. pf-0013 — q 65→61 (two-part split); main-thread/10-60s + manifest-receivers/`android:exported`/Android-8 + misuse-ANR-trampoline claims kept (B0 trimmed to 24w). pf-0014 — q 121→117 (two-part split); back-stack-view-destroyed + `this`-vs-`viewLifecycleOwner`-re-registers + view-related-fix claims kept (B0 trimmed to 19w, B1 trimmed to 21w). pf-0015 — q 70→66 (two-part split); destroys-recreates-process-alive + `ViewModelStore`-retained/process-scoped + identifiers-not-payloads claims kept (B0 trimmed to 23w, B1 trimmed to 18w). pf-0016 — q 141→137 (three-part split); last-registered-first + swipe-animation/asks-in-advance + opposite-of-`onBackPressed` claims kept (B1 trimmed to 25w, `enableOnBackInvokedCallback` dropped as recoverable detail). pf-0017 — q 100→84 (`Walk through` dropped, dash question); launcher-asks/`zygote`-fork + attachBaseContext→providers→`Application.onCreate`→first-`Activity` + cold-start-tax claims kept (B0 trimmed to 20w, B1 trimmed to 22w, `Choreographer` frame dropped; B2 trimmed to 23w). pf-0018 — q 88→75 (`actually` dropped, two-part split); start-or-bind/mandatory-with-filter + filtered-fails/unfiltered-`false` + attack-surface/validate-intent claims kept (B0 trimmed to 25w, B2 26w > 25 → trimmed to 21w, `when another app needs access` dropped). pf-0019 — q 106→102 (two-part split); redirection-carries-grants + Android-14-blocks-implicit-to-non-exported + fresh-`Intent`-validated-data claims kept, bullets untouched. pf-0020 — q 105→101 (`How does`→`How do`, `has to`→`must`); visible-not-focused/`onPause`-not-hidden + cutout-insets + foldables-same-problem claims kept (B0 trimmed to 22w, B2 trimmed to 20w, `in disguise`/`handled as` dropped). No exceptions. Committed.

- [X] T043 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`pf-0021`–`pf-0030`) in `content/packs/platform-g-2.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 10 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 10/10). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: pf-0021 — q 96→85 (`Explain` dropped); `Looper.loop()`-reads-`MessageQueue` + `Handler`-posts/`handleMessage`-on-owner-thread + `nativePollOnce`/busy-main claims kept (B1 trimmed to 21w, B2 trimmed to 23w, `exactly` dropped). pf-0022 — q 99→90 (`Trace` dropped); fixed-rate/`SurfaceFlinger`-vsync/`Choreographer`-drives + input-animation-measure/layout/draw + budget-miss/jank claims kept (B0 trimmed to 23w, B1 trimmed to 22w after 26w draft — `on the next vsync` dropped, `RenderThread` detail gone; B2 trimmed to 23w). pf-0023 — q 86→81 (`Walk through` → two-part question); proxy/stub-`Binder`-pair + `oneway`-fire-and-forget/in-order + binder-thread-callbacks claims kept (B0 trimmed to 24w after 26w draft). pf-0024 — q 98→94 (two-part split); reflection-slow/breaks-on-version + hand-written-`Parcel`-`CREATOR` + sync/not-stable-storage/`TransactionTooLargeException` claims kept (B2 trimmed to 23w). pf-0025 — q 74→70 (two-part split); generational-copying-GC/bump-pointer + stop-the-world-pauses/churn + OOM-not-leak/profiling claims kept (B0 trimmed to 23w, B2 trimmed to 25w). pf-0026 — q 78→74 (two-part split); importance-level/`oom_adj`/LMK + `onTrimMemory`-before-kill + `onDestroy`-not-guaranteed claims kept, bullets untouched. pf-0027 — q 82→69 (`actually` dropped, two-part split); `WeakReference`+`ReferenceQueue`-not-enqueued + shortest-path-leak-trace + first-frame-in-own-code claims kept (B0 trimmed to 24w, B2 trimmed to 22w). pf-0028 — q 85→81 (two-part split); Doze-maintenance-windows + buckets-rate-engagement + no-exact-timing/FCM-escape-hatch claims kept, bullets untouched. pf-0029 — q 70→68 (`can't`→`can you not`, two-part split); no-`Activity`/no-background-`Service` + user-visible-exceptions + `startForegroundService`-10s claims kept, bullets untouched. pf-0030 — q 109→109 (V9: first draft `— what are they?` version = 116 > 109, second 112 > 109 — final `What are the foreground service types...? When does...`); type+permission-or-crash + Play-checks-core-function/timeouts + UIDT-replacement claims kept, bullets untouched. No exceptions. Committed.

- [X] T044 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`pf-0031`–`pf-0040`) in `content/packs/platform-g-3.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 10 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 10/10). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: pf-0031 — q 76→72 (two-part split); normal-silent/dangerous-runtime + signature-same-cert + special-access-toggles claims kept, bullets untouched. pf-0032 — q 95→91 (two-part split); no-blanket-read/write + `MediaStore`-vs-SAF + `MANAGE_EXTERNAL_STORAGE`-last-resort claims kept (B0 26w > 25 → trimmed to 25w; B1 trimmed to 22w, `ACTION_OPEN_DOCUMENT` dropped). pf-0033 — q 88→84 (two-part split); app-specific-no-permission + `filesDir`-vs-external + shared-storage-different claims kept, bullets untouched. pf-0034 — q 88→82 (`Go deep on` dropped); `setExpedited()`/`OutOfQuotaPolicy` + chains/`enqueueUniqueWork` + testing-`TestListenableWorkerBuilder`/test-driver claims kept, bullets untouched. pf-0035 — q 87→83 (two-part split); wall-clock-timing + exact-alarm-permission/Doze-windows + deferrable-`JobScheduler`/WorkManager claims kept, bullets untouched. pf-0036 — q 112→91 (`Walk through` dropped, `actually` dropped); channel-importance-Android-8 + `POST_NOTIFICATIONS`-runtime-denied-dropped + importance-decides-intrusiveness claims kept, bullets untouched. pf-0037 — q 76→72 (two-part split); full-screen-intent/`USE_FULL_SCREEN_INTENT` + trampoline-blocked-since-12 + `PendingIntent`-direct/heads-up-fallback claims kept (B0 trimmed to 23w, B1 trimmed to 22w, `before an Activity starts`/`targetSdk 31+` dropped). pf-0038 — q 91→78 (`actually` dropped, two-part split); token/`FLAG_IMMUTABLE`-default-since-12 + `FLAG_MUTABLE`-direct-reply/attacker + explicit-flag-rule claims kept (B0 trimmed to 22w, `before it fires` dropped; B1 trimmed to 24w, `also` dropped). pf-0039 — q 94→81 (`actually` dropped, three-part split); draws-under-bars + insets-as-padding + double-padding-bug claims kept (B0 trimmed to 25w, B1 kept, B2 trimmed to 23w). pf-0040 — q 77→73 (two-part split); per-app-language-Android-13 + config-change-recreate + wrong-locale-traps claims kept (B0 trimmed to 24w, `AppCompatDelegate` variant dropped). No exceptions. Committed.

- [X] T045 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`pf-0041`–`pf-0050`) in `content/packs/platform-g-4.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 10 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 10/10). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: pf-0041 — q 82→78 (two-part split); `uiMode`/`DayNight`/`values-night` + theme-attributes + `setDefaultNightMode`/recreate claims kept, bullets untouched. pf-0042 — q 120→99 (`Walk through` dropped, `actually` dropped); bump-run-fix-ship + keyed-by-targetSdk + painful-runtime-changes claims kept (B0 trimmed to 24w, `in Gradle` dropped; B1 trimmed to 16w, `Compat`-class-behave-old sentence dropped; B2 trimmed to 23w, full-screen-intents dropped). pf-0043 — q 62→60 (`around`→`with`); 13+-no-longer-grant/16-`NEARBY_WIFI_DEVICES` + data-safety-must-match + self-attested-not-code-scanned claims kept (B0 trimmed to 22w). pf-0044 — q 90→86 (two-part split); three-execution-ways + `--compiler-filter`/speed-profile + JIT/AOT-cooperate claims kept (B0 trimmed to 23w). pf-0045 — q 69→65 (two-part split); 64K-references/multidex + automatic-since-minSdk-21/startup-cost + compression/`dex-merger`/shrink-surface claims kept (B0 trimmed to 24w, B1 trimmed to 23w, `real` dropped). pf-0046 — q 82→78 (two-part split); CPU-heavy/NDK + C-ABI-overhead-batch + native-memory/JNI-misuse-`GlobalRef` claims kept (B1 trimmed to 25w, `one field at a time` dropped; B2 trimmed to 23w, SEGV/heap-corruption dropped). pf-0047 — q 72→63 (`actually`/`under the hood` kept minimal); kernel-driver-mediates + one-copy-no-socket + kernel-managed-threads/nodes claims kept (B0 trimmed to 25w after 26w draft, `(parcel plus target)` dropped; B1 trimmed to 24w, `no userspace handshake` dropped; B2 trimmed to 25w, `before a call` dropped). pf-0048 — q 113→109 (two-part split); started-vs-bound + async-bind/`onServiceConnected`-main-thread + unbind/ANR-bugs claims kept (B0 trimmed to 21w, `exists to be called` dropped; B2 trimmed to 20w). pf-0049 — q 79→75 (two-part split); several-`Context`s + `Application`-safe-to-hold + `Activity`-theme/window-leaks claims kept (B1 trimmed to 23w, `anything that outlives an Activity`→`long-lived state`; B2 trimmed to 24w). pf-0050 — q 95→82 (`actually` dropped, two-part split); controller-saves-restores + ViewModel-facing-API + when-needed/exceptions claims kept (B0 trimmed to 21w, B2 trimmed to 24w). No exceptions. Committed.

- [X] T046 [US1] [US2] **Calendar checkpoint — platform (R-007)**: before the final batch (T047) is begun, project release `2026.08.23` against the windows (≤ **2026-09-06** gate 10, ≤ **2026-09-13** gate 11), decide and record the outcome inline under this task in `specs/005-plain-english-qa/tasks.md`.

    **Record (2026-08-18)**: release `2026.08.23` dated 2026-08-18 sits 19 days inside gate 10 (≤ 2026-09-06) and 26 days inside gate 11 (≤ 2026-09-13) — same margin profile as T017/T029/T037. Decision: **proceed, no action.**

- [X] T047 [US1] [US2] **Final platform batch** (do not begin until T046's checkpoint is decided): rewrite `q` + `shortAnswer` for all **10 items** (`pf-0051`–`pf-0060`) in `content/packs/platform-g-5.json`, run the full batch gate, record the outcome inline under this task.

    **Record (2026-08-18)**: 10 items. Validator exit 0, 0 new warnings. Scope check 0 failures (ids 10/10). Screens: 0 collisions, 0 new near-duplicates. Read-through vs `fef2e12`: pf-0051 — q 97→93 (two-part split); `Looper`-message-loop/`Handler`-posts + `HandlerThread`-serial-queue + main-`Looper`-ANR claims kept (B0 trimmed to 20w, `so it is how you jump onto a specific thread` dropped; B2 trimmed to 25w after 26w draft — `.getMainLooper`-split token trap, `just` dropped). pf-0052 — q 96→92 (two-part split); explicit-names vs implicit-declares + action/category/data matching + `resolveActivity`/chooser claims kept (B0 trimmed to 22w; B1 trimmed to 22w). pf-0053 — q 71→62 (`actually` dropped); 5s/10s-timeout + `/data/anr/`-trace + main-stack-first claims kept (B0 trimmed to 22w, `and did not finish the event` dropped; B1 trimmed to 25w; B2 trimmed to 23w, `a binder call`→`binder`). pf-0054 — q 92→79 (`actually` dropped); qualified-directories + fixed-order + specificity rule claims kept (B2 trimmed to 25w, `at each step if it matches exactly`→`exact matches win`, `the base`→`base`). pf-0055 — q 70→66 (two-part split); four-components + start-methods + manifest/`android:exported`-12+ claims kept (B0 trimmed to 21w, `system or app`/`to other apps` dropped; B2 trimmed to 25w, `which is` dropped). pf-0056 — q 98→86 (`Walk through` dropped, em-dash splice); `content://<authority>/<path>` + `UriMatcher`/`Cursor` + pitfalls claims kept (B0 trimmed to 25w, `(manifest android:authorities)` dropped; B2 trimmed to 21w). pf-0057 — q 94→90 (two-part split); register-once + contracts list + STARTED/register-early claims kept (B0 left at 25w, B2 trimmed to 24w, `that trips people` dropped). pf-0058 — q 62→58 (two-part split); event-stream + dispatch chain + consume-stops claims kept (B0 trimmed to 18w, `multitouch`/`from the system`/`ViewGroup.` prefix dropped). pf-0059 — q 80→76 (two-part split); `IBinder`-identifies + context-carries-token + `BadTokenException` claims kept (B0 trimmed to 23w, `and attach new windows to it`/`to display` dropped; B1 trimmed to 22w). pf-0060 — q 76→72 (two-part split); Doze/App-Standby + whitelist-user-grant + WorkManager-exception claims kept (B1 trimmed to 24w; B2 trimmed to 25w, `to remember` dropped). No exceptions. Committed.

- [X] T048 [US1] [US2] **Release gate — platform** (60 items): as T019, via `tools/sync-manifest.mjs`, with `--release 2026.08.23 --summary "Questions and short answers reworded in simple English (60 items)." --date <YYYY-MM-DD>` (≤ **2026-09-06**; the T046 decision governs), then validate again and run the per-release browser verification. Record the outcome inline under this task.

    **Record (2026-08-18)**: platform track complete. Stamped `updatedIn: 2026.08.23` on all 60 items (7 packs). Gate-13 screen: 32 items shipped by 2026.08.23 — audited all 32: every one has ≥1 ref, checked dates 2026-08-07/2026-08-13, 0 uncovered (full-prose scan of all 60 items: 0 flagged). `check-refs.mjs platform`: 72 URLs — 2 ok, 70 unverified (known developer.android.com/source.android.com bot-block of undici; `curl`/node `https` work), 0 broken — same environmental caveat as T039. `sync-manifest.mjs --write --release 2026.08.23 --summary "Questions and short answers reworded in simple English (60 items)." --date 2026-08-18` → manifest version `2026.08.23`. Post-cut validate exit 0, 0 new warnings; gate 10 ✓ (every ref on items shipped by 2026.08.23 verified within 30 days), gate 11 ✓ (stackSnapshot re-verified 2026-08-14). Browser verification (app loads, no console errors, cheat-sheet stack snapshot renders, sync shows no updates): deferred to T120 batched pass. Committed.

**Checkpoint**: platform released as `2026.08.23`.

---

### Build-Testing — 60 items · 7 packs · release `2026.08.24` · gate-10 window ≤ **2026-09-08**

The largest word-bound load in the library: 100/180 bullets over 25 words (R-006) — expect the most
FR-012a recorded exceptions here. Its oldest ref is `checked` 2026-08-09, so its gate-10 window closes
**2026-09-08** (R-007).

- [ ] T049 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for both **2 items** (`bt-0001`–`bt-0002`) in `content/packs/build-testing.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T050 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`bt-0003`–`bt-0012`) in `content/packs/build-testing-g-1.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T051 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`bt-0013`–`bt-0022`) in `content/packs/build-testing-g-2.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T052 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`bt-0023`–`bt-0032`) in `content/packs/build-testing-g-3.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T053 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`bt-0033`–`bt-0042`) in `content/packs/build-testing-g-4.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T054 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`bt-0043`–`bt-0052`) in `content/packs/build-testing-g-5.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T055 [US1] [US2] **Calendar checkpoint — build-testing (R-007)**: before the final batch (T056) is begun, project release `2026.08.24` against the track's windows — gate 10 closes **2026-09-08** here (oldest ref `checked` 2026-08-09), gate 11 closes **2026-09-13** — decide and record the outcome inline under this task in `specs/005-plain-english-qa/tasks.md`.

- [ ] T056 [US1] [US2] **Final build-testing batch** (do not begin until T055's checkpoint is decided): rewrite `q` + `shortAnswer` for all **8 items** (`bt-0053`–`bt-0060`) in `content/packs/build-testing-g-6.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T057 [US1] [US2] **Release gate — build-testing** (60 items): as T019, via `tools/sync-manifest.mjs`, with `--release 2026.08.24 --summary "Questions and short answers reworded in simple English (60 items)." --date <YYYY-MM-DD>` (≤ **2026-09-08**; the T055 decision governs), then validate again and run the per-release browser verification. Record the outcome inline under this task.

**Checkpoint**: build-testing released as `2026.08.24`.

---

### Security-KMP — 70 items · 8 packs · release `2026.08.25` · gate-10 window ≤ 2026-09-06

- [ ] T058 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **3 items** (`sk-0001`–`sk-0003`) in `content/packs/security-kmp.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T059 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`sk-0004`–`sk-0013`) in `content/packs/security-kmp-g-1.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T060 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`sk-0014`–`sk-0023`) in `content/packs/security-kmp-g-2.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T061 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`sk-0024`–`sk-0033`) in `content/packs/security-kmp-g-3.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T062 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`sk-0034`–`sk-0043`) in `content/packs/security-kmp-g-4.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T063 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`sk-0044`–`sk-0053`) in `content/packs/security-kmp-g-5.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T064 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`sk-0054`–`sk-0063`) in `content/packs/security-kmp-g-6.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T065 [US1] [US2] **Calendar checkpoint — security-kmp (R-007)**: before the final batch (T066) is begun, project release `2026.08.25` against the windows (≤ **2026-09-06** gate 10, ≤ **2026-09-13** gate 11), decide and record the outcome inline under this task in `specs/005-plain-english-qa/tasks.md`.

- [ ] T066 [US1] [US2] **Final security-kmp batch** (do not begin until T065's checkpoint is decided): rewrite `q` + `shortAnswer` for all **7 items** (`sk-0064`–`sk-0070`) in `content/packs/security-kmp-g-7.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T067 [US1] [US2] **Release gate — security-kmp** (70 items): as T019, via `tools/sync-manifest.mjs`, with `--release 2026.08.25 --summary "Questions and short answers reworded in simple English (70 items)." --date <YYYY-MM-DD>` (≤ **2026-09-06**; the T065 decision governs), then validate again and run the per-release browser verification. Record the outcome inline under this task.

**Checkpoint**: security-kmp released as `2026.08.25`.

---

### Architecture — 50 items · 7 packs · release `2026.08.26` · gate-10 window ≤ 2026-09-06

Second-heaviest word-bound load: 90/150 bullets over 25 words (R-006); also hosts the library's longest
question (`ar-0001`, 215 chars — the reference batch already worked the shape).

- [ ] T068 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **4 items** (`ar-0001`–`ar-0004`) in `content/packs/architecture.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T069 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **3 items** (`ar-0005`–`ar-0007`) in `content/packs/architecture-b.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T070 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`ar-0008`–`ar-0017`) in `content/packs/architecture-g-1.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T071 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`ar-0018`–`ar-0027`) in `content/packs/architecture-g-2.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T072 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`ar-0028`–`ar-0037`) in `content/packs/architecture-g-3.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T073 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **10 items** (`ar-0038`–`ar-0047`) in `content/packs/architecture-g-4.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T074 [US1] [US2] **Calendar checkpoint — architecture (R-007)**: before the final batch (T075) is begun, project release `2026.08.26` against the windows (≤ **2026-09-06** gate 10, ≤ **2026-09-13** gate 11), decide and record the outcome inline under this task in `specs/005-plain-english-qa/tasks.md`.

- [ ] T075 [US1] [US2] **Final architecture batch** (do not begin until T074's checkpoint is decided): rewrite `q` + `shortAnswer` for all **3 items** (`ar-0048`–`ar-0050`) in `content/packs/architecture-g-5.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T076 [US1] [US2] **Release gate — architecture** (50 items): as T019, via `tools/sync-manifest.mjs`, with `--release 2026.08.26 --summary "Questions and short answers reworded in simple English (50 items)." --date <YYYY-MM-DD>` (≤ **2026-09-06**; the T074 decision governs), then validate again and run the per-release browser verification. Record the outcome inline under this task.

**Checkpoint**: architecture released as `2026.08.26`.

---

### Data-Networking — 40 items · 5 packs · release `2026.08.27` · gate-10 window ≤ 2026-09-06

Word-bound load: 71/120 bullets over 25 words (R-006).

- [ ] T077 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **4 items** (`dn-0001`–`dn-0004`) in `content/packs/data-networking.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T078 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **9 items** (`dn-0005`–`dn-0013`) in `content/packs/data-networking-g-1.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T079 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **9 items** (`dn-0014`–`dn-0022`) in `content/packs/data-networking-g-2.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T080 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **9 items** (`dn-0023`–`dn-0031`) in `content/packs/data-networking-g-3.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T081 [US1] [US2] **Calendar checkpoint — data-networking (R-007)**: before the final batch (T082) is begun, project release `2026.08.27` against the windows (≤ **2026-09-06** gate 10, ≤ **2026-09-13** gate 11), decide and record the outcome inline under this task in `specs/005-plain-english-qa/tasks.md`.

- [ ] T082 [US1] [US2] **Final data-networking batch** (do not begin until T081's checkpoint is decided): rewrite `q` + `shortAnswer` for all **9 items** (`dn-0032`–`dn-0040`) in `content/packs/data-networking-g-4.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T083 [US1] [US2] **Release gate — data-networking** (40 items): as T019, via `tools/sync-manifest.mjs`, with `--release 2026.08.27 --summary "Questions and short answers reworded in simple English (40 items)." --date <YYYY-MM-DD>` (≤ **2026-09-06**; the T081 decision governs), then validate again and run the per-release browser verification. Record the outcome inline under this task.

**Checkpoint**: data-networking released as `2026.08.27`.

---

### Performance — 40 items · 6 packs · release `2026.08.28` · gate-10 window ≤ 2026-09-06

- [ ] T084 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **3 items** (`pe-0001`–`pe-0003`) in `content/packs/performance.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T085 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **9 items** (`pe-0004`–`pe-0012`) in `content/packs/performance-g-1.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T086 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **9 items** (`pe-0013`–`pe-0021`) in `content/packs/performance-g-2.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T087 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **9 items** (`pe-0022`–`pe-0030`) in `content/packs/performance-g-3.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T088 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **9 items** (`pe-0031`–`pe-0039`) in `content/packs/performance-g-4.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T089 [US1] [US2] **Calendar checkpoint — performance (R-007)**: before the final batch (T090) is begun, project release `2026.08.28` against the windows (≤ **2026-09-06** gate 10, ≤ **2026-09-13** gate 11), decide and record the outcome inline under this task in `specs/005-plain-english-qa/tasks.md`.

- [ ] T090 [US1] [US2] **Final performance batch** (do not begin until T089's checkpoint is decided): rewrite `q` + `shortAnswer` for the single item `pe-0040` in `content/packs/performance-g-5.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T091 [US1] [US2] **Release gate — performance** (40 items): as T019, via `tools/sync-manifest.mjs`, with `--release 2026.08.28 --summary "Questions and short answers reworded in simple English (40 items)." --date <YYYY-MM-DD>` (≤ **2026-09-06**; the T089 decision governs), then validate again and run the per-release browser verification. Record the outcome inline under this task.

**Checkpoint**: performance released as `2026.08.28`.

---

### Behavioral — 25 items · 3 packs · release `2026.08.29` · gate-10 window ≤ 2026-09-06

The register's second-person direct address is already native to STAR-scenario questions — lightest qa
load (1/75 bullets over 25 words, R-006).

- [ ] T092 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **3 items** (`bh-0001`–`bh-0003`) in `content/packs/behavioral.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T093 [P] [US1] [US2] Batch: rewrite `q` + `shortAnswer` for all **11 items** (`bh-0004`–`bh-0014`) in `content/packs/behavioral-g-1.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T094 [US1] [US2] **Calendar checkpoint — behavioral (R-007)**: before the final batch (T095) is begun, project release `2026.08.29` against the windows (≤ **2026-09-06** gate 10, ≤ **2026-09-13** gate 11), decide and record the outcome inline under this task in `specs/005-plain-english-qa/tasks.md`.

- [ ] T095 [US1] [US2] **Final behavioral batch** (do not begin until T094's checkpoint is decided): rewrite `q` + `shortAnswer` for all **11 items** (`bh-0015`–`bh-0025`) in `content/packs/behavioral-g-2.json`, run the full batch gate, record the outcome inline under this task.

- [ ] T096 [US1] [US2] **Release gate — behavioral** (25 items): as T019, via `tools/sync-manifest.mjs`, with `--release 2026.08.29 --summary "Questions and short answers reworded in simple English (25 items)." --date <YYYY-MM-DD>` (≤ **2026-09-06**; the T094 decision governs), then validate again and run the per-release browser verification. Record the outcome inline under this task.

**Checkpoint**: behavioral released as `2026.08.29`. **All 10 qa tracks shipped — the qa tier (US1 +
US2) is complete: 545 questions and 1635 bullets in the full register, 0 instructional openers, every
track's release inside its freshness windows.**

---

## Phase 4: User Story 3 - Task prompts and reference sheets made clearer (Priority: P2)

**Goal**: All 84 non-qa items (60 `dsa`, 19 `design`, 5 `concept` cheat sheets) reviewed against the
**plain-words / short-sentences half** of the VSE register and simplified wherever that improves clarity
(FR-016) — a coding task stays a coding task, a design scenario stays a scenario, a cheat sheet stays a
compact reference (V17). The conversational half (direct address, chat tone) does **not** apply
(R-011). Every item ends the feature with a verdict — **simplified** or **already simple** (FR-017a: a
verdict, not an omission).

**Why this priority**: P2 — the smallest minority of the library (84/629), already task-shaped, judged
"a genuine part of 'most of the questions is not understandable', just a smaller one". It runs last so
it never delays a qa release (R-013).

**Independent Test** (spec.md US3): read each of the 84 prompts and their short answers; confirm each
either was simplified or is recorded as already simple (FR-017a, SC-007); confirm task, scenario and
reference form is intact (V17); confirm every claim survived (FR-017 binds FR-011/FR-013/FR-014 onto
these fields); confirm `node tools/validate.mjs` exits 0 after each batch.

**The batch gate** — steps 1–4 of Phase 3 apply **unchanged** (validator with zero-new-warnings delta,
scope check with the non-qa frozen-field set from T002, both screens, the two-question read-through with
"reads simple" judged by the plain-words half **and** form preservation). The batch record additionally
carries the **per-item verdict** — `simplified` or `already simple` — replacing the claim-count's role on
these batches (R-011, R-012).

**The release gate (non-qa variant, R-011)** — same steps as Phase 3's, with two differences: the
summary reads *"Task prompts and descriptions simplified (N items)."* and the release is cut **only if
at least one item on the track was touched** — a track whose every item was recorded "already simple"
ships **no release at all**: no edit, no stamp, no version bump (its items keep their current
`updatedIn`). Gate-10 windows: dsa and system-design close **2026-09-08** (oldest ref `checked`
2026-08-09); cheatsheets closes **2026-09-06**. Gate 11 binds every release at ≤ **2026-09-13**.

---

### DSA — 60 items · 9 packs · release `2026.08.30` · gate-10 window ≤ **2026-09-08**

Word-bound load: 7/180 bullets over 25 words on the plain-words tier (R-006); questions run 13–68
chars, median 45 — expect a mixed verdict distribution (R-011).

- [ ] T097 [P] [US3] Batch: rewrite `q` + `shortAnswer` for all **6 items** (`ds-0001`–`ds-0006`) in `content/packs/dsa.json`, run the full batch gate, record the outcome and per-item verdicts inline under this task.

- [ ] T098 [P] [US3] Batch: rewrite `q` + `shortAnswer` for all **8 items** (`ds-0007`–`ds-0014`) in `content/packs/dsa-b.json`, run the full batch gate, record the outcome and per-item verdicts inline under this task.

- [ ] T099 [P] [US3] Batch: rewrite `q` + `shortAnswer` for all **5 items** (`ds-0015`–`ds-0019`) in `content/packs/dsa-c.json`, run the full batch gate, record the outcome and per-item verdicts inline under this task.

- [ ] T100 [P] [US3] Batch: rewrite `q` + `shortAnswer` for all **7 items** (`ds-0020`–`ds-0026`) in `content/packs/dsa-g-1.json`, run the full batch gate, record the outcome and per-item verdicts inline under this task.

- [ ] T101 [P] [US3] Batch: rewrite `q` + `shortAnswer` for all **7 items** (`ds-0027`–`ds-0033`) in `content/packs/dsa-g-2.json`, run the full batch gate, record the outcome and per-item verdicts inline under this task.

- [ ] T102 [P] [US3] Batch: rewrite `q` + `shortAnswer` for all **7 items** (`ds-0034`–`ds-0040`) in `content/packs/dsa-g-3.json`, run the full batch gate, record the outcome and per-item verdicts inline under this task.

- [ ] T103 [P] [US3] Batch: rewrite `q` + `shortAnswer` for all **7 items** (`ds-0041`–`ds-0047`) in `content/packs/dsa-g-4.json`, run the full batch gate, record the outcome and per-item verdicts inline under this task.

- [ ] T104 [P] [US3] Batch: rewrite `q` + `shortAnswer` for all **7 items** (`ds-0048`–`ds-0054`) in `content/packs/dsa-g-5.json`, run the full batch gate, record the outcome and per-item verdicts inline under this task.

- [ ] T105 [US3] **Calendar checkpoint — dsa (R-007)**: before the final batch (T106) is begun, project release `2026.08.30` against the track's windows — gate 10 closes **2026-09-08** (oldest ref `checked` 2026-08-09), gate 11 closes **2026-09-13** — decide and record the outcome inline under this task in `specs/005-plain-english-qa/tasks.md`. Note: if every dsa item ends up "already simple", there is no release to schedule — record that instead.

- [ ] T106 [US3] **Final dsa batch** (do not begin until T105's checkpoint is decided): rewrite `q` + `shortAnswer` for all **6 items** (`ds-0055`–`ds-0060`) in `content/packs/dsa-g-6.json`, run the full batch gate, record the outcome and per-item verdicts inline under this task.

- [ ] T107 [US3] **Release gate — dsa** (60 items; the non-qa release-gate variant): if at least one dsa item was touched, `node tools/validate.mjs` (0/0), `node tools/check-refs.mjs dsa`, the gate 13 audit, then `node tools/sync-manifest.mjs --write --release 2026.08.30 --summary "Task prompts and descriptions simplified (N items)." --date <YYYY-MM-DD>` (≤ **2026-09-08**; the T105 decision governs; N = items actually touched), then validate again (gates 6/10/11/13). If **no** item was touched, record "no release" and move on — no edit, no stamp, no version bump (R-011). Record the outcome inline under this task.

**Checkpoint**: dsa reviewed 60/60 with verdicts; released as `2026.08.30` only if any item was touched.

---

### System-Design — 19 items · 5 packs · release `2026.08.31` · gate-10 window ≤ **2026-09-08**

- [ ] T108 [P] [US3] Batch: rewrite `q` + `shortAnswer` for all **3 items** (`sd-0000`–`sd-0002`) in `content/packs/system-design.json`, run the full batch gate, record the outcome and per-item verdicts inline under this task.

- [ ] T109 [P] [US3] Batch: rewrite `q` + `shortAnswer` for both **2 items** (`sd-0003`–`sd-0004`) in `content/packs/system-design-b.json`, run the full batch gate, record the outcome and per-item verdicts inline under this task.

- [ ] T110 [P] [US3] Batch: rewrite `q` + `shortAnswer` for all **4 items** (`sd-0005`–`sd-0008`) in `content/packs/system-design-g-1.json`, run the full batch gate, record the outcome and per-item verdicts inline under this task.

- [ ] T111 [P] [US3] Batch: rewrite `q` + `shortAnswer` for all **5 items** (`sd-0009`–`sd-0013`) in `content/packs/system-design-g-2.json`, run the full batch gate, record the outcome and per-item verdicts inline under this task.

- [ ] T112 [US3] **Calendar checkpoint — system-design (R-007)**: before the final batch (T113) is begun, project release `2026.08.31` against the track's windows — gate 10 closes **2026-09-08** (oldest ref `checked` 2026-08-09), gate 11 closes **2026-09-13** — decide and record the outcome inline under this task in `specs/005-plain-english-qa/tasks.md`.

- [ ] T113 [US3] **Final system-design batch** (do not begin until T112's checkpoint is decided): rewrite `q` + `shortAnswer` for all **5 items** (`sd-0014`–`sd-0018`) in `content/packs/system-design-g-3.json`, run the full batch gate, record the outcome and per-item verdicts inline under this task.

- [ ] T114 [US3] **Release gate — system-design** (19 items; the non-qa release-gate variant): as T107, via `tools/sync-manifest.mjs`, with `--release 2026.08.31 --summary "Task prompts and descriptions simplified (N items)." --date <YYYY-MM-DD>` (≤ **2026-09-08**; the T112 decision governs; N = items actually touched), or record "no release" if nothing was touched. Record the outcome inline under this task.

**Checkpoint**: system-design reviewed 19/19 with verdicts; released as `2026.08.31` only if any item
was touched.

---

### Cheatsheets — 5 items · 2 packs · release `2026.08.32` · gate-10 window ≤ 2026-09-06

- [ ] T115 [P] [US3] Batch: rewrite `q` + `shortAnswer` for all **3 items** (`cs-0001`–`cs-0003`) in `content/packs/cheatsheets.json`, run the full batch gate, record the outcome and per-item verdicts inline under this task.

- [ ] T116 [US3] **Calendar checkpoint — cheatsheets (R-007)**: before the final batch (T117) is begun, project release `2026.08.32` against the windows (≤ **2026-09-06** gate 10, ≤ **2026-09-13** gate 11), decide and record the outcome inline under this task in `specs/005-plain-english-qa/tasks.md`.

- [ ] T117 [US3] **Final cheatsheets batch** (do not begin until T116's checkpoint is decided): rewrite `q` + `shortAnswer` for both **2 items** (`cs-0004`–`cs-0005`) in `content/packs/cheatsheets-b.json`, run the full batch gate, record the outcome and per-item verdicts inline under this task.

- [ ] T118 [US3] **Release gate — cheatsheets** (5 items; the non-qa release-gate variant): as T107, via `tools/sync-manifest.mjs`, with `--release 2026.08.32 --summary "Task prompts and descriptions simplified (N items)." --date <YYYY-MM-DD>` (≤ **2026-09-06**; the T116 decision governs; N = items actually touched), or record "no release" if nothing was touched. Record the outcome inline under this task.

**Checkpoint**: all 84 non-qa items reviewed with verdicts (SC-007); the feature's content work is
complete.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T119 Run the final acceptance gate (quickstart.md "Feature completion"): from `/Users/nn/InterviewPrep`, `node tools/validate.mjs --final` must exit 0 — this promotes gates 4, 5, 8, 9 and 12 to errors, including gate 8 (0 unadjudicated near-duplicate pairs — SC-006). Then confirm the whole-feature table, all recorded, not recalled: the id set of all 89 packs is byte-identical to the T001 baseline (SC-005); all 90 batch records present with evidence-form read-throughs (FR-023); every non-qa item carries a verdict (SC-007); 0 instructional openers and 0 unsupported/unsourced version-date claims on rewritten items (SC-001, SC-004); every release registered with its summary and gate-13 audit (FR-024); `.claude/workflows/duplicates.json` holds every adjudicated pair with verdict and reason (SC-006); the release dates were decided at the per-track checkpoints, not at the gate (R-007). Record the outcome inline under this task.

- [ ] T120 Close the feature record in this `tasks.md`: consolidate the 90 batch outcomes (T003, T004-T096, T097-T118), the release-gate records and the final acceptance (T119) into a coherent completion record; confirm the 629 item identifiers match the T001 baseline byte-for-byte one last time (Constitution I); and record the FR-024 consequence explicitly — each release's `releases[]` summary says plainly what changed, and every touched item carries the release version in `updatedIn`, set by the manifest tooling only. Record the outcome inline under this task.

**Checkpoint**: feature complete — every batch recorded with evidence, `--final` exits 0, every release
registered, every story independently verifiable from its records.

---

## Requirement → Task Coverage

Every functional requirement in spec.md, and the task(s) that discharge it. Maintained so coverage is
checkable at a glance rather than by diffing spec.md against this file by hand. **If you add an FR to
spec.md, add its row here in the same edit.**

| FR | Task(s) | | FR | Task(s) |
|---|---|---|---|---|
| FR-001 | T004-T096 (all qa batches) | | FR-014 | all batches (read-through, V6), T119 |
| FR-002 | T003, all batches (step 4) | | FR-015 | T002 (scope check), all batches |
| FR-003 | all qa batches (screen 3.1/step 4) | | FR-016 | T097-T118 |
| FR-004 | all qa batches (V5) | | FR-017 | T097-T118 (read-through) |
| FR-005 | all qa batches (V8) | | FR-017a | T097-T118 (verdict records) |
| FR-006 | all batches (V14) | | FR-018 | T002, all batches (scope check) |
| FR-007 | all qa batches (screen 3.1) | | FR-019 | all batches (step 1), T119 |
| FR-008 | all qa batches (V9) | | FR-019a | all batches (step 1) |
| FR-008a | all qa batches (V9 exception path) | | FR-020 | T003, all batches (step 4) |
| FR-009 | all qa batches (V15) | | FR-021 | T001 (baseline), all batches (step 4) |
| FR-010 | T004-T096 (all qa batches) | | | |
| FR-011 | all batches (read-through) | | FR-022 | all batches (screen 3.2), T119 |
| FR-012 | all batches (V11) | | FR-023 | all batches (records), T119 |
| FR-012a | all batches (V11 exception path) | | FR-024 | T019, T031, T039, T048, T057, T067, T076, T083, T091, T096, T107, T114, T118, T120 |
| FR-013 | all batches (V13) | | FR-025 | T119 (SC-008 evidence) |
| | | | FR-026 | T003 |
| | | | **SC-001** | T004-T096 |
| | | | **SC-002** | all batches (read-through records) |
| | | | **SC-003** | T004-T096 |
| | | | **SC-004** | all batches (V6), release gates (gate 13), T119 |
| | | | **SC-005** | T001, T002, all batches, T119, T120 |
| | | | **SC-006** | all batches (screen 3.2), T119 |
| | | | **SC-007** | T097-T118, T119 |
| | | | **SC-008** | release gates (browser verification), T119 |

## Cross-Story File Overlap

Which files more than one story writes to, and the resulting ordering constraint. Surfaced here rather
than left to be discovered by reading plan.md's file list — every row is a potential same-file conflict
if two stories are worked concurrently.

| File | Stories (tasks) | Constraint |
|---|---|---|
| `content/manifest.json` | 13 release tasks (T019 … T118) | Written **only** by `tools/sync-manifest.mjs --write`; versions `2026.08.20 … 2026.08.32` must be cut in ascending version order (gate 6). Never hand-edited. |
| `.claude/workflows/duplicates.json` | every batch (screen 3.2) | Append-only ledger. Only a batch that flags a new pair writes it, but two concurrent batches adjudicating collide — commit adjudicating batches sequentially, never in parallel. |
| `specs/005-plain-english-qa/verification/scope-check.mjs` | T002 only | New file; every batch's step 2 depends on it existing. |
| `content/packs/*.json` (89 files) | reference batch (T003, 10 files) + their track's pack batch | T003 commits first; each of the 10 files is later re-visited by its track's batch for the remaining items. Same file, sequential commits — never concurrent (the scope check diffs against `git HEAD`, so ordering is enforced mechanically anyway). |
| `content/packs/<track>-*.json` | within a track only | Tracks are disjoint pack sets; no pack appears in two track batches. This is what makes all 89 pack batches `[P]` with respect to each other. |

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start immediately.
- **Foundational (Phase 2)**: depends on Setup. **Blocks all three stories** (T002 gates every batch;
  T003 fixes the standard every batch is judged against).
- **User Stories (Phases 3–4)**: Phase 3 (US1+US2) first, track by track in R-013's order (kotlin →
  behavioral); Phase 4 (US3) after Phase 3 — same mechanical gate, plan-level order (P2 priority, must
  not delay a qa release; not a same-file constraint).
- **Polish (Phase 5)**: depends on all content work being complete.

### User Story Dependencies

- **US1 + US2 (P1)**: depends on T001 (baseline) and T002 (scope check). Internal order per track:
  all pack batches after T003; the track's calendar checkpoint before its **final** batch; the release
  after the last batch. Tracks are sequential in R-013's order; batches within a track are parallel.
- **US3 (P2)**: depends on Phase 3 completing (R-013 ordering). Internal order mirrors the qa tracks;
  a non-qa release is cut only if any item was touched (R-011).

### Within Each Track

- The batch gate's steps are strictly ordered per batch: validator (before/after) → scope check →
  screens → the named read-through → commit + record. A batch is the unit of acceptance; there are no
  per-item exceptions (FR-020).
- Calendar checkpoint before the final batch; release gate after the last batch, with the release date
  decided at the checkpoint, never at the gate (R-007).

### Parallel Opportunities

- All 89 pack batches (T004-T096, T097-T118) touch disjoint pack files and are `[P]` — fully parallel
  with each other **once T003 has fixed the standard**. Caution: each batch still captures its own
  "immediately-before" validator run (FR-019a) and commits on its own; two batches adjudicating a
  near-duplicate pair must not run concurrently (the ledger is append-only, see Cross-Story File
  Overlap).
- The 13 calendar-checkpoint tasks and the 13 release-gate tasks are **not** `[P]`: each checkpoint
  gates its track's final batch, and the releases write the same `manifest.json` in version order.
- Tracks are sequential (R-013); a track's release cuts when its last batch passes.

---

## Parallel Example: the kotlin track (largest qa track)

```bash
# After T003 (reference batch) is accepted and committed, launch every remaining kotlin pack together
# — 13 disjoint files, no ordering; only T018 (final batch) must wait for T017's checkpoint:
Task: "Batch: kotlin-a.json (8 items), full gate, record (T004)"
Task: "Batch: kotlin-b.json (5 items), full gate, record (T005)"
Task: "Batch: kotlin-g-1.json (5 items), full gate, record (T006)"
# ... T007-T016, one task per pack ...
Task: "Calendar checkpoint — kotlin (T017)"      # decided before T018 begins
Task: "Final kotlin batch: kotlin-g-12.json (2 items) (T018)"
Task: "Release gate — kotlin, 2026.08.20 (T019)"
# Each batch captures its own before-run of `node tools/validate.mjs` (FR-019a) and commits alone.
```

## Parallel Example: the dsa track (largest non-qa track)

```bash
# After T003, launch the 8 non-final dsa packs together — 8 disjoint files:
Task: "Batch: dsa.json (6 items) + verdicts (T097)"
Task: "Batch: dsa-b.json (8 items) + verdicts (T098)"
Task: "Batch: dsa-c.json (5 items) + verdicts (T099)"
# ... T100-T104, one task per pack ...
Task: "Calendar checkpoint — dsa (T105)"         # decided before T106 begins
Task: "Final dsa batch: dsa-g-6.json (6 items) (T106)"
Task: "Release gate — dsa, 2026.08.30, only if any item touched (T107)"
```

---

## Implementation Strategy

### MVP First (the qa tier — User Stories 1 and 2)

1. Complete Phase 1 (Setup) — branch, baseline hash, validator clean.
2. Complete Phase 2 (Foundational) — scope check (T002) + reference batch (T003).
3. Complete Phase 3, kotlin track first — 14 batches, one release `2026.08.20`.
4. **STOP and VALIDATE**: this is the feature's user request — questions and short answers in very
   simple English — delivered on one full track, release-cut and browser-verified. Demoable.
5. Proceed track by track; each release is an independently shippable increment.

### Incremental Delivery

1. Setup + Foundational → gate machinery and standard fixed.
2. Each qa track: batches → calendar checkpoint → release (10 releases, `2026.08.20`–`2026.08.29`).
3. Non-qa tracks: batches with verdicts → release only if touched (`2026.08.30`–`2026.08.32`).
4. Polish: `--final` acceptance + completion record. Every track is complete before it ships
   (FR-024) — a candidate never sees a track where some items are simple and others are not.

### Parallel Team Strategy

- One contributor per track is the cleanest split (tracks are sequential); within a track, up to 13
  pack batches run in parallel once the reference batch is accepted.
- Any contributor can run a calendar checkpoint (it is a decision record, not authoring).
- The release gates are sequential by nature (one manifest writer) and are best done by whoever closes
  the track.

---

## Notes

- [P] tasks touch different files with no incomplete-task dependency between them.
- [Story] labels map every task back to its spec.md user story for traceability; qa batch tasks carry
  both `[US1]` and `[US2]` because R-002's one-pass-per-pack model delivers both fields in one batch.
- No task in this feature adds, removes, renumbers or reuses an item id — content tasks only ever touch
  `q`, `shortAnswer` and (at release time, via the manifest tooling) `updatedIn` (Constitution I,
  FR-018).
- **The baseline never moves** (R-001): every read-through compares against the hash recorded in T001,
  never against `HEAD` once the feature's own batches have changed it, never from memory (FR-021).
- The scope check compares against `git HEAD` ("what did *this batch* touch?"); the read-through
  compares against the feature baseline ("what did *this feature* change?") — the two are different
  questions and both are mandatory (batch-gate.md step 2 vs step 4).
- Word bounds are review signals with a recorded-exception path, never gates: a bullet over 25 words or
  a question longer than its baseline is reworked first; if preservation genuinely cannot fit, the item
  is accepted with a recorded exception naming item and reason (FR-012a, FR-008). **Preservation wins
  over every bound** — a claim is never deleted to fit a number.
- The batch gate's mechanical half (validator + scope check + screens) never certifies a batch on its
  own (FR-020): the two-question read-through fails independently — text can be perfectly accurate and
  still hard to parse, and it can sound friendly while having quietly dropped a caveat.
- Release dates are decided at each track's calendar checkpoint (before its final batch), not at the
  release gate, because at the release gate there is no time left to spend (R-007). Re-stamping a
  `checked` date without re-reading the primary source is a Principle IV violation.
- This feature adds no app code, no validator gate, no dependency and no build step — the entire
  apparatus is authoring discipline plus the existing 15-gate `validate.mjs