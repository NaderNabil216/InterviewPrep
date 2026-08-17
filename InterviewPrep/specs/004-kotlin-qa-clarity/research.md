# Phase 0 Research: Labelled Answer Sections and Plain-Spoken Kotlin Q&A

**Feature**: `004-kotlin-qa-clarity` · **Plan**: [plan.md](./plan.md) · **Spec**: [spec.md](./spec.md)

Every figure below was measured against the working tree at manifest `2026.08.17` on 2026-08-17, not
recalled. The commands that produced them are reproducible from `/Users/nn/InterviewPrep`.

The spec left no `NEEDS CLARIFICATION` markers — both gating questions were resolved before planning
and five clarifications were integrated. What Phase 0 had to resolve instead was a set of questions
the spec correctly refused to answer (it is a spec, not a design) plus two the spec could not have
known it needed to ask, because both only appear when you measure: the word band has no headroom
(R-006) and the release date is on a clock (R-007).

---

## R-001 — Where the labelling decision lives

**Decision**: a new module, `assets/js/sections.js`, exporting the seven fixed label strings and a
single `isLabelled(item)` predicate. `item.js`, `drill.js` and `mock.js` import it. No view holds a
label string or a type test of its own.

**Rationale**: FR-001 fixes seven exact strings; FR-005 requires them identical on three surfaces;
FR-006 requires one rule about *which items* are labelled, applied everywhere. Three requirements
that all say "one definition, three call sites". The repo has already solved this exact problem once
— `assets/js/levels.js` is a 12-line module holding `LEVEL_LABEL`, and `CLAUDE.md` states the rule it
exists to enforce: *"labels come from `assets/js/levels.js` — never hardcode a difficulty word in a
view."* Section labels are the same kind of thing: a small, fixed, user-visible vocabulary that
several views must agree on.

It also converts FR-006 from a discipline into a structure. With one exported predicate, "labelled by
item kind, not by page" is true because there is nowhere else to decide it. With three inline
`item.type === 'qa'` tests, it is true only until someone edits one of them.

**Alternatives considered**:
- *Inline the check and the strings in each view.* Rejected: three copies of seven strings, and
  FR-005 becomes a thing you verify by reading rather than a thing that cannot fail. This is exactly
  the pattern `levels.js` exists to prevent.
- *Put it in `md.js`.* Rejected: `md.js` is a markdown renderer with no concept of an item. Adding
  item-kind awareness to it would also break R-003.
- *A `renderSection()` helper that emits label + body together.* Rejected as over-fitting: the seven
  sections have genuinely different body shapes (a heading string, a `<ul>`, a markdown block, a code
  block, a link list) and three of them already sit inside their own containers (`.short-answer`,
  `.traps-box`, `.refs-box`). A wrapper would have to accept enough options to be worse than the two
  primitives it replaces. `sections.js` exports the vocabulary and the predicate; the views keep
  owning their own HTML, which is how every other view in this repo works.

---

## R-002 — The predicate: what exactly counts as a labelled item

**Decision**: `isLabelled(item)` is `item?.type === 'qa'`. Nothing about track, page, route or
pack enters into it.

**Rationale**: measured over all 629 items on disk, `type` partitions the library exactly along the
line FR-006 and FR-008a draw:

| `type` | Count | Labelled? | What it is |
|---|---|---|---|
| `qa` | 545 | **yes** | The question-and-answer items, across 10 tracks |
| `dsa` | 60 | no | DSA problems |
| `design` | 19 | no | System-design scenarios + the framework item |
| `concept` | 5 | no | The printable cheat sheets (`cs-0001`..`cs-0005`, all on the `cheatsheets` track) |

545 + 84 = 629. The spec's "84 deliberately untouched items" resolves precisely to
`type !== 'qa'`, with no residue and no special case. Two facts confirm the partition is clean rather
than coincidental: no `qa` item lives on the `cheatsheets` track, and no cheat sheet carries a type
other than `concept`.

