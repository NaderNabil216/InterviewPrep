# Authoring Requirements Quality Checklist: Plain-Spoken Kotlin Q&A (Deliveries 2 & 3)

**Purpose**: Validate that the requirements governing the Kotlin prose rewrite — the voice standard,
the length envelope, the field scope and the batch gate — are complete, unambiguous, consistent and
checkable *before* 28 batches of authoring are committed against them
**Created**: 2026-08-17
**Feature**: [spec.md](../spec.md)
**Scope**: Deliveries 2 (70 questions) and 3 (70 answers + 140 traps + 210 follow-ups + 70 captions).
Delivery 1 (section labels) is out of scope — see [section-label-contract.md](../contracts/section-label-contract.md)
**Sources under test**: `spec.md`, `plan.md`, `research.md` (R-006..R-011), `data-model.md`,
[prose-voice-contract.md](../contracts/prose-voice-contract.md), `quickstart.md`

**Note**: This is a **requirements-quality** review artifact, not a test plan. Every item asks
whether something is *specified well enough*, never whether the implementation works. `[x]` means the
reviewer judged the requirements-quality criterion satisfied — it does not mean any authoring is
done. `/speckit-implement` reads checklist state but does not modify these markers.

## Voice Standard — Clarity & Measurability

- [x] CHK001 Is the target voice defined in a form a reviewer can apply to item shapes the exemplar does not cover — a comparison table, a multi-heading answer, a short definitional answer — given the exemplar is one 26-word sentence? [Clarity, Spec §FR-013a, R-011]
- [x] CHK002 Is the precedence rule between the normative exemplar and the corroborating `kotlin-a` reference batch stated for the case where the exemplar is silent rather than contradicted? [Gap, Contract prose-voice §"Reference batch"]
- [x] CHK003 Can "reads like the target version rather than the middle version" be applied consistently by the same reviewer across 14 batches spread over weeks — is any anchor beyond side-by-side comparison specified? [Measurability, Spec §SC-003]
- [x] CHK004 Does FR-015's "one writer per item" state criteria distinct from FR-013a, or does it restate the same judgement at item scope without adding a checkable condition? [Clarity, Spec §FR-015]
- [x] CHK005 Are requirements defined for whether the rewrite may add, remove or convert markdown structure inside an answer — headings, tables, lists — given that converting a table to prose changes both the word count and the order of ideas? [Gap, Spec §FR-013, R-006]

## Length Envelope — the FR-014 / P7 Collision

- [x] CHK006 Is FR-014's "answers stay roughly their current length" quantified with a per-item threshold a reviewer can apply, or does "roughly" carry the whole constraint? [Measurability, Spec §FR-014]
- [x] CHK007 Is SC-001a's "lost a substantial share of its length" quantified, given that the mechanical band's floor (120 words) sits 42 words below the track's actual minimum (162) — so an answer can halve and still clear every automated check? [Ambiguity, Spec §SC-001a, R-006]
- [x] CHK008 Do the requirements define a resolution for an item where P7 (≤ 250 words) and FR-014 (nothing deleted, nothing relocated) cannot both hold — the items already at exactly 250 with zero headroom? [Conflict, Contract prose-voice §P7, R-006]
- [x] CHK009 Are length requirements defined for the other rewritten fields — traps, follow-ups and captions — or is the word band answer-only, leaving three of four D3 field families unbounded? [Coverage, Gap, Data-model §1]
- [x] CHK010 Is the "zero new warnings" batch criterion defined against a baseline whose validity across the feature's duration is stated, including which warnings could appear for reasons unattributable to the batch in hand? [Clarity, Contract prose-voice §Step 1]

## Field Scope & Coverage

