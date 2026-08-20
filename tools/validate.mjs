#!/usr/bin/env node
// Sanity-checks the content set. Run: node tools/validate.mjs [--final]
//
// This is the closest thing this repo has to a test suite, and it is the authority over every
// prose figure in the spec — the word counter below is normative, not an implementation detail.
//
// --final promotes gates 4, 5, 8, 9 and 12 from warnings to errors. Each of those five is
// legitimately unmet mid-expansion (a track being authored has not reached its target count, its
// level floors, or its full subject coverage, and a flagged duplicate has not been adjudicated
// yet), so erroring on them during stages would make the gate useless.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const FINAL = process.argv.includes('--final');

let errors = 0;
let warnings = 0;
const err = (m) => { console.error('  ✗ ' + m); errors++; };
const warn = (m) => { console.warn('  ! ' + m); warnings++; };
// Gates 4, 5, 8, 9, 12: warning during stages, error at delivery.
const staged = (m) => (FINAL ? err : warn)(m);

// Gates 2, 3 and 14 are release-scoped, on the same principle as gate 10: an item the current
// release ships must be compliant now, an item it does not touch is remediation backlog that the
// stage schedule closes. Everything becomes an error at --final, so nothing is forgiven at
// delivery. Without this the stage gates could never exit 0, because the 46 trims and 24 ref
// additions are deliberately spread across Stages B-E.
const shipped = (m) => err(m);
const backlog = (m) => (FINAL ? err : warn)(m);

