# Quickstart: validating `004-kotlin-qa-clarity`

**Feature**: `004-kotlin-qa-clarity` · **Plan**: [plan.md](./plan.md) · **Contracts**:
[section-label-contract.md](./contracts/section-label-contract.md) ·
[prose-voice-contract.md](./contracts/prose-voice-contract.md)

How to prove each of the three deliveries works. Run the section for whichever delivery you just
finished; run all three before calling the feature done.

## Prerequisites

```bash
cd /Users/nn/InterviewPrep
bash tools/serve.sh            # http://localhost:8777 — caching disabled
```

The site **must** be served over `http://localhost`. `fetch()` of local JSON is blocked over
`file://` and `app.js` hard-stops with a notice if `location.protocol === 'file:'`.

Record the baseline before touching anything — every later check is a delta against it:

```bash
node tools/validate.mjs | tail -3
# expected on 2026-08-17 at manifest 2026.08.17:
#   Total: 629 items … All good (0 warning(s))
```

**0 errors and 0 warnings is the baseline.** Re-capture it immediately before each batch rather than
relying on this figure — several gates are date-relative (FR-020a). A new warning is diagnosed, not
just counted (research.md R-006).

---

## Delivery 1 — the labels (US1)

App code only. No content changes, no manifest bump, no release. Hard-refresh after building
(`Cmd-Shift-R`) — `index.html` bumps `app.css?v=6` → `?v=7`, which handles the stylesheet, but the ES
modules still come from the browser cache.

### D1-1 · Every section is labelled, in order  → FR-001, FR-002, FR-004, SC-001

Open `http://localhost:8777/#/item/kt-0004`. Expect, top to bottom, seven pills reading:

`Question` · `The 30-second answer` · `The full picture` · `Code` · `They'll ask next` ·
`What sinks you` · `Sources`

Confirm all seven share one visual treatment — same size, weight, casing, background, border. The
traps section keeps its red box tint; its *label* looks exactly like the other six.

