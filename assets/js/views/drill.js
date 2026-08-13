import { navigate } from '../app.js';
import { toast } from '../app.js';
import { buildQueue, rate } from '../srs.js';
import { renderMarkdown, renderCodeBlock, renderInline } from '../md.js';

export function renderDrill(el, { snapshot, param }) {
  let items;
  if (param) {
    const ids = param.split(',');
    items = ids.map(id => snapshot.byId[id]).filter(Boolean);
  } else {
    items = buildQueue(snapshot.items.filter(it => it.type !== 'dsa' && it.type !== 'design'), 40);
  }

  if (!items.length) {
    el.innerHTML = `
      <div class="empty-state">
        <h2>Nothing to drill right now 🎉</h2>
        <p>Either everything is fresh (no reviews due yet) or you haven't read anything yet.</p>
        <button class="btn btn--primary" data-nav="topics">Browse topics →</button>
      </div>`;
    el.querySelector('[data-nav]').addEventListener('click', () => navigate('topics'));
    return;
  }

  let i = 0;
  let flipped = false;
  const results = { again: 0, hard: 0, good: 0, easy: 0 };
  const startedAt = Date.now();
  let tickHandle = null;

  function fmt(ms) {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  function draw() {
    if (i >= items.length) {
      clearInterval(tickHandle);
      el.innerHTML = `
        <div class="empty-state">
          <h2>Drill complete</h2>
          <p>${items.length} cards reviewed in ${fmt(Date.now() - startedAt)} — Again ${results.again} · Hard ${results.hard} · Good ${results.good} · Easy ${results.easy}</p>
          <p class="faint">${Math.round((Date.now() - startedAt) / 1000 / items.length)}s per card</p>
          <div class="btn-row" style="justify-content:center;">
            <button class="btn btn--primary" id="drill-again">Drill again</button>
            <button class="btn" data-nav="dashboard">Back to dashboard</button>
          </div>
        </div>`;
      el.querySelector('#drill-again').addEventListener('click', () => renderDrill(el, { snapshot, param }));
      el.querySelector('[data-nav]').addEventListener('click', () => navigate('dashboard'));
      return;
    }
    const item = items[i];
    flipped = false;
    el.innerHTML = `
      <div class="drill-progress">
        <div class="progress-bar" style="flex:1;"><div class="progress-bar__fill" style="width:${(i / items.length) * 100}%"></div></div>
        <span class="faint">${i + 1} / ${items.length}</span>
        <span class="faint" id="drill-clock" title="Elapsed this session">${fmt(Date.now() - startedAt)}</span>
      </div>

      <div class="card drill-card" id="drill-card" style="cursor:pointer;">
        <div class="faint">${item.track} · ${item.topic}</div>
        <div class="item-view__q" style="margin-top:8px;">${renderInline(item.q)}</div>
        <div id="drill-answer" style="display:none; margin-top:16px;">
          ${item.shortAnswer?.length ? `<ul class="short-answer">${item.shortAnswer.map(s => `<li>${renderInline(s)}</li>`).join('')}</ul>` : ''}
          <div class="answer-body">${renderMarkdown(item.answer || '')}</div>
          ${(item.code || []).slice(0, 1).map(renderCodeBlock).join('')}
        </div>
      </div>
      <div class="flip-hint" id="flip-hint">Click the card or press <span class="kbd">Space</span> to reveal the answer</div>

      <div class="rate-row" id="rate-row" style="display:none;">
        <button class="rate-btn" data-rate="again">Again</button>
        <button class="rate-btn" data-rate="hard">Hard</button>
        <button class="rate-btn" data-rate="good">Good</button>
        <button class="rate-btn" data-rate="easy">Easy</button>
      </div>
    `;

    function reveal() {
      flipped = true;
      el.querySelector('#drill-answer').style.display = 'block';
      el.querySelector('#rate-row').style.display = 'flex';
      el.querySelector('#flip-hint').textContent = 'Rate yourself honestly — it drives when this comes back.';
    }
    el.querySelector('#drill-card').addEventListener('click', () => { if (!flipped) reveal(); });
    el.querySelectorAll('.rate-btn').forEach(b => b.addEventListener('click', (e) => {
      e.stopPropagation();
      rate(item.id, b.dataset.rate);
      results[b.dataset.rate]++;
      i++;
      draw();
    }));

    function spaceHandler(e) {
      if (e.code === 'Space' && !flipped) { e.preventDefault(); reveal(); }
    }
    document.addEventListener('keydown', spaceHandler);

    clearInterval(tickHandle);
    tickHandle = setInterval(() => {
      const clock = el.querySelector('#drill-clock');
      if (clock) clock.textContent = fmt(Date.now() - startedAt);
      else clearInterval(tickHandle);
    }, 1000);

    el._cleanup = () => {
      document.removeEventListener('keydown', spaceHandler);
      clearInterval(tickHandle);
    };
  }

  draw();
}
