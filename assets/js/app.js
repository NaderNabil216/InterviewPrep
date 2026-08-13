// app.js — hash router, boot sequence, global chrome (theme, search, update button).
import { Store, onStorageFailure, migrateTicks } from './store.js';
import { boot, checkForUpdates, applyUpdate } from './content.js';
import { buildIndex, search } from './search.js';
import { stripMarkdown, renderInline } from './md.js';

import { renderDashboard } from './views/dashboard.js';
import { renderPlan } from './views/plan.js';
import { renderTopics } from './views/topics.js';
import { renderItem } from './views/item.js';
import { renderDrill } from './views/drill.js';
import { renderDsa } from './views/dsa.js';
import { renderDesign } from './views/design.js';
import { renderMock } from './views/mock.js';
import { renderCheatsheets } from './views/cheatsheets.js';
import { renderWhatsNew } from './views/whatsnew.js';
import { renderSettings } from './views/settings.js';

export const App = {
  snapshot: null,
  pendingDiff: null,
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
  whatsnew: renderWhatsNew,
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
  input.addEventListener('input', () => {
    const hits = search(input.value);
    if (!hits.length) {
      results.innerHTML = input.value ? '<div class="search-results__empty">No matches.</div>' : '<div class="search-results__empty">Type to search all ~600 items…</div>';
      return;
    }
    results.innerHTML = hits.map(h =>
      `<div class="search-results__item" data-id="${h.id}"><strong>${stripMarkdown(h.q)}</strong><div class="faint">${h.track} · ${h.topic}</div></div>`
    ).join('');
  });
  results.addEventListener('click', (e) => {
    const row = e.target.closest('.search-results__item');
    if (row) { close(); navigate('item', row.dataset.id); }
  });
}

// ---------- update flow ----------
// SC-015: a device that cannot store the update should say so rather than fail quietly. Consulted
// before applying, where the browser exposes it.
async function storageOutlook(diff) {
  if (!navigator.storage || !navigator.storage.estimate) return '';
  let est;
  try { est = await navigator.storage.estimate(); } catch (e) { return ''; }
  if (!est || !est.quota) return '';
  const mb = (n) => (n / 1048576).toFixed(1) + ' MB';
  const projected = JSON.stringify({ packs: diff._diskPacks, plans: diff._diskPlans }).length;
  const headroom = est.quota - (est.usage || 0);
  const tight = projected > headroom;
  return `<p class="${tight ? 'muted' : 'faint'}">
    New library ≈ ${mb(projected)} · using ${mb(est.usage || 0)} of ${mb(est.quota)} available.
    ${tight ? '<strong>This device may not have room for the update.</strong> Export your progress before applying.' : ''}
  </p>`;
}

