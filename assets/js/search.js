// search.js — tiny in-memory fuzzy-ish search over question text, tags, and topic.
let index = [];

export function buildIndex(items) {
  index = items.map(it => ({
    id: it.id,
    q: it.q,
    track: it.track,
    topic: it.topic,
    haystack: [it.q, it.topic, it.track, ...(it.tags || [])].join(' ').toLowerCase(),
  }));
}

export function search(query, limit = 20) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const scored = [];
  for (const row of index) {
    let score = 0;
    for (const term of terms) {
      if (row.haystack.includes(term)) {
        score += row.q.toLowerCase().startsWith(term) ? 3 : 1;
      }
    }
    if (score > 0) scored.push({ ...row, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
