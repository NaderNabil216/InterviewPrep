# Quickstart: Validating the Content Expansion

**Feature**: `001-fill-content-gap` · **Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

How to prove this feature works. Every scenario below maps to a success criterion and is runnable as
written. Commands run from `/Users/nn/InterviewPrep` (the app root), **not** from the Spec Kit
subdirectory.

---

## Prerequisites

- Node.js ≥ 18 (the tools use `node:` imports and top-level `await`; no npm install — there are no
  dependencies)
- Python 3 (used by `tools/serve.sh`)
- A Chromium- or WebKit-based browser with DevTools
- Network access for `check-refs.mjs` only

```bash
cd /Users/nn/InterviewPrep
node --version && python3 --version
```

---

## Baseline — capture this before any stage lands

Everything is measured against these numbers.

```bash
mkdir -p InterviewPrep/specs/001-fill-content-gap/baseline
node tools/validate.mjs
```

Expected today: `Total: 93 items`, `by level: {1:6, 2:28, 3:50, 4:9}` — that is 6% / 30% / 54% / 10%
against the 10/30/45/15 target — `All good (0 warning(s))`, exit `0`.

**Capture the 93 ids themselves**, not just the count. SC-018 requires every pre-existing item to still
be present under its original identifier at delivery, and after the expansion there is no way to
reconstruct which 93 those were:

```bash
python3 - <<'PY' > InterviewPrep/specs/001-fill-content-gap/baseline/ids-baseline.txt
import json
m=json.load(open('content/manifest.json'))
for p in m['packs']:
    for i in json.load(open('content/'+p['file']))['items']: print(i['id'])
PY
sort -o InterviewPrep/specs/001-fill-content-gap/baseline/ids-baseline.txt \
        InterviewPrep/specs/001-fill-content-gap/baseline/ids-baseline.txt
wc -l < InterviewPrep/specs/001-fill-content-gap/baseline/ids-baseline.txt   # expect 93
```

At delivery, re-run the same extraction and confirm every baseline id is still present:

```bash
B=InterviewPrep/specs/001-fill-content-gap/baseline
python3 - <<'PY' | sort > "$B/ids-final.txt"
import json
m=json.load(open('content/manifest.json'))
for p in m['packs']:
    for i in json.load(open('content/'+p['file']))['items']: print(i['id'])
PY
comm -23 "$B/ids-baseline.txt" "$B/ids-final.txt"
# expect no output: 0 pre-existing ids lost (SC-018)
```

**Also capture the per-level floors baseline**, which FR-005 now sets and nothing meets today:

```bash
python3 - <<'PY'
import json
m=json.load(open('content/manifest.json'))
t={}
for p in m['packs']:
    for i in json.load(open('content/'+p['file']))['items']:
        t.setdefault(p['track'],{1:0,2:0,3:0,4:0})[i['level']]+=1
for k in sorted(t):
    v=t[k]; floor = 0 if k=='cheatsheets' else (2 if k in ('system-design','behavioral') else 3)
    ok = all(v[l]>=floor for l in (1,2,3,4))
    print(f"{k:16} {[v[l] for l in (1,2,3,4)]}  floor {floor}  {'ok' if ok else 'SHORT'}")
PY
```

Expected today: **every drillable track prints `SHORT`** — no track spans all four levels at all. This is
the criterion the expansion has to create, not preserve (SC-014).

Capture a candidate's learning state, which SC-004 is measured with:

```text
Settings → Export progress → save as baseline-progress.json
```

Reproduce the measurements this plan is built on:

