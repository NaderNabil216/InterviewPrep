import { CDP, PROBE, ORIGIN, sleep } from './cdp.mjs';
const cdp = await new CDP().launch({ port: 9341, userDataDir: '/tmp/t058-coldfail' });
const log = cdp.recordConsole();
await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE });

async function probe(label) {
  await sleep(4000);
  const s = await cdp.eval(`(() => {
    const b = document.getElementById('boot-status');
    const v = document.getElementById('view').innerText.replace(/\\s+/g,' ');
    return { bootHidden: b ? b.hidden : 'gone',
             loadingLibrary: /Loading your library/.test(v),
             loadingMastery: /Loading track mastery/.test(v),
             dashDdash: /— items/.test(v),
             hasRealCount: /\\d+ items/.test(v),
             head: v.slice(0, 120) }; })()`);
  const err = log.lines.filter(l => l.type === 'error' || l.type === 'exception').map(l => l.text.slice(0, 70));
  console.log(`\n--- ${label}`);
  console.log(`  boot indicator hidden : ${s.bootHidden}`);
  console.log(`  dashboard stuck on placeholders: loadingLibrary=${s.loadingLibrary} mastery=${s.loadingMastery} "— items"=${s.dashDdash} realCount=${s.hasRealCount}`);
  console.log(`  view: ${s.head}`);
  if (err.length) console.log(`  console: ${err.slice(0,2).join(' | ')}`);
}

// cold cache, one pack permanently unavailable
await cdp.clearSiteData();
await cdp.blockUrls(['*content/packs/kotlin-a.json*']);
await cdp.navigate(ORIGIN);
await probe('COLD CACHE + one pack blocked (content phase rejects)');

// and does it ever recover on its own?
await sleep(6000);
await probe('…10s later, still blocked — does it self-heal?');

await cdp.blockUrls([]);
await cdp.eval(`window.dispatchEvent(new Event('focus'))`);
await probe('after unblocking + a focus trigger — does the sync rescue it?');

await cdp.close();
