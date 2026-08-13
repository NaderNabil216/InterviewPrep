import { Store } from '../store.js';
import { navigate, toast } from '../app.js';
import { renderMarkdown, renderCodeBlock, renderInline } from '../md.js';
import { rate, statusOf } from '../srs.js';
import { LEVEL_LABEL } from '../levels.js';

function renderList(el, snapshot, query) {
  const items = snapshot.items.filter(it => it.type === 'dsa');
  const patterns = [...new Set(items.map(it => it.pattern))];
  const activePattern = query.pattern || 'all';
  const filtered = activePattern === 'all' ? items : items.filter(it => it.pattern === activePattern);

  el.innerHTML = `
    <div class="eyebrow">Problem Solving</div>
    <h1>DSA Workspace</h1>
    <p class="muted">${items.length} problems across every core pattern, plus Android-flavored coding tasks. Kotlin throughout.</p>

    <div class="filter-bar">
      <select id="f-pattern">
        <option value="all">All patterns</option>
        ${patterns.map(p => `<option value="${p}" ${activePattern === p ? 'selected' : ''}>${p}</option>`).join('')}
      </select>
    </div>

    <div class="stack">
      ${filtered.map(it => `
        <div class="item-row" data-id="${it.id}" style="padding:14px 16px;">
          <span class="status-dot status-dot--${statusOf(it.id)}"></span>
          <div style="flex:1;">
            <div class="item-row__q" style="font-weight:600;">${renderInline(it.q)}</div>
            <div class="faint">${it.pattern}</div>
          </div>
          <span class="chip chip--level-${it.level}">${LEVEL_LABEL[it.level]}</span>
        </div>
      `).join('')}
    </div>
  `;
  el.querySelector('#f-pattern').addEventListener('change', (e) => navigate('dsa', null, { pattern: e.target.value }));
  el.querySelectorAll('.item-row').forEach(r => r.addEventListener('click', () => navigate('dsa', r.dataset.id)));
}

function renderDetail(el, snapshot, item) {
  const scratch = Store.getScratch(item.id) || { code: item.starter || '', revealed: false };

  el.innerHTML = `
    <button class="btn btn--ghost" id="back" style="margin-bottom:10px;">← All problems</button>
    <div class="row" style="margin-bottom:6px;">
      <span class="chip chip--level-${item.level}">${LEVEL_LABEL[item.level]}</span>
      <span class="chip">${item.pattern}</span>
    </div>
    <h1>${renderInline(item.q)}</h1>

    <div class="grid grid-2" style="align-items:start;">
      <div class="stack">
        <div class="card">
          <h3>Problem</h3>
          <div class="answer-body">${renderMarkdown(item.prompt || item.answer || '')}</div>
        </div>

        <div class="card">
          <h3>Progressive hints</h3>
          <div class="hints-list">
            ${(item.hints || []).map((h, idx) => `
              <details class="hint-item"><summary>Hint ${idx + 1}</summary><div>${renderMarkdown(h)}</div></details>
            `).join('')}
          </div>
        </div>

        <div class="card">
          <div class="row" style="justify-content:space-between;">
            <h3 style="margin:0;">Solution</h3>
            <button class="btn" id="toggle-solution">${scratch.revealed ? 'Hide' : 'Reveal'} solution</button>
          </div>
          <div id="solution-body" style="${scratch.revealed ? '' : 'display:none;'} margin-top:10px;">
            ${(item.code || []).map(renderCodeBlock).join('')}
            ${item.complexity ? `<p class="muted"><strong>Complexity:</strong> ${item.complexity}</p>` : ''}
            ${item.followUps?.length ? `<h4>Follow-ups</h4><ul>${item.followUps.map(f => `<li>${renderInline(f)}</li>`).join('')}</ul>` : ''}
          </div>
        </div>
      </div>

      <div class="stack">
        <div class="card">
          <h3>Your Kotlin scratchpad</h3>
          <textarea class="scratchpad" id="scratchpad" spellcheck="false">${scratch.code}</textarea>
          <p class="faint" style="margin-top:8px;">Saved automatically to this browser. Not graded — just a place to think in code.</p>
        </div>
        <div class="rate-row">
          <button class="rate-btn" data-rate="again">Again</button>
          <button class="rate-btn" data-rate="hard">Hard</button>
          <button class="rate-btn" data-rate="good">Good</button>
          <button class="rate-btn" data-rate="easy">Easy</button>
        </div>
      </div>
    </div>
  `;

  el.querySelector('#back').addEventListener('click', () => navigate('dsa'));
  el.querySelector('#toggle-solution').addEventListener('click', (e) => {
    const body = el.querySelector('#solution-body');
    const nowOpen = body.style.display === 'none';
    body.style.display = nowOpen ? 'block' : 'none';
    e.target.textContent = (nowOpen ? 'Hide' : 'Reveal') + ' solution';
    Store.setScratch(item.id, { ...Store.getScratch(item.id), revealed: nowOpen });
  });
  el.querySelector('#scratchpad').addEventListener('input', (e) => {
    Store.setScratch(item.id, { ...Store.getScratch(item.id), code: e.target.value });
  });
  el.querySelectorAll('.rate-btn').forEach(b => b.addEventListener('click', () => {
    rate(item.id, b.dataset.rate);
    toast(`Marked "${b.dataset.rate}".`);
  }));
}

export function renderDsa(el, { snapshot, param, query }) {
  if (!param) { renderList(el, snapshot, query); return; }
  const item = snapshot.byId[param];
  if (!item) { el.innerHTML = `<div class="empty-state">Problem not found.</div>`; return; }
  renderDetail(el, snapshot, item);
}
