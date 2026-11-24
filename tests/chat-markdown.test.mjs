import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), root).href;
    if ((specifier.startsWith('file:') || specifier.startsWith('.')) && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      for (const ext of ['.ts', '.tsx']) if (existsSync(fileURLToPath(url) + ext)) { specifier = url.href + ext; break; }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(root.href) && /\.tsx?$/.test(url)) {
      const source = readFileSync(fileURLToPath(url), 'utf8');
      return { format: 'module', shortCircuit: true, source: url.endsWith('.tsx')
        ? ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
        : stripTypeScriptTypes(source, { mode: 'transform' }) };
    }
    return next(url, context);
  },
});
const { parseMarkdown } = await import('../src/shared/utils/markdown.ts');
const chat = (text) => parseMarkdown(text, { tables: true, preserveLineBreaks: true });
const value = (nodes) => nodes.map((node) => node.text).join('');

test('tables preserve headers, formatting, alignment and surrounding blocks', () => {
  const blocks = chat('# Menu\nBefore\n| Meal | kcal | Note |\n| :--- | ---: | :---: |\n| **Rice** | 200 | [More](https://example.com) |\n\nAfter');
  assert.deepEqual(blocks.map((block) => block.kind), ['heading', 'paragraph', 'table', 'paragraph']);
  const table = blocks[2];
  assert.deepEqual(table.headers.map(value), ['Meal', 'kcal', 'Note']);
  assert.deepEqual(table.alignments, ['left', 'right', 'center']);
  assert.deepEqual(table.rows[0][0], [{ kind: 'bold', text: 'Rice' }]);
  assert.equal(table.rows[0][2][0].kind, 'link');
});

test('optional outside pipes, CRLF, escaped pipes, empty and uneven cells', () => {
  const [table] = chat('Food | Note | kcal\r\n--- | --- | ---\r\nRice \\| beans | `a\\|b` | 12\r\nSoup |\r\nEgg | fine | 10 | extra');
  assert.equal(table.kind, 'table');
  assert.deepEqual(table.rows.map((row) => row.map(value)), [['Rice | beans', 'a|b', '12'], ['Soup', '', ''], ['Egg', 'fine', '10']]);
  assert.equal(table.rows[0][1][0].kind, 'code');
});

test('a valid table header can arrive before its streamed body', () => {
  const source = '| A | B |\n| --- | --- |\n| 1 | 2 |';
  for (let i = 0; i <= source.length; i++) assert.doesNotThrow(() => chat(source.slice(0, i)));
  assert.equal(chat('| A | B |\n| --- | --- |')[0].kind, 'table');
  assert.equal(chat('| A | B |\n| --')[0].kind, 'paragraph');
  assert.equal(chat(source)[0].rows.length, 1);
});

test('AI table from the reported screenshot accepts blank lines between header, separator and rows', () => {
  const source = 'Tra tài liệu Vedora có số liệu:\n\n| Loại đậu phụ | Khẩu phần | Đạm |\n\n|---|---|---|\n\n| Firm (đậu phụ cứng) | ¼ bánh, 81 g | 7 g |\n\n| Soft (đậu phụ mềm) | 1 miếng, 120 g | 8 g |\n\nQuy ra thì đậu phụ cứng khoảng **8,6 g đạm/100 g**.';
  const blocks = chat(source);
  assert.deepEqual(blocks.map((block) => block.kind), ['paragraph', 'table', 'paragraph']);
  assert.deepEqual(blocks[1].headers.map(value), ['Loại đậu phụ', 'Khẩu phần', 'Đạm']);
  assert.deepEqual(blocks[1].rows.map((row) => row.map(value)), [
    ['Firm (đậu phụ cứng)', '¼ bánh, 81 g', '7 g'], ['Soft (đậu phụ mềm)', '1 miếng, 120 g', '8 g'],
  ]);
  // Every streamed prefix must preserve the rows received so far, without losing the surrounding answer.
  for (let i = 0; i <= source.length; i++) assert.doesNotThrow(() => chat(source.slice(0, i)));
});

test('spaced tables stay separate from a second table, headings, lists and code', () => {
  const first = '| A | B |\n\n| --- | --- |\n\n| 1 | 2 |';
  const blocks = chat(first + '\n\n| C | D |\n\n| --- | --- |\n\n| 3 | 4 |\n\n# Notes | extra\n\n- x | y\n\n```\n| code |\n```');
  assert.deepEqual(blocks.map((block) => block.kind), ['table', 'table', 'heading', 'list', 'code']);
  assert.equal(blocks[0].rows.length, 1);
  assert.equal(blocks[1].rows.length, 1);
});