// --- normative word count (contracts/content-schema.md §1) -------------------------------------
// Counted over the raw markdown source. Markdown syntax is not stripped; table cells count.
// The remediation set the whole plan is scheduled against only reproduces under this algorithm.
const words = (s) => (s || '').match(/[A-Za-z0-9'`_-]+/g)?.length ?? 0;

// --- normative version comparator (contracts/content-schema.md §3) ------------------------------
// String comparison puts '2026.08.10' below '2026.08.9'; this release train hits exactly that.
const cmpVersion = (a, b) => {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  return 0;
};

// --- data, not code ----------------------------------------------------------------------------
// FR-002 per-track targets (contracts/content-schema.md §5).
const TARGETS = {
  kotlin: 70, 'coroutines-flow': 55, compose: 75, platform: 60, architecture: 50,
  'data-networking': 40, performance: 40, 'build-testing': 60, 'security-kmp': 70,
  dsa: 60, 'system-design': 19, behavioral: 25, cheatsheets: 5,
};
const TOTAL_TARGET = 600;
// cheatsheets are reference one-pagers, frozen at size and not drilled by level — exempt.
const levelFloor = (track) =>
  track === 'cheatsheets' ? 0 : (track === 'system-design' || track === 'behavioral' ? 2 : 3);
const MIX_TARGET = { 1: 10, 2: 30, 3: 45, 4: 15 };
const MIX_TOLERANCE = 5;

// FR-025 primary-source host allowlist. A primary source is published by whoever owns the thing
// being described. The `github.com` entry's "official org" half and the path scoping on
// www.google.com are review steps, not host matching — see contracts/content-schema.md §1.
const ALLOWED_HOSTS = new Set([
  'developer.android.com', 'android.googlesource.com', 'source.android.com',
  'developers.google.com', 'support.google.com', 'www.google.com',
  'android-developers.googleblog.com', 'kotlinlang.org', 'kotlin.github.io',
  'blog.jetbrains.com', 'youtrack.jetbrains.com', 'docs.gradle.org', 'square.github.io',
  'developer.chrome.com', 'github.com', 'w3.org', 'www.w3.org', 'ietf.org', 'www.ietf.org',
  'datatracker.ietf.org', 'mas.owasp.org', 'ktor.io', 'firebase.google.com', 'developer.apple.com',
]);

// FR-023 version-claim patterns for the gate 13 screen.
const CLAIM = /\d+\.\d+|API \d+|Android \d+|SDK \d+|\d{4}-\d{2}-\d{2}|deprecat|removed|stable|experimental|as of|currently|no longer|minimum|required by/i;

// SC-002 study paces, in minutes per item slot.
const PACE = { qa: 5, concept: 0, dsa: 20, design: 45 };
const paceOf = (item, track) => (track === 'behavioral' ? 8 : (PACE[item.type] ?? 5));

const FRESHNESS_DAYS = 30;
const DUP_THRESHOLD = 0.6;

// ================================================================================================
const manifest = read('content/manifest.json');
console.log(`Manifest v${manifest.version} (generated ${manifest.generatedAt})${FINAL ? '  [--final]' : ''}`);

const seenIds = new Map();
const allItems = [];
const trackOf = new Map();      // item id -> track (from the owning pack)
const REQUIRED = ['id', 'track', 'topic', 'level', 'type', 'q'];

for (const packMeta of manifest.packs) {
  let pack;
  try {
    pack = read(join('content', packMeta.file));
  } catch (e) {
    err(`pack ${packMeta.id}: cannot read ${packMeta.file} — ${e.message}`);
    continue;
  }
  if (!Array.isArray(pack.items)) { err(`pack ${packMeta.id}: no items array`); continue; }

  for (const item of pack.items) {
    allItems.push(item);
    trackOf.set(item.id, packMeta.track);
    for (const field of REQUIRED) {
      if (item[field] === undefined || item[field] === null || item[field] === '') {
        err(`${item.id || '(no id)'} in ${packMeta.file}: missing "${field}"`);
      }
    }
    if (seenIds.has(item.id)) {
      err(`duplicate id "${item.id}" in ${packMeta.file} (also in ${seenIds.get(item.id)})`);
    } else {
      seenIds.set(item.id, packMeta.file);
    }
    if (item.track !== packMeta.track) {
      warn(`${item.id}: track "${item.track}" differs from pack track "${packMeta.track}"`);
    }
    if (![1, 2, 3, 4].includes(item.level)) err(`${item.id}: level must be 1-4, got ${item.level}`);
    if (!item.addedIn) warn(`${item.id}: no addedIn version — it will not appear in What's New`);
    for (const ref of item.refs || []) {
      if (!ref.checked) err(`${item.id}: ref "${ref.title}" has no checked date`);
      if (!/^https?:\/\//.test(ref.url || '')) err(`${item.id}: ref "${ref.title}" has a bad url`);
    }

    // Does the release the manifest currently declares introduce or modify this item?
    const shipsNow = manifest.version === item.addedIn || manifest.version === item.updatedIn;
    const level = shipsNow ? shipped : backlog;
    const tag = shipsNow ? `shipped by ${manifest.version}` : 'remediation backlog';

    // --- gate 2 / 2b: the word band is a Q&A rule (R-001) ---
    if (item.type === 'qa') {
      const n = words(item.answer);
      if (n > 350) level(`gate 2  ${item.id}: qa answer is ${n} words, over the 350 ceiling (${tag})`);
      else if (n < 80) level(`gate 2  ${item.id}: qa answer is ${n} words, under the 80 floor (${tag})`);
      else if (n > 250 || n < 120) warn(`gate 2b ${item.id}: qa answer is ${n} words, outside the 120-250 band`);
    }

    // --- gate 3: every item routes to further depth ---
    if (!(item.refs || []).length) {
      level(`gate 3  ${item.id}: no refs — every item needs a "more info" route (${tag})`);
    }

    // --- gate 7: type-specific required fields, promoted from warning ---
    if (item.type === 'dsa') {
      for (const f of ['pattern', 'hints', 'complexity', 'starter']) {
        const v = item[f];
        if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) {
          err(`gate 7  ${item.id}: dsa item missing "${f}"`);
        }
      }
      if (Array.isArray(item.hints) && item.hints.length !== 3) {
        warn(`gate 7  ${item.id}: dsa item has ${item.hints.length} hints, expected exactly 3`);
      }
      // FR-019b (sampleCall) — staged like the other rollout gates: missing during a batch is a
      // warning, still-missing at --final is an error.
      if (typeof item.sampleCall !== 'string' || !item.sampleCall.trim()) {
        staged(`gate 7  ${item.id}: dsa item missing a non-empty "sampleCall"`);
      }
    }
    if (item.type === 'design' && !item.isFramework) {
      for (const f of ['requirements', 'rubric', 'timerMinutes']) {
        const v = item[f];
        if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) {
          err(`gate 7  ${item.id}: design scenario missing "${f}"`);
        }
      }
    }
    // FR-027a/FR-027b (clarifyingQuestions) — required on EVERY design item, framework item included
    // (unlike the requirements/rubric/timerMinutes check above), with at least 3 plain-string
    // entries. The element-shape checks exist because validate.mjs type-checks no array's element
    // shape today — without them the array-of-objects shape FR-027a rules out would pass silently.
    if (item.type === 'design') {
      const cq = item.clarifyingQuestions;
      if (!Array.isArray(cq) || !cq.length) {
        staged(`gate 7  ${item.id}: design item missing "clarifyingQuestions"`);
      } else {
        if (cq.length < 3) {
          staged(`gate 7  ${item.id}: design item has ${cq.length} clarifying questions, minimum is 3`);
        }
        const bad = cq.filter(e => typeof e !== 'string' || !e.trim().length);
        if (bad.length) {
          staged(`gate 7  ${item.id}: clarifyingQuestions must be non-empty plain strings, found ${bad.length} invalid entry(ies)`);
        }
      }
    }
  }
  console.log(`  ✓ ${packMeta.id.padEnd(20)} ${String(pack.items.length).padStart(4)} items`);
}

// ================================================================================================
// gate 15 — no fenced code block in any prose field. md.js has no fenced-code support, so a ```
// in prose renders as mangled inline code. Error always, never staged: it is a rendering
// contract, not an expansion-scope metric. Code lives in the item's code[] array.
// ================================================================================================
const PROSE_FIELDS = ['q', 'answer', 'shortAnswer', 'prompt', 'referenceAnswer', 'framework',
  'followUps', 'traps', 'hints', 'summary', 'label', 'description'];
let fences = 0;
for (const item of allItems) {
  for (const k of PROSE_FIELDS) {
    const v = item[k];
    if (v == null) continue;
    const s = Array.isArray(v) ? v.join('\n') : String(v);
    if (s.includes('```')) {
      err(`gate 15 ${item.id}: field "${k}" contains a fenced code block — md.js cannot render it; move it to code[] or inline it`);
      fences++;
    }
  }
}
if (!fences) console.log('  ✓ gate 15 no fenced code blocks in any prose field');

// ================================================================================================
// gate 16 — progress accounting (feature 007). Runs the check-progress battery against the real
// assets/js/progress.js module plus the six defect stand-ins, each of which must be caught.
// Error always, never staged: it guards a code contract (the single definition of progress), not
// an expansion-scope metric. Standalone: node tools/check-progress.mjs
// ================================================================================================
try {
  const { runProgressChecks } = await import('./check-progress.mjs');
  const { passed, failures, defects } = await runProgressChecks();
  const caught = defects.filter(d => d.caughtBy).length;
  if (failures.length) {
    for (const f of failures) err(`gate 16 ${f}`);
  } else {
    console.log(`  ✓ gate 16 progress accounting — ${passed} assertions, ${caught}/${defects.length} defect stand-ins caught`);
  }
} catch (e) {
  err(`gate 16 could not run — ${e.message}`);
}

// ================================================================================================
// gate 1 — id uniqueness across EVERY pack file on disk, registered or not.
// A pack the manifest does not list does not exist to the app, but its ids are still claimed.
// This is the blind spot that let coroutines-g-5.json sit unnoticed.
// ================================================================================================
const PACK_DIR = join(ROOT, 'content/packs');
const diskPacks = [];
for (const f of readdirSync(PACK_DIR).filter(f => f.endsWith('.json')).sort()) {
  try {
    diskPacks.push({ file: 'packs/' + f, doc: read(join('content/packs', f)) });
  } catch (e) {
    err(`gate 1  cannot read content/packs/${f} — ${e.message}`);
  }
}
const diskIds = new Map();
const diskItems = [];
let unregistered = 0;
const registeredFiles = new Set(manifest.packs.map(p => p.file));
for (const { file, doc } of diskPacks) {
  if (!registeredFiles.has(file)) unregistered++;
  for (const item of doc.items || []) {
    diskItems.push({ item, file, track: doc.track });
    if (diskIds.has(item.id)) {
      err(`gate 1  duplicate id "${item.id}" in ${file} (also in ${diskIds.get(item.id)})`);
    } else {
      diskIds.set(item.id, file);
    }
  }
}
if (unregistered) {
  warn(`gate 1  ${unregistered} pack file(s) on disk are not in manifest.packs[] — invisible to the app, but their ids are claimed`);
}

// ================================================================================================
// plans — item ids must resolve (FR-021), and gate 14: the plan must fit its own declared budget
// ================================================================================================
for (const planMeta of manifest.plans || []) {
  const plan = read(join('content', planMeta.file));
  let refs = 0, missing = 0, cost = 0;
  for (const [d, day] of plan.days.entries()) {
    for (const task of day.tasks) {
      for (const id of task.itemIds || []) {
        refs++;
        if (!seenIds.has(id)) { err(`plan ${planMeta.id} day ${d + 1}: unknown item id "${id}"`); missing++; }
        else {
          const it = allItems.find(x => x.id === id);
          cost += paceOf(it, trackOf.get(id));
        }
      }
    }
  }
  console.log(`  ✓ plan ${planMeta.id.padEnd(15)} ${plan.days.length} days, ${refs} item refs${missing ? ` (${missing} broken)` : ''}`);

  // --- gate 14: study budget (FR-008 / SC-006) ---
  const daily = plan.pace && plan.pace.dailyMinutes;
  if (!daily) {
    // Backlog until Stage F re-authors the plans; an over-budget declared pace is always an error.
    backlog(`gate 14 plan ${planMeta.id}: no pace.dailyMinutes declared — SC-006 is unmeasurable without it (needs >= ${Math.ceil(cost / plan.days.length)} min/day at current size)`);
  } else {
    const cap = daily * plan.days.length;
    const label = `gate 14 plan ${planMeta.id}: ${cost} min of work over ${plan.days.length} days vs ${daily} min/day (cap ${cap})`;
    if (cost > cap) err(`${label} — OVER BUDGET by ${cost - cap} min`);
    else console.log(`  ✓ ${label} — fits with ${cap - cost} min spare`);
  }
}

// ================================================================================================
// gate 6 — releases[] strictly descending under NUMERIC comparison
// ================================================================================================
const releases = manifest.releases || [];
for (let i = 1; i < releases.length; i++) {
  if (cmpVersion(releases[i - 1].version, releases[i].version) <= 0) {
    err(`gate 6  releases[] not strictly descending: "${releases[i - 1].version}" precedes "${releases[i].version}"`);
  }
}

// release versions referenced by items must exist in the manifest
const releaseVersions = new Set(releases.map(r => r.version));
for (const item of allItems) {
  if (item.addedIn && !releaseVersions.has(item.addedIn)) {
    warn(`${item.id}: addedIn "${item.addedIn}" has no matching release entry`);
  }
}

// ================================================================================================
// gates 10 & 11 — reference freshness anchored to the shipping release (FR-024 / FR-036)
// ================================================================================================
const currentRelease = releases.find(r => r.version === manifest.version);
if (!currentRelease) {
  err(`manifest.version "${manifest.version}" has no matching releases[] entry`);
} else if (!currentRelease.date) {
  err(`release ${manifest.version} has no date`);
} else {
  const relDate = new Date(currentRelease.date + 'T00:00:00Z');
  const winOpen = new Date(relDate.getTime() - FRESHNESS_DAYS * 86400000);
  const inWindow = (d) => {
    const t = new Date(d + 'T00:00:00Z');
    return !Number.isNaN(t.getTime()) && t >= winOpen && t <= relDate;
  };

  // gate 10 — only items this release touches are examined; untouched items keep the dates they
  // shipped with, which is what keeps this affordable at 629 items.
  let stale = 0;
  for (const item of allItems) {
    if (manifest.version !== item.addedIn && manifest.version !== item.updatedIn) continue;
    for (const ref of item.refs || []) {
      if (ref.checked && !inWindow(ref.checked)) {
        err(`gate 10 ${item.id}: ref "${ref.title}" checked ${ref.checked}, outside the ${winOpen.toISOString().slice(0, 10)}..${currentRelease.date} window for release ${manifest.version}`);
        stale++;
      }
    }
  }
  if (!stale) console.log(`  ✓ gate 10 every ref on items shipped by ${manifest.version} verified within ${FRESHNESS_DAYS} days of ${currentRelease.date}`);

  // gate 11 — the version-truth registry is re-verified as a unit at every release
  const sc = manifest.stackSnapshotChecked;
  if (!sc) {
    err(`gate 11 manifest.stackSnapshotChecked is missing — the version-truth registry has no verification date`);
  } else if (!inWindow(sc)) {
    err(`gate 11 manifest.stackSnapshotChecked is ${sc}, outside the ${winOpen.toISOString().slice(0, 10)}..${currentRelease.date} window`);
  } else {
    console.log(`  ✓ gate 11 stackSnapshot re-verified ${sc}`);
  }
}

// ================================================================================================
// gate 4 — per-track counts vs the FR-002 table
// ================================================================================================
const byTrack = {};
for (const item of allItems) {
  const t = trackOf.get(item.id) || item.track;
  (byTrack[t] = byTrack[t] || []).push(item);
}
console.log('\ngate 4  per-track counts vs FR-002 targets');
console.log(`  ${'track'.padEnd(18)} ${'built'.padStart(5)} ${'target'.padStart(6)}  ${'L1 L2 L3 L4'}  floor`);
const shortTracks = [];
for (const track of Object.keys(TARGETS)) {
  const items = byTrack[track] || [];
  const target = TARGETS[track];
  const lv = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const i of items) lv[i.level] = (lv[i.level] || 0) + 1;
  const floor = levelFloor(track);
  const floorOk = [1, 2, 3, 4].every(l => lv[l] >= floor);
  const countOk = items.length >= target;
  if (!countOk) shortTracks.push(`${track} ${items.length}/${target}`);
  const marks = `${countOk ? ' ' : '<'} ${floorOk ? ' ' : 'SHORT'}`;
  console.log(`  ${track.padEnd(18)} ${String(items.length).padStart(5)} ${String(target).padStart(6)}  ` +
    `${[1, 2, 3, 4].map(l => String(lv[l]).padStart(2)).join(' ')}  ${String(floor).padStart(5)} ${marks}`);
  if (!floorOk) shortTracks.push(null);   // placeholder; reported by gate 5 below
}
for (const s of shortTracks.filter(Boolean)) staged(`gate 4  track below its FR-002 minimum: ${s}`);
for (const t of Object.keys(byTrack)) {
  if (!(t in TARGETS)) staged(`gate 4  unknown track "${t}" — the 13 tracks are fixed`);
}
if (allItems.length < TOTAL_TARGET) {
  staged(`gate 4  library total is ${allItems.length}, below the ${TOTAL_TARGET}-item minimum`);
}

