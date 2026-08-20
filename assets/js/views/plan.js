import { Store, signature } from '../store.js';
import { navigate } from '../app.js';
import { renderInline } from '../md.js';
import { isDrillable, dueCountOf, coverageTotals, coverageByTrack, notCompleted, isCompleted, weakestTracks } from '../progress.js';
import { levelLabel } from '../levels.js';

// The three study modes. `14day` keeps its id while its label reads "15-day deep plan": the id is
// persisted in aip.v1.plan on candidates' devices, so renaming it to match the label would strand
// their selection to fix a cosmetic mismatch.
const MODES = [
  { id: 'free', label: 'Free study', blurb: 'The whole library, paced by your drill schedule.' },
  { id: '7day', label: '7-day sprint', blurb: 'A week out. Highest-yield material only.' },
  { id: '14day', label: '15-day deep plan', blurb: 'Two weeks and change, at depth.' },
];

export function renderPlan(el, { snapshot, param }) {
  const planState = Store.getPlanState();
  const mode = param && MODES.some(m => m.id === param) ? param : (planState.mode || 'free');

  const chooser = `
    <div class="mode-chooser" role="group" aria-label="Study mode">
      ${MODES.map(m => `
        <button class="mode-chooser__option${mode === m.id ? ' is-active' : ''}" data-mode="${m.id}">
          <span class="mode-chooser__label">${m.label}</span>
          <span class="mode-chooser__blurb">${m.blurb}</span>
        </button>`).join('')}
    </div>`;

  if (mode === 'free') renderFreeStudy(el, snapshot, chooser);
  else renderDatedPlan(el, snapshot, planState, mode, chooser);

  el.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
    // Switching writes only `mode` — position, ticks, ratings and notes are untouched.
    const next = b.dataset.mode;
    Store.setPlanState(next === 'free' ? { mode: 'free' } : { mode: next, activePlan: next });
    navigate('plan', next);
  }));
}

// ---------------------------------------------------------------------------
// Free study — the default for anyone who has not chosen (FR-011/FR-012)
// ---------------------------------------------------------------------------
function renderFreeStudy(el, snapshot, chooser) {
  const progress = Store.getProgress();
  // Card 1's population is identical to the dashboard's Review queue: same call, same arguments
  // (SC-003/SC-004). Not-started and coverage come from the same module (FR-006).
  const due = dueCountOf(snapshot.items.filter(isDrillable), progress);
  const totals = coverageTotals(snapshot.items, progress);
  const coverage = coverageByTrack(snapshot.items, progress);
  const weakest = weakestTracks(coverage, 4).map(track => [track, coverage[track]]);
  const nextUp = weakest.flatMap(([track]) => notCompleted(snapshot.items, progress).filter(i => i.track === track).slice(0, 3)).slice(0, 8);

  el.innerHTML = `
    <div class="hero">
      <div>
        <div class="eyebrow">Study Plan</div>
        <h1>Free study</h1>
        <p class="muted">No schedule — the whole library, ordered by what you are weakest at and what is due.</p>
      </div>
    </div>
    ${chooser}

    <div class="grid grid-3" style="margin-top:16px;">
      <div class="card">
        <div class="eyebrow">Due for review</div>
        <h2>${due}</h2>
        <p class="faint">Reviews ready in your drill queue. DSA and System Design have their own workspaces and are not counted here.</p>
        <div class="btn-row" style="margin-top:10px;"><button class="btn btn--primary" id="start-drill">Start drilling →</button></div>
      </div>
      <div class="card">
        <div class="eyebrow">Not started</div>
        <h2>${totals.notStarted}</h2>
        <p class="faint">Questions you have not marked complete, out of ${totals.total} in the library.</p>
      </div>
      <div class="card">
        <div class="eyebrow">Weakest tracks</div>
        <div class="stack" style="margin-top:6px;">
          ${weakest.map(([track, m]) => `
            <div class="row" style="justify-content:space-between;">
              <span>${track}</span>
              <span class="faint">${m.completed}/${m.total} completed</span>
            </div>`).join('') || '<p class="faint">Mark a few questions complete to see this.</p>'}
        </div>
      </div>
    </div>

    <h2 style="margin-top:22px;">Next up</h2>
    <p class="muted">Questions you have not completed, from the tracks you have covered least.</p>
    <div class="stack" style="margin-top:10px;">
      ${nextUp.map(i => `
        <div class="item-row" data-id="${i.id}">
          <span class="chip chip--level-${i.level}">${levelLabel(i.level)}</span>
          <span class="item-row__q">${renderInline(i.q)}</span>
          <span class="faint">${i.track}</span>
        </div>`).join('') || '<div class="empty-state">You have seen everything. Drill what is due.</div>'}
    </div>
  `;

  const drillBtn = el.querySelector('#start-drill');
  if (drillBtn) drillBtn.addEventListener('click', () => navigate('drill'));
  el.querySelectorAll('.item-row').forEach(r =>
    r.addEventListener('click', () => navigate('item', r.dataset.id)));
}

