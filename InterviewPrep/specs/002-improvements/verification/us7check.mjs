// US7 spot-check: the 14 newly-rewritten items must render their new shortAnswer bullets.
import { CDP, PROBE, ORIGIN, sleep, report } from './cdp.mjs';
const cdp = await new CDP().launch({ port: 9338, userDataDir: '/tmp/t058-us7-profile' });
const log = cdp.recordConsole();
const CHECKS = [
  ['ar-0015', 'hands out the app'], ['ar-0020', 'turns implementation failures'],
  ['ar-0023', 'plain constructor parameters'], ['ar-0025', 'verifies the graph at build time'],
  ['ar-0028', 'group by technology'], ['ar-0029', 'Split a module in two'],
  ['ar-0030', 'one bundle of configuration'], ['ar-0034', 'The symptoms'],
  ['ar-0035', 'name no dispatcher at all'], ['ar-0037', 'where security and ownership matter'],
  ['ar-0044', 'change independently'], ['bt-0046', 'Write characterization tests'],
  ['co-0031', 'suspends the caller'], ['pe-0019', 'costs you twice'],
];
try {
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE });
  await cdp.clearSiteData();
  await cdp.navigate(ORIGIN);
  await cdp.waitFor('window.__probe.contentReadyAt !== null', { timeout: 60000, label: 'boot' });
  let ok = 0; const bad = [];
  for (const [id, phrase] of CHECKS) {
    await cdp.goHash(`#/item/${id}`);
    await cdp.waitFor(`!!document.querySelector('.short-answer, .rate-row')`, { timeout: 10000, label: id });
    await sleep(250);
    const found = await cdp.eval(`(() => { const el = document.querySelector('.short-answer');
      return el ? el.innerText.includes(${JSON.stringify(phrase)}) : false; })()`);
    if (found) ok++; else bad.push(id);
  }
  report('US7 all 14 newly-rewritten shortAnswers render their new wording',
    ok === CHECKS.length, `${ok}/${CHECKS.length} verified${bad.length ? ' — missing: ' + bad.join(',') : ''}`);
  const sample = await cdp.eval(`document.querySelector('.short-answer').innerText.replace(/\\s+/g,' ').slice(0,150)`);
  console.log('       sample (pe-0019):', sample);
  const errs = log.lines.filter(l => (l.type === 'error' || l.type === 'exception') && !/Failed to load resource|ERR_/.test(l.text));
  report('US7 no console errors while rendering the rewritten items', errs.length === 0,
    errs.map(e => e.text).join(' | ').slice(0, 200) || 'clean');
} finally { await cdp.close(); }
