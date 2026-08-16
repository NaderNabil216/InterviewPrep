// T058 — quickstart.md US1, US4, US5, US8 (app flow) and US9.
import { CDP, PROBE, ORIGIN, sleep, report } from './cdp.mjs';

const cdp = await new CDP().launch({ port: 9336, userDataDir: '/tmp/t058-rest-profile' });
const consoleLog = cdp.recordConsole();

// Instrument the debounce boundary: count how often the *filtered list* is actually rebuilt versus
// how many keystrokes were delivered.
const TYPE_PROBE = `
(() => {
  window.__t = { listRenders: 0, hashWrites: 0, resultRenders: 0 };
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.target && m.target.id === 'topics-list') { window.__t.listRenders++; window.__t.lastListAt = performance.now(); }
      if (m.target && m.target.id === 'search-results') { window.__t.resultRenders++; window.__t.lastResultAt = performance.now(); }
    }
  });
  document.addEventListener('DOMContentLoaded', () => obs.observe(document.body, { childList: true, subtree: true }));
  document.addEventListener('input', (e) => {
    if (e.target && (e.target.id === 'f-q' || e.target.id === 'search-input')) window.__t.lastInputAt = performance.now();
  }, true);
  addEventListener('hashchange', () => window.__t.hashWrites++);
})();
`;

