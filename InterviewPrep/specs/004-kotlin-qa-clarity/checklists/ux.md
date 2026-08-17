# Presentation Requirements Quality Checklist: Labelled Answer Sections (Delivery 1)

**Purpose**: Validate that the requirements governing the seven section labels — the vocabulary, the
labelling predicate, the presence rule, the guarantee to the 84 untouched items, and the
non-functional dimensions — are complete, unambiguous, consistent and checkable *before* a
presentation change lands on 545 items across three shared surfaces
**Created**: 2026-08-17
**Feature**: [spec.md](../spec.md)
**Scope**: Delivery 1 (US1, FR-001..FR-008a, SC-001, SC-007, SC-007a). The Kotlin prose rewrite
(D2/D3) is out of scope — see [authoring.md](./authoring.md)
**Sources under test**: `spec.md`, `plan.md`, `research.md` (R-001..R-005), `data-model.md` §2,
[section-label-contract.md](../contracts/section-label-contract.md), `quickstart.md` §D1

**Note**: This is a **requirements-quality** review artifact, not a test plan. Every item asks
whether something is *specified well enough*, never whether the implementation works. `[x]` means the
reviewer judged the requirements-quality criterion satisfied — it does not mean any code is written.
CHK numbering restarts per checklist file; these IDs are `ux.md` CHK001–CHK034 and are unrelated to
the identically-numbered items in `authoring.md`.

## Label Vocabulary & Ordering

- [x] CHK001 Is the *rendered* order of the seven labels stated as a requirement, or is FR-001's table ordering descriptive while a conformance check treats it as normative? [Consistency, Spec §FR-001, Contract §C1]
- [x] CHK002 Is a change process defined for these strings, given they are user-visible copy that ships as app code with no version bump, no release entry and therefore no sync notice a candidate could read? [Gap, Spec §FR-022a, Contract §SECTION_LABEL]
- [x] CHK003 Is the apostrophe form in "They'll ask next" fixed normatively — ASCII versus typographic — given the contract raises the question but no requirement settles it? [Clarity, Contract §SECTION_LABEL]
- [x] CHK004 Is it specified what should distinguish two labels for the same section kind on one page — the 19 items carrying two code samples render two identical "Code" labels? [Coverage, Spec §FR-001, R-003]
- [x] CHK005 Is FR-004's "tell which is which without reading either" reconciled with SC-001's verification "identifying every section from its label alone", which requires reading the label? [Ambiguity, Spec §FR-004 vs §SC-001]

## The Labelling Predicate & Leak Paths

- [x] CHK006 Is the predicate specified as total over item kinds — including kinds that do not exist yet — in the requirements, or does the default-to-unlabelled rule for a future type live only in the contract? [Gap, Spec §FR-006, Contract §isLabelled]
- [x] CHK007 Are all routes into a labelled layout enumerated in the requirements? FR-006a names search, Drill and Mock; research adds Topics, Dashboard and Plan as further callers of the same view. [Completeness, Spec §FR-006a vs R-002]
- [x] CHK008 Is "decided by item kind, never by the page" specified so it can be checked mechanically, given the conformance check is a grep whose expected match counts are not stated? [Measurability, Spec §FR-006, Contract §C9]
- [x] CHK009 Is the restriction that only three view modules may import the labelling vocabulary stated as a requirement, or only as a contract inventory note with no requirement behind it? [Traceability, Contract §"Call-site inventory"]

## Presence Rule & Empty-Section Edge Cases

- [x] CHK010 Is "present and non-empty" defined per field shape — an absent field, an empty array, an array containing empty strings, a whitespace-only answer? [Edge Case, Spec §FR-003, Data-model §2]
- [x] CHK011 Are requirements defined for a Q&A item missing a section other than code, given the presence rule's justification is a census of today's content rather than a stated requirement about tomorrow's? [Coverage, Data-model §2]
- [x] CHK012 Is the Mock reveal's reference-answer fallback covered by a requirement, or resolved to "cannot occur" by a derivation from current content that a later content change could invalidate without warning? [Assumption, Spec §Edge Cases, Data-model §2]
- [x] CHK013 Is the behaviour specified for a labelled item whose deep answer is empty, given the answer container renders unconditionally and the presence rule is the only thing standing between a label and an empty body? [Edge Case, Data-model §2]

## The Guarantee to the 84 Untouched Items

- [x] CHK014 Does any requirement state what an **unlabelled** item renders in place of the headings this feature removes — the follow-ups heading and the sources heading — given SC-007a requires those items to render identically to their pre-feature output? [Conflict, Spec §SC-007a, Contract §"Replaced markup"]
- [x] CHK015 Is SC-007a's "render identically" defined — identical DOM, identical visual output, or merely the absence of labels? [Measurability, Spec §SC-007a]
- [x] CHK016 Is the verification specified for SC-007a capable of detecting a *removal*? Counting label nodes returns zero both when the requirement holds and when a heading has been deleted from an unlabelled item. [Coverage, Quickstart §D1-4, §D1-5]
- [x] CHK017 Are the CSS rules being retired scoped in the requirements to the items whose markup actually changes, or is the retirement stated globally while the markup change is conditional? [Consistency, Contract §"Replaced markup"]
- [x] CHK018 Is the removal of the traps warning glyph accompanied by a specified non-colour affordance, given the red tint alone then carries the danger meaning? [Gap, R-004]

## Visual Treatment — Measurability

- [x] CHK019 Is "visually highlighted" defined by any criterion in a requirement, given the only elaboration — "not merely a bolder line of text" — appears in Assumptions and explicitly defers the treatment to planning? [Measurability, Spec §FR-001, §Assumptions]
- [x] CHK020 Is FR-002's "indistinguishable in style" testable — is there a stated list of properties that must match across the seven? [Measurability, Spec §FR-002]
- [x] CHK021 Is the required visual distinction between a section label and the accent-coloured headings *inside* a deep answer stated as a requirement, or does it exist only as research rationale and a walkthrough instruction? [Traceability, R-004, Quickstart §D1-1]
- [x] CHK022 Are requirements defined for both colour themes, given every label colour derives from theme tokens and no requirement mentions light, dark or the auto state? [Gap, Coverage]

## Non-Functional — Accessibility

- [x] CHK023 Are any accessibility requirements defined for this feature at all? The seven labels are its entire user-visible output and no requirement, success criterion or contract clause addresses assistive technology. [Gap, Non-Functional]
- [x] CHK024 Is the shift from heading elements to generic containers addressed anywhere, given the change removes two of the view layer's heading elements and introduces seven labels that are not headings — in a codebase that otherwise maintains a heading hierarchy? [Gap, Contract §"DOM contract"]
- [x] CHK025 Is any programmatic association specified between a label and the section it introduces, or is the relationship purely visual adjacency? [Gap, Contract §"DOM contract"]
- [x] CHK026 Are colour-contrast requirements specified for the label treatment, given it is 11px text coloured with the same token that tints its own background? [Gap, Non-Functional, R-004]
- [x] CHK027 Is the decision to omit accessibility requirements recorded as deliberate with a rationale, rather than left as an unstated omission a later reviewer must rediscover? [Traceability, Gap]

## Non-Functional — Print & Responsive

- [x] CHK028 Is FR-007's "must not degrade the existing print output" defined with a pass condition a reviewer can apply, or does it rest on an undefined verb? [Measurability, Spec §FR-007]
- [x] CHK029 Is FR-001a's "narrow viewport widths" quantified in the requirements, or does the only number appear in the validation walkthrough? [Clarity, Spec §FR-001a, Quickstart §D1-7]
- [x] CHK030 Is the requirement that labels remain legible in print reconciled with browsers not printing background colours by default — is the fallback treatment a requirement or a design choice made during research? [Traceability, Spec §FR-007, R-005]
- [x] CHK031 Are print requirements specified for every surface the global print styles reach that this feature adds labels to, or only for the item page? [Coverage, Spec §FR-007]

## Acceptance Criteria & Delivery

- [x] CHK032 Is SC-007's "0 labels misdescribe the content beneath them" measurable, or does it restate correct wiring as an outcome without naming what would count as a misdescription? [Measurability, Spec §SC-007]
- [x] CHK033 Is a cache-invalidation requirement stated for the module layer, given only the stylesheet is versioned and the walkthrough compensates with a manual hard refresh? [Gap, Plan §Project Structure, Quickstart §D1]
- [x] CHK034 Is a correction path defined for a labelling defect found after D1 ships, given D1 carries no content release and therefore no version bump, no sync trigger and no notice a candidate would see? [Gap, Spec §FR-022a]

## Notes

### Where the requirements risk sits

D1 is the better-specified half of this feature — a fixed vocabulary, a total predicate, a call-site
inventory and nine conformance checks. The gaps that remain are not in the labelling logic. They are
in **what happens to everything the labelling does not cover**: the 84 unlabelled items whose markup
the same edit touches (CHK014–CHK018), and the non-functional dimensions no requirement mentions at
all (CHK023–CHK027).

### Verified against the app repository, 2026-08-17

Five items rest on facts confirmed by reading `/Users/nn/InterviewPrep` rather than inferred from the
planning artifacts.

**CHK014, CHK016 — the removed headings reach unlabelled items.** The contract's "Replaced markup"
table swaps three elements unconditionally, but the rendering rule gates the *replacement* label on
`isLabelled(item)`. `views/item.js` is the universal item destination, and it renders the follow-ups
heading whenever `followUps` is non-empty and the sources heading whenever `refs` is non-empty —
neither gated by type. Counted across the packs:

| Field | `qa` (545) | `dsa` (60) | `design` (19) | `concept` (5) |
|---|---|---|---|---|
| `refs` | 545 | **60** | **19** | **5** |
| `followUps` | 545 | **60** | 0 | 0 |
| `traps` | 545 | 0 | 0 | 0 |

So **all 84 unlabelled items render a "Sources" heading today**, and **60 of them also render a
"Likely follow-ups" heading**, both on the item page reached by search and Topics — the very route
FR-006a exists to protect. If the old markup is removed while the new label is type-gated, those
items lose a heading, which is what SC-007a forbids. No requirement, contract row or walkthrough step
states what an unlabelled item should render there. (Gate 3 requires refs on every item, so the
84/84 figure is structural, not incidental.)

The traps swap is the safe one: **0 non-Q&A items carry `traps`**, so that row of the table cannot
affect them.

**CHK016 specifically** — the prescribed check for D1-4 and D1-5 counts label nodes and expects zero.
That result is identical whether the requirement holds or a heading has been silently deleted. The
verification is necessary but cannot detect the failure mode above.

**CHK026 — contrast is not symmetric across the themes**, though the treatment derives both from one
token set. Computing WCAG contrast for the proposed 11px label (which is *not* "large text" at any
weight, so the 4.5:1 threshold applies):

| Theme | Text | Background (14% accent tint) | Ratio | AA at 11px |
|---|---|---|---|---|
| Dark | `--accent` `#6fd3a8` | ≈ `#273a3d` | ≈ **6.6:1** | passes |
| Light | `--accent` `#159a63` | ≈ `#def1e9` | ≈ **3.1:1** | **below 4.5:1** |

Stated fairly: this is largely a property of the existing light-theme accent token, not something the
feature invents — `#159a63` on plain white is ≈3.6:1, so today's `.answer-body h4` at 14px is already
under the threshold. What the feature does is carry that token to a smaller size on a tinted ground.
The requirements-quality question is CHK026's: no requirement sets a contrast obligation either way,
so nothing makes this a decision rather than an accident.

**CHK024** — the codebase does maintain a heading hierarchy (h1/h2/h3 across the views) and uses
`role="group"`, `role="alert"`, `role="status"`, `aria-live` and `aria-label` in places. So the
accessibility questions here are not an imported standard; they are consistency with what the repo
already does.

### Favourable findings — checked and clear

- **The retired CSS rules are safely scoped.** `.traps-box` and `.refs-box` appear in exactly one
  view module, so removing their descendant rules cannot alter the DSA page, the system-design page
  or the cheat sheets. The SC-007a exposure identified above is confined to the item-page route.
- **The stylesheet version in the plan matches the tree** — `index.html` currently carries `?v=6`, so
  the `?v=6 → ?v=7` bump is correctly stated. CHK033 is about the ES modules, which carry no version
  at all.
- **Data-model §2's "cannot occur" resolution of the reference-answer edge case is correct today** —
  `referenceAnswer` exists only on `design` items, which are never labelled. CHK012 asks whether a
  derivation from current content should be load-bearing, not whether the derivation is wrong.

### Resolution — 2026-08-17

All 34 items now have a corresponding requirement, contract clause or verification step. The findings
are left as originally written so the reasoning stays readable; the boxes record that each has a fix
in the artifacts, not that D1 has been built. Where an item ends in `[x]`, the resolution is below.

| Items | Resolved by |
|---|---|
| CHK001, CHK003, CHK004 | FR-001 — rendered order, ASCII apostrophe, repeated-section rule |
| CHK002 | FR-001b — a later wording change reaches candidates with no notice of any kind, so it must be recorded in the feature that makes it |
| CHK005 | FR-004 reworded: "from the labels alone, without reading either section's content" |
| CHK006 | FR-006b — the rule is total; an unrecognised kind defaults to unlabelled |
| CHK007 | FR-006a.3 — topic lists, dashboard and plan added to the enumerated routes |
| CHK008 | contract C9 now states expected counts: 3 files, 0 in the four excluded modules, 0 type tests outside `sections.js` |
| CHK009 | FR-006c — a single definition, as a requirement rather than a contract note |
| CHK010, CHK013 | FR-003 + data-model §2 — emptiness defined per shape, all four cases |
| CHK011 | FR-003a — true by construction, explicitly not by census |
| CHK012 | FR-005a — the label must describe the field rendered; "cannot occur" is no longer load-bearing |
| CHK014, CHK015, CHK016, CHK017 | FR-006d, SC-007a ("nothing added and nothing removed"), contract §Replaced markup + C10, quickstart D1-4a |
| CHK018 | FR-028 — the label wording carries the danger meaning; colour is reinforcement |
| CHK019, CHK020 | FR-002 enumerates ten properties that must match; contract C14 checks them |
| CHK021 | FR-002a — distinction from in-answer headings, as a requirement |
| CHK022, CHK027 | FR-027 (all three theme states) and R-012, which records the reasoning rather than leaving the omission tacit |
| CHK023, CHK024, CHK025 | FR-024–FR-026 and R-012 — labels are `<h4>`, association is the heading relationship |
| CHK026 | FR-026 + R-012 — **the treatment changed**: `--accent-strong` over an 8% tint, measured at 7.77 dark / 4.71 light. The original measured 3.06 in light |
| CHK028, CHK031 | FR-007 (three pass conditions) and FR-007a (a distinction that does not depend on background rendering) |
| CHK029 | FR-001a — 320px |
| CHK030 | FR-007 now binds on every surface that renders a label and can be printed |
| CHK032 | SC-007 — "misdescribes" defined as a mismatch against FR-001's table |
| CHK033, CHK034 | FR-029, FR-030 — module caching stated as an accepted constraint with hard-refresh verification; the no-release delivery has no rollback story other than shipping a fix |

**The one substantive design change** came from CHK026. Everything else states, quantifies or
enumerates something already intended; the contrast finding changed what gets built. Two token
changes — text to `--accent-strong`, tint from 14% to 8% — with no theme-conditional CSS.

**Recorded but deliberately not fixed**: `.answer-body h4` measures 3.60:1 in the light theme today,
so in-answer headings are already below AA. That predates this feature and belongs to the `--accent`
token itself; changing it is a library-wide change with a different blast radius. The obligation
taken on here was not to add a second instance, which FR-026 discharges (R-012).

### Not in scope here

The Kotlin prose rewrite — voice standard, word band, field scope, claim survival, the batch gate and
release sequencing — is covered by [authoring.md](./authoring.md) (35 items). Generic specification
quality is covered by [requirements.md](./requirements.md), which passes 16/16. Nothing here
duplicates either.