// ================================================================================================
// gate 5 — difficulty mix and per-level floors
// ================================================================================================
const byLevel = allItems.reduce((a, i) => { a[i.level] = (a[i.level] || 0) + 1; return a; }, {});
const mixLine = [1, 2, 3, 4].map(l => {
  const pct = allItems.length ? (100 * (byLevel[l] || 0) / allItems.length) : 0;
  return `L${l} ${pct.toFixed(0)}%/${MIX_TARGET[l]}%`;
}).join('  ');
console.log(`\ngate 5  difficulty mix: ${mixLine}  (tolerance ±${MIX_TOLERANCE}pp)`);
for (const l of [1, 2, 3, 4]) {
  const pct = allItems.length ? (100 * (byLevel[l] || 0) / allItems.length) : 0;
  if (Math.abs(pct - MIX_TARGET[l]) > MIX_TOLERANCE) {
    staged(`gate 5  level ${l} is ${pct.toFixed(1)}% of the library, outside ${MIX_TARGET[l]}% ±${MIX_TOLERANCE}pp`);
  }
}
for (const track of Object.keys(TARGETS)) {
  const floor = levelFloor(track);
  if (!floor) continue;
  const lv = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const i of byTrack[track] || []) lv[i.level] = (lv[i.level] || 0) + 1;
  const short = [1, 2, 3, 4].filter(l => lv[l] < floor);
  if (short.length) {
    staged(`gate 5  ${track}: below the per-level floor of ${floor} at level(s) ${short.join(', ')} — [${[1, 2, 3, 4].map(l => lv[l]).join(', ')}]`);
  }
}

// ================================================================================================
// gate 2b summary — in-band share against the >=90% target (SC-016)
// ================================================================================================
const qaCounts = allItems.filter(i => i.type === 'qa').map(i => words(i.answer));
if (qaCounts.length) {
  const inBand = qaCounts.filter(n => n >= 120 && n <= 250).length;
  const pct = 100 * inBand / qaCounts.length;
  const line = `gate 2b qa answers in the 120-250 band: ${inBand}/${qaCounts.length} = ${pct.toFixed(1)}% (target >=90%)`;
  if (pct < 90) staged(line); else console.log(`  ✓ ${line}`);
}

// ================================================================================================
// gate 8 — near-duplicate screen over EVERY pack on disk, registered or not.
// Adjudication happens before a stage is registered — that is the last point at which a pair can
// still be merged — so a registered-only screen would report zero pairs every time it mattered.
// ================================================================================================
const LEDGER_PATH = '.claude/workflows/duplicates.json';
let ledger = [];
if (existsSync(join(ROOT, LEDGER_PATH))) {
  try { ledger = read(LEDGER_PATH); } catch (e) { err(`gate 8  cannot read ${LEDGER_PATH} — ${e.message}`); }
} else {
  warn(`gate 8  ${LEDGER_PATH} does not exist — no duplicate pair can be adjudicated`);
}
const adjudicated = new Set(
  (Array.isArray(ledger) ? ledger : []).map(e => [...(e.ids || [])].sort().join('|'))
);
for (const e of Array.isArray(ledger) ? ledger : []) {
  if (!['distinct', 'merged', 'accepted'].includes(e.verdict) || !e.reason) {
    staged(`gate 8  ledger entry ${JSON.stringify(e.ids)} needs a verdict of distinct|merged|accepted and a reason`);
  }
}

const STOP = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'do', 'does', 'did', 'how', 'what', 'why',
  'when', 'which', 'who', 'in', 'on', 'of', 'to', 'and', 'or', 'for', 'with', 'you', 'your', 'it',
  'its', 'that', 'this', 'these', 'those', 'can', 'be', 'been', 'vs', 'from', 'at', 'as', 'by', 'if',
  'would', 'should', 'could', 'will', 'about', 'between', 'into', 'not', 'but', 'than', 'then']);
const tokens = (q) => new Set(
  ((q || '').toLowerCase().match(/[a-z0-9+#.]+/g) || []).filter(t => t.length > 1 && !STOP.has(t))
);
const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
};
const screened = diskItems.map(({ item, file }) => ({ id: item.id, file, tok: tokens(item.q), q: item.q }));
let flagged = 0;
for (let i = 0; i < screened.length; i++) {
  for (let j = i + 1; j < screened.length; j++) {
    if (jaccard(screened[i].tok, screened[j].tok) < DUP_THRESHOLD) continue;
    const key = [screened[i].id, screened[j].id].sort().join('|');
    if (adjudicated.has(key)) continue;
    flagged++;
    staged(`gate 8  unadjudicated near-duplicate: ${screened[i].id} (${screened[i].file}) ~ ${screened[j].id} (${screened[j].file})\n            "${screened[i].q}"\n            "${screened[j].q}"`);
  }
}
if (!flagged) console.log(`  ✓ gate 8  no unadjudicated near-duplicate pairs across ${screened.length} items on disk`);

// ================================================================================================
// gate 9 — primary-source host allowlist (FR-025)
// ================================================================================================
const hostUse = {};
let offlist = 0;
for (const item of allItems) {
  for (const ref of item.refs || []) {
    let host;
    try { host = new URL(ref.url).host; } catch (e) { continue; }
    hostUse[host] = (hostUse[host] || 0) + 1;
    if (!ALLOWED_HOSTS.has(host)) {
      offlist++;
      staged(`gate 9  ${item.id}: ref host "${host}" is outside the primary-source allowlist — ${ref.url}`);
    }
  }
}
if (!offlist) console.log(`  ✓ gate 9  every ref host is on the primary-source allowlist`);

// ================================================================================================
// gate 12 — frozen scope[] and coverage{} per track (FR-003 / SC-019)
// ================================================================================================
const OUTLINE_DIR = join(ROOT, '.claude/workflows/outlines');
const authoredTracks = Object.keys(TARGETS).filter(t => t !== 'cheatsheets');
let coverageGaps = 0;
for (const track of authoredTracks) {
  const p = join(OUTLINE_DIR, track + '.json');
  if (!existsSync(p)) {
    staged(`gate 12 ${track}: no outline record — FR-003 is unmeasurable for this track`);
    coverageGaps++;
    continue;
  }
  let o;
  try { o = JSON.parse(readFileSync(p, 'utf8')); } catch (e) {
    err(`gate 12 ${track}: outline record is unparseable — ${e.message}`);
    continue;
  }
  if (!Array.isArray(o.scope) || !o.scope.length) {
    staged(`gate 12 ${track}: no frozen scope[] — FR-003 is unmeasurable for this track`);
    coverageGaps++;
    continue;
  }
  const cov = o.coverage || {};
  for (const subject of o.scope) {
    const c = cov[subject];
    if (c === undefined || c === null) {
      staged(`gate 12 ${track}: scope subject unmapped — "${subject}"`);
      coverageGaps++;
    } else if (Array.isArray(c)) {
      if (!c.some(id => diskIds.has(id))) {
        staged(`gate 12 ${track}: scope subject maps to no existing item — "${subject}"`);
        coverageGaps++;
      }
    } else if (typeof c === 'object') {
      if (!c.dropped) {
        staged(`gate 12 ${track}: scope subject dropped without a reason — "${subject}"`);
        coverageGaps++;
      }
    }
  }
}
if (!coverageGaps) console.log(`  ✓ gate 12 every authored track has a frozen scope[] with full coverage`);

// ================================================================================================
// gate 13 — version-claim screen. Names the population SC-009 (b)/(c) is audited over; it never
// decides whether a reference actually sources a claim. Warning always, never an error.
// ================================================================================================
const claimFlagged = [];
const claimShipping = [];
for (const item of allItems) {
  const prose = ['q', 'answer', 'shortAnswer', 'prompt', 'referenceAnswer', 'framework']
    .map(k => (item[k] == null ? '' : String(item[k]))).join(' ');
  if (CLAIM.test(prose)) {
    claimFlagged.push(item.id);
    if (manifest.version === item.addedIn || manifest.version === item.updatedIn) claimShipping.push(item.id);
  }
}
console.log(`\ngate 13 version-claim screen: ${claimFlagged.length} items flagged library-wide, ` +
  `${claimShipping.length} shipped by ${manifest.version}`);
if (claimShipping.length) {
  const n = Math.min(10, claimShipping.length);
  console.log(`        audit at least ${n}: ${claimShipping.slice(0, 10).join(', ')}`);
}

// ================================================================================================
const byType = allItems.reduce((a, i) => { a[i.type] = (a[i.type] || 0) + 1; return a; }, {});
console.log(`\nTotal: ${allItems.length} items`);
console.log(`  by level:`, byLevel);
console.log(`  by type :`, byType);
console.log(`  on disk :`, diskItems.length, `items across ${diskPacks.length} pack files`);
console.log(`  hosts   :`, Object.entries(hostUse).sort((a, b) => b[1] - a[1]).map(([h, n]) => `${h}×${n}`).join(', ') || '(none)');
console.log(errors ? `\n${errors} error(s), ${warnings} warning(s)` : `\nAll good (${warnings} warning(s))`);
process.exit(errors ? 1 : 0);
