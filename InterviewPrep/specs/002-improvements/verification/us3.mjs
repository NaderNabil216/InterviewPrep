// T058 — quickstart.md US3: automatic content sync, incl. the offline/online, request-blocking
// (FR-007a) and unchanged-index (FR-011) DevTools simulations.
//
// The stale-content side of the diff is produced by ageing the STORED SNAPSHOT in IndexedDB rather
// than editing content/manifest.json on disk: it drives the exact same version-compare code path
// (`diskManifest.version === snapshot.version`) without mutating the repository.
import { CDP, PROBE, ORIGIN, sleep, report } from './cdp.mjs';

const cdp = await new CDP().launch({ port: 9334, userDataDir: '/tmp/t058-us3-profile' });
const consoleLog = cdp.recordConsole();

// Age the stored snapshot: older version + 3 items removed (read as "new" against disk) +
// 5 items' updatedIn changed (read as "changed").
const seedStale = (version = '2026.08.15') => cdp.eval(`(async () => {
  const db = await new Promise((res, rej) => { const r = indexedDB.open('aip', 1); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const cur = await new Promise((res) => { const q = db.transaction('snapshot').objectStore('snapshot').get('current'); q.onsuccess = () => res(q.result); });
  if (!cur) { db.close(); return { error: 'no stored snapshot' }; }
  cur.version = ${JSON.stringify(version)};
  const ids = Object.keys(cur.packs);
  const dropped = cur.packs[ids[0]].items.splice(0, 3).map(i => i.id);
  const touched = cur.packs[ids[1]].items.slice(0, 5).map(i => { i.updatedIn = 'stale.0'; return i.id; });
  await new Promise((res, rej) => { const t = db.transaction('snapshot', 'readwrite'); t.objectStore('snapshot').put(cur, 'current'); t.oncomplete = res; t.onerror = () => rej(t.error); });
  db.close();
  return { version: cur.version, dropped, touched };
})()`);

const seedTicks = () => cdp.eval(`(async () => {
  localStorage.setItem('aip.v1.plan', JSON.stringify({
    mode: '14day', activePlan: '14day', startedAt: Date.now(), done: {}, checked: { '0:0': true, '0:1': true },
  }));
  const db = await new Promise((res) => { const r = indexedDB.open('aip', 1); r.onsuccess = () => res(r.result); });
  const cur = await new Promise((res) => { const q = db.transaction('snapshot').objectStore('snapshot').get('current'); q.onsuccess = () => res(q.result); });
  db.close();
  const days = cur.plans['14day'].days;
  const sig = (ids) => [...ids].sort().join('+');
  return { expected: [sig(days[0].tasks[0].itemIds), sig(days[0].tasks[1].itemIds)] };
})()`);

const planState = () => cdp.eval(`JSON.parse(localStorage.getItem('aip.v1.plan') || 'null')`);
const toasts = () => cdp.eval('window.__probe.toasts');
const fireTrigger = () => cdp.eval(`(() => { window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')); return true; })()`);

