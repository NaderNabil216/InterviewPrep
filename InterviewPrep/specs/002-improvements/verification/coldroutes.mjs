import { CDP, PROBE, ORIGIN, sleep } from './cdp.mjs';
const cdp = await new CDP().launch({ port: 9340, userDataDir: '/tmp/t058-cold-routes' });
const log = cdp.recordConsole();
await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE });
const ROUTES = ['', '#/dashboard', '#/plan', '#/topics', '#/drill', '#/dsa', '#/design', '#/mock', '#/cheatsheets', '#/settings'];
for (const r of ROUTES) {
  await cdp.clearSiteData();                       // true cold cache for EVERY route
  log.lines.length = 0;
  await cdp.navigate(ORIGIN + '/' + r);
  let hidden = false;
  const t0 = Date.now();
  while (Date.now() - t0 < 6000) {
    hidden = await cdp.eval(`(() => { const b = document.getElementById('boot-status'); return b ? b.hidden : 'gone'; })()`).catch(() => false);
    if (hidden === true || hidden === 'gone') break;
    await sleep(100);
  }
  const ms = Date.now() - t0;
  const err = log.lines.find(l => l.type === 'error' || l.type === 'exception');
  const visible = await cdp.eval(`(() => { const b = document.getElementById('boot-status');
    return b ? getComputedStyle(b).display !== 'none' : false; })()`);
  console.log(
    `${(r || '(bare)').padEnd(14)} indicatorHidden=${String(hidden).padEnd(5)} stillVisible=${String(visible).padEnd(5)} ${String(ms).padStart(5)}ms  ${err ? 'ERROR: ' + err.text.slice(0, 90) : ''}`
  );
}
await cdp.close();