The three leak paths FR-006a names are all closed by this single test, because all three end in a
view that renders whatever item it is handed:

1. **Search** (`app.js:216`) — every result calls `navigate('item', id)`, so any of the 629 items can
   render through `renderItem`. So can Topics (`topics.js:123`), the Dashboard
   (`dashboard.js:157`) and the Plan view (`plan.js:103`); the item page is the universal
   destination, not a Q&A-only one. A page-keyed rule would have had to be re-derived at four call
   sites instead of one.
2. **Drill** (`drill.js:11`) — the queue filter excludes `dsa` and `design` only, so a `concept`
   cheat sheet is eligible as a drill card today.
3. **Mock** (`mock.js:8-9`) — the `design` and `coding` modes select `design` and `dsa` items and
   render them through the same reveal body a Q&A item uses.

**Alternatives considered**: keying on the route name (rejected — four routes reach `renderItem`,
and the reveal bodies are shared, so this is the leak); keying on the presence of an `answer` field
(rejected — it is a proxy, and a fragile one: `dsa`/`design` items have no `answer` today but
`concept` items do, so cheat sheets would be labelled).

---

## R-003 — The "Code" label and the shared code renderer

**Decision**: the `Code` label is emitted by the **caller**, immediately before
`renderCodeBlock(block)`. `md.js` is not modified.

**Rationale**: `renderCodeBlock()` is exported from `md.js` and called from four places —
`item.js:46`, `drill.js:80`, `mock.js:144` and **`dsa.js:80`**. A label emitted from inside it would
appear on the DSA page, which FR-008a forbids outright. Passing a flag into it would put item-kind
knowledge inside the markdown renderer, contradicting R-001's placement. Emitting from the caller
keeps the predicate in one module, keeps `md.js` at its current charter, and costs one line per call
site.

FR-001's table says "*Each* code sample", so an item carrying two samples renders two `Code` labels.
Measured: of 545 Q&A items, 437 carry one code sample, 19 carry two, and 89 carry none — so the
repeat case is real but rare, and it never occurs on the Kotlin track (all 70 items carry exactly
one). The 89 with none are FR-003's acceptance case, and Drill and Mock show at most one sample each
(`.slice(0, 1)`), so they render at most one label regardless.

---

## R-004 — Visual treatment: one class, no variants

**Decision**: a single `.section-label` class — an uppercase, letter-spaced pill with a tinted
accent background and a soft accent border — used identically for all seven labels. No per-section
colour variant. The `.traps-box` keeps its existing red tint and border; only its *label* joins the
common treatment.

**Rationale**: FR-002 requires that sections labelled today and sections newly labelled be
*indistinguishable in style*. A red "What sinks you" pill and a green "The full picture" pill would
be two systems again, which is the exact complaint US1 opens with. Keeping the box tint while
normalising the label preserves the danger affordance the traps section has today without spending
it on the label.

The treatment has to survive one specific collision: `.answer-body h4` is already accent-coloured
(`app.css:247`), and every markdown heading level renders as `<h4>` (`md.js:74`), so the deep answers
themselves contain accent-coloured headings — `kt-0004`'s answer opens with `#### What inlining buys
you`. If the section label were merely "accent-coloured bold text", the label and the in-answer
headings would read as the same rank. The pill's background, border, radius, uppercase transform and
smaller size separate them at a glance, which is what "highlighted label — not merely a bolder line
of text" in the spec's Assumptions asks for.

Concretely, and matching the existing token vocabulary:

```css
.section-label {
  display: inline-block;              /* wraps as a unit; never nowrap — see FR-001a below */
  font-size: 11px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase;
  color: var(--accent);                                        /* SUPERSEDED — see R-012 */
  background: color-mix(in srgb, var(--accent) 14%, var(--bg-card));   /* SUPERSEDED — see R-012 */
  border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--border));
  border-radius: 999px; padding: 3px 10px; margin: 18px 0 8px;
}
```

> **Superseded in part, 2026-08-17 (R-012).** The two marked declarations became
> `color: var(--accent-strong)` and an **8%** tint. This block reasoned about theme correctness —
> both themes resolve, no literal colour — and treated that as sufficient. It is not: the same token
> pair measures 6.59:1 in dark and 3.06:1 in light, so the treatment passed AA in one theme and
> failed it in the other. Everything else in R-004 stands, including the whole argument for one class
> with no variants and for the pill's distinction from `.answer-body h4`.

`color-mix()` is not a new dependency: `.traps-box` (`app.css:256`) already uses it, so the light and
dark token sets both resolve it today. The accent tokens differ per theme (`#6fd3a8` dark,
`#159a63` light), so deriving from `--accent` rather than a literal keeps both themes correct with
one rule — this stylesheet's established pattern.

