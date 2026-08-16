// store.js — all persistence lives here. Two physically separate stores, never conflated:
//   IndexedDB  aip / snapshot / "current"   content pulled from disk, replaced wholesale on Update
//   localStorage  aip.v1.*                  your learning state, keyed by permanent item id —
//                                           Update never touches this
//
// The snapshot moved off localStorage because the full 629-item library does not fit: measured, the
// old three-copies-of-every-item shape projects to ~8.17M chars against a ~5MB cap, and the write
// failure was silent. One canonical copy now lives in IndexedDB; items/byId are derived on load.
const NS = 'aip.v1.';

const IDB_NAME = 'aip';
const IDB_STORE = 'snapshot';
const IDB_KEY = 'current';
const LEGACY_SNAPSHOT_KEY = 'snapshot';

// ---------------------------------------------------------------------------
// Failure reporting
// ---------------------------------------------------------------------------
// A QuotaExceededError on a rating used to look exactly like success. Every write now either
// returns true or throws this, and app.js raises a persistent banner from it.
export class StorageFailure extends Error {
  constructor(key, cause) {
    super(`Could not save "${key}": ${(cause && cause.message) || cause}`);
    this.name = 'StorageFailure';
    this.key = key;
    this.cause = cause;
    this.quotaExceeded = isQuotaError(cause);
  }
}

function isQuotaError(e) {
  if (!e) return false;
  return e.name === 'QuotaExceededError'
    || e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    || e.code === 22 || e.code === 1014;
}

// app.js registers the banner here. The failure is announced *and* thrown: announcing guarantees the
// candidate is told even when a caller does not catch, throwing keeps the documented contract.
let failureListener = null;
export function onStorageFailure(fn) { failureListener = fn; }
function announce(failure) {
  if (failureListener) { try { failureListener(failure); } catch (e) { console.error(e); } }
  return failure;
}

// ---------------------------------------------------------------------------
// localStorage — learning state
// ---------------------------------------------------------------------------
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch (e) {
    console.warn('store.read failed for', key, e);
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
    return true;
  } catch (e) {
    throw announce(new StorageFailure(key, e));
  }
}
function remove(key) { localStorage.removeItem(NS + key); }

// ---------------------------------------------------------------------------
// IndexedDB — content snapshot
// ---------------------------------------------------------------------------
let dbPromise = null;
function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB is unavailable')); return; }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB open blocked by another tab'));
  });
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

function idbRequest(mode, fn) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, mode);
    const req = fn(tx.objectStore(IDB_STORE));
    tx.onabort = () => reject(tx.error || (req && req.error) || new Error('IndexedDB transaction aborted'));
    tx.onerror = () => reject(tx.error || (req && req.error) || new Error('IndexedDB transaction failed'));
    tx.oncomplete = () => resolve(req ? req.result : undefined);
  }));
}

const idbGet = (key) => idbRequest('readonly', (s) => s.get(key));
const idbPut = (key, value) => idbRequest('readwrite', (s) => s.put(value, key));
const idbDelete = (key) => idbRequest('readwrite', (s) => s.delete(key));

// The persisted record carries only what a view reads. items/byId are rebuilt here on every load,
// so snapshot.items, snapshot.byId and snapshot.packs keep the shape every view already expects.
export function deriveSnapshot(snap) {
  if (!snap) return null;
  const items = Object.values(snap.packs || {}).flatMap(p => (p && p.items) || []);
  const byId = {};
  for (const it of items) byId[it.id] = it;
  snap.items = items;
  snap.byId = byId;
  return snap;
}