```bash
# stored snapshot cost, and the 3× duplication (R-003)
python3 - <<'PY'
import json
m=json.load(open('content/manifest.json'))
packs={p['id']:json.load(open('content/'+p['file'])) for p in m['packs']}
plans={p['id']:json.load(open('content/'+p['file'])) for p in m['plans']}
flat=[i for p in packs.values() for i in p['items']]
snap={'packs':packs,'plans':plans,'items':flat,'byId':{i['id']:i for i in flat},
      'packMeta':m['packs'],'releases':m['releases'],'stackSnapshot':m['stackSnapshot']}
one={'packs':packs,'plans':plans}
d=lambda o: len(json.dumps(o,separators=(',',':'),ensure_ascii=False))
print(f"3-copy: {d(snap):>9,} chars  ->  629 items ≈ {round(d(snap)/len(flat)*629):>9,}")
print(f"1-copy: {d(one):>9,} chars  ->  629 items ≈ {round(d(one)/len(flat)*629):>9,}")
PY

# qa answer distribution and the remediation set (R-002)
python3 - <<'PY'
import json,re
m=json.load(open('content/manifest.json'))
w=lambda s: len(re.findall(r"[A-Za-z0-9'`_-]+", s or ''))
qa=[];norefs=0
for p in m['packs']:
    for i in json.load(open('content/'+p['file']))['items']:
        if not i.get('refs'): norefs+=1
        if i['type']=='qa': qa.append(w(i.get('answer','')))
print(f"qa n={len(qa)}  in 120-250: {sum(1 for x in qa if 120<=x<=250)}"
      f"  >250: {sum(1 for x in qa if x>250)}  >350: {sum(1 for x in qa if x>350)}"
      f"  <80: {sum(1 for x in qa if x<80)}")
print(f"items with no refs: {norefs}")
PY
```

Expected: `3-copy: 1,207,286 → ≈8,165,407` · `1-copy: 413,311 → ≈2,795,405` · `qa n=64, in-band 18,
>250 46, >350 7, <80 0` · `items with no refs: 24`.

---

## Scenario 1 — Storage holds the full library and reports failure (SC-015, FR-033/034)

**After Stage A, before any content lands.**

```bash
bash tools/serve.sh          # → http://localhost:8777
```

1. Load the site. DevTools → Application → Local Storage: `aip.v1.snapshot` is **gone**; IndexedDB → `aip`
   → `snapshot` holds one record keyed `current`.
2. The record has `packs` and `plans` but **no** `items` or `byId` keys — those are derived in memory.
3. Every view still renders: Dashboard item count, Topics listing, Cheat Sheets (**all 5 items**, including
   the 2 from `cheatsheets-b` that never rendered before — R-012).
4. Console → `navigator.storage.estimate()` — usage is a few MB against a quota in the hundreds.

**Failure reporting** — in DevTools, fill localStorage to its cap (write a large string in a loop until it
throws), then rate any item:

- A **persistent banner** appears naming what failed to save, with an **Export progress** button.
- It does **not** auto-dismiss.
- The rating is not silently reported as saved.

**Migration** — with the old build, confirm `aip.v1.snapshot` exists; load the new build once; confirm
IndexedDB is populated and the localStorage key is removed, with no re-fetch of content.

---

## Scenario 2 — Progress survives an expansion (SC-004, FR-019, US2)

**Run at every content stage.**

1. Before pressing Update: `Settings → Export progress` → `before.json`.
2. Press **Update**. The diff modal lists added / updated / removed with a plain-language release summary.
3. Press **Not now** → the library is unchanged (acceptance 2.3). Press Update again → **Apply**.
4. `Settings → Export progress` → `after.json`.

```bash
python3 - <<'PY'
import json
a=json.load(open('before.json')); b=json.load(open('after.json'))
for k in ('progress','mockResults','settings'):
    print(f"{k:12} identical: {a[k]==b[k]}")