// ---------------------------------------------------------------------------
// Dated plans — completion keyed by material, never by schedule position
// ---------------------------------------------------------------------------
function renderDatedPlan(el, snapshot, planState, mode, chooser) {
  const activePlanId = mode;
  const plan = snapshot.plans[activePlanId];

  if (!plan) {
    el.innerHTML = chooser + `<div class="empty-state">Plan not found.</div>`;
    return;
  }

  const started = planState.startedAt;
  let currentDayIndex = 0;
  if (started) {
    const s = new Date(started + 'T00:00:00'); const now = new Date(); now.setHours(0,0,0,0);
    currentDayIndex = Math.max(0, Math.round((now - s) / 86400000));
  }

  const progress = Store.getProgress();
  const done = planState.done || {};
  const legacy = planState.checked || {};

  // A task auto-completes once every item it links to is marked complete (not merely rated or
  // noted). An explicit manual tick always wins, so you can mark reading/notes tasks done by hand.
  // No stored tick is written, cleared or re-keyed here — tick identity stays the material
  // signature from store.js#signature() (FR-013, FR-019).
  function autoDone(task) {
    const ids = task.itemIds || [];
    if (!ids.length) return false;
    return ids.every(id => isCompleted(progress, id));
  }

  // Completion identity is the material signature. `checked` is read only until the one-time
  // migration has run, and is dropped after.
  function manualMark(dayIdx, taskIdx, task) {
    const ids = task.itemIds || [];
    if (ids.length) {
      const sig = signature(ids);
      if (done[sig] !== undefined) return !!done[sig];
    }
    const legacyMark = legacy[`${dayIdx}:${taskIdx}`];
    return legacyMark === undefined ? undefined : !!legacyMark;
  }

  function taskDone(dayIdx, taskIdx, task) {
    const manual = manualMark(dayIdx, taskIdx, task);
    if (manual !== undefined) return manual;
    return task ? autoDone(task) : false;
  }

  function taskLink(task) {
    if (!task.itemIds || !task.itemIds.length) return null;
    if (task.kind === 'drill') return { view: 'drill', param: task.itemIds.join(',') };
    if (task.kind === 'dsa') return { view: 'dsa', param: task.itemIds[0] };
    if (task.kind === 'design') return { view: 'design', param: task.itemIds[0] };
    return { view: 'item', param: task.itemIds[0] };
  }

  el.innerHTML = `
    <div class="hero">
      <div>
        <div class="eyebrow">Study Plan</div>
        <h1>${plan.title}</h1>
        <p class="muted">${plan.description}</p>
        ${plan.pace && plan.pace.note ? `<p class="faint">${renderInline(plan.pace.note)}</p>` : ''}
      </div>
      <div class="btn-row">
        ${started
          ? `<button class="btn btn--ghost" id="shift-plan" title="Keep your ticks, move Day 1 to today">Shift to today</button>
             <button class="btn btn--ghost" id="restart-plan">Restart plan</button>`
          : `<button class="btn btn--primary" id="start-plan">Start plan today →</button>`}
      </div>
    </div>
    ${chooser}

    <div class="stack" style="margin-top:16px;">
      ${plan.days.map((day, dayIdx) => {
        const isToday = started && dayIdx === currentDayIndex;
        const isPast = started && dayIdx < currentDayIndex;
        const doneCount = day.tasks.filter((t, ti) => taskDone(dayIdx, ti, t)).length;
        return `
        <div class="card" style="${isToday ? 'border-color:var(--accent);' : ''}">
          <div class="row" style="justify-content:space-between;">
            <div>
              <div class="eyebrow">${isToday ? 'TODAY · ' : ''}Day ${dayIdx + 1}${isPast ? ' (past)' : ''}</div>
              <h2 style="margin-top:4px;">${day.title}</h2>
              ${day.focus ? `<p class="faint">${day.focus}</p>` : ''}
            </div>
            <div class="faint">${doneCount}/${day.tasks.length}</div>
          </div>
          <div class="checklist" style="margin-top:10px;">
            ${day.tasks.map((task, taskIdx) => {
              const link = taskLink(task);
              const isDone = taskDone(dayIdx, taskIdx, task);
              const auto = isDone && manualMark(dayIdx, taskIdx, task) === undefined;
              return `
              <label>
                <input type="checkbox" data-day="${dayIdx}" data-task="${taskIdx}" data-sig="${signature(task.itemIds || [])}" ${isDone ? 'checked' : ''}>
                <span style="${isDone ? 'text-decoration:line-through;color:var(--text-faint);' : ''}">${renderInline(task.label)}</span>
                ${auto ? '<span class="faint" title="Auto-completed: every question this task links to is marked complete">auto</span>' : ''}
                ${link ? `<a href="#" class="faint task-link" data-view="${link.view}" data-param="${link.param}" style="margin-left:auto;">open →</a>` : ''}
              </label>`;
            }).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>
  `;

  const startBtn = el.querySelector('#start-plan');
  if (startBtn) startBtn.addEventListener('click', () => {
    Store.setPlanState({ mode: activePlanId, activePlan: activePlanId, startedAt: new Date().toISOString().slice(0,10) });
    navigate('plan', activePlanId);
  });
  const shiftBtn = el.querySelector('#shift-plan');
  if (shiftBtn) shiftBtn.addEventListener('click', () => {
    // Fell behind? Re-anchor Day 1 to today without losing any completed ticks.
    Store.setPlanState({ startedAt: new Date().toISOString().slice(0, 10) });
    navigate('plan', activePlanId);
  });
  const restartBtn = el.querySelector('#restart-plan');
  if (restartBtn) restartBtn.addEventListener('click', () => {
    if (confirm('Restart this plan from Day 1? Your item progress is not affected — only plan-day tracking resets.')) {
      Store.setPlanState({ startedAt: new Date().toISOString().slice(0,10), done: {}, checked: {} });
      navigate('plan', activePlanId);
    }
  });
  el.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', () => {
      const sig = cb.dataset.sig;
      const state = Store.getPlanState();
      try {
        if (sig) {
          Store.setPlanState({ done: { ...(state.done || {}), [sig]: cb.checked } });
        } else {
          // A reading or note-taking task has no material and so no signature. It stays tickable
          // within this plan version under its positional key — that mark is exactly what the
          // migration clears, by name, when the plan is re-authored.
          Store.setPlanState({ checked: { ...(state.checked || {}), [`${cb.dataset.day}:${cb.dataset.task}`]: cb.checked } });
        }
      } catch (e) { /* reported by the banner */ }
      cb.closest('label').querySelector('span').style.textDecoration = cb.checked ? 'line-through' : 'none';
    });
  });
  el.querySelectorAll('.task-link').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(a.dataset.view, a.dataset.param);
    });
  });
}
