#!/usr/bin/env node
// Adds any pack file on disk that the manifest doesn't know about, and optionally
// records a release. Deterministic — no agent touches manifest.json.
//
//   node tools/sync-manifest.mjs                          # dry run, report only
//   node tools/sync-manifest.mjs --write
//   node tools/sync-manifest.mjs --write --release 2026.08.7 --summary "..." --date 2026-08-09
//   node tools/sync-manifest.mjs --write --stack-checked 2026-08-09
//
// New packs are inserted directly after the last existing pack of the same track,
// so the manifest stays grouped and the app's track ordering never jumps around.
//
// --date defaults to today and stamps both generatedAt and the release date. Without it the
// release date was copied from the never-updated generatedAt, which dated every release of this
// expansion 2026-08-07.
// --stack-checked records when the stackSnapshot version-truth registry was last re-verified
// (FR-036); validate.mjs gate 11 errors when it is more than 30 days before the release date.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = join(ROOT, 'content/manifest.json');

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf('--' + name);
  return i === -1 ? null : argv[i + 1];
};
const WRITE = argv.includes('--write');
const RELEASE = flag('release');
const SUMMARY = flag('summary');
const DATE = flag('date') || new Date().toISOString().slice(0, 10);
const STACK_CHECKED = flag('stack-checked');

if (!/^\d{4}-\d{2}-\d{2}$/.test(DATE)) {
  console.error(`--date must be YYYY-MM-DD, got "${DATE}"`);
  process.exit(1);
}
if (STACK_CHECKED !== null && !/^\d{4}-\d{2}-\d{2}$/.test(STACK_CHECKED)) {
  console.error(`--stack-checked must be YYYY-MM-DD, got "${STACK_CHECKED}"`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const known = new Set(manifest.packs.map((p) => p.file));

const onDisk = readdirSync(join(ROOT, 'content/packs'))
  .filter((f) => f.endsWith('.json'))
  .sort();

const added = [];
for (const file of onDisk) {
  const rel = 'packs/' + file;
  if (known.has(rel)) continue;

  let pack;
  try {
    pack = JSON.parse(readFileSync(join(ROOT, 'content/packs', file), 'utf8'));
  } catch (e) {
    console.error(`  ✗ ${rel} does not parse — ${e.message}`);
    process.exitCode = 1;
    continue;
  }
  if (!pack.id || !pack.track || !Array.isArray(pack.items)) {
    console.error(`  ✗ ${rel} is missing id/track/items`);
    process.exitCode = 1;
    continue;
  }
  if (manifest.packs.some((p) => p.id === pack.id)) {
    console.error(`  ✗ ${rel} declares pack id "${pack.id}" which is already registered`);
    process.exitCode = 1;
    continue;
  }

  const entry = { id: pack.id, title: pack.title, track: pack.track, file: rel };
  // insert after the last pack sharing this track, else at the end
  let at = -1;
  manifest.packs.forEach((p, i) => { if (p.track === pack.track) at = i; });
  if (at === -1) manifest.packs.push(entry);
  else manifest.packs.splice(at + 1, 0, entry);

  added.push({ ...entry, items: pack.items.length });
}

if (process.exitCode) {
  console.error('\nRefusing to continue while pack files are broken.');
  process.exit(1);
}

if (!added.length) {
  console.log('Manifest already covers every pack on disk.');
} else {
  console.log(`${added.length} new pack(s):`);
  const byTrack = {};
  for (const a of added) {
    console.log(`  + ${a.file.padEnd(40)} ${String(a.items).padStart(4)} items  (${a.track})`);
    byTrack[a.track] = (byTrack[a.track] || 0) + a.items;
  }
  console.log('  totals by track:', byTrack);
  console.log(`  ${added.reduce((n, a) => n + a.items, 0)} items total`);
}

if (RELEASE) {
  if (!SUMMARY) { console.error('--release needs --summary'); process.exit(1); }
  if (manifest.releases.some((r) => r.version === RELEASE)) {
    console.error(`Release ${RELEASE} already exists in the manifest.`);
    process.exit(1);
  }
  manifest.version = RELEASE;
  manifest.generatedAt = DATE;
  manifest.releases.unshift({ version: RELEASE, date: DATE, summary: SUMMARY });
  console.log(`\nManifest version -> ${RELEASE}, dated ${DATE} (release entry prepended)`);
}

if (STACK_CHECKED) {
  manifest.stackSnapshotChecked = STACK_CHECKED;
  console.log(`stackSnapshotChecked -> ${STACK_CHECKED}`);
}

// Keep stackSnapshotChecked next to the registry it dates rather than appended at the end.
function ordered(m) {
  const head = ['version', 'generatedAt', 'stackSnapshot', 'stackSnapshotChecked'];
  const out = {};
  for (const k of head) if (k in m) out[k] = m[k];
  for (const k of Object.keys(m)) if (!(k in out)) out[k] = m[k];
  return out;
}

if (WRITE) {
  writeFileSync(MANIFEST, JSON.stringify(ordered(manifest), null, 2) + '\n');
  console.log('\nWrote content/manifest.json');
} else {
  console.log('\n(dry run — pass --write to apply)');
}
