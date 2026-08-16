// US7 step 2 / US8 step 5: prove the content edits touched only the fields each story owns.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const files = execSync('git diff --name-only HEAD -- content/packs', { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);

const ALLOWED = new Set(['shortAnswer', 'updatedIn', 'sampleCall', 'clarifyingQuestions', 'requirements', 'framework']);
const PROTECTED = ['answer', 'traps', 'q', 'code', 'refs', 'level', 'type', 'track', 'tags',
                   'hints', 'followUps', 'complexity', 'starter', 'rubric', 'referenceAnswer', 'staffAdds'];

let items = 0, changedItems = 0, idChanges = 0, protectedChanges = [], otherFields = new Map(), shortAnswerChanges = 0;

for (const f of files) {
  const head = JSON.parse(execSync(`git show HEAD:${f}`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  const now = JSON.parse(readFileSync(f, 'utf8'));
  const headById = Object.fromEntries(head.items.map(i => [i.id, i]));
  const nowById = Object.fromEntries(now.items.map(i => [i.id, i]));
  for (const id of Object.keys(headById)) if (!nowById[id]) idChanges++;
  for (const id of Object.keys(nowById)) {
    items++;
    const a = headById[id], b = nowById[id];
    if (!a) { idChanges++; continue; }
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    let touched = false;
    for (const k of keys) {
      if (JSON.stringify(a[k]) === JSON.stringify(b[k])) continue;
      touched = true;
      if (k === 'shortAnswer') shortAnswerChanges++;
      if (PROTECTED.includes(k)) protectedChanges.push(`${f}:${id}.${k}`);
      else if (!ALLOWED.has(k)) otherFields.set(k, (otherFields.get(k) || 0) + 1);
    }
    if (touched) changedItems++;
  }
}

console.log(`packs changed vs HEAD : ${files.length}`);
console.log(`items compared        : ${items}`);
console.log(`items with any change : ${changedItems}`);
console.log(`shortAnswer rewrites  : ${shortAnswerChanges}`);
console.log(`items added/removed/renumbered : ${idChanges}`);
console.log(`answer/traps/other protected-field changes : ${protectedChanges.length}`);
if (protectedChanges.length) console.log('  ' + protectedChanges.slice(0, 20).join('\n  '));
console.log(`unexpected changed fields : ${otherFields.size ? [...otherFields].map(([k, n]) => k + '×' + n).join(', ') : 'none'}`);
process.exitCode = (protectedChanges.length || idChanges || otherFields.size) ? 1 : 0;