function renderDiffModal(diff) {
  const rows = [
    ...diff.added.map(it => `<div class="diff-list__row"><span class="chip chip--new">NEW</span> ${stripMarkdown(it.q)}</div>`),
    ...diff.updated.map(it => `<div class="diff-list__row"><span class="chip">UPDATED</span> ${stripMarkdown(it.q)}</div>`),
    ...diff.removedIds.map(id => `<div class="diff-list__row"><span class="chip">REMOVED</span> ${id}</div>`),
  ].join('') || '<div class="diff-list__row faint">No item-level changes — metadata only.</div>';

  const releaseNotes = (diff.newReleases || []).map(r =>
    `<li><strong>${r.version}</strong> — ${renderInline(r.summary || '')}</li>`
  ).join('');

  // Re-anchor plan ticks against the OUTGOING snapshot — the plan they were earned on exists only
  // inside the snapshot this update replaces. Computed here so the candidate reads what will be
  // cleared before accepting (FR-020), and applied only if they do.
  const planState = Store.getPlanState();
  const { done: migratedDone, cleared } = migrateTicks(App.snapshot, planState);
  const clearedNotice = cleared.length ? `
    <div class="card" style="margin-top:10px;">
      <strong>${cleared.length} plan tick${cleared.length === 1 ? '' : 's'} will be cleared.</strong>
      <p class="faint">These tasks link to no study material, so there is nothing to re-attach them to.
      Every tick on a task with material keeps its meaning.</p>
      <ul class="faint">${cleared.map(l => `<li>${renderInline(l)}</li>`).join('')}</ul>
    </div>` : '';

  showModal(`
    <h2>Update available — ${diff.fromVersion} → ${diff.toVersion}</h2>
    <p class="muted">${diff.added.length} new · ${diff.updated.length} updated · ${diff.removedIds.length} removed.
    Your progress, notes, and drill schedule are stored separately and will not be affected.</p>
    ${releaseNotes ? `<ul>${releaseNotes}</ul>` : ''}
    ${clearedNotice}
    <div id="storage-outlook"></div>
    <div class="diff-list">${rows}</div>
    <div class="btn-row">
      <button class="btn btn--primary" id="confirm-update">Apply update</button>
      <button class="btn btn--ghost" id="cancel-update">Not now</button>
    </div>
  `, (root) => {
    storageOutlook(diff).then(html => {
      const slot = root.querySelector('#storage-outlook');
      if (slot && html) slot.innerHTML = html;
    });
    root.querySelector('#confirm-update').addEventListener('click', async () => {
      const btn = root.querySelector('#confirm-update');
      btn.disabled = true;
      // Ordering is load-bearing: re-anchor ticks while the outgoing plan is still reachable.
      if (Object.keys(planState.checked || {}).length) {
        try { Store.setPlanState({ done: migratedDone, checked: {} }); } catch (e) { /* reported */ }
      }
      let snapshot;
      try {
        snapshot = await applyUpdate(diff);
      } catch (e) {
        // The previous snapshot is untouched — the candidate stays on the library they had.
        // The banner has already been raised by store.js; keep the modal open so they can retry.
        btn.disabled = false;
        console.error(e);
        return;
      }
      App.snapshot = snapshot;
      buildIndex(snapshot.items);
      App.pendingDiff = null;
      setUpdateButton(false);
      closeModal();
      toast(`Updated to ${diff.toVersion}. ${diff.added.length} new items added.`);
      render();
    });
    root.querySelector('#cancel-update').addEventListener('click', closeModal);
  });
}

function setUpdateButton(hasUpdates, count) {
  const btn = document.getElementById('update-btn');
  const label = btn.querySelector('.update-btn__label');
  const badge = document.getElementById('update-badge');
  if (hasUpdates) {
    btn.classList.add('has-updates');
    label.textContent = 'Update available';
    badge.hidden = false;
    badge.textContent = count;
  } else {
    btn.classList.remove('has-updates');
    label.textContent = 'Up to date';
    badge.hidden = true;
  }
}

async function initUpdateButton() {
  document.getElementById('update-btn').addEventListener('click', async () => {
    if (App.pendingDiff && App.pendingDiff.hasUpdates) {
      renderDiffModal(App.pendingDiff);
      return;
    }
    const btn = document.getElementById('update-btn');
    btn.querySelector('.update-btn__label').textContent = 'Checking…';
    try {
      const diff = await checkForUpdates(App.snapshot);
      if (diff && diff.hasUpdates) {
        App.pendingDiff = diff;
        setUpdateButton(true, diff.added.length + diff.updated.length);
        renderDiffModal(diff);
      } else {
        setUpdateButton(false);
        toast("You're already on the latest content.");
      }
    } catch (e) {
      console.error(e);
      setUpdateButton(false);
      toast('Could not check for updates (are you serving over http://localhost?).');
    }
  });

  // Silent background check on load, badge-only (no modal).
  try {
    const diff = await checkForUpdates();
    if (diff && diff.hasUpdates) {
      App.pendingDiff = diff;
      setUpdateButton(true, diff.added.length + diff.updated.length);
    }
  } catch (e) { /* offline or first run — fine, stay quiet */ }
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
async function main() {
  if (!checkProtocol()) return;
  initStorageBanner();
  initTheme();
  initNav();
  initSearch();

  try {
    App.snapshot = await boot(raiseStorageBanner);
  } catch (e) {
    console.error(e);
    document.getElementById('view').innerHTML = `
      <div class="empty-state">
        <h2>Couldn't load content</h2>
        <p>${e.message}</p>
        <p class="faint">Make sure you're serving from /Users/nn/InterviewPrep via <code>bash tools/serve.sh</code>.</p>
      </div>`;
    return;
  }
  buildIndex(App.snapshot.items);
  await initUpdateButton();
  render();
}

main();