// One-time boot migration: IndexedDB empty and the old localStorage snapshot present. Idempotent,
// and never re-fetches content. Frees ~2.4MB of the candidate's localStorage budget.
let migrationDone = false;
async function migrateLegacySnapshot() {
  if (migrationDone) return null;
  migrationDone = true;
  let legacyRaw = null;
  try { legacyRaw = localStorage.getItem(NS + LEGACY_SNAPSHOT_KEY); } catch (e) { return null; }
  if (legacyRaw == null) return null;

  let existing;
  try { existing = await idbGet(IDB_KEY); } catch (e) { return null; }
  if (existing !== undefined && existing !== null) return null;   // IndexedDB wins; nothing to migrate

  let parsed;
  try { parsed = JSON.parse(legacyRaw); } catch (e) {
    console.warn('store: legacy snapshot is unparseable, discarding', e);
    remove(LEGACY_SNAPSHOT_KEY);
    return null;
  }
  const record = persistShape(parsed);
  await idbPut(IDB_KEY, record);
  remove(LEGACY_SNAPSHOT_KEY);
  return deriveSnapshot(record);
}

// Strip the derived fields before persisting — this is what takes each item from 3 copies to 1.
function persistShape(snap) {
  return {
    version: snap.version,
    generatedAt: snap.generatedAt,
    stackSnapshot: snap.stackSnapshot || {},
    releases: snap.releases || [],
    packMeta: snap.packMeta,
    packs: snap.packs,
    plans: snap.plans,
    fetchedAt: snap.fetchedAt,
  };
}

// ---------------------------------------------------------------------------
// Plan state — mode, and completion anchored to material rather than position
// ---------------------------------------------------------------------------
// A task's completion identity is the material it links to, not its dayIdx:taskIdx slot. Position
// keys silently mark unread material as done the moment a plan is re-authored, which is the one
// path by which a release could corrupt learning state.
export const signature = (ids) => [...ids].sort().join('+');

// FR-015 legacy resolution. An untouched candidate has no `aip.v1.plan` key at all, which is what
// makes the three cases distinguishable:
//   mode present        -> use it
//   startedAt non-null  -> they had started a dated plan; keep it, position and marks intact
//   otherwise           -> free
export function resolvePlanState(raw) {
  const base = { mode: 'free', activePlan: '14day', startedAt: null, done: {}, checked: {} };
  if (!raw) return base;
  const s = { ...base, ...raw };
  if (!raw.mode) s.mode = raw.startedAt ? (raw.activePlan || '14day') : 'free';
  return s;
}

// Re-anchors positional ticks onto material signatures, using the plan they were earned against —
// which is why this must run BEFORE applyUpdate() swaps the snapshot: the outgoing plan exists only
// inside the snapshot being replaced. Pure, so the update flow and the import path share it.
// Returns the new `done` map plus the labels of ticks that cannot survive: tasks pointing at no
// material have no signature, and they are the only marks FR-020 permits to be cleared.
export function migrateTicks(snapshot, planState) {
  const done = { ...(planState.done || {}) };
  const cleared = [];
  const checked = planState.checked || {};
  const plan = snapshot && snapshot.plans && snapshot.plans[planState.activePlan || '14day'];
  for (const key of Object.keys(checked)) {
    if (!checked[key]) continue;
    const [d, t] = key.split(':').map(Number);
    const task = plan && plan.days && plan.days[d] && plan.days[d].tasks && plan.days[d].tasks[t];
    const ids = (task && task.itemIds) || [];
    if (!ids.length) {
      cleared.push((task && task.label) || `Day ${Number.isFinite(d) ? d + 1 : '?'}, task ${Number.isFinite(t) ? t + 1 : '?'}`);
      continue;
    }
    done[signature(ids)] = true;
  }
  return { done, cleared };
}

