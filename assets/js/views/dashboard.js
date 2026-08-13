import { Store } from '../store.js';
import { navigate } from '../app.js';
import { renderInline } from '../md.js';
import { masteryByTrack, dueCount } from '../srs.js';

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
  const totalItems = snapshot.items.length;
  const knownCount = Object.values(progress).filter(p => p.status === 'known').length;
  const seenCount = Object.keys(progress).length;
  const due = dueCount(snapshot.items);
  const mastery = masteryByTrack(snapshot.items);
  const days = daysUntil(settings.interviewDate);
  const { day, plan } = planTasksForToday(snapshot);

  // Free study still gets a "today" surface — never an empty or broken slot (FR-012).
  const freeMode = (Store.getPlanState().mode || 'free') === 'free';
  const unseen = snapshot.items.filter(i => !progress[i.id]);
  const weakestTracks = Object.entries(mastery)
    .filter(([, m]) => m.total > 0)
    .sort((a, b) => (a[1].known / a[1].total) - (b[1].known / b[1].total))
    .slice(0, 3)
    .map(([track]) => track);
  const nextUp = weakestTracks
    .flatMap(track => unseen.filter(i => i.track === track).slice(0, 2))
    .slice(0, 5);

  const lastItem = session.lastItemId ? snapshot.byId[session.lastItemId] : null;

  el.innerHTML = `
    <div class="hero">
      <div>
        <div class="eyebrow">Dashboard</div>
        <h1>Welcome back</h1>
        <p class="muted">Snapshot v${snapshot.version} · ${totalItems} items · ${seenCount} touched · ${knownCount} known</p>
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
        <h2 style="margin-top:6px;">${due} due for drill</h2>
        <p class="faint">${due > 0 ? 'Spaced-repetition items are ready to review now.' : 'Nothing due right now — keep reading new material.'}</p>
        <button class="btn ${due > 0 ? 'btn--primary' : ''}" id="go-drill" style="margin-top:10px;">Start drill →</button>
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
          <h2 style="margin-top:6px;">${due} due · ${unseen.length} still unseen</h2>
          <p class="faint">No fixed schedule. Clear what is due, then take the next thing from your weakest track.</p>
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
        </div>` : '<p class="faint" style="margin-top:10px;">You have seen every item — drill what is due.</p>'}
    </div>` : ''}

    <div class="card">
      <div class="eyebrow">Mastery by track</div>
      <div style="margin-top:12px;">
        ${Object.entries(mastery).sort((a,b) => b[1].total - a[1].total).map(([track, m]) => {
          const pct = Math.round((m.known / m.total) * 100);
          const label = (snapshot.packMeta.find(p => p.track === track) || {}).title || track;
          return `
          <div class="mastery-row">
            <span>${label}</span>
            <div class="progress-bar"><div class="progress-bar__fill" style="width:${pct}%"></div></div>
            <span class="faint">${pct}%</span>
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
