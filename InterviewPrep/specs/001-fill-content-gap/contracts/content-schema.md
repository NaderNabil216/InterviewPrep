# Contract: Content JSON

**Consumers**: the app (`content.js`, all views), `tools/validate.mjs`, `tools/check-refs.mjs`,
`tools/sync-manifest.mjs`, and every authoring agent spawned by
`.claude/workflows/fill-content-gap.js`.

This is the contract the 536 new items are authored against and the 70 existing items are remediated to.
Anything `validate.mjs` rejects is a contract breach. Deltas introduced by this feature are marked
**NEW** or **CHANGED**.

---

## 1. Study Item

```jsonc
{
  "id": "kt-0014",              // ^[a-z]{2,3}-\d{4}$  — PERMANENT, unique library-wide
  "track": "kotlin",            // must equal the owning pack's track
  "topic": "Generics",
  "level": 3,                   // 1 Basics | 2 Mid-Level | 3 Senior | 4 Lead
  "type": "qa",                 // qa | concept | dsa | design
  "tags": ["variance", "type-erasure"],
  "q": "…",
  "refs": [                     // NEW: required on EVERY item, >= 1
    { "title": "Generics", "url": "https://kotlinlang.org/docs/generics.html", "checked": "2026-08-09" }
  ],
  "addedIn": "2026.08.7",
  "updatedIn": "2026.08.9"      // only when the item changed after introduction
}
```

**Id prefixes in use** — `kt- co- cmp- pf- ar- dn- pe- bt- sk- ds- sd- bh- cs-`. No new prefixes: the 13
tracks are fixed (spec, Out of Scope).

**NEW — `level` is assigned against a rubric, not by feel** (FR-035). An item takes the **lowest** level
at which a candidate could be expected to answer it; level inflation is the failure mode the rule exists
to prevent.

**The rubric itself is normative in [spec.md FR-035](../spec.md) and is not restated here.** It is
reproduced verbatim in exactly one other place — `HOUSE_RULES` in `.claude/workflows/fill-content-gap.js`
— because an authoring agent cannot follow a cross-reference. Anywhere else it would be a fourth copy to
drift; when the rubric changes, those two are the only files to touch.

The rubric is **not gated** — `validate.mjs` checks the resulting distribution (§5), not the judgement.
It is enforced by the workflow's house rules and its adversarial-review pass.

**Id allocation** is positional from a wave's `startId`. Claimed-but-unregistered ids still count as
claimed — `co-0049`–`co-0055` are held by `content/packs/coroutines-g-5.json`, so the remaining coroutines
authoring runs `co-0009`–`co-0048` only.

### Type-specific fields

| Type | Required beyond the base | Prose field | Word bound |
|---|---|---|---|
| `qa` | `shortAnswer` (exactly 3 sayable sentences), `answer`, `code[]` (1–2), `followUps[]` (2–3), `traps[]` (2–3) | `answer` | **120–250; hard ceiling 350; floor 80** |
| `concept` | `answer` | `answer` | none |
| `dsa` | `pattern`, `prompt`, `hints[]` (exactly 3, progressive), `code[]`, `complexity`, `followUps[]`, `starter` | `prompt` | none |
| `design` | `prompt`, `framework`, `requirements[]` (12–16), `referenceAnswer`, `rubric[]` (10–14), `staffAdds[]` (4–6), `diagram` (inline SVG), `timerMinutes` | `referenceAnswer` | none (author to 700–1200) |

**CHANGED — the word bound applies to `type: "qa"` only.** Resolved by the user on 2026-08-09. `concept`
(cheat sheets), `dsa` (problem statements are terse by design), and `design` (a 45-minute scenario needs
its reference answer) carry no bound. See [research.md R-001](../research.md).

**NEW — `refs` is required on every type.** Today all 19 `dsa` and all 5 `design` items have none; that
is the entire 24-item ref remediation. The workflow's "No refs field on dsa items" instruction is
withdrawn.

### Canonical word count

Normative, implemented once in `tools/validate.mjs` and used by every report:

```js
const words = (s) => (s || '').match(/[A-Za-z0-9'`_-]+/g)?.length ?? 0
```

Counted over the **raw markdown source** of the field. Markdown syntax is not stripped. Table cells count.
`code[]` entries are never counted — code lives in its own field.

**The counter is part of the contract, not an implementation detail.** The remediation set the whole plan
is scheduled against — 46 trims, 7 of them over the ceiling — only reproduces under *this* algorithm;
counting whitespace-delimited tokens instead, which treats `|` table pipes and `**bold**` markers as
words, gives 48 and 9. FR-018's earlier prose figures (13/24/24) came from a third method and reproduce
under none; the spec was amended to 46 + 24 = 70 on 2026-08-09, and `validate.mjs` is the authority
(R-002).

### Markdown dialect in `answer` / `prompt` / `referenceAnswer`

`md.js` implements a deliberate subset: inline code, `**bold**`, `*italic*`, links, `-` and `1.` lists,
`|` tables, headings. Two consequences authors must respect:

- **All heading levels render as `<h4>`.** Heading depth carries no visual hierarchy — do not rely on it.
- **There is no fenced-code-block support.** Code belongs in `code: [{ lang, caption, src }]`. Only
  `kotlin`/`kt`/unset is syntax-highlighted; anything else renders as escaped plain text.

### References

```jsonc
{ "title": "…", "url": "https://…", "checked": "YYYY-MM-DD" }
```

- **CHANGED — "primary source" is now defined, not illustrated** (FR-025). A primary source is material
  published by whoever **owns the thing being described**: the platform, language, library, or standard's
  own documentation, API reference, release notes, source repository, or official engineering blog.
  Tutorials, aggregators, question-and-answer sites, conference write-ups, model-generated summaries, and
  anything that is itself *reporting on* a primary source do not qualify however accurate they are —
  nothing guarantees they are updated when the underlying fact changes.
  **Host allowlist** — data, not code. Seeded from every host the library already cites, each reviewed
  against the definition above on 2026-08-09:
  `developer.android.com`, `android.googlesource.com`, `source.android.com`, `developers.google.com`,
  `support.google.com` (Play Console help — Google owns Play policy), `www.google.com/about/careers`
  (path-scoped: Google's own hiring guidance is primary for items *about* Google's hiring),
  `android-developers.googleblog.com`, `kotlinlang.org`, `kotlin.github.io`,
  `blog.jetbrains.com`, `youtrack.jetbrains.com`, `docs.gradle.org`, `square.github.io`,
  `developer.chrome.com`, `w3.org`, `ietf.org`, and
  `github.com` **under an official org** (`android`, `JetBrains`, `square`, `cashapp`, …),
  `mas.owasp.org`, `ktor.io`, `firebase.google.com`, `developer.apple.com` (added 2026-08-14:
  OWASP MAS guide is OWASP's own mobile-app-security standard, Ktor's docs are JetBrains',
  Firebase docs are Google's, and the Keychain Services reference is Apple's — each is published
  by the owner of the thing being described).
  Gated as a warning during stages and an error at `--final` (R-008 gate 9) — a warning is the right
  severity mid-expansion precisely because the correct response is often "this host is legitimately
  official, add it", not "replace the source". The org half of the `github.com` rule is **not** checked
  by host matching; it is a review step, and the three `github.com` refs in the library today
  (`android/nowinandroid` ×2, `cashapp/turbine`) were confirmed by hand.
- **CHANGED — `checked` freshness is anchored to the shipping release** (FR-024). It is the date the claim
  was **actually verified**, never copied forward or defaulted, and it must fall within the **30 days
  before the `date` of the release that ships the item** — the one that introduces it or updates it.
  A reference already older than that window when its item is about to ship is re-verified and re-dated,
  or the item is held back. Items a release does not touch keep the dates they shipped with, which is what
  keeps this affordable at 629 items. The workflow's `CHECKED` constant must be passed per wave, not left
  at its `2026-08-07` default. Gated as an error (R-008 gate 10); this is what makes SC-009 measurable.
- **NEW — one reference may serve both roles** (FR-032). The dated source for a version claim and the
  "more info" route to further depth are usually best served by the same well-chosen primary page. It
  qualifies for both only when it is primary, dated, **and actually contains the further depth** rather
  than merely evidencing the claim — otherwise a second reference is required. The "contains the depth"
  half is editorial and is checked in review, not by a gate.
- Cite the stable canonical page, never an invented deep anchor. Every URL must resolve live at delivery
  (FR-026) — gated by `tools/check-refs.mjs`.

---

## 2. Content Pack — `content/packs/*.json`

```jsonc
{ "id": "kotlin-g-1", "title": "Kotlin Language", "track": "kotlin", "items": [ /* … */ ] }
```

- One track per pack. `items[].track` must equal `track`.
- **A pack not listed in `manifest.packs[]` does not exist** to the app, to `validate.mjs`, or to the
  candidate — but **its ids are still claimed** (NEW gate, R-008 §1).

---

## 3. Library Registry — `content/manifest.json`

```jsonc
{
  "version": "2026.08.7",                 // the update trigger
  "generatedAt": "2026-08-09",            // CHANGED: stamped on release, no longer stale
  "stackSnapshot": { /* version-truth strings */ },
  "stackSnapshotChecked": "2026-08-09",   // NEW: when the registry was last re-verified (FR-036)
  "packs":    [ { "id": "…", "title": "…", "track": "…", "file": "packs/….json" } ],
  "plans":    [ { "id": "7day", "title": "…", "file": "plans/7day.json" } ],
  "releases": [ { "version": "2026.08.7", "date": "2026-08-09", "summary": "…" } ]  // NEWEST FIRST
}
```

- `version` is the sole update trigger. `checkForUpdates()` short-circuits when
  `diskManifest.version === snapshot.version`, so **content edits without a bump are unreachable**.
- `packs[]` is grouped by track and ordered; `sync-manifest.mjs` inserts after the last pack of the same
  track.
- **NEW — `releases[]` must be strictly descending under numeric `YYYY.MM.N` comparison.** String sorting
  places `2026.08.10` before `2026.08.9`, which this feature's own release train would hit (R-009).

```js
const cmpVersion = (a, b) => {           // normative comparator
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i]
  return 0
}
```

- `stackSnapshot` is the **single source of truth for every version claim** in authored content. No item
  may contradict it. **NEW — it is re-verified at every release** (FR-036) and `stackSnapshotChecked` is
  re-stamped with the date it was checked; the gate errors when that date is more than 30 days before the
  release `date` (R-008 gate 11). It is a single date deliberately: the registry is re-verified as a unit,
  and a per-entry date would be eight more things to forget. Where re-verification changes a cheat
  sheet's content, that sheet takes `updatedIn` and its own refs are re-dated. `stackSnapshotChecked` is
  a sibling of `stackSnapshot`, not a member of it — no view iterates the manifest's top level, so adding
  the key changes no rendering.

---

## 4. Dated Plan — `content/plans/{7day,14day}.json`

```jsonc
{
  "id": "7day", "title": "7-day sprint", "description": "…",
  "pace": { "dailyMinutes": 150, "note": "…" },   // NEW: the budget the plan is sized against (FR-008)
  "days": [
    { "title": "…", "focus": "…",
      "tasks": [ { "kind": "read", "label": "…", "itemIds": ["kt-0001"] } ] }
  ]
}
```

- `kind` ∈ `read | drill | dsa | design`; it selects the view "open →" routes to.
- Every id in `itemIds[]` must resolve — `validate.mjs` errors otherwise (FR-021).
- **NEW — a task's completion identity is its material signature**, `[...itemIds].sort().join('+')`, not
  its `dayIdx:taskIdx` position. A task with an empty `itemIds[]` has no signature and therefore cannot
  carry a mark across a re-authoring; those are the only marks FR-020 permits to be cleared.
- **NEW — `pace.dailyMinutes` is required** (FR-008). The summed working time of every referenced item
  slot, at the SC-002 paces (`qa` 5 · `dsa` 20 · `design` 45 · any item in the `behavioral` track 8 ·
  `concept` 0), must be ≤ `days.length × pace.dailyMinutes`. Every entry in every task's `itemIds` counts
  once per occurrence: a deliberate second pass is scheduled work. Error (R-008 gate 14) — this is what
  turns SC-006 from an assertion into a measurement. `note` is free prose shown to the candidate.
- **Authoring constraint (FR-010)**: both plans draw ≥70% of their referenced material from items that did
  not exist before this expansion (SC-007), and distribute across tracks by **interview weight** — the
  per-track table in [spec.md FR-010](../spec.md), each track's share of referenced item slots within
  ±5pp of its weight, every weighted track represented by ≥1 item. Weight is not track size: Compose
  carries 14% against Security/KMP's 5% although both are large tracks.

---

## 5. Per-track targets

Authoritative for FR-002 / SC-001. `validate.mjs` reports this table every run (warning until the final
stage, error at delivery).

| Track | prefix | built | target | gap | stage |
|---|---|---:|---:|---:|---|
| kotlin | `kt` | 13 | 70 | 57 | B |
| coroutines-flow | `co` | 8 (+7 adopted) | 55 | 40 | B |
| compose | `cmp` | 11 | 75 | 64 | B |
| platform | `pf` | 10 | 60 | 50 | C |
| architecture | `ar` | 7 | 50 | 43 | C |
| data-networking | `dn` | 4 | 40 | 36 | C |
| performance | `pe` | 3 | 40 | 37 | C |
| build-testing | `bt` | 2 | 60 | 58 | D |
| security-kmp | `sk` | 3 | 70 | 67 | D |
| dsa | `ds` | 19 | 60 | 41 | E |
| system-design | `sd` | 5 | 19 | 14 | E |
| behavioral | `bh` | 3 | 25 | 22 | E |
| cheatsheets | `cs` | 5 | 5 | 0 | — |
| **Total** | | **93** | **629** | **536** | |

**Difficulty mix**, library-wide at completion: 10% L1 / 30% L2 / 45% L3 / 15% L4, ±5pp per band
(FR-005, SC-014). Current mix is 6% / 30% / 54% / 10% (counts 6/28/50/9 across 93 items) — the expansion must pull L1 and L2 up.
Outline prompts specify the mix per track.

**CHANGED — spanning all four levels now has a floor.** A single token item at a level does not count:

| Track group | Floor per level |
|---|---|
| Every track of 40+ items (all but the three below) | **≥3 items at each of L1–L4** |
| `system-design` (19), `behavioral` (25) | **≥2 items at each of L1–L4** |
| `cheatsheets` (5) | **exempt** — reference one-pagers, frozen at size, not drilled by level |

Measured 2026-08-09, **no track spans all four levels today** — `cheatsheets` is L1/L2 only and could not
comply without growing, which Out of Scope forbids; hence the exemption. Gated as a warning during stages
and an error at `--final` (R-008 gate 5).

---

## 6. Authoring-evidence records — `.claude/workflows/`

**NEW.** Two records that exist so FR-003 and FR-004 are checkable rather than asserted. Neither is
shipped: the app fetches only `manifest.json` and the packs and plans it registers, so nothing here
reaches the candidate. `validate.mjs` reads both — the one place it looks outside `content/` (the
trade-off is argued in [research.md R-013](../research.md)).

### Frozen scope + coverage — `outlines/<track>.json`

The existing outline checkpoint gains two fields:

```jsonc
{
  "track": "kotlin",
  "scope": [                       // NEW: enumerated from the wave config's scope prose,
    "null-safety internals",       //      FROZEN before this track is authored (FR-003)
    "variance and star projections"
  ],
  "coverage": {                    // NEW: filled after authoring (SC-019)
    "null-safety internals": ["kt-0014", "kt-0031"],
    "variance and star projections": { "dropped": "folded into generics; no interviewer asks it alone" }
  },
  "items": [ /* the existing outline entries */ ]
}
```

**The outline agent must preserve these two fields, never overwrite them.** Its checkpoint step writes
the same file, and nine of the twelve tracks have no cached outline, so a wholesale write would destroy a
`scope[]` frozen minutes earlier — and letting the agent author `scope[]` itself is not an alternative,
because a scope written while planning against the same prose was never frozen in advance (cli-contract
§5).

Every subject maps to ≥1 existing item id **or** carries a `dropped` reason. Warning during stages — a
track mid-authoring is legitimately incomplete — error at `--final` (R-008 gate 12).

### Duplicate adjudication ledger — `duplicates.json`

```jsonc
[
  { "ids": ["kt-0031", "co-0012"], "verdict": "distinct",
    "reason": "same topic, different question: one asks when, one asks how",
    "release": "2026.08.8" }
]
```

`verdict` ∈ `distinct | merged | accepted`. Every pair the near-duplicate screen flags must appear here
**before its stage is registered**, not merely before delivery: once the packs are in `manifest.packs[]`
the `merged` verdict is no longer available and adjudication degrades into explaining a shipped
duplicate. This is why gate 8 reads packs off disk (cli-contract §1). SC-020 requires zero unadjudicated
pairs. The screen's similarity threshold is a tooling
knob, not a contract term — it may over-report, because a human decides (FR-004).
