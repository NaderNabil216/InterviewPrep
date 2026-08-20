#!/usr/bin/env node
// aip-verify.mjs — headless-Chrome CDP driver for feature 007's quickstart.md browser pass.
// Usage: node aip-verify.mjs   (servers on 8777 feature branch, 8778 origin/main worktree)
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const FEAT = 'http://localhost:8777';
const BASE = 'http://localhost:8778';
const results = [];
const ok = (name, cond, detail = '') => { results.push({ name, ok: !!cond, detail }); console.log(`${cond ? '✓' : '✗'} ${name}${cond ? '' : `  — ${detail}`}`); };

class Page {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); }
  static async create(port, url) {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const tab = list.find(t => t.type === 'page');
    await fetch(`http://127.0.0.1:${port}/json/activate/${tab.id}`);
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const page = new Page(ws);
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && page.pending.has(m.id)) { page.pending.get(m.id)(m); page.pending.delete(m.id); }
    };
    await page.send('Page.enable'); await page.send('Runtime.enable');
    if (url) await page.send('Page.navigate', { url });
    return page;
  }
  static async openTab(port, url) {
    const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?` + encodeURIComponent(url), { method: 'PUT' })).json();
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const page = new Page(ws);
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && page.pending.has(m.id)) { page.pending.get(m.id)(m); page.pending.delete(m.id); }
    };
    await page.send('Page.enable'); await page.send('Runtime.enable');
    return page;
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res) => { this.pending.set(id, res); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  async eval(expr) {
    const m = await this.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, userGesture: true });
    if (m.result?.exceptionDetails) throw new Error(m.result.exceptionDetails.exception?.description || m.result.exceptionDetails.text);
    return m.result?.result?.value;
  }
  async waitFor(expr, timeout = 20000) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      try { if (await this.eval(expr)) return; } catch { /* mid-navigation */ }
      await new Promise(r => setTimeout(r, 200));
    }
    let body = '?';
    try { body = (await this.eval(`document.body.innerText.slice(0, 200)`)) || '?'; } catch { }
    throw new Error(`waitFor timed out: ${expr}\n  body: ${String(body).replace(/\n/g, ' | ')}`);
  }
  async nav(hash) {
    await this.eval(`location.hash = ${JSON.stringify(hash)}`);
    await this.waitFor(`document.querySelector('.topbar')`);
    await new Promise(r => setTimeout(r, 900));
  }
  async reload() { await this.send('Page.reload', { ignoreCache: true }); await this.waitFor(`document.querySelector('.topbar')`); }
  async boot() { await this.waitFor(`document.querySelector('.topbar')`); await new Promise(r => setTimeout(r, 800)); }
  close() { this.ws.close(); }
}

const q = JSON.stringify;
const SEED_HELPERS = `
window.KEY='aip.v1.progress';
const P=()=>JSON.parse(localStorage.getItem(KEY)||'{}');
const save=p=>localStorage.setItem(KEY,JSON.stringify(p));
const localISO=(o=0)=>{const d=new Date();d.setDate(d.getDate()+o);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const rated=(due,interval=3)=>({status:interval>=21?'known':'learning',ease:2.5,interval,reps:1,lapses:0,due,lastRated:new Date().toISOString(),lastRating:'good'});
const snap=async()=>{const{Store}=await import('/assets/js/store.js');for(let i=0;i<50;i++){const s=await Store.getSnapshot();if(s&&s.items&&s.items.length)return s;await new Promise(r=>setTimeout(r,200));}return null;};
const complete=async(track,n,dueOffset=3)=>{const s=await snap();const ids=s.items.filter(i=>i.track===track).slice(0,n).map(i=>i.id);const p=P();for(const id of ids)p[id]=rated(localISO(dueOffset));save(p);return ids;};
const fullCover=async(track)=>{const s=await snap();await complete(track,s.items.filter(i=>i.track===track).length);};
const reset=async()=>{for(const k of Object.keys(localStorage))if(k.startsWith('aip.v1.'))localStorage.removeItem(k);try{indexedDB.deleteDatabase('aip');}catch{};};
const trackTotal=async(track)=>(await snap()).items.filter(i=>i.track===track).length;
const planSig=async(planId,dayIdx=0,min=3)=>{const s=await snap();const plan=s.plans[planId];const tasks=plan.days[dayIdx].tasks;const i=tasks.findIndex(t=>(t.itemIds||[]).length>=min);const t=tasks[i];return {idx:i,ids:t.itemIds,sig:[...t.itemIds].sort().join('+'),label:t.label};};
const reviewQueueHas=async(id)=>{const{reviewQueue}=await import('/assets/js/progress.js');const s=await snap();const p=P();return reviewQueue(s.items,p,undefined).some(it=>it.id===id);};
`;

async function main() {
  const userData = mkdtempSync(join(tmpdir(), 'aip-verify-'));
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${userData}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1280,1000',
    'about:blank',
  ], { stdio: 'ignore' });
  for (let i = 0; i < 40; i++) {
    try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch { await new Promise(r => setTimeout(r, 250)); }
  }
  let page;
  try {
    page = await Page.create(PORT, FEAT + '/#/dashboard');
    await page.boot();
    const inject = () => page.eval(SEED_HELPERS);
    await inject();

    console.log('§B — progress reflects completions');
    await page.eval('reset()'); await page.reload(); await inject(); await page.nav('#/dashboard');
    await page.waitFor(`document.body.innerText.includes('due for review')`);
    const hero = await page.eval(`document.querySelector('.hero .muted').innerText`);
    ok('B1 hero all-zero', /0 completed · 629 not started/.test(hero), hero);
    const rows0 = await page.eval(`[...document.querySelectorAll('.coverage-row')].map(r=>r.children[2].innerText)`);
    ok('B1 coverage all zero', rows0.every(t => /^0\/\d+ · 0%$/.test(t)), rows0.join('|'));
    const queue0 = await page.eval(`[...document.querySelectorAll('.card')].find(c=>c.querySelector('.eyebrow')?.textContent?.trim()==='Review queue').querySelector('h2').innerText`);
    ok('B1 review queue 0', queue0 === '0 due for review', queue0);

    await page.eval(`complete('data-networking',10)`); await page.reload(); await inject(); await page.nav('#/dashboard');
    await page.waitFor(`document.body.innerText.includes('due for review')`);
    const dnTotal = await page.eval(`trackTotal('data-networking')`);
    const dnRow = await page.eval(`[...document.querySelectorAll('.coverage-row')].find(r=>r.children[0].innerText==='Data, Networking & Persistence')?.children[2].innerText`);
    ok('B2 10 of track = correct %', dnRow === `10/${dnTotal} · ${Math.round(10 / dnTotal * 100)}%`, dnRow);

    await page.eval('reset()'); await page.reload(); await inject();
    const kotId = await page.eval(`(async()=>{const s=await snap();return s.items.find(i=>i.track==='kotlin').id;})()`);
    await page.nav(`#/item/${kotId}`);
    await page.waitFor(`document.querySelector('#mark-complete')`);
    await page.eval(`document.querySelector('#mark-complete').click()`);
    await page.waitFor(`document.body.innerText.includes('Status: Completed')`);
    await page.nav('#/dashboard');
    await page.waitFor(`document.body.innerText.includes('due for review')`);
    const ktTotal = await page.eval(`trackTotal('kotlin')`);
    const ktRow = await page.eval(`[...document.querySelectorAll('.coverage-row')].find(r=>r.children[0].innerText==='Kotlin Language')?.children[2].innerText`);
    const hero3 = await page.eval(`document.querySelector('.hero .muted').innerText`);
    ok('B3 no threshold no delay', ktRow === `1/${ktTotal} · ${Math.round(100 / ktTotal)}%` && /1 completed/.test(hero3), `${ktRow} | ${hero3}`);

    await page.eval('reset()'); await page.reload(); await inject();
    await page.eval(`complete('cheatsheets',5)`); await page.reload(); await inject(); await page.nav('#/dashboard');
    await page.waitFor(`document.body.innerText.includes('due for review')`);
    const csRow = await page.eval(`[...document.querySelectorAll('.coverage-row')].find(r=>r.children[0].innerText==='Cheat Sheets')?.children[2].innerText`);
    ok('B4 full track 100%', csRow === '5/5 · 100%', csRow);

    await page.eval('reset()'); await page.reload(); await inject();
    await page.eval(`complete('kotlin',1,-2)`); await page.reload(); await inject(); await page.nav('#/dashboard');
    await page.waitFor(`document.body.innerText.includes('due for review')`);
    const ktRow5 = await page.eval(`[...document.querySelectorAll('.coverage-row')].find(r=>r.children[0].innerText==='Kotlin Language')?.children[2].innerText`);
    const queue5 = await page.eval(`[...document.querySelectorAll('.card')].find(c=>c.querySelector('.eyebrow')?.textContent?.trim()==='Review queue').querySelector('h2').innerText`);
    ok('B5 due-ness separate from completion', /1\/\d+/.test(ktRow5) && queue5 === '1 due for review', `${ktRow5} | ${queue5}`);

    await page.eval('reset()'); await page.reload(); await inject();
    const kotId2 = await page.eval(`(async()=>{const s=await snap();return s.items.find(i=>i.track==='kotlin').id;})()`);
    for (let i = 0; i < 5; i++) {
      await page.nav(`#/item/${kotId2}`);
      await page.waitFor(`document.querySelector('#mark-complete')`);
      await page.eval(`document.querySelector('#mark-complete').click()`);
      await page.reload(); await inject();
    }
    await page.nav('#/dashboard'); await page.waitFor(`document.body.innerText.includes('due for review')`);
    const ktRow6 = await page.eval(`[...document.querySelectorAll('.coverage-row')].find(r=>r.children[0].innerText==='Kotlin Language')?.children[2].innerText`);
    const hero6 = await page.eval(`document.querySelector('.hero .muted').innerText`);
    ok('B6 five completions count once', /^1\/\d+/.test(ktRow6) && /1 completed/.test(hero6), `${ktRow6} | ${hero6}`);

    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `
      window.__paint=[];
      new MutationObserver(()=>{
        const m=document.querySelector('.hero .muted');
        if(m && !window.__paint.includes(m.innerText)) window.__paint.push(m.innerText);
        const cov=[...document.querySelectorAll('.card')].find(c=>c.querySelector('.eyebrow')?.textContent?.trim()==='Coverage by track');
        if(cov && window.__covPaint===undefined) window.__covPaint=cov.innerText.slice(0,80);
      }).observe(document,{childList:true,subtree:true});` });
    await page.eval('reset()'); await page.reload();
    await page.waitFor(`document.querySelector('.topbar')`);
    await new Promise(r => setTimeout(r, 1500));
    const paint = await page.eval(`JSON.stringify({first:window.__paint[0],cov:window.__covPaint})`);
    ok('B7 cold start loading not zero', paint.includes('—') && paint.includes('Loading track coverage'), paint);
    await inject();

    await page.nav('#/dashboard'); await page.waitFor(`document.body.innerText.includes('due for review')`);
    await page.eval(`complete('compose',3)`);
    await page.eval(`document.querySelector('[data-nav="dashboard"]').click()`);
    await page.waitFor(`document.querySelector('.hero .muted').innerText.includes('3 completed')`);
    const hero8 = await page.eval(`document.querySelector('.hero .muted').innerText`);
    ok('B8 same-surface re-request fresh', /3 completed/.test(hero8), hero8);

    await page.eval('reset()'); await page.reload(); await inject();
    const kotId10 = await page.eval(`(async()=>{const s=await snap();return s.items.find(i=>i.track==='kotlin').id;})()`);
    await page.eval(`const orig=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='aip.v1.progress'){const e=new Error('quota');e.name='QuotaExceededError';throw e;}return orig.call(this,k,v);};`);
    await page.nav(`#/item/${kotId10}`);
    await page.waitFor(`document.querySelector('#mark-complete')`);
    await page.eval(`document.querySelector('#mark-complete').click()`);
    await new Promise(r => setTimeout(r, 700));
    const b10 = await page.eval(`JSON.stringify({banner:document.getElementById('storage-banner')?.hidden===false,toast:document.getElementById('toast-root')?.innerText.includes('Marked complete'),status:(document.body.innerText.match(/Status: ([^\\n]+)/)||[])[1]})`);
    ok('B10 failed save not a completion', b10.includes('"banner":true') && b10.includes('"toast":false') && b10.includes('Not started'), b10);
    await page.reload(); await inject();

    console.log('§C — every surface agrees');
    await page.eval('reset()'); await page.reload(); await inject();
    const taskInfo = await page.eval(`(async()=>{const{idx,ids}=await planSig('14day',0,3);const p={};for(const id of ids)p[id]=rated(localISO(3));save(p);localStorage.setItem('aip.v1.plan',JSON.stringify({mode:'14day',activePlan:'14day',startedAt:localISO(0),done:{},checked:{}}));return {idx,n:ids.length};})()`);
    await page.reload(); await inject(); await page.nav('#/plan');
    await page.waitFor(`document.body.innerText.toLowerCase().includes('day 1')`);
    const c1 = await page.eval(`(()=>{const cb=document.querySelector('input[data-day="0"][data-task="${taskInfo.idx}"]');const l=cb?.closest('label');return JSON.stringify({checked:cb?.checked,auto:l?.innerText.includes('auto')});})()`);
    await page.nav('#/dashboard'); await page.waitFor(`document.body.innerText.includes('due for review')`);
    const heroC1 = await page.eval(`document.querySelector('.hero .muted').innerText`);
    ok('C1 full task -> done + auto chip', c1.includes('"checked":true') && c1.includes('"auto":true'), `${c1} | ${heroC1}`);
    ok('C1 hero counts them', new RegExp(`${taskInfo.n} completed`).test(heroC1), heroC1);

    await page.eval(`(async()=>{const{ids}=await planSig('14day',0,3);const p={};for(const id of ids.slice(0,-1))p[id]=rated(localISO(3));save(p);})()`);
    await page.reload(); await inject(); await page.nav('#/plan');
    await page.waitFor(`document.body.innerText.toLowerCase().includes('day 1')`);
    const c2 = await page.eval(`document.querySelector('input[data-day="0"][data-task="${taskInfo.idx}"]')?.checked`);
    ok('C2 partial task unticked', c2 === false, String(c2));

    await page.eval('reset()'); await page.reload(); await inject();
    await page.eval(`complete('data-networking',10)`); await page.reload(); await inject();
    await page.nav('#/topics');
    await page.waitFor(`document.querySelector('#f-status')`);
    const c3 = await page.eval(`(async()=>{const st=document.querySelector('#f-status');st.value='completed';st.dispatchEvent(new Event('change'));const tr=document.querySelector('#f-track');if(tr){tr.value='data-networking';tr.dispatchEvent(new Event('change'));}await new Promise(r=>setTimeout(r,400));return document.querySelectorAll('#topics-list .item-row').length;})()`);
    ok('C3 topics completed = 10', c3 === 10, String(c3));
    const c4 = await page.eval(`[...document.querySelector('#f-status').options].map(o=>o.value).join(',')`);
    ok('C4 status options exactly four', c4 === 'all,not-started,completed,new-content', c4);
    await page.nav('#/topics?status=known');
    await page.waitFor(`document.body.innerText.includes('questions match your filters')`);
    const c4b = await page.eval(`document.body.innerText.match(/(\\d+) of (\\d+) questions match/)?.[1]`);
    ok('C4b legacy status falls back', c4b !== undefined && parseInt(c4b) > 0, c4b);
    // SC-003 cross-check: per track, dashboard row n/total == Topics completed count (11 topics tracks)
    const tracks = ['kotlin','coroutines-flow','compose','platform','architecture','data-networking','performance','build-testing','security-kmp','behavioral','cheatsheets'];
    const xcheck = await page.eval(`(async()=>{
      const s=await snap();const p={};
      for(const t of ${q(tracks)}){for(const id of s.items.filter(i=>i.track===t).slice(0,3).map(i=>i.id))p[id]=rated(localISO(3));}
      save(p);return true;})()`);
    await page.reload(); await inject();
    const TITLE = { 'kotlin':'Kotlin Language', 'coroutines-flow':'Coroutines & Flow', 'compose':'Jetpack Compose', 'platform':'Platform & Framework', 'architecture':'Architecture & DI', 'data-networking':'Data, Networking & Persistence', 'performance':'Performance & App Health', 'build-testing':'Build, Tooling & Testing', 'security-kmp':'Security, KMP & Modern Android', 'behavioral':'Behavioral & Interview Craft', 'cheatsheets':'Cheat Sheets' };
    let mismatches = [];
    for (const t of tracks) {
      const dashRow = await page.eval(`(async()=>{await new Promise(r=>{location.hash='#/dashboard';setTimeout(r,500);});const row=[...document.querySelectorAll('.coverage-row')].find(r=>r.children[0].innerText===${q(TITLE[t])})?.children[2].innerText;return row||'';})()`);
      const dashN = parseInt((dashRow || '').match(/^(\d+)\//)?.[1]);
      await page.nav('#/topics'); await page.waitFor(`document.querySelector('#f-status')`);
      const topN = await page.eval(`(async()=>{const st=document.querySelector('#f-status');st.value='completed';st.dispatchEvent(new Event('change'));const tr=document.querySelector('#f-track');tr.value=${q(t)};tr.dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,350));return document.querySelectorAll('#topics-list .item-row').length;})()`);
      if (dashN !== topN) mismatches.push(`${t}: dash ${dashN} vs topics ${topN}`);
    }
    ok('C3b SC-003 cross-check 11 tracks', mismatches.length === 0, mismatches.join('; '));

    await page.nav('#/dashboard'); await page.waitFor(`document.body.innerText.includes('due for review')`);
    const c5 = await page.eval(`document.body.innerText.includes('DSA and System Design have their own workspaces')`);
    ok('C5 populations named', c5 === true, String(c5));

    await page.eval('reset()'); await page.reload(); await inject();
    await page.eval(`complete('kotlin',1,-2)`); await page.eval(`complete('compose',2,-1)`);
    await page.reload(); await inject(); await page.nav('#/dashboard');
    await page.waitFor(`document.body.innerText.includes('due for review')`);
    const dueN = await page.eval(`[...document.querySelectorAll('.card')].find(c=>c.querySelector('.eyebrow')?.textContent?.trim()==='Review queue').querySelector('h2').innerText`);
    const dueCount = parseInt(dueN);
    await page.eval(`document.querySelector('#go-drill').click()`);
    await page.waitFor(`document.querySelector('#mark-complete')`);
    for (let i = 0; i < dueCount; i++) {
      await page.eval(`document.querySelector('#mark-complete').click()`);
      await new Promise(r => setTimeout(r, 350));
      const done = await page.eval(`!document.querySelector('#mark-complete') && document.body.innerText.includes('cards reviewed')`);
      if (done) break;
      await page.waitFor(`document.querySelector('#mark-complete')`);
    }
    await page.eval(`location.hash='#/dashboard'`);
    await page.waitFor(`[...document.querySelectorAll('.card')].find(c=>c.querySelector('.eyebrow')?.textContent?.trim()==='Review queue')?.querySelector('h2').innerText==='0 due for review'`);
    const queueC6 = await page.eval(`[...document.querySelectorAll('.card')].find(c=>c.querySelector('.eyebrow')?.textContent?.trim()==='Review queue').querySelector('h2').innerText`);
    ok('C6 due figure driven to 0', queueC6 === '0 due for review', `${dueN} -> ${queueC6}`);

    console.log('§D — US3 notes are notes');
    await page.eval('reset()'); await page.reload(); await inject();
    const noteId = await page.eval(`(async()=>{const s=await snap();return s.items.find(i=>i.track==='kotlin').id;})()`);
    await page.nav(`#/item/${noteId}`);
    await page.waitFor(`document.querySelector('#notes')`);
    await page.eval(`const t=document.querySelector('#notes');t.value='memory hook';t.dispatchEvent(new Event('change'));`);
    await new Promise(r => setTimeout(r, 400));
    await page.nav('#/dashboard'); await page.waitFor(`document.body.innerText.includes('due for review')`);
    const heroD1 = await page.eval(`document.querySelector('.hero .muted').innerText`);
    ok('D1 note != completion', /0 completed/.test(heroD1), heroD1);
    const d2 = await page.eval(`reviewQueueHas('${noteId}')`);
    ok('D2 noted question offered in review', d2 === true, String(d2));
    const d4 = await page.eval(`(async()=>{const{statusOf}=await import('/assets/js/progress.js');const p=P();return statusOf(p,'${noteId}');})()`);
    ok('D4 topics state not-started', d4 === 'not-started', d4);
    const d5 = await page.eval(`(async()=>{
      const s=await snap();const p={};const{ids}=await planSig('14day',0,3);const id=ids[0];
      p[id]={notes:'memory hook'};save(p);
      const t=s.plans['14day'].days[0].tasks.find(t=>t.itemIds&&t.itemIds.includes(id));
      const sig=[...t.itemIds].sort().join('+');
      localStorage.setItem('aip.v1.plan',JSON.stringify({mode:'14day',activePlan:'14day',startedAt:localISO(0),done:{},checked:{}}));
      return {sig,id};})()`);
    await page.reload(); await inject(); await page.nav('#/plan');
    await page.waitFor(`document.body.innerText.toLowerCase().includes('day 1')`);
    const d5r = await page.eval(`(()=>{const cb=document.querySelector('input[data-sig="${d5.sig}"]');const l=cb?.closest('label');return JSON.stringify({checked:cb?.checked,auto:l?.innerText.includes('auto'),notice:document.body.innerText.includes('could not be saved')});})()`);
    const d5b = await page.eval(`reviewQueueHas(${q(d5.id)})`);
    ok('D5 F2 silently corrected + offered', d5r.includes('"checked":false') && d5r.includes('"auto":false') && d5r.includes('"notice":false') && d5b === true, `${d5r} | offered=${d5b}`);
    await page.nav(`#/item/${d5.id}`);
    await page.waitFor(`document.querySelector('#notes')`);
    const d5note = await page.eval(`document.querySelector('#notes')?.value`);
    ok('D5 note persists in textarea', d5note === 'memory hook', d5note);

    console.log('§D — US4 recommendations');
    await page.eval('reset()'); await page.reload(); await inject();
    await page.eval(`complete('data-networking',36)`); await page.eval(`complete('performance',4)`);
    await page.eval(`(async()=>{const s=await snap();for(const t of new Set(s.items.map(i=>i.track)))if(t!=='data-networking'&&t!=='performance')await fullCover(t);})()`);
    await page.reload(); await inject(); await page.nav('#/plan');
    await page.waitFor(`document.body.innerText.toLowerCase().includes('weakest tracks')`);
    const u41 = await page.eval(`(()=>{const card=[...document.querySelectorAll('.card')].find(c=>c.querySelector('.eyebrow')?.textContent?.trim()==='Weakest tracks');return [...card.querySelectorAll('.row span:first-child')].map(s=>s.innerText);})()`);
    ok('US4#1 weaker track ranks lower', u41.indexOf('performance') < u41.indexOf('data-networking'), u41.join(','));
    await page.nav('#/dashboard'); await page.waitFor(`document.body.innerText.includes('due for review')`);
    const u42 = await page.eval(`(async()=>{const s=await snap();const p=P();const{isCompleted}=await import('/assets/js/progress.js');const rows=[...document.querySelectorAll('.free-today .item-row')].map(r=>({id:r.dataset.item,track:r.querySelector('.faint')?.innerText}));return JSON.stringify({allUncompleted:rows.every(r=>!isCompleted(p,r.id)),fromWeakTracks:rows.every(r=>['performance','data-networking'].includes(r.track))});})()`);
    ok('US4#2 next-up uncompleted from weak tracks', u42.includes('"allUncompleted":true') && u42.includes('"fromWeakTracks":true'), u42);
    await page.eval('reset()'); await page.reload(); await inject();
    const u43 = [];
    for (let i = 0; i < 3; i++) {
      await page.nav('#/dashboard'); await page.waitFor(`document.body.innerText.includes('due for review')`);
      u43.push(await page.eval(`[...document.querySelectorAll('.free-today .item-row .item-row__q')].map(e=>e.innerText).join('|')`));
      await page.reload(); await inject();
    }
    ok('US4#3 stable non-empty next-up', u43[0].length > 0 && u43[0] === u43[1] && u43[1] === u43[2], u43[0] ? `${u43[0].length} chars` : 'EMPTY');
    await page.eval(`complete('cheatsheets',5)`); await page.reload(); await inject(); await page.nav('#/dashboard');
    await page.waitFor(`document.body.innerText.includes('due for review')`);
    const u44 = await page.eval(`[...document.querySelectorAll('.free-today .item-row')].every(r=>r.querySelector('.faint')?.innerText!=='cheatsheets')`);
    ok('US4#4 finished track not a source', u44 === true, String(u44));

    console.log('§D — US5 local calendar');
    await page.eval('reset()'); await page.reload(); await inject();
    await page.send('Emulation.setTimezoneOverride', { timezoneId: 'Asia/Tokyo' });
    await page.reload(); await inject();
    await page.eval(`complete('kotlin',1,0)`); await page.reload(); await inject(); await page.nav('#/dashboard');
    await page.waitFor(`document.body.innerText.includes('due for review')`);
    const u51 = await page.eval(`[...document.querySelectorAll('.card')].find(c=>c.querySelector('.eyebrow')?.textContent?.trim()==='Review queue').querySelector('h2').innerText`);
    ok('US5#1 ahead of UTC offered today', u51 === '1 due for review', u51);
    await page.eval('reset()'); await page.reload(); await inject();
    await page.send('Emulation.setTimezoneOverride', { timezoneId: 'America/Los_Angeles' });
    await page.reload(); await inject();
    await page.eval(`complete('compose',1,1)`); await page.reload(); await inject(); await page.nav('#/dashboard');
    await page.waitFor(`document.body.innerText.includes('due for review')`);
    const u52 = await page.eval(`[...document.querySelectorAll('.card')].find(c=>c.querySelector('.eyebrow')?.textContent?.trim()==='Review queue').querySelector('h2').innerText`);
    ok('US5#2 behind UTC no early release', u52 === '0 due for review', u52);
    await page.send('Emulation.setTimezoneOverride', { timezoneId: '' });
    await page.reload(); await inject();
    await page.eval('reset()'); await page.reload(); await inject();
    await page.eval(`complete('kotlin',1,1)`);
    await page.reload(); await inject(); await page.nav('#/dashboard');
    await page.waitFor(`document.body.innerText.includes('due for review')`);
    const u53a = await page.eval(`[...document.querySelectorAll('.card')].find(c=>c.querySelector('.eyebrow')?.textContent?.trim()==='Review queue').querySelector('h2').innerText`);
    const tomorrow = await page.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `(()=>{const D=Date;const shift=86400000;Date=class extends D{constructor(...a){super(a.length?a:[D.now()+shift]);}static now(){return D.now()+shift;}static parse(s){return D.parse(s);}static UTC(...a){return D.UTC(...a);}};})();`,
    });
    await page.reload(); await inject(); await page.nav('#/dashboard');
    await page.waitFor(`document.body.innerText.includes('due for review')`);
    const u53b = await page.eval(`[...document.querySelectorAll('.card')].find(c=>c.querySelector('.eyebrow')?.textContent?.trim()==='Review queue').querySelector('h2').innerText`);
    await page.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: tomorrow.result.identifier });
    ok('US5#3 due exactly on the next local day', u53a === '0 due for review' && u53b === '1 due for review', `${u53a} → ${u53b}`);
    await page.reload(); await inject();

    console.log('§E — SC-009 preservation');
    const seedMixed = `(async()=>{
      const s=await snap();const p={};
      const take=(track,n)=>s.items.filter(i=>i.track===track).slice(0,n).map(i=>i.id);
      for(const id of take('kotlin',3)) p[id]=rated(localISO(3));
      for(const id of take('compose',2)) p[id]=rated(localISO(5));
      for(const id of take('data-networking',1)) p[id]=rated(localISO(-2));
      for(const id of take('kotlin',2).slice(1)) p[id]={notes:'memory hook'};
      save(p);
      const plan=s.plans['14day'];
      const task=plan.days[0].tasks.find(t=>(t.itemIds||[]).length>=2);
      const sig=[...task.itemIds].sort().join('+');
      localStorage.setItem('aip.v1.plan',JSON.stringify({mode:'14day',activePlan:'14day',startedAt:localISO(-1),done:{[sig]:true},checked:{}}));
      localStorage.setItem('aip.v1.session',JSON.stringify({lastItemId:task.itemIds[0],lastView:'item',history:[{id:task.itemIds[0],rating:'good'}]}));
      localStorage.setItem('aip.v1.mockResults',JSON.stringify([{at:new Date().toISOString(),track:'kotlin',score:3,total:5,note:'seeded'}]));
      return sig;})()`;
    const before = await Page.openTab(PORT, BASE + '/#/dashboard');
    await before.boot();
    await before.eval(SEED_HELPERS);
    await before.eval('reset()'); await before.reload(); await before.eval(SEED_HELPERS);
    await before.eval(seedMixed);
    await before.reload(); await before.boot();
    const beforeBundle = await before.eval(`(async()=>{const{Store}=await import('/assets/js/store.js');return Store.exportProgress();})()`);
    writeFileSync(join(tmpdir(), 'aip-before.json'), JSON.stringify(beforeBundle));
    console.log('  before.json:', Object.keys(beforeBundle.progress).length, 'records,', Object.keys(beforeBundle.plan.done).length, 'ticks');
    await page.eval(seedMixed);
    await page.reload(); await inject(); await page.nav('#/dashboard');
    await page.waitFor(`document.body.innerText.includes('due for review')`);
    const afterBundle = await page.eval(`(async()=>{const{Store}=await import('/assets/js/store.js');return Store.exportProgress();})()`);
    writeFileSync(join(tmpdir(), 'aip-after.json'), JSON.stringify(afterBundle));
    const keys = new Set([...Object.keys(beforeBundle.progress), ...Object.keys(afterBundle.progress)]);
    const norm = b => JSON.parse(JSON.stringify(b, (k, v) => ['lastRated', 'at', 'exportedAt'].includes(k) ? undefined : v));
    const nb = norm(beforeBundle), na = norm(afterBundle);
    let changed = 0;
    for (const k of keys) if (JSON.stringify(nb.progress[k]) !== JSON.stringify(na.progress[k])) changed++;
    ok('E progress records changed: 0', changed === 0, `${changed} changed`);
    ok('E plan.done identical', JSON.stringify(nb.plan.done) === JSON.stringify(na.plan.done));
    ok('E plan.checked identical', JSON.stringify(nb.plan.checked) === JSON.stringify(na.plan.checked));
    ok('E mockResults identical', JSON.stringify(nb.mockResults) === JSON.stringify(na.mockResults));
    const heroE = await page.eval(`document.querySelector('.hero .muted').innerText`);
    const eNote = await page.eval(`(async()=>{const s=await snap();const p=P();const{reviewQueue}=await import('/assets/js/progress.js');return reviewQueue(s.items,p,undefined).some(it=>p[it.id]?.notes);})()`);
    ok('E pre-existing completions counted', /completed/.test(heroE), heroE);
    ok('E note-only back in queue', eNote === true, String(eNote));

