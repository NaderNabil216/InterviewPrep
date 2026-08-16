// T058 — quickstart.md US2: cold-cache / throttled / warm-cache DevTools simulations.
import { CDP, PROBE, ORIGIN, sleep, report } from './cdp.mjs';

const cdp = await new CDP().launch({ port: 9333, userDataDir: '/tmp/t058-us2-profile' });
const consoleLog = cdp.recordConsole();

try {
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE });

  // ---------------------------------------------------------------- cold cache
  console.log('\n== US2 step 1-3: cold cache ==');
  await cdp.clearSiteData();
  const req = cdp.recordRequests();
  await cdp.navigate(ORIGIN);

  await cdp.waitFor('window.__probe && window.__probe.shellReadyAt !== null', { label: 'shell ready' });
  const shell = await cdp.eval(`(() => { const P = window.__probe; return {
    fcp: P.fcp, bootVisibleAtPaint: P.bootVisibleAtPaint, sawBootStatus: P.sawBootStatus,
    shellReadyAt: P.shellReadyAt, shellInFlight: P.shellInFlight,
    shellPackUrls: P.shellInFlightUrls.filter(u => /content\\/packs\\//.test(u)).length,
    shellViewText: (P.shellViewText || '').replace(/\\s+/g, ' ').slice(0, 260),
  }; })()`);

  // FR-004 is "never a blank white screen". On a fast localhost cold cache the whole loading state
  // lasts ~2ms — first paint and shell-ready land within a millisecond or two of each other — so
  // "was the spinner visible at FCP" is not a stable thing to measure and flaps run to run. What IS
  // deterministic: the markup ships the indicator un-hidden so a slow paint always shows it, and the
  // app hides it once the shell renders. The 6x-CPU run below is where it is genuinely exercised.
  const markup = await (await fetch(ORIGIN + '/index.html')).text();
  const tag = (markup.match(/<div id="boot-status"[^>]*>/) || [''])[0];
  report('US2.1 the served markup ships a loading indicator that is visible by default',
    !!tag && !/\bhidden\b/.test(tag), tag || 'MISSING from index.html');
  report('US2.1 the indicator is hidden once the shell has rendered',
    shell.shellReadyAt !== null,
    `hidden at ${shell.shellReadyAt?.toFixed(0)}ms (first paint ${shell.fcp?.toFixed(0)}ms — the two are ~ms apart on localhost)`);

  const fcpToShell = shell.shellReadyAt - (shell.fcp ?? 0);
  report('US2.2 shell interactive within 1s of first paint',
    fcpToShell <= 1000,
    `first paint ${shell.fcp?.toFixed(0)}ms -> shell interactive ${shell.shellReadyAt?.toFixed(0)}ms = ${fcpToShell.toFixed(0)}ms`);

  report('US2.2 pack requests still in flight when the shell became interactive',
    shell.shellPackUrls > 0,
    `${shell.shellPackUrls} pack fetches pending (total in flight ${shell.shellInFlight})`);

  const navUsable = await cdp.eval(`(() => {
    const btns = [...document.querySelectorAll('.topbar__nav [data-nav]')];
    return { count: btns.length, labels: btns.map(b => b.textContent.trim()).join(','),
             clickable: btns.every(b => !b.disabled) };
  })()`);
  report('US2.2 nav is rendered and interactive during the shell phase',
    navUsable.count === 8 && navUsable.clickable, `${navUsable.count} nav buttons: ${navUsable.labels}`);

  const hasZero = /(^|[^\d])0 items|0% |· 0 touched|· 0 known/.test(shell.shellViewText);
  report('US2.3 content-derived figures show neutral placeholders, not real-looking zeros',
    shell.shellViewText.includes('— items') && shell.shellViewText.includes('— touched') && !hasZero,
    shell.shellViewText.slice(0, 150));

  await cdp.waitFor('window.__probe.contentReadyAt !== null', { timeout: 60000, label: 'content phase' });
  const after = await cdp.eval(`(() => { const P = window.__probe; return {
    contentReadyAt: P.contentReadyAt, bootReshownCount: P.bootReshownCount,
    packFetches: P.packFetches,
    viewText: (P.contentViewText || '').replace(/\\s+/g, ' ').slice(0, 200),
    navEntries: performance.getEntriesByType('navigation').length,
  }; })()`);
  report('US2.3 figures fill in with real values once the content phase resolves',
    /\d+ items/.test(after.viewText) && !after.viewText.includes('— items'),
    after.viewText.slice(0, 130));
  report('US2.3 no full-page flash on fill-in (loading indicator never reappeared, no re-navigation)',
    after.bootReshownCount === 0 && after.navEntries === 1,
    `boot indicator re-shown ${after.bootReshownCount}x, navigations ${after.navEntries}`);
  console.log(`       cold-cache totals: ${after.packFetches} pack fetches, content ready at ${after.contentReadyAt.toFixed(0)}ms`);
  req.stop();

  // --------------------------------------------------- throttled (ordering only)
  console.log('\n== US2 step 4: slow CPU + slow network (ordering must still hold) ==');
  await cdp.clearSiteData();
  await cdp.throttle({ cpu: 6, latency: 300, down: 200 * 1024, up: 100 * 1024 });
  await cdp.navigate(ORIGIN);
  await cdp.waitFor('window.__probe && window.__probe.shellReadyAt !== null', { timeout: 60000, label: 'throttled shell' });
  const slow = await cdp.eval(`(() => { const P = window.__probe; return {
    fcp: P.fcp, shellReadyAt: P.shellReadyAt,
    shellPackUrls: P.shellInFlightUrls.filter(u => /content\\/packs\\//.test(u)).length,
    bootVisibleAtPaint: P.bootVisibleAtPaint,
    shellViewText: (P.shellViewText || '').replace(/\\s+/g, ' ').slice(0, 120),
  }; })()`);
  report('US2.4 under 6x CPU + slow 3G the shell still renders while packs are pending (ordering)',
    slow.shellPackUrls > 0 && slow.bootVisibleAtPaint === true,
    `${slow.shellPackUrls} packs pending at shell-interactive; fcp->shell ${(slow.shellReadyAt - slow.fcp).toFixed(0)}ms (1s bound waived per FR-005b)`);
  await cdp.waitFor('window.__probe.contentReadyAt !== null', { timeout: 180000, label: 'throttled content' });
  await cdp.throttle({ cpu: 1 });
  const persisted = await cdp.storedSnapshot();
  console.log(`       throttled content phase completed; persisted snapshot v${persisted?.version} (${persisted?.packs} packs)`);

  // -------------------------------------------------------------- warm cache
  console.log('\n== US2 step 5: warm cache (must not regress) ==');
  const req2 = cdp.recordRequests();
  await cdp.navigate(ORIGIN);
  await cdp.waitFor('window.__probe && window.__probe.shellReadyAt !== null', { label: 'warm shell' });
  const warm = await cdp.eval(`(() => { const P = window.__probe; return {
    fcp: P.fcp, shellReadyAt: P.shellReadyAt, packFetches: P.packFetches,
    shellViewText: (P.shellViewText || '').replace(/\\s+/g, ' ').slice(0, 160),
  }; })()`);
  await sleep(1200);
  const warmPacks = await cdp.eval('window.__probe.packFetches');
  report('US2.5 warm cache renders the full library on first paint (no shell placeholders)',
    /\d+ items/.test(warm.shellViewText) && !warm.shellViewText.includes('— items'),
    warm.shellViewText.slice(0, 120));
  report('US2.5 warm cache fetches no packs at boot (renders straight from the stored snapshot)',
    warmPacks === 0, `${warmPacks} pack fetches`);
  report('US2.5 warm-cache shell is effectively instant',
    warm.shellReadyAt - warm.fcp < 250, `first paint -> interactive ${(warm.shellReadyAt - warm.fcp).toFixed(0)}ms`);
  req2.stop();

  const errs = consoleLog.lines.filter(l => l.type === 'error' || l.type === 'exception');
  report('US2 no console errors across all three load paths', errs.length === 0,
    errs.map(e => e.text).join(' | ').slice(0, 300) || 'clean');
} finally {
  await cdp.close();
}