**FR-001a (legibility at narrow widths)**: the longest label, "The 30-second answer", is 20
characters; at 11px/800 with `.07em` tracking it occupies roughly 150px, which fits every viewport
the site targets. Deliberately **no `white-space: nowrap`** — at an extreme width the pill should
wrap its text internally rather than overflow the card, and `inline-block` keeps the pill itself from
splitting across lines. Verified at 320px in quickstart.md.

**Alternatives considered**: reusing `.eyebrow` (rejected — it is faint grey with no background,
already used for page-level context like "Mock Interview", and "highlighted" per the spec means more
than a bolder line); a left accent bar like `.short-answer` (rejected — `.short-answer` already uses
that idiom for the section *body*, so a bar would be ambiguous about what it marks); per-section
colours (rejected — FR-002).

---

## R-005 — Print

**Decision**: a `@media print` override that drops the background and border and falls back to a
black underline.

**Rationale**: the print block (`app.css:338-345`) is global, so the question page inherits it even
though cheat sheets are the intended printed surface — which is precisely why FR-007 was written.
Browsers do not print background colours by default, so a background-tinted pill would print as
undifferentiated grey-on-white text: the label would survive but stop being a label. An underline
prints unconditionally.

```css
@media print {
  .section-label { background: none; border: 0; border-bottom: 1px solid #000;
                   border-radius: 0; color: #000; padding: 0 0 1px; margin: 12px 0 5px; }
}
```

The existing print rules already force `body { color: #000 }` and hide `.rate-row` / `.btn-row`, so
the labels are the only thing on the question page whose printed form this feature changes. Cheat
sheets gain no label at all (R-002), so the surface print was designed for is untouched.

---

## R-006 — The word band has no headroom (the finding that constrains the whole rewrite)

**Decision**: every rewritten Kotlin `answer` must land within **120–250 words** under
`validate.mjs`'s normative counter. In practice: the longest items may not grow at all, and the
median item has roughly +8% to spend. Word count is checked per item as part of the batch gate, not
discovered at release time.

**Rationale**: this is the collision the spec could not see. FR-014 forbids deleting or relocating
anything and says answers "stay roughly their current length"; SC-001a treats a markedly shorter
rewrite as a review failure. So length may not fall. Whether it *rises* is the open question, and
FR-013a's own exemplar answers it — under the normative counter its three versions are **26 words
(original) → 19 (middle) → 22 (target)**. The target is 15% shorter than the documentation original
but **16% longer than the tightened version it beats**. That is the shape of the risk: the savings
from deleting "note that", "consequently" and "with the result that" are real but they are spent
immediately, on repeating the subject in short sentences, on direct address, and on replacing a
subordinate clause with a whole new sentence rather than with nothing. A rewrite that lands anywhere
in that band is legitimate prose; a rewrite that lands 10% up is a gate failure, and nothing about
writing it would feel wrong at the time.

Measured against the gate, under the normative counter (`tools/validate.mjs:37`):

