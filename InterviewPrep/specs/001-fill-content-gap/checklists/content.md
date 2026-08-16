# Content Quality & Sourcing Requirements Checklist: Fill the Content Gap to a Complete Study Library

**Purpose**: Lightweight sanity pass over the *requirements* governing what the 536 new items and 70
remediated items must contain and cite — testing whether those requirements are complete, unambiguous,
internally consistent, and objectively assessable before authoring begins.
**Created**: 2026-08-09
**Depth**: Lightweight sanity pass — highest-risk ambiguities and gaps only
**Documents under test**: [spec.md](../spec.md), [plan.md](../plan.md), [research.md](../research.md),
[contracts/content-schema.md](../contracts/content-schema.md)
**Feature**: [spec.md](../spec.md)

> This checklist validates the requirements as written. It does not test authored content, tooling
> behaviour, or the app — those are covered by `quickstart.md` and `validate.mjs`.

## Requirement Consistency (spec ↔ plan ↔ contract)

- [x] CHK001 Is the scope of the answer-length rule stated consistently across documents? FR-032 applies
      the band to "every item in the library, existing and new alike", while the design narrows it to
      `type: "qa"` only and exempts `concept`, `dsa`, and `design`. The spec text was never amended.
      [Conflict, Spec §FR-032 / research §R-001 / Contract §1]
      — **Resolved 2026-08-09**: FR-032 rewritten to bound question-and-answer items only and to state
      the library-wide "more info" obligation as a separate paragraph. Recorded as a Clarifications
      session entry.
- [x] CHK002 Is SC-016's measurement population consistent with the rule it measures? SC-016 reads
      "Measured across the whole library, existing items included", but the resolved decision measures it
      over `qa` items only — a different denominator for the same 90% target.
      [Conflict, Spec §SC-016 / research §R-001]
      — **Resolved 2026-08-09**: SC-016 now measures question-and-answer items and names the three
      excluded kinds explicitly.
- [x] CHK003 Are FR-018's cited remediation figures (13 over ceiling / 24 under floor / 24 without a
      reference) reconciled with the measured set (46 trims + 24 ref additions), and is the superseded
      figure marked non-normative in the spec rather than only in research?
      [Conflict, Spec §FR-018 / research §R-002]
      — **Resolved 2026-08-09**: FR-018 now states 46 trims + 24 ref additions = 70 items, re-measured
      against the live content. The "under the floor" clause is gone — no answer falls below 80 words.
      Found while fixing this: research R-002 and plan.md both said **62**, an arithmetic slip; corrected
      to 70 in research.md, plan.md (×2), and contracts/content-schema.md.
- [x] CHK004 Is the canonical word-count algorithm established as a requirement rather than existing only
      in the design contract? FR-032's 80/120/250/350 thresholds are not decidable without one, and the
      spec's own figures were produced by a method that does not reproduce.
      [Traceability, Spec §FR-032 / Contract §1 "Canonical word count"]
      — **Resolved 2026-08-09**: FR-032 now requires a single canonical counting method applied
      uniformly; the method itself stays in the contract, where it belongs.
- [x] CHK005 Is the exclusion of `concept` items (the five cheat sheets) from the answer band a ratified
      decision or still an open assumption? research R-001 explicitly flags it as an author's assumption
      whose alternative reading adds four trims. [Assumption, research §R-001]
      — **Resolved 2026-08-09**: ratified by the user — the band applies to question-and-answer items
      only, so the 4 over-ceiling cheat sheets are deliberately left as they are.

## Requirement Clarity & Measurability

- [x] CHK006 Is "the subjects that track declares in scope" pinned to a named, versioned authoritative
      source? FR-003 forbids leaving any declared subject unrepresented, but the declaration itself lives
      in tooling configuration that no requirement designates as normative.
      [Clarity, Gap, Spec §FR-003 / Dependencies]
      — **Resolved 2026-08-09**: FR-003 now names the per-track scope definitions (Dependencies) as
      the authority, requires each to be frozen and recorded before its track is authored, requires a
      subject→item mapping, and requires a deliberate omission to be recorded with its reason. New SC-019
      measures it.
