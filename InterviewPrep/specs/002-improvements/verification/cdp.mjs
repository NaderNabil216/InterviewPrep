// Minimal Chrome DevTools Protocol driver for the T058 quickstart walkthrough.
// Uses Node's global WebSocket (Node >= 22). Flat protocol: one socket, sessionId routing.
import { spawn } from 'node:child_process';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const ORIGIN = 'http://localhost:8777';

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export class CDP {
  constructor() {
    this.id = 0;
    this.pending = new Map();
    this.handlers = [];
    this.proc = null;
    this.ws = null;
    this.sessionId = null;
    this.targetId = null;
  }

  async launch({ port = 9333, userDataDir } = {}) {
    this.proc = spawn(CHROME, [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userDataDir}`,
      '--no-first-run', '--no-default-browser-check', '--disable-extensions',
      '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--window-size=1400,1000',
      'about:blank',
    ], { stdio: 'ignore' });

    let info = null;
    for (let i = 0; i < 100; i++) {
      try {
        const r = await fetch(`http://127.0.0.1:${port}/json/version`);
        info = await r.json();
        break;
      } catch { await sleep(100); }
    }
    if (!info) throw new Error('Chrome did not start');

    this.ws = new WebSocket(info.webSocketDebuggerUrl);
    await new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id != null && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message} (${JSON.stringify(msg.error.data || '')})`));
        else resolve(msg.result);
      } else if (msg.method) {
        for (const h of this.handlers) h(msg);
      }
    };

    const { targetId } = await this.send('Target.createTarget', { url: 'about:blank' });
    this.targetId = targetId;
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true });
    this.sessionId = sessionId;

    for (const d of ['Page', 'Runtime', 'Network', 'Log', 'DOM']) await this.send(`${d}.enable`);
    return this;
  }

  send(method, params = {}, sessionId = this.sessionId) {
    const id = ++this.id;
    const msg = { id, method, params };
    if (sessionId && !method.startsWith('Target.') && !method.startsWith('Browser.')) msg.sessionId = sessionId;
    this.ws.send(JSON.stringify(msg));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }
      }, 120000);
    });
  }

  on(fn) { this.handlers.push(fn); return () => { this.handlers = this.handlers.filter(h => h !== fn); }; }

  // Collect every network request URL until stop() is called.
  recordRequests() {
    const urls = [];
    const off = this.on((m) => {
      if (m.method === 'Network.requestWillBeSent') urls.push(m.params.request.url);
    });
    return { urls, stop: off };
  }

  recordConsole() {
    const lines = [];
    const off = this.on((m) => {
      if (m.method === 'Runtime.consoleAPICalled') {
        lines.push({ type: m.params.type, text: m.params.args.map(a => a.value ?? a.description ?? '').join(' ') });
      } else if (m.method === 'Log.entryAdded') {
        lines.push({ type: m.params.entry.level, text: m.params.entry.text });
      } else if (m.method === 'Runtime.exceptionThrown') {
        lines.push({ type: 'exception', text: m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception?.description || '') });
      }
    });
    return { lines, stop: off };
  }

  async eval(expression, { awaitPromise = true } = {}) {
    const r = await this.send('Runtime.evaluate', {
      expression, awaitPromise, returnByValue: true, userGesture: true,
    });
    if (r.exceptionDetails) {
      throw new Error('eval failed: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text) + '\n--- expr ---\n' + expression.slice(0, 400));
    }
    return r.result.value;
  }

  async waitFor(expression, { timeout = 15000, interval = 60, label = expression } = {}) {
    const start = Date.now();
    for (;;) {
      let v;
      try { v = await this.eval(expression); } catch { v = false; }
      if (v) return v;
      if (Date.now() - start > timeout) throw new Error(`waitFor timed out: ${label}`);
      await sleep(interval);
    }
  }

  // Always a full document load. A bare Page.navigate to a URL that differs only by fragment is a
  // same-document navigation and fires no load event, so hop through about:blank first and bound
  // the wait rather than hanging forever.
  async navigate(url, { fresh = true } = {}) {
    if (fresh) {
      const cur = await this.eval('location.href').catch(() => '');
      if (cur && cur !== 'about:blank' && cur.split('#')[0] === url.split('#')[0]) {
        await this.rawNavigate('about:blank');
      }
    }
    await this.rawNavigate(url);
    await this.waitFor(`document.readyState === 'complete'`, { timeout: 30000, label: 'readyState' });
  }

  async rawNavigate(url) {
    let settle;
    const loaded = new Promise((res) => {
      settle = res;
      const off = this.on((m) => { if (m.method === 'Page.loadEventFired') { off(); res(); } });
      setTimeout(() => { off(); res(); }, 30000);
    });
    await this.send('Page.navigate', { url });
    await loaded;
  }

  // In-app route change (hash router) — never a document load.
  async goHash(hash) {
    await this.eval(`(() => { location.hash = ${JSON.stringify(hash)}; return true; })()`);
  }

  // A true cold cache (DevTools "Clear site data"). Must be issued from about:blank: an open
  // IndexedDB connection on a live app page blocks the delete, which would then fire after the NEXT
  // load and wipe the snapshot that load just wrote.
  async clearSiteData({ verify = true } = {}) {
    await this.navigate('about:blank');
    await this.send('Storage.clearDataForOrigin', { origin: ORIGIN, storageTypes: 'all' });
    if (verify) {
      const { usage } = await this.send('Storage.getUsageAndQuota', { origin: ORIGIN });
      if (usage > 50_000) throw new Error(`cold-cache wipe failed: ${usage} bytes still stored`);
    }
  }

  // Read the persisted snapshot's version + pack count straight out of IndexedDB.
  async storedSnapshot() {
    return this.eval(`(async () => {
      const db = await new Promise((res) => { const r = indexedDB.open('aip'); r.onsuccess = () => res(r.result); r.onerror = () => res(null); });
      if (!db || !db.objectStoreNames.contains('snapshot')) { if (db) db.close(); return null; }
      const v = await new Promise((res) => {
        const q = db.transaction('snapshot').objectStore('snapshot').get('current');
        q.onsuccess = () => res(q.result || null); q.onerror = () => res(null);
      });
      db.close();
      return v ? { version: v.version, packs: Object.keys(v.packs || {}).length } : null;
    })()`);
  }

  async offline(on) {
    await this.send('Network.emulateNetworkConditions', {
      offline: on, latency: 0, downloadThroughput: on ? 0 : -1, uploadThroughput: on ? 0 : -1,
    });
  }

  async throttle({ cpu = 1, latency = 0, down = -1, up = -1 } = {}) {
    await this.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    await this.send('Network.emulateNetworkConditions', {
      offline: false, latency, downloadThroughput: down, uploadThroughput: up,
    });
  }

  async blockUrls(urls) { await this.send('Network.setBlockedURLs', { urls }); }

  async close() {
    try { this.ws?.close(); } catch {}
    try { this.proc?.kill('SIGKILL'); } catch {}
  }
}

// Injected before every document: instruments fetch, first paint, shell/content readiness, toasts.
export const PROBE = `
(() => {
  if (window.__probe) return;
  const P = window.__probe = {
    inFlight: 0, inFlightUrls: new Set(),
    fetched: [], packFetches: 0, manifestFetches: 0, judge0Fetches: 0,
    fcp: null, bootVisibleAtPaint: null,
    shellReadyAt: null, shellInFlight: null, shellInFlightUrls: [], shellViewText: null,
    contentReadyAt: null, contentViewText: null,
    bootReshownCount: 0, sawBootStatus: false,
    toasts: [],
  };
  const origFetch = window.fetch;
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || String(input);
    P.inFlight++; P.inFlightUrls.add(url);
    P.fetched.push(url);
    if (/content\\/packs\\//.test(url)) P.packFetches++;
    if (/manifest\\.json/.test(url)) P.manifestFetches++;
    if (/judge0/.test(url)) P.judge0Fetches++;
    const done = () => { P.inFlight--; P.inFlightUrls.delete(url); };
    return origFetch.apply(this, arguments).then(
      (r) => { done(); return r; },
      (e) => { done(); throw e; }
    );
  };
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.name === 'first-contentful-paint' && P.fcp === null) {
          P.fcp = e.startTime;
          const bs = document.getElementById('boot-status');
          P.bootVisibleAtPaint = bs ? !bs.hidden : null;
        }
      }
    }).observe({ type: 'paint', buffered: true });
  } catch (e) {}
  const check = () => {
    const bs = document.getElementById('boot-status');
    if (bs) {
      if (!bs.hidden) P.sawBootStatus = true;
      if (P.shellReadyAt === null && bs.hidden) {
        P.shellReadyAt = performance.now();
        P.shellInFlight = P.inFlight;
        P.shellInFlightUrls = [...P.inFlightUrls];
        P.shellViewText = (document.getElementById('view') || {}).textContent || '';
      } else if (P.shellReadyAt !== null && !bs.hidden) {
        P.bootReshownCount++;
      }
    }
    const view = document.getElementById('view');
    if (P.contentReadyAt === null && view && /\\d+ items/.test(view.textContent || '')) {
      P.contentReadyAt = performance.now();
      P.contentViewText = view.textContent;
    }
    if (P.fcp === null) {
      const e = performance.getEntriesByType('paint').find((x) => x.name === 'first-contentful-paint');
      if (e) {
        P.fcp = e.startTime;
        if (P.bootVisibleAtPaint === null && P.shellReadyAt === null) {
          const b = document.getElementById('boot-status');
          P.bootVisibleAtPaint = b ? !b.hidden : null;
        }
      }
    }
    document.querySelectorAll('#toast-root .toast').forEach((t) => {
      const txt = t.textContent;
      if (!P.toasts.includes(txt)) P.toasts.push(txt);
    });
  };
  new MutationObserver(check).observe(document, { childList: true, subtree: true, attributes: true, characterData: true });
  document.addEventListener('DOMContentLoaded', check);
  setInterval(check, 25);
})();
`;

export function report(name, ok, detail = '') {
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) process.exitCode = 1;
  return ok;
}