- [x] CHK011 Is FR-018's "no prose field may contain a fenced code block" reconciled with the gate claimed to enforce it, whose field list does not include `code[].caption` — a field D3 rewrites? [Conflict, Spec §FR-018, Quickstart §D3-2]
- [x] CHK012 Are the array cardinalities of `traps` (2 per item) and `followUps` (3 per item) stated as frozen, or may a rewrite merge, split or drop an entry while the scope check still passes? [Gap, Data-model §1, §5]
- [x] CHK013 Is the `shortAnswer` mismatch-repair carve-out stated as a requirement, or does a load-bearing scope exception live only in Assumptions and a research decision while the batch gate is expected to enforce it? [Traceability, Spec §Assumptions, R-010]
- [x] CHK014 Is "a short answer that no longer matches its rewritten answer" defined — outright contradiction only, or also register drift and changed emphasis? [Ambiguity, R-010]
- [x] CHK015 Is a repaired `shortAnswer` held to the same voice standard and claim-preservation obligations as the fields D3 owns, or does it enter the file ungoverned by either? [Coverage, Gap, R-010]
- [x] CHK016 Is a repair path defined for a D2-rewritten question found wanting while authoring its D3 answer, given `q` is frozen in D3 and received no carve-out of the kind `shortAnswer` did? [Gap, Data-model §5]
- [x] CHK017 Is "the pre-rewrite text" defined as a specific baseline revision, given D3's comparison happens after D2 has already shipped changes to the same items? [Clarity, Spec §FR-021a]

## Question Rewrite Criteria (D2)

- [x] CHK018 Is the banned-opener list closed or exemplary — FR-010 gives seven verbs, the US2 acceptance scenario says "such as", and the screening check is a fixed seven-alternative pattern? [Consistency, Spec §FR-010 vs §US2 AS-1]
- [x] CHK019 Are openers that are instructional in effect but not in the list — "Walk me through", "Tell me about", "Talk to me about" — specified as in or out of scope, given a conversational rewrite is the likeliest source of them? [Ambiguity, Gap, Spec §FR-010]
- [x] CHK020 Is "distinguishes it from its neighbours" defined — the two items adjacent in the prev/next control, the items in the same topic, or every question on the track? [Clarity, Spec §FR-012, R-009]
- [x] CHK021 Is the text normalization applied before truncating to 40 characters specified identically to the one the rendered control applies, so the screening check and the surface it stands in for cannot disagree? [Consistency, R-009]
- [x] CHK022 Is "still distinguishes" defined beyond exact prefix equality — two questions differing only at the fortieth character would clear a collision check while remaining indistinguishable to a reader? [Measurability, Spec §FR-012]
- [x] CHK023 Is "retains every API name, keyword and symbol the original named" precise enough to check — is "symbol" defined, and is the comparison over backticked spans or over all text? [Clarity, Spec §FR-011]
- [x] CHK024 Are the effects of rewording 70 questions on the near-duplicate screening gate anticipated anywhere in the requirements — that gate scores question-token similarity across all 629 items and demands an adjudication ledger entry per newly flagged pair, and a uniform conversational register moves token sets toward each other? [Gap, Plan §Technical Context, Contract prose-voice §"Release gate"]

## Claim Survival & Sources

- [x] CHK025 Is "technical claim" defined at a granularity that makes "0 claims lost" countable, or does the success criterion rest on an unstated unit of comparison? [Measurability, Spec §SC-004]
- [x] CHK026 Does the specified batch record support SC-004 and SC-005 as *evidence*, given it prescribes a per-item mark for each of two questions rather than a claim or ref inventory? [Traceability, Contract prose-voice §"Recorded outcome"]
- [x] CHK027 Is FR-017's ref check stated as a positive obligation — name the claim in the rewritten text that each retained ref supports — in the requirement itself, or only in the validation walkthrough? [Traceability, Spec §FR-017, Quickstart §D3-5]
- [x] CHK028 Is "a claim that requires a source" defined, so a reviewer can recognise when a rewritten sentence has introduced an unsourced claim rather than only when it has stranded an existing ref? [Ambiguity, Spec §FR-017]
- [x] CHK029 Is P3's "the order of ideas is preserved" consistent with FR-013a's "the point arrives first and the consequence follows", which at paragraph scale can require reordering? [Conflict, Contract prose-voice §P3 vs §FR-013a]

## Review Gate Design

- [x] CHK030 Is the absence of reviewer independence addressed as an accepted risk — the two criteria carrying the most risk in this feature are verified only by the person who authored the batch? [Assumption, Spec §FR-021]
- [x] CHK031 Is the failure path defined — what happens to a batch when one item fails either read-through question: reworked in place, reverted, deferred, and who re-checks it? [Gap, Spec §FR-021a, Contract prose-voice §Step 4]
- [x] CHK032 Is the reviewer's per-item effort sized anywhere against what the gate actually covers — 70 answers, 140 traps, 210 follow-ups and 70 captions, each compared claim-by-claim against a prior version, twice over? [Gap, Assumption, R-011]

## Release Sequencing & Timing

- [x] CHK033 Is FR-022b's "a candidate never sees a track that is half rewritten" consistent with D2 shipping spoken questions above unrewritten documentation answers for the whole of D3's duration? [Conflict, Spec §FR-022b]
- [x] CHK034 Is the interim register mismatch D2 creates — the same split personality the feature's own rationale names as the problem — acknowledged as an accepted state with a bound on how long it lasts? [Gap, Spec §"Why This Feature Exists", §FR-022a]
- [x] CHK035 Are the consequences of missing the 2026-09-06 ref-freshness window stated as a decision rule with an owner and a checkpoint date, rather than as a named fallback discovered at release time? [Clarity, R-007, Plan §Summary]

## Notes

### What this checklist is testing

The label half of this feature (D1) is specified to an unusually high standard — a fixed vocabulary,
a total predicate, a call-site inventory and nine conformance checks. The prose half rests on one
worked exemplar, a word band with no headroom, and a human read-through performed by the author.
That asymmetry is where the requirements risk concentrates, and it is what these 35 items probe.

### Clusters worth reading together

- **CHK006–CHK008** are one problem seen three ways. FR-014 forbids shortening, R-006 caps at 250
  words, and Kotlin's maximum answer is exactly 250. The band's floor is far below the track's real
  floor, so the automated checks constrain the direction the requirements *don't* worry about and
  leave the direction they do worry about (SC-001a) entirely to prose adjectives.
- **CHK013–CHK016** all follow from the `shortAnswer` carve-out. It is the only field whose
  permission is conditional, it is documented outside the FR set, and the asymmetry with `q` in
  CHK016 was not raised by any prior artifact.
- **CHK011, CHK012 and CHK024** are coverage gaps between what a requirement claims and what the
  validator actually does. Each was checked against `tools/validate.mjs` during this session rather
  than inferred from the plan.

### Verified against the app repository, 2026-08-17

Three items rest on facts confirmed by reading `/Users/nn/InterviewPrep/tools/validate.mjs`, not on
inference from the planning artifacts:

1. **CHK011** — gate 15's `PROSE_FIELDS` list (`validate.mjs:195-196`) is `q`, `answer`,
   `shortAnswer`, `prompt`, `referenceAnswer`, `framework`, `followUps`, `traps`, `hints`, `summary`,
   `label`, `description`. `caption` is absent. Quickstart §D3-2 states "gate 15 covers this", which
   holds for every prose field D3 rewrites *except* the captions.
2. **CHK012** — no gate constrains `traps` or `followUps` cardinality or length; they appear in
   `validate.mjs` only inside the gate 15 field list. The D3 scope check permits both to differ
   wholesale, so merging two traps into one is mechanically invisible.
3. **CHK024** — gate 8 (`validate.mjs:439-449`) tokenizes `item.q`, drops a stopword list, and
   flags any pair across all 629 disk items scoring above a Jaccard threshold, requiring an
   adjudication ledger entry per pair; it is `staged()`, so it becomes an **error at `--final`**.
   D2 rewrites 70 of those inputs. A conversational register replaces distinguishing words with
   stopwords that the tokenizer discards, which shrinks token sets toward the shared Kotlin
   vocabulary and raises pairwise similarity. No feature artifact mentions gate 8.

Also confirmed, and *favourable* to the plan: gate 2b's per-item word-band check is a plain `warn()`
(`validate.mjs:135`), not `staged()`, so it never becomes an error even at `--final` — exactly as
R-006 states. The aggregate summary (`validate.mjs:403`) is `staged()`. R-006's account of the two
gates' differing behaviour is accurate as written.

### Resolution — 2026-08-17

All 35 items now have a corresponding requirement, contract invariant or verification step. The
findings are left as originally written; the boxes record that each has a fix in the artifacts, not
that any authoring has been done.