try {
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE });

  // Build a complete, current snapshot to age.
  await cdp.clearSiteData();
  await cdp.navigate(ORIGIN);
  await cdp.waitFor('window.__probe.contentReadyAt !== null', { timeout: 60000, label: 'seed load' });
  const fresh = await cdp.storedSnapshot();
  console.log(`\n(seed) stored snapshot v${fresh.version}, ${fresh.packs} packs`);

  // ------------------------------------------- steps 1,2,4: automatic apply + toast + tick re-anchor
  console.log('\n== US3 steps 1-2, 4: automatic apply, toast, plan-tick re-anchoring ==');
  const staleInfo = await seedStale();
  const { expected } = await seedTicks();
  await cdp.navigate(ORIGIN);
  await cdp.waitFor(`window.__probe.toasts.length > 0`, { timeout: 60000, label: 'sync toast' });
  const t1 = await toasts();
  const synced = await cdp.storedSnapshot();
  const plan1 = await planState();

  report('US3.2 content syncs with no button press (a toast names what changed)',
    /Content updated — 3 new, \d+ changed\./.test(t1[0]), `toast: "${t1[0]}"`);
  report('US3.2 the stored snapshot advanced to the disk version',
    synced.version === fresh.version && staleInfo.version !== fresh.version,
    `${staleInfo.version} -> ${synced.version}`);
  report('US3.2 nothing blocked on a decline/accept click (no modal or confirm in the DOM)',
    await cdp.eval(`!document.querySelector('.modal, dialog, #update-btn, [data-action="apply-update"]')`),
    'no modal/dialog/update control present');
  report('US3.4 toast also names how many plan ticks were re-anchored',
    /2 plan ticks re-anchored/.test(t1[0]), `toast: "${t1[0]}"`);
  report('US3.4 getPlanState().done carries the migrated material signatures (ticks not cleared)',
    expected.every(sig => plan1.done[sig] === true) && Object.keys(plan1.checked).length === 0,
    `done has ${Object.keys(plan1.done).length} signature(s); checked reset to {}`);

  // --------------------------------------------------- step 3: no manual-update surfaces remain
  console.log('\n== US3 step 3: no manual update surfaces ==');
  const surfaces = await cdp.eval(`(() => {
    const body = document.body.innerText;
    return {
      updateBtn: !!document.getElementById('update-btn'),
      whatsnewNav: !!document.querySelector('[data-nav="whatsnew"]'),
      upToDate: /Up to date|Update available|What's New/i.test(body),
      navLabels: [...document.querySelectorAll('.topbar__nav [data-nav]')].map(b => b.textContent.trim()).join(', '),
    };
  })()`);
  report('US3.3 no Update button, no What\'s New nav, no "Up to date"/"Update available" text',
    !surfaces.updateBtn && !surfaces.whatsnewNav && !surfaces.upToDate, `nav: ${surfaces.navLabels}`);

  // -------------------------------------------------- step 5: no mid-session apply (sessionActive)
  console.log('\n== US3 step 5: pending diff must not apply mid-session ==');
  await seedStale('2026.08.14');
  // The boot-time check fires the moment the shell renders, which would apply the diff before a
  // session exists. Hold the manifest until the Drill session is up, then release it.
  await cdp.blockUrls(['*content/manifest.json*']);
  await cdp.navigate(ORIGIN);
  await cdp.waitFor(`window.__probe.shellReadyAt !== null`, { label: 'reload' });
  await cdp.goHash('#/drill');
  await cdp.waitFor(`!!document.getElementById('drill-card')`, { timeout: 20000, label: 'drill session' });
  await sleep(300);
  await cdp.blockUrls([]);
  await cdp.eval('window.__probe.toasts.length = 0');
  await fireTrigger();
  await sleep(3000);
  const midSession = await cdp.storedSnapshot();
  const midToasts = await toasts();
  report('US3.5 sync does NOT apply while a Drill session is active',
    midSession.version === '2026.08.14' && midToasts.length === 0,
    `stored still v${midSession.version}, ${midToasts.length} toasts`);

  await cdp.goHash('#/dashboard');
  await cdp.waitFor(`!document.getElementById('drill-card')`, { timeout: 10000, label: 'left session' });
  await fireTrigger();
  await cdp.waitFor('window.__probe.toasts.length > 0', { timeout: 60000, label: 'post-session sync' });
  const afterSession = await cdp.storedSnapshot();
  report('US3.5 the held diff applies as soon as the session ends',
    afterSession.version === fresh.version, `stored now v${afterSession.version} — "${(await toasts())[0]}"`);

  // ------------------------------------------------------- step 6: offline -> online
  console.log('\n== US3 step 6: offline, then reconnect ==');
  await seedStale('2026.08.13');
  await cdp.blockUrls(['*content/manifest.json*']);   // hold the boot check until we are offline
  await cdp.navigate(ORIGIN);
  await cdp.waitFor(`window.__probe.shellReadyAt !== null`, { label: 'reload' });
  await cdp.offline(true);
  await cdp.blockUrls([]);
  await sleep(300);
  await cdp.eval('window.__probe.toasts.length = 0');
  await fireTrigger();
  await sleep(3000);
  const offlineState = await cdp.storedSnapshot();
  report('US3.6 while offline the sync cannot complete and nothing is mutated',
    offlineState.version === '2026.08.13' && (await toasts()).length === 0 && (await cdp.eval('navigator.onLine')) === false,
    `stored still v${offlineState.version}, navigator.onLine=false`);

  await cdp.offline(false);   // fires the browser's own 'online' event — no user action
  await cdp.waitFor('window.__probe.toasts.length > 0', { timeout: 60000, label: 'online sync' });
  const backOnline = await cdp.storedSnapshot();
  report('US3.6 reconnecting syncs on the browser\'s own online event, with no user action',
    backOnline.version === fresh.version, `stored now v${backOnline.version} — "${(await toasts())[0]}"`);

  // ------------------------------------ step 7: partial failure is abandoned cleanly (FR-007a)
  console.log('\n== US3 step 7: blocked pack request (FR-007a all-or-nothing) ==');
  await seedStale('2026.08.12');
  await seedTicks();
  // Block BEFORE the load: the boot-time sync check fires as soon as the shell renders.
  await cdp.blockUrls(['*content/packs/kotlin-a.json*']);
  await cdp.navigate(ORIGIN);
  await cdp.waitFor(`window.__probe.shellReadyAt !== null`, { label: 'reload' });
  const planBefore = await planState();
  await fireTrigger();
  await sleep(6000);
  const blocked = await cdp.storedSnapshot();
  const planAfterBlock = await planState();
  const visibleError = await cdp.eval(`(() => {
    const banner = document.getElementById('storage-banner');
    return { banner: banner ? !banner.hidden : false,
             errorText: /Couldn't load|failed|error/i.test(document.getElementById('view').innerText) };
  })()`);
  report('US3.7 a blocked pack abandons the sync: stored snapshot still reports the old version',
    blocked.version === '2026.08.12', `stored v${blocked.version}`);
  report('US3.7 no toast on the abandoned attempt',
    (await toasts()).length === 0, `${(await toasts()).length} toasts`);
  report('US3.7 plan ticks untouched by the abandoned attempt',
    JSON.stringify(planAfterBlock) === JSON.stringify(planBefore),
    `checked keys: ${Object.keys(planAfterBlock.checked).join(',') || 'none'} (unchanged)`);
  report('US3.7 no error surfaced to the candidate',
    !visibleError.banner && !visibleError.errorText, 'no storage banner, no error copy in view');

  await cdp.blockUrls([]);
  await fireTrigger();
  await cdp.waitFor('window.__probe.toasts.length > 0', { timeout: 60000, label: 'unblocked sync' });
  const unblocked = await cdp.storedSnapshot();
  const planAfterSync = await planState();
  report('US3.7 unblocking lets the next trigger complete the sync normally',
    unblocked.version === fresh.version && Object.keys(planAfterSync.done).length >= 2,
    `stored now v${unblocked.version} — "${(await toasts())[0]}"`);

  // ----------------------------------------- step 8: unchanged index is cheap (FR-011)
  console.log('\n== US3 step 8: unchanged index costs one manifest fetch, zero packs (FR-011) ==');
  await cdp.navigate(ORIGIN);
  await cdp.waitFor(`window.__probe.shellReadyAt !== null`, { label: 'reload' });
  await sleep(1500);                       // let the boot-time sync check settle
  const before = await cdp.eval('({ manifest: window.__probe.manifestFetches, packs: window.__probe.packFetches })');
  const rec = cdp.recordRequests();
  const CYCLES = 5;
  for (let i = 0; i < CYCLES; i++) { await fireTrigger(); await sleep(500); }
  await sleep(1500);
  rec.stop();
  const afterCounts = await cdp.eval('({ manifest: window.__probe.manifestFetches, packs: window.__probe.packFetches })');
  const manifestReqs = rec.urls.filter(u => /manifest\.json/.test(u)).length;
  const packReqs = rec.urls.filter(u => /content\/packs\//.test(u)).length;
  report('US3.8 each focus/visibility trigger issues exactly one manifest request',
    afterCounts.manifest - before.manifest === CYCLES * 2 && manifestReqs === CYCLES * 2,
    `${manifestReqs} manifest requests over ${CYCLES} focus+visibilitychange cycles (${CYCLES * 2} triggers)`);
  report('US3.8 no pack traffic at all while the index is unchanged',
    afterCounts.packs - before.packs === 0 && packReqs === 0, `${packReqs} pack requests`);

  // Failed resource loads are the *point* of the offline and request-blocking simulations; the
  // requirement is that nothing reaches the candidate, which the storage-banner/view checks cover.
  const EXPECTED = /ERR_INTERNET_DISCONNECTED|ERR_BLOCKED_BY_CLIENT|ERR_FAILED|Failed to load resource/;
  const all = consoleLog.lines.filter(l => l.type === 'error' || l.type === 'exception');
  const errs = all.filter(l => !EXPECTED.test(l.text));
  report('US3 no console errors beyond the deliberate offline/blocked fetch failures',
    errs.length === 0,
    errs.map(e => e.text).join(' | ').slice(0, 400) || `clean (${all.length} expected network-simulation failures)`);
} finally {
  await cdp.close();
}
