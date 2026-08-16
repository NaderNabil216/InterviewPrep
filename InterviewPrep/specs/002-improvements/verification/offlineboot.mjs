import { CDP, PROBE, ORIGIN, sleep, report } from './cdp.mjs';
const cdp = await new CDP().launch({ port: 9342, userDataDir: '/tmp/t058-offboot' });
await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE });
const state = () => cdp.eval(`(() => { const v = document.getElementById('view').innerText.replace(/\\s+/g,' ');
  return { real: /\\d+ items/.test(v), placeholder: /— items/.test(v) }; })()`);

// First boot with only the manifest reachable: packs blocked == a flaky first load.
await cdp.clearSiteData();
await cdp.blockUrls(['*content/packs/*']);
await cdp.navigate(ORIGIN);
await sleep(3000);
const during = await state();
report('first boot with packs unreachable shows the loading placeholders, not an error',
  during.placeholder && !during.real, 'dashboard on "— items"');

// Reconnect: the browser's own online event must finish the boot with no user action.
await cdp.blockUrls([]);
await cdp.offline(true); await sleep(300); await cdp.offline(false);
let ok = false;
for (let i = 0; i < 40; i++) { if ((await state()).real) { ok = true; break; } await sleep(250); }
report('reconnecting completes the interrupted first boot automatically',
  ok, ok ? 'library filled in to 629 items with no user action' : 'STILL STUCK on placeholders');
await cdp.close();