print("plan.done   identical:", a['plan'].get('done')==b['plan'].get('done'))
PY
```

Expected: every line `True`. Any `False` on `progress` is a release blocker.

**Re-import** (acceptance 2.4): `Settings → Import progress` with `before.json` → every rating, interval,
due date, and note reattaches to the same items.

---

## Scenario 3 — Plan ticks follow the material (SC-004, FR-020, US2)

**Run at Stage F, the one release that re-authors the plans.**

Before updating, on the 15-day plan: start the plan, hand-tick one task **with** `itemIds` and one **without**
(a reading or note-taking task). Note both labels.

1. Press **Update**. The pre-acceptance modal names every tick that will be cleared — the no-material one
   must appear by label, the material-backed one must not.
2. Apply. Open the plan.
3. The material-backed tick still reads complete, against the material it was earned on, wherever that
   material now sits in the new schedule.
4. The no-material tick is cleared.
5. DevTools → `aip.v1.plan`: `done` is keyed by `+`-joined sorted item ids; no `dayIdx:taskIdx` keys carry
   meaning any more.

**The check that matters**: 0 ticks land on material the candidate never saw. Walk every ticked task in
the new plan and confirm each one's items appear in `aip.v1.progress`.

---

## Scenario 4 — Three study modes (SC-005/008, FR-007–015, US3)

```text
Plan → mode chooser: 7-day sprint · 15-day deep plan · Free study
```

| Check | Expected |
|---|---|
| Fresh browser profile, first open | **Free study**, whole library available — not routed through a dated plan (acceptance 3.7) |
| Candidate with `startedAt` set from before this release | Still on that dated plan, same position, marks intact (acceptance 3.8) |
| Free study → Dashboard | Due-review count, next unseen from weakest tracks, mastery table — no empty "today" slot |
| Each dated plan | Day-by-day schedule, ≥70% of referenced items new in this expansion (SC-007) |
| Any mode → Topics / search / Drill / DSA / Design | Every item reachable; the plan suggests, never restricts (acceptance 3.4) |
| Switch modes and back | Ratings, drill schedule, notes, mock history, plan position and ticks all unaffected (acceptance 3.5/3.6) |

**Note the comparator.** Versions are compared **numerically**, never as strings — `'2026.08.10' <
'2026.08.7'` is `True` as a string, which would file all 77 Stage-E items under "already existed" and
under-report SC-007 by the width of a whole wave. This is the same defect R-009 fixes in the What's New
view; it belongs nowhere, least of all in the script that checks for it.

```bash
# SC-007: share of plan references that are new in this expansion
# SC-006: does each plan fit the daily budget it declares?      (gate 14)
# FR-010: is each track's share within +-5pp of its interview weight?
python3 - <<'PY'
import json
V=lambda v:[int(x) for x in (v or '0.0.0').split('.')]     # NUMERIC, never string
CUT=V('2026.08.7')
PACE={'qa':5,'concept':0,'dsa':20,'design':45}
WEIGHT={'compose':14,'kotlin':12,'coroutines-flow':12,'architecture':12,'platform':10,
        'data-networking':7,'performance':7,'dsa':8,'build-testing':5,'security-kmp':5,
        'system-design':5,'behavioral':3,'cheatsheets':0}
m=json.load(open('content/manifest.json'))
item={}
for p in m['packs']:
    for i in json.load(open('content/'+p['file']))['items']: item[i['id']]=(i,p['track'])
old={k for k,(i,_) in item.items() if V(i.get('addedIn')) < CUT}
for pl in m['plans']:
    d=json.load(open('content/'+pl['file']))
    ids=[i for day in d['days'] for t in day['tasks'] for i in t.get('itemIds',[])]
    new=sum(1 for i in ids if i not in old)
    print(f"\n{pl['id']:8} {new}/{len(ids)} new = {round(100*new/len(ids))}%   (SC-007 target >=70%)")
    budget=d.get('pace',{}).get('dailyMinutes')
    cost=sum(8 if item[i][1]=='behavioral' else PACE.get(item[i][0]['type'],5) for i in ids if i in item)
    cap=(budget or 0)*len(d['days'])
    print(f"         gate 14: {cost} min over {len(d['days'])} days vs {budget} min/day "
          f"= {cap} -> {'ok' if budget and cost<=cap else 'OVER BUDGET / no pace declared'}")
    share={}
    for i in ids:
        if i in item: share[item[i][1]]=share.get(item[i][1],0)+1
    for t,w in sorted(WEIGHT.items(), key=lambda x:-x[1]):
        pct=round(100*share.get(t,0)/len(ids),1)
        flag='' if (w==0 or (abs(pct-w)<=5 and share.get(t,0)>=1)) else '   <-- FR-010'
        print(f"         {t:18} {share.get(t,0):3} = {pct:5}%  weight {w:2}%{flag}")
PY
```

---

## Scenario 5 — Size, coverage and balance (SC-001/014/016/017, FR-002/005/032)

**Run after every stage; the final run is the delivery gate.**

```bash
node tools/validate.mjs           # during stages
node tools/validate.mjs --final   # at delivery: per-track shortfalls become errors
```

Expected at delivery: exit `0`, `Total: 629 items`, the per-track table showing every track at or above
its FR-002 minimum, difficulty mix within 10/30/45/15 ±5pp, the `qa` in-band line at ≥90%, and **every
drillable track clearing its per-level floor** — ≥3 items at each of L1–L4, ≥2 for `system-design` and
`behavioral`, `cheatsheets` exempt (FR-005). Re-run the baseline floor script above: no track may print
`SHORT`.

The floors are the part that fails quietly. A track can hit its item count, sit inside the library-wide
mix, and still have one level represented by a single token item — which is exactly what "a candidate can
start from the bottom in any track" is meant to prevent.

```bash
node tools/check-refs.mjs         # ~800 probes at final size — minutes, not seconds
node tools/check-refs.mjs kotlin-g   # or scope to one pack group
```

Expected: zero dead links (SC-010).

---

## Scenario 6 — A track outlasts a session (SC-002, US1)

Pick any track — Compose is the sharpest test at 75 items. Topics → filter to that track:

- Item count meets the FR-002 minimum, and every level clears its floor (FR-005).
- Work through the drill queue for that track to exhaustion in one sitting; unseen material remains
  (acceptance 1.2).
- Subject coverage is now checked against the track's **frozen** `scope[]`, not the live workflow config
  — see Scenario 9 (acceptance 1.3, FR-003).

**SC-002 is an arithmetic check, not a stopwatch.** The criterion is three hours of unseen material at
the paces the spec states — 5 min per Q&A item, 20 per Problem Solving exercise, 45 per design scenario,
8 to draft and rehearse a behavioral story:

```bash
python3 - <<'PY'
import json
PACE={'qa':5,'concept':0,'dsa':20,'design':45}
m=json.load(open('content/manifest.json'))
t={}
for p in m['packs']:
    for i in json.load(open('content/'+p['file']))['items']:
        pace = 8 if p['track']=='behavioral' else PACE.get(i['type'],5)
        t[p['track']]=t.get(p['track'],0)+pace
for k in sorted(t):
    if k=='cheatsheets': print(f"{k:16} excluded — reference one-pagers"); continue
    print(f"{k:16} {t[k]:5} min = {t[k]//60}h{t[k]%60:02d}  {'ok' if t[k]>=180 else 'SHORT of 3h'}")
PY
```

Expected at delivery: no drillable track prints `SHORT`. The thinnest are the 40-item tracks at 3h20m —
the margin is thin by design, so if the real pace turns out to be 4 minutes it is the FR-002 minimums
that should be revisited, not this criterion (spec, Assumptions).

---

## Scenario 7 — What's New, in the right order (SC-012/013, FR-027–030, US5, R-009)

**The `2026.08.10` release is the one that proves the ordering fix.**

1. What's New lists releases newest first: `2026.08.11, 2026.08.10, 2026.08.9, 2026.08.8, 2026.08.7,
   2026.08.6, …` — `.10` must sit **above** `.9`, not between `.1` and `.2`.
2. Every added item appears under its release tagged `NEW`; every remediated item under the release that
   changed it, tagged `UPD`.
3. Pick five new items at random: each is reachable from Topics **and** from search (SC-012).
4. Read one release summary and decide whether to accept: under two minutes (SC-013).

```bash
# gate 6: releases[] must be descending under NUMERIC comparison
python3 -c "
import json;r=[x['version'] for x in json.load(open('content/manifest.json'))['releases']]
k=lambda v:[int(p) for p in v.split('.')];print(r);print('descending:', r==sorted(r,key=k,reverse=True))"
```

---

## Scenario 8 — Sources are primary, dated, and current (SC-009/017, FR-023/024/025/036)

**Run at every release.** `check-refs.mjs` proves links are *alive* (Scenario 5); this proves they are
*right*: primary, verified against the release that ships them, and backed by a current version registry.

```bash
python3 - <<'PY'
import json, datetime as dt
from urllib.parse import urlparse
ALLOW = {'developer.android.com','android.googlesource.com','source.android.com',
         'developers.google.com','support.google.com','www.google.com','kotlinlang.org',
         'kotlin.github.io','blog.jetbrains.com','android-developers.googleblog.com',
         'docs.gradle.org','square.github.io','developer.chrome.com','github.com','w3.org','ietf.org'}
