// Per-batch scope check for 004-kotlin-qa-clarity. Adapted from
// specs/002-improvements/verification/fielddiff.mjs: diffs one pack file against git HEAD and
// fails the batch on any change outside the delivery's allowed-field set.
//
//   node scope-check.mjs --delivery q <pack-file>
//   node scope-check.mjs --delivery answers <pack-file>
//   node scope-check.mjs --delivery q <pack-file> --repair q:kt-0004:<reason>
//
// D2 ("q")      allowed: q, updatedIn
// D3 ("answers") allowed: answer, traps, followUps, code[].caption, updatedIn,
//                plus shortAnswer/q ONLY with a recorded --repair note (FR-023a, FR-023b)
// Frozen both:  id, code[].src, code[].lang, refs, level, topic, track, tags, addedIn, type
//               and the COUNT of traps[]/followUps[] entries (P12), and 0 fenced blocks in
//               code[].caption (FR-018 — gate 15's PROSE_FIELDS omits caption).
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const args = process.argv.slice(2);
const deliveryArg = args.indexOf('--delivery');
const delivery = deliveryArg !== -1 ? args[deliveryArg + 1] : null;
const packArg = args.find(a => a.endsWith('.json') && !a.startsWith('--'));
const repairs = new Map();

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--repair') {
    const [field, id, ...reasonParts] = args[i + 1]?.split(':') || [];
    if (!field || !id || !reasonParts.length) {
      console.error('usage: --repair <field>:<id>:<reason>');
      process.exit(2);
    }
    repairs.set(`${field}:${id}`, reasonParts.join(':'));
  }
}

if (!['q', 'answers'].includes(delivery) || !packArg) {
  console.error('usage: node scope-check.mjs --delivery q|answers <pack-file> [--repair field:id:reason]');
  process.exit(2);
}
if (!existsSync(packArg)) {
  console.error(`pack file not found: ${packArg}`);
  process.exit(2);
}

const ALLOWED = delivery === 'q'
  ? new Set(['q', 'updatedIn'])
  : new Set(['answer', 'traps', 'followUps', 'updatedIn']); // code[].caption handled field-wise below

const frozen = new Set(['id', 'refs', 'level', 'topic', 'track', 'tags', 'addedIn', 'type',
                        'shortAnswer', 'code', 'q', 'answer', 'traps', 'followUps']);

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
    const same = JSON.stringify(a[k]) === JSON.stringify(b[k]);
    if (k === 'code') {
      const ac = a.code || [], bc = b.code || [];
      if (ac.length !== bc.length) {
        report('FAIL', packArg, id, 'code', `entry count ${ac.length} → ${bc.length}`);
        continue;
      }
      bc.forEach((block, i) => {
        if (block.src !== ac[i].src) report('FAIL', packArg, id, `code[${i}].src`);
        if (block.lang !== ac[i].lang) report('FAIL', packArg, id, `code[${i}].lang`);
        if (block.caption !== ac[i].caption) {
          if (delivery === 'answers') report('OK', packArg, id, `code[${i}].caption`);
          else report('FAIL', packArg, id, `code[${i}].caption`);
        }
        for (const extra of Object.keys(block)) {
          if (!['src', 'lang', 'caption'].includes(extra) && JSON.stringify(block[extra]) !== JSON.stringify(ac[i][extra]))
            report('FAIL', packArg, id, `code[${i}].${extra}`);
        }
        if ((block.caption || '').includes('```'))
          report('FAIL', packArg, id, `code[${i}].caption`, 'fenced code block (FR-018)');
      });
      continue;
    }
    if (same) continue;
    if (ALLOWED.has(k)) {
      report('OK', packArg, id, k);
      continue;
    }
    if (repairs.has(`${k}:${id}`)) {
      report('OK', packArg, id, k, `repair — ${repairs.get(`${k}:${id}`)}`);
      continue;
    }
    if (frozen.has(k)) report('FAIL', packArg, id, k);
    else report('FAIL', packArg, id, k, 'unexpected field');
  }

  const counts = { traps: 2, followUps: 3 };
  for (const k of ['traps', 'followUps']) {
    if ((b[k] || []).length !== (a[k] || []).length)
      report('FAIL', packArg, id, k, `entry count ${(a[k] || []).length} → ${(b[k] || []).length} (P12)`);
    void counts;
  }
}

const changed = execSync('git diff --name-only HEAD -- content/packs', { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);
const outside = changed.filter(f => f !== packArg);
const outsidePacks = outside.filter(f => !/^content\/packs\/kotlin-.*\.json$/.test(f));

console.log(`delivery          : ${delivery}`);
console.log(`pack vs HEAD      : ${packArg}`);
console.log(`ids added/removed : ${head.items.length - nowById.size >= 0 ? nowById.size - head.items.length : head.items.length - nowById.size} (${head.items.length} → ${nowById.size})`);
console.log(`allowed diffs     : ${allowedDiffs.length}`);
for (const d of allowedDiffs) console.log('  ' + d);
console.log(`failures          : ${failures.length}`);
for (const f of failures) console.log('  ' + f);
if (outside.length) console.log(`other changed pack files : ${outside.filter(f => f !== packArg).join(', ') || 'none'}`);
if (outsidePacks.length) {
  failures.push(`files outside content/packs/kotlin-*.json changed: ${outsidePacks.join(', ')}`);
  console.log('  FAIL non-kotlin file changed: ' + outsidePacks.join(', '));
}

process.exitCode = failures.length ? 1 : 0;