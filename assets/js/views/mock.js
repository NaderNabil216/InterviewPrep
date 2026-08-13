import { Store } from '../store.js';
import { navigate, toast } from '../app.js';
import { renderMarkdown, renderCodeBlock, renderInline } from '../md.js';
import { rate } from '../srs.js';

const MODES = {
  android: { label: 'Android screen', minutes: 45, desc: 'Mixed Kotlin/Coroutines/Compose/Platform/Architecture questions, random level mix.', pool: it => ['kotlin','coroutines-flow','compose','platform','architecture','data-networking','performance','build','testing','security','kmp','modern'].includes(it.track) && it.type !== 'dsa' && it.type !== 'design' },
  design: { label: 'System design', minutes: 45, desc: 'One realistic mobile system design scenario, full time on the clock.', pool: it => it.type === 'design' && !it.isFramework, single: true },
  coding: { label: 'Coding', minutes: 45, desc: 'Timed DSA problems with progressively gated hints — resist peeking early.', pool: it => it.type === 'dsa' },
  full: { label: 'Full loop', minutes: 135, desc: 'Android screen → System design → Coding, back to back, like the real day.', composite: ['android', 'design', 'coding'] },
};

const RATE_SCORE = { again: 1, hard: 2, good: 3, easy: 4 };

function sparkline(results) {
  if (!results.length) return '<span class="faint">No attempts yet</span>';
  const scores = results.slice(0, 10).reverse().map(r => r.avgScore);
  const max = 4;
  return `<div class="row" style="gap:3px; align-items:flex-end; height:36px;">
    ${scores.map(s => `<div style="width:8px;background:var(--accent);border-radius:2px;height:${Math.max(4, (s/max)*36)}px;" title="${s.toFixed(1)}"></div>`).join('')}
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
          <thead><tr class="faint"><td>Mode</td><td>Score</td><td>Items</td><td>Date</td></tr></thead>
          <tbody>
            ${results.slice(0,8).map(r => `<tr><td>${MODES[r.mode]?.label || r.mode}</td><td>${r.avgScore.toFixed(1)}/4</td><td>${r.itemCount}</td><td class="faint">${new Date(r.date).toLocaleDateString()}</td></tr>`).join('')}
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
    el.innerHTML = `<div class="empty-state">No items available for this mode yet.</div>`;
    return;
  }

  let idx = 0, revealed = false, timeLeft = mode.minutes * 60;
  const ratings = [];
  const timerHandle = setInterval(() => {
    timeLeft--;
    const t = el.querySelector('#session-timer');
    if (t) { t.textContent = fmtTime(Math.max(0, timeLeft)); t.className = 'timer' + (timeLeft < 60 ? ' danger' : timeLeft < 300 ? ' warn' : ''); }
    if (timeLeft <= 0) { clearInterval(timerHandle); toast("Time's up — wrap up your last answer."); }
  }, 1000);

  function draw() {
    if (idx >= items.length) {
      clearInterval(timerHandle);
      const avg = ratings.length ? ratings.reduce((a,b) => a+b, 0) / ratings.length : 0;
      Store.addMockResult({ mode: modeKey, avgScore: avg, itemCount: items.length, date: new Date().toISOString() });
      el.innerHTML = `
        <div class="empty-state">
          <h2>${mode.label} complete</h2>
          <p>Average self-score: <strong>${avg.toFixed(1)} / 4</strong> across ${items.length} items.</p>
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
        <div class="item-view__q" style="margin-top:8px;">${renderInline(item.q)}</div>
        ${item.prompt ? `<div class="answer-body" style="margin-top:10px;">${renderMarkdown(item.prompt)}</div>` : ''}
        <div id="reveal-body" style="display:none; margin-top:16px;">
          ${item.shortAnswer?.length ? `<ul class="short-answer">${item.shortAnswer.map(s=>`<li>${renderInline(s)}</li>`).join('')}</ul>` : ''}
          <div class="answer-body">${renderMarkdown(item.answer || item.referenceAnswer || '')}</div>
          ${(item.code||[]).slice(0,1).map(renderCodeBlock).join('')}
        </div>
        <div class="btn-row" style="margin-top:14px;">
          <button class="btn" id="reveal-btn">Reveal model answer</button>
        </div>
        <div class="rate-row" id="rate-row" style="display:none;">
          <button class="rate-btn" data-rate="again">Weak</button>
          <button class="rate-btn" data-rate="hard">Shaky</button>
          <button class="rate-btn" data-rate="good">Solid</button>
          <button class="rate-btn" data-rate="easy">Nailed it</button>
        </div>
      </div>
    `;
    el.querySelector('#reveal-btn').addEventListener('click', () => {
      revealed = true;
      el.querySelector('#reveal-body').style.display = 'block';
      el.querySelector('#rate-row').style.display = 'flex';
      el.querySelector('#reveal-btn').style.display = 'none';
    });
    el.querySelectorAll('.rate-btn').forEach(b => b.addEventListener('click', () => {
      ratings.push(RATE_SCORE[b.dataset.rate]);
      rate(item.id, b.dataset.rate);
      idx++;
      draw();
    }));
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
