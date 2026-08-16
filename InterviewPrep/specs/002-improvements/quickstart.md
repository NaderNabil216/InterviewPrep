# Quickstart: Validating the Improvements Feature

**Feature**: `002-improvements` · **Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

How to prove each user story works. Every scenario maps to a Success Criterion in spec.md and is runnable
as written. App commands run from `/Users/nn/InterviewPrep` (the app root), **not** from this Spec Kit
subdirectory — this scaffold only holds planning docs.

## Prerequisites

```bash
cd /Users/nn/InterviewPrep
node --version   # ≥ 18
python3 --version
bash tools/serve.sh          # http://localhost:8777 — caching disabled, required (fetch() is blocked over file://)
node tools/validate.mjs      # must exit 0 before starting, and after every content batch below
```

A Chromium- or WebKit-based browser with DevTools (Network tab for offline simulation, Performance tab for
timing). For US6 only: a free RapidAPI account and a Judge0 CE subscription key, entered into the app's own
Settings once serving locally.

---

## US1 — Search/filter keeps up with typing (SC-001)

1. Open the search overlay, type a 10+ character query at normal speed.
2. Confirm every character appears in the box immediately (no visible input lag) — this was never actually
   the native `<input>`'s fault (see research.md R-001), so this should already hold; the real check is
   next.
3. Using DevTools Performance recording, confirm `search()` (and the results re-render) fire once, ~150ms
   after the last keystroke — not once per keystroke — and the visible result list settles within 300ms of
   pausing.
4. Repeat in the Topics view's keyword filter; confirm the URL/hash only updates after typing stops (not on
   every keystroke) and the item list narrows without the page stuttering.
5. Clear the query mid-typing; confirm the list returns to the prompt state with no stale flash.

## US2 — Fast, visibly-loading first launch (SC-002)

1. DevTools → Application → Clear site data (wipes IndexedDB + localStorage) to simulate a true cold cache.
2. Reload. Confirm a loading indicator is visible immediately (no blank white screen) and — using the
   Performance tab's timeline — that navigation/dashboard skeleton is interactive **within 1 second of
   first paint** (that is the measurement anchor: first paint → shell interactive, not navigation start →
   shell interactive), before every content pack has finished fetching (Network tab should show pack
   requests still in flight at that point).
3. Confirm the skeleton's content-derived figures (item counts, due/unseen counts, mastery percentages)
   render as neutral placeholders — not as `0` or `0%` — while packs are still in flight, and that they
   fill in with real values without a full-page flash once the content phase resolves (FR-005a).
4. Throttle to a slow CPU/network profile and reload. The 1-second number may not hold here, and that is
   allowed (FR-005b); what must still hold is the *ordering* — the shell renders and is interactive while
   pack requests are still pending, never after them.
5. Reload again without clearing storage (warm cache). Confirm the app renders from the stored snapshot
   immediately, matching today's existing offline-first feel — this path must not regress.

## US3 — Fully automatic content sync (SC-003)

1. With the site already loaded on an older manifest version, bump `content/manifest.json`'s `version` (a
   throwaway local edit for this test, not a real release) and reload, or wait for the `visibilitychange`/
   `online` triggers to fire while the tab is open.
2. Confirm the newer content is fetched and applied with **no button press** — a toast names what changed
   (e.g. "Content updated — N new, M changed") but nothing blocks or requires a decline/accept click.
3. Grep the rendered page and `index.html` for "Update", "Up to date", "What's New" — confirm none remain
   (`grep -ri "update\|what's new" index.html` plus a visual nav check).
4. Repeat with a plan that has ticked items whose underlying material changed; confirm the toast also names
   how many ticks were re-anchored, and that `Store.getPlanState().done` reflects the migrated signatures
   (not cleared) after the sync — this is the same `migrateTicks()` guarantee as before, just automatic.
