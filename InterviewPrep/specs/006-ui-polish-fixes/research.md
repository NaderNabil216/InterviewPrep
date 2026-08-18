# Phase 0 Research: Study Surface UI Polish

No item in the plan's Technical Context was marked `NEEDS CLARIFICATION` — this is a small,
fully-owned codebase with no external dependencies, so every "unknown" below is a concrete design
decision read directly off the current code, not a gap requiring outside research. Each decision
was reached by reading the relevant module before writing it down (see file:line references).

## 1. Theme toggle — collapsing three states to two

**Current behavior** (`assets/js/app.js:167-185`): `applyTheme()` treats `'auto'` as "remove
`data-theme`, let CSS's `@media (prefers-color-scheme)` block decide," and its icon line already
resolves the *effective* appearance for `'auto'` via `matchMedia(...).matches` — but the resolution
only feeds the icon, not any indication of whether the state itself is explicit or system-derived.
`initTheme()` cycles `['dark', 'light', 'auto']` on every click. `Store.getSettings()`
(`assets/js/store.js:255`) defaults an unset preference to `theme: 'auto'`.

**Decision**: Narrow the persisted `theme` value to exactly two states, `'dark' | 'light'`.
- `initTheme()`'s click order becomes `['dark', 'light']` — a plain toggle.
- On first boot, if no `theme` key has ever been stored, resolve once via
  `matchMedia('(prefers-color-scheme: dark)').matches` and **persist that resolution as an
  explicit `'dark'` or `'light'`** (not as `'auto'`). This satisfies FR-003 (sensible first-visit
  appearance) and FR-004 (no silent later change) in one step: once persisted, the value is
  indistinguishable from a candidate's own explicit click, so a later OS-level preference change
  has nothing to re-trigger.
- `applyTheme()` drops its `'auto'` branch entirely — `data-theme` is always set, the icon is a
  plain `theme === 'dark' ? '🌙' : '☀️'`.
- `Store.getSettings()`'s default moves from `theme: 'auto'` to no default at all — the caller
  resolves the first-visit value via `matchMedia` (see above). If `matchMedia` itself is
  unavailable (very old WebViews), the first-boot resolution falls back to `'dark'` as the
  default, and persists that fallback exactly like any other first-boot resolution.

**Also in scope — the Settings page dropdown** (`assets/js/views/settings.js:21-25`): this is a
*second* control that independently writes the same `Store.getSettings().theme` key, and today
offers a third "Match system" option. The feature's own Assumptions section states system
preference "is retained only as the source for the initial theme... it is dropped from the
toggle's click-cycle" — leaving the Settings dropdown able to write `'auto'` back into the same
key would silently reopen the exact ambiguous state (icon reflecting an OS-derived, non-explicit
choice) the rest of the feature removes, the next time that candidate's OS theme changes. Decision:
remove the "Match system" `<option>` from the Settings dropdown in the same change, leaving only
Dark/Light — keeping the one persisted `theme` value consistent no matter which of the app's two
controls wrote it.
- *Alternative considered*: leave the Settings dropdown's third option in place, reasoning that
  FR-001's "no third state reachable" is scoped to "the toggle control." Rejected — the spec's own
  Assumption text ties `'auto'` to first-visit-only, and a second live control that keeps writing
  `'auto'` would defeat FR-004 for any candidate who happens to use it, for no benefit the spec
  asks for.

## 2. Short-answer vertical bar

**Current behavior** (`assets/css/app.css:241-242`): `.short-answer { border-left: 3px solid
var(--accent); padding: 4px 0 4px 14px; margin: 16px 0; }` — the `14px` left padding exists to
clear the border, not for list-marker spacing.

**Decision**: Drop `border-left` and reduce the compensating left padding to a plain list indent
(list-marker space only, no longer border clearance). No structural change — `<ul class="short-
answer"><li>...` is unchanged in every one of the three view modules that render it
(`item.js:43-44`, `drill.js:81`, `mock.js:145`); this is a CSS-only fix, matching the spec's own
framing (User Story 3: "single CSS rule, no behavioral risk").

## 3. Multi-sentence question/prompt splitting

