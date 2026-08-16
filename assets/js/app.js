// app.js — hash router, boot sequence, global chrome (theme, search, update button).
import { Store, onStorageFailure, migrateTicks } from './store.js';
import { bootShell, bootContent, checkForUpdates, applyUpdate } from './content.js';
import { buildIndex, search, debounce } from './search.js';
import { stripMarkdown } from './md.js';

import { renderDashboard } from './views/dashboard.js';
import { renderPlan } from './views/plan.js';
import { renderTopics } from './views/topics.js';
import { renderItem } from './views/item.js';
import { renderDrill } from './views/drill.js';
import { renderDsa } from './views/dsa.js';
import { renderDesign } from './views/design.js';
import { renderMock } from './views/mock.js';
import { renderCheatsheets } from './views/cheatsheets.js';
import { renderSettings } from './views/settings.js';

export const App = {
  snapshot: null,
  pendingDiff: null,
  sessionActive: false,
  // Holds the manifest while the cold-cache content phase still owes us a library. The shell
  // snapshot borrows the disk manifest's version, so checkForUpdates() short-circuits on the
  // version compare and would never notice that `items` is still empty — without this, one failed
  // pack fetch on first boot strands the app on "Loading your library…" permanently.
  contentPhasePending: null,
};

const routes = {
  dashboard: renderDashboard,
  plan: renderPlan,
  topics: renderTopics,
  item: renderItem,
  drill: renderDrill,
  dsa: renderDsa,
  design: renderDesign,
  mock: renderMock,
  cheatsheets: renderCheatsheets,
  settings: renderSettings,
};

// ---------- toast ----------
export function toast(msg, ms = 3200) {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

// ---------- storage-failure banner ----------
// A toast auto-dismisses in 3.2s; a silently lost rating deserves better. This stays until dismissed.
const FRIENDLY_KEY = {
  progress: 'Your last rating could not be saved.',
  session: 'Your place in the app could not be saved.',
  plan: 'Your plan tick could not be saved.',
  settings: 'Your settings could not be saved.',
  mockResults: 'Your mock interview result could not be saved.',
  snapshot: 'The updated library could not be stored on this device.',
};

export function raiseStorageBanner(failure) {
  const banner = document.getElementById('storage-banner');
  if (!banner) return;
  const key = (failure && failure.key) || '';
  const base = key.startsWith('scratch.') ? 'scratch' : key;
  document.getElementById('storage-banner-title').textContent =
    FRIENDLY_KEY[base] || (base === 'scratch' ? 'Your draft could not be saved.' : 'Your last change could not be saved.');
  document.getElementById('storage-banner-detail').textContent = failure && failure.quotaExceeded
    ? 'This device is out of storage space for this site. Export your progress, then free up space — until then, changes are kept only for this tab.'
    : `Storage reported: ${(failure && failure.message) || 'unknown error'}`;
  banner.hidden = false;
}

function initStorageBanner() {
  onStorageFailure(raiseStorageBanner);
  document.getElementById('storage-banner-dismiss')
    .addEventListener('click', () => { document.getElementById('storage-banner').hidden = true; });
  document.getElementById('storage-banner-export').addEventListener('click', () => {
    const bundle = Store.exportProgress();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `android-interview-prep-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

// ---------- modal ----------
export function showModal(innerHtml, onMount) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-backdrop" id="modal-backdrop"><div class="modal-box">${innerHtml}</div></div>`;
  const backdrop = document.getElementById('modal-backdrop');
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
  if (onMount) onMount(root);
}
export function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
}

// ---------- router ----------
function parseHash() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [path, queryStr] = hash.split('?');
  const parts = path.split('/').filter(Boolean);
  const view = parts[0] || 'dashboard';
  const param = parts[1] || null;
  const query = {};
  if (queryStr) for (const pair of queryStr.split('&')) {
    const [k, v] = pair.split('=');
    if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || '');
  }
  return { view, param, query };
}

export function navigate(view, param, query) {
  let hash = '#/' + view + (param ? '/' + param : '');
  if (query && Object.keys(query).length) {
    hash += '?' + Object.entries(query).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  }
  location.hash = hash;
}

function setActiveNav(view) {
  document.querySelectorAll('.topbar__nav button').forEach(b => {
    b.classList.toggle('active', b.dataset.nav === view);
  });
}