Then confirm the label is distinguishable from the accent-coloured `<h4>` headings *inside* the deep
answer (`kt-0004`'s answer opens with "What inlining buys you"). If you cannot tell a section label
from an in-answer heading at a glance, R-004's treatment has failed.

### D1-2 · Same labels on Drill and Mock  → FR-005, SC-007

```
#/drill/kt-0004        → reveal (click the card or press Space)
```

Expect `Question`, then on reveal `The 30-second answer`, `The full picture`, `Code`. No follow-ups,
traps or sources — Drill has never shown them, and FR-005 requires the same *names*, not the same
sections.

Then `#/mock/android`, reveal a Kotlin item, and confirm the same four strings.

### D1-3 · No label over an absent section  → FR-003, SC-007

89 Q&A items carry no code sample. Find one and open it:

```bash
node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('content/manifest.json','utf8'));
for(const p of m.packs){for(const i of JSON.parse(fs.readFileSync('content/'+p.file,'utf8')).items||[])
if(i.type==='qa'&&!(i.code||[]).length){console.log(i.id);process.exit(0)}}"
```

Expect no `Code` label and no empty code block.

### D1-4 · Non-Q&A items are labelled nowhere  → FR-006, FR-006a, FR-008a, SC-007a

The four routes that can put a non-Q&A item in front of a labelled layout. Every one must show
**zero** `.section-label` nodes.

| Route | How | Item kind |
|---|---|---|
| Search → item page | `Cmd-K`, search `two sum`, open the result | `dsa` |
| Search → item page | `Cmd-K`, search `versions`, open a cheat sheet (`cs-000n`) | `concept` |
| Topics → item page | open any system-design row | `design` |
| Drill queue | `#/drill` until a cheat sheet appears (they are **not** excluded from the queue) | `concept` |
| Mock coding | `#/mock/coding`, reveal | `dsa` |
| Mock system design | `#/mock/design`, reveal | `design` |

Fastest check, in the DevTools console on each:

```js
document.querySelectorAll('.section-label').length   // must be 0
```

**That check is necessary but not sufficient** — zero is equally what you get if the item's
*existing* heading was deleted on the way. `item.js` renders `Likely follow-ups` and `Sources` by
field presence, not by type, so an unconditional markup swap would strip them from exactly these
items. Contract check **C10** is the other half.

### D1-4a · Unlabelled items keep the headings they have today  → SC-007a, FR-008a, contract C10

Applies to the **three item-page rows above** — the two search routes and the Topics route. Drill and
Mock never render follow-ups, traps or sources for any item, so there is nothing there for C10 to
assert.

On a `dsa` item (search → item page):

```js
document.querySelectorAll('.section-label').length                          // 0    — C4
[...document.querySelectorAll('h4')].some(h => h.textContent.trim() === 'Likely follow-ups')   // true — C10
document.querySelector('.refs-box strong')?.textContent.trim() === 'Sources'                   // true — C10
```

On a `design` or `concept` item, only the `Sources` assertion applies — neither kind carries
`followUps`. Counted on 2026-08-17: all **84** non-Q&A items carry `refs`, and **60** (every `dsa`)
carry `followUps`, so the `Sources` heading must survive on every one of these three routes and the
follow-ups heading on the `dsa` one. No non-Q&A item carries `traps`, so that branch has no route to
test.

### D1-5 · The three untouched layouts are byte-identical  → FR-008a, SC-007a

Open `#/dsa`, `#/design`, `#/cheatsheets` and one sheet. Each must look exactly as it did before this
feature. Same console check: zero `.section-label` nodes on all four.

C10 has no counterpart here: these four surfaces render through `dsa.js`, `design.js` and
`cheatsheets.js`, which this feature does not modify at all. The heading-preservation risk exists
only where a non-Q&A item reaches `item.js`, which is D1-4a.

### D1-6 · Print  → FR-007, FR-001a

From `#/item/kt-0004`, print preview (`Cmd-P`). Every label legible with backgrounds disabled — the
pills render as underlined black text, not grey-on-white. The card layout is unchanged.

Then print a cheat sheet (`#/cheatsheets/cs-0001` → the Print button) and confirm it is unchanged
from before the feature — this is the surface the print styles were written for.

### D1-7 · Narrow viewport  → FR-001a

DevTools device toolbar at **320px**. On `#/item/kt-0004`, no label overflows its card; the longest
(`The 30-second answer`) wraps inside its pill or fits, and never pushes the card wider.

### D1-8 · The predicate lives in one place  → FR-006, R-001

```bash
grep -rn "type === 'qa'" assets/js/ | grep -v sections.js     # expect: no output
grep -rln "sections.js" assets/js/views/                      # expect exactly: item.js drill.js mock.js
grep -n "section-label\|SECTION_LABEL" assets/js/md.js assets/js/views/dsa.js \
       assets/js/views/design.js assets/js/views/cheatsheets.js   # expect: no output
```

The last one is the one that matters: a hit in `md.js` means the `Code` label went into the shared
renderer and is leaking onto the DSA page (R-003).

### D1-9 · Accessibility  → FR-024 – FR-028, SC-009, contract C11–C14

**Headings (C11).** On `#/item/kt-0004`, every label must be an `<h4>`, and the seven must appear in
FR-001's order in the document outline:

```js
[...document.querySelectorAll('.section-label')].map(e => e.tagName + ' ' + e.textContent)
// expect 7 rows, all H4, in order:
//   Question · The 30-second answer · The full picture · Code · They'll ask next · What sinks you · Sources
```

A `DIV` in that output is a FR-024 failure, not a styling detail — it means follow-ups and traps lost
the heading semantics they have today.

**Contrast (C12).** Measure on the built page, in **both** themes, rather than trusting the figures
in R-012 — the whole point of that research note is that a treatment can pass in one theme and fail
in the other:

```js
const lin = c => (c/=255, c <= .03928 ? c/12.92 : ((c+.055)/1.055) ** 2.4);
const L = s => { const [r,g,b] = s.match(/\d+/g).map(Number); return .2126*lin(r) + .7152*lin(g) + .0722*lin(b); };
const el = document.querySelector('.section-label');
const cs = getComputedStyle(el);
const ratio = (a, b) => ((Math.max(a,b) + .05) / (Math.min(a,b) + .05)).toFixed(2);
ratio(L(cs.color), L(cs.backgroundColor))   // must be >= 4.5 — run once per theme
```

Expect roughly 7.8 dark and 4.7 light. If `backgroundColor` reports `rgba(0, 0, 0, 0)` the pill lost
its tint and you are measuring against the card instead — fix that before reading the number.

**Themes (C13).** Cycle the theme control through dark → light → auto. The labels stay legible in all
three; nothing inverts, disappears or loses its border.

**One treatment, seven labels (C14).** Confirm the ten properties FR-002 enumerates are identical
across all seven — including the traps label, whose *section* keeps its red tint while its *label*
does not:

```js
const props = ['fontFamily','fontSize','fontWeight','letterSpacing','textTransform','color',
               'backgroundColor','borderColor','borderRadius','padding'];
new Set([...document.querySelectorAll('.section-label')]
  .map(e => props.map(p => getComputedStyle(e)[p]).join('|'))).size   // must be 1
```

**Non-colour affordance (FR-028).** The traps label reads "What sinks you", which states the
section's nature in words. Confirm the section is still identifiable as the danger section with
colour disregarded — print preview (D1-6) is the easiest way to see it, since backgrounds drop there.

---

## Delivery 2 — the rewritten questions (US2)

14 batches, one per `content/packs/kotlin-*.json`, then one release. Run the **batch gate** after
each batch and the **release gate** once, after all 14.

### Batch gate  → FR-020, FR-021, FR-021a

```bash
node tools/validate.mjs                       # exit 0, and no new warning vs the 0/0 baseline
node <scope-check> --delivery q               # adapted from specs/002-improvements/verification/fielddiff.mjs
```

The scope check must report: `q` and `updatedIn` changed, **nothing else**, id set identical, no file
outside `content/packs/kotlin-*.json` touched (data-model.md §5).

**Record the "before" run** (FR-020a). Capture `validate.mjs` output *immediately before* the batch
and diff against it — "no new warning" is measured against that, not against a remembered 0/0. Several
gates are date-relative and this feature runs across 28 batches, so the clean baseline has a shelf
life. Any new warning is diagnosed, not counted: gate 2b means one item outgrew its budget (P7b),
gate 8 means two questions drifted together (D2-4a).

**Fix the feature baseline once, at the start** (FR-021b), and compare every batch of *both*
deliveries against it:

```bash
git rev-parse HEAD > specs/004-kotlin-qa-clarity/baseline.txt   # before the first batch of D2
git show "$(cat specs/004-kotlin-qa-clarity/baseline.txt)":content/packs/kotlin-a.json > /tmp/kotlin-a.before.json
```

The scope check compares against `git HEAD` — "what did this batch touch?" The read-through compares
against this baseline — "what did this feature change?" By D3 those are different questions, because
`HEAD` already contains D2's rewritten questions.

Then the named human read-through, per item, against the baseline text — both FR-021a questions,
recorded in `tasks.md` as evidence rather than as ticks (FR-021d). `kotlin-a.json` goes first and
becomes the reference batch (R-011). If any item fails either question, the **batch** fails and is
reworked and re-gated in full (FR-021e).

### D2-1 · No instructional openers remain  → FR-010, SC-002

```bash
node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('content/manifest.json','utf8'));
const bad=[];for(const p of m.packs){for(const i of JSON.parse(fs.readFileSync('content/'+p.file,'utf8')).items||[])
if(i.track==='kotlin'&&/^(Explain|Distinguish|Describe|Define|List|Write|Compare and contrast)\b/i.test(i.q))bad.push(i.id);}
console.log(bad.length?'STILL INSTRUCTIONAL: '+bad.join(' '):'0 instructional openers');"
```

Expect `0 instructional openers`. Baseline before the rewrite is 5 — `kt-0004`, `kt-0005`, `kt-0007`,
`kt-0031`, `kt-0048`.

### D2-2 · Preview collisions  → FR-012, R-009

```bash
node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('content/manifest.json','utf8'));
const seen=new Map();for(const p of m.packs){for(const i of JSON.parse(fs.readFileSync('content/'+p.file,'utf8')).items||[])
if(i.track==='kotlin'){const k=i.q.replace(/[\`*]/g,'').slice(0,40);(seen.get(k)||seen.set(k,[]).get(k)).push(i.id);}}
for(const [k,v] of seen) if(v.length>1) console.log('COLLISION',JSON.stringify(k),v.join(' '));"
```

Any collision means two adjacent prev/next buttons read identically (`item.js:76-77`). Expect no
output.

### D2-3 · Ids and subjects survive  → FR-011, FR-019, SC-006

The scope check already proves no id moved. The subject check is human: read each rewritten question
beside its original and confirm it asks about the same thing and still names every API name, keyword
and symbol the original did.

### D2-4 · It reads aloud

Read all 70 end to end, out loud. Each should sound like something an interviewer says across a
table. This is the actual acceptance criterion for US2 and there is no script for it.

Watch specifically for **softened instructions** (FR-010a): "Walk me through…", "Tell me about…",
"Can you explain…". These pass D2-1's screen — none of those opening words is on the list — and are
the most likely thing a conversational rewrite produces. Judge by what the sentence asks the
candidate to do, not by its first word.

### D2-4a · No new near-duplicates  → FR-020b, P15, SC-010

Gate 8 scores every question against every other across all 629 items and requires each flagged pair
to carry an adjudication ledger entry. D2 rewrites 70 of its inputs, and a conversational register
moves questions *toward* each other — it trades distinguishing technical phrasing for shared common
words, and the tokenizer discards the stopwords that replace them.

```bash
node tools/validate.mjs 2>&1 | grep -A2 'gate 8' || echo 'no gate 8 output'
```

Expect no new pair. Any that appears is adjudicated **in the batch that caused it**, with a verdict
and a reason — not deferred. Two reasons this cannot wait: gate 8 is staged, so it is only a warning
until `--final`, when it becomes an error; and by then up to 13 more batches stand between the flag
and the edit that caused it.

Note the collision can be **cross-track**: a rewritten Kotlin question can pair with an untouched
question on another track, so do not filter the output to `kt-` ids.

### Release gate  → FR-022, FR-022a, FR-022b, R-007

```bash
node tools/validate.mjs                  # 0 errors, 0 warnings, whole library
node tools/check-refs.mjs kotlin-        # every ref URL still resolves
node tools/sync-manifest.mjs --write --release 2026.08.18 \
  --summary "Kotlin questions reworded in plain, spoken English (70 items)." --date <YYYY-MM-DD>
node tools/validate.mjs                  # gates 6, 10 and 11 only bite once the release exists
```

**The date must be on or before 2026-09-06** (gate 10; oldest Kotlin ref `checked` is 2026-08-07) and
2026-09-13 (gate 11; `stackSnapshotChecked` is 2026-08-14). If either has passed, re-verify for real
before re-dating — see [contracts/prose-voice-contract.md](./contracts/prose-voice-contract.md).

### D2-5 · It reaches a device  → FR-022, SC-008

With the site open in a tab, edit nothing further and switch away and back (auto-sync runs on
`focus`/`visibilitychange`). Expect a toast naming the release summary, and the Topics rows for
Kotlin to show the `UPD` chip. Then confirm your own progress survived: open an item you had rated
and check its status line and notes are unchanged.

---

## Delivery 3 — the rewritten answers (US3)

Same 14-batch rhythm, then a second release. Everything in D2's batch gate applies, with the wider
allowed-field set (`answer`, `traps`, `followUps`, `code[].caption`, `updatedIn`).

### D3-1 · Word band  → FR-013, FR-014, SC-001a, R-006

Per batch, per item — this is the check that catches the drift R-006 identifies:

```bash
node -e "const fs=require('fs');const w=s=>(s||'').match(/[A-Za-z0-9'\\\`_-]+/g)?.length??0;
const f=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
for(const i of f.items) if(i.type==='qa') console.log(i.id, w(i.answer), w(i.answer)>250?'OVER':w(i.answer)<120?'UNDER':'');
" content/packs/kotlin-a.json
```

Every item must land in **120–250**. One over 250 has to come back down without deleting anything
(P7b: rebalance first; if it will not balance, FR-014 wins and the item is recorded as a band
exception).

### D3-1a · Length envelope against the baseline  → FR-014a, SC-001a, P7a

The band alone cannot catch the failure that matters most. Its floor is 120 words and Kotlin's actual
minimum is 162, so an answer can fall from 250 words to 130 — losing a third of its content — and
clear D3-1 without a murmur. P7a closes that by comparing each answer against **its own baseline**:

```bash
node -e "const fs=require('fs'),cp=require('child_process');
const w=s=>(s||'').match(/[A-Za-z0-9'\\\`_-]+/g)?.length??0;
const base=fs.readFileSync('specs/004-kotlin-qa-clarity/baseline.txt','utf8').trim();
const f=process.argv[1];
const now=JSON.parse(fs.readFileSync(f,'utf8'));
const was=JSON.parse(cp.execSync(\`git show \${base}:\${f}\`,{encoding:'utf8'}));
const prev=new Map(was.items.map(i=>[i.id,w(i.answer)]));
for(const i of now.items){const a=prev.get(i.id),b=w(i.answer),d=((b-a)/a*100);
console.log(i.id,a+'→'+b,(d>=0?'+':'')+d.toFixed(1)+'%',Math.abs(d)>15?'◀ OUTSIDE ±15%':'');}
" content/packs/kotlin-a.json
```

Anything flagged is **not automatically rejected** — it is re-checked claim-by-claim against FR-014
and the reason recorded. Shorter is never evidence of a better rewrite; the FR-013a exemplar's target
version is *longer* than the version it beats.

### D3-1b · Entry counts unchanged  → FR-015a, P12

Rewriting a trap is a voice change; merging two into one is a content edit. Nothing in the validator
checks this, and the scope check is what catches it:

```bash
node -e "const fs=require('fs'),cp=require('child_process');
const base=fs.readFileSync('specs/004-kotlin-qa-clarity/baseline.txt','utf8').trim();
const f=process.argv[1];
const now=JSON.parse(fs.readFileSync(f,'utf8'));
const was=JSON.parse(cp.execSync(\`git show \${base}:\${f}\`,{encoding:'utf8'}));
const prev=new Map(was.items.map(i=>[i.id,i]));
for(const i of now.items){const p=prev.get(i.id);
for(const k of ['traps','followUps','code','refs'])
 if((i[k]||[]).length!==(p[k]||[]).length) console.log('COUNT CHANGED',i.id,k,(p[k]||[]).length+'→'+(i[k]||[]).length);}
console.log('done');" content/packs/kotlin-a.json
```

Expect only `done`.

### D3-2 · No fenced code block in prose  → FR-018, gate 15

`validate.mjs` gate 15 covers this **for every prose field except one**. Its `PROSE_FIELDS` list
(`tools/validate.mjs:195-196`) is `q`, `answer`, `shortAnswer`, `prompt`, `referenceAnswer`,
`framework`, `followUps`, `traps`, `hints`, `summary`, `label`, `description` — `caption` is not on
it, and D3 rewrites captions. Confirm the gate reports `✓ gate 15 no fenced code blocks in any prose
field`, then check the field it does not reach:

```bash
node -e "const fs=require('fs');const f=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
let n=0;for(const i of f.items)for(const c of i.code||[])
 if((c.caption||'').includes('\\\`\\\`\\\`')){console.log('FENCE IN CAPTION',i.id);n++;}
console.log(n?n+' bad':'0 fenced blocks in captions');" content/packs/kotlin-a.json
```

### D3-3 · Code samples untouched  → FR-016

The scope check proves it: `code[].src` and `code[].lang` must be identical, `code[].caption` may
move.

### D3-4 · Claims survived  → FR-014, SC-004

The FR-021a read-through, question 1, per item. No script substitutes for it; the scope check and the
validator exist so that this is the only thing left to do by hand.

### D3-5 · Sources still support their claims  → FR-017, SC-005

Read-through, alongside question 1: for each of the item's refs, name the claim in the *rewritten*
text that it supports. A ref whose claim no longer appears is a stranded reference — put the claim
back (FR-014 forbids dropping it anyway).

### D3-6 · One writer per item  → FR-015, SC-003

Read the item end to end on the page: question, short answer, deep answer, caption, follow-ups,
traps. It must sound like one person. Hold it against FR-013a's exemplar and the accepted
`kotlin-a` reference batch — a section that reads like tidied documentation fails even if it is
shorter than before.

### Release gate

As D2's, with `--release 2026.08.19` and the summary *"Kotlin answers, traps and follow-ups reworded
in plain, spoken English (70 items)."* Same date deadlines.

---

## Final acceptance

```bash
node tools/validate.mjs --final          # 0 errors — promotes the staged gates, including the
                                         # gate 2b in-band summary that R-006 is about
```

Then the whole-feature checks:

| Check | Expect | Criterion |
|---|---|---|
| Item ids | 70 Kotlin ids byte-identical to pre-feature | SC-006 |
| Instructional openers | 0, down from 5 | SC-002 |
| gate 2b summary | ≥ 90% in band (baseline was 100%) | R-006 |
| `.section-label` on 84 non-Q&A items | 0, on every route | SC-007a |
| Headings on those same 84 items | `Sources` on 84/84, `Likely follow-ups` on 60/60 `dsa` — still there | SC-007a, C10 |
| Labels are headings | 7/7 render as `<h4>`, in FR-001's order | SC-009, C11 |
| Label contrast | ≥ 4.5:1 in **both** themes, measured on the built page | SC-009, C12 |
| Answers vs baseline | every answer within ±15%, or flagged with a recorded reason | SC-001a, P7a |
| Entry counts | `traps` 2/2 and `followUps` 3/3 on all 70, unchanged | P12 |
| Fenced blocks in captions | 0 | FR-018 |
| Near-duplicate pairs | 0 unadjudicated, library-wide | SC-010, gate 8 |
| Release dates | both on or before 2026-09-06, decided at the FR-022c checkpoint rather than at the gate | FR-022c |
| Progress after both releases | ratings, due dates, notes, plan ticks, mock history intact | SC-008 |
| `releases[]` | two new entries, strictly descending numerically | gate 6 |

A note on evidence: `specs/002-improvements/verification/` holds a small Chrome DevTools Protocol
harness (`cdp.mjs` plus per-story scripts) used to record that feature's walkthrough. It lives in the
Spec Kit scaffold, **not** in the app — `/Users/nn/InterviewPrep` has no test runner by design and
must not gain one. If D1's browser checks are worth recording rather than performing by hand, the
same pattern applies here under `specs/004-kotlin-qa-clarity/verification/`. That is an
implementation-time decision, not something this plan creates.
