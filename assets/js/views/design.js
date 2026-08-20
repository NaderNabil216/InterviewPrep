import { Store } from '../store.js';
import { navigate, toast } from '../app.js';
import { renderMarkdown, renderInline, renderSentences } from '../md.js';
import { statusOf, rate } from '../srs.js';
import { LEVEL_LABEL } from '../levels.js';

function renderList(el, snapshot) {
  const items = snapshot.items.filter(it => it.type === 'design');
  const framework = items.find(it => it.isFramework);
  const scenarios = items.filter(it => !it.isFramework);

  el.innerHTML = `
    <div class="eyebrow">Mobile System Design</div>
    <h1>System Design Workspace</h1>
    <p class="muted">A repeatable framework, then ${scenarios.length} realistic mobile scenarios with timers and a scoring rubric.</p>

    ${framework ? `
      <div class="card card--interactive" data-id="${framework.id}" style="margin-bottom:18px; border-color:var(--accent);">
        <div class="eyebrow">Start here</div>
        <h2>${renderSentences(framework.q)}</h2>
        <p class="muted">The framework you'll reuse in every scenario below.</p>
      </div>` : ''}

    <div class="stack">
      ${scenarios.map(it => `
        <div class="item-row" data-id="${it.id}" style="padding:14px 16px;">
          <span class="status-dot status-dot--${statusOf(it.id)}"></span>
          <div style="flex:1;">
            <div class="item-row__q" style="font-weight:600;">${renderInline(it.q)}</div>
            <div class="faint">${(it.tags || []).join(' · ')}</div>
          </div>
          <span class="chip chip--level-${it.level}">${LEVEL_LABEL[it.level]}</span>
        </div>
      `).join('')}
    </div>
  `;
  el.querySelectorAll('[data-id]').forEach(r => r.addEventListener('click', () => navigate('design', r.dataset.id)));
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function renderDetail(el, snapshot, item) {
  const scratch = Store.getScratch(item.id) || { checked: {}, timeLeft: (item.timerMinutes || 45) * 60, running: false };
  let timerInterval = null;

  // US8 (FR-027): two-step render. Step 1 shows the clarifying questions and nothing else of the
  // solution; an explicit proceed action reveals the plan-phase content. Old snapshots whose items
  // predate clarifyingQuestions fall straight through to the legacy single-phase view.
  const clarifying = item.clarifyingQuestions || [];
  const needsClarify = clarifying.length > 0;

  el.innerHTML = `
    <button class="btn btn--ghost" id="back" style="margin-bottom:10px;">← All scenarios</button>
    <div class="row" style="margin-bottom:6px;">
      <span class="chip chip--level-${item.level}">${LEVEL_LABEL[item.level]}</span>
      ${(item.tags || []).map(t => `<span class="chip">${t}</span>`).join('')}
    </div>
    <h1>${renderSentences(item.q)}</h1>

    <div class="grid grid-2" style="align-items:start;">
      <div class="stack">
        <div class="card">
          <h3>Scenario</h3>
          <div class="answer-body">${renderMarkdown(item.prompt || '', { splitSentences: true })}</div>
        </div>

        ${needsClarify ? `
        <div class="card">
          <div class="row" style="justify-content:space-between;">
            <h3 style="margin:0;">Phase 1 — Clarify</h3>
            <span class="chip chip--new">Ask before proposing anything</span>
          </div>
          <p class="faint" style="margin-top:8px;">Ask these out loud, then tick each one. The plan content stays hidden until you proceed.</p>
          <div class="checklist">
            ${clarifying.map((q, idx) => `
              <label><input type="checkbox" data-clarify="${idx}"> ${renderInline(q)}</label>
            `).join('')}
          </div>
          <button class="btn btn--primary" id="proceed-plan" style="margin-top:14px;">Proceed to plan →</button>
        </div>` : ''}

        <div id="plan-phase" ${needsClarify ? 'hidden' : ''}>
          ${item.framework ? `
          <div class="card">
            <h3>Phase 2 — Approach framework</h3>
            <div class="answer-body">${renderMarkdown(item.framework)}</div>
          </div>` : ''}

          <div class="card">
            <h3>Requirements checklist — tick as you cover them out loud</h3>
            <div class="checklist">
              ${(item.requirements || []).map((r, idx) => `
                <label><input type="checkbox" data-req="${idx}" ${scratch.checked[idx] ? 'checked' : ''}> ${renderInline(r)}</label>
              `).join('')}
            </div>
          </div>

          <div class="card">
            <div class="row" style="justify-content:space-between;">
              <h3 style="margin:0;">Reference architecture &amp; deep dives</h3>
              <button class="btn" id="toggle-ref">${scratch.revealed ? 'Hide' : 'Reveal'}</button>
            </div>
            <div id="ref-body" class="answer-body" style="${scratch.revealed ? '' : 'display:none;'} margin-top:10px;">
              ${item.diagram ? `<div class="diagram">${item.diagram}</div>` : ''}
              ${renderMarkdown(item.referenceAnswer || '')}
            </div>
          </div>

          ${item.staffAdds?.length ? `
          <div class="card">
            <h3>What a staff-level answer adds</h3>
            <ul>${item.staffAdds.map(s => `<li>${renderInline(s)}</li>`).join('')}</ul>
          </div>` : ''}
        </div>
      </div>

      <div class="stack">
        <div class="card">
          <h3>Timer</h3>
          <div class="timer" id="timer">${fmtTime(scratch.timeLeft)}</div>
          <div class="btn-row" style="margin-top:10px;">
            <button class="btn btn--primary" id="timer-toggle">${scratch.running ? 'Pause' : 'Start'}</button>
            <button class="btn btn--ghost" id="timer-reset">Reset</button>
          </div>
        </div>

        <div id="plan-side" ${needsClarify ? 'hidden' : ''}>
          ${item.rubric?.length ? `
          <div class="card">
            <h3>Self-score rubric</h3>
            <div class="checklist">
              ${item.rubric.map((r, idx) => `<label><input type="checkbox" data-rub="${idx}" ${scratch.rubric?.[idx] ? 'checked' : ''}> ${renderInline(r)}</label>`).join('')}
            </div>
          </div>` : ''}

          <div class="rate-row">
            <button class="rate-btn rate-btn--complete" id="mark-complete">Mark complete</button>
          </div>
        </div>
      </div>
    </div>
  `;

  function saveScratch(patch) {
    const cur = Store.getScratch(item.id) || scratch;
    Store.setScratch(item.id, { ...cur, ...patch });
  }

  el.querySelector('#back').addEventListener('click', () => { clearInterval(timerInterval); navigate('design'); });
  const proceedBtn = el.querySelector('#proceed-plan');
  if (proceedBtn) proceedBtn.addEventListener('click', () => {
    // Step 2 gate (FR-028): reveal the plan-phase content in place. The clarify checklist stays
    // visible as the candidate's scratch notes; only the proceed affordance is consumed.
    el.querySelector('#plan-phase').hidden = false;
    el.querySelector('#plan-side').hidden = false;
    proceedBtn.hidden = true;
  });
  el.querySelectorAll('[data-req]').forEach(cb => cb.addEventListener('change', () => {
    const cur = Store.getScratch(item.id) || scratch;
    cur.checked = cur.checked || {};
    cur.checked[cb.dataset.req] = cb.checked;
    Store.setScratch(item.id, cur);
  }));
  el.querySelectorAll('[data-rub]').forEach(cb => cb.addEventListener('change', () => {
    const cur = Store.getScratch(item.id) || scratch;
    cur.rubric = cur.rubric || {};
    cur.rubric[cb.dataset.rub] = cb.checked;
    Store.setScratch(item.id, cur);
  }));
  el.querySelector('#toggle-ref').addEventListener('click', (e) => {
    const body = el.querySelector('#ref-body');
    const open = body.style.display === 'none';
    body.style.display = open ? 'block' : 'none';
    e.target.textContent = open ? 'Hide' : 'Reveal';
    saveScratch({ revealed: open });
  });

  const timerEl = el.querySelector('#timer');
  const toggleBtn = el.querySelector('#timer-toggle');
  function tick() {
    const cur = Store.getScratch(item.id) || scratch;
    cur.timeLeft = Math.max(0, (cur.timeLeft ?? scratch.timeLeft) - 1);
    Store.setScratch(item.id, cur);
    timerEl.textContent = fmtTime(cur.timeLeft);
    timerEl.className = 'timer' + (cur.timeLeft < 60 ? ' danger' : cur.timeLeft < 300 ? ' warn' : '');
    if (cur.timeLeft <= 0) { clearInterval(timerInterval); cur.running = false; Store.setScratch(item.id, cur); toggleBtn.textContent = 'Start'; toast('Time up — how would you wrap up in 30 seconds?'); }
  }
  if (scratch.running) timerInterval = setInterval(tick, 1000);
  toggleBtn.addEventListener('click', () => {
    const cur = Store.getScratch(item.id) || scratch;
    cur.running = !cur.running;
    Store.setScratch(item.id, cur);
    toggleBtn.textContent = cur.running ? 'Pause' : 'Start';
    if (cur.running) timerInterval = setInterval(tick, 1000);
    else clearInterval(timerInterval);
  });
  el.querySelector('#timer-reset').addEventListener('click', () => {
    clearInterval(timerInterval);
    const cur = { checked: scratch.checked, rubric: scratch.rubric, revealed: scratch.revealed, timeLeft: (item.timerMinutes || 45) * 60, running: false };
    Store.setScratch(item.id, cur);
    timerEl.textContent = fmtTime(cur.timeLeft);
    timerEl.className = 'timer';
    toggleBtn.textContent = 'Start';
  });
  el.querySelector('#mark-complete').addEventListener('click', () => {
    try {
      const res = rate(item.id, 'good');
      toast(`Marked complete — next review ${res.due}.`);
    } catch (err) {
      // A failed write is not a completion (FR-024): no success toast — the persistent storage
      // banner is the notice.
    }
  });
}

export function renderDesign(el, { snapshot, param }) {
  if (!param) { renderList(el, snapshot); return; }
  const item = snapshot.byId[param];
  if (!item) { el.innerHTML = `<div class="empty-state">Scenario not found.</div>`; return; }
  renderDetail(el, snapshot, item);
}