function render() {
  const { view, param, query } = parseHash();
  const fn = routes[view] || routes.dashboard;
  // Leaving a Drill/Mock session by navigating away clears the session flag — a sync pending on
  // App.sessionActive must not stay blocked forever because the candidate quit mid-session. Once
  // clear, an already-detected diff applies right away (no modal, no confirm).
  if (view !== 'drill' && view !== 'mock') {
    if (App.sessionActive) App.sessionActive = false;
    applyPendingSync();
  }
  setActiveNav(view === 'item' ? 'topics' : view);
  const el = document.getElementById('view');
  el.innerHTML = '';
  el.scrollTop = 0;
  fn(el, { param, query, snapshot: App.snapshot });
  // A failed session write raises the banner via store.js; it must not break navigation.
  try { Store.setSession({ lastView: view + (param ? '/' + param : '') }); } catch (e) { /* reported */ }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);

// ---------- theme ----------
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  document.getElementById('theme-toggle').textContent =
    (theme === 'dark' || (theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)) ? '🌙' : '☀️';
}
function initTheme() {
  const settings = Store.getSettings();
  applyTheme(settings.theme || 'dark');
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const cur = Store.getSettings().theme || 'dark';
    const order = ['dark', 'light', 'auto'];
    const next = order[(order.indexOf(cur) + 1) % order.length];
    Store.setSettings({ theme: next });
    applyTheme(next);
  });
}

// ---------- search overlay ----------
function initSearch() {
  const overlay = document.getElementById('search-overlay');
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');

  function open() {
    overlay.hidden = false;
    input.value = '';
    results.innerHTML = '<div class="search-results__empty">Type to search all ~600 items…</div>';
    setTimeout(() => input.focus(), 10);
  }
  function close() { overlay.hidden = true; }

  document.getElementById('search-toggle').addEventListener('click', open);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault(); open();
    } else if (e.key === 'Escape' && !overlay.hidden) close();
  });
  // Every keystroke updates the box itself (that was never the bottleneck); the search compute +
  // results rebuild run on a ~150ms trailing debounce so a 10-char burst settles in one pass,
  // within 300ms of the last keystroke. Clearing stays synchronous so the prompt state never lags.
  const debouncedSearch = debounce(() => {
    const hits = search(input.value);
    if (!hits.length) {
      results.innerHTML = input.value ? '<div class="search-results__empty">No matches.</div>' : '<div class="search-results__empty">Type to search all ~600 items…</div>';
      return;
    }
    results.innerHTML = hits.map(h =>
      `<div class="search-results__item" data-id="${h.id}"><strong>${stripMarkdown(h.q)}</strong><div class="faint">${h.track} · ${h.topic}</div></div>`
    ).join('');
  }, 150);
  input.addEventListener('input', () => {
    if (!input.value.trim()) {
      results.innerHTML = '<div class="search-results__empty">Type to search all ~600 items…</div>';
      return;
    }
    debouncedSearch();
  });
  results.addEventListener('click', (e) => {
    const row = e.target.closest('.search-results__item');
    if (row) { close(); navigate('item', row.dataset.id); }
  });
}

// ---------- automatic content sync ----------
// FR-010: triggered on a schedule — once right after the shell-phase render (never blocking first
// paint), on visibilitychange/focus, and on the browser's online event. FR-010a: a found diff is
// held as App.pendingDiff until no Drill/Mock session is active. FR-007a: all-or-nothing — the
// complete new content set is fetched by checkForUpdates() BEFORE anything is mutated, so any
// fetch failure abandons the attempt with the stored snapshot untouched, no tick migration, no
// persist, and no toast; the device keeps working and retries at the next natural trigger.
async function checkAndHoldDiff() {
  // A first boot whose content phase failed has no library at all, and the version compare below
  // cannot detect that. Finish the boot before considering any update.
  if (App.contentPhasePending) { await runContentPhase(); return; }
  try {
    const diff = await checkForUpdates(App.snapshot);
    if (diff && diff.hasUpdates) {
      App.pendingDiff = diff;
      await applyPendingSync();
    }
  } catch (e) {
    // Offline, or a partial pack fetch rejected — stay quiet; nothing was mutated.
  }
}

