// md.js — small markdown subset (headings ####, bold, italic, inline code, lists, tables,
// paragraphs, links) plus a lightweight Kotlin syntax highlighter. No dependencies.

const CODE_MARK = '';

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(text) {
  let t = escapeHtml(text);
  // Stash code spans first so emphasis markers inside them are left alone.
  const spans = [];
  t = t.replace(/`([^`]+?)`/g, (_, code) => CODE_MARK + (spans.push(`<code>${code}</code>`) - 1) + CODE_MARK);
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
  t = t.replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  t = t.replace(new RegExp(CODE_MARK + '(\\d+)' + CODE_MARK, 'g'), (_, i) => spans[Number(i)]);
  return t;
}

// Render one line of markdown with no block elements — for titles, bullets, and list rows.
export function renderInline(text) {
  return inline(text || '');
}

// Strip markdown markers entirely — for truncated button labels and search rows.
export function stripMarkdown(text) {
  return String(text || '').replace(/`/g, '').replace(/\*\*/g, '').replace(/\*/g, '');
}

// Converts our restricted markdown dialect to HTML.
export function renderMarkdown(src) {
  if (!src) return '';
  const lines = src.split('\n');
  const out = [];
  let listBuf = null;   // 'ul' | 'ol' | null
  let tableBuf = null;  // array of raw table rows
  let paraBuf = [];

  const flushPara = () => {
    if (paraBuf.length) { out.push('<p>' + inline(paraBuf.join(' ')) + '</p>'); paraBuf = []; }
  };
  const flushList = () => {
    if (listBuf) { out.push(`</${listBuf}>`); listBuf = null; }
  };
  const flushTable = () => {
    if (!tableBuf) return;
    const rows = tableBuf.filter(r => !/^\|[\s:|-]+\|$/.test(r.trim()));
    const cells = rows.map(r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
    if (cells.length) {
      const [head, ...body] = cells;
      out.push('<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13.5px;">');
      out.push('<thead><tr>' + head.map(c => `<th style="text-align:left;padding:6px 10px;border-bottom:1px solid var(--border);">${inline(c)}</th>`).join('') + '</tr></thead>');
      out.push('<tbody>' + body.map(r => '<tr>' + r.map(c => `<td style="padding:6px 10px;border-bottom:1px solid var(--border-soft);vertical-align:top;">${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody>');
      out.push('</table></div>');
    }
    tableBuf = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (/^\s*\|.*\|\s*$/.test(line)) {
      flushPara(); flushList();
      (tableBuf ||= []).push(line);
      continue;
    }
    flushTable();

    if (!line.trim()) { flushPara(); flushList(); continue; }

    const heading = line.match(/^#{1,6}\s+(.*)/);
    if (heading) { flushPara(); flushList(); out.push(`<h4>${inline(heading[1])}</h4>`); continue; }

    const ol = line.match(/^\s*\d+\.\s+(.*)/);
    const ul = line.match(/^\s*[-*]\s+(.*)/);
    if (ol) {
      flushPara();
      if (listBuf !== 'ol') { flushList(); out.push('<ol>'); listBuf = 'ol'; }
      out.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }
    if (ul) {
      flushPara();
      if (listBuf !== 'ul') { flushList(); out.push('<ul>'); listBuf = 'ul'; }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }
    flushList();
    paraBuf.push(line);
  }
  flushPara(); flushList(); flushTable();
  return out.join('\n');
}

const KOTLIN_KEYWORDS = new Set(['fun', 'val', 'var', 'class', 'object', 'interface', 'if', 'else', 'when', 'for',
  'while', 'do', 'return', 'is', 'as', 'in', 'out', 'null', 'true', 'false', 'this', 'super', 'try', 'catch',
  'finally', 'throw', 'import', 'package', 'private', 'public', 'protected', 'internal', 'override', 'open',
  'abstract', 'sealed', 'data', 'enum', 'companion', 'init', 'constructor', 'by', 'lateinit', 'const', 'inline',
  'reified', 'suspend', 'operator', 'infix', 'vararg', 'crossinline', 'noinline', 'typealias', 'where', 'it',
  'expect', 'actual', 'value', 'tailrec', 'annotation']);

const KOTLIN_TYPES = new Set(['String', 'Int', 'Long', 'Double', 'Float', 'Boolean', 'Unit', 'Any', 'List',
  'MutableList', 'Map', 'MutableMap', 'Set', 'MutableSet', 'Array', 'Flow', 'StateFlow', 'SharedFlow',
  'MutableStateFlow', 'MutableSharedFlow', 'LiveData', 'MutableLiveData', 'Job', 'SupervisorJob', 'Deferred',
  'CoroutineScope', 'CoroutineContext', 'Dispatchers', 'Modifier', 'Composable', 'ViewModel', 'Context',
  'Bundle', 'Intent', 'Nothing', 'Pair', 'Triple', 'Result', 'Char', 'Byte', 'Sequence', 'Throwable',
  'Exception', 'CancellationException', 'Duration', 'Instant']);

function highlightKotlinLine(line) {
  const re = /(\/\/.*$)|("""[\s\S]*?"""|"(?:[^"\\]|\\.)*")|(@\w+)|(\b0x[0-9a-fA-F]+\b|\b\d[\d_]*\.?\d*[fFLl]?\b)|([A-Za-z_][A-Za-z0-9_]*)/g;
  let last = 0, m, buf = '';
  while ((m = re.exec(line))) {
    buf += escapeHtml(line.slice(last, m.index));
    if (m[1]) buf += `<span class="tok-com">${escapeHtml(m[1])}</span>`;
    else if (m[2]) buf += `<span class="tok-str">${escapeHtml(m[2])}</span>`;
    else if (m[3]) buf += `<span class="tok-ann">${escapeHtml(m[3])}</span>`;
    else if (m[4]) buf += `<span class="tok-num">${escapeHtml(m[4])}</span>`;
    else if (m[5]) {
      const w = m[5];
      if (KOTLIN_KEYWORDS.has(w)) buf += `<span class="tok-kw">${w}</span>`;
      else if (KOTLIN_TYPES.has(w)) buf += `<span class="tok-type">${w}</span>`;
      else buf += w;
    }
    last = re.lastIndex;
  }
  buf += escapeHtml(line.slice(last));
  return buf;
}

export function highlightCode(src, lang) {
  const lines = String(src).split('\n');
  if (lang === 'kotlin' || lang === 'kt' || !lang) return lines.map(highlightKotlinLine).join('\n');
  return lines.map(escapeHtml).join('\n');
}

export function renderCodeBlock(block) {
  const caption = block.caption ? `<div class="code-block__caption">${escapeHtml(block.caption)}</div>` : '';
  return `<div class="code-block">${caption}<pre><code>${highlightCode(block.src, block.lang)}</code></pre></div>`;
}
