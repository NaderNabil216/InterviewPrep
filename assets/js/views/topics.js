import { navigate } from '../app.js';
import { renderInline } from '../md.js';
import { statusOf } from '../srs.js';
import { LEVEL_LABEL } from '../levels.js';
import { debounce } from '../search.js';

export function renderTopics(el, { snapshot, query }) {
  const state = {
    track: query.track || 'all',
    level: query.level || 'all',
    status: query.status || 'all',
    q: query.q || '',
  };

  // exclude dsa/design/behavioral tracks from this generic browser — they have dedicated workspaces,
  // but behavioral stays here since it's read-like content, not a workspace.
  const browsableItems = snapshot.items.filter(it => it.type !== 'dsa' && it.type !== 'design');
  const tracks = [...new Set(browsableItems.map(it => it.track))];

  function trackTitle(t) { return (snapshot.packMeta.find(p => p.track === t) || {}).title || t; }

  function applyFilters(items) {
    return items.filter(it => {
      if (state.track !== 'all' && it.track !== state.track) return false;
      if (state.level !== 'all' && String(it.level) !== state.level) return false;
      if (state.status === 'new-content') {
        // "New in this release" — added or updated in the snapshot's current version.
        if (it.addedIn !== snapshot.version && it.updatedIn !== snapshot.version) return false;
      } else if (state.status !== 'all') {
        if (statusOf(it.id) !== state.status) return false;
      }
      if (state.q && !it.q.toLowerCase().includes(state.q.toLowerCase()) && !(it.tags || []).some(t => t.includes(state.q.toLowerCase()))) return false;
      return true;
    });
  }

  // Only the #topics-list container is re-rendered while typing — the header/filter-bar stay put,
  // so the URL/hash sync (a full view re-mount) and the list narrowing are decoupled.
  function topicsListHTML() {
    const filtered = applyFilters(browsableItems);
    const grouped = {};
    for (const it of filtered) {
      grouped[it.track] = grouped[it.track] || {};
      grouped[it.track][it.topic] = grouped[it.track][it.topic] || [];
      grouped[it.track][it.topic].push(it);
    }
    return `
      ${Object.keys(grouped).length === 0 ? '<div class="empty-state">No items match. Try clearing filters.</div>' : ''}
      ${Object.entries(grouped).map(([track, topics]) => `
        <div class="topic-group">
          <div class="topic-group__head"><h2>${trackTitle(track)}</h2><span class="faint">${Object.values(topics).flat().length} items</span></div>
          ${Object.entries(topics).map(([topic, items]) => `
            <div style="margin-bottom:10px;">
              <div class="faint" style="margin-bottom:4px; font-weight:600;">${topic}</div>
              ${items.map(it => `
                <div class="item-row" data-id="${it.id}">
                  <span class="status-dot status-dot--${statusOf(it.id)}"></span>
                  <span class="item-row__q">${renderInline(it.q)}</span>
                  <span class="item-row__meta">
                    ${it.addedIn === snapshot.version ? '<span class="chip chip--new">NEW</span>'
                      : it.updatedIn === snapshot.version ? '<span class="chip chip--new">UPD</span>' : ''}
                    <span class="chip chip--level-${it.level}">${LEVEL_LABEL[it.level]}</span>
                  </span>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      `).join('')}
    `;
  }

  el.innerHTML = `
    <div class="eyebrow">Topics</div>
    <h1>Browse everything</h1>
    <p class="muted">${applyFilters(browsableItems).length} of ${browsableItems.length} items match your filters.</p>

    <div class="filter-bar">
      <input type="text" id="f-q" placeholder="Filter by keyword or tag…" value="${state.q}">
      <select id="f-track">
        <option value="all">All tracks</option>
        ${tracks.map(t => `<option value="${t}" ${state.track === t ? 'selected' : ''}>${trackTitle(t)}</option>`).join('')}
      </select>
      <select id="f-level">
        <option value="all">All levels</option>
        ${Object.entries(LEVEL_LABEL).map(([v, l]) => `<option value="${v}" ${state.level === String(v) ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      <select id="f-status">
        <option value="all">Any status</option>
        <option value="new" ${state.status === 'new' ? 'selected' : ''}>Not started</option>
        <option value="learning" ${state.status === 'learning' ? 'selected' : ''}>Learning</option>
        <option value="due" ${state.status === 'due' ? 'selected' : ''}>Due for review</option>
        <option value="known" ${state.status === 'known' ? 'selected' : ''}>Known</option>
        <option value="new-content" ${state.status === 'new-content' ? 'selected' : ''}>✨ New in v${snapshot.version}</option>
      </select>
    </div>

    <div id="topics-list">${topicsListHTML()}</div>
  `;

  function syncQuery() {
    navigate('topics', null, Object.fromEntries(Object.entries(state).filter(([,v]) => v && v !== 'all')));
  }
  const debouncedList = debounce(() => {
    el.querySelector('#topics-list').innerHTML = topicsListHTML();
  }, 150);
  const debouncedSync = debounce(syncQuery, 400);
  el.querySelector('#f-q').addEventListener('input', (e) => {
    state.q = e.target.value;
    debouncedList();
    debouncedSync();
  });
  el.querySelector('#f-track').addEventListener('change', (e) => { state.track = e.target.value; rerenderList(); });
  el.querySelector('#f-level').addEventListener('change', (e) => { state.level = e.target.value; rerenderList(); });
  el.querySelector('#f-status').addEventListener('change', (e) => { state.status = e.target.value; rerenderList(); });

  function rerenderList() {
    syncQuery();
  }

  el.addEventListener('click', (e) => {
    const row = e.target.closest('.item-row');
    if (row) navigate('item', row.dataset.id);
  });
}
