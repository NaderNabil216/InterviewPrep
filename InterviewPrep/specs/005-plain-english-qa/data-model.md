# Phase 1 Data Model: Very Simple English for Questions and Short Answers

**Feature**: `005-plain-english-qa` · **Plan**: [plan.md](./plan.md) · **Research**:
[research.md](./research.md)

**This feature adds no field, removes no field, and changes no field's type.** The authoritative
schema remains `specs/001-fill-content-gap/contracts/content-schema.md`, as amended by
`specs/002-improvements/contracts/content-schema-delta.md`. There is no schema delta to record here,
and that is a requirement (FR-018), not an omission.

What this document fixes is the part the schema cannot express: which *values* this feature is
permitted to change, on which items, under which register, and what must be byte-identical
afterwards. That is the contract the per-batch scope check enforces, and the register the human
read-through enforces.

---

## 1. Study item — the unit being rewritten

**Population**: all **629 items** across 89 registered packs, verified 2026-08-18 against manifest
`2026.08.19`. Every item carries both owned fields; every item's `shortAnswer` has **exactly 3
bullets** (verified — 629/629; see §2). No item is added, retired, split or merged.

| Field | Shape (all items) | This feature |
|---|---|---|
| `id` | unique per Constitution I | **frozen** — the id set is byte-identical after every batch (scope check fails on any diff) |
| `q` | string, 13–215 chars, median 81 (qa: 34–215, median 85) | **rewritten** in VSE, per the register tier for the item's `type` |
| `shortAnswer` | exactly 3 strings (bullets), 1–2 sentences each | **rewritten** in VSE, same tier; **bullet count frozen at 3** (FR-015, FR-018) |
| `answer` | markdown, 80–250 words (band 120–250) | **frozen** — byte-identical (004's field on Kotlin; untouched everywhere else) |
| `traps[]`, `followUps[]` | 545 qa + 60 dsa carry them | **frozen** — entries and counts |
| `code[]` | 437 qa carry ≥1 sample | **frozen** — `src`, `lang`, `caption` |
| `refs[]` | every item (gate 3) | **frozen values** — but each must still support a claim the rewrite actually makes (FR-014, human-checked) |
| `updatedIn` | `2026.08.17` (559 items) / `2026.08.19` (70 kotlin) today | → the track's release version, **only for touched items** (FR-024) |
| `addedIn`, `level`, `topic`, `track`, `tags`, `type` | — | **frozen** |

Two entries deserve emphasis because they are where the scope check earns its keep:

- **`refs[]` is frozen but not inert.** No `refs` value changes in any batch — so the scope check
  treats any refs diff as a batch failure — yet FR-014 still binds: a rewrite that drops the only
  claim a ref supported has stranded it without touching a byte. That is unreachable by any script
  and belongs to the human read-through, which records the source-to-claim mapping per item
  (FR-023).
- **`shortAnswer` is rewritten as a whole, count-frozen.** The scope check compares the array
  *length* for equality (exactly 3 in, exactly 3 out) while permitting entries to move. Merging or
  reordering bullets is a content edit, not a register change (FR-015).

### Invariants (every batch)

1. **Id set is identical** — same count, same values, no additions, no removals, no renumbering.
   (Constitution I, FR-018, SC-005.)
2. **Only `q`, `shortAnswer` and `updatedIn` differ** on the batch's items, and only
   `updatedIn` differs on no other item anywhere. (Scope check.)
3. **`shortAnswer` has exactly 3 bullets** before and after. (FR-015, FR-018.)
4. **No fenced code block** in `q` or `shortAnswer` (gate 15 covers both fields).
5. **Every claim in the pre-rewrite field survives** — version numbers, API names, behavioural
   detail, caveats, causal links, recommendations (FR-011, FR-017). Human-verified, evidence-recorded.
6. **Every retained ref still supports a claim the rewritten item makes**, and no assertion
   needing a source goes unsourced (FR-014). Human-verified, both directions.
7. **No rewritten question is longer than its baseline** (FR-008, raw `q.length`), and **no bullet
   exceeds 25 words** (FR-012, validator's counter) — unless a recorded exception under FR-008a /
   FR-012a names the item and the reason. Preservation wins over every bound.

---

## 2. The register — tiered by item type, not by whim

The register is the spec's exemplars plus floor rules (normative, fixed there). This section fixes
only the *mapping* of register to item kind — the one structural fact the data model owns:

| `type` | Count | Register tier | Applies to | Form requirement |
|---|---|---|---|---|
| `qa` | 545 | **Full VSE** — both exemplars: conversational register, direct address, short split sentences, plain words | `q` + all 3 `shortAnswer` bullets | the interview question survives as a question; a two-part question keeps both parts |
| `dsa` | 60 | **Plain-words half** — everyday words, short sentences, one idea per sentence; NO direct address, NO chat tone | `q` + 3 bullets | the task prompt stays a task prompt — inputs, constraints and the instructional form are preserved (FR-016) |
| `design` | 19 | **Plain-words half** (as above) | `q` + 3 bullets | the scenario stays a scenario — who, what, and the requirements survive (FR-016) |
| `concept` (cheat sheets) | 5 | **Plain-words half** (as above) | `q` + 3 bullets | the compact reference form is preserved — not forced into conversation (FR-016) |

The tier is a property of `type`, exactly like 004's labelling predicate — 545/84 items, no residue.
The word bound (25) and the sentence signal (~18 words, one idea per sentence) bind on **both**
tiers: they live in the floor rules, not the conversational layer (R-006).

### Claims: what must survive, formally

For the read-through, a **claim** is FR-011's definition: *any assertion a reader could act on or be
wrong about* — a version number, an API name, a behavioural statement, a limitation, a caveat, a
causal link, a recommendation. The record counts claims compared per item (FR-023). Version- or
date-bearing claims additionally bind both directions with the item's refs (FR-014); the version-
claim items each release ships are named by gate 13 for a source-support audit.

---

## 3. Content release — how the rewrite reaches a device

One release per track (R-007), cut only when the track's last batch passes (FR-024). Versions
`2026.08.20` … `2026.08.32`; each registered through `tools/sync-manifest.mjs --write` — the only
writer of `manifest.json`.

| Track | Items | `updatedIn` → | Release dated by | Versions |
|---|---|---|---|---|
| kotlin | 70 | track release | ≤ 2026-09-06 (gate 10) | `2026.08.20` |
| compose | 75 | track release | ≤ 2026-09-06 | `2026.08.21` |
| coroutines-flow | 55 | track release | ≤ 2026-09-06 | `2026.08.22` |
| platform | 60 | track release | ≤ 2026-09-06 | `2026.08.23` |
| build-testing | 60 | track release | ≤ **2026-09-08** (oldest ref 08-09) | `2026.08.24` |
| security-kmp | 70 | track release | ≤ 2026-09-06 | `2026.08.25` |
| architecture | 50 | track release | ≤ 2026-09-06 | `2026.08.26` |
| data-networking | 40 | track release | ≤ 2026-09-06 | `2026.08.27` |
| performance | 40 | track release | ≤ 2026-09-06 | `2026.08.28` |
| behavioral | 25 | track release | ≤ 2026-09-06 | `2026.08.29` |
| dsa | 60 | track release, only if ≥1 item touched | ≤ **2026-09-08** | `2026.08.30` |
| system-design | 19 | track release, only if ≥1 item touched | ≤ **2026-09-08** | `2026.08.31` |
| cheatsheets | 5 | track release, only if ≥1 item touched | ≤ 2026-09-06 | `2026.08.32` |

Version numbers are *placeholders* in the strict sequence the tooling consumes; if the calendar
tightens, two completed tracks may coalesce into one release (R-007) and the trailing numbers
collapse. Every release must also clear **gate 11** (`stackSnapshotChecked` 2026-08-14 → ≤
**2026-09-13**) and ship with a gate-13 audit of up to 10 version-claim items (FR-014 evidence on
the release boundary).

Each release lands as **one snapshot replacement** covering the track's items. A half-rewritten
track is never published (FR-024).

### State of one item across the feature

| | id | `q` | `shortAnswer` | `answer` | `updatedIn` | Candidate's progress row |
|---|---|---|---|---|---|---|
| Before | `dn-0001` | documentation register | plainer register (002) | — | `2026.08.17` | untouched |
| After batch | `dn-0001` | **VSE** | **VSE** | — | still `2026.08.17` | untouched |
| After track release | `dn-0001` | VSE | VSE | — | → track version | untouched |

`updatedIn` moves **once**, at the release — batches edit prose only. One visible side effect:
Topics renders a `UPD` chip when `updatedIn === snapshot.version` (`topics.js:59`), so the track's
items carry that chip after its release. Correct — they were updated.

---

## 4. Learning state — untouched, and structurally unable to be touched

| Store | Key | This feature |
|---|---|---|
| `aip.v1.progress` | item id | not read, not written |
| `aip.v1.session` | — | not read, not written |
| `aip.v1.plan` | material signature = `[...itemIds].sort().join('+')` | not read, not written |
| `aip.v1.mockResults` | — | not read, not written |
| `aip.v1.scratch.<id>` | item id | not read, not written |
| IndexedDB `aip/snapshot/current` | `current` | replaced wholesale by each release, as by any release |

The guarantee is stronger than care: every bridge between content and learning state is the **item
id set** — progress rows key on it, plan ticks key on a signature derived from it. This feature
changes no id, so no key on either side moves, and `migrateTicks()` — the machinery that re-anchors
ticks when material changes — has nothing to do. A candidate's ratings, due dates, notes, plan ticks
and mock history come through all releases byte-identical (FR-025, SC-008, Constitution II).

Notes are the one place a candidate can *perceive* a change: a note written under `dn-0001`'s old
wording is now read under its new wording. It is preserved either way; FR-004's rule that a
rewritten question asks about the same subject is what keeps it meaningful.

`content/plans/{7day,14day}.json` reference item ids in `task.itemIds`; ids do not change, so no
plan task is touched.

---

## 5. What a batch changes — the scope check's input

Per batch, the diff against `git HEAD` restricted to the batch's pack file(s) must show:

| | Allowed to differ | Must be identical |
|---|---|---|
| qa items | `q`, `shortAnswer`, `updatedIn` | `id`, `answer`, `traps`, `followUps`, `code`, `refs`, `level`, `topic`, `tags`, `addedIn`, `type`, `track` |
| non-qa items | `q`, `shortAnswer`, `updatedIn` | same set (non-qa items carry no `answer`; `referenceAnswer`/`framework` on design items, `prompt`/`hints`/`sampleCall` on dsa items, `summary`/`label`/`description` on concept items — all frozen) |
| `shortAnswer` array | entries may move | **length = 3** (FR-015, FR-018) |
| Item count per pack | — | unchanged |
| Files outside the batch's packs | — | zero |
| ` ``` ` in `q` / `shortAnswer` | — | zero (gate 15 covers both fields — inherited, not re-implemented) |

The reference batch (R-003) is the one batch that spans files: the check runs per touched file
with the same table. Any deviation fails the batch before the human read-through begins — the point
being that the reviewer spends their attention on truth and register, not on bookkeeping a script
can do (R-009).
