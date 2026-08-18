import { navigate, toast, App } from '../app.js';
import { buildQueue, rate } from '../srs.js';
import { renderMarkdown, renderCodeBlock, renderInline, renderSentences } from '../md.js';
import { SECTION_LABEL, isLabelled } from '../sections.js';

export function renderDrill(el, { snapshot, param }) {
  let items;
  if (param) {
    const ids = param.split(',');
    items = ids.map(id => snapshot.byId[id]).filter(Boolean);
  } else {
    items = buildQueue(snapshot.items.filter(it => it.type !== 'dsa' && it.type !== 'design'), 40);
  }

  if (!items.length) {
    App.sessionActive = false;
    el.innerHTML = `
      <div class="empty-state">
        <h2>Nothing to drill right now 🎉</h2>
        <p>Either everything is fresh (no reviews due yet) or you haven't read anything yet.</p>
        <button class="btn btn--primary" data-nav="topics">Browse topics →</button>
      </div>`;
    el.querySelector('[data-nav]').addEventListener('click', () => navigate('topics'));
    return;
  }
  App.sessionActive = true;

  let i = 0;
  let flipped = false;
  let completed = 0;
  const startedAt = Date.now();
  // US5: the clock freezes while an answer is revealed. pausedMs accumulates the total revealed
  // time across the whole session; revealedAt marks when the current reveal began. Both live for
  // the whole session — never reset per question.
  let pausedMs = 0;
  let revealedAt = null;
  let tickHandle = null;

  function fmt(ms) {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  function elapsed() {
    return Date.now() - startedAt - pausedMs;
  }

  function draw() {
    if (i >= items.length) {
      clearInterval(tickHandle);
      App.sessionActive = false;
      el.innerHTML = `
        <div class="empty-state">
          <h2>Drill complete</h2>
          <p>${completed} cards reviewed in ${fmt(elapsed())}</p>
          <p class="faint">${Math.round(elapsed() / 1000 / items.length)}s per card</p>
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
        <span class="faint" id="drill-clock" title="Elapsed this session">${fmt(elapsed())}</span>
      </div>

      <div class="card drill-card" id="drill-card" style="cursor:pointer;">
        <div class="faint">${item.track} · ${item.topic}</div>
        ${isLabelled(item) && item.q ? `<h4 class="section-label">${SECTION_LABEL.question}</h4>` : ''}
        <div class="item-view__q" style="margin-top:8px;">${renderSentences(item.q)}</div>
        <div id="drill-answer" style="display:none; margin-top:16px;">
          ${isLabelled(item) && item.shortAnswer?.length ? `<h4 class="section-label">${SECTION_LABEL.shortAnswer}</h4>` : ''}
          ${item.shortAnswer?.length ? `<ul class="short-answer">${item.shortAnswer.map(s => `<li>${renderInline(s)}</li>`).join('')}</ul>` : ''}
          ${isLabelled(item) && item.answer ? `<h4 class="section-label">${SECTION_LABEL.answer}</h4>` : ''}
          <div class="answer-body">${renderMarkdown(item.answer || '')}</div>
          ${(item.code || []).slice(0, 1).map(block => (isLabelled(item)
            ? `<h4 class="section-label">${SECTION_LABEL.code}</h4>`
            : '') + renderCodeBlock(block)).join('')}
        </div>
      </div>
      <div class="flip-hint" id="flip-hint">Click the card or press <span class="kbd">Space</span> to reveal the answer</div>

      <div class="rate-row" id="rate-row" style="display:none;">
        <button class="rate-btn rate-btn--complete" id="mark-complete">Mark complete</button>
        <button class="rate-btn" id="skip">Skip</button>
      </div>
    `;

    function reveal() {
      flipped = true;
      // Freeze the session clock the instant the answer is revealed (US5).
      clearInterval(tickHandle);
      revealedAt = Date.now();
      el.querySelector('#drill-answer').style.display = 'block';
      el.querySelector('#rate-row').style.display = 'flex';
      el.querySelector('#flip-hint').textContent = 'Mark complete when you have said it out loud — it drives when this comes back. Skip leaves it for later.';
    }
    el.querySelector('#drill-card').addEventListener('click', () => { if (!flipped) reveal(); });
    el.querySelector('#mark-complete').addEventListener('click', (e) => {
      e.stopPropagation();
      rate(item.id, 'good');
      if (revealedAt) {
        pausedMs += Date.now() - revealedAt;
        revealedAt = null;
      }
      completed++;
      i++;
      draw();
    });
    el.querySelector('#skip').addEventListener('click', (e) => {
      e.stopPropagation();
      // No rating — the card stays unseen for spaced repetition. The reveal still froze the
      // clock, so absorb that paused time exactly like Mark complete does.
      if (revealedAt) {
        pausedMs += Date.now() - revealedAt;
        revealedAt = null;
      }
      i++;
      draw();
    });

    function spaceHandler(e) {
      if (e.code === 'Space' && !flipped) { e.preventDefault(); reveal(); }
    }
    document.addEventListener('keydown', spaceHandler);

    // Restart the tick each question so the clock resumes from its frozen value with no jump.
    clearInterval(tickHandle);
    tickHandle = setInterval(() => {
      const clock = el.querySelector('#drill-clock');
      if (clock) clock.textContent = fmt(elapsed());
      else clearInterval(tickHandle);
    }, 1000);

    el._cleanup = () => {
      document.removeEventListener('keydown', spaceHandler);
      clearInterval(tickHandle);
    };
  }

  draw();
}
