import { Store } from '../store.js';
import { renderMarkdown, renderInline } from '../md.js';
import { navigate, toast } from '../app.js';
import { rate, statusOf } from '../srs.js';

export function renderCheatsheets(el, { snapshot, param }) {
  // Every pack whose track is `cheatsheets`, not just the pack whose *id* happens to be that.
  // `cheatsheets-b` holds 2 sheets that never rendered under the old id-keyed lookup.
  const sheets = Object.values(snapshot.packs)
    .filter(p => p && p.track === 'cheatsheets')
    .flatMap(p => p.items || []);
  if (param) {
    const sheet = sheets.find(s => s.id === param);
    if (!sheet) { el.innerHTML = `<div class="empty-state">Sheet not found.</div>`; return; }
    const progress = Store.getItemProgress(sheet.id);
    el.innerHTML = `
      <div class="btn-row no-print" style="margin-bottom:14px;">
        <button class="btn btn--ghost" id="back">← All cheat sheets</button>
        <button class="btn btn--primary" id="print-btn">🖨 Print / Save as PDF</button>
      </div>
      <h1>${renderInline(sheet.q)}</h1>
      <div class="answer-body">${renderMarkdown(sheet.answer)}</div>

      <div class="rate-row">
        <button class="rate-btn rate-btn--complete" id="mark-complete">Mark complete</button>
      </div>
      <p class="faint no-print" style="margin-top:8px;">Status: <strong>${statusOf(sheet.id)}</strong>${progress?.due ? ` · next review ${progress.due}` : ''}</p>
    `;
    el.querySelector('#back').addEventListener('click', () => navigate('cheatsheets'));
    el.querySelector('#print-btn').addEventListener('click', () => window.print());
    // A sheet is a countable item like any other, so the only action that records progress anywhere
    // has to be reachable from the view built for reading it — otherwise the cheatsheets track sits
    // at 0% for anyone who reads sheets here rather than hunting them down in Topics.
    el.querySelector('#mark-complete').addEventListener('click', () => {
      const res = rate(sheet.id, 'good');
      toast(`Marked complete — next review ${res.due}.`);
      renderCheatsheets(el, { snapshot, param });
    });
    return;
  }

  el.innerHTML = `
    <div class="eyebrow">Cheat Sheets</div>
    <h1>Printable one-pagers</h1>
    <p class="muted">Version matrices and quick-reference tables — good for a final skim the morning of.</p>
    <div class="grid grid-2" style="margin-top:16px;">
      ${sheets.map(s => `
        <div class="card card--interactive" data-id="${s.id}">
          <h2>${renderInline(s.q)}</h2>
          <p class="faint"><span class="status-dot status-dot--${statusOf(s.id)}"></span> ${s.topic}</p>
        </div>
      `).join('')}
    </div>
  `;
  el.querySelectorAll('[data-id]').forEach(c => c.addEventListener('click', () => navigate('cheatsheets', c.dataset.id)));
}