5. Start a Drill session, then trigger a pending diff (per step 1) mid-session; confirm the sync does *not*
   apply until the session ends/navigates away (`App.sessionActive` gating, research.md R-003).
6. DevTools → Network → offline; leave the diff pending; go back online; confirm the sync completes without
   any user action.
7. **Partial-failure (FR-007a)**: with a pending diff, use DevTools → Network → request blocking to block
   one pack URL, then let the sync fire. Confirm it is abandoned cleanly — the stored snapshot still
   reports the *old* version, no toast appears, plan ticks are untouched, and no error is shown to the
   candidate. Unblock the URL and confirm the next trigger completes the sync normally.
8. **Unchanged-index cheapness (FR-011)**: with the disk manifest matching the stored snapshot, focus and
   blur the tab several times. Confirm the Network tab shows one small manifest request per trigger and
   **no pack requests at all**.

## US4 — One-tap progress marking (SC-004)

1. Open any question's answer in Topics, Drill, and Mock review. Confirm exactly one action, "Mark
   complete," is shown — no Again/Hard/Good/Easy choices anywhere.
2. Tap it; confirm the item's status dot updates and it's scheduled per the existing spaced-repetition
   queue (`node -e` a quick check of `localStorage['aip.v1.progress']` shape, or just confirm Drill's due-
   queue ordering still makes sense after several taps).
3. Tap "Mark complete" twice on the same item; confirm no double-count/corruption — it behaves like
   double-tapping "Good" did before this feature (documented, not silently new — research.md R-004).
4. Confirm mastery percentages (dashboard) still compute correctly after a batch of taps.
5. Confirm the action is behaviorally identical across all three surfaces — same recorded outcome, same
   scheduling effect — while allowing each view to place/label it to fit its own layout (FR-014).
6. **Legacy mock rows (FR-014b)**: with a `aip.v1.mockResults` entry from before this change (one carrying
   only `avgScore`), open the Mock landing view. Confirm the old session still appears in the history and
   trend display, labelled as the older metric, and was not rewritten into the new shape.

## US5 — Timer pauses on reveal (SC-005)

1. Start a Drill session; let the clock run a few seconds; reveal the answer; wait several seconds; confirm
   the displayed time did **not** advance during the wait; advance to the next question and confirm the
   clock resumes from where it froze (not from zero, not double-counting the wait).
2. Start a Mock session; reveal an answer; confirm the countdown freezes immediately and the *overall*
   session deadline (visible remaining minutes) is unaffected by how long the answer stays revealed — verify
   by timing a full mock run and confirming total elapsed wall-clock roughly equals reveal time + budget,
   not budget alone shrinking during reveals.

## US6 — Runnable DSA code (SC-006)

1. In Settings, paste a RapidAPI Judge0 CE key. Open any DSA item; confirm the scratch textarea is now a
   code editor pre-filled with `starter`, with a "Run" button (no more plain notes-only view).
2. Write a correct solution, press Run: confirm real `stdout` appears matching the item's `sampleCall`
   (see contracts/dsa-run-contract.md) — no pass/fail verdict, just the raw output.
3. Introduce a syntax error, press Run: confirm a readable compile error is shown in place of output.
4. Remove the Settings key (or use a browser profile without one), press Run: confirm a clear "Run needs
   setup" message, not a silent failure or spinner.
5. DevTools → Network → offline, press Run: confirm "Run needs a connection," and that the editor's
   in-progress code is untouched.
6. Press Run, then immediately press it again before the first resolves: confirm only the second result
   ever renders (the first request was aborted, not raced).
7. Navigate away and back to the same item: confirm the candidate's code is still there; confirm the
   *previous run's output* is **not** restored (view-local, not persisted — data-model.md).
8. With the key removed and offline, confirm every other view (Topics, Drill, Mock, cheat sheets) works
   exactly as before — no new blocking network call anywhere outside this one button.