# This script matches on HOST only, so it is deliberately coarser than the contract in two places:
#   github.com     — the "official org" half (android, JetBrains, square, cashapp, ...) is a review step
#   www.google.com — the contract path-scopes it to /about/careers; anything else under that host
#                    passes here and must be caught by eye. Both are recorded in T097/T098.
m   = json.load(open('content/manifest.json'))
ver = m['version']
rel = dt.date.fromisoformat(next(r['date'] for r in m['releases'] if r['version']==ver))
win = rel - dt.timedelta(days=30)
stale, offlist, norefs, hosts = [], [], [], {}
for p in m['packs']:
    for i in json.load(open('content/'+p['file']))['items']:
        refs = i.get('refs') or []
        if not refs: norefs.append(i['id'])
        touched = ver in (i.get('addedIn'), i.get('updatedIn'))
        for r in refs:
            h = urlparse(r['url']).netloc
            hosts[h] = hosts.get(h, 0) + 1
            if h not in ALLOW: offlist.append((i['id'], h))
            if touched and not (win <= dt.date.fromisoformat(r['checked']) <= rel):
                stale.append((i['id'], r['checked']))
sc = m.get('stackSnapshotChecked')
print(f"release {ver} dated {rel}; freshness window opens {win}")
print(f"gate 10  refs on items this release ships, outside the window : {len(stale)}  (must be 0)")
print(f"gate  9  refs on hosts outside the primary-source allowlist   : {len(offlist)}")
print(f"gate 11  stackSnapshotChecked = {sc}  in window: "
      f"{bool(sc) and win <= dt.date.fromisoformat(sc) <= rel}")
print(f"gate  3  items with no refs at all                            : {len(norefs)}  (must be 0)")
for label, rows in (('stale', stale), ('off-allowlist', offlist)):
    for r in rows[:10]: print('   ', label, *r)
print('hosts in use:', ', '.join(f'{h}×{n}' for h, n in sorted(hosts.items(), key=lambda x: -x[1])))
PY
```

Expected: gates 3 and 10 report `0`; gate 11 reports `True`; gate 9 reports `0` at delivery — an
off-allowlist host is either a genuinely official source the allowlist is missing (extend it, in
[content-schema §1](./contracts/content-schema.md)) or a secondary write-up that must be replaced.

**The editorial half cannot be scripted — but the set it is drawn from can be.** Gate 13 names it:

```bash
# gate 13 — version-claim screen: which items SC-009 (b)/(c) must be audited over
python3 - <<'PY'
import json, re
PAT = re.compile(r"\d+\.\d+|API \d+|Android \d+|SDK \d+|\d{4}-\d{2}-\d{2}"
                 r"|deprecat|removed|stable|experimental|as of|currently|no longer"
                 r"|minimum|required by", re.I)
m = json.load(open('content/manifest.json')); ver = m['version']
flagged, shipping = [], []
for p in m['packs']:
    for i in json.load(open('content/'+p['file']))['items']:
        prose = ' '.join(str(i.get(k, '')) for k in
                         ('q','answer','shortAnswer','prompt','referenceAnswer','framework'))
        if PAT.search(prose):
            flagged.append(i['id'])
            if ver in (i.get('addedIn'), i.get('updatedIn')): shipping.append(i['id'])
