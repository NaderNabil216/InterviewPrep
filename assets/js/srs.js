// srs.js — SM-2-lite spaced repetition. Ratings: again(1) hard(2) good(3) easy(4).
// Intervals are in whole days; `due` is stored as an ISO date string (no time component matters).
import { Store } from './store.js';

const MIN_EASE = 1.3;
const DAY_MS = 86400000;

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

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
    due: todayISO(interval),
    lastRated: new Date().toISOString(),
    lastRating: rating,
  };
  return Store.setItemProgress(itemId, next);
}

export function isDue(itemId) {
  const p = Store.getItemProgress(itemId);
  if (!p) return false;
  return p.due <= todayISO();
}

export function statusOf(itemId) {
  const p = Store.getItemProgress(itemId);
  if (!p || !p.status) return 'new';
  if (p.due <= todayISO() && p.status !== 'new') return 'due';
  return p.status;
}

// Build a drill queue: due items first (oldest due first), then unseen items, capped at `limit`.
export function buildQueue(items, limit = 9999) {
  const progress = Store.getProgress();
  const today = todayISO();
  const due = [];
  const unseen = [];
  for (const it of items) {
    const p = progress[it.id];
    if (!p) unseen.push(it);
    else if (p.due <= today) due.push({ item: it, due: p.due });
  }
  due.sort((a, b) => a.due < b.due ? -1 : 1);
  const queue = [...due.map(d => d.item), ...unseen];
  return queue.slice(0, limit);
}

export function dueCount(items) {
  const progress = Store.getProgress();
  const today = todayISO();
  return items.filter(it => progress[it.id] && progress[it.id].due <= today).length;
}

export function masteryByTrack(items) {
  const progress = Store.getProgress();
  const byTrack = {};
  for (const it of items) {
    byTrack[it.track] = byTrack[it.track] || { total: 0, known: 0, learning: 0, new: 0 };
    byTrack[it.track].total += 1;
    const p = progress[it.id];
    if (!p) byTrack[it.track].new += 1;
    else if (p.status === 'known') byTrack[it.track].known += 1;
    else byTrack[it.track].learning += 1;
  }
  return byTrack;
}