- [x] CHK007 Is "duplicate … in substance or in phrasing" defined with a decidable threshold and a named
      adjudicator? FR-004 is stated absolutely while the only planned detection is a warning-level
      similarity heuristic with an unspecified threshold requiring human judgement.
      [Ambiguity, Measurability, Spec §FR-004 / research §R-008 gate 8]
      — **Resolved 2026-08-09**: FR-004 now defines a duplicate by the knowledge tested ("a correct
      answer to one is a correct answer to the other"), makes the screen a per-release obligation, and
      names the human as adjudicator with the screen explicitly allowed to over-report. New SC-020
      measures unadjudicated pairs, not similarity scores — the threshold stays a tooling detail.
- [x] CHK008 Are the criteria that assign an item to one of the four difficulty levels defined anywhere?
      FR-005 and SC-014 constrain the resulting *distribution* to ±5pp, but nothing constrains the
      per-item assignment, so the distribution target can be met by relabelling.
      [Gap, Measurability, Spec §FR-005 / §SC-014]
      — **Resolved 2026-08-09**: new FR-035 gives a four-row rubric for what places an item at each
      level, plus the anti-inflation rule that an item takes the *lowest* level at which it could be
      expected to be answered. Recorded in Assumptions as an editorial judgement, not an automatable one.
- [x] CHK009 Is "every track MUST span all four difficulty levels" quantified with a per-level minimum, or
      does a single item at a level satisfy it? "A candidate MUST be able to start from the bottom in any
      track" implies more than one but states no number. [Clarity, Spec §FR-005 / §SC-014]
      — **Resolved 2026-08-09**: FR-005 now requires ≥3 items at every level in tracks of 40+, ≥2 in
      Mobile System Design and Behavioral, and exempts Cheat Sheets. Found while fixing this: **no track
      currently spans all four levels**, and Cheat Sheets (5 items, L1/L2 only, frozen by Out of Scope)
      could not without breaching scope — so the exemption resolves a latent conflict, not just a gap.
- [x] CHK010 Is SC-002's "at least three hours without exhausting unseen material" backed by a stated
      per-item study-time assumption? Without one the criterion cannot be evaluated from item counts.
      [Measurability, Spec §SC-002]
      — **Resolved 2026-08-09**: SC-002 now states per-kind paces (5 / 20 / 45 / 8 minutes) and shows
      the thinnest tracks clearing three hours against the FR-002 minimums. Cheat Sheets excluded. The
      paces are recorded in Assumptions as estimates, with FR-002 named as what to revisit if wrong.
- [x] CHK011 Are the claim types that trigger the sourcing obligation — "version number, date, or policy
      deadline" — defined precisely enough for SC-009's 100% figure to be assessed? No planned gate
      detects which claims carry them; the referenced gates check ref *presence*, not claim *type*.
      [Measurability, Spec §FR-023 / §SC-009 / research §R-008]
      — **Resolved 2026-08-09**: FR-023 now enumerates the six claim classes that trigger the dated
      source and states what does not (durable engineering reasoning), making SC-009's 100% assessable.

## Requirement Completeness & Coverage

- [x] CHK012 Is it specified whether a single reference can satisfy both obligations — the dated source
      for a version claim (FR-023) and the "more info" route to further depth (FR-032, SC-017) — or
      whether these are distinct entries with different acceptance criteria?
      [Ambiguity, Spec §FR-032 / §FR-023 / §SC-017]
      — **Resolved 2026-08-09**: FR-032 now states that one reference may serve both roles — and
      usually should — but only when it is primary, dated, **and** actually contains the further depth;
      a reference that merely evidences a claim leaves the "more info" obligation unmet.
- [x] CHK013 Is "primary documentation" defined by an enumerated set of acceptable sources, or only by
      illustrative host names in the contract? FR-025 rejects "secondary write-ups" without stating what
      makes a source primary — "official GitHub orgs" is a category, not a decidable test.
      [Clarity, Spec §FR-025 / Contract §1 "References"]
      — **Resolved 2026-08-09**: FR-025 now defines a primary source as material published by whoever
      owns the thing described, enumerates the qualifying forms, and names the disqualified ones with the
      reason (no guarantee of being updated when the underlying fact changes).
- [x] CHK014 Are freshness requirements defined for references carried across stages? SC-009 requires
      verification "within 30 days of the release that introduced them", but nothing states whether an
      item authored in one stage and delivered in a later one must be re-verified, nor whether
      remediated items inherit or refresh their `checked` dates.
      [Coverage, Gap, Spec §FR-024 / §SC-009]
      — **Resolved 2026-08-09**: FR-024 now anchors the 30-day window to the release that **ships** the
      item rather than the one that introduced it, requires re-verification or hold-back for references
      already stale at ship time, and states that untouched items keep their dates. SC-009 follows.
- [x] CHK015 Are quality requirements defined for the remediation trims themselves? FR-018 mandates
      bringing 46 answers within the band while Out of Scope forbids "rewriting … beyond what FR-018
      requires" — but a cut from 440 to 250 words is substantive, and no requirement states what must
      survive it (traps, technical accuracy, the point the item teaches).
      [Gap, Spec §FR-018 / Out of Scope]
      — **Resolved 2026-08-09**: FR-018 now defines a trim as removal of elaboration, never of
      substance — no claim or caveat that changes correctness may be lost, spoken answer/traps/code/
      follow-ups stay untouched, removed depth routes to the "more info" reference, and an item that
      cannot meet this should be split rather than squeezed.
- [x] CHK016 Is duplication prevention specified for material authored in parallel? FR-004 forbids
      duplicating "a question already in the library", which does not obviously cover two concurrently
      authored tracks producing the same question — the analogous parallel-authoring risk is called out
      for identifiers but not for content. [Coverage, Gap, Spec §FR-004 / Edge Cases]
      — **Resolved 2026-08-09**: FR-004 now covers new-vs-new within the same expansion explicitly,
      and names it the greater risk while twelve tracks are authored in parallel.
- [x] CHK017 Are requirements defined for keeping the cheat sheets' version truths current across the
      five releases? This appears only as an assumption ("their version-truth content is refreshed
      alongside each release") with no FR, no success criterion, and no stated obligation to mark a
      refreshed sheet as updated. [Gap, Spec §Assumptions / Contract §3 `stackSnapshot`]
      — **Resolved 2026-08-09**: promoted from an assumption to new FR-036 — the version-truth registry
      is re-verified every release, no item may contradict it, and a changed cheat sheet is marked updated
      with re-dated references. The Cheat Sheets assumption now points at FR-036 and lists their three
      exemptions.

## Notes

- Check items off as resolved: `[x]`. An item passes when the requirement documents are amended, not
  when the answer is merely known.
- **All 17 items closed on 2026-08-09**, in two passes, entirely by amending spec.md — plus the 62→70
  arithmetic correction in research.md, plan.md, and contracts/content-schema.md.
  - Pass 1 (CHK001–CHK005): FR-032, FR-018, SC-016, SC-018, Key Entities, Out of Scope, Assumptions,
    Clarifications.
  - Pass 2 (CHK006–CHK017): FR-003, FR-004, FR-005, FR-018, FR-023, FR-024, FR-025, FR-032, US1
    acceptance scenario 1, SC-002, SC-009, SC-014, Assumptions, Dependencies; new **FR-035** (level
    rubric), **FR-036** (version-truth currency), **SC-019** (subject coverage), **SC-020** (duplicate
    adjudication).
- Two findings the checklist did not anticipate, surfaced while fixing it:
  **(a)** no track currently spans all four difficulty levels, and Cheat Sheets could not without
  breaching Out of Scope — FR-005 now exempts them; **(b)** research R-002 and plan.md stated the
  remediation as 62 item edits where 46 + 24 = 70 over disjoint sets.
- **Propagated 2026-08-09** to `plan.md` (12 gates, stage-recurring obligations, R-013 decision, file
  tree), `research.md` (R-007 extended to nine workflow changes, R-008 to twelve gates, new **R-013**),
  `contracts/content-schema.md` (level rubric, primary-source definition + allowlist, freshness window,
  dual-role refs, `stackSnapshotChecked`, per-level floors, new §6 authoring-evidence records),
  `contracts/cli-contract.md` (gate table, `--final` promotions, workflow rules, release procedure), and
  `contracts/storage-contract.md` (one line: the new manifest field is not persisted).
- **Still stale**: `quickstart.md`. Scenario 5 checks size/coverage/balance and Scenario 6 checks the
  three-hour depth criterion, but neither knows about the per-level floors, the reference freshness
  window, the host allowlist, subject coverage, or duplicate adjudication — and there is no scenario for
  FR-036. It is the acceptance procedure, so it should be brought up to the amended spec before Stage A.
- The project constitution (`.specify/memory/constitution.md`) is an unpopulated template, so no
  ratified principle could be used as a gate here — the repository's own content policy was used
  instead. Same residual note as `requirements.md` iteration 3.
- Not covered by this checklist (other domains): data safety and migration (FR-019/020, FR-033/034),
  study modes (FR-007–015), release staging and disclosure (FR-027–031).
