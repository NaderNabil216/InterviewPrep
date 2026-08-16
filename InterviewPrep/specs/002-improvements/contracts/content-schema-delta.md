# Contract Delta: Content Schema

**Feature**: `002-improvements` · **Spec**: [../spec.md](../spec.md) · **Data model**: [../data-model.md](../data-model.md)

This is a delta against `specs/001-fill-content-gap/contracts/content-schema.md` — the authoritative full
schema. Only fields this feature adds or re-scopes are listed here; everything else in that contract
(item id format, `track`/`topic`/`level`/`type` core fields, `refs[]`, `addedIn`/`updatedIn`) is unchanged
and this feature's items only ever carry `updatedIn` (never `addedIn` — no item is new).

## `type: "dsa"` — new required field

```jsonc
{
  "id": "ds-0007",
  "type": "dsa",
  // ...existing fields unchanged (pattern, prompt, hints[], complexity, starter, code[])...
  "sampleCall": "threeSum(intArrayOf(-1,0,1,2,-1,-4))"   // NEW — see dsa-run-contract.md
}
```

- **Required**: yes, batch-gated the same way the short-summary rewrite is (a `validate.mjs` gate error
  once a batch is committed, not before — this repo stages required-field rollout by batch, per
  `tools/REFRESH.md`'s existing gate 7 pattern).
- **Shape**: a single Kotlin expression, valid as the sole argument to `println(...)`, that calls the
  item's function with literal sample arguments matching its real signature.
- **Not** a test case — no expected-output comparison is made against it or anywhere else in the schema.

## `type: "design"` — field re-scope, one new field

```jsonc
{
  "id": "sd-0001",
  "type": "design",
  "clarifyingQuestions": [                 // NEW — Step 1 content, rendered before any Step-2 content
    "What's the expected daily active user count, and does the feed need to work fully offline?",
    "..."
  ],
  "requirements": [                        // EXISTING field, re-scoped: clarify-flavored bullets removed,
    "...",                                 // only "cover this in your plan" items remain
    "..."
  ],
  "framework": "...",                      // EXISTING field — content rewritten into two labeled phases
                                            // on the framework item (sd-0000); scenario items' pointer
                                            // text updated to reference the two-phase structure by name
  // ...referenceAnswer, rubric[], staffAdds[], timerMinutes, diagram — unchanged...
}
```

- `clarifyingQuestions[]` is **required on every `design`-type item**, including the framework item
  `sd-0000` (which documents the two-phase structure every scenario must follow), with a **minimum of
  three entries** and no per-item exemption (FR-027b).
- Each entry is a **plain question string**, never an object and never a question/answer pair — no
  authored answer accompanies any clarifying question (FR-027a). This keeps the field shaped like every
  sibling list on a design item (`requirements[]`, `rubric[]`, `staffAdds[]` are all flat string arrays)
  and lets the view reuse the existing checklist rendering rather than introduce an array-of-objects
  pattern with no precedent anywhere in the content set.
- `requirements[]` keeps its existing type/shape (array of string) — only its *content* is re-scoped so it
  no longer overlaps with `clarifyingQuestions[]`.
- Rollout is batched per pack like every other content change in this feature, gated by
  `node tools/validate.mjs` after each batch (US8's Independent Test).

## Level label — no schema field affected

`level` (1–4, numeric) is unchanged. The display string change ("Lead" for level 4) lives entirely in
`assets/js/levels.js` — see [research.md](../research.md) R-008. No item's `level` value, no
`content/manifest.json` entry, and no stored progress/plan data references the display string, so this
delta has no schema-level entry.