// Boot phase 2, retryable. On success the full snapshot replaces the shell placeholder and the
// mounted view re-renders in place (no hash change occurs, so render() is called explicitly). On
// failure the manifest stays parked in App.contentPhasePending so the next natural trigger —
// focus, visibilitychange, or reconnecting — tries again; the candidate keeps seeing the loading
// placeholders rather than an error, exactly as a slow first load looks.
let contentPhaseInFlight = false;
async function runContentPhase() {
  const manifest = App.contentPhasePending;
  // focus/visibilitychange can fire repeatedly while 89 pack fetches are still outstanding; one
  // attempt at a time is enough.
  if (!manifest || contentPhaseInFlight) return;
  contentPhaseInFlight = true;
  try {
    const snapshot = await bootContent(manifest, raiseStorageBanner);
    App.contentPhasePending = null;
    App.snapshot = snapshot;
    buildIndex(snapshot.items);
    render();
  } catch (e) {
    console.error('content phase failed; will retry on the next focus/online trigger', e);
  } finally {
    contentPhaseInFlight = false;
  }
}

async function applyPendingSync() {
  const diff = App.pendingDiff;
  if (!diff || !diff.hasUpdates || App.sessionActive) return;
  App.pendingDiff = null;
  let snapshot;
  try {
    // Ordering is load-bearing: re-anchor ticks while the OUTGOING snapshot is still in place —
    // the plan they were earned on exists only inside the snapshot this update replaces.
    const planState = Store.getPlanState();
    const checkedCount = Object.keys(planState.checked || {}).filter(k => planState.checked[k]).length;
    const { done: migratedDone, cleared } = migrateTicks(App.snapshot, planState);
    if (checkedCount) {
      try { Store.setPlanState({ done: migratedDone, checked: {} }); } catch (e) { /* reported */ }
    }
    snapshot = await applyUpdate(diff);
    App.snapshot = snapshot;
    buildIndex(snapshot.items);
    const reanchored = checkedCount - cleared.length;
    let msg = `Content updated — ${diff.added.length} new, ${diff.updated.length} changed.`;
    if (reanchored > 0) msg += ` ${reanchored} plan tick${reanchored === 1 ? '' : 's'} re-anchored.`;
    else if (cleared.length) msg += ` ${cleared.length} plan tick${cleared.length === 1 ? '' : 's'} cleared (no material).`;
    toast(msg);
    render();
  } catch (e) {
    // applyUpdate's own failure leaves the previous snapshot intact (store.js raises the storage
    // banner). No sync toast — the device keeps working and retries at the next trigger.
    console.error(e);
  }
}

function initAutoSync() {
  const trigger = () => checkAndHoldDiff();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) trigger(); });
  window.addEventListener('focus', trigger);
  window.addEventListener('online', trigger);
  return trigger;
}

// ---------- nav wiring ----------
function initNav() {
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.nav));
  });
}

// ---------- file:// guard ----------
function checkProtocol() {
  if (location.protocol === 'file:') {
    document.getElementById('offline-notice').hidden = false;
    document.getElementById('app').style.display = 'none';
    return false;
  }
  return true;
}

// ---------- boot ----------
function hideBootStatus() {
  const el = document.getElementById('boot-status');
  if (el) el.hidden = true;
}

async function main() {
  if (!checkProtocol()) return;
  initStorageBanner();
  initTheme();
  initNav();
  initSearch();

  // Phase 1 (shell): render from the stored snapshot instantly, or from a minimal manifest-backed
  // placeholder if this is a true cold cache — nav + dashboard are interactive before any pack has
  // finished fetching. The content phase (below) never blocks this first paint.
  let manifest = null;
  try {
    const shell = await bootShell();
    App.snapshot = shell.snapshot;
    manifest = shell.manifest;
  } catch (e) {
    console.error(e);
    document.getElementById('view').innerHTML = `
      <div class="empty-state">
        <h2>Couldn't load content</h2>
        <p>${e.message}</p>
        <p class="faint">Make sure you're serving from /Users/nn/InterviewPrep via <code>bash tools/serve.sh</code>.</p>
      </div>`;
    hideBootStatus();
    return;
  }
  buildIndex(App.snapshot.items);
  render();
  hideBootStatus();

  // Phase 2 (content): cold cache only. Parked before the sync is wired so a retry, not a version
  // check, is what the triggers run while the library is still missing.
  App.contentPhasePending = manifest;

  // Automatic sync (FR-010): check once after the shell-phase render — never blocking first paint —
  // and on every later focus/visibilitychange/online trigger (wired in initAutoSync).
  const syncTrigger = initAutoSync();

  if (manifest) runContentPhase(); else syncTrigger();
}

main();
