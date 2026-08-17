// D2-5 — "it reaches a device" for release 2026.08.18 (feature 004).
// Verifies: boot sync to the new release, UPD chips on Kotlin Topics rows,
// the sync toast on a focus-triggered update, and that a candidate's own
// progress (rating, due date, notes) survives the release.
// Usage: node InterviewPrep/specs/004-kotlin-qa-clarity/verification/d25.mjs
import { CDP, ORIGIN, sleep, PROBE } from '../../002-improvements/verification/cdp.mjs';
import { writeFileSync } from 'node:fs';

const RELEASE = process.env.RELEASE || '2026.08.18';
const REWIND_FROM = process.env.REWIND_FROM || '2026.08.17';
const summary = process.env.SUMMARY || '';
const results = [];
const ok = (name, detail) => { results.push([name, 'PASS', detail]); console.log(`  PASS ${name} — ${detail}`); };
const fail = (name, detail) => { results.push([name, 'FAIL', detail]); console.log(`  FAIL ${name} — ${detail}`); };

const cdp = new CDP();
await cdp.launch({ userDataDir: '/tmp/aip-d25-' + Date.now() });
try {
  await cdp.navigate(ORIGIN + '/');
  await cdp.waitFor(`document.getElementById('boot-status')?.hidden === true`, {
    timeout: 60000, label: 'boot-status hidden (content phase done)',
  });
  await sleep(800); // let the post-boot render land

  // 1 — stored snapshot is the new release
  const snap = await cdp.storedSnapshot();
  snap && snap.version === RELEASE
    ? ok('D2-5.1 snapshot', `stored snapshot is ${snap.version} (${snap.packs} packs)`)
    : fail('D2-5.1 snapshot', JSON.stringify(snap));

  // 2 — UPD chips on Kotlin Topics rows
  await cdp.goHash('#/topics');
  await cdp.waitFor(`document.querySelectorAll('.item-row').length > 100`, { label: 'topics list rendered' });
  const chips = await cdp.eval(`(() => {
    const upd = [...document.querySelectorAll('.item-row .chip--new')].filter(c => c.textContent.trim() === 'UPD');
    const onKotlin = upd.filter(c => c.closest('.topic-group').querySelector('.topic-group__head h2').textContent.toLowerCase().includes('kotlin')).length;
    return { total: upd.length, onKotlin };
  })()`);
  chips.total === 70 && chips.onKotlin === 70
    ? ok('D2-5.2 UPD chips', `${chips.total} UPD chips, ${chips.onKotlin} on Kotlin rows`)
    : fail('D2-5.2 UPD chips', JSON.stringify(chips));

  // 3 — make real progress on kt-0001: rating + note.
  // NB: order is load-bearing. srs.js rate() crashes on a notes-only partial record
  // (pre-existing bug: prev destructures ease/interval as undefined -> NaN -> todayISO
  // throws). Rate first so the record is complete, then attach the note.
  await cdp.goHash('#/item/kt-0001');
  await cdp.waitFor(`!!document.querySelector('.item-view__q')`, { label: 'item view rendered' });
  await cdp.eval(`(() => {
    document.querySelector('#mark-complete').click();
    return true;
  })()`);
  await cdp.waitFor(`/next review/.test(document.querySelector('p.faint')?.textContent || '')`, {
    timeout: 15000, label: 'status line with due date',
  });
  await cdp.eval(`(() => {
    const t = document.querySelector('#notes');
    t.value = 'D2-5 marker note: sealed+inline both fast, inline has a cost.';
    t.dispatchEvent(new Event('change'));
    return true;
  })()`);
  const before = await cdp.eval(`(() => {
    const ls = JSON.parse(localStorage.getItem('aip.v1.progress') || '{}');
    const p = ls['kt-0001'] || {};
    return { status: document.querySelector('p.faint').textContent.trim(), hasRating: !!p.status, due: p.due || null, notes: p.notes || null };
  })()`);
  if (before.hasRating && before.notes) ok('D2-5.3 progress created', `status=${before.status}; due=${before.due}; notes="${before.notes.slice(0, 24)}…"`);
  else fail('D2-5.3 progress created', JSON.stringify(before));

  // 4 — rewind the device's snapshot to before the release, then boot again: the warm boot reads
  // the rewound store (in-memory App.snapshot is not enough — checkForUpdates compares memory, so
  // a same-tab focus event would see no diff), finds the release, and syncs with a toast.
  // The rewind reverts both the version and the kotlin items' updatedIn, exactly like a device
  // that last synced ${REWIND_FROM}: otherwise the diff would count 0 changed items.
  await cdp.eval(`(async () => {
    const db = await new Promise(res => { const r = indexedDB.open('aip'); r.onsuccess = () => res(r.result); });
    const tx = db.transaction('snapshot', 'readwrite');
    const store = tx.objectStore('snapshot');
    const cur = await new Promise(res => { const q = store.get('current'); q.onsuccess = () => res(q.result); });
    cur.version = '${REWIND_FROM}';
    for (const pk of Object.values(cur.packs || {})) {
      for (const it of pk.items || []) if (/^kt-/.test(it.id)) it.updatedIn = '${REWIND_FROM}';
    }
    for (const it of Object.values(cur.byId || {})) if (/^kt-/.test(it.id)) it.updatedIn = '${REWIND_FROM}';
    await new Promise(res => { store.put(cur, 'current'); tx.oncomplete = res; });
    db.close();
    return true;
  })()`);
  await cdp.navigate(ORIGIN + '/');
  await cdp.waitFor(`[...document.querySelectorAll('#toast-root .toast')].some(t => /Content updated/.test(t.textContent))`, {
    timeout: 60000, label: 'sync toast after boot from rewound store',
  });
  const toastText = await cdp.eval(`[...document.querySelectorAll('#toast-root .toast')].map(t => t.textContent).join(' | ')`);
  /70 changed/.test(toastText)
    ? ok('D2-5.4 sync toast', JSON.stringify(toastText))
    : fail('D2-5.4 sync toast', JSON.stringify(toastText));
  await sleep(500);

  const snap2 = await cdp.storedSnapshot();
  snap2 && snap2.version === RELEASE
    ? ok('D2-5.5 re-synced snapshot', `stored snapshot back to ${snap2.version}`)
    : fail('D2-5.5 re-synced snapshot', JSON.stringify(snap2));

  // 5 — candidate progress survived the release
  const after = await cdp.eval(`(() => {
    const ls = JSON.parse(localStorage.getItem('aip.v1.progress') || '{}');
    const p = ls['kt-0001'] || {};
    return { hasRating: !!p.status, due: p.due || null, notes: p.notes || null };
  })()`);
  after.hasRating && after.due === before.due && after.notes === before.notes
    ? ok('D2-5.6 progress intact', `rating kept, due ${after.due}, notes kept`)
    : fail('D2-5.6 progress intact', `before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);

  // 6 — the item view still renders the status line with the due date after re-sync
  await cdp.goHash('#/item/kt-0001');
  await cdp.waitFor(`!!document.querySelector('.item-view__q')`, { label: 'item view after sync' });
  const statusAfter = await cdp.eval(`document.querySelector('p.faint')?.textContent.trim() || null`);
  statusAfter === before.status
    ? ok('D2-5.7 status line', JSON.stringify(statusAfter))
    : fail('D2-5.7 status line', `before=${before.status} after=${statusAfter}`);
} finally {
  await cdp.close();
}

const failed = results.filter(r => r[1] === 'FAIL');
console.log(`\nD2-5: ${results.length - failed.length}/${results.length} PASS`);
writeFileSync('/tmp/d25-results.json', JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);
