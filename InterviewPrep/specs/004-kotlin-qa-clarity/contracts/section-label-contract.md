# Contract: Section labels — `assets/js/sections.js`

**Feature**: `004-kotlin-qa-clarity` · **Spec**: [../spec.md](../spec.md) · **Research**:
[../research.md](../research.md) (R-001..R-005) · **Data model**:
[../data-model.md](../data-model.md)

This is the app's internal UI contract for the seven section labels. It is a contract rather than an
implementation note because three separate views must agree on it exactly (FR-005) and because
getting the predicate wrong puts labels on content they were never written for by three verified
routes (FR-006a).

## Module

```js
// assets/js/sections.js
export const SECTION_LABEL = { … };   // the seven fixed strings — the single source
export function isLabelled(item) { … } // the single predicate
```

Modelled on `assets/js/levels.js`, which exists for the same reason: `CLAUDE.md` — *"labels come from
`assets/js/levels.js` … never hardcode a difficulty word in a view."*

### `SECTION_LABEL`

Exactly these seven keys and these seven strings. The strings are fixed by FR-001 (Clarification,
2026-08-17) and are user-visible copy — changing one is a content decision, not a refactor. FR-001b
adds the consequence that makes this more than a slogan: because the labels ship as app code with no
release entry, a later change to one of these strings reaches candidates with **no notice of any
kind**, so it must be recorded in the feature record that makes it. The table order is also the
rendered order (FR-001).

| Key | String |
|---|---|
| `question` | `Question` |
| `shortAnswer` | `The 30-second answer` |
| `answer` | `The full picture` |
| `code` | `Code` |
| `followUps` | `They'll ask next` |
| `traps` | `What sinks you` |
| `refs` | `Sources` |

Note the apostrophe in `They'll ask next`. It is rendered as text inside an element, never into an
attribute, so no escaping question arises — but it must be a plain ASCII `'` in the source so the
string a view emits matches the string a test asserts.

### `isLabelled(item)`

```
isLabelled(item) === (item?.type === 'qa')
```

- **Total** (FR-006b): defined for every item in the library and for `null`/`undefined` (returns
  `false`). There is no input for which the answer is undefined, and none for which a caller has to
  decide what the absence of an answer means.
- **Type-keyed, never page-keyed** (FR-006). No `track`, `route`, `view`, `pack` or `param` may
  appear in this function or in any caller's decision to label.
- **Singular** (FR-006c): this is the *only* definition. A second one anywhere — an inline type test
  in a view, a route check, a `track === 'kotlin'` shortcut — violates the requirement even if it
  happens to agree, because agreement that is not structural is agreement until someone edits one
  copy.
- **Exhaustive today**: `qa` 545 → `true`; `dsa` 60, `design` 19, `concept` 5 → `false`. 629 total,
  no residue (R-002).
- A **new item type** added by a future feature defaults to unlabelled (FR-006b). That is the safe
  direction: the failure mode this predicate exists to prevent is a label appearing over content it
  does not describe, and defaulting the other way would make every future content type a silent
  regression rather than a visible omission.

## Rendering rule

A view emits a label **iff both** hold:

1. `isLabelled(item)`, and
2. the section's own content is present and non-empty.

Neither condition implies the other and both are checked at every call site (FR-003, and see
[../data-model.md](../data-model.md) §2 for why condition 2 is load-bearing on the deep answer).

