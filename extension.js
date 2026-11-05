const vscode = require('vscode');

/* ------------------------------------------------------------------ *
 *  KoRe-HighLight
 *  PRIMARY feature : colored background highlight behind every token.
 *  OPTIONAL extras : text color, font emphasis (bold/italic), font family.
 *  Everything optional is OFF by default.
 * ------------------------------------------------------------------ */

const NS = 'koreHighlight';

/* ---------- palettes: 10 colors + a muted color for comments ---------- */
const PALETTES = {
  pastel:       { label: 'Pastel',        muted: '#dcdce4', colors: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff', '#f7b2d9', '#b8f2e6'] },
  neon:         { label: 'Neon',          muted: '#8a8fa3', colors: ['#ff2e63', '#ff9f1c', '#f9f871', '#39ff14', '#00f5d4', '#00bbf9', '#7b2ff7', '#f15bb5', '#ff6ec7', '#3dffb0'] },
  ocean:        { label: 'Ocean',         muted: '#9fb3c8', colors: ['#0077b6', '#00b4d8', '#48cae4', '#90e0ef', '#2a9d8f', '#52b69a', '#76c893', '#34a0a4', '#1e6091', '#168aad'] },
  sunset:       { label: 'Sunset',        muted: '#d8c3a5', colors: ['#ff595e', '#ff924c', '#ffca3a', '#ff7b54', '#f94144', '#f3722c', '#f8961e', '#c9184a', '#ff8fa3', '#ffb703'] },
  forest:       { label: 'Forest',        muted: '#b5c0a8', colors: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#b7e4c7', '#a3b18a', '#588157', '#8fbc8f', '#bc6c25'] },
  candy:        { label: 'Candy',         muted: '#e8e0ee', colors: ['#ff99c8', '#fcf6bd', '#d0f4de', '#a9def9', '#e4c1f9', '#ffb5a7', '#fec5bb', '#fcd5ce', '#b5ead7', '#c7ceea'] },
  earth:        { label: 'Earth',         muted: '#ddc9b4', colors: ['#bc6c25', '#dda15e', '#fefae0', '#606c38', '#283618', '#e07a5f', '#f2cc8f', '#81b29a', '#a68a64', '#cb997e'] },
  mono:         { label: 'Mono (grays)',  muted: '#777777', colors: ['#ffffff', '#e0e0e0', '#c8c8c8', '#b0b0b0', '#989898', '#808080', '#686868', '#d4d4d4', '#bcbcbc', '#a4a4a4'] },
  highContrast: { label: 'High Contrast', muted: '#cccccc', colors: ['#ffff00', '#00ffff', '#ff00ff', '#00ff00', '#ff8800', '#4da6ff', '#ff4d4d', '#b366ff', '#ffffff', '#00ffaa'] }
};
// which palette slot each token category uses
const CAT_SLOT = { keyword: 6, string: 7, number: 1, function: 5, type: 4, variable: 3 };

/* ---------- presets = palette + shape in one click ---------- */
const PRESETS = {
  'Soft':          { palette: 'pastel', mapping: 'category', opacity: 0.45, borderRadius: 3, highlightSize: 0, textColorMode: 'off' },
  'Marker':        { palette: 'sunset', mapping: 'single', singleColor: '#ffe600', opacity: 0.6, borderRadius: 1, highlightSize: 0, textColorMode: 'off' },
  'Pill':          { palette: 'candy', mapping: 'category', opacity: 0.55, borderRadius: 8, highlightSize: 1, textColorMode: 'off' },
  'Neon Glow':     { palette: 'neon', mapping: 'category', opacity: 0.35, borderRadius: 4, highlightSize: 1, textColorMode: 'off' },
  'Ocean Calm':    { palette: 'ocean', mapping: 'rainbow', opacity: 0.4, borderRadius: 4, highlightSize: 0, textColorMode: 'off' },
  'Forest Calm':   { palette: 'forest', mapping: 'category', opacity: 0.4, borderRadius: 3, highlightSize: 0, textColorMode: 'off' },
  'High Contrast': { palette: 'highContrast', mapping: 'category', opacity: 0.85, borderRadius: 2, highlightSize: 0, textColorMode: 'auto' }
};

const FONT_PRESETS = [
  { label: 'Editor default', value: '', detail: 'Do not change the font (recommended)' },
  { label: 'Fira Code', value: 'Fira Code' },
  { label: 'JetBrains Mono', value: 'JetBrains Mono' },
  { label: 'Cascadia Code', value: 'Cascadia Code' },
  { label: 'Source Code Pro', value: 'Source Code Pro' },
  { label: 'Consolas', value: 'Consolas' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Comic Sans MS', value: 'Comic Sans MS', detail: 'Fun, not monospace' },
  { label: 'Georgia', value: 'Georgia', detail: 'Serif, not monospace' },
  { label: 'Segoe UI', value: 'Segoe UI', detail: 'Sans-serif, not monospace' },
  { label: 'Custom...', value: '__custom__', detail: 'Type any installed font name' }
];

/* ---------- tokenizer ---------- */
const KEYWORDS = new Set(`if else elif for while do switch case break continue return function fn func def
  let const var class struct enum impl trait interface import export from as pub use mod mut async await new
  try catch finally throw throws in of is not and or null nil none None true false True False undefined self
  this super static public private protected package void int float double bool char type match where yield
  lambda with pass raise except del global namespace using extends implements override abstract final default
  goto loop unsafe ref move dyn crate typeof instanceof delete readonly declare module require when then end
  begin elsif unless until echo fi done esac select join group order by insert update create table`
  .split(/\s+/));

const HASH_LANGS = new Set(['python', 'ruby', 'shellscript', 'yaml', 'toml', 'perl', 'r', 'makefile',
  'dockerfile', 'powershell', 'properties', 'ini', 'coffeescript', 'elixir', 'julia', 'nim', 'cmake']);
const DASH_LANGS = new Set(['sql', 'lua', 'haskell', 'plsql', 'ada', 'elm']);
const PROSE = new Set(['plaintext', 'markdown', 'text', 'log', 'latex', 'tex', 'restructuredtext', 'asciidoc']);

const SRC = {
  block: /\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/.source,
  slash: /\/\/[^\n]*/.source,
  hash: /#[^\n]*/.source,
  dash: /--[^\n]*/.source,
  str: /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\[\s\S]|[^`\\])*`/.source,
  num: /0[xX][\da-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?/.source,
  id: /[\p{L}_$][\p{L}\p{N}_$]*/u.source
};

const reCache = new Map();
function regexFor(lang) {
  let re = reCache.get(lang);
  if (re) return re;
  const prose = PROSE.has(lang);
  const line = HASH_LANGS.has(lang) ? SRC.hash : DASH_LANGS.has(lang) ? SRC.dash : SRC.slash;
  const parts = prose
    ? ['(?!)', '(?!)', '(?!)']
    : ['(' + SRC.block + ')', '(' + line + ')', '(' + SRC.str + ')'];
  parts.push('(' + SRC.num + ')', '(' + SRC.id + ')');
  re = new RegExp(parts.join('|'), 'gu');
  reCache.set(lang, re);
  return re;
}

/* ---------- state ---------- */
let cfg = {};
let enabledNow = true;
const types = new Map();
let timer = null;
let status = null;

const HEX = /^#[0-9a-f]{6}$/i;
const isHex = s => typeof s === 'string' && HEX.test(s.trim());

function loadCfg() {
  const c = vscode.workspace.getConfiguration(NS);
  const single = c.get('singleColor', '#ffe08a');
  const custom = (c.get('customPalette', []) || []).filter(isHex);
  const catOverrides = {};
  const raw = c.get('categoryColors', {}) || {};
  for (const k of Object.keys(CAT_SLOT).concat('comment')) if (isHex(raw[k])) catOverrides[k] = raw[k];

  const paletteName = c.get('palette', 'pastel');
  let pal = PALETTES[paletteName];
  if (paletteName === 'custom' && custom.length) {
    pal = { colors: custom, muted: PALETTES.pastel.muted };
  } else if (!pal) {
    pal = PALETTES.pastel;
  }

  const fam = String(c.get('fontFamily', '') || '').trim();
  cfg = {
    enabled: c.get('enabled', true),
    mapping: c.get('mapping', 'category'),
    paletteName: PALETTES[paletteName] || (paletteName === 'custom' && custom.length) ? paletteName : 'pastel',
    pal,
    catOverrides,
    singleColor: isHex(single) ? single : '#ffe08a',
    opacity: clamp(c.get('opacity', 0.45), 0.1, 1),
    radius: clamp(c.get('borderRadius', 3), 0, 12),
    size: clamp(c.get('highlightSize', 0), 0, 3),
    textMode: c.get('textColorMode', 'off'),
    textColor: isHex(c.get('textColor', '#1b1b1f')) ? c.get('textColor') : '#1b1b1f',
    style: {
      keyword: c.get('keywordStyle', 'normal'),
      comment: c.get('commentStyle', 'normal'),
      function: c.get('functionStyle', 'normal'),
      type: c.get('typeStyle', 'normal'),
      string: c.get('stringStyle', 'normal')
    },
    // allow only safe characters: this value is placed inside CSS
    fontFamily: /^[\w\s,'"\-]+$/.test(fam) ? fam : '',
    excluded: c.get('excludedLanguages', []),
    statusBar: c.get('statusBar', true)
  };
  enabledNow = cfg.enabled;
}

function clamp(v, lo, hi) {
  v = Number(v);
  if (!Number.isFinite(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}

function withAlpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
}

function textColorFor(color) {
  switch (cfg.textMode) {
    case 'dark': return '#1b1b1f';
    case 'light': return '#f5f5f7';
    case 'custom': return cfg.textColor;
    case 'auto':
      // only recolor when the highlight is strong enough to decide contrast
      if (cfg.opacity < 0.55) return undefined;
      return luminance(color) > 0.35 ? '#1b1b1f' : '#ffffff';
    default: return undefined;
  }
}

function emphasis(cat) {
  const s = cfg.style[cat] || 'normal';
  return {
    weight: s === 'bold' || s === 'bold-italic' ? 'bold' : undefined,
    italic: s === 'italic' || s === 'bold-italic' ? 'italic' : undefined
  };
}

function typeFor(color, cat) {
  const em = emphasis(cat);
  const key = `${color}|${em.weight || ''}|${em.italic || ''}`;
  let t = types.get(key);
  if (!t) {
    const bg = withAlpha(color, cfg.opacity);
    let css = `none; border-radius:${cfg.radius}px`;
    if (cfg.size > 0) css += `; box-shadow:0 0 0 ${cfg.size}px ${bg}`;
    if (cfg.fontFamily) css += `; font-family:${cfg.fontFamily}, monospace`;
    t = vscode.window.createTextEditorDecorationType({
      backgroundColor: bg,
      color: textColorFor(color),
      fontWeight: em.weight,
      fontStyle: em.italic,
      textDecoration: css,
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
    });
    types.set(key, t);
  }
  return t;
}

function disposeTypes() {
  for (const t of types.values()) t.dispose();
  types.clear();
}

function hash(word) {
  let h = 0;
  for (const ch of word.toLowerCase()) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h;
}

function categoryColor(cat) {
  if (cfg.catOverrides[cat]) return cfg.catOverrides[cat];
  if (cat === 'comment') return cfg.pal.muted;
  return cfg.pal.colors[CAT_SLOT[cat] % cfg.pal.colors.length];
}

function clear(editor) {
  for (const t of types.values()) editor.setDecorations(t, []);
}

function render(editor) {
  const doc = editor.document;
  const lang = doc.languageId;
  if (!enabledNow || cfg.excluded.includes(lang) ||
      doc.uri.scheme === 'output' || doc.uri.scheme === 'vscode-terminal') {
    clear(editor);
    return;
  }
  if (!editor.visibleRanges.length) return;

  const BUF = 150;
  const first = Math.max(0, Math.min(...editor.visibleRanges.map(r => r.start.line)) - BUF);
  const last = Math.min(doc.lineCount - 1, Math.max(...editor.visibleRanges.map(r => r.end.line)) + BUF);
  const startPos = new vscode.Position(first, 0);
  const text = doc.getText(new vscode.Range(startPos, doc.lineAt(last).range.end));
  const base = doc.offsetAt(startPos);
  const prose = PROSE.has(lang);
  const mapping = prose && cfg.mapping === 'category' ? 'rainbow' : cfg.mapping;
  const colors = cfg.pal.colors;

  const re = regexFor(lang);
  re.lastIndex = 0;
  const groups = new Map();            // key -> {color, cat, ranges}
  let m, count = 0, lastLine = -1, idxInLine = 0;

  while ((m = re.exec(text)) && count < 30000) {
    count++;
    const w = m[0];
    if (!w) { re.lastIndex++; continue; }   // safety: never loop on empty match
    const s = doc.positionAt(base + m.index);
    if (s.line !== lastLine) { lastLine = s.line; idxInLine = 0; } else idxInLine++;

    let cat;
    if (m[1] !== undefined || m[2] !== undefined) cat = 'comment';
    else if (m[3] !== undefined) cat = 'string';
    else if (m[4] !== undefined) cat = 'number';
    else if (!prose && KEYWORDS.has(w)) cat = 'keyword';
    else {
      let j = re.lastIndex;
      while (text[j] === ' ' || text[j] === '\t') j++;
      if (!prose && text[j] === '(') cat = 'function';
      else if (!prose && /^\p{Lu}/u.test(w)) cat = 'type';
      else cat = 'variable';
    }

    let color;
    if (mapping === 'single') color = cfg.singleColor;
    else if (mapping === 'word') color = colors[hash(w) % colors.length];
    else if (mapping === 'rainbow') color = colors[(s.line + idxInLine) % colors.length];
    else color = categoryColor(cat);

    const e = doc.positionAt(base + m.index + w.length);
    const em = emphasis(cat);
    const key = `${color}|${em.weight || ''}|${em.italic || ''}`;
    let g = groups.get(key);
    if (!g) groups.set(key, (g = { color, cat, ranges: [] }));
    g.ranges.push(new vscode.Range(s, e));
  }

  for (const [key, g] of groups) editor.setDecorations(typeFor(g.color, g.cat), g.ranges);
  for (const [key, t] of types) if (!groups.has(key)) editor.setDecorations(t, []);
}

function refresh(delay = 60) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    vscode.window.visibleTextEditors.forEach(render);
  }, delay);
}

function updateStatus() {
  if (!status) return;
  if (!cfg.statusBar) { status.hide(); return; }
  status.text = `$(symbol-color) KoRe: ${enabledNow ? cfg.mapping + ' · ' + cfg.paletteName : 'off'}`;
  status.tooltip = 'KoRe-HighLight: click to toggle on/off';
  status.show();
}

const G = vscode.ConfigurationTarget.Global;
const conf = () => vscode.workspace.getConfiguration(NS);

async function pickHex(prompt, value) {
  return vscode.window.showInputBox({
    prompt, value,
    validateInput: s => isHex(s) ? null : 'Use a hex color like #ffe08a'
  });
}

function activate(context) {
  loadCfg();

  status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  status.command = `${NS}.toggle`;
  updateStatus();

  const reg = (id, fn) => vscode.commands.registerCommand(`${NS}.${id}`, fn);

  context.subscriptions.push(
    status,
    { dispose: disposeTypes },

    reg('toggle', () => conf().update('enabled', !enabledNow, G)),

    reg('chooseMapping', async () => {
      const pick = await vscode.window.showQuickPick([
        { label: 'category', description: 'Color by token type (keywords, strings, numbers...)' },
        { label: 'word', description: 'Same word, same color everywhere' },
        { label: 'rainbow', description: 'Cycle through the palette across each line' },
        { label: 'single', description: 'One color for everything' }
      ], { placeHolder: 'Choose a color mapping' });
      if (!pick) return;
      if (pick.label === 'single') {
        const v = await pickHex('Highlight color (#rrggbb)', cfg.singleColor);
        if (v) await conf().update('singleColor', v.trim(), G);
      }
      await conf().update('mapping', pick.label, G);
    }),

    reg('choosePalette', async () => {
      const items = Object.entries(PALETTES).map(([id, p]) => ({
        label: p.label, id, description: p.colors.slice(0, 6).join('  ')
      }));
      items.push({ label: 'Custom', id: 'custom', description: 'Use koreHighlight.customPalette (your own hex colors)' });
      const pick = await vscode.window.showQuickPick(items, { placeHolder: 'Choose a color palette' });
      if (!pick) return;
      if (pick.id === 'custom' && !(conf().get('customPalette', []) || []).filter(isHex).length) {
        const v = await vscode.window.showInputBox({
          prompt: 'Enter your colors, separated by commas (#rrggbb)',
          value: '#ff6b6b, #feca57, #48dbfb, #1dd1a1, #5f27cd',
          validateInput: s => {
            const l = s.split(',').map(x => x.trim()).filter(Boolean);
            return l.length && l.every(isHex) ? null : 'Use hex colors like #ff6b6b, separated by commas';
          }
        });
        if (!v) return;
        await conf().update('customPalette', v.split(',').map(x => x.trim()).filter(Boolean), G);
      }
      await conf().update('palette', pick.id, G);
    }),

    reg('choosePreset', async () => {
      const pick = await vscode.window.showQuickPick(Object.keys(PRESETS).map(k => ({
        label: k,
        description: `${PRESETS[k].palette}, opacity ${PRESETS[k].opacity}, radius ${PRESETS[k].borderRadius}px`
      })), { placeHolder: 'Choose a highlight preset' });
      if (!pick) return;
      for (const [k, v] of Object.entries(PRESETS[pick.label])) await conf().update(k, v, G);
    }),

    reg('chooseFont', async () => {
      const pick = await vscode.window.showQuickPick(FONT_PRESETS, {
        placeHolder: 'Optional: font for highlighted text (must be installed on your computer)'
      });
      if (!pick) return;
      let value = pick.value;
      if (value === '__custom__') {
        value = await vscode.window.showInputBox({
          prompt: 'Font family name (letters, numbers, spaces, commas only)',
          validateInput: s => /^[\w\s,'"\-]+$/.test(s) ? null : 'Only letters, numbers, spaces, commas and hyphens'
        });
        if (value === undefined) return;
      }
      await conf().update('fontFamily', value, G);
      if (value) vscode.window.showInformationMessage(
        'KoRe-HighLight: non-monospace fonts can make the cursor drift slightly. Choose "Editor default" to undo.');
    }),

    reg('chooseTextColor', async () => {
      const pick = await vscode.window.showQuickPick([
        { label: 'off', description: 'Keep my theme text colors (default)' },
        { label: 'auto', description: 'Dark or light text, whichever reads best (needs opacity 0.55+)' },
        { label: 'dark', description: 'Always dark text' },
        { label: 'light', description: 'Always light text' },
        { label: 'custom', description: 'Pick your own text color' }
      ], { placeHolder: 'Optional: change the text color on highlights' });
      if (!pick) return;
      if (pick.label === 'custom') {
        const v = await pickHex('Text color (#rrggbb)', cfg.textColor);
        if (!v) return;
        await conf().update('textColor', v.trim(), G);
      }
      await conf().update('textColorMode', pick.label, G);
    }),

    reg('reset', async () => {
      const c = conf();
      for (const k of ['mapping', 'palette', 'customPalette', 'categoryColors', 'singleColor', 'opacity',
        'borderRadius', 'highlightSize', 'textColorMode', 'textColor', 'keywordStyle', 'commentStyle',
        'functionStyle', 'typeStyle', 'stringStyle', 'fontFamily']) await c.update(k, undefined, G);
      vscode.window.showInformationMessage('KoRe-HighLight: settings reset to defaults.');
    }),

    vscode.workspace.onDidChangeConfiguration(e => {
      if (!e.affectsConfiguration(NS)) return;
      loadCfg();
      disposeTypes();
      updateStatus();
      refresh(0);
    }),
    vscode.workspace.onDidChangeTextDocument(() => refresh(40)),
    vscode.window.onDidChangeActiveTextEditor(() => refresh(0)),
    vscode.window.onDidChangeVisibleTextEditors(() => refresh(0)),
    vscode.window.onDidChangeTextEditorVisibleRanges(() => refresh(60))
  );

  refresh(0);
}

function deactivate() { disposeTypes(); }

module.exports = { activate, deactivate };
