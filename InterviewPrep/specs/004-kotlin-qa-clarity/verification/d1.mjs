// Delivery 1 walkthrough — quickstart.md D1-1..D1-9, recorded via CDP.
// Run: node d1.mjs  (Chrome headless; site must be served on http://localhost:8777)
import { CDP, ORIGIN, sleep, report } from '../../002-improvements/verification/cdp.mjs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EXPECTED = ['Question', 'The 30-second answer', 'The full picture', 'Code',
                  "They'll ask next", 'What sinks you', 'Sources'];

const cdp = new CDP();
await cdp.launch({ userDataDir: mkdtempSync(join(tmpdir(), 'd1-')) });

const labels = () => cdp.eval(`[...document.querySelectorAll('.section-label')].map(e => e.textContent.trim())`);
const count = () => cdp.eval(`document.querySelectorAll('.section-label').length`);

async function goto(hash) {
  await cdp.navigate(`${ORIGIN}/${hash}`);
  const marker = hash.includes('/item/') ? `.item-view__q`
    : hash.includes('/drill/') ? `.drill-card`
    : hash.includes('/mock/') ? `#reveal-btn`
    : `.card, h1, .empty-state`;
  await cdp.waitFor(`document.getElementById('boot-status')?.hidden && !!document.querySelector('${marker}')`,
    { timeout: 30000, label: `boot+render ${hash}` });
  await sleep(150);
}

// ---------- D1-1 · seven labels in order, one treatment ----------
await goto("#/item/kt-0004");
const seven = await labels();
report('D1-1', JSON.stringify(seven) === JSON.stringify(EXPECTED), JSON.stringify(seven));
report('D1-1 in-answer heading still present', await cdp.eval(
  `[...document.querySelectorAll('.answer-body h4')].some(h => h.textContent.includes('What inlining buys you'))`));
const props = ['fontFamily','fontSize','fontWeight','letterSpacing','textTransform','color',
               'backgroundColor','borderColor','borderRadius','padding'];
const c14 = await cdp.eval(`new Set([...document.querySelectorAll('.section-label')]
  .map(e => ${JSON.stringify(props)}.map(p => getComputedStyle(e)[p]).join('|'))).size`);
report('D1-9/C14 one treatment across all seven', c14 === 1, `distinct treatments: ${c14}`);
const distinct = await cdp.eval(`
  (() => { const l = getComputedStyle(document.querySelector('.section-label'));
           const h = getComputedStyle(document.querySelector('.answer-body h4'));
           return l.fontSize !== h.fontSize && l.textTransform === 'uppercase' && l.backgroundImage !== 'none' || l.backgroundColor !== 'rgba(0, 0, 0, 0)'; })()`);
report('D1-1 label distinguishable from in-answer heading', distinct);

// ---------- D1-2 · same four strings on Drill and Mock ----------
await goto("#/drill/kt-0004");
await cdp.eval(`document.getElementById('drill-card').click()`);
await sleep(200);
const drillLabels = await labels();
report('D1-2 drill', JSON.stringify(drillLabels) === JSON.stringify(EXPECTED.slice(0, 4)), JSON.stringify(drillLabels));

await goto("#/mock/android");
await cdp.eval(`document.getElementById('reveal-btn').click()`);
await sleep(200);
const mockLabels = await labels();
const mockHasCode = await cdp.eval(`!!document.querySelector('.code-block')`);
const mockExpected = mockHasCode ? EXPECTED.slice(0, 4) : EXPECTED.slice(0, 3);
report('D1-2 mock', JSON.stringify(mockLabels) === JSON.stringify(mockExpected), JSON.stringify(mockLabels) + (mockHasCode ? ' (with Code)' : ' (no code[] — Code correctly absent)'));

// ---------- D1-3 · qa item with no code[] shows no Code label ----------
await goto("#/item/cmp-0012");
report('D1-3 no Code label', await cdp.eval(
  `![...document.querySelectorAll('.section-label')].some(e => e.textContent.trim() === 'Code') && !document.querySelector('.code-block')`),
  `labels: ${JSON.stringify(await labels())}`);

// ---------- D1-4 · zero .section-label on all six non-Q&A routes ----------
const routes = [
  ['search→dsa item', '#/item/ds-0001'],
  ['search→cheat sheet', '#/item/cs-0001'],
  ['Topics→design item', '#/item/sd-0000'],
  ['drill cheat sheet', '#/drill/cs-0001'],
  ['mock coding', '#/mock/coding'],
  ['mock design', '#/mock/design'],
];
for (const [name, hash] of routes) {
  await goto(hash);
  if (hash.includes('/mock/')) await cdp.eval(`document.getElementById('reveal-btn').click()`), await sleep(150);
  report(`D1-4 ${name} zero labels`, (await count()) === 0);
}

// ---------- D1-4a · C10: unlabelled items keep their headings ----------
await goto("#/item/ds-0001");
report('D1-4a dsa keeps Likely follow-ups h4', await cdp.eval(
  `[...document.querySelectorAll('h4')].some(h => h.textContent.trim() === 'Likely follow-ups')`));
report('D1-4a dsa keeps refs Sources strong', await cdp.eval(
  `document.querySelector('.refs-box strong')?.textContent.trim() === 'Sources'`));
