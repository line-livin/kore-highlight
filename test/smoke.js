// Smoke test with a mocked "vscode" module (run: node test/smoke.js)
const Module = require('module');
const settings = { palette: 'neon', mapping: 'category', opacity: 0.7, highlightSize: 2, textColorMode: 'auto',
  keywordStyle: 'bold', commentStyle: 'italic', fontFamily: 'Fira Code', borderRadius: 6 };
const created = []; const applied = new Map();
class Pos { constructor(l, c) { this.line = l; this.character = c; } }
class Range { constructor(s, e) { this.start = s; this.end = e; } }
const code = `// hello\nconst Foo = bar(42, "x"); # nope\nif (a) { return Baz; }\n`;
const lines = code.split('\n');
const doc = {
  languageId: 'javascript', uri: { scheme: 'file' }, lineCount: lines.length,
  getText: () => code, offsetAt: () => 0,
  positionAt: o => { let l = 0; while (o > lines[l].length) { o -= lines[l].length + 1; l++; } return new Pos(l, o); },
  lineAt: n => ({ range: { end: new Pos(n, lines[n].length) } })
};
const editor = { document: doc, visibleRanges: [new Range(new Pos(0, 0), new Pos(2, 0))],
  setDecorations: (t, r) => applied.set(t, r) };
const vscode = {
  Position: Pos, Range, DecorationRangeBehavior: { ClosedClosed: 1 }, ConfigurationTarget: { Global: 1 }, StatusBarAlignment: { Right: 2 },
  workspace: { getConfiguration: () => ({ get: (k, d) => k in settings ? settings[k] : d, update: async () => {} }),
    onDidChangeConfiguration: () => ({}), onDidChangeTextDocument: () => ({}) },
  window: { visibleTextEditors: [editor], createTextEditorDecorationType: o => { const t = { o, dispose() {} }; created.push(t); return t; },
    createStatusBarItem: () => ({ show() {}, hide() {}, dispose() {} }), onDidChangeActiveTextEditor: () => ({}),
    onDidChangeVisibleTextEditors: () => ({}), onDidChangeTextEditorVisibleRanges: () => ({}) },
  commands: { registerCommand: (id) => { cmds.push(id); return {}; } }
};
const cmds = [];
const orig = Module._load;
Module._load = function (r, ...a) { return r === 'vscode' ? vscode : orig.call(this, r, ...a); };
const ext = require('../extension.js');
ext.activate({ subscriptions: [] });
setTimeout(() => {
  console.log('commands:', cmds.join(', '));
  console.log('decoration types:', created.length);
  const total = [...applied.values()].reduce((n, r) => n + r.length, 0);
  console.log('ranges highlighted:', total);
  console.log('sample type:', JSON.stringify(created[0].o));
  if (!total || !created.length) process.exit(1);
  ext.deactivate();
}, 100);
