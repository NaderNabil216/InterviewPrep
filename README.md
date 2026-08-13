# Android Interview Prep

A local, offline-capable study site for Android interviews — basics through staff level, plus
problem solving, mobile system design, and behavioral. Content is verified against the web
(current as of **2026-08-13**) and every version-sensitive claim carries a dated source link.

**629 items** across 13 tracks: Kotlin (70), Coroutines & Flow (55), Compose (75), Platform
(60), Architecture (50), Data/Networking (40), Performance (40), Build & Testing (60),
Security/KMP/Modern (70), Problem Solving (60), Mobile System Design (19), Behavioral (25), Cheat
Sheets (5).

No build step, no npm, no CDN, no framework. Vanilla HTML/CSS/JS + JSON content packs.

---

## Run it

```bash
cd /Users/nn/InterviewPrep && bash tools/serve.sh
```

Then open **http://localhost:8777**.

It must be served over `http://localhost` rather than opened from disk — browsers block `fetch()`
of local JSON over `file://`. The dev server disables caching, so a normal refresh always picks up
content changes.

Different port: `bash tools/serve.sh 9000`.

---

## How the Update button works

This is the core of how the site behaves, so it's worth understanding.

The site renders from a **pinned snapshot** of the content stored in your browser's IndexedDB.
New material sitting on disk is **not shown** until you ask for it.

1. **First load** — fetches `content/manifest.json` and every pack, writes a snapshot to
   IndexedDB, renders from it.
2. **Every later load** — renders instantly from the snapshot (works offline). In the background it
   re-checks the manifest. If disk is newer, the header button changes to **Update available** with
   a count. *Nothing on screen changes.*
3. **You press Update** — a dialog lists exactly what's new, changed, and removed. Confirm, and the
   snapshot is replaced.
4. Your **progress is never touched.** Progress lives in a separate localStorage namespace keyed by
   permanent item ids, so updates can't disturb your drill schedule, notes, plan checkmarks, or
   mock results.

New items are tagged and collected in the **What's New** view with their source links.

### Getting new content onto disk

Ask Claude Code:

> **"Refresh the interview prep content."**

It follows [`tools/REFRESH.md`](tools/REFRESH.md): sweeps a fixed list of sources for anything
published since the manifest's `generatedAt`, updates or adds items (never reusing ids), bumps the
manifest version, and writes a changelog entry. Then you press Update.

---

## What's in it

| View | What it's for |
|---|---|
| **Dashboard** | Resume exactly where you left off, today's plan tasks, review queue, mastery per track |
| **Plan** | 7-day sprint and 15-day deep plan. Every task links to real content and ticks off as you go |
| **Topics** | Browse everything, filter by track / difficulty / status |
| **Drill** | Spaced repetition (SM-2-lite). Rate Again/Hard/Good/Easy; scheduling follows |
| **DSA** | Problems with progressive hints, a saved Kotlin scratchpad, solutions and complexity |
| **System Design** | Framework + scenarios with a live requirements checklist, timer, and scoring rubric |
| **Mock** | Timed rounds: Android screen, system design, coding, or a full loop. Results tracked over time |
| **Cheat Sheets** | Printable one-pagers (version matrix, coroutines, Compose) |
| **What's New** | Everything added or changed in each content release |
| **Settings** | Interview date, theme, and **export/import your progress as JSON** |

Difficulty levels: **1** basics · **2** solid · **3** senior · **4** staff.

### Keyboard

- `/` — search everything
- `j` / `k` — next / previous item
- `Space` — reveal the answer in drill mode
- `Esc` — close search

---

## Suggested use

1. Open **Settings**, set your interview date.
2. Open **Plan**, pick the 7-day sprint or the 15-day deep plan, press **Start plan today**.
3. Work the daily tasks. Rate every item honestly — the drill queue is only as useful as your
   ratings are truthful.
4. From day 5 onward, do at least one **timed** system design scenario out loud, standing up, with
   no notes. Reading a design answer and performing one are different skills.
5. Back up occasionally: **Settings → Export progress**.

---

## Layout

```
index.html                     app shell
assets/css/app.css             design system, light + dark, print styles
assets/js/
  app.js                       hash router, boot, update flow, search, theme
  store.js                     IndexedDB snapshot + localStorage progress, kept strictly separate
  content.js                   pack loading, manifest diffing, merge-on-update
  md.js                        markdown subset + Kotlin syntax highlighter
  srs.js                       SM-2-lite spaced repetition
  search.js                    in-memory search index
  views/*.js                   one module per view
content/
  manifest.json                version, stack snapshot, pack list, release changelog
  packs/*.json                 the content
  plans/{7day,14day}.json      study plans (7-day sprint, 15-day deep), linked to real item ids
tools/
  serve.sh / serve.py          local server with caching disabled
  validate.mjs                 content integrity check
  REFRESH.md                   the content refresh routine
```

### Validate content

```bash
node tools/validate.mjs
```

Checks unique item ids across all packs, required fields, valid JSON, that every source reference
carries a `checked` date, and that every study-plan task points at an item that actually exists.

---

## Privacy

No network requests at runtime and no third-party scripts. Everything is local files plus your
browser — it works on a plane, and on interview day.
