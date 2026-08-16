# Authoring contract — read this fully before writing anything

You are authoring content for an offline Android-interview study site. Output is **JSON pack files
only**. Everything here is enforced by `node tools/validate.mjs`, which must exit 0.

## The one rule with no exception

**Item ids are permanent.** Use exactly the id range you were assigned, in order, with no gaps and
no duplicates. Never invent, reuse, renumber, or stray outside your range. A reused id silently
corrupts a real person's drill history.

## File format

Each pack file is:

```json
{ "id": "<pack-id>", "title": "<Track Title>", "track": "<track>", "items": [ ... ] }
```

`items[].track` must equal the pack's `track` exactly. Write **at most 12 items per file** — split
across the file names you were given, in order.

## Item schema

Every item, every type:

```json
{
  "id": "kt-0014",
  "track": "kotlin",
  "topic": "Generics",
  "level": 3,
  "type": "qa",
  "tags": ["variance", "type-erasure"],
  "q": "The question, as an interviewer would ask it",
  "refs": [ { "title": "...", "url": "https://...", "checked": "2026-08-09" } ],
  "addedIn": "2026.08.9"
}
```

- `level` is 1–4 — 1 Basics, 2 Mid-Level, 3 Senior, 4 Lead. Assign the **lowest** level at which a
  candidate could be expected to answer it. Level inflation is the failure mode to avoid.
- `refs` — **1 or 2, required on every item**, `checked` always exactly `"2026-08-09"`.
- `addedIn` — always exactly `"2026.08.9"`.

### `type: "qa"` (the default — most items)

Adds: `shortAnswer` (array of exactly 3 short sayable sentences), `answer`, `code` (1–2 blocks),
`followUps` (2–3), `traps` (2–3).

**`answer` must be 120–250 words.** This is counted as `/[A-Za-z0-9'`_-]+/g` matches over the raw
markdown. Under 80 or over 350 is a hard error. Aim for 200–240.

### `type: "dsa"` (Problem Solving track only)

Adds: `pattern`, `prompt`, `hints` (exactly 3, progressive), `code`, `complexity`, `followUps`,
`starter`. No word bound on `prompt`.

### `type: "design"` (Mobile System Design track only)

Adds: `prompt`, `framework`, `requirements` (12–16), `referenceAnswer` (700–1200 words), `rubric`
(10–14), `staffAdds` (4–6), `diagram` (inline SVG string), `timerMinutes`. No word bound.

## Markdown dialect in `answer` / `prompt` / `referenceAnswer`

`md.js` supports a deliberate subset: `**bold**`, `*italic*`, `` `inline code` ``, links, `-` and
`1.` lists, `|` tables, and `####` headings.

**There is NO fenced-code-block support. Never put ``` in any prose field.** Fenced blocks render as
mangled inline code with literal backticks. All code goes in the `code` array:

```json
"code": [ { "lang": "kotlin", "caption": "What this shows", "src": "fun main() { ... }" } ]
```

All heading levels render as `<h4>`, so heading depth carries no meaning. Use `####` only.

## References — the allowlist is enforced

`refs[].url` host **must** be one of:

`developer.android.com`, `kotlinlang.org`, `android-developers.googleblog.com`, `blog.jetbrains.com`,
`developers.google.com`, `source.android.com`, `android.googlesource.com`, `support.google.com`,
`docs.gradle.org`, `developer.chrome.com`, `github.com`, `w3.org`, `ietf.org`.

**Cite stable canonical documentation pages only.** No deep `#anchors`, no query strings, no URLs
you are unsure exist. Every URL is network-probed after you finish and anything dead is removed, so
prefer a well-known root page over a specific one you are guessing at. Good examples:

- `https://developer.android.com/topic/architecture`
- `https://developer.android.com/develop/ui/compose/performance`
- `https://kotlinlang.org/docs/coroutines-guide.html`
- `https://kotlinlang.org/docs/collections-overview.html`
- `https://developer.android.com/reference/kotlin/androidx/lifecycle/package-summary`

## Difficulty mix — per track

Across the items you write: **≈11% level 1, ≈30% level 2, ≈43% level 3, ≈16% level 4**, and you must
produce **at least 3 items at every one of levels 1, 2, 3 and 4** (at least 2 each for
`system-design` and `behavioral`).

## Voice

- `q` is what an interviewer actually asks — specific, not a textbook heading.
- `shortAnswer` is what you would *say out loud* first: three crisp sentences.
- `answer` is the depth behind it: mechanism, trade-offs, the "why", concrete numbers where real.
- `traps` are what gets candidates **rejected** on this topic — not generic advice.
- No filler, no "it depends" without saying what it depends on. Write for a senior engineer.

## Hard prohibitions

- Never touch `content/manifest.json`, `content/plans/`, or any pack file that already exists.
- Never write outside the file names you were assigned.
- No duplicate `q` across your items; make each question genuinely distinct.
- Output valid JSON — no trailing commas, no comments, no markdown fences around the JSON.

## Self-check before you finish

1. Item count matches your assignment exactly.
2. Ids are exactly your assigned range, in ascending order.
3. Every `qa` answer is 120–250 words. Count them.
4. No ``` anywhere in any prose field.
5. Every item has 1–2 refs with allowlisted hosts and `"checked": "2026-08-09"`.
6. Levels 1–4 all present, ≥3 each (≥2 for system-design/behavioral).
7. `python3 -c "import json;json.load(open('<your file>'))"` parses.