9. **Pending state (FR-020b)**: press Run and watch the panel before the result lands. Confirm an explicit
   "running" state shows, that it is visually distinct from both an idle panel and a finished result, and
   that any *previous* run's output was cleared the moment the new run started.
10. **Timeout (FR-020c)**: DevTools → Network → throttle to a profile that stalls the request (or block the
    Judge0 host mid-flight). Confirm the run aborts at ~30 seconds and shows "needs a connection" — never
    an unbounded spinner.
11. **Not-runnable (FR-019c)**: open a DSA item whose `sampleCall` batch hasn't landed yet (or temporarily
    blank one item's `sampleCall` locally). Confirm Run renders disabled with a "not runnable yet"
    explanation, that no request is sent (empty Network tab), and that this reads as a normal state rather
    than an error.
12. **Key hygiene (FR-018a)**: with a key configured, press Run and force a failure. Confirm the key
    appears nowhere in the DevTools Console, nowhere in the rendered error text, and in no request URL —
    only in the `X-RapidAPI-Key` request header.

## US7 — Plainer English in short summaries (SC-007)

1. Rewrite `shortAnswer` for one pack's items; run `node tools/validate.mjs` — must exit 0 before the next
   pack starts (per-batch gate, research.md R-006).
2. Spot-check that `answer`/`traps`/other prose fields on the same items are byte-identical to before the
   rewrite (only `shortAnswer` changed).
3. Repeat pack-by-pack until `node tools/validate.mjs`'s item count confirms all ~629 items have been
   touched (`updatedIn` set to this feature's release version on each).

## US8 — Clarify-then-plan system design flow (SC-008)

1. Open the framework item (`sd-0000`); confirm `framework` now documents two labeled phases (Clarify,
   Plan) and `clarifyingQuestions[]` is populated.
2. Open any scenario item; confirm the view presents `clarifyingQuestions[]` first, and the plan content
   (framework/requirements/referenceAnswer/staffAdds/rubric) is only reachable after advancing past that
   step — not visible simultaneously.
3. Batch-update remaining scenario items' `clarifyingQuestions[]`/`requirements[]` split; `node
   tools/validate.mjs` after each batch.
4. **Shape and floor (FR-027a, FR-027b)**: confirm every design item — all 19, framework included — has at
   least 3 `clarifyingQuestions`, that every entry is a plain string (no objects, no question/answer
   pairs), and that no item was granted an exemption. `node tools/validate.mjs` enforces all three via
   T003's gate; confirm it *fails* when you temporarily drop one item to 2 entries or swap one entry for
   an object, so you know the gate is real and not vacuously passing.
5. **Scope discipline (FR-030)**: diff a restructured scenario pack and confirm the only prose that moved
   is clarify-flavored bullets relocating from `requirements[]` into `clarifyingQuestions[]`, plus
   framework pointer text — no general rewriting of scenario prose (that is US7's job, and only for
   `shortAnswer`).
6. **SC-008's yardstick**: verify each scenario against FR-027/FR-027a/FR-027b/FR-028 directly, *not*
   against the framework item — the framework is rewritten in this same effort, so checking scenarios
   against it would let both drift together undetected. Check the framework item against the same FRs as
   one more conforming item.

## US9 — "Lead" replaces "Staff/Monster" (SC-009)

1. `grep -rn "Staff/Monster\|Monster" assets/ index.html content/ --include='*.js' --include='*.html'` —
   confirm no rendered-UI hit (the only pre-change hit was `assets/js/levels.js`'s label constant).
2. Load the topics level filter dropdown, any level-4 item's chip, and a cheat sheet; confirm "Lead" appears
   in all three, and that filtering by level 4 still returns the same item set as before the rename
   (`level: 4` untouched).

---

## Regression check — run once, at the end

```bash
node tools/validate.mjs --final    # all gates as errors
node tools/check-refs.mjs          # every ref URL still resolves
```

Both must exit 0 before this feature is considered done, per the constitution's Quality Gates section.