| Items | Resolved by |
|---|---|
| CHK001, CHK005 | FR-013b, P13 — the exemplar governs *sentences*, whatever structure they sit in; headings, tables and lists are preserved, and converting between them is a re-plan |
| CHK002 | FR-013c — reference batch is the secondary authority; exemplar wins on conflict; anything neither settles is recorded with the batch |
| CHK003 | FR-013d — cross-batch consistency, with the reference batch as the anchor |
| CHK004 | FR-015 — "same voice" is FR-013a applied to those fields, same exemplar, same comparison |
| CHK006, CHK007 | FR-014a, SC-001a — **±15% of baseline word count**, outside which the item is re-checked and the movement recorded |
| CHK008 | FR-014b, P7b — a fixed ordering: rebalance, then FR-014 wins, then record the band exception. A claim is never deleted to hit a word count |
| CHK009 | FR-015a, P14 — claim preservation and the envelope bind traps, follow-ups and captions in proportion |
| CHK010 | FR-020a — "new" measured against a run captured immediately before the batch, with a diagnosis table for the two likely causes |
| CHK011 | FR-018 + scope check + quickstart D3-2 — `caption` is outside gate 15's field list, so it is checked explicitly |
| CHK012 | FR-015a, P12, quickstart D3-1b — entry counts frozen at 2 traps and 3 follow-ups |
| CHK013, CHK014, CHK015 | FR-023a — the carve-out is a requirement; "no longer matching" defined as factual disagreement, not register difference; a repaired short answer is held to the same standards |
| CHK016 | FR-023b — a symmetric carve-out for a question found wanting during D3, rather than knowingly shipping one already judged wrong |
| CHK017 | FR-021b — a single fixed feature baseline, plus the scope-check-vs-`HEAD` / read-through-vs-baseline distinction |
| CHK018, CHK019 | FR-010 (floor for screening, not ceiling for review), FR-010a (softened instructions), quickstart D2-4 |
| CHK020, CHK021, CHK022 | FR-012 (track neighbours, in the one truncated control), FR-012a (same normalisation as the control), FR-012b (a reader can tell them apart, not merely that strings differ) |
| CHK023 | FR-011 — "every code-formatted span in the original question", spelled identically |
| CHK024 | FR-020b, SC-010, P15, quickstart D2-4a — adjudicate in the batch that caused it; the collision can be cross-track |
| CHK025 | FR-021c — "claim" defined generously, because the failure guarded against is a qualifier disappearing |
| CHK026 | FR-021d — the record names *what was compared*, since a tick cannot support "0 claims lost" |
| CHK027, CHK028 | FR-017 (positive per-reference obligation), FR-017a (the constitution's definition, checked in both directions) |
| CHK029 | P3a — the exemplar reorders within a sentence; P3 governs order across the answer |
| CHK030 | FR-021f — self-review accepted, with the compensating controls named and the one discipline it demands |
| CHK031 | FR-021e — the *batch* fails and is re-gated in full; no per-item exceptions |
| CHK032 | prose-voice contract §Effort — sized, and planned as its own step for the reason it is |
| CHK033, CHK034 | FR-022b ("half rewritten" = half *covered*), FR-022d (the interim register split accepted and bounded) |
| CHK035 | FR-022c — a checkpoint before the final batch of each delivery, with three named outcomes |

**No decision from the clarification session was reopened.** The exemplar remains the normative voice
standard (not a rule list), the rewrite remains voice-only, and labels remain library-wide on the
question-and-answer page. What changed is that the terms carrying weight now have definitions.

**Two items are honest about not being eliminated, only bounded**: CHK030 (this feature has no
independent reviewer, because it has one author — FR-021f names the compensating controls rather than
pretending otherwise) and CHK009 (traps, follow-ups and captions are bounded "in proportion", which
is weaker than the answer's ±15% because there is no baseline distribution to calibrate against).

### Not in scope here

Delivery 1's label requirements, the `sections.js` predicate, the surface matrix, print and narrow
viewport rules, and the FR-006 leak paths. Those are specified in
[section-label-contract.md](../contracts/section-label-contract.md) with conformance checks C1–C9 and
would warrant a separate `ux.md` if a reviewer wants them tested at this level.

Generic specification quality — mandatory sections, absence of `[NEEDS CLARIFICATION]` markers,
technology-agnostic success criteria — is covered by [requirements.md](./requirements.md), which
passes 16/16 and is maintained by `/speckit-specify` and `/speckit-clarify`. Nothing here duplicates
it.
