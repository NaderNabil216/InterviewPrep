// T058 — quickstart.md US6: the DSA Run button's DevTools scenarios (offline, stalled request /
// 30s timeout, re-run abort, not-runnable, key hygiene).
//
// Judge0 responses are served by CDP request interception, so the response -> panel mapping in
// contracts/dsa-run-contract.md is exercised end-to-end without a paid RapidAPI key. Steps 2 and 3
// of the quickstart (a LIVE keyed run) are the one part this cannot stand in for.
import { CDP, PROBE, ORIGIN, sleep, report } from './cdp.mjs';

const ITEM = 'ds-0001';
const KEY = 'test-key-DO-NOT-LEAK-8f3a91';
const JUDGE0 = 'https://judge0-ce.p.rapidapi.com/*';

const cdp = await new CDP().launch({ port: 9335, userDataDir: '/tmp/t058-us6-profile' });
const consoleLog = cdp.recordConsole();
const allRequests = cdp.recordRequests();

// ---- Judge0 interception -------------------------------------------------------------------
let mode = 'off';           // 'stall' | 'fulfill' | 'fail'
let nextBody = null;
const paused = [];          // every intercepted request, in arrival order
const CORS = [
  { name: 'Access-Control-Allow-Origin', value: ORIGIN },
  { name: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
  { name: 'Access-Control-Allow-Headers', value: 'content-type, x-rapidapi-key, x-rapidapi-host' },
];
cdp.on(async (m) => {
  if (m.method !== 'Fetch.requestPaused') return;
  const { requestId, request } = m.params;
  // The real endpoint answers a preflight (proven in T060), so the stand-in must too — otherwise
  // the browser rejects the POST before the app's own code ever sees a response.
  if (request.method === 'OPTIONS') {
    try { await cdp.send('Fetch.fulfillRequest', { requestId, responseCode: 204, responseHeaders: CORS }); } catch {}
    return;
  }
  paused.push({ id: requestId, url: request.url, headers: request.headers, method: request.method });
  if (mode === 'stall') return;                       // hold it open — never respond
  try {
    if (mode === 'fail') await cdp.send('Fetch.failRequest', { requestId, errorReason: 'Failed' });
    else if (mode === 'fulfill') await cdp.send('Fetch.fulfillRequest', {
      requestId, responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, ...CORS],
      body: Buffer.from(JSON.stringify(nextBody)).toString('base64'),
    });
  } catch { /* client already aborted it */ }
});

const resetPaused = () => { paused.length = 0; };
const panel = () => cdp.eval(`(() => { const b = document.getElementById('run-result');
  return b ? { cls: b.className, text: b.innerText.trim().slice(0, 200) } : null; })()`);
const runBtn = () => cdp.eval(`(() => { const b = document.getElementById('run-btn');
  return b ? { text: b.textContent.trim(), disabled: !!b.disabled, title: b.title || '' } : null; })()`);
const pressRun = () => cdp.eval(`(() => { document.getElementById('run-btn').click(); return true; })()`);
const openItem = async (id = ITEM) => {
  await cdp.goHash(`#/dsa/${id}`);
  await cdp.waitFor(`!!document.getElementById('scratchpad')`, { timeout: 15000, label: 'dsa detail' });
};
const setKeyViaSettings = async (value) => {
  await cdp.goHash('#/settings');
  await cdp.waitFor(`!!document.querySelector('#judge0-key, input[data-setting="judge0ApiKey"], .card input[type="text"]')`,
    { timeout: 10000, label: 'settings' });
  return cdp.eval(`(() => {
    const inp = document.querySelector('#judge0-key') ||
      [...document.querySelectorAll('input')].find(i => /judge0|api key/i.test(
        (i.id || '') + ' ' + (i.placeholder || '') + ' ' + (i.closest('.card')?.textContent || '')));
    if (!inp) return { ok: false };
    inp.value = ${JSON.stringify(value)};
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, stored: JSON.parse(localStorage.getItem('aip.v1.settings') || '{}').judge0ApiKey ?? null };
  })()`);
};

try {
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE });
  await cdp.clearSiteData();
  await cdp.navigate(ORIGIN);
  await cdp.waitFor('window.__probe.contentReadyAt !== null', { timeout: 60000, label: 'boot' });
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: JUDGE0, requestStage: 'Request' }] });

  // ---------------------------------------------------- step 1: editor + Run button
  console.log('\n== US6 step 1: code editor replaces the plain notes textarea ==');
  const keyed = await setKeyViaSettings(KEY);
  await openItem();
  const editor = await cdp.eval(`(() => { const t = document.getElementById('scratchpad');
    return { cls: t.className, prefilled: t.value.trim().startsWith('fun twoSum'), len: t.value.length }; })()`);
  const btn1 = await runBtn();
  report('US6.1 Settings accepts a Judge0 CE key', keyed.ok && keyed.stored === KEY, `stored via Settings card`);
  report('US6.1 scratchpad is a code editor pre-filled from starter, with an enabled Run button',
    editor.cls.includes('code-editor') && editor.prefilled && btn1 && !btn1.disabled,
    `class="${editor.cls}", ${editor.len} chars, button "${btn1.text}"`);

  // ---------------------------------------------------- step 4: no key -> needs setup
  console.log('\n== US6 step 4: no key configured ==');
  await setKeyViaSettings('');
  await openItem();
  resetPaused();
  await pressRun();
  await sleep(800);
  const noKey = await panel();
  report('US6.4 with no key, Run shows a clear "needs setup" state and sends no request',
    noKey.cls.includes('run-result--needs-key') && paused.length === 0,
    `"${noKey.text.slice(0, 80)}" · ${paused.length} judge0 requests`);

  // -------------------------------- step 9 + 6: pending state, then re-run supersedes (FR-020a/b)
  console.log('\n== US6 steps 9 & 6: pending state, then a second Run supersedes the first ==');
  await setKeyViaSettings(KEY);
  await openItem();
  // First give the panel a finished result, so we can prove the next run clears it.
  mode = 'fulfill'; nextBody = { status: { id: 3, description: 'Accepted' }, stdout: 'PREVIOUS-RESULT\n' };
  await pressRun();
  await cdp.waitFor(`document.getElementById('run-result').className.includes('run-result--output')`,
    { timeout: 15000, label: 'first result' });
  const before = await panel();

  mode = 'stall'; resetPaused();
  await pressRun();
  await cdp.waitFor(`document.getElementById('run-result').className.includes('run-result--pending')`,
    { timeout: 10000, label: 'pending' });
  const pending = await panel();
  const btnPending = await runBtn();
  report('US6.9 an explicit "running" state appears, visually distinct from idle and from a result',
    pending.cls.includes('run-result--pending') && !pending.cls.includes('run-result--idle') &&
    /running/i.test(pending.text) && /Running/.test(btnPending.text),
    `panel class "${pending.cls}", button "${btnPending.text}"`);
  report('US6.9 the previous run\'s output is cleared the moment the new run starts',
    before.text.includes('PREVIOUS-RESULT') && !pending.text.includes('PREVIOUS-RESULT'),
    'panel no longer shows the earlier stdout');

  // Second press while the first is still stalled: the first must be aborted and never render.
  mode = 'fulfill'; nextBody = { status: { id: 3, description: 'Accepted' }, stdout: 'SECOND-RUN-ONLY\n' };
  await pressRun();
  await cdp.waitFor(`document.getElementById('run-result').className.includes('run-result--output')`,
    { timeout: 15000, label: 'second result' });
  await sleep(2000);   // give any stale first-run handler a chance to (wrongly) paint
  const afterRerun = await panel();
  report('US6.6 pressing Run again aborts the in-flight run; only the newest result ever renders',
    afterRerun.text.includes('SECOND-RUN-ONLY') && !afterRerun.text.includes('PREVIOUS-RESULT') && paused.length >= 2,
    `panel shows "${afterRerun.text.slice(0, 40)}"; ${paused.length} judge0 requests seen`);

  // ------------------------------------- steps 2 & 3 (simulated): response -> panel mapping
  console.log('\n== US6 steps 2-3 (contract mapping, simulated responses — no live key) ==');
  mode = 'fulfill'; nextBody = { status: { id: 3, description: 'Accepted' }, stdout: '[0, 1]\n' };
  await pressRun();
  await cdp.waitFor(`document.getElementById('run-result').className.includes('run-result--output')`, { timeout: 15000 });
  const okRun = await panel();
  report('US6.2 an accepted run renders raw stdout with no pass/fail verdict',
    okRun.cls.includes('run-result--output') && okRun.text.includes('[0, 1]') &&
    !/pass|fail|correct|wrong/i.test(okRun.text), `"${okRun.text.slice(0, 60)}"`);

  nextBody = { status: { id: 6, description: 'Compilation Error' }, compile_output: "error: expecting '}'" };
  await pressRun();
  await cdp.waitFor(`document.getElementById('run-result').className.includes('run-result--compile-error')`, { timeout: 15000 });
  const compileRun = await panel();
  report('US6.3 a compile failure renders a readable compile error in place of output',
    compileRun.cls.includes('run-result--compile-error') && compileRun.text.includes("expecting '}'"),
    `"${compileRun.text.replace(/\n/g, ' ').slice(0, 70)}"`);

  nextBody = { status: { id: 11, description: 'Runtime Error (NZEC)' }, stderr: 'java.lang.ArithmeticException' };
  await pressRun();
  await cdp.waitFor(`document.getElementById('run-result').className.includes('run-result--runtime-error')`, { timeout: 15000 });
  const rtRun = await panel();
  report('US6.3 a runtime failure renders the runtime error and stderr',
    rtRun.cls.includes('run-result--runtime-error') && rtRun.text.includes('ArithmeticException'),
    `"${rtRun.text.replace(/\n/g, ' ').slice(0, 70)}"`);

  // ------------------------------------------------- step 12: key hygiene (FR-018a)
  console.log('\n== US6 step 12: key hygiene on failure ==');
  mode = 'fail';
  await pressRun();
  await cdp.waitFor(`document.getElementById('run-result').className.includes('run-result--needs-connection')`, { timeout: 15000 });
  const failPanel = await panel();
  const leaked = {
    console: consoleLog.lines.some(l => l.text.includes(KEY)),
    dom: await cdp.eval(`document.documentElement.outerHTML.includes(${JSON.stringify(KEY)})`),
    urls: allRequests.urls.filter(u => u.includes(KEY)).length,
    headerCarried: paused.some(p => Object.entries(p.headers).some(([k, v]) => /x-rapidapi-key/i.test(k) && v === KEY)),
  };
  report('US6.12 the key travels only in the X-RapidAPI-Key header — never console, DOM, or URL',
    !leaked.console && !leaked.dom && leaked.urls === 0 && leaked.headerCarried,
    `header carries it: ${leaked.headerCarried}; console/DOM/URL leaks: ${leaked.console}/${leaked.dom}/${leaked.urls}`);
  report('US6.12 the failure shows fixed copy, not a dump of the outgoing request',
    !/rapidapi|header|token|key=/i.test(failPanel.text.replace(/Judge0 CE key/i, '')),
    `"${failPanel.text.slice(0, 70)}"`);

  // ------------------------------------------------- step 5: offline
  console.log('\n== US6 step 5: offline ==');
  await cdp.send('Fetch.disable');
  await openItem();
  await cdp.eval(`(() => { const t = document.getElementById('scratchpad');
    t.value = 'fun twoSum(nums: IntArray, target: Int): IntArray { return intArrayOf(0,1) }';
    t.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  const codeBefore = await cdp.eval(`document.getElementById('scratchpad').value`);
  await cdp.offline(true);
  await pressRun();
  await cdp.waitFor(`document.getElementById('run-result').className.includes('run-result--needs-connection')`,
    { timeout: 20000, label: 'offline result' });
  const offlinePanel = await panel();
  const codeAfter = await cdp.eval(`document.getElementById('scratchpad').value`);
  report('US6.5 offline shows "Run needs a connection" and leaves the in-progress code untouched',
    /connection/i.test(offlinePanel.text) && codeAfter === codeBefore,
    `"${offlinePanel.text.slice(0, 60)}" · editor unchanged (${codeAfter.length} chars)`);

  // ------------------------------------------------- step 8: everything else works offline
  console.log('\n== US6 step 8: the rest of the app still works offline with no key ==');
  await setKeyViaSettings('');
  const views = {};
  for (const [name, hash, marker] of [
    ['Topics', '#/topics', '#topics-list'],
    ['Drill', '#/drill', '#drill-card, .empty-state'],
    ['Mock', '#/mock', '.card'],
    ['Cheat sheets', '#/cheatsheets', '.card'],
  ]) {
    await cdp.goHash(hash);
    await sleep(700);
    views[name] = await cdp.eval(`(() => { const el = document.querySelector(${JSON.stringify(marker)});
      return !!el && document.getElementById('view').innerText.trim().length > 40; })()`);
  }
  report('US6.8 Topics, Drill, Mock and Cheat Sheets all render offline with no key',
    Object.values(views).every(Boolean), Object.entries(views).map(([k, v]) => `${k}:${v ? 'ok' : 'FAIL'}`).join(' '));
  await cdp.offline(false);

  // ------------------------------------------------- step 7: code persists, result does not
  console.log('\n== US6 step 7: navigating away and back ==');
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: JUDGE0, requestStage: 'Request' }] });
  await setKeyViaSettings(KEY);
  await openItem();
  mode = 'fulfill'; nextBody = { status: { id: 3, description: 'Accepted' }, stdout: 'STALE-OUTPUT\n' };
  await pressRun();
  await cdp.waitFor(`document.getElementById('run-result').className.includes('run-result--output')`, { timeout: 15000 });
  await cdp.goHash('#/dsa');
  await cdp.waitFor(`!document.getElementById('scratchpad')`, { timeout: 10000, label: 'left item' });
  await openItem();
  const back = await cdp.eval(`(() => ({
    code: document.getElementById('scratchpad').value,
    panelCls: document.getElementById('run-result').className,
    panelText: document.getElementById('run-result').innerText,
  }))()`);
  report('US6.7 the candidate\'s code is restored, the previous run\'s output is not',
    back.code.includes('return intArrayOf(0,1)') && back.panelCls.includes('run-result--idle') &&
    !back.panelText.includes('STALE-OUTPUT'),
    `code restored (${back.code.length} chars); panel back to idle`);

  // ------------------------------------------------- step 11: not-runnable (FR-019c)
  console.log('\n== US6 step 11: an item with no sampleCall ==');
  await cdp.eval(`(async () => {
    const db = await new Promise((res) => { const r = indexedDB.open('aip', 1); r.onsuccess = () => res(r.result); });
    const cur = await new Promise((res) => { const q = db.transaction('snapshot').objectStore('snapshot').get('current'); q.onsuccess = () => res(q.result); });
    for (const p of Object.values(cur.packs)) for (const it of p.items) if (it.id === ${JSON.stringify(ITEM)}) it.sampleCall = '';
    await new Promise((res) => { const t = db.transaction('snapshot', 'readwrite'); t.objectStore('snapshot').put(cur, 'current'); t.oncomplete = res; });
    db.close(); return true;
  })()`);
  await cdp.blockUrls(['*content/manifest.json*']);   // keep auto-sync from restoring it mid-check
  await cdp.navigate(ORIGIN);
  await cdp.waitFor('window.__probe.shellReadyAt !== null', { label: 'reload' });
  await openItem();
  resetPaused();
  const nr = await runBtn();
  const nrPanel = await panel();
  await pressRun();
  await sleep(1000);
  report('US6.11 Run is disabled with a plain explanation, and no request is sent',
    nr.disabled && /no runnable sample case/i.test(nr.title + ' ' + nrPanel.text) && paused.length === 0,
    `button disabled, panel "${nrPanel.text.slice(0, 60)}", ${paused.length} requests`);
  report('US6.11 the not-runnable state reads as normal, not as an error',
    !/error|failed|couldn't|invalid/i.test(nrPanel.text) && !nrPanel.cls.includes('error') &&
    nrPanel.cls.includes('run-result--idle'),
    `panel class "${nrPanel.cls}", copy "${nrPanel.text}"`);

  // Restore it directly: the manifest version is unchanged, so auto-sync correctly short-circuits
  // and will not undo a local snapshot edit.
  await cdp.eval(`(async () => {
    const db = await new Promise((res) => { const r = indexedDB.open('aip', 1); r.onsuccess = () => res(r.result); });
    const cur = await new Promise((res) => { const q = db.transaction('snapshot').objectStore('snapshot').get('current'); q.onsuccess = () => res(q.result); });
    for (const p of Object.values(cur.packs)) for (const it of p.items) if (it.id === ${JSON.stringify(ITEM)})
      it.sampleCall = 'twoSum(intArrayOf(2, 7, 11, 15), 9).contentToString()';
    await new Promise((res) => { const t = db.transaction('snapshot', 'readwrite'); t.objectStore('snapshot').put(cur, 'current'); t.oncomplete = res; });
    db.close(); return true;
  })()`);
  await cdp.blockUrls([]);

  // ------------------------------------------------- step 10: 30s timeout (FR-020c)
  console.log('\n== US6 step 10: stalled request must abort at ~30s (this takes 30s) ==');
  await cdp.navigate(ORIGIN);
  await cdp.waitFor('window.__probe.shellReadyAt !== null', { timeout: 60000 });
  await openItem();
  const runnableAgain = await runBtn();
  report('US6.10 (setup) the restored item is runnable again', !runnableAgain.disabled, 'Run enabled');
  mode = 'stall'; resetPaused();
  const t0 = Date.now();
  await pressRun();
  await cdp.waitFor(`document.getElementById('run-result').className.includes('run-result--pending')`, { timeout: 10000 });
  await cdp.waitFor(`document.getElementById('run-result').className.includes('run-result--needs-connection')`,
    { timeout: 45000, interval: 200, label: '30s abort' });
  const elapsed = (Date.now() - t0) / 1000;
  const timeoutPanel = await panel();
  report('US6.10 a stalled run aborts at ~30 seconds rather than spinning forever',
    elapsed >= 28 && elapsed <= 34 && /timed out after 30 seconds/i.test(timeoutPanel.text),
    `aborted after ${elapsed.toFixed(1)}s — "${timeoutPanel.text.slice(0, 60)}"`);

  const EXPECTED = /ERR_INTERNET_DISCONNECTED|ERR_BLOCKED_BY_CLIENT|ERR_FAILED|Failed to load resource|judge0/i;
  const errs = consoleLog.lines.filter(l => (l.type === 'error' || l.type === 'exception') && !EXPECTED.test(l.text));
  report('US6 no console errors beyond the deliberate network failures', errs.length === 0,
    errs.map(e => e.text).join(' | ').slice(0, 300) || 'clean');
} finally {
  await cdp.close();
}
