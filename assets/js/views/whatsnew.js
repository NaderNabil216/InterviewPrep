import { navigate } from '../app.js';
import { renderMarkdown, renderInline } from '../md.js';

export function renderWhatsNew(el, { snapshot }) {
  // Manifest order, not a re-sort: sync-manifest.mjs already unshifts newest-first, and string
  // comparison puts '2026.08.10' below '2026.08.9' — which this release train hits.
  const releases = snapshot.releases || [];
  const itemsByVersion = {};
  for (const it of snapshot.items) {
    const v = it.updatedIn || it.addedIn;
    if (!v) continue;
    itemsByVersion[v] = itemsByVersion[v] || [];
    itemsByVersion[v].push(it);
  }

  el.innerHTML = `
    <div class="eyebrow">What's New</div>
    <h1>Content changelog</h1>
    <p class="muted">Current snapshot: <strong>v${snapshot.version}</strong> · generated ${snapshot.generatedAt}</p>

    <div class="stack" style="margin-top:16px;">
      ${releases.map(r => `
        <div class="card">
          <div class="row" style="justify-content:space-between;">
            <h2>${r.version}</h2>
            <span class="faint">${r.date || ''}</span>
          </div>
          <div class="answer-body">${renderMarkdown(r.summary || '')}</div>
          ${itemsByVersion[r.version]?.length ? `
            <div style="margin-top:10px;">
              ${itemsByVersion[r.version].map(it => `
                <div class="item-row" data-id="${it.id}">
                  <span class="chip chip--new">${it.updatedIn === r.version && it.addedIn !== r.version ? 'UPD' : 'NEW'}</span>
                  <span class="item-row__q">${renderInline(it.q)}</span>
                  <span class="faint">${it.track}</span>
                </div>
              `).join('')}
            </div>` : ''}
        </div>
      `).join('') || '<div class="empty-state">No release history yet.</div>'}
    </div>
  `;
  el.addEventListener('click', (e) => {
    const row = e.target.closest('.item-row');
    if (row) navigate('item', row.dataset.id);
  });
}
