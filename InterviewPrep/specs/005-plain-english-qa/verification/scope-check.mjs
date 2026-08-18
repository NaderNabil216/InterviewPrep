// Per-batch scope check for 005-plain-english-qa. Adapted from
// specs/004-kotlin-qa-clarity/verification/scope-check.mjs (itself adapted from
// specs/002-improvements/verification/fielddiff.mjs — R-009, the third generation):
// diffs one pack file against git HEAD and fails the batch on any change outside the
// delivery's allowed-field set.
//
//   node specs/005-plain-english-qa/verification/scope-check.mjs content/packs/<pack>.json
//   node specs/005-plain-english-qa/verification/scope-check.mjs content/packs/<pack>.json \
//       --batch content/packs/a.json,content/packs/b.json   # multi-file batch (T003)
//
// Allowed to differ (data-model.md §5): q, shortAnswer (entries may move, but the array
// must stay exactly 3 bullets — FR-015, FR-018), updatedIn (stamped by the manifest
// tooling at release time).
// Frozen (must be byte-identical): id (same set and count — Constitution I), answer,
// traps, followUps, code, refs, level, topic, track, tags, addedIn, type, and on non-qa
// items also prompt, hints, sampleCall, referenceAnswer, framework, summary, label,
// description.
// Also fails the batch on: any id added/removed, any bullet-count change, any fenced
// code block (```) appearing in q or shortAnswer (gate 15 covers both fields —
// inherited, not re-implemented), and any content/packs file outside the batch's pack
// set differing since the previous commit.
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const args = process.argv.slice(2);
const packArg = args.find(a => a.endsWith('.json') && !a.startsWith('--'));
const batchArg = args.indexOf('--batch');
const batchSet = new Set(batchArg !== -1
  ? args[batchArg + 1].split(',').map(s => s.trim()).filter(Boolean)
  : [packArg]);

if (!packArg || !existsSync(packArg)) {
  console.error('usage: node scope-check.mjs content/packs/<pack>.json [--batch f1.json,f2.json]');
  process.exit(2);
}

const ALLOWED = new Set(['q', 'shortAnswer', 'updatedIn']);

// Explicit for the record — every field outside ALLOWED is frozen either way.
const FROZEN = new Set(['id', 'answer', 'traps', 'followUps', 'code', 'refs', 'level',
  'topic', 'track', 'tags', 'addedIn', 'type']);
const FROZEN_NON_QA = new Set(['prompt', 'hints', 'sampleCall', 'referenceAnswer',
  'framework', 'summary', 'label', 'description']);

const failures = [];
const allowedDiffs = [];

function report(kind, file, id, field, detail = '') {
  const msg = `${kind} ${file}:${id}.${field}${detail ? ' — ' + detail : ''}`;
  if (kind === 'FAIL') failures.push(msg);
  else allowedDiffs.push(msg);
}

const headText = execSync(`git show HEAD:${packArg}`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const head = JSON.parse(headText);
const now = JSON.parse(readFileSync(packArg, 'utf8'));

const headById = new Map(head.items.map(i => [i.id, i]));
const nowById = new Map(now.items.map(i => [i.id, i]));

for (const id of headById.keys()) if (!nowById.has(id)) report('FAIL', packArg, id, '(removed)');
for (const id of nowById.keys()) if (!headById.has(id)) report('FAIL', packArg, id, '(added)');

for (const [id, b] of nowById) {
  const a = headById.get(id);
  if (!a) continue;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (k === 'shortAnswer') {
      if ((b[k] || []).length !== 3)
        report('FAIL', packArg, id, 'shortAnswer', `bullet count must stay exactly 3 — got ${(b[k] || []).length}`);
      for (const bullet of b[k] || []) {
        if ((bullet || '').includes('```'))
          report('FAIL', packArg, id, 'shortAnswer', 'fenced code block (gate 15)');
      }
      if (JSON.stringify(a[k]) === JSON.stringify(b[k])) continue;
      report('OK', packArg, id, 'shortAnswer');
      continue;
    }
    if (k === 'q') {
      if ((b[k] || '').includes('```'))
        report('FAIL', packArg, id, 'q', 'fenced code block (gate 15)');
      if (JSON.stringify(a[k]) === JSON.stringify(b[k])) continue;
      report('OK', packArg, id, 'q');
      continue;
    }
    const same = JSON.stringify(a[k]) === JSON.stringify(b[k]);
    if (same) continue;
    if (ALLOWED.has(k)) {
      report('OK', packArg, id, k);
      continue;
    }
    if (FROZEN.has(k) || FROZEN_NON_QA.has(k)) report('FAIL', packArg, id, k);
    else report('FAIL', packArg, id, k, 'unexpected field');
  }
}

const changed = execSync('git diff --name-only HEAD -- content/packs', { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);
const outsideBatch = changed.filter(f => !batchSet.has(f));
if (outsideBatch.length) {
  failures.push(`content/packs files outside the batch changed: ${outsideBatch.join(', ')}`);
}

console.log(`batch file set    : ${[...batchSet].join(', ')}`);
console.log(`pack vs HEAD      : ${packArg}`);
console.log(`ids added/removed : ${nowById.size} now vs ${head.items.length} at HEAD (${nowById.size === head.items.length ? 'identical' : 'DIFFERENT'})`);
console.log(`allowed diffs     : ${allowedDiffs.length}`);
for (const d of allowedDiffs) console.log('  ' + d);
console.log(`failures          : ${failures.length}`);
for (const f of failures) console.log('  ' + f);
if (outsideBatch.length) console.log(`other changed pack files : ${outsideBatch.join(', ') || 'none'}`);

process.exitCode = failures.length ? 1 : 0;