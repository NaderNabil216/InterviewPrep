import { Store } from '../store.js';
import { navigate } from '../app.js';
import { renderInline } from '../md.js';
import { isDrillable, dueCountOf, coverageByTrack, coverageTotals, notCompleted, weakestTracks } from '../progress.js';

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date(); now.setHours(0,0,0,0);
  return Math.round((target - now) / 86400000);
}

function planTasksForToday(snapshot) {
  const planState = Store.getPlanState();
  // Free study has no day-by-day schedule; the dashboard shows the free-study card instead.
  if ((planState.mode || 'free') === 'free') return { day: null, tasks: [] };
  const plan = snapshot.plans[planState.activePlan];
  if (!plan) return { day: null, tasks: [] };
  let dayIndex = 0;
  if (planState.startedAt) {
    const started = new Date(planState.startedAt + 'T00:00:00');
    const now = new Date(); now.setHours(0,0,0,0);
    dayIndex = Math.max(0, Math.round((now - started) / 86400000));
  }
  dayIndex = Math.min(dayIndex, plan.days.length - 1);
  return { day: plan.days[dayIndex], dayIndex, plan };
}

export function renderDashboard(el, { snapshot }) {
  const session = Store.getSession();
  const settings = Store.getSettings();
  const progress = Store.getProgress();
  // Shell-phase marker: on a cold cache the snapshot has no items yet, but the view must not
  // present that as a real "you've done nothing" zero. Gate on the marker, not on each value, so a
  // genuine zero still renders as 0 once content is loaded.
  const shellPhase = snapshot.items.length === 0;
  const totalItems = shellPhase ? null : snapshot.items.length;
  // Coverage totals over the library, never over progress keys — a record for a retired question
  // is not counted (FR-012). completed + notStarted === total, self-checking (FR-016).
  const totals = shellPhase ? null : coverageTotals(snapshot.items, progress);
  // The review-queue figure is scoped to what the drill actually offers: the 550 drillable
  // questions, never the 629-item library (FR-010, SC-013).
  const due = shellPhase ? null : dueCountOf(snapshot.items.filter(isDrillable), progress);
  const coverage = shellPhase ? {} : coverageByTrack(snapshot.items, progress);
  const days = daysUntil(settings.interviewDate);
  const { day, plan } = planTasksForToday(snapshot);

  // Free study still gets a "today" surface — never an empty or broken slot (FR-012).
  const freeMode = (Store.getPlanState().mode || 'free') === 'free';
  const notDone = shellPhase ? [] : notCompleted(snapshot.items, progress);
  // The shared ranking: pct ascending, then total descending, then name — deterministic even on
  // an all-zero fresh history, and identical to the plan's (US4). "Next up" draws from
  // not-completed material only, so a fully completed track contributes nothing (US4 #4).
  const weakTracks = shellPhase ? [] : weakestTracks(coverage, 3);
  const nextUp = weakTracks
    .flatMap(track => notDone.filter(i => i.track === track).slice(0, 2))
    .slice(0, 5);

  const lastItem = session.lastItemId ? snapshot.byId[session.lastItemId] : null;

  el.innerHTML = `
    <div class="hero">
      <div>
        <div class="eyebrow">Dashboard</div>
        <h1>Welcome back</h1>
        <p class="muted">Snapshot v${snapshot.version} · ${totalItems ?? '—'} questions · ${totals ? totals.completed : '—'} completed · ${totals ? totals.notStarted : '—'} not started</p>
      </div>
      ${days !== null ? `
        <div class="countdown">
          <div class="eyebrow">Interview in</div>
          <div class="countdown__num">${days >= 0 ? days : 0}</div>
          <div class="faint">${days >= 0 ? 'day' + (days === 1 ? '' : 's') : 'date has passed — update it in Settings'}</div>
        </div>` : `
        <button class="btn" data-nav="settings">Set interview date →</button>`}
    </div>

    <div class="grid grid-2" style="margin-bottom:16px;">
      <div class="card resume-card card--interactive" id="resume-card">
        <div class="eyebrow">Resume</div>
        ${lastItem ? `
          <h2 style="margin-top:6px;">${renderInline(lastItem.q)}</h2>
          <p class="faint">${lastItem.track} · ${lastItem.topic}</p>
          <button class="btn btn--primary" style="margin-top:10px;">Continue reading →</button>
        ` : `
          <h2 style="margin-top:6px;">Start your first item</h2>
          <p class="faint">Jump into the guided plan or browse topics.</p>
          <button class="btn btn--primary" style="margin-top:10px;" data-nav="plan">Open study plan →</button>
        `}
      </div>

      <div class="card">
        <div class="eyebrow">Review queue</div>
        <h2 style="margin-top:6px;">${due === null ? '—' : due} due for review</h2>
        <p class="faint">${due === null ? 'Loading your review queue…' : due > 0 ? 'Completed questions ready to come back. DSA and System Design have their own workspaces and are not counted here.' : 'Nothing due right now — keep reading new material.'}</p>
        <button class="btn ${due && due > 0 ? 'btn--primary' : ''}" id="go-drill" style="margin-top:10px;">Start drill →</button>
      </div>
    </div>

    ${day ? `
    <div class="card" style="margin-bottom:16px;">
      <div class="row" style="justify-content:space-between;">
        <div>
          <div class="eyebrow">Today's plan · ${plan.title}</div>
          <h2 style="margin-top:6px;">${day.title}</h2>
        </div>
        <button class="btn" data-nav="plan">View full plan →</button>
      </div>
      <ul style="margin-top:10px;">
        ${day.tasks.map(t => `<li>${renderInline(t.label)}</li>`).join('')}
      </ul>
    </div>` : ''}

    ${freeMode ? `
    <div class="card free-today" style="margin-bottom:16px;">
      <div class="row" style="justify-content:space-between;">
        <div>
          <div class="eyebrow">Today · Free study</div>
          <h2 style="margin-top:6px;">${due === null ? '—' : due} due for review · ${totals ? totals.notStarted : '—'} of ${totalItems ?? '—'} not started</h2>
          <p class="faint">Due counts your review queue — DSA and System Design have their own workspaces and are not in it. Not started counts the whole library.</p>
        </div>
        <button class="btn" data-nav="plan">Change mode →</button>
      </div>
      ${nextUp.length ? `
        <div class="stack" style="margin-top:10px;">
          ${nextUp.map(i => `
            <div class="item-row" data-item="${i.id}">
              <span class="item-row__q">${renderInline(i.q)}</span>
              <span class="faint">${i.track}</span>
            </div>`).join('')}
        </div>` : shellPhase ? '<p class="faint" style="margin-top:10px;">Loading your library…</p>' : '<p class="faint" style="margin-top:10px;">You have completed every question — drill what is due.</p>'}
    </div>` : ''}

    <div class="card">
      <div class="eyebrow">Coverage by track</div>
      <div style="margin-top:12px;">
        ${shellPhase ? '<p class="faint">Loading track coverage…</p>' : Object.entries(coverage).sort((a,b) => b[1].total - a[1].total).filter(([, m]) => m.total > 0).map(([track, m]) => {
          const label = (snapshot.packMeta.find(p => p.track === track) || {}).title || track;
          return `
          <div class="coverage-row">
            <span>${label}</span>
            <div class="progress-bar"><div class="progress-bar__fill" style="width:${m.pct}%"></div></div>
            <span class="faint">${m.completed}/${m.total} · ${m.pct}%</span>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;

  el.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => navigate(b.dataset.nav)));
  const resumeCard = el.querySelector('#resume-card');
  if (resumeCard) resumeCard.addEventListener('click', (e) => {
    if (e.target.closest('[data-nav]')) return;
    navigate(lastItem ? 'item' : 'plan', lastItem ? lastItem.id : null);
  });
  const goDrill = el.querySelector('#go-drill');
  if (goDrill) goDrill.addEventListener('click', () => navigate('drill'));
  el.querySelectorAll('[data-item]').forEach(r =>
    r.addEventListener('click', () => navigate('item', r.dataset.item)));
}
