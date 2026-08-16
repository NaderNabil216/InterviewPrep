// 003-swap-code-runner verification — US1/US2 walkthrough against the live Judge0 CE public
// instance (ce.judge0.com). Reuses the 002 CDP driver. Run with the site served on :8777.
import { CDP, ORIGIN, PROBE, report, sleep } from '../../002-improvements/verification/cdp.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const JUDGE0 = 'https://ce.judge0.com';
const RAPIDAPI = 'judge0-ce.p.rapidapi.com';
const ITEM = 'ds-0020'; // groupAnagrams — has a sampleCall driver
const CORRECT = `fun groupAnagrams(words: Array<String>): List<List<String>> {
    return words.groupBy { it.toCharArray().sorted().joinToString() }.values.toList()
}`;
const BROKEN = `fun groupAnagrams(words: Array<String>): List<List<String>> {
    val x: Int = "oops"
    return emptyList()
}`;
const INFINITE = `fun groupAnagrams(words: Array<String>): List<List<String>> {
    while (true) { }
    return emptyList()
}`;

const hasKeyField = (t) => /judge0-key|Paste your RapidAPI key/.test(t);

const cdp = new CDP();
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aip-003-'));

let pass = true;
function chk(name, ok, detail) {
  if (!ok) pass = false;
  report(name, ok, detail);
}

function setScratch(id, code) {
  return cdp.eval(`(async () => {
    const ta = document.getElementById('scratchpad');
    if (ta) {
      ta.value = ${JSON.stringify(code)};
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const s = JSON.parse(localStorage.getItem('aip.v1.scratch.${id}') || 'null') || {};
    s.code = ${JSON.stringify(code)};
    localStorage.setItem('aip.v1.scratch.${id}', JSON.stringify(s));
    return true;
  })()`);
}

async function pressRunAndRead() {
  await cdp.eval(`(() => {
    const b = document.getElementById('run-btn');
    if (!b || b.disabled) return 'no-run-btn';
    b.click(); return 'clicked';
  })()`);
  const box = await cdp.waitFor(`(() => {
    const r = document.getElementById('run-result');
    return r && !r.className.includes('run-result--pending') && !r.className.includes('run-result--idle') ? r.className : null;
  })()`, { timeout: 45000, label: 'run terminal state' });
  const text = await cdp.eval(`document.getElementById('run-result').textContent`);
  return { box, text };
}

try {
  await cdp.launch({ userDataDir });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE });

  // ---- US2 scenario 1/2: stale RapidAPI key discarded; boot without it; zero RapidAPI traffic ----
  await cdp.navigate(ORIGIN);
  await cdp.eval(`(() => {
    localStorage.setItem('aip.v1.settings', JSON.stringify({
      theme: 'dark', interviewDate: null, lastSeenChangelog: null,
      judge0ApiKey: 'stale-rapidapi-key-12345',
    }));
    return true;
  })()`);
  const urls = cdp.recordRequests();
  await cdp.eval(`(() => { location.reload(); return true; })()`).catch(() => {});
  await cdp.waitFor(`!!window.__probe && /\\d+ items/.test((document.getElementById('view')||{}).textContent || '')`,
    { timeout: 30000, label: 'app boot with content' });
  await sleep(500);
  const stored = await cdp.eval(`JSON.parse(localStorage.getItem('aip.v1.settings') || '{}')`);
  chk('US2.1 stale RapidAPI key is discarded from storage after boot',
    stored.judge0ApiKey === undefined, `settings=${JSON.stringify(stored)}`);
  chk('US2.2 zero requests to RapidAPI during boot', !urls.urls.some(u => u.includes(RAPIDAPI)),
    urls.urls.filter(u => u.includes('judge0')).join(', ') || 'no judge0 traffic');

  // ---- Settings: no credential field, no-card guidance (FR-002/FR-004) ----
  await cdp.goHash('#/settings');
  await cdp.waitFor(`!!document.getElementById('theme-select')`, { label: 'settings view' });
  const settingsText = await cdp.eval(`document.getElementById('view').textContent`);
  chk('US2.3 settings has no credential field', !hasKeyField(settingsText), 'no judge0-key input rendered');
  chk('FR-004 settings states no key/account/card needed',
    /no account, no API key, and no payment details/i.test(settingsText), 'guidance text present');
  chk('FR-002 no RapidAPI reference visible in settings', !/rapidapi/i.test(settingsText), 'no rapidapi mention');

  // ---- US1: press Run with nothing configured -> real output ----
  await cdp.goHash(`#/dsa/${ITEM}`);
  await cdp.waitFor(`!!document.getElementById('run-btn')`, { label: 'dsa detail' });
  await setScratch(ITEM, CORRECT);
  urls.urls.length = 0;
  const good = await pressRunAndRead();
  chk('US1.1 no-key Run reaches the output state', good.box.includes('run-result--output'),
    `state=${good.box}`);
  chk('US1.1 output shows the real stdout', good.text.includes('[eat, tea, ate]'),
    `stdout snippet present in "${good.text.slice(0, 120)}"`);
  chk('US1.1 request went to ce.judge0.com, not RapidAPI',
    urls.urls.some(u => u.startsWith(JUDGE0)) && !urls.urls.some(u => u.includes(RAPIDAPI)),
    urls.urls.filter(u => u.includes('judge0')).join(' | '));

  // ---- US1 scenario 3: compile failure is readable ----
  await setScratch(ITEM, BROKEN);
  const ce = await pressRunAndRead();
  chk('US1.3 compile error renders in the compile-error state',
    ce.box.includes('run-result--compile-error') && /compilation failed/i.test(ce.text),
    `state=${ce.box} "${ce.text.slice(0, 100)}"`);

  // ---- US1 scenario 5 / US3 scenario 1: infinite loop -> stopped for running too long ----
  await setScratch(ITEM, INFINITE);
  const tle = await pressRunAndRead();
  chk('US3.1 infinite loop reads as stopped-for-too-long, not a request failure',
    /stopped for running too long/i.test(tle.text), `state=${tle.box} "${tle.text.slice(0, 100)}"`);

  // ---- US1 scenario 4: runtime failure distinguished ----
  await setScratch(ITEM, `fun groupAnagrams(words: Array<String>): List<List<String>> {
    throw RuntimeException("boom")
    return emptyList()
  }`);
  const rt = await pressRunAndRead();
  chk('US1.4 runtime failure renders in the runtime-error state',
    rt.box.includes('run-result--runtime-error'), `state=${rt.box} "${rt.text.slice(0, 100)}"`);

  // ---- FR-018: second Run supersedes an in-flight one ----
  await setScratch(ITEM, CORRECT);
  await cdp.eval(`(() => {
    const b = document.getElementById('run-btn'); b.click(); b.click();
    return true;
  })()`);
  await cdp.waitFor(`document.getElementById('run-result').className.includes('run-result--output')`,
    { timeout: 45000, label: 'superseded run resolves' });
  const final = await cdp.eval(`document.getElementById('run-result').textContent`);
  chk('FR-018 supersede: newest run wins, no stale/duplicate painting', /\[eat, tea, ate\]/.test(final),
    `"${final.slice(0, 80)}"`);

  // ---- US4: offline, no outbound attempt anywhere but a deliberate Run press ----
  await cdp.offline(true);
  await cdp.goHash('#/dashboard');
  await cdp.waitFor(`!!document.querySelector('h1')`, { label: 'dashboard offline' });
  await sleep(400);
  const offline = cdp.recordRequests();
  await cdp.goHash(`#/dsa/${ITEM}`);
  await cdp.waitFor(`!!document.getElementById('scratchpad')`, { label: 'dsa detail offline' });
  await sleep(400);
  chk('US4.1 offline use of non-Run views attempts zero outbound requests', offline.urls.length === 0,
    offline.urls.join(' | ') || 'no requests');
  const failRun = await pressRunAndRead();
  chk('US4.2 offline Run ends in a readable connectivity state',
    /couldn't reach the runner|timed out/i.test(failRun.text), `state=${failRun.box}`);
  await cdp.offline(false);

  console.log(pass ? '\nAll checks passed.' : '\nSome checks FAILED.');
} catch (err) {
  console.error('\nVERIFICATION ABORTED: ' + err.message);
  console.error(err.stack || '');
  process.exitCode = 1;
} finally {
  await cdp.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
}