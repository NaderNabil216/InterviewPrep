// srs.js — storage-bound adapter over progress.js (feature 007).
// The single definition of completion and every derived figure live in progress.js; this module
// only reads storage and delegates. It MUST NOT reimplement any rule (contracts/progress-api.md
// C11). `rate()` keeps its interval maths and still writes the vestigial `status` field so
// records written before and after this change have an identical shape — nothing reads it.
import { Store } from './store.js';
import * as P from './progress.js';

const MIN_EASE = 1.3;

export function rate(itemId, rating) {
  const prev = Store.getItemProgress(itemId) || {};
  let { ease = 2.5, interval = 0, reps = 0, lapses = 0 } = prev;

  if (rating === 'again') {
    lapses += 1;
    ease = Math.max(MIN_EASE, ease - 0.2);
    interval = 0; // due again today / next session
    reps = 0;
  } else {
    reps += 1;
    if (rating === 'hard') { ease = Math.max(MIN_EASE, ease - 0.15); interval = Math.max(1, Math.round(interval * 1.2)) || 1; }
    if (rating === 'good') { interval = interval === 0 ? 1 : Math.round(interval * ease); }
    if (rating === 'easy') { ease = ease + 0.15; interval = interval === 0 ? 3 : Math.round(interval * ease * 1.3); }
    interval = Math.max(1, Math.min(interval, 180));
  }

  const status = rating === 'again' ? 'learning' : (interval >= 21 ? 'known' : 'learning');
  const next = {
    status, ease, interval, reps, lapses,
    due: P.todayLocalISO(new Date(), interval),
    lastRated: new Date().toISOString(),
    lastRating: rating,
  };
  return Store.setItemProgress(itemId, next);
}

export function isDue(itemId) {
  const p = Store.getItemProgress(itemId);
  return P.isCompletedRecord(p) && p.due <= P.todayLocalISO();
}

export function statusOf(itemId) {
  return P.statusOf(Store.getProgress(), itemId);
}

// Build a drill queue: due items first (oldest due first), then not-yet-completed items, capped
// at `limit`. Callers pass the drillable subset.
export function buildQueue(items, limit = 9999) {
  return P.reviewQueue(items, Store.getProgress(), P.todayLocalISO(), limit);
}

export function dueCount(items) {
  return P.dueCountOf(items, Store.getProgress(), P.todayLocalISO());
}

// Renamed from `masteryByTrack`: the old name was the retired `interval >= 21` reading, and an
// alias is how a retired definition survives a refactor. `known` became `completed`.
export function coverageByTrack(items) {
  return P.coverageByTrack(items, Store.getProgress());
}