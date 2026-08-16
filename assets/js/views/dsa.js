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

function esc(s) {
  return (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function renderDetail(el, snapshot, item) {
  const scratch = Store.getScratch(item.id) || { code: item.starter || '', revealed: false };
  const runnable = !!(item.sampleCall && item.sampleCall.trim());

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
          <div class="row" style="justify-content:space-between;">
            <h3 style="margin:0;">Your Kotlin scratchpad</h3>
            <button class="btn" id="run-btn" ${runnable ? '' : 'disabled title="No runnable sample case for this problem"'}>▶ Run</button>
          </div>
          <textarea class="scratchpad code-editor" id="scratchpad" spellcheck="false">${scratch.code}</textarea>
          <p class="faint" style="margin-top:8px;">Saved automatically to this browser. Press Run to execute it against the sample case on Judge0 CE.</p>
        </div>
        <div class="run-result run-result--idle" id="run-result">${runnable ? 'No run yet — press Run to execute your code on the sample case.' : 'This problem has no runnable sample case.'}</div>
        <div class="rate-row">
          <button class="rate-btn rate-btn--complete" id="mark-complete">Mark complete</button>
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
  el.querySelector('#mark-complete').addEventListener('click', () => {
    const res = rate(item.id, 'good');
    toast(`Marked complete — next review ${res.due}.`);
  });

  // ---- Run (Judge0 CE via RapidAPI, US6) ----
  const runBtn = el.querySelector('#run-btn');
  // FR-020a: one in-flight request per view instance, but pressing Run again while a request is
  // pending aborts the prior one cleanly (never both results racing to display). A fresh
  // AbortController + timeout per request, and a sequence guard so only the newest run can render.
  let controller = null;
  let runSeq = 0;

  function setRun(css, html) {
    const box = el.querySelector('#run-result');
    if (!box) return; // view swapped mid-flight
    box.className = 'run-result run-result--' + css;
    box.innerHTML = html;
  }

  if (!runnable) return; // Run disabled from the markup; never issue a request

  runBtn.addEventListener('click', () => {
    const key = (Store.getSettings().judge0ApiKey || '').trim();
    if (!key) {
      setRun('needs-key', 'No code runner key. Add a Judge0 CE key in <a href="#/settings">Settings</a> to run code here.');
      return;
    }
    // Supersede the prior in-flight request (FR-020a): its handlers are sequence-guarded below, so
    // it can never paint over the new run's result.
    const seq = ++runSeq;
    if (controller) controller.abort();
    const ctl = new AbortController();
    controller = ctl;
    const timeout = setTimeout(() => ctl.abort(), 30000); // FR-020c: fixed 30s bound
    // The key only ever travels in request headers — never into the DOM, the panel, or console.
    const source = el.querySelector('#scratchpad').value
      + '\n\nfun main() {\n    val result = ' + item.sampleCall + '\n    println(result)\n}\n';
    setRun('pending', 'Running your code against the sample case…');
    runBtn.textContent = '▶ Running…';
    fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': key,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
      body: JSON.stringify({ language_id: 111, source_code: source }),
      signal: ctl.signal,
    })
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(res => {
        clearTimeout(timeout);
        if (seq !== runSeq) return; // superseded by a newer run — the panel belongs to that one
        runBtn.textContent = '▶ Run';
        const statusId = res.status && res.status.id;
        if (statusId === 3) {
          setRun('output', `<pre class="run-output">${esc(res.stdout)}</pre>`);
        } else if (statusId === 6) {
          setRun('compile-error', `<strong>Compilation failed</strong><pre class="run-output">${esc(res.compile_output)}</pre>`);
        } else {
          const desc = (res.status && (res.status.id + ' ' + res.status.description)) || 'unknown error';
          setRun('runtime-error', `<strong>Run failed — ${esc(desc)}</strong>${res.stderr ? `<pre class="run-output">${esc(res.stderr)}</pre>` : ''}`);
        }
      })
      .catch(err => {
        clearTimeout(timeout);
        if (seq !== runSeq) return; // superseded — never render a stale failure
        runBtn.textContent = '▶ Run';
        setRun('needs-connection', err.name === 'AbortError'
          ? 'The runner timed out after 30 seconds. Check your connection and try again.'
          : "Couldn't reach the runner. Check your connection and try again.");
      });
  });
}

export function renderDsa(el, { snapshot, param, query }) {
  if (!param) { renderList(el, snapshot, query); return; }
  const item = snapshot.byId[param];
  if (!item) { el.innerHTML = `<div class="empty-state">Problem not found.</div>`; return; }
  renderDetail(el, snapshot, item);
}
