import { renderMarkdown, renderInline } from '../md.js';
import { navigate } from '../app.js';

export function renderCheatsheets(el, { snapshot, param }) {
  // Every pack whose track is `cheatsheets`, not just the pack whose *id* happens to be that.
  // `cheatsheets-b` holds 2 sheets that never rendered under the old id-keyed lookup.
  const sheets = Object.values(snapshot.packs)
    .filter(p => p && p.track === 'cheatsheets')
    .flatMap(p => p.items || []);
  if (param) {
    const sheet = sheets.find(s => s.id === param);
    if (!sheet) { el.innerHTML = `<div class="empty-state">Sheet not found.</div>`; return; }
    el.innerHTML = `
      <div class="btn-row no-print" style="margin-bottom:14px;">
        <button class="btn btn--ghost" id="back">← All cheat sheets</button>
        <button class="btn btn--primary" id="print-btn">🖨 Print / Save as PDF</button>
      </div>
      <h1>${renderInline(sheet.q)}</h1>
      <div class="answer-body">${renderMarkdown(sheet.answer)}</div>
    `;
    el.querySelector('#back').addEventListener('click', () => navigate('cheatsheets'));
    el.querySelector('#print-btn').addEventListener('click', () => window.print());
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
          <p class="faint">${s.topic}</p>
        </div>
      `).join('')}
    </div>
  `;
  el.querySelectorAll('[data-id]').forEach(c => c.addEventListener('click', () => navigate('cheatsheets', c.dataset.id)));
}