test('invalid separators and ordinary pipes remain text, including unsafe links', () => {
  for (const source of ['A | B\n--- | --', 'A | B\n---', 'A | B\n--- | --- | ---', 'A | B']) {
    assert.ok(chat(source).every((block) => block.kind !== 'table'));
  }
  assert.deepEqual(chat('| A |\n| --- |\n| [x](javascript:alert) |')[0].rows[0][0], [{ kind: 'text', text: 'x' }]);
});

test('code fences and line breaks remain intact; default blog parsing stays compatible', async () => {
  const source = '```md\n| A | B |\n| --- | --- |\n| 1 | 2 |\n```\nLine one\nLine two\n\n- Item';
  const blocks = chat(source);
  assert.deepEqual(blocks.map((block) => block.kind), ['code', 'paragraph', 'list']);
  assert.equal(blocks[0].text, '| A | B |\n| --- | --- |\n| 1 | 2 |');
  assert.equal(value(blocks[1].inline), 'Line one\nLine two');
  assert.equal(value(parseMarkdown('one\ntwo')[0].inline), 'one two');
  assert.equal(parseMarkdown('| A |\n| --- |')[0].kind, 'paragraph');
  const legacy = await import('../src/features/blogs/utils/markdown.ts');
  assert.equal(legacy.parseMarkdown, parseMarkdown);
});

mock.module('react', { namedExports: { useMemo: (fn) => fn() } });
const jsx = (type, props) => ({ type, props });
mock.module('react/jsx-runtime', { namedExports: { jsx, jsxs: jsx, Fragment: 'Fragment' } });
mock.module('react-native', { namedExports: {
  Linking: { openURL: async () => {} }, ScrollView: 'ScrollView', View: 'View', Text: 'Text',
  StyleSheet: { create: (styles) => styles, hairlineWidth: 1 },
} });
mock.module(new URL('../src/hooks/use-theme.ts', import.meta.url).href, { namedExports: {
  useTheme: () => ({ border: '#444', mutedForeground: '#aaa', foreground: '#fff', secondary: '#222' }),
} });
const { ChatMarkdown } = await import('../src/shared/components/chat/chat-markdown.tsx');
function expand(node) {
  if (node == null || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(expand);
  if (typeof node.type === 'function') return expand(node.type(node.props));
  return { type: node.type, props: { ...node.props, children: expand(node.props.children) } };
}
function find(node, type) {
  if (node == null || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap((child) => find(child, type));
  return [...(node.type === type ? [node] : []), ...find(node.props.children, type)];
}
test('chat renders a bounded horizontal table, accessible headers and selectable aligned cells', () => {
  const tree = expand(ChatMarkdown({ text: '| Food | kcal |\n\n| --- | ---: |\n\n| Rice | 200 |', color: '#fff', cursor: true }));
  const scroll = find(tree, 'ScrollView');
  assert.equal(scroll.length, 1);
  assert.equal(scroll[0].props.horizontal, true);
  assert.equal(scroll[0].props.nestedScrollEnabled, true);
  assert.equal(scroll[0].props.style.maxWidth, '100%');
  const cells = find(scroll[0], 'Text').filter((node) => node.props.selectable);
  assert.equal(cells.length, 4);
  assert.equal(cells.filter((node) => node.props.accessibilityRole === 'header').length, 2);
  assert.equal(cells[3].props.style[1].textAlign, 'right');
  const [table, headerRow, headerCell, , , bodyCell, secondBodyCell] = find(scroll[0], 'View');
  assert.equal(table.props.style[0].borderRadius, 0);
  assert.equal(table.props.style[1].width, 290);
  assert.equal(table.props.style[1].borderColor, '#aaa');
  assert.equal(headerRow.props.style[0].gap, 0);
  assert.equal(headerRow.props.style[0].alignItems, 'stretch');
  assert.equal(headerCell.props.style[0].flexShrink, 0);
  assert.equal(bodyCell.props.style[3].borderTopWidth, 1);
  assert.equal(secondBodyCell.props.style[2].borderLeftWidth, 1);
});