Failing condition 1 means **no label**; for the four sections with no heading today that is the whole
story, and the section renders exactly as it does now. For the three that *do* have a heading, the
existing one stays — see [Replaced markup](#replaced-markup--conditional-on-islabelleditem).

## DOM contract

```html
<h4 class="section-label">The 30-second answer</h4>
```

- **An `<h4>`, not a `<div>`** — FR-024. The element is a heading because that is what it is: a short
  string naming the region that follows it. Two of the three sections it replaces are already `<h4>`s
  today, so emitting a `<div>` would have *removed* heading semantics from follow-ups and traps while
  withholding them from the four sections newly labelled — a page whose visible structure had no
  programmatic counterpart. `h4` also matches the level those two headings use today, so the
  document outline is unchanged in shape rather than merely preserved in kind.
  - No `aria-*` attribute is needed to satisfy FR-025: a heading conventionally introduces the
    content that follows it, which is the association assistive technology already uses. Adding
    `aria-labelledby` on top would duplicate a relationship the markup already expresses.
  - `.answer-body h4` (`app.css:247`) does **not** apply to these — every label is emitted outside
    `.answer-body`. The in-answer headings keep their existing styling, and FR-002a's requirement
    that the two be distinguishable is carried by the pill treatment below.
- One class, `section-label`. **No modifier classes, no per-section variants** — FR-002 requires the
  seven to match on typeface, size, weight, letter-spacing, capitalisation, colour, background,
  border, radius and padding, including the three that carry a heading today.
- The label is a **sibling immediately preceding** its section's existing container, never a wrapper
  around it and never inside it. This keeps `.short-answer`, `.answer-body`, `.code-block`,
  `.traps-box` and `.refs-box` byte-identical in structure, so nothing that currently styles or
  queries them changes — including the print rules.
- The label carries **no emoji and no icon**. The current traps heading (`⚠ Traps that get people
  rejected here`) loses its warning glyph. FR-028 requires the danger meaning to survive without
  depending on colour, and it does: the label *wording* carries it. "What sinks you" states the
  section's nature in text, so the red tint is reinforcement rather than the sole signal — which a
  neutral label like "Traps" beside a tint would not have been.

### Replaced markup — conditional on `isLabelled(item)`

Three sections carry a heading today. That heading is replaced **only for labelled items**. `item.js`
is the universal item destination (R-002), so all three lines are reached today by `dsa`, `design`
and `concept` items opened through search or Topics — and SC-007a requires those 84 items to render
*identically* to their pre-feature output. An unconditional swap would strip a heading from content
that then has no label to replace it: a silent regression on the exact route FR-006a exists to guard,
and one that a zero-label assertion cannot see.

| Section | Labelled item (`type === 'qa'`) | Unlabelled item — the 84 |
|---|---|---|
| Follow-ups (`item.js:49`) | `<h4 class="section-label">They'll ask next</h4>` | `<h4 style="margin-top:18px;">Likely follow-ups</h4>` — **unchanged, byte for byte** |
| Traps (`item.js:54`) | `<h4 class="section-label">What sinks you</h4>` | `<h4>⚠ Traps that get people rejected here</h4>` — unchanged; unreachable today, see below |
| Sources (`item.js:60`) | `<h4 class="section-label">Sources</h4>` | `<strong>Sources</strong>` — **unchanged, byte for byte** |

This is the rendering rule above applied to a section that already has a heading. `isLabelled(item)`
selects *which* heading markup is emitted; the section's own non-emptiness still decides whether
anything is emitted at all. There is no third state — a section that renders carries exactly one
heading, either the new pill or the one it has today.

**Which branches content actually reaches while unlabelled**, counted across the packs on 2026-08-17.
Every item carries `refs`, because gate 3 requires one:

| Field | `qa` 545 | `dsa` 60 | `design` 19 | `concept` 5 | Unlabelled items rendering this heading today |
|---|---|---|---|---|---|
| `refs` | 545 | 60 | 19 | 5 | **84** |
| `followUps` | 545 | 60 | 0 | 0 | **60** |
| `traps` | 545 | 0 | 0 | 0 | **0** |

The Sources row is load-bearing for all 84 items, the follow-ups row for the 60 `dsa` items, and the
traps row for none — that branch exists to keep the rule uniform, not because content reaches it.

**Stylesheet consequences follow from that table, not from the markup change alone:**

- `.traps-box h4` (`app.css:257`) **may be retired** — no unlabelled item carries `traps`, and the
  labelled path emits no `<h4>` there. It is retired on that evidence, not on an assumption that the
  selector became unused.
- There is **no `.refs-box strong` rule in `app.css`** to retire; the `<strong>` renders at the
  browser default. An earlier draft of this contract said one existed and that it would be removed —
  that was wrong, and nothing is removed for the sources section. (`plan.md`'s Project Structure
  block still carries the same superseded line.)
- The inline `style="margin-top:18px;"` on the follow-ups heading is markup, not a stylesheet rule,
  and survives unchanged on the unlabelled path.

### The `Code` label

Emitted by the **caller**, immediately before `renderCodeBlock(block)` — never from inside `md.js`
(R-003). `renderCodeBlock` is shared with `views/dsa.js:80`, and a label emitted from within it would
appear on the DSA page in violation of FR-008a.

One label per **rendered** sample: up to 2 on the item page, at most 1 in Drill and Mock (both
`.slice(0, 1)`). The block's own `.code-block__caption` is unchanged and continues to render inside
the block, below the label.

## Style contract

```css
.section-label {
  display: inline-block;
  font-size: 11px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase;
  color: var(--accent-strong);
  background: color-mix(in srgb, var(--accent) 8%, var(--bg-card));
  border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--border));
  border-radius: 999px; padding: 3px 10px; margin: 18px 0 8px;
}
.section-label:first-child { margin-top: 0; }

@media print {
  .section-label { background: none; border: 0; border-bottom: 1px solid #000;
                   border-radius: 0; color: #000; padding: 0 0 1px; margin: 12px 0 5px; }
}
```

- **Both themes come free** — every colour derives from `--accent-strong`, `--accent`, `--bg-card`
  and `--border`, which the light and dark token sets both define. No literal colour is introduced,
  and no rule is conditioned on the theme.
- **`color-mix()` is not new** here: `.traps-box` already uses it (`app.css:256`).
- **Contrast is measured, not assumed** (FR-026, SC-009). "Derived from a token" does not imply
  "accessible in both themes" — the token values differ per theme and so does the result. Measured
  against WCAG 2.1 AA for small text (4.5:1; the large-text allowance does not apply at 11px, at any
  weight):

  | Treatment | Dark | Light | AA in both |
  |---|---|---|---|
  | `--accent` on a 14% `--accent` tint | 6.59 | **3.06** | no |
  | `--accent-strong` on a 14% tint | 6.77 | **4.39** | no |
  | **`--accent-strong` on an 8% tint** — specified above | **7.77** | **4.71** | **yes** |
  | `--accent-contrast` on solid `--accent` | 8.98 | **3.60** | no |

  Two token changes from the treatment originally proposed — the text colour moves to
  `--accent-strong` and the tint drops from 14% to 8% — and the pill is otherwise unchanged. This is
  idiomatic rather than a workaround: `--accent-strong` is each theme's higher-emphasis accent
  (`#3ddc97` dark, `#0f7d50` light), which is exactly what a small bold label needs.

  For context, and **out of scope**: `.answer-body h4` measures 8.90 dark and **3.60** light against
  its card background today, so the light theme's accent is already below AA for in-answer headings.
  This feature neither introduces nor inherits that — it must simply not add another instance of it,
  which the treatment above satisfies.
- **Must remain visually distinct from `.answer-body h4`** (`app.css:247`), which is also
  accent-coloured and appears *inside* deep answers, because every markdown heading level renders as
  `<h4>` (`md.js:74`). The pill's background, border, uppercase transform and smaller size carry that
  distinction (R-004).
- **No `white-space: nowrap`.** At an extreme narrow width the pill wraps its own text rather than
  overflowing the card; `inline-block` stops the pill itself from splitting (FR-001a). Longest
  string is `The 30-second answer`, 20 characters.
- **Print drops the background** because browsers do not print background colours by default; the
  underline is what survives (FR-007, R-005).

## Call-site inventory

| File | Sections labelled |
|---|---|
| `assets/js/views/item.js` | all seven |
| `assets/js/views/drill.js` | question, short answer, deep answer, code (1) |
| `assets/js/views/mock.js` | question, short answer, deep answer, code (1) |

**No other file may import `sections.js`.** In particular `views/dsa.js`, `views/design.js` and
`views/cheatsheets.js` must not — FR-008a keeps those three layouts byte-identical, and an import
there is the tell that FR-006 has been re-derived per page.

## Conformance checks

| # | Check | Requirement |
|---|---|---|
| C1 | A Kotlin `qa` item on the item page shows all seven labels, in FR-001's order | FR-001, FR-004 |
| C2 | The same item in Drill and in Mock shows the same four label strings | FR-005 |
| C3 | A `qa` item with no `code[]` (89 exist) shows no `Code` label and no empty block | FR-003 |
| C4 | A `dsa`, `design` or `concept` item opened via search shows **zero** `.section-label` nodes | FR-006, SC-007a |
| C5 | A `concept` cheat sheet appearing as a drill card shows zero `.section-label` nodes | FR-006a, SC-007a |
| C6 | The DSA page, system-design page and cheat-sheet pages render zero `.section-label` nodes | FR-008a |
| C7 | Print preview of an item page shows every label legibly, layout intact | FR-007 |
| C8 | At a 320px viewport no label overflows its card | FR-001a |
| C9 | Exactly three view modules reference the vocabulary — `item.js`, `drill.js`, `mock.js` — and no other file in `assets/js/` contains a `type === 'qa'` test. Expected: 3 files matching, 0 matches in `md.js`, `dsa.js`, `design.js`, `cheatsheets.js`, and 0 type tests outside `sections.js` | FR-006c |
| C10 | A `dsa` item opened via search still renders its `Likely follow-ups` heading **and** its `Sources` heading; a `design` or `concept` item still renders its `Sources` heading | SC-007a, FR-006d |
| C11 | Every label renders as an `<h4>`, and the seven appear in FR-001's order in the document outline | FR-024, FR-025, SC-009 |
| C12 | Label text measures ≥ 4.5:1 against its rendered background in **both** themes, measured on the built page rather than taken from this document | FR-026, SC-009 |
| C13 | The labels render correctly in light, dark and the automatic theme state | FR-027 |
| C14 | Every one of the ten properties FR-002 enumerates is identical across all seven labels, including the traps label | FR-002 |

**C10 is not implied by C4.** C4 asserts zero `.section-label` nodes on an unlabelled item, and zero
is the expected count whether the old heading survived or was deleted — the two outcomes this
contract now distinguishes are indistinguishable to a label count. C10 asserts the *presence* of what
was already there, so it must assert on the headings themselves:

```js
// on #/item/<a dsa id> reached via search
document.querySelectorAll('.section-label').length                        // 0   — C4
[...document.querySelectorAll('h4')].some(h => h.textContent.trim() === 'Likely follow-ups')  // true — C10
document.querySelector('.refs-box strong')?.textContent.trim() === 'Sources'                  // true — C10
```

Executable form in [../quickstart.md](../quickstart.md): C4 is step D1-4, C10 is step **D1-4a**, and
D1-5 records why C10 has no counterpart on the three untouched layouts.