print(f"gate 13  items flagged library-wide: {len(flagged)}")
print(f"         of those, shipped by {ver}: {len(shipping)}  <- the audit population")
print(f"         audit {min(10, len(shipping))} of them: {', '.join(shipping[:10])}")
PY
```

Read **at least ten** of the items it flags for this release — or all of them, where it flags fewer than ten — and confirm by reading that the reference
actually sources the flagged claim, and that it **contains the further depth** rather than merely
evidencing the number — that is what makes it a "more info" route under FR-032. A reference that only
proves the number leaves SC-017 unmet even though every gate passes. One failure means the whole flagged
set for the release is re-reviewed before it ships (SC-009 c).

---

## Scenario 9 — Coverage and duplicate adjudication (SC-019/020, FR-003/004)

**Run at every stage; the `--final` run is the delivery gate.** These two are why the authoring-evidence
records exist ([content-schema §6](./contracts/content-schema.md)).

```bash
# SC-019 — every frozen scope subject maps to a real item, or is dropped with a reason
python3 - <<'PY'
import json, glob, os
ids = set()
for f in glob.glob('content/packs/*.json'):
    ids |= {i['id'] for i in json.load(open(f))['items']}
gaps = []
for f in sorted(glob.glob('.claude/workflows/outlines/*.json')):
    o = json.load(open(f)); track = os.path.basename(f)[:-5]
    scope = o.get('scope')
    if not scope: gaps.append((track, 'no frozen scope[] — FR-003 unmeasurable for this track')); continue
    cov = o.get('coverage', {})
    for s in scope:
        c = cov.get(s)
        if c is None:                       gaps.append((track, f'unmapped: {s}'))
        elif isinstance(c, dict):
            if not c.get('dropped'):        gaps.append((track, f'dropped without a reason: {s}'))
        elif not [x for x in c if x in ids]: gaps.append((track, f'maps to no existing item: {s}'))
print(f'coverage gaps: {len(gaps)}   (warning during stages, error at --final)')
for g in gaps[:20]: print('   ', *g)
PY

# SC-020 — every flagged near-duplicate pair has a verdict
python3 - <<'PY'
import json, os
p = '.claude/workflows/duplicates.json'
led = json.load(open(p)) if os.path.exists(p) else []
by = {}
for e in led: by[e.get('verdict', '(missing)')] = by.get(e.get('verdict', '(missing)'), 0) + 1
bad = [e for e in led if e.get('verdict') not in ('distinct', 'merged', 'accepted') or not e.get('reason')]
print('ledger entries:', len(led), by)
print('entries missing a valid verdict or a reason:', len(bad))
for e in bad[:10]: print('   ', e)
PY
```

Expected at delivery: `coverage gaps: 0`, every ledger entry carrying a valid verdict **and** a reason,
and `validate.mjs --final` reporting no unadjudicated pair. A pair that stays flagged is not a bug in the
screen — the screen is allowed to over-report — it is a decision nobody has made yet.

**Order matters and cannot be recovered afterwards**: a `scope[]` frozen after its track is authored
measures nothing, and a ledger written at the end is a rationalisation rather than an adjudication. Both
are stage work (see [cli-contract §6](./contracts/cli-contract.md)).

---

## Per-stage gate — the short version

Run these before offering any release to a candidate. All must pass.

```bash
# BEFORE registering the stage — while a duplicate can still be merged:
node tools/validate.mjs        # gates 1 + 8 read disk → adjudicate every flagged pair → SC-020

# AFTER registering, before offering the release:
node tools/validate.mjs        # exit 0        → FR-022, SC-011  (--final on the last release)
node tools/check-refs.mjs      # 0 dead links  → FR-026, SC-010
# Scenario 2 export-diff       # progress identical → FR-019, SC-004
# Scenario 1 storage check     # snapshot stored, failures surfaced → FR-033/034, SC-015
# Scenario 8 sourcing script   # 0 stale refs, registry re-verified → FR-024/036, SC-009 (a)
# Scenario 8 gate-13 audit     # >=10 flagged items read; reference sources the claim → SC-009 (c)
# Scenario 9 coverage + ledger # 0 coverage gaps, 0 unadjudicated pairs → SC-019/020
# Scenario 4 plan scripts      # Stage F only: >=70% new, gate 14 in budget, FR-010 weights → SC-006/007
```

---

## Rollback

Content stages are additive and each is a distinct release. To back one out: remove its `packs[]` entries
and its `releases[]` entry from `content/manifest.json`, reset `version` to the previous release, delete
the pack files, and re-run `validate.mjs`. Candidates who already accepted keep their snapshot until they
Update again; their progress is unaffected either way, because it is keyed by id and lives in its own
namespace. **Never** reissue a retired id.
