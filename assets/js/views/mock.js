import { Store } from '../store.js';
import { navigate, toast, App } from '../app.js';
import { renderMarkdown, renderCodeBlock, renderInline, renderSentences } from '../md.js';
import { rate } from '../srs.js';
import { SECTION_LABEL, isLabelled } from '../sections.js';

const MODES = {
  android: { label: 'Android screen', minutes: 45, desc: 'Mixed Kotlin/Coroutines/Compose/Platform/Architecture questions, random level mix.', pool: it => ['kotlin','coroutines-flow','compose','platform','architecture','data-networking','performance','build','testing','security','kmp','modern'].includes(it.track) && it.type !== 'dsa' && it.type !== 'design' },
  design: { label: 'System design', minutes: 45, desc: 'One realistic mobile system design scenario, full time on the clock.', pool: it => it.type === 'design' && !it.isFramework, single: true },
  coding: { label: 'Coding', minutes: 45, desc: 'Timed DSA problems with progressively gated hints — resist peeking early.', pool: it => it.type === 'dsa' },
  full: { label: 'Full loop', minutes: 135, desc: 'Android screen → System design → Coding, back to back, like the real day.', composite: ['android', 'design', 'coding'] },
};

// Per-item score metric retired with the 4-button rate row (US4): every rating is a fixed 'good',
// so the session metric is now completedCount/completedPct. Legacy rows still carry avgScore and are
// displayed read-only via a fallback (FR-014b) — never back-filled.

function sparkline(results) {
  if (!results.length) return '<span class="faint">No attempts yet</span>';
  const rows = results.slice(0, 10).reverse();
  return `<div class="row" style="gap:3px; align-items:flex-end; height:36px;">
    ${rows.map(r => {
      const isNew = typeof r.completedPct === 'number';
      // New rows are 0..1 completion; legacy rows are avgScore 1..4 — normalized to the same 0..1
      // bar scale so a mixed history renders comparably.
      const val = isNew ? Math.max(0, Math.min(1, r.completedPct)) : Math.max(0, Math.min(1, (r.avgScore || 0) / 4));
      const label = isNew ? `${Math.round(r.completedPct * 100)}% complete` : `avg self-score ${(r.avgScore || 0).toFixed(1)}/4`;
      return `<div style="width:8px;background:var(--accent);border-radius:2px;height:${Math.max(4, val * 36)}px;" title="${label}"></div>`;
    }).join('')}
  </div>`;
}

function renderLanding(el, snapshot) {
  const results = Store.getMockResults();
  el.innerHTML = `
    <div class="eyebrow">Mock Interview</div>
    <h1>Pick a mode</h1>
    <p class="muted">Timed, self-scored practice. Results are saved so you can watch the trend.</p>

    <div class="grid grid-2" style="margin-top:16px;">
      ${Object.entries(MODES).map(([key, m]) => `
        <div class="card card--interactive" data-mode="${key}">
          <div class="eyebrow">${m.minutes} min</div>
          <h2 style="margin-top:4px;">${m.label}</h2>
          <p class="faint">${m.desc}</p>
        </div>
      `).join('')}
    </div>

    <div class="card" style="margin-top:20px;">
      <h3>Recent results</h3>
      ${results.length ? `
        <div class="row" style="justify-content:space-between; margin-bottom:8px;">
          <span class="faint">Last ${Math.min(10, results.length)} attempts</span>
          ${sparkline(results)}
        </div>
        <table style="width:100%; font-size:13px; border-collapse:collapse;">
          <thead><tr class="faint"><td>Mode</td><td>Result</td><td>Items</td><td>Date</td></tr></thead>
          <tbody>
            ${results.slice(0,8).map(r => {
              const isNew = typeof r.completedPct === 'number';
              const result = isNew
                ? `${r.completedCount}/${r.itemCount} complete`
                : `${(r.avgScore || 0).toFixed(1)}/4 avg score`;
              return `<tr><td>${MODES[r.mode]?.label || r.mode}</td><td>${result}</td><td>${r.itemCount}</td><td class="faint">${new Date(r.date).toLocaleDateString()}</td></tr>`;
            }).join('')}
          </tbody>
        </table>` : '<p class="faint">No mock interviews taken yet.</p>'}
    </div>
  `;
  el.querySelectorAll('[data-mode]').forEach(c => c.addEventListener('click', () => navigate('mock', c.dataset.mode)));
}

function pickRandom(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i+1)); [copy[i],copy[j]] = [copy[j],copy[i]]; }
  return copy.slice(0, n);
}

function fmtTime(sec) { const m = Math.floor(sec/60), s = sec%60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }

function runSession(el, snapshot, modeKey, itemCount) {
  const mode = MODES[modeKey];
  let items;
  if (mode.single) {
    items = pickRandom(snapshot.items.filter(mode.pool), 1);
  } else {
    items = pickRandom(snapshot.items.filter(mode.pool), itemCount || (modeKey === 'coding' ? 3 : 12));
  }
  if (!items.length) {
    App.sessionActive = false;
    el.innerHTML = `<div class="empty-state">No items available for this mode yet.</div>`;
    return;
  }
  App.sessionActive = true;

  let idx = 0, revealed = false, timeLeft = mode.minutes * 60;
  let completedCount = 0;
  // US5: the interval keeps running, but the per-second decrement is skipped while an answer is
  // revealed — so timeLeft (the overall session budget, FR-017) is provably untouched by how long
  // the candidate leaves a model answer open.
  const timerHandle = setInterval(() => {
    if (!revealed) timeLeft--;
    const t = el.querySelector('#session-timer');
    if (t) { t.textContent = fmtTime(Math.max(0, timeLeft)); t.className = 'timer' + (timeLeft < 60 ? ' danger' : timeLeft < 300 ? ' warn' : ''); }
    if (timeLeft <= 0) { clearInterval(timerHandle); toast("Time's up — wrap up your last answer."); }
  }, 1000);

  function draw() {
    if (idx >= items.length) {
      clearInterval(timerHandle);
      App.sessionActive = false;
      Store.addMockResult({
        mode: modeKey,
        completedCount,
        completedPct: completedCount / items.length,
        itemCount: items.length,
        date: new Date().toISOString(),
      });
      el.innerHTML = `
        <div class="empty-state">
          <h2>${mode.label} complete</h2>
          <p>${completedCount} of ${items.length} items marked complete.</p>
          <div class="btn-row" style="justify-content:center;">
            <button class="btn btn--primary" data-nav="mock">Back to mock modes</button>
          </div>
        </div>`;
      el.querySelector('[data-nav]').addEventListener('click', () => navigate('mock'));
      return;
    }
    const item = items[idx];
    revealed = false;
    el.innerHTML = `
      <div class="row" style="justify-content:space-between; margin-bottom:14px;">
        <div class="eyebrow">${mode.label} · item ${idx+1}/${items.length}</div>
        <div class="timer" id="session-timer">${fmtTime(Math.max(0,timeLeft))}</div>
      </div>
      <div class="card">
        <div class="faint">${item.track} · ${item.topic}</div>
        ${isLabelled(item) && item.q ? `<h4 class="section-label">${SECTION_LABEL.question}</h4>` : ''}
        <div class="item-view__q" style="margin-top:8px;">${renderSentences(item.q)}</div>
        ${item.prompt ? `<div class="answer-body" style="margin-top:10px;">${renderMarkdown(item.prompt, { splitSentences: true })}</div>` : ''}
        <div id="reveal-body" style="display:none; margin-top:16px;">
          ${isLabelled(item) && item.shortAnswer?.length ? `<h4 class="section-label">${SECTION_LABEL.shortAnswer}</h4>` : ''}
          ${item.shortAnswer?.length ? `<ul class="short-answer">${item.shortAnswer.map(s=>`<li>${renderInline(s)}</li>`).join('')}</ul>` : ''}
          ${isLabelled(item) && item.answer ? `<h4 class="section-label">${SECTION_LABEL.answer}</h4>` : ''}
          <div class="answer-body">${renderMarkdown(item.answer || item.referenceAnswer || '')}</div>
          ${(item.code||[]).slice(0,1).map(block => (isLabelled(item)
            ? `<h4 class="section-label">${SECTION_LABEL.code}</h4>`
            : '') + renderCodeBlock(block)).join('')}
        </div>
        <div class="btn-row" style="margin-top:14px;">
          <button class="btn" id="reveal-btn">Reveal model answer</button>
        </div>
        <div class="rate-row" id="rate-row" style="display:none;">
          <button class="rate-btn rate-btn--complete" id="mark-complete">Mark complete</button>
          <button class="rate-btn" id="skip">Skip</button>
        </div>
      </div>
    `;
    el.querySelector('#reveal-btn').addEventListener('click', () => {
      revealed = true;
      el.querySelector('#reveal-body').style.display = 'block';
      el.querySelector('#rate-row').style.display = 'flex';
      el.querySelector('#reveal-btn').style.display = 'none';
    });
    el.querySelector('#mark-complete').addEventListener('click', () => {
      try {
        rate(item.id, 'good');
      } catch (err) {
        // A failed write is not a completion (FR-024): no counter, no advance — the storage
        // banner raised by store.js is the notice.
        return;
      }
      completedCount++;
      idx++;
      draw();
    });
    el.querySelector('#skip').addEventListener('click', () => {
      // No rating, not counted as completed — just move on.
      idx++;
      draw();
    });
  }
  draw();
}

export function renderMock(el, { snapshot, param }) {
  if (!param) { renderLanding(el, snapshot); return; }
  if (param === 'full') {
    // Full loop: run android → design → coding sequentially, chaining via confirm at each boundary.
    const stages = MODES.full.composite;
    let stageIdx = 0;
    function nextStage() {
      if (stageIdx >= stages.length) { navigate('mock'); return; }
      const stageKey = stages[stageIdx];
      toast(`Starting stage ${stageIdx+1}/3: ${MODES[stageKey].label}`);
      runSessionWrapped(stageKey);
    }
    function runSessionWrapped(stageKey) {
      const wrapperDone = () => { stageIdx++; nextStage(); };
      // Reuse runSession but intercept completion by wrapping draw's terminal state via a MutationObserver-free approach:
      // simplest: run the normal session; when it finishes it renders its own summary. We add a "continue" button.
      runSession(el, snapshot, stageKey);
      const observer = new MutationObserver(() => {
        const btn = el.querySelector('[data-nav="mock"]');
        if (btn && stageIdx < stages.length - 1) {
          btn.textContent = `Continue to stage ${stageIdx+2}/3 →`;
          btn.onclick = (e) => { e.preventDefault(); observer.disconnect(); wrapperDone(); };
        }
      });
      observer.observe(el, { childList: true, subtree: true });
    }
    nextStage();
    return;
  }
  runSession(el, snapshot, param);
}
