#!/usr/bin/env node
// check-progress.mjs — dependency-free accounting check for the single definition of progress
// (feature 007). Imports the same pure assets/js/progress.js the app uses, asserts the accounting
// against a synthetic history with known expected results, then re-runs the identical battery
// against six deliberately-broken stand-ins for the defects this spec describes — each must be
// caught (SC-010).
//
// Runs standalone (`node tools/check-progress.mjs [--verbose]`) and inside `node tools/validate.mjs`
// as gate 16 (via runProgressChecks()). No dependency beyond node:fs/node:path/node:url and the
// relative import of progress.js; requires Node >= 22.7 (ES-module syntax detection).
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let impl = null;
try {
  impl = await import(join(ROOT, 'assets/js/progress.js'));
} catch (e) {
  console.error(
    `check-progress: cannot import assets/js/progress.js as an ES module (${e.message}).\n`
    + 'This check needs Node >= 22.7, where ES-module syntax detection loads a .js file with\n'
    + 'export statements even without a package.json. Older runtimes cannot run it — upgrade Node.'
  );
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Fixtures (data-model.md §3) — all dates injected, never read from the wall clock.
// ---------------------------------------------------------------------------
// ~30 questions across 4 named tracks + one empty track + one dsa-typed and one design-typed
// question. Totals are deliberate and uneven: track-a 10, track-b 8, track-c 6, track-d 5,
// track-empty 0, plus one dsa and one design item in track-workspace.
const LIBRARY = [];
const ids = {};
function item(id, track, type = 'qa') { ids[id] = { id, track, type }; LIBRARY.push(ids[id]); return id; }
const a1 = item('a-1', 'track-a'), a2 = item('a-2', 'track-a'), a3 = item('a-3', 'track-a'),
  a4 = item('a-4', 'track-a'), a5 = item('a-5', 'track-a'), a6 = item('a-6', 'track-a'),
  a7 = item('a-7', 'track-a'), a8 = item('a-8', 'track-a'), a9 = item('a-9', 'track-a'),
  a10 = item('a-10', 'track-a');
const b1 = item('b-1', 'track-b'), b2 = item('b-2', 'track-b'), b3 = item('b-3', 'track-b'),
  b4 = item('b-4', 'track-b'), b5 = item('b-5', 'track-b'), b6 = item('b-6', 'track-b'),
  b7 = item('b-7', 'track-b'), b8 = item('b-8', 'track-b');
const c1 = item('c-1', 'track-c'), c2 = item('c-2', 'track-c'), c3 = item('c-3', 'track-c'),
  c4 = item('c-4', 'track-c'), c5 = item('c-5', 'track-c'), c6 = item('c-6', 'track-c');
const d1 = item('d-1', 'track-d'), d2 = item('d-2', 'track-d'), d3 = item('d-3', 'track-d'),
  d4 = item('d-4', 'track-d'), d5 = item('d-5', 'track-d');
const w_dsa = item('w-dsa', 'track-workspace', 'dsa');
const w_design = item('w-design', 'track-workspace', 'design');
// An empty track: no items at all, so it never appears in coverage — the zero-total case is
// exercised by calling coverage with an empty library (no division, no NaN, no throw).

// A stored learning record as rate() would write it (the vestigial `status` field included so the
// fixture matches the real record shape).
const rated = (due, interval = 3, reps = 1) => ({
  status: interval >= 21 ? 'known' : 'learning', ease: 2.5, interval, reps, lapses: 0,
  due, lastRated: '2026-08-20T09:00:00.000Z', lastRating: 'good',
});

// Known-uneven history: track-a 4/10 completed (40%), track-b 6/8 (75%), track-c 2/6 (33%),
// track-d 5/5 (100%), workspace 2/2 (100%, due — completable through its own workspaces), plus a
// note-only record, an orphan, a past-due record and a re-rated record.
const DUE_TODAY = '2026-08-20';
const DUE_PAST = '2026-08-10';
const DUE_FUTURE = '2026-09-30';
const KNOWN = {
  [a1]: rated(DUE_TODAY), [a2]: rated(DUE_PAST), [a3]: rated(DUE_FUTURE), [a4]: rated(DUE_TODAY),
  [b1]: rated(DUE_TODAY), [b2]: rated(DUE_TODAY), [b3]: rated(DUE_TODAY), [b4]: rated(DUE_PAST),
  [b5]: rated(DUE_TODAY), [b6]: rated(DUE_FUTURE),
  [d1]: rated(DUE_TODAY), [d2]: rated(DUE_TODAY), [d3]: rated(DUE_TODAY), [d4]: rated(DUE_TODAY),
  [d5]: rated(DUE_TODAY),
  [w_dsa]: rated(DUE_TODAY), [w_design]: rated(DUE_TODAY),
  [a5]: { notes: 'hook' },                                  // note-only — never a completion
  'zz-orphan': rated(DUE_TODAY),                            // id absent from the library
  [c1]: rated('2027-01-01', 60, 5),                         // re-rated 5x, due far future
  [c2]: rated(DUE_PAST),                                    // past-due — still completed
  [c3]: { status: 'known' },                                // vestigial field, no due — NOT completed
};
// Fresh history for the day-one baseline.
const FRESH = {};
// One first-day completion — the SC-002 case: a single mark must move the figure off zero.
const DAY_ONE = { [a1]: rated(DUE_TODAY) };
// The drillable subset (what the drill queue offers); the due figure must be scoped to it.
const DRILLABLE = LIBRARY.filter(it => it.type !== 'dsa' && it.type !== 'design');
// Expected counts over KNOWN: completed = 4+6+2+5+2 = 19 of 31 (orphan ignored); due over the
// whole library = 16 (a1,a2,a4; b1..b5; c2; d1..d5; w_dsa; w_design); due over drillable = 14.
const COMPLETED_TOTAL = 19;
const DUE_ALL = 16;
const DUE_DRILLABLE = 14;

// ---------------------------------------------------------------------------
// Assertion battery — pure functions over an implementation object, so the identical battery can
// be pointed at the real module or at a defect stand-in (contract C4).
// ---------------------------------------------------------------------------
const groups = {
  completion(impl) {
    const out = [];
    const check = (name, cond, exp, got) => out.push({ name, pass: !!cond, exp, got });
    check('no-record-not-completed', !impl.isCompleted(KNOWN, 'no-such-id'), false, impl.isCompleted(KNOWN, 'no-such-id'));
    check('note-only-not-completed', !impl.isCompleted(KNOWN, a5), false, impl.isCompleted(KNOWN, a5));
    check('one-rating-completed', impl.isCompleted(KNOWN, a1), true, impl.isCompleted(KNOWN, a1));
    check('five-ratings-count-once', impl.isCompleted(KNOWN, c1), true, impl.isCompleted(KNOWN, c1));
    check('past-due-still-completed', impl.isCompleted(KNOWN, c2), true, impl.isCompleted(KNOWN, c2));
    check('vestigial-status-not-completed', !impl.isCompleted(KNOWN, c3), false, impl.isCompleted(KNOWN, c3));
    check('statusOf-two-values-only', ['completed', 'not-started'].includes(impl.statusOf(KNOWN, a1))
      && ['completed', 'not-started'].includes(impl.statusOf(KNOWN, a5)), 'completed|not-started', impl.statusOf(KNOWN, a1));
    check('statusOf-completed', impl.statusOf(KNOWN, a1) === 'completed', 'completed', impl.statusOf(KNOWN, a1));
    check('statusOf-not-started', impl.statusOf(KNOWN, a5) === 'not-started', 'not-started', impl.statusOf(KNOWN, a5));
    return out;
  },

  coverage(impl) {
    const out = [];
    const check = (name, cond, exp, got) => out.push({ name, pass: !!cond, exp, got });
    const cov = impl.coverageByTrack(LIBRARY, KNOWN);
    const checkTrack = (name, track, completed, total) => {
      const c = cov[track] || {};
      check(`track-${name}-completed`, c.completed === completed, completed, c.completed);
      check(`track-${name}-total`, c.total === total, total, c.total);
      check(`track-${name}-pct`, c.pct === (total === 0 ? 0 : Math.round((completed / total) * 100)),
        Math.round((completed / total) * 100), c.pct);
    };
    checkTrack('a', 'track-a', 4, 10);
    checkTrack('b', 'track-b', 6, 8);
    checkTrack('c', 'track-c', 2, 6);   // c1 (re-rated) + c2 (past-due); c3 has no due
    checkTrack('d', 'track-d', 5, 5);
    checkTrack('workspace', 'track-workspace', 2, 2);
    // completed + notStarted === total, for every track
    for (const [track, c] of Object.entries(cov)) {
      check(`sum-${track}`, c.completed + c.notStarted === c.total, c.total, c.completed + c.notStarted);
    }
    // pct bounded 0-100
    for (const [track, c] of Object.entries(cov)) {
      check(`bounded-${track}`, c.pct >= 0 && c.pct <= 100, '0..100', c.pct);
    }
    // zero-total: no division by zero, no NaN, no throw
    const empty = impl.coverageByTrack([], {});
    check('empty-library-no-throw', Object.keys(empty).length === 0, 0, Object.keys(empty).length);
    const emptyTot = impl.coverageTotals([], {});
    check('empty-totals-pct-zero', emptyTot.pct === 0 && !Number.isNaN(emptyTot.pct), 0, emptyTot.pct);
    // orphan record contributes to nothing
    const tot = impl.coverageTotals(LIBRARY, KNOWN);
    check('orphan-record-ignored', tot.completed === COMPLETED_TOTAL, COMPLETED_TOTAL, tot.completed);
    // day-one history yields a NON-zero completed figure (SC-002; the one D1 must fail)
    const dayOne = impl.coverageByTrack(LIBRARY, DAY_ONE);
    check('day-one-non-zero', Object.values(dayOne).some(c => c.completed > 0), '>0', JSON.stringify(dayOne));
    // all-complete tracks read 100%
    check('full-track-100', cov['track-d'].pct === 100 && cov['track-workspace'].pct === 100, 100, `${cov['track-d'].pct}/${cov['track-workspace'].pct}`);
    return out;
  },

  reviewQueue(impl) {
    const out = [];
    const check = (name, cond, exp, got) => out.push({ name, pass: !!cond, exp, got });
    const today = DUE_TODAY;
    const queue = impl.reviewQueue(LIBRARY, KNOWN, today);
    const dueBucket = queue.filter(it => impl.isCompleted(KNOWN, it.id) && KNOWN[it.id].due <= today);
    // a note-only record is offered (pending, not dropped)
    check('note-only-reachable', queue.some(it => it.id === a5), true, queue.map(it => it.id).join(','));
    // completed-and-not-due is not offered: it is in neither the due bucket nor the pending tail
    check('completed-not-due-excluded', !queue.some(it => it.id === a3), false, queue.some(it => it.id === a3));
    // completed-and-due is offered, oldest first
    const dueIds = queue.filter(it => KNOWN[it.id] && KNOWN[it.id].due <= today).map(it => it.id);
    const sortedDue = [...dueIds].sort((x, y) => (KNOWN[x].due < KNOWN[y].due ? -1 : 1));
    check('due-oldest-first', dueIds.join(',') === sortedDue.join(','), sortedDue.join(','), dueIds.join(','));
    // dueCountOf equals the due-bucket size for the same arguments (FR-010, SC-013)
    const count = impl.dueCountOf(LIBRARY, KNOWN, today);
    check('due-equals-queue-size', count === dueBucket.length, dueBucket.length, count);
    // exhaustive classification: no item is missing from all three states (FR-017)
    const dueSet = new Set(dueBucket.map(it => it.id));
    const pendingSet = new Set(queue.filter(it => !impl.isCompleted(KNOWN, it.id)).map(it => it.id));
    const missing = LIBRARY.filter(it =>
      !dueSet.has(it.id) && !pendingSet.has(it.id) && !(impl.isCompleted(KNOWN, it.id) && KNOWN[it.id].due > today));
    check('classification-exhaustive', missing.length === 0, 'none', missing.map(it => it.id).join(','));
    // the drillable filter excludes dsa/design: the drillable figure differs from the all-items
    // figure exactly by the two workspace items, which ARE completable (SC-012) but must not leak
    // into the review-queue population (FR-010, SC-013)
    const drillCount = impl.dueCountOf(DRILLABLE, KNOWN, today);
    const allCount = impl.dueCountOf(LIBRARY, KNOWN, today);
    check('dsa-design-excluded', drillCount === DUE_DRILLABLE && allCount === DUE_ALL,
      `${DUE_DRILLABLE} vs ${DUE_ALL}`, `${drillCount} vs ${allCount}`);
    // clearing the queue drives the count to 0 (SC-013)
    check('queue-cleared-count-zero', impl.dueCountOf(LIBRARY, {}, today) === 0, 0, impl.dueCountOf(LIBRARY, {}, today));
    return out;
  },

  localCalendar(impl) {
    const out = [];
    const check = (name, cond, exp, got) => out.push({ name, pass: !!cond, exp, got });
    const zones = ['Asia/Tokyo', 'America/Los_Angeles'];
    const savedTZ = process.env.TZ;
    try {
      for (const zone of zones) {
        process.env.TZ = zone;
        // Verify the TZ change took effect: a fixed UTC instant's local hour must shift. Under an
        // ambient TZ=UTC the D4 defect is genuinely undetectable — it must never pass by not
        // having been exercised (contract C4).
        const probe = new Date('2026-08-20T00:30:00.000Z');
        if (probe.getHours() === 0) {
          check(`tz-effective-${zone}`, false, 'local hour differs from UTC', probe.getHours());
          continue;
        }
        for (let h = 0; h < 24; h++) {
          const d = new Date(Date.UTC(2026, 7, 20, h));
          const expected = d.toLocaleDateString('sv-SE'); // independent oracle
          const got = impl.todayLocalISO(d);
          check(`hour-${zone}-${h}`, got === expected, expected, got);
        }
      }
      // offsetDays across a month boundary and a year boundary
      const aug31 = new Date(2026, 7, 31, 12);
      check('offset-month-boundary', impl.todayLocalISO(aug31, 1) === '2026-09-01', '2026-09-01', impl.todayLocalISO(aug31, 1));
      const dec31 = new Date(2026, 11, 31, 12);
      check('offset-year-boundary', impl.todayLocalISO(dec31, 1) === '2027-01-01', '2027-01-01', impl.todayLocalISO(dec31, 1));
      // the input Date is not mutated
      const fixed = new Date(2026, 7, 15, 9, 30);
      const before = fixed.getTime();
      impl.todayLocalISO(fixed, 5);
      check('input-not-mutated', fixed.getTime() === before, before, fixed.getTime());
      // a completed question with a 1-day interval becomes due exactly when the next local day
      // starts (FR-020): due written today+1 is not due today, is due on today+1
      process.env.TZ = 'Asia/Tokyo';
      const day0 = new Date(2026, 7, 20, 23, 30);
      const due = impl.todayLocalISO(day0, 1);
      check('one-day-due-not-today', !(due <= impl.todayLocalISO(day0)), false, due);
      check('one-day-due-on-next-day', due === impl.todayLocalISO(new Date(2026, 7, 21, 0, 30)), '2026-08-21', due);
    } finally {
      process.env.TZ = savedTZ;
    }
    return out;
  },

  ranking(impl) {
    const out = [];
    const check = (name, cond, exp, got) => out.push({ name, pass: !!cond, exp, got });
    const cov = impl.coverageByTrack(LIBRARY, KNOWN);
    const ranks = impl.weakestTracks(cov);
    // ascending by coverage: track-c 33% (2/6), track-a 40% (4/10), track-b 75% (6/8)
    check('ascending-by-coverage', ranks[0] === 'track-c' && ranks[1] === 'track-a' && ranks[2] === 'track-b',
      'track-c,track-a,track-b', ranks.slice(0, 3).join(','));
    // the two 100% tracks rank last (tie broken by total descending: track-d before workspace)
    check('full-track-last', ranks.slice(-2).join(',') === 'track-d,track-workspace',
      'track-d,track-workspace', ranks.slice(-2).join(','));
    // a 100% track yields no notCompleted items (US4 #4)
    const dNotDone = impl.notCompleted(LIBRARY.filter(it => it.track === 'track-d'), KNOWN);
    check('full-track-no-next-up', dNotDone.length === 0, 0, dNotDone.length);
    // all-zero history: deterministic and non-empty
    const freshCov = impl.coverageByTrack(LIBRARY, FRESH);
    const freshRanks = impl.weakestTracks(freshCov);
    const freshRanks2 = impl.weakestTracks(freshCov);
    check('fresh-non-empty', freshRanks.length > 0, '>0', freshRanks.length);
    check('fresh-deterministic', freshRanks.join(',') === freshRanks2.join(','), freshRanks.join(','), freshRanks2.join(','));
    // zero-total input: no throw, empty result
    const emptyRanks = impl.weakestTracks(impl.coverageByTrack([], {}));
    check('zero-total-excluded', emptyRanks.length === 0, 0, emptyRanks.length);
    return out;
  },

  liveLibrary(impl) {
    const out = [];
    const check = (name, cond, exp, got) => out.push({ name, pass: !!cond, exp, got });
    const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
    const manifest = read('content/manifest.json');
    const items = [];
    for (const packMeta of manifest.packs) {
      const pack = read(join('content', packMeta.file));
      for (const it of pack.items || []) items.push({ ...it, track: packMeta.track });
    }
    // per-track totals equal the sum of their packs
    const byTrack = {};
    for (const it of items) byTrack[it.track] = (byTrack[it.track] || 0) + 1;
    const cov = impl.coverageByTrack(items, {});
    for (const [track, n] of Object.entries(byTrack)) {
      if ((cov[track] || {}).total !== n) check(`live-total-${track}`, false, n, cov[track] && cov[track].total);
    }
    check('live-every-track-non-empty', Object.keys(byTrack).every(t => byTrack[t] > 0), true, false);
    // drillable + workspace items equal the library total
    const drillable = items.filter(it => it.type !== 'dsa' && it.type !== 'design').length;
    const workspace = items.filter(it => it.type === 'dsa' || it.type === 'design').length;
    check('live-drillable-plus-workspace', drillable + workspace === items.length, items.length, drillable + workspace);
    // an empty history yields 0% for every track
    const allZero = Object.values(cov).every(c => c.pct === 0);
    check('live-empty-history-zero', allZero, true, false);
    const tot = impl.coverageTotals(items, {});
    check('live-totals-empty', tot.completed === 0 && tot.notStarted === items.length, items.length, tot.notStarted);
    return out;
  },
};

// ---------------------------------------------------------------------------
// Defect stand-ins (contract C5) — each mirrors a defect the spec describes.
// ---------------------------------------------------------------------------
const DEFECTS = [
  { id: 'D1', name: 'completion = interval >= 21', impl: {
    ...impl, isCompletedRecord: (r) => Boolean(r && r.interval >= 21),
    isCompleted: (p, id) => Boolean(p && p[id] && p[id].interval >= 21),
    statusOf: (p, id) => (p && p[id] && p[id].interval >= 21) ? 'completed' : 'not-started',
  } },
  { id: 'D2', name: 'completion = any stored record', impl: {
    ...impl, isCompletedRecord: (r) => Boolean(r),
    isCompleted: (p, id) => Boolean(p && p[id]),
    statusOf: (p, id) => (p && p[id]) ? 'completed' : 'not-started',
  } },
  { id: 'D3', name: 'note-only dropped from queue', impl: {
    ...impl,
    reviewQueue: (items, progress, today, limit) => {
      const due = [];
      const pending = [];
      for (const it of items) {
        const p = progress[it.id];
        if (!p) pending.push(it);
        else if (p.due <= today) due.push(it);
      }
      due.sort((a, b) => (progress[a.id].due < progress[b.id].due ? -1 : 1));
      return [...due, ...pending].slice(0, limit || Infinity);
    },
  } },
  { id: 'D4', name: 'today = toISOString (UTC)', impl: {
    ...impl,
    todayLocalISO: (date = new Date(), offsetDays = 0) => {
      const d = new Date(date.getTime());
      if (offsetDays) d.setDate(d.getDate() + offsetDays);
      return d.toISOString().slice(0, 10);
    },
  } },
  { id: 'D5', name: 'totals counted over progress keys', impl: {
    ...impl,
    coverageByTrack: (items, progress) => {
      const byTrack = {};
      for (const id of Object.keys(progress || {})) {
        const it = items.find(x => x.id === id);
        if (!it) continue;
        const t = it.track;
        const c = (byTrack[t] = byTrack[t] || { total: 0, completed: 0, notStarted: 0, pct: 0 });
        c.total += 1;
        c.completed += 1;
      }
      return byTrack;
    },
    coverageTotals: (items, progress) => {
      // defect: every progress key counts, orphans included — and totals come from the map, so
      // completed can exceed the library-derived total (FR-012 edge case 1)
      const completed = Object.keys(progress || {}).length;
      return { total: items.length, completed, notStarted: items.length - completed, pct: 0 };
    },
  } },
  { id: 'D6', name: 'due counted over all item types', impl: {
    ...impl,
    dueCountOf: (items, progress, today) => {
      // defect: the drillable subset the caller passed is ignored — the count runs over the whole
      // library, so workspace questions leak into the review-queue figure (FR-010, SC-013)
      return LIBRARY.filter(it => progress[it.id] && progress[it.id].due <= today).length;
    },
  } },
];

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
export async function runProgressChecks() {
  const failures = [];
  const defects = [];
  let passed = 0;
  const perGroup = {};

  for (const [name, battery] of Object.entries(groups)) {
    const results = battery(impl);
    perGroup[name] = results;
    for (const r of results) {
      if (r.pass) passed++;
      else failures.push(`${name}/${r.name}: expected ${r.exp}, got ${r.got}`);
    }
  }

  for (const d of DEFECTS) {
    let caughtBy = null;
    for (const [name, battery] of Object.entries(groups)) {
      const results = battery(d.impl);
      const failed = results.find(r => !r.pass);
      if (failed) { caughtBy = `${name}/${failed.name}`; break; }
    }
    defects.push({ id: d.id, name: d.name, caughtBy });
    if (!caughtBy) failures.push(`defect stand-in ${d.id} (${d.name}) was not caught by any assertion`);
  }

  return { passed, failures, defects, perGroup };
}

// ---------------------------------------------------------------------------
// Standalone main() — guarded so importing the module never runs it (contract C2.4).
// ---------------------------------------------------------------------------
const isMain = process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href;
if (isMain) {
  const verbose = process.argv.includes('--verbose');
  const { passed, failures, defects, perGroup } = await runProgressChecks();

  console.log(`progress accounting — ${passed} assertions over assets/js/progress.js`);
  console.log('');
  const GROUP_LABELS = {
    completion: 'FR-001..FR-005, FR-018', coverage: 'FR-007, FR-012, SC-001, SC-003',
    reviewQueue: 'FR-010, FR-017, SC-013', localCalendar: 'FR-020, SC-008',
    ranking: 'SC-007', liveLibrary: 'structural invariants',
  };
  for (const [name, results] of Object.entries(perGroup)) {
    const failed = results.filter(r => !r.pass).length;
    const ok = results.length - failed;
    const tag = failed === 0 ? '✓' : '✗';
    console.log(`  ${tag} ${name.padEnd(13)} ${ok}/${results.length}   ${GROUP_LABELS[name] || ''}`);
    if (failed === 0 && verbose) for (const r of results) console.log(`       · ${r.name}`);
  }

  console.log('');
  console.log('  defect stand-ins — each must be caught:');
  for (const d of defects) {
    const tag = d.caughtBy ? '✓' : '✗';
    console.log(`  ${tag} ${d.id} ${d.name.padEnd(32)} caught by: ${d.caughtBy || '—'}`);
  }
  console.log('');

  if (failures.length) {
    for (const f of failures) console.log(`  ✗ ${f}`);
    console.log(`\n${failures.length} failure(s) — ${passed} assertions passed, `
      + `${defects.filter(d => d.caughtBy).length}/${defects.length} defect stand-ins caught`);
    process.exit(1);
  }
  const n = passed;
  console.log(`All good — ${n} assertions, ${defects.length}/${defects.length} defect stand-ins caught`);
  process.exit(0);
}