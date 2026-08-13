#!/usr/bin/env node
// Every ref URL in the content set is fetched once and reported on. Content is written
// offline, so this is the only thing standing between the study set and a dead citation.
//
//   node tools/check-refs.mjs                 # check every pack
//   node tools/check-refs.mjs kotlin-g        # only packs whose file name contains this
//
// Exit code is non-zero if any URL is definitively broken (4xx). Network failures and
// bot-blocks (403/429) are reported separately and don't fail the run.

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const filter = process.argv[2] || '';
const CONCURRENCY = 8;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// url -> [itemIds]
const urls = new Map();
for (const f of readdirSync(join(ROOT, 'content/packs')).sort()) {
  if (!f.endsWith('.json') || !f.includes(filter)) continue;
  const pack = JSON.parse(readFileSync(join(ROOT, 'content/packs', f), 'utf8'));
  for (const item of pack.items || []) {
    for (const ref of item.refs || []) {
      if (!ref.url) continue;
      if (!urls.has(ref.url)) urls.set(ref.url, []);
      urls.get(ref.url).push(item.id);
    }
  }
}

console.log(`Checking ${urls.size} unique URL(s)${filter ? ` in packs matching "${filter}"` : ''}…\n`);

async function probe(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        headers: { 'user-agent': UA, accept: 'text/html,*/*' },
        signal: AbortSignal.timeout(20000),
      });
      // Some servers (e.g. support.google.com) reject HEAD with 404/405 while the
      // page serves fine over GET — fall through to GET on any HEAD failure.
      if (method === 'HEAD' && (res.status === 405 || res.status >= 400)) continue; // retry as GET
      return { status: res.status, finalUrl: res.url };
    } catch (e) {
      if (method === 'GET') return { status: 0, error: e.message };
    }
  }
  return { status: 0, error: 'unreachable' };
}

const entries = [...urls.entries()];
const broken = [], suspect = [], ok = [];

for (let i = 0; i < entries.length; i += CONCURRENCY) {
  const slice = entries.slice(i, i + CONCURRENCY);
  const results = await Promise.all(slice.map(([url]) => probe(url)));
  slice.forEach(([url, ids], j) => {
    const r = results[j];
    const row = { url, ids, ...r };
    if (r.status >= 200 && r.status < 300) ok.push(row);
    else if (r.status === 403 || r.status === 429 || r.status === 0) suspect.push(row);
    else broken.push(row);
  });
  process.stdout.write(`\r  ${Math.min(i + CONCURRENCY, entries.length)}/${entries.length}`);
}
process.stdout.write('\r' + ' '.repeat(30) + '\r');

if (broken.length) {
  console.log(`✗ ${broken.length} BROKEN:`);
  for (const b of broken) console.log(`   ${b.status}  ${b.url}\n        used by: ${b.ids.join(', ')}`);
  console.log('');
}
if (suspect.length) {
  console.log(`! ${suspect.length} unverified (bot-block or network — check by hand if it matters):`);
  for (const s of suspect) console.log(`   ${s.status || s.error}  ${s.url}`);
  console.log('');
}
console.log(`${ok.length} ok · ${suspect.length} unverified · ${broken.length} broken`);
process.exit(broken.length ? 1 : 0);