console.log('§F — edge cases');
    await page.eval('reset()'); await page.reload(); await inject();
    await page.eval(`complete('data-networking',10)`);
    await page.eval(`(async()=>{const p=P();p['zz-999-not-in-library']={due:localISO(1),reps:1};save(p);})()`);
    await page.reload(); await inject(); await page.nav('#/dashboard');
    await page.waitFor(`document.body.innerText.includes('due for review')`);
    const heroF6 = await page.eval(`document.querySelector('.hero .muted').innerText`);
    const maxPct = await page.eval(`Math.max(...[...document.querySelectorAll('.coverage-row')].map(r=>parseInt((r.children[2].innerText.match(/(\\d+)%/)||[])[1])))`);
    ok('F6 orphan counted nowhere, pct bounded', /10 completed/.test(heroF6) && maxPct <= 100, `${heroF6} max ${maxPct}%`);
    await page.eval('reset()'); await page.reload(); await inject();
    await page.eval(`window.__bundle = ${JSON.stringify(beforeBundle)};`);
    const importRes = await page.eval(`(async()=>{const{Store}=await import('/assets/js/store.js');const s=await snap();Store.importProgress(window.__bundle,s);const p=P();return JSON.stringify({records:Object.keys(p).length,identical:JSON.stringify(p)===${q(JSON.stringify(beforeBundle.progress))},ticks:Object.keys(JSON.parse(localStorage.getItem('aip.v1.plan')||'{}').done||{}).length});})()`);
    ok('F import byte-identical + plan ticks', importRes.includes('"identical":true') && importRes.includes('"ticks":1'), importRes);
    const noteOnDone = await page.eval(`(async()=>{const{Store}=await import('/assets/js/store.js');const s=await snap();const id=s.items.find(i=>i.track==='compose').id;const p=P();const b=p[id];Store.setItemProgress(id,{notes:'later note'});const a=Store.getItemProgress(id);return JSON.stringify({dueKept:a.due===b.due,note:a.notes});})()`);
    ok('F note on completed keeps completion', noteOnDone.includes('"dueKept":true'), noteOnDone);
    await page.eval('reset()'); await page.reload(); await inject();
    const ws = await page.eval(`(async()=>{const s=await snap();const p={};const dsa=s.items.find(i=>i.type==='dsa');p[dsa.id]={status:'learning',ease:2.5,interval:3,reps:1,lapses:0,due:localISO(-1),lastRated:new Date().toISOString(),lastRating:'good'};save(p);const{coverageByTrack,dueCountOf,isDrillable}=await import('/assets/js/progress.js');const cov=coverageByTrack(s.items,p);const all=dueCountOf(s.items,p,localISO(0));const drill=dueCountOf(s.items.filter(isDrillable),p,localISO(0));return JSON.stringify({dsaInCoverage:cov[dsa.track].completed>0,all,drill});})()`);
    await page.reload(); await inject(); await page.nav('#/dashboard');
    await page.waitFor(`document.body.innerText.includes('due for review')`);
    const queueWS = await page.eval(`[...document.querySelectorAll('.card')].find(c=>c.querySelector('.eyebrow')?.textContent?.trim()==='Review queue').querySelector('h2').innerText`);
    ok('F workspace in coverage, not in due figure', ws.includes('"dsaInCoverage":true') && queueWS === '0 due for review', `${ws} | ${queueWS}`);
    const csView = await page.eval(`(async()=>{const s=await snap();const id=s.items.find(i=>i.track==='cheatsheets').id;location.hash='#/cheatsheets/'+id;await new Promise(r=>setTimeout(r,700));return {btn:!!document.querySelector('#mark-complete'),status:(document.body.innerText.match(/Status: ([^\\n]+)/)||[])[1]};})()`);
    ok('F cheatsheet Mark complete action present', JSON.stringify(csView).includes('"btn":true'), JSON.stringify(csView));
    await page.send('Emulation.setEmulatedMedia', { media: 'print' });
    const rateHidden = await page.eval(`getComputedStyle(document.querySelector('.rate-row')).display === 'none'`);
    await page.send('Emulation.setEmulatedMedia', { media: '' });
    ok('F print preview hides the rate row', rateHidden === true, String(rateHidden));

    // F content arrives mid-study: cheatsheets at 100%, then a new item + manifest bump lands.
    // The pack/manifest files are mutated on disk and restored in the finally below.
    const MANIFEST = '/Users/nn/InterviewPrep/content/manifest.json';
    const PACK = '/Users/nn/InterviewPrep/content/packs/cheatsheets.json';
    const origManifest = readFileSync(MANIFEST, 'utf8');
    const origPack = readFileSync(PACK, 'utf8');
    const mutateContent = () => {
      const p = JSON.parse(origPack);
      const newId = 'cs-9999-midstudy';
      if (!p.items.some(i => i.id === newId)) p.items.push({ ...p.items[0], id: newId, q: 'Mid-study synthetic item (browser-pass)' });
      const m = JSON.parse(origManifest);
      const v = m.version.split('.'); v[2] = String(parseInt(v[2], 10) + 1);
      m.version = v.join('.'); m.generatedAt = new Date().toISOString();
      writeFileSync(PACK, JSON.stringify(p, null, 2) + '\n');
      writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + '\n');
    };
    try {
      await page.eval('reset()'); await page.reload(); await inject();
      await page.eval(`complete('cheatsheets',5)`);
      await page.reload(); await inject(); await page.nav('#/dashboard');
      await page.waitFor(`document.body.innerText.includes('due for review')`);
      const rowFull = await page.eval(`[...document.querySelectorAll('.coverage-row')].find(r=>r.children[0].innerText==='Cheat Sheets')?.children[2].innerText`);
      mutateContent();
      await page.eval(`window.dispatchEvent(new Event('online'))`);
      await page.waitFor(`[...document.querySelectorAll('.coverage-row')].find(r=>r.children[0].innerText==='Cheat Sheets')?.children[2].innerText.includes('/6')`, 30000);
      const rowAfter = await page.eval(`[...document.querySelectorAll('.coverage-row')].find(r=>r.children[0].innerText==='Cheat Sheets')?.children[2].innerText`);
      ok('F content arrival drops 100% bar to the true count', /5\/5 · 100%/.test(rowFull) && /5\/6 · 83%/.test(rowAfter), `${rowFull} → ${rowAfter}`);
    } finally {
      writeFileSync(MANIFEST, origManifest);
      writeFileSync(PACK, origPack);
    }

    before.close();
    try { await fetch(`http://127.0.0.1:${PORT}/json/close/` + encodeURIComponent((await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.url.startsWith(BASE))?.id)); } catch {}
    console.log('\n' + '='.repeat(60));
    const failed = results.filter(r => !r.ok);
    console.log(`${results.length - failed.length}/${results.length} checks passed`);
    if (failed.length) { console.log('FAILED:'); for (const f of failed) console.log('  ✗', f.name, '—', f.detail); process.exit(1); }
  } finally {
    try { page && page.close(); } catch {}
    chrome.kill('SIGKILL');
  }
}

main().catch(e => { console.error('DRIVER ERROR:', e.message); process.exit(2); });