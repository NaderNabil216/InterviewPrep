import { Store } from '../store.js';
import { navigate } from '../app.js';
import { renderMarkdown, renderCodeBlock, renderInline, stripMarkdown } from '../md.js';
import { rate, statusOf } from '../srs.js';
import { toast } from '../app.js';
import { LEVEL_LABEL } from '../levels.js';
import { SECTION_LABEL, isLabelled } from '../sections.js';

// Module-scoped so navigating between items replaces the handler instead of stacking them.
let activeKeyHandler = null;

export function renderItem(el, { snapshot, param }) {
  const item = snapshot.byId[param];
  if (!item) {
    el.innerHTML = `<div class="empty-state">Item not found. It may have been removed in a content update.</div>`;
    return;
  }

  Store.setSession({ lastItemId: item.id });
  const siblings = snapshot.items.filter(i => i.track === item.track);
  const idx = siblings.findIndex(i => i.id === item.id);
  const prev = siblings[idx - 1];
  const next = siblings[idx + 1];
  const progress = Store.getItemProgress(item.id);
  const notes = progress?.notes || '';

  el.innerHTML = `
    <div class="row" style="justify-content:space-between; margin-bottom:6px;">
      <div class="row">
        <span class="chip chip--level-${item.level}">${LEVEL_LABEL[item.level]}</span>
        <span class="faint">${item.track} · ${item.topic}</span>
        ${item.addedIn ? `<span class="faint">· added ${item.addedIn}</span>` : ''}
      </div>
      <button class="btn btn--ghost" data-nav="topics">← All topics</button>
    </div>

    <div class="card">
      ${isLabelled(item) && item.q ? `<h4 class="section-label">${SECTION_LABEL.question}</h4>` : ''}
      <div class="item-view__q">${renderInline(item.q)}</div>

      ${isLabelled(item) && item.shortAnswer?.length ? `<h4 class="section-label">${SECTION_LABEL.shortAnswer}</h4>` : ''}
      ${item.shortAnswer?.length ? `
        <ul class="short-answer">
          ${item.shortAnswer.map(s => `<li>${renderInline(s)}</li>`).join('')}
        </ul>` : ''}

      ${isLabelled(item) && item.answer ? `<h4 class="section-label">${SECTION_LABEL.answer}</h4>` : ''}
      <div class="answer-body">${renderMarkdown(item.answer || '')}</div>

      ${(item.code || []).map(block => (isLabelled(item)
        ? `<h4 class="section-label">${SECTION_LABEL.code}</h4>`
        : '') + renderCodeBlock(block)).join('')}

      ${item.followUps?.length ? `
        ${isLabelled(item)
          ? `<h4 class="section-label">${SECTION_LABEL.followUps}</h4>`
          : '<h4 style="margin-top:18px;">Likely follow-ups</h4>'}
        <ul>${item.followUps.map(f => `<li>${renderInline(f)}</li>`).join('')}</ul>` : ''}

      ${item.traps?.length ? `
        <div class="traps-box">
          ${isLabelled(item)
            ? `<h4 class="section-label">${SECTION_LABEL.traps}</h4>`
            : '<h4>⚠ Traps that get people rejected here</h4>'}
          <ul>${item.traps.map(t => `<li>${renderInline(t)}</li>`).join('')}</ul>
        </div>` : ''}

      ${item.refs?.length ? `
        <div class="refs-box faint">
          ${isLabelled(item)
            ? `<h4 class="section-label">${SECTION_LABEL.refs}</h4>`
            : '<strong>Sources</strong>'}
          ${item.refs.map(r => `<a href="${r.url}" target="_blank" rel="noopener">${r.title} <span class="faint">(checked ${r.checked})</span></a>`).join('')}
        </div>` : ''}

      <div class="notes-box" style="margin-top:16px;">
        <div class="faint" style="margin-bottom:6px;">Your notes</div>
        <textarea id="notes" placeholder="Jot a memory hook, a personal example, or where you got tripped up…">${notes}</textarea>
      </div>

      <div class="rate-row">
        <button class="rate-btn rate-btn--complete" id="mark-complete">Mark complete</button>
      </div>
      <p class="faint" style="margin-top:8px;">Status: <strong>${statusOf(item.id)}</strong>${progress?.due ? ` · next review ${progress.due}` : ''}</p>
    </div>

    <div class="item-nav">
      <button class="btn" id="nav-prev" ${!prev ? 'disabled' : ''}>← ${prev ? stripMarkdown(prev.q).slice(0, 40) + '…' : 'Start of track'}</button>
      <button class="btn" id="nav-next" ${!next ? 'disabled' : ''}>${next ? stripMarkdown(next.q).slice(0, 40) + '…' : 'End of track'} →</button>
    </div>
  `;

  el.querySelector('[data-nav="topics"]').addEventListener('click', () => navigate('topics'));
  el.querySelector('#mark-complete').addEventListener('click', () => {
    const res = rate(item.id, 'good');
    toast(`Marked complete — next review ${res.due}.`);
    renderItem(el, { snapshot, param });
  });
  el.querySelector('#notes').addEventListener('change', (e) => {
    Store.setItemProgress(item.id, { notes: e.target.value });
  });
  if (prev) el.querySelector('#nav-prev').addEventListener('click', () => navigate('item', prev.id));
  if (next) el.querySelector('#nav-next').addEventListener('click', () => navigate('item', next.id));

  // One live listener at a time. Using { once: true } here would both (a) consume the
  // listener on any unrelated keypress and (b) leave a stale closure per item visited,
  // so pressing `j` after browsing 20 items would fire 20 handlers with stale prev/next.
  if (activeKeyHandler) document.removeEventListener('keydown', activeKeyHandler);
  activeKeyHandler = (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'j' && next) navigate('item', next.id);
    if (e.key === 'k' && prev) navigate('item', prev.id);
  };
  document.addEventListener('keydown', activeKeyHandler);
}