const typeInto = async (sel, text, perKeyMs = 30) => {
  for (const ch of text) {
    await cdp.eval(`(() => { const i = document.querySelector(${JSON.stringify(sel)});
      i.value += ${JSON.stringify(ch)}; i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
    await sleep(perKeyMs);
  }
};

try {
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE + TYPE_PROBE });
  await cdp.clearSiteData();
  await cdp.navigate(ORIGIN);
  await cdp.waitFor('window.__probe.contentReadyAt !== null', { timeout: 60000, label: 'boot' });

  // ================================================================= US1
  console.log('\n== US1: type-ahead search and filter ==');
  await cdp.goHash('#/topics');
  await cdp.waitFor(`!!document.getElementById('f-q')`, { timeout: 10000, label: 'topics' });
  await sleep(400);
  await cdp.eval('window.__t.listRenders = 0; window.__t.hashWrites = 0');

  const QUERY = 'coroutine scope';         // 15 characters
  const t0 = Date.now();
  await typeInto('#f-q', QUERY, 30);
  const typedValue = await cdp.eval(`document.getElementById('f-q').value`);
  const duringTyping = await cdp.eval('({ ...window.__t })');
  await sleep(600);                         // past the ~150ms trailing debounce
  const afterTyping = await cdp.eval('({ ...window.__t })');
  const settleMs = afterTyping.lastListAt - afterTyping.lastInputAt;

  report('US1.1-2 every character lands in the input immediately',
    typedValue === QUERY, `"${typedValue}" (${typedValue.length} chars)`);
  report('US1.3 the list rebuilds on a trailing debounce, not once per keystroke',
    afterTyping.listRenders > 0 && afterTyping.listRenders < QUERY.length,
    `${afterTyping.listRenders} list rebuilds for ${QUERY.length} keystrokes (${duringTyping.listRenders} mid-typing)`);
  report('US1.3 results settle within 300ms of the last keystroke',
    settleMs > 0 && settleMs < 300,
    `list rebuilt ${settleMs.toFixed(0)}ms after the final keystroke (debounce ~150ms)`);
  report('US1.4 the URL/hash is written after typing stops, not per keystroke',
    afterTyping.hashWrites <= 2 && afterTyping.hashWrites < QUERY.length,
    `${afterTyping.hashWrites} hash writes for ${QUERY.length} keystrokes`);
  const filtered = await cdp.eval(`document.getElementById('topics-list').innerText.length`);

  // clear mid-typing -> prompt state, no stale flash
  await cdp.eval(`(() => { const i = document.getElementById('f-q'); i.value = '';
    i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await sleep(400);
  const cleared = await cdp.eval(`({ len: document.getElementById('topics-list').innerText.length,
    stale: /coroutine scope/i.test(document.getElementById('f-q').value) })`);
  report('US1.5 clearing mid-typing restores the full list with no stale query left behind',
    cleared.len > filtered && !cleared.stale, `list ${filtered} -> ${cleared.len} chars`);

  // search overlay
  await cdp.eval(`(() => { document.getElementById('search-toggle').click(); return true; })()`);
  await cdp.waitFor(`!document.getElementById('search-overlay').hidden`, { timeout: 5000, label: 'overlay' });
  await cdp.eval('window.__t.resultRenders = 0');
  await typeInto('#search-input', 'structured concurrency', 30);
  await sleep(400);
  const overlay = await cdp.eval(`({ renders: window.__t.resultRenders,
    value: document.getElementById('search-input').value,
    results: document.querySelectorAll('#search-results .search-results__item').length })`);
  report('US1.3 the search overlay also computes on a trailing debounce',
    overlay.value === 'structured concurrency' && overlay.renders < 22 && overlay.results > 0,
    `${overlay.renders} result renders for 22 keystrokes, ${overlay.results} hits`);
  await cdp.eval(`(() => { document.getElementById('search-input').value = '';
    document.getElementById('search-input').dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await sleep(400);
  const emptyState = await cdp.eval(`document.getElementById('search-results').innerText.trim()`);
  report('US1.5 clearing the overlay query returns the prompt state',
    emptyState.length > 0 && !/structured/i.test(emptyState), `"${emptyState.slice(0, 60)}"`);
  await cdp.eval(`(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return true; })()`);
  await sleep(200);

  // ================================================================= US4
  console.log('\n== US4: one-tap progress marking ==');
  const firstQa = await cdp.eval(`(async () => {
    const { Store } = await import('/assets/js/store.js');
    return null; })()`).then(() => cdp.eval(`(() => {
      const row = document.querySelector('#topics-list .item-row[data-id]');
      return row ? row.dataset.id : null; })()`));
  await cdp.goHash('#/topics');
  await sleep(500);
  const itemId = await cdp.eval(`(() => { const r = document.querySelector('[data-id]'); return r ? r.dataset.id : null; })()`);
  await cdp.goHash(`#/item/${itemId}`);
  await cdp.waitFor(`!!document.querySelector('.rate-row')`, { timeout: 10000, label: 'item detail' });
  const rateRow = await cdp.eval(`(() => {
    const btns = [...document.querySelectorAll('.rate-row button')];
    return { count: btns.length, labels: btns.map(b => b.textContent.trim()),
             legacy: /again|hard|good|easy/i.test(btns.map(b => b.textContent).join(' ')) }; })()`);
  report('US4.1 item detail offers exactly one "Mark complete" action, no Again/Hard/Good/Easy',
    rateRow.count === 1 && /mark complete/i.test(rateRow.labels[0]) && !rateRow.legacy,
    `buttons: ${rateRow.labels.join(', ')}`);

  await cdp.eval(`(() => { document.querySelector('.rate-row button').click(); return true; })()`);
  await sleep(400);
  const p1 = await cdp.eval(`JSON.parse(localStorage.getItem('aip.v1.progress'))[${JSON.stringify(itemId)}]`);
  await cdp.eval(`(() => { document.querySelector('.rate-row button').click(); return true; })()`);
  await sleep(400);
  const p2 = await cdp.eval(`JSON.parse(localStorage.getItem('aip.v1.progress'))[${JSON.stringify(itemId)}]`);
  report('US4.2 marking complete records progress and schedules the item',
    !!p1 && !!p1.due && p1.reps >= 1, `after one tap: reps=${p1.reps}, ease=${p1.ease}, due=${p1.due}`);
  report('US4.3 a second tap advances the schedule without corrupting it (same as double-"Good" before)',
    p2.reps === p1.reps + 1 && !!p2.due && p2.ease >= 1.3,
    `after two taps: reps=${p2.reps}, ease=${p2.ease}, due=${p2.due}`);

  const surfaces = {};
  for (const [name, hash, sel] of [
    ['DSA', `#/dsa/ds-0001`, '.rate-row button'],
    ['Design', `#/design/sd-0001`, '.rate-row button'],
  ]) {
    await cdp.goHash(hash);
    await sleep(800);
    surfaces[name] = await cdp.eval(`(() => { const b = [...document.querySelectorAll('.rate-row button')];
      return { n: b.length, label: b.map(x => x.textContent.trim()).join('|') }; })()`);
  }
  await cdp.goHash('#/drill');
  await cdp.waitFor(`!!document.getElementById('drill-card') || !!document.querySelector('.empty-state')`, { timeout: 10000 });
  await cdp.eval(`(() => { const c = document.getElementById('drill-card'); if (c) c.click(); return true; })()`);
  await sleep(300);
  surfaces['Drill'] = await cdp.eval(`(() => { const b = [...document.querySelectorAll('.rate-row button')];
    return { n: b.length, label: b.map(x => x.textContent.trim()).join('|') }; })()`);
  report('US4.5 the same single action appears on every review surface',
    Object.values(surfaces).every(s => s.n === 1 && /Mark complete/i.test(s.label)),
    Object.entries(surfaces).map(([k, v]) => `${k}:${v.n}×"${v.label}"`).join('  '));

  const mastery = await cdp.eval(`(() => { const t = document.getElementById('view'); return true; })()`);
  await cdp.goHash('#/dashboard');
  await sleep(600);
  const dash = await cdp.eval(`document.getElementById('view').innerText`);
  report('US4.4 mastery percentages still compute after marking',
    /%/.test(dash) && /\d+ items/.test(dash) && !/NaN|undefined/.test(dash),
    dash.split('\n').filter(l => /%/.test(l)).slice(0, 1).join('') || 'mastery bars present');

  // FR-014b — a legacy mock row carrying only avgScore must still display
  console.log('\n== US4 step 6: legacy mock row (FR-014b) ==');
  await cdp.eval(`(() => { localStorage.setItem('aip.v1.mockResults', JSON.stringify([
    { mode: 'rapid', avgScore: 2.5, itemCount: 8, date: '2026-07-01T10:00:00.000Z' },
    { mode: 'rapid', completedCount: 6, completedPct: 0.75, itemCount: 8, date: '2026-08-01T10:00:00.000Z' }
  ])); return true; })()`);
  await cdp.goHash('#/mock');
  await sleep(800);
  const mockView = await cdp.eval(`document.getElementById('view').innerText`);
  const legacyStored = await cdp.eval(`JSON.parse(localStorage.getItem('aip.v1.mockResults'))[0]`);
  const rows = await cdp.eval(`[...document.querySelectorAll('tbody tr')].map(r => r.innerText.replace(/\\s+/g, ' ').trim())`);
  report('US4.6 a pre-change mock session still appears in the history alongside the new metric',
    rows.length === 2 && rows.some(r => /avg score/i.test(r)) && rows.some(r => /complete/i.test(r)) &&
    !/NaN|undefined/.test(mockView),
    rows.join('  ||  '));
  report('US4.6 the legacy row is labelled as the older metric and was not back-filled',
    legacyStored.avgScore === 2.5 && legacyStored.completedPct === undefined &&
    rows.some(r => /2\.5\/4 avg score/.test(r)),
    'rendered as "2.5/4 avg score"; stored row still carries only avgScore');

  // ================================================================= US5
  console.log('\n== US5: timers pause on reveal ==');
  await cdp.goHash('#/drill');
  await cdp.waitFor(`!!document.getElementById('drill-clock')`, { timeout: 10000, label: 'drill' });
  await sleep(2500);
  const clockRunning = await cdp.eval(`document.getElementById('drill-clock').textContent.trim()`);
  await sleep(2500);
  const clockRunning2 = await cdp.eval(`document.getElementById('drill-clock').textContent.trim()`);
  await cdp.eval(`(() => { document.getElementById('drill-card').click(); return true; })()`);
  await sleep(400);
  const frozenAt = await cdp.eval(`document.getElementById('drill-clock').textContent.trim()`);
  await sleep(5000);
  const stillFrozen = await cdp.eval(`document.getElementById('drill-clock').textContent.trim()`);
  report('US5.1 the Drill clock advances while the question is visible',
    clockRunning !== clockRunning2, `${clockRunning} -> ${clockRunning2}`);
  report('US5.1 the Drill clock freezes the instant the answer is revealed',
    frozenAt === stillFrozen, `held at ${frozenAt} across a 5s reveal`);
  await cdp.eval(`(() => { document.getElementById('mark-complete').click(); return true; })()`);
  await sleep(2500);
  const resumed = await cdp.eval(`document.getElementById('drill-clock').textContent.trim()`);
  const toSec = (s) => { const [m, x] = s.split(':').map(Number); return m * 60 + x; };
  report('US5.1 the clock resumes from the frozen value (the 5s reveal was not counted)',
    toSec(resumed) > toSec(frozenAt) && toSec(resumed) - toSec(frozenAt) <= 4,
    `${frozenAt} -> ${resumed} after a 5s pause + ~2.5s of visible time`);

  await cdp.goHash('#/mock');
  await sleep(600);
  const started = await cdp.eval(`(() => { const c = document.querySelector('[data-mode="coding"]');
    if (c) { c.click(); return 'coding'; } return null; })()`);
  await sleep(1200);
  const hasTimer = await cdp.eval(`!!document.getElementById('session-timer')`);
  if (hasTimer) {
    const readTimer = `(() => { const t = document.getElementById('session-timer'); return t ? t.textContent.trim() : null; })()`;
    const m1 = await cdp.eval(readTimer);
    await sleep(3000);
    const m2 = await cdp.eval(readTimer);
    await cdp.eval(`(() => { const b = document.getElementById('reveal-btn'); if (b) b.click(); return true; })()`);
    await sleep(500);
    const f1 = await cdp.eval(readTimer);
    await sleep(5000);
    const f2 = await cdp.eval(readTimer);
    report('US5.2 the Mock per-question countdown runs, then freezes on reveal',
      m1 !== m2 && f1 === f2, `running ${m1}->${m2}; frozen at ${f1} across 5s revealed`);
  } else {
    report('US5.2 Mock countdown check', false, `could not start a mock session (start button: ${started})`);
  }

  // ================================================================= US8
  console.log('\n== US8: clarify-then-plan design flow ==');
  await cdp.goHash('#/design/sd-0000');
  await cdp.waitFor(`!!document.getElementById('view')`, { timeout: 10000 });
  await sleep(700);
  // sd-0000 carries clarifyingQuestions too (T049), so its plan phase starts hidden like any other.
  const fwClarify = await cdp.eval(`document.querySelectorAll('[data-clarify]').length`);
  await cdp.eval(`(() => { const b = document.getElementById('proceed-plan'); if (b) b.click(); return true; })()`);
  await sleep(500);
  const fw = await cdp.eval(`document.getElementById('view').innerText`);
  report('US8.4 the framework item is held to the same >=3 clarifying-questions floor',
    fwClarify >= 3, `sd-0000 carries ${fwClarify} clarifying questions`);
  report('US8.1 the framework item documents two labeled phases',
    /Phase 1 — Clarify/i.test(fw) && /Phase 2 — Plan/i.test(fw), 'both phase headings present');

  await cdp.goHash('#/design/sd-0001');
  await cdp.waitFor(`!!document.getElementById('proceed-plan')`, { timeout: 10000, label: 'clarify step' });
  const step1 = await cdp.eval(`(() => ({
    questions: document.querySelectorAll('[data-clarify]').length,
    planHidden: document.getElementById('plan-phase').hidden,
    sideHidden: document.getElementById('plan-side') ? document.getElementById('plan-side').hidden : null,
    text: document.getElementById('view').innerText,
  }))()`);
  report('US8.2 a scenario opens on clarifying questions with no plan content visible',
    step1.questions >= 3 && step1.planHidden === true && step1.sideHidden === true,
    `${step1.questions} clarifying questions; plan-phase and plan-side both hidden`);
  await cdp.eval(`(() => { document.getElementById('proceed-plan').click(); return true; })()`);
  await sleep(500);
  const step2 = await cdp.eval(`(() => ({
    planHidden: document.getElementById('plan-phase').hidden,
    sideHidden: document.getElementById('plan-side').hidden,
    hasRubric: /rubric|requirements|reference/i.test(document.getElementById('view').innerText),
  }))()`);
  report('US8.2 the plan is reachable only after an explicit proceed step',
    step2.planHidden === false && step2.sideHidden === false && step2.hasRubric,
    'plan phase revealed in place after Proceed');

  // ================================================================= US9
  console.log('\n== US9: "Lead" replaces "Staff/Monster" ==');
  await cdp.goHash('#/topics');
  await sleep(600);
  const levels = await cdp.eval(`(() => {
    const sel = document.getElementById('f-level');
    return { options: [...sel.options].map(o => o.textContent.trim()).join(', '),
             monster: /Staff\\/Monster|Monster/i.test(document.body.innerText) }; })()`);
  report('US9.2 the level filter reads "Lead" for level 4, with no Staff/Monster anywhere',
    /Lead/.test(levels.options) && !levels.monster, `options: ${levels.options}`);
  await cdp.eval(`(() => { const s = document.getElementById('f-level'); s.value = '4';
    s.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await sleep(500);
  const lvl4 = await cdp.eval(`(() => {
    const rows = [...document.querySelectorAll('#topics-list [data-id]')];
    const chips = [...document.querySelectorAll('#topics-list .chip--level-4')].map(c => c.textContent.trim());
    return { rows: rows.length, chips: [...new Set(chips)].join(',') }; })()`);
  report('US9.2 filtering by level 4 returns items whose chip reads "Lead"',
    lvl4.rows > 0 && lvl4.chips === 'Lead', `${lvl4.rows} level-4 items, chip label "${lvl4.chips}"`);

  const errs = consoleLog.lines.filter(l => (l.type === 'error' || l.type === 'exception') &&
    !/Failed to load resource|ERR_/.test(l.text));
  report('No console errors across US1/US4/US5/US8/US9', errs.length === 0,
    errs.map(e => e.text).join(' | ').slice(0, 300) || 'clean');
} finally {
  await cdp.close();
}