export const Store = {
  // ---- content snapshot (IndexedDB) ----
  async getSnapshot() {
    const migrated = await migrateLegacySnapshot();
    if (migrated) return migrated;
    let rec;
    try { rec = await idbGet(IDB_KEY); } catch (e) {
      console.warn('store.getSnapshot failed', e);
      return null;
    }
    return deriveSnapshot(rec || null);
  },
  async setSnapshot(snap) {
    try {
      await idbPut(IDB_KEY, persistShape(snap));
      return true;
    } catch (e) {
      throw announce(new StorageFailure('snapshot', e));
    }
  },
  async clearSnapshot() {
    try { await idbDelete(IDB_KEY); } catch (e) { console.warn('store.clearSnapshot failed', e); }
    remove(LEGACY_SNAPSHOT_KEY);
  },

  // ---- progress: per-item learning state ----
  // shape: { [itemId]: { status, ease, interval, due, reps, lapses, lastRated, notes } }
  getProgress() { return read('progress', {}); },
  setProgress(p) { return write('progress', p); },
  getItemProgress(id) { return this.getProgress()[id] || null; },
  setItemProgress(id, state) {
    const p = this.getProgress();
    p[id] = { ...(p[id] || {}), ...state };
    this.setProgress(p);
    return p[id];
  },

  // ---- session: last-viewed item, resume pointer ----
  getSession() { return read('session', { lastItemId: null, lastView: 'dashboard', history: [] }); },
  setSession(s) { return write('session', { ...this.getSession(), ...s }); },

  // ---- study plan progress: which mode, which plan, which tasks are done ----
  getPlanState() { return resolvePlanState(read('plan', null)); },
  setPlanState(s) { return write('plan', { ...this.getPlanState(), ...s }); },

  // ---- settings ----
  getSettings() {
    return read('settings', {
      theme: 'auto',
      interviewDate: null,
      lastSeenChangelog: null,
      judge0ApiKey: null, // RapidAPI Judge0 CE key — candidate-supplied, never shipped by the app
    });
  },
  setSettings(s) { return write('settings', { ...this.getSettings(), ...s }); },

  // ---- mock interview results history ----
  getMockResults() { return read('mockResults', []); },
  addMockResult(r) {
    const list = this.getMockResults();
    list.unshift(r);
    return write('mockResults', list.slice(0, 50));
  },

  // ---- DSA / design scratch state (code drafts, checklist ticks) keyed by item id ----
  getScratch(id) { return read('scratch.' + id, null); },
  setScratch(id, val) { return write('scratch.' + id, val); },

  // ---- export / import progress-only bundle ----
  exportProgress() {
    return {
      exportedAt: new Date().toISOString(),
      kind: 'aip-progress-export',
      version: 1,
      progress: this.getProgress(),
      session: this.getSession(),
      plan: this.getPlanState(),
      settings: this.getSettings(),
      mockResults: this.getMockResults(),
    };
  },
  // `snapshot` is optional but wanted: a bundle exported before the expansion carries positional
  // `checked` keys, and reattaching them needs the plan they were earned against. Passing the
  // current snapshot applies the same migration boot does, so an old bundle re-imported after the
  // expansion still lands on the right material. kind and version are unchanged, so old bundles
  // remain importable either way.
  importProgress(bundle, snapshot) {
    if (!bundle || bundle.kind !== 'aip-progress-export') throw new Error('Not a valid progress export file.');
    if (bundle.progress) this.setProgress(bundle.progress);
    if (bundle.session) this.setSession(bundle.session);
    if (bundle.plan) {
      const resolved = resolvePlanState(bundle.plan);
      if (Object.keys(resolved.checked || {}).length) {
        const { done } = migrateTicks(snapshot, resolved);
        resolved.done = done;
        resolved.checked = {};
      }
      write('plan', resolved);
    }
    if (bundle.settings) this.setSettings(bundle.settings);
    if (bundle.mockResults) write('mockResults', bundle.mockResults);
  },

  resetProgress() {
    remove('progress'); remove('session'); remove('plan'); remove('mockResults');
    // scratch.* keys are left as-is by design scope of "reset progress"; clear them too for a clean slate
    Object.keys(localStorage)
      .filter(k => k.startsWith(NS + 'scratch.'))
      .forEach(k => localStorage.removeItem(k));
  },
  resetContentSnapshot() { return this.clearSnapshot(); },
};
