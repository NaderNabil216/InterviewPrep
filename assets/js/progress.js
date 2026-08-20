// progress.js — the single definition of progress (feature 007).
//
// Every surface that shows or acts on completion reads through this module: a question is
// completed iff its stored record carries a review schedule, i.e. `rate()` has run against it at
// least once (FR-001..FR-005, FR-018). Nothing else is consulted — not `status`, not `interval`,
// not `reps` — and the accounting never iterates `Object.keys(progress)`: orphan records (ids no
// longer in the library) contribute to nothing (FR-012).
//
// Module invariants (contracts/progress-api.md C0):
//   C0.1 imports nothing — it must load in Node without a browser and in the browser without a
//        build step
//   C0.2 touches no storage and no DOM — no Store, localStorage, indexedDB, document, window,
//        location, fetch. Storage access lives in srs.js, which is the adapter over this module.
//   C0.3 no side effects at module scope beyond `const` declarations
//   C0.4 every function is pure: same arguments -> same result, and no argument is mutated
//   C0.5 no `Date.now()` or bare `new Date()` inside a comparison path — anything date-dependent
//        takes the date as an argument, defaulted
//   C0.6 no hard-coded track names, track counts, or item totals

export function isCompletedRecord(record) {
  return Boolean(record && record.due);
}

export function isCompleted(progress, id) {
  return isCompletedRecord(progress && progress[id]);
}

// Exactly two values, both reachable on a candidate's first day (FR-015). The strings double as
// CSS class suffixes (`.status-dot--completed`) and Topics' `?status=` query values.
export function statusOf(progress, id) {
  return isCompleted(progress, id) ? 'completed' : 'not-started';
}

// The single source for "can the review queue present this?" (FR-010). Over the current library
// this admits 550 of 629 questions.
export function isDrillable(item) {
  return item.type !== 'dsa' && item.type !== 'design';
}

// The candidate's LOCAL calendar date, formatted from getFullYear()/getMonth()/getDate() with
// zero-padding — never toISOString(), which is UTC by definition (FR-020). `offsetDays` advances
// by whole local calendar days via Date#setDate (month/year/DST boundaries included). The `date`
// argument is cloned, never mutated.
export function todayLocalISO(date = new Date(), offsetDays = 0) {
  const d = new Date(date.getTime());
  if (offsetDays) d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Track coverage. `total` counts items, never Object.keys(progress); `completed + notStarted ===
// total` always; `pct = total === 0 ? 0 : Math.round((completed / total) * 100)` — bounded to
// 0-100 without a clamp, well-defined at total === 0. Records for ids absent from `items`
// contribute to nothing. Called with the full library: dsa and system-design are counted
// (SC-012).
export function coverageByTrack(items, progress) {
  const byTrack = {};
  for (const it of items) {
    const t = it.track;
    const c = (byTrack[t] = byTrack[t] || { total: 0, completed: 0, notStarted: 0, pct: 0 });
    c.total += 1;
    if (isCompleted(progress, it.id)) c.completed += 1;
    else c.notStarted += 1;
  }
  for (const t of Object.keys(byTrack)) {
    const c = byTrack[t];
    c.pct = c.total === 0 ? 0 : Math.round((c.completed / c.total) * 100);
  }
  return byTrack;
}

// The same shape over the whole library; `completed + notStarted === total` is what makes the
// dashboard headline self-checking (FR-008, FR-016).
export function coverageTotals(items, progress) {
  let total = 0, completed = 0;
  for (const it of items) {
    total += 1;
    if (isCompleted(progress, it.id)) completed += 1;
  }
  const notStarted = total - completed;
  return { total, completed, notStarted, pct: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

// Items failing `isCompleted`, in input order. Replaces the inline `!progress[i.id]` "unseen"
// computations that excluded note-only questions from both sides of the ledger (C7).
export function notCompleted(items, progress) {
  return items.filter(it => !isCompleted(progress, it.id));
}

// Count of items that are completed AND due: `isCompleted && record.due <= today`. Callers pass
// `items.filter(isDrillable)` so the figure counts exactly what the review queue will offer and
// can be driven to 0 (FR-010, SC-013).
export function dueCountOf(items, progress, today = todayLocalISO()) {
  let n = 0;
  for (const it of items) {
    if (isCompleted(progress, it.id) && progress[it.id].due <= today) n += 1;
  }
  return n;
}

// The review queue: due first (completed and `due <= today`, oldest due first), then pending
// (not completed, input order). One isCompleted test and two branches, so the buckets are
// complementary and exhaustive — no item can fall out of all three states, and a note-only record
// provably lands in `pending` rather than vanishing (FR-017, FR-018).
export function reviewQueue(items, progress, today = todayLocalISO(), limit = Infinity) {
  const due = [];
  const pending = [];
  for (const it of items) {
    if (isCompleted(progress, it.id)) {
      if (progress[it.id].due <= today) due.push(it);
    } else {
      pending.push(it);
    }
  }
  due.sort((a, b) => (progress[a.id].due < progress[b.id].due ? -1 : 1));
  return [...due, ...pending].slice(0, limit);
}

// Tracks with total > 0, sorted by pct ascending, then total descending, then track name
// ascending — fully deterministic, including the all-zero fresh-history case (SC-007, US4).
export function weakestTracks(coverage, limit = Infinity) {
  return Object.keys(coverage)
    .filter(t => coverage[t].total > 0)
    .sort((a, b) => {
      const ca = coverage[a], cb = coverage[b];
      if (ca.pct !== cb.pct) return ca.pct - cb.pct;
      if (ca.total !== cb.total) return cb.total - ca.total;
      return a < b ? -1 : 1;
    })
    .slice(0, limit);
}