- Kotlin `answer` word counts: min **162**, median **231**, max **250**.
- Items already outside the 120–250 band: **0**. The maximum is exactly the band ceiling.
- Library-wide gate 2b summary: **545/545 = 100.0%** in band, against a `>=90%` target.

Projecting a uniform expansion across the 70 Kotlin answers:

| Growth | Kotlin answers over 250 | Library in-band share | Gate 2b summary at `--final` |
|---|---|---|---|
| +5% | 20 | 96.3% | pass |
| +10% | 44 | 91.9% | pass |
| +15% | 54 | 90.1% | pass, by 0.1pp |
| +20% | 65 | **88.1%** | **error** |

Two distinct gates are involved and they behave differently, which matters for how the batch gate is
written:

- **Per item**, exceeding 250 is a plain `warn()` (`validate.mjs:135`) — never an error, not even at
  `--final`. The 350-word ceiling is the error, and no projection above reaches it (max +20% ⇒ 300
  words).
- **In aggregate**, the gate 2b summary (`validate.mjs:400-404`) is `staged()` — a warning during
  stages, an **error at `--final`**. Kotlin is 70/545 = 12.8% of the library, so if every Kotlin
  answer left the band the library would sit at 87.2% and fail.

So nothing fails loudly at the moment the damage is done; it accumulates silently and fails once, at
the end, across 14 batches of work. The mitigation is to spend the baseline: the tree currently
validates at **0 errors and 0 warnings**, so *any* new warning is attributable and visible
immediately. The batch gate therefore demands zero new warnings, not merely exit 0 — see
[contracts/prose-voice-contract.md](./contracts/prose-voice-contract.md).

**Alternatives considered**:
- *Raise the band for this feature.* Rejected — the band is `001-fill-content-gap`'s FR-002 and
  `tools/REFRESH.md` states its rationale (an over-band answer "fails the candidate in the room").
  This feature changes voice; it does not get to move a quality gate to make room for itself.
- *Let the band slip and fix it later.* Rejected — a `--final` error inherited by the next feature is
  exactly the "remediation backlog" the release-scoped gates exist to bound, and nothing here needs
  it.
- *Trim to make room.* Rejected — Q2 of the spec settled this: nothing is deleted or relocated.

The practical consequence for authoring is that the register change must be **traded, not added**:
the words freed by deleting formal connectives and passive constructions are the budget that pays
for shorter sentences and direct address, and the trade has to balance per item. That is a real
constraint on the authoring, and it belongs in the task description rather than being discovered at
item 40.

---

## R-007 — Release windows, versions and summaries

**Decision**: two releases, `2026.08.18` (questions) then `2026.08.19` (answers), both cut with
`tools/sync-manifest.mjs --write --release <v> --summary "…" --date <YYYY-MM-DD>`. **Both must be
dated on or before 2026-09-06.**

**Rationale**: the version format is `YYYY.MM.N` where `N` is a release counter, not a day —
`2026.08.17` is the seventeenth release of August 2026 (its `date` is `2026-08-14`), so the next two
are `.18` and `.19`. Gate 6 requires `releases[]` strictly descending under **numeric** comparison,
which these satisfy.

The dates are not free, because both releases stamp `updatedIn` on all 70 Kotlin items and two gates
are scoped to exactly the items a release touches:

- **Gate 10** (`validate.mjs:311-323`, a hard `err`): every `refs[].checked` on a shipped item must
  fall within 30 days before the release date. The 70 Kotlin items carry 87 refs: **69 checked
  2026-08-13** and **18 checked 2026-08-07**. The binding one is 2026-08-07, so the window closes
  **2026-09-06**.
- **Gate 11** (same block, also `err`): `manifest.stackSnapshotChecked` is `2026-08-14`, so a release
  dated after **2026-09-13** fails on the version-truth registry.

If either slips, the fallback is a real re-verification, not a date edit: `node tools/check-refs.mjs
kotlin-` probes liveness, but gate 10's `checked` date asserts that *the claim was re-verified*, so
re-stamping it without re-reading the source would be a Principle IV violation dressed as a gate fix.
`tools/sync-manifest.mjs --write --stack-checked <date>` is the corresponding tool for gate 11.

The `releases[]` summary is what the sync toast shows the candidate, so each says plainly what
changed — proposed wording, to be confirmed at release time:

- `2026.08.18` — *"Kotlin questions reworded in plain, spoken English (70 items)."*
- `2026.08.19` — *"Kotlin answers, traps and follow-ups reworded in plain, spoken English (70
  items)."*

Note that the labels (US1) get **no** release and no version bump: they are app code, so they take
effect on load with the `app.css?v=7` bump as the only cache concern. This is FR-022a's first
delivery, and it is the reason the feature can ship something on day one.

---

## R-008 — What a batch gate actually consists of

**Decision**: three checks per batch, in order, all three required before commit:

1. `node tools/validate.mjs` — exits 0 **and adds no warning** to the 0-warning baseline.
2. A scope check — only the fields this delivery owns changed, and the pack's id set is identical.
   Adapted from `specs/002-improvements/verification/fielddiff.mjs`, which already diffs every pack
   against `git HEAD` and exits non-zero on a protected-field or id change; this feature needs only a
   different `ALLOWED`/`PROTECTED` split per delivery (D2: `q` + `updatedIn`; D3: `answer`, `traps`,
   `followUps`, `code[].caption`, `updatedIn`).
3. The FR-021a human read-through — the two questions, per item, recorded per batch.

**Rationale**: FR-021 requires a named human step and FR-020 requires per-pack batching, but the
spec deliberately does not say what the reviewer is spared. Checks 1 and 2 are what make check 3
affordable: the reviewer never has to confirm that ids survived, that no other track was touched, or
that a fenced code block did not sneak into prose (gate 15) — those are decided mechanically. What is
left for the human is exactly the two things no script can decide: *is it still true* and *does it
sound right*. `fielddiff.mjs` is precedent, not new tooling — it lives in the Spec Kit scaffold, not
the app, which keeps the app's "no test runner" posture intact.

---

## R-009 — Question length and the 40-character preview

**Decision**: no maximum question length is imposed. The rule is that the **first ~40 characters must
distinguish the question from its track neighbours**.

**Rationale**: FR-012 is about a truncation that exists in exactly one place. `item.js:76-77` renders
the prev/next buttons as `stripMarkdown(q).slice(0, 40) + '…'`. Everywhere else the question renders
in full — Topics (`topics.js:57`) and search results (`app.js:205`) both print the whole string, and
drill cards render it as the card title. Kotlin questions run 52–138 characters today, median 80, so
the great majority are already truncated in that one control and always have been. Lengthening a
question therefore costs nothing new; burying the distinguishing noun past character 40 costs
something real.

The practical authoring rule: lead with the subject. "Explain `inline`, `noinline`, `crossinline`,
and `reified`…" already does; a rewrite that opens "There's a modifier in Kotlin that…" would not.
This is checkable mechanically as a review aid — sort the 70 rewritten questions by their first 40
characters and look for adjacent duplicates within a track — and that check belongs in the D2 batch
gate as an assist to the human step, not as a validator gate.

---

## R-010 — `shortAnswer` stays out, with one carve-out

**Decision**: `shortAnswer` is not rewritten. The single exception is a *mismatch repair*: if a
rewritten `answer` leaves its short answer contradicting or no longer matching it, that specific
short answer is fixed in the same batch and the fix is called out in the read-through record.

**Rationale**: `002-improvements` US7 rewrote `shortAnswer` in plain English across all 629 items and
shipped it in release `2026.08.17` — the release currently on disk. Redoing it would be churn, and
the spec's Assumptions already say so. The carve-out matters because D3 changes the field directly
above it on every surface, and a short answer that now disagrees with its own deep answer is worse
than either register. Keeping the exception narrow (repair, not rewrite) keeps the D3 scope check
honest: `shortAnswer` is listed as *conditionally* allowed with a required note, not silently
permitted.