await goto("#/item/sd-0000");
report('D1-4a design keeps refs Sources strong', await cdp.eval(
  `document.querySelector('.refs-box strong')?.textContent.trim() === 'Sources'`));
await goto("#/item/cs-0001");
report('D1-4a concept keeps refs Sources strong', await cdp.eval(
  `document.querySelector('.refs-box strong')?.textContent.trim() === 'Sources'`));

// ---------- D1-5 · the three untouched layouts ----------
for (const [name, hash] of [['DSA page', '#/dsa'], ['system-design page', '#/design'],
                            ['cheat-sheets page', '#/cheatsheets'], ['one sheet', '#/cheatsheets/cs-0001']]) {
  await goto(hash);
  report(`D1-5 ${name} zero labels`, (await count()) === 0);
}

// ---------- D1-6 · print: labels as underlined black text ----------
await goto("#/item/kt-0004");
await cdp.send('Emulation.setEmulatedMedia', { media: 'print' });
const printStyle = await cdp.eval(`(() => {
  const s = getComputedStyle(document.querySelector('.section-label'));
  return { bg: s.backgroundColor, borderBottom: s.borderBottomWidth + ' ' + s.borderBottomColor,
           color: s.color, radius: s.borderRadius };
})()`);
report('D1-6 print underline + black', printStyle.bg === 'rgba(0, 0, 0, 0)' && printStyle.color === 'rgb(0, 0, 0)' && printStyle.borderBottom.startsWith('1px rgb(0, 0, 0)'), JSON.stringify(printStyle));
await cdp.send('Emulation.setEmulatedMedia', { media: '' });

// ---------- D1-7 · 320px viewport: no overflow ----------
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 800, deviceScaleFactor: 1, mobile: true });
await goto("#/item/kt-0004");
await sleep(300);
const overflow = await cdp.eval(`(() => {
  const longest = [...document.querySelectorAll('.section-label')].sort((a, b) => b.textContent.length - a.textContent.length)[0];
  return { docOverflow: document.documentElement.scrollWidth - 320, labelOverflow: longest.getBoundingClientRect().right > document.querySelector('.card').getBoundingClientRect().right };
})()`);
report('D1-7 320px no overflow', overflow.docOverflow <= 0 && !overflow.labelOverflow, JSON.stringify(overflow));
await cdp.send('Emulation.clearDeviceMetricsOverride');

// ---------- D1-9 · C11, C12, C13 ----------
await goto("#/item/kt-0004");
report('D1-9/C11 all labels are H4', await cdp.eval(
  `[...document.querySelectorAll('.section-label')].every(e => e.tagName === 'H4')`));

const contrast = `(() => {
  const parse = (s) => {
    let m = s.match(/rgba?\\(([^)]+)\\)/);
    if (m) { const p = m[1].split(',').map(x => parseFloat(x));
      return { r: p[0]/255, g: p[1]/255, b: p[2]/255, a: p.length > 3 ? p[3] : 1 }; }
    m = s.match(/color\\(srgb\\s+([^)]+)\\)/);
    if (m) { const p = m[1].split(/\\s+/).filter(Boolean).map(parseFloat);
      const [r, g, b] = p.slice(0, 3); const a = p.length > 3 ? p[3] : 1;
      return { r, g, b, a }; }
    return null;
  };
  const lin = c => (c <= .03928 ? c/12.92 : ((c+.055)/1.055) ** 2.4);
  const L = c => .2126*lin(c.r) + .7152*lin(c.g) + .0722*lin(c.b);
  const el = document.querySelector('.section-label');
  const fg = parse(getComputedStyle(el).color);
  let bg = parse(getComputedStyle(el).backgroundColor);
  if (!bg || bg.a < 1) {
    const card = parse(getComputedStyle(document.querySelector('.card')).backgroundColor);
    const a = bg ? bg.a : 0;
    bg = { r: a*(bg?.r||0) + (1-a)*card.r, g: a*(bg?.g||0) + (1-a)*card.g,
           b: a*(bg?.b||0) + (1-a)*card.b, a: 1 };
  }
  const ratio = (Math.max(L(fg), L(bg)) + .05) / (Math.min(L(fg), L(bg)) + .05);
  return ratio;
})()`;
for (const theme of ['dark', 'light']) {
  await cdp.eval(`document.documentElement.setAttribute('data-theme', ${JSON.stringify(theme)})`);
  await sleep(100);
  const r = Number(await cdp.eval(contrast));
  report(`D1-9/C12 contrast ${theme} >= 4.5`, r >= 4.5, r.toFixed(2));
}
report('D1-9/C13 auto theme renders labels', await cdp.eval(`(() => {
  document.documentElement.removeAttribute('data-theme');
  const s = getComputedStyle(document.querySelector('.section-label'));
  return s.display === 'inline-block' && s.borderStyle === 'solid';
})()`));

// ---------- FR-028 · traps label carries the danger in words ----------
report('FR-028 traps label wording', EXPECTED[5] === 'What sinks you');

await cdp.close();
console.log('D1 walkthrough complete');
process.exitCode = process.exitCode || 0;