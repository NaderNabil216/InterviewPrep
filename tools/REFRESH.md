# Content refresh routine

This is the deterministic procedure for bringing the content up to date. Ask Claude Code:

> **"Refresh the interview prep content."**

and it should follow these steps exactly. The result lands on disk; each device picks it up on its
own at the next sync trigger (boot, focus/visibilitychange, or reconnecting) and announces it with a
toast — **provided `manifest.version` was bumped**, which is what makes new content reachable at all.

---

## Step 0 — Read the current state

```bash
cat content/manifest.json | head -30
```

Note `version` and `generatedAt`. **Everything below only looks for changes since `generatedAt`.**

## Step 1 — Sweep the sources

Web-search each of these, restricted to material published **after `generatedAt`**:

**Release & version truth**
- Android Developers Blog — https://android-developers.googleblog.com/
- Kotlin releases — https://kotlinlang.org/docs/whatsnew-eap.html and the JetBrains Kotlin blog
- AndroidX release notes — https://developer.android.com/jetpack/androidx/versions/all-channel
- Compose BOM / compose release notes
- AGP release notes — https://developer.android.com/build/releases/gradle-plugin
- Android Studio release channel

**Platform & policy (these drive the highest-value questions)**
- Android version behavior-change pages (current stable + next preview)
- Google Play policy deadlines — target API level, page sizes, permissions declarations
- Privacy/permission changes

**Community signal on what's actually being asked**
- Now in Android (video/blog series)
- jetc.dev newsletter
- ProAndroidDev / Android Weekly
- Recent "Android interview questions" write-ups (for question *topics*, never for answer text)

## Step 2 — Decide what changes

For each finding, choose one:

| Situation | Action |
|---|---|
| A version number in `stackSnapshot` or `cs-0001` moved | Update it; set `updatedIn` on the affected items |
| An existing answer is now wrong or stale | Edit the answer, set `updatedIn` to the new version, refresh the `checked` date on its refs |
| A genuinely new topic is being asked about | Add a **new item with a new id** |
| A topic became irrelevant | Remove it (rare — prefer keeping it and noting it's legacy) |
| A `qa` answer is over the word band | **Trim it** — see the rule below |

### The word band is a Q&A-only rule

`answer` on `type: "qa"` is authored to **120–250 words**, with a hard ceiling of 350 and a floor of
80. `validate.mjs` errors outside 80–350 and warns outside 120–250.

**`concept`, `dsa` and `design` carry no band.** Cheat sheets are reference one-pagers, DSA prompts
are terse by design, and a 45-minute design scenario needs its reference answer — the literal
reading would put 18 of 19 problem statements below the floor and halve every design answer.
`referenceAnswer` is still authored to 700–1200 words.

### Trimming an over-band answer

A trim **removes elaboration, never substance**. Concretely:

- Cut restatement, throat-clearing, and worked examples that repeat a point already made.
- Keep every distinct claim, caveat and trap. If a claim only survives as a fragment, it was
  substance, not elaboration — put it back.
- **Depth that comes out routes to the item's "more info" reference.** The reader must still be able
  to reach what was removed; that is what makes the ref a route rather than a citation.
- **If an answer cannot reach 250 words without losing substance, split it into two items** with
  their own ids. Do not squeeze. A squeezed answer fails the candidate in the room, which is the
  thing the band exists to prevent.

### Every item carries at least one reference

Library-wide, not just version-bearing items — `validate.mjs` gate 3 errors on an item with none.
The reference is the "more info" route to further depth. One well-chosen primary page can serve both
roles (sourcing a claim and carrying the depth) **only if it actually contains the depth**; where it
merely evidences a number, add a second reference.

A **primary source** is material published by whoever owns the thing being described — the platform,
language, library or standard's own documentation, API reference, release notes, source repository
or official engineering blog. Tutorials, aggregators, Q&A sites and conference write-ups do not
qualify however accurate they are, because nothing guarantees they are updated when the underlying
fact changes. `validate.mjs` gate 9 checks the host allowlist.

## Step 3 — Rules that must not be broken

1. **Item ids are permanent.** Never reuse an id for different content, and never renumber.
   Progress in the browser is keyed by id; reusing one silently corrupts the user's history.
2. **Every item needs at least one `refs` entry with a `checked` date** set to the day you actually
   verified it — never copied forward, never defaulted. It must fall within the **30 days before the
   date of the release that ships the item**; a reference older than that when its item is about to
   ship is re-verified and re-dated, or the item is held back.
3. **Never edit anything under the user's browser storage.** Progress lives only in localStorage.
4. Set `addedIn` on new items and `updatedIn` on changed ones, both to the new manifest version.
5. Keep the answer voice consistent: `shortAnswer` is what you'd *say out loud* in the room;
   `answer` is the depth behind it; `traps` are what gets people rejected.

## Step 4 — Bump the manifest

**Use `tools/sync-manifest.mjs` — never hand-edit `manifest.json`.**

```bash
node tools/sync-manifest.mjs                       # dry run: confirm the pack list
node tools/sync-manifest.mjs --write \
     --release 2026.09.1 --summary "…" \
     --date $(date +%F) --stack-checked $(date +%F)
```

`--date` stamps both `generatedAt` and the release date. `--stack-checked` records when the
`stackSnapshot` version-truth registry was last re-verified; gate 11 errors if it is more than 30
days before the release date, so re-verify the registry at every release.

The resulting shape:

```jsonc
{
  "version": "2026.09.1",              // YYYY.MM.N — increment N for multiple releases in a month
  "generatedAt": "2026-09-03",         // stamped by --date
  "stackSnapshot": { /* refresh any moved versions */ },
  "stackSnapshotChecked": "2026-09-03", // stamped by --stack-checked
  "releases": [
    {
      "version": "2026.09.1",
      "date": "2026-09-03",
      "summary": "One paragraph the sync toast summarises for the user. Say what moved and why it matters."
    },
    /* ...previous releases, newest first... */
  ]
}
```

**The version bump is required.** The app short-circuits its update check on an unchanged version,
so content edits without a bump are invisible.

## Step 5 — Validate

```bash
node tools/validate.mjs           # during a staged expansion
node tools/validate.mjs --final   # before the last release of a delivery
node tools/check-refs.mjs         # every ref URL must resolve
```

Must exit clean: unique ids **across every pack file on disk, registered or not**, valid JSON, every
item carrying at least one dated ref, every `qa` answer inside the band, every plan task resolving
to a real item, and `releases[]` strictly descending under **numeric** version comparison
(`2026.08.10` is newer than `2026.08.9` — string sorting gets this backwards).

`--final` promotes the five gates that are legitimately unmet mid-expansion — per-track counts,
difficulty mix and level floors, unadjudicated near-duplicates, off-allowlist ref hosts, and scope
coverage — plus the remediation backlog, to errors.

## Step 6 — Tell the user what changed

Report the release summary and the count of added/updated items. Their device applies the release by
itself at the next sync trigger — no button, no confirmation — and never mid-Drill or mid-Mock.

---

## Adding new content packs

1. Create `content/packs/<name>.json` with `{ id, title, track, items: [...] }`.
2. Register it with `node tools/sync-manifest.mjs --write`, which inserts it after the last pack of
   the same track. A pack on disk that is not in `manifest.packs[]` does not exist to the app, to
   `validate.mjs`, or to the reader — **but its ids are still claimed** (gate 1 reads disk).
3. Use a fresh id prefix so ids can never collide (`kt-`, `co-`, `cmp-`, `pf-`, `ar-`, `dn-`,
   `pe-`, `bt-`, `sk-`, `ds-`, `sd-`, `bh-`, `cs-` are taken).
4. If it's a new track, the topics browser picks it up automatically from `packMeta`.

## Item schema reference

```jsonc
{
  "id": "cmp-0042",              // permanent
  "track": "compose",
  "topic": "Recomposition & stability",
  "level": 3,                    // 1 basics · 2 solid · 3 senior · 4 staff
  "type": "qa",                  // qa | concept | dsa | design | behavioral
  "tags": ["compose", "performance"],
  "q": "The question",
  "shortAnswer": ["what you say out loud, 2-3 bullets"],
  "answer": "markdown: #### headings, **bold**, *italic*, `code`, lists, | tables |",
  "code": [{ "lang": "kotlin", "caption": "...", "src": "..." }],
  "followUps": ["..."],
  "traps": ["what gets people rejected here"],
  "refs": [{ "title": "...", "url": "...", "checked": "2026-08-07" }],
  "addedIn": "2026.08.1",
  "updatedIn": null
}
```

`type: "dsa"` adds `pattern`, `prompt`, `hints[]`, `complexity`, `starter`.
`type: "design"` adds `prompt`, `framework`, `requirements[]`, `referenceAnswer`, `rubric[]`,
`staffAdds[]`, `timerMinutes`, and `isFramework` for the framework item.