---

## R-011 — Sizing the review step against a single exemplar

**Decision**: `kotlin-a.json` (8 items, the largest pack) is authored and reviewed **first** in each
content delivery and becomes a **worked reference batch**. Batches 2–14 are held against FR-013a's
exemplar *and* against the accepted reference batch.

**Rationale**: the spec's own checklist names this as the one residual risk left by design: FR-013a
is a single worked example built from a SAM-conversion sentence, and a reviewer applying it to an
item shaped very differently is extrapolating. The checklist asked `/speckit-plan` to size the review
step accordingly rather than discover the problem mid-batch. Ordering `kotlin-a` first converts one
abstract exemplar into eight concrete ones spanning real item shapes — a comparison table, a
multi-heading answer, a short definitional answer — at the cost of nothing, since one pack has to go
first regardless. FR-013a remains normative; the reference batch is corroborating, and if the two
ever disagree the exemplar wins.

`kotlin-a` is also the right choice on merits: 8 items rather than 5, and it is the track's original
pack, so it carries the oldest and most documentation-flavoured prose.

---

## R-012 — Accessibility: the labels are headings, and contrast is measured per theme

**Decision**: each label renders as `<h4 class="section-label">`, not a `<div>`; and the pill's text
colour becomes `var(--accent-strong)` over an **8%** accent tint rather than `var(--accent)` over
14%. Added 2026-08-17 from the requirements review in
[checklists/ux.md](./checklists/ux.md) (CHK023–CHK027).

**Rationale**: R-001 through R-005 worked out where the labelling decision lives, what it looks like,
and how it prints. None of them asked what the labels *are*, and the answer the DOM contract had
reached by default — a generic container — was wrong twice over.

*Semantics.* Two of the three headings this feature replaces are already `<h4>`s (`item.js:49`,
`item.js:54`). Emitting `<div>`s would have **removed** heading semantics from follow-ups and traps
while withholding them from the four sections newly labelled — a net loss of document structure from
a feature whose entire purpose is to make structure legible. The visible page would have gained
seven signposts and the accessibility tree would have lost two. `h4` is also the level those headings
already use, so the outline keeps its existing shape rather than merely acquiring a new one. No
`aria-*` is then needed for FR-025: a heading introduces what follows it, which is the association
assistive technology already relies on.

*Contrast.* R-004's argument was that deriving every colour from `--accent`, `--bg-card` and
`--border` makes both themes correct for free. That is true of *resolution* and false of
*accessibility* — the tokens differ per theme, so the contrast ratio does too. Measured against WCAG
2.1 AA for small text (4.5:1; 11px is small at any weight):