**Current behavior**: `item.q` (and `item.prompt` for design/DSA items) is single-line data,
rendered inline through `renderInline()` (`assets/js/md.js:23-25`), which runs bold/italic/code/link
substitution but has no concept of a sentence boundary — a `q` value with two or three sentences
renders as one unbroken string wherever it's used (`item.js:39`, `drill.js:78`, `mock.js:141`,
`design.js:20,61`, `dsa.js:56`).

**Decision**: Add a sentence-splitting helper to `md.js`, applied at render time only (FR-008), used
everywhere `item.q` is shown as the primary question — `item.js`, `drill.js`, `mock.js` (the three
surfaces the spec's own cross-surface acceptance scenario names), plus `design.js`'s and `dsa.js`'s
`<h1>` question header for consistency — and to `item.prompt`'s paragraph text in `renderMarkdown`'s
paragraph-flush path, so a multi-sentence design/DSA requirement prompt gets the same treatment as
a multi-sentence `q`.

Splitting approach, in order, mirroring the existing code-span-stash trick already used by
`inline()` (`md.js:13-14`) so the two concerns compose safely:
1. Stash backtick code spans first (reuse the existing stash regex) so a `.` inside
   `` `List<out E>.contains` `` can never be mistaken for a sentence boundary (FR-007, Edge Cases).
2. Split the remaining text into sentences on `?` or `!` (always a boundary — unambiguous in this
   content), and on `.` **only** when it is followed by whitespace + an uppercase letter/quote, or
   by end-of-string. That rule alone clears every false-positive the spec calls out without a
   maintained abbreviation list: a decimal or version number (`3.14`, `Kotlin 1.9`) is never
   followed by a capital letter; an abbreviation inside a sentence (`e.g. two`) is normally followed
   by a lowercase continuation.
3. Restore the stashed code spans into each sentence, then render each sentence through the
   existing `inline()` pass and emit it as its own block-level element (one line per sentence)
   instead of one continuous string.
4. A single-sentence value takes the same path and produces exactly one block — visually
   identical to today's output (FR-009), so there is no special-case "skip if only one sentence"
   branch to keep in sync.

*Alternative considered*: a maintained abbreviation whitelist (`e.g.`, `i.e.`, `etc.`, ...) checked
before splitting on `.`. Rejected as unnecessary complexity — the capital-letter-after rule already
covers the concrete cases named in the spec and in the existing content, without a list that would
need updating as new content is authored.

## 4. "UPD" badge removal

**Current behavior**: exactly one render site,
`assets/js/views/topics.js:60-61`:
```js
${it.addedIn === snapshot.version ? '<span class="chip chip--new">NEW</span>'
  : it.updatedIn === snapshot.version ? '<span class="chip chip--new">UPD</span>' : ''}
```
Confirmed via repo-wide search that no other view renders an "UPD"/updated-badge — `item.js:32`'s
`· added {date}` line reads `addedIn` unconditionally (not release-gated) and is a provenance
footnote, not a badge, and is out of scope. `content.js:113`'s use of `updatedIn` is diff-detection
logic for the sync mechanism (Principle III), untouched.

**Decision**: Delete the `: it.updatedIn === snapshot.version ? '<span ...>UPD</span>'` branch,
leaving only the `NEW` case (falling through to `''` otherwise). `topics.js:28`'s `state.status ===
'new-content'` filter, which reads both `addedIn` and `updatedIn` to decide inclusion, is untouched
— FR-011 requires the filter behavior to survive exactly as it is; only the visible badge goes.

## 5. Topic-category level sort

**Current behavior** (`assets/js/views/topics.js:38-44`): items are grouped
`grouped[track][topic] = [...]` in filtered-array order, which mirrors `snapshot.items`'s disk/pack
order — no sort is applied before rendering the per-topic item list.

**Decision**: After grouping, sort each `topics[topic]` array by `level` ascending
(`1` Basics → `4` Lead, per `assets/js/levels.js`) with a plain `.sort((a, b) => (a.level || 1) -
(b.level || 1))` immediately before rendering. `Array.prototype.sort` has been a stable sort per the
ECMAScript spec since ES2019 (every browser this site targets), so items sharing a level keep their
existing relative order for free (FR-013) — no secondary tiebreaker key is needed. A missing/legacy
`level` value falls back to `1` (Basics) rather than erroring or sorting to an unpredictable
position (Edge Cases).