| Treatment | Dark | Light | AA both |
|---|---|---|---|
| `--accent` on 14% tint (R-004's) | 6.59 | **3.06** | no |
| `--accent-strong` on 14% tint | 6.77 | **4.39** | no |
| **`--accent-strong` on 8% tint** | **7.77** | **4.71** | **yes** |
| `--accent-contrast` on solid `--accent` | 8.98 | **3.60** | no |
| `--text` on 8% tint | 11.62 | 15.99 | yes, but discards the accent identity |

The chosen row is two token changes from the original and keeps everything R-004 argued for.
`--accent-strong` is each theme's higher-emphasis accent (`#3ddc97` dark, `#0f7d50` light) — exactly
what a small bold label wants — so this is idiomatic use rather than a workaround. Note the light
theme fails at 14% even with the darker token: **both** changes are needed, which is the kind of
thing only measurement finds.

*What this does not fix, deliberately.* `.answer-body h4` measures 8.90 dark and **3.60** light
against its card background today, so in-answer headings are already below AA in the light theme.
That predates this feature and is a property of the `--accent` token itself; fixing it means changing
a token used library-wide, which is a different change with a different blast radius. The obligation
taken on here is not to add a second instance of it.

**Alternatives considered**: keeping `<div>` and adding `role="heading" aria-level="4"` (rejected —
an ARIA reimplementation of an element that already exists, and the native element carries the
styling hook just as well); a theme-conditional contrast override (rejected — this stylesheet's whole
pattern is that one rule serves both themes via tokens, and one qualifying row above needs no
override at all); raising the font size to reach the large-text threshold (rejected — 18.66px bold
would make the label compete with the content it introduces, defeating FR-002a).

---

## R-013 — Unlabelled items keep the headings they already carry

**Decision**: replacing an existing heading with a label is conditional on the same predicate that
decides labelling. An unlabelled item renders its current heading, unchanged.

**Rationale**: R-002 settled which items get labels and stopped there. Three sections carry a heading
today, and `item.js` renders two of them by **field presence, not by item type** — so they appear for
non-Q&A items reaching the item page through search or a topic list. Counted across the packs, with
every item carrying `refs` because gate 3 requires it:

| Field | `qa` 545 | `dsa` 60 | `design` 19 | `concept` 5 | Unlabelled items rendering it |
|---|---|---|---|---|---|
| `refs` → `Sources` | 545 | 60 | 19 | 5 | **84** |
| `followUps` → `Likely follow-ups` | 545 | 60 | 0 | 0 | **60** |
| `traps` → the traps heading | 545 | 0 | 0 | 0 | **0** |

An unconditional swap would therefore delete a heading from all 84 unlabelled items, and a second one
from 60 of them, in exchange for nothing — they receive no label. That is an SC-007a failure, and the
verification originally specified could not see it: counting `.section-label` nodes returns zero
whether the heading survived or was deleted. Hence contract check C10 and quickstart step D1-4a,
which assert *presence* rather than absence.

Two consequences for the stylesheet, which follow from the table rather than from the markup change:
`.traps-box h4` may be retired because no unlabelled item carries `traps`; and there is **no
`.refs-box strong` rule** to retire — an earlier draft claimed one existed.

---

## R-014 — The length envelope: a floor the word band does not provide

**Decision**: every rewritten `answer` additionally lands within **±15%** of its baseline word count,
and where the band and "delete nothing" collide the resolution is fixed rather than judged.

**Rationale**: R-006 established the band as a **ceiling** problem — Kotlin sits at 250, the band ends
at 250, and the register change tends to expand. That is real, but it is only half the exposure. The
band's **floor is 120** and the track's actual minimum is 162, which leaves 42 words of slack that no
check is watching. An answer can fall from 250 words to 130 — losing nearly half its content — and
clear gate 2b, the aggregate summary, and every other automated check without a murmur. That is
exactly the failure SC-004 exists to prevent, and it was the one the mechanical apparatus could not
see.

FR-014a fixes it relative to each item rather than to the library: ±15% of the item's own baseline,
outside which the item is re-checked claim-by-claim and the movement recorded. It is not a rejection
threshold — an honest rewrite can legitimately move — it is a **signal**.

For the collision, FR-014b fixes an ordering so it is not re-decided per item at 2am on batch 11:
rebalance within the rewrite first (the connectives freed are the budget); if that fails, **FR-014
wins** and the item is recorded as a band exception. A per-item over-band warning is an advisory;
deleting a caveat to avoid it is a correctness defect. The two are not comparable, and saying so once
is cheaper than 70 individual judgements.

---

## R-015 — The rewrite perturbs a gate that reads question text

**Decision**: gate 8's near-duplicate screening is treated as an output of the D2 batch gate, and any
newly flagged pair is adjudicated in the batch that caused it.

**Rationale**: R-008 built the batch gate around the validator's *current* output and asked what a
clean run means. It did not ask which gates take the rewrite's own output as **input**. One does.
Gate 8 (`validate.mjs:439-449`) tokenizes `item.q`, drops a stopword list, and flags any pair scoring
above a Jaccard threshold **across all 629 items on disk**, requiring a ledger entry per pair. D2
rewrites 70 of those inputs.

The direction of the effect is unfavourable. A conversational register replaces terse technical
phrasing — precisely the distinguishing tokens — with common words, and the tokenizer discards those
as stopwords. Token sets therefore shrink toward the shared Kotlin vocabulary, and pairwise similarity
rises. Two questions that were distinct as syllabus entries can read as near-identical once both are
phrased the way a person would ask them.

Two properties make deferring this expensive. Gate 8 is `staged()`, so it is a *warning* until
`--final` and an **error** at it — meaning the natural discovery point is after all 14 batches. And
the flag names a pair, not a cause: by then up to 13 batches of authoring stand between the warning
and the edit that produced it. Adjudicating in-batch costs a minute; adjudicating at `--final` means
reconstructing why two questions ended up alike.

Note the pair can be **cross-track**: a rewritten Kotlin question can collide with an untouched
question on another track, so the screen is not filtered to `kt-` ids.

---

## Consolidated decisions

| # | Decision | Drives |
|---|---|---|
| R-001 | New `assets/js/sections.js` owns the 7 strings + the predicate | FR-001, FR-002, FR-005, FR-006 |
| R-002 | `isLabelled(item)` is `item.type === 'qa'` — 545 yes / 84 no, exactly | FR-006, FR-006a, FR-008, FR-008a, SC-007a |
| R-003 | `Code` label emitted by the caller; `md.js` untouched | FR-001, FR-008a |
| R-004 | One `.section-label` pill class, no variants; traps box keeps its tint | FR-001a, FR-002, FR-004 |
| R-005 | Print override drops the background, keeps an underline | FR-007 |
| R-006 | Rewritten answers stay in 120–250 words; batch gate demands 0 new warnings | FR-013, FR-014, SC-001a |
| R-007 | Releases `2026.08.18` / `2026.08.19`, both dated ≤ **2026-09-06** | FR-022, FR-022a, FR-022b, SC-005 |
| R-008 | Batch gate = validator + scope check + the two-question read-through | FR-020, FR-021, FR-021a |
| R-009 | No length cap; the first ~40 characters must distinguish | FR-012 |
| R-010 | `shortAnswer` excluded, mismatch repair carved out and recorded | Assumptions |
| R-011 | `kotlin-a` authored first as the worked reference batch | FR-013a, SC-003, FR-013d |
| R-012 | Labels are `<h4>`; `--accent-strong` on an 8% tint, measured per theme | FR-024 – FR-027, SC-009 |
| R-013 | Unlabelled items keep the headings they already carry | FR-006d, SC-007a |
| R-014 | ±15% length envelope, and a fixed ordering when the word band and "delete nothing" collide | FR-014a, FR-014b, SC-001a |
| R-015 | Rewriting 70 questions perturbs library-wide near-duplicate screening; adjudicate per batch | FR-020b, SC-010 |

No `NEEDS CLARIFICATION` remains.

### Decisions added by the 2026-08-17 requirements review

R-012 through R-015 came from the two checklists in [checklists/](./checklists/) rather than from the
Phase 0 sweep, and they share a shape worth naming: each is a place where the original research
reasoned correctly about the thing it was looking at and did not notice an adjacent question.

- **R-012** — R-004 asked whether the treatment resolves in both themes. It does. Nobody asked
  whether it is *readable* in both, and it is not.
- **R-013** — R-002 established which items get labels, exhaustively. Nobody asked what happens to
  the markup of the items that do not.
- **R-014** — R-006 established the word band as a ceiling. Nobody asked about the floor, which sits
  42 words below the track's actual minimum and would let an answer lose a third of its content
  without a single check firing.
- **R-015** — R-008 built the batch gate around the validator's current output. Nobody asked which
  gates the rewrite itself perturbs; gate 8 takes question text as its input, and D2 rewrites 70
  questions.
