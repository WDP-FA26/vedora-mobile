/**
 * The blog editor's document model. The saved blog is Markdown (that is what the API stores), but while writing
 * it is a list of blocks so the author sees bold, italic, headings and pictures instead of Markdown marks:
 * text blocks keep plain text plus a per-character format, image blocks keep a picture, and anything the editor
 * does not model (code fences, rules) stays as a raw block that round-trips untouched.
 */

export const BOLD = 1;
export const ITALIC = 2;

export type TextType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet' | 'number' | 'quote';
export type TextBlock = { id: string; type: TextType; text: string; /** One bit set per character: BOLD, ITALIC. */ marks: number[] };
export type ImageBlock = { id: string; type: 'image'; url: string; alt: string };
export type RawBlock = { id: string; type: 'raw'; text: string };
export type Block = TextBlock | ImageBlock | RawBlock;

export const isTextBlock = (block: Block | undefined): block is TextBlock => !!block && block.type !== 'image' && block.type !== 'raw';

let counter = 0;
const nextId = () => `b${Date.now().toString(36)}${(counter++).toString(36)}`;

export function textBlock(type: TextType = 'paragraph', text = '', marks?: number[]): TextBlock {
  return { id: nextId(), type, text, marks: marks ?? new Array(text.length).fill(0) };
}

const isSpace = (char: string | undefined) => !char || /\s/.test(char);
const isWord = (char: string | undefined) => !!char && /[\p{L}\p{N}]/u.test(char);

/** Reads `**bold**`, `*italic*`, `***both***` and the `__`/`_` forms. Anything unpaired stays literal text. */
export function parseInline(source: string): { text: string; marks: number[] } {
  type Mark = { kind: 'b' | 'i'; at: number; len: number; canOpen: boolean; canClose: boolean };
  const found: Mark[] = [];
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (char !== '*' && char !== '_') continue;
    const len = source[index + 1] === char ? 2 : 1;
    const before = source[index - 1];
    const after = source[index + len];
    if (char === '_' && isWord(before) && isWord(after)) { index += len - 1; continue; } // snake_case
    found.push({ kind: len === 2 ? 'b' : 'i', at: index, len, canOpen: !isSpace(after), canClose: !isSpace(before) });
    index += len - 1;
  }

  const open: { b?: number; i?: number } = {};
  const pairs: [Mark, Mark][] = [];
  found.forEach((mark, position) => {
    const openerPosition = open[mark.kind];
    const opener = openerPosition === undefined ? undefined : found[openerPosition];
    if (mark.canClose && opener && mark.at > opener.at + opener.len) {
      pairs.push([opener, mark]);
      open[mark.kind] = undefined;
    } else if (mark.canOpen) {
      open[mark.kind] = position;
    }
  });

  const skip = new Set<number>();
  const flags = new Array<number>(source.length).fill(0);
  for (const [start, end] of pairs) {
    for (let at = start.at; at < start.at + start.len; at++) skip.add(at);
    for (let at = end.at; at < end.at + end.len; at++) skip.add(at);
    for (let at = start.at + start.len; at < end.at; at++) flags[at] |= start.kind === 'b' ? BOLD : ITALIC;
  }
  let text = '';
  const marks: number[] = [];
  for (let at = 0; at < source.length; at++) {
    if (skip.has(at)) continue;
    text += source[at];
    marks.push(flags[at]);
  }
  return { text, marks };
}

/** Plain text plus its format back to Markdown; `map[i]` is where character `i` lands in the output. */
export function inlineToMarkdown(text: string, marks: number[]): { md: string; map: number[] } {
  let md = '';
  const map: number[] = [];
  let start = 0;
  while (start < text.length) {
    const flag = marks[start] ?? 0;
    let end = start + 1;
    while (end < text.length && (marks[end] ?? 0) === flag) end++;
    const segment = text.slice(start, end);
    const lead = /^\s*/.exec(segment)?.[0].length ?? 0;
    const trail = /\s*$/.exec(segment)?.[0].length ?? 0;
    const coreLength = segment.length - lead - trail;
    if (flag === 0 || coreLength <= 0) {
      for (let at = 0; at < segment.length; at++) map.push(md.length + at);
      md += segment;
    } else {
      const mark = flag === (BOLD | ITALIC) ? '***' : flag === BOLD ? '**' : '*';
      for (let at = 0; at < lead; at++) map.push(md.length + at);
      md += segment.slice(0, lead) + mark;
      for (let at = 0; at < coreLength; at++) map.push(md.length + at);
      md += segment.slice(lead, lead + coreLength) + mark;
      for (let at = 0; at < trail; at++) map.push(md.length + at);
      md += segment.slice(lead + coreLength);
    }
    start = end;
  }
  map.push(md.length);
  return { md, map };
}

const FENCE = /^\s*(```|~~~)/;
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/;
const IMAGE_LINE = /^\s*!\[([^\]]*)\]\((\S+?)\)\s*$/;
const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBER = /^\s*\d+[.)]\s+(.*)$/;
const QUOTE = /^\s{0,3}>\s?(.*)$/;

function inlineBlock(type: TextType, source: string): TextBlock {
  const { text, marks } = parseInline(source);
  return textBlock(type, text, marks);
}

export function markdownToBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push(inlineBlock('paragraph', paragraph.join('\n')));
    paragraph = [];
  };

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const fence = FENCE.exec(line);
    if (fence) {
      flush();
      const raw = [line];
      while (index + 1 < lines.length) {
        index++;
        raw.push(lines[index]);
        if (lines[index].trim().startsWith(fence[1])) break;
      }
      blocks.push({ id: nextId(), type: 'raw', text: raw.join('\n') });
      continue;
    }
    if (!line.trim()) { flush(); continue; }
    if (RULE.test(line)) { flush(); blocks.push({ id: nextId(), type: 'raw', text: line.trim() }); continue; }
    const image = IMAGE_LINE.exec(line);
    if (image) { flush(); blocks.push({ id: nextId(), type: 'image', alt: image[1], url: image[2] }); continue; }
    const heading = HEADING.exec(line);
    if (heading) { flush(); blocks.push(inlineBlock(heading[1].length === 1 ? 'h1' : heading[1].length === 2 ? 'h2' : 'h3', heading[2])); continue; }
    const bullet = BULLET.exec(line);
    if (bullet) { flush(); blocks.push(inlineBlock('bullet', bullet[1])); continue; }
    const numbered = NUMBER.exec(line);
    if (numbered) { flush(); blocks.push(inlineBlock('number', numbered[1])); continue; }
    const quote = QUOTE.exec(line);
    if (quote) { flush(); blocks.push(inlineBlock('quote', quote[1])); continue; }
    paragraph.push(line.trimEnd());
  }
  flush();
  return withTrailingParagraph(blocks);
}

const PREFIX: Record<TextType, string> = { paragraph: '', h1: '# ', h2: '## ', h3: '### ', bullet: '- ', number: '', quote: '> ' };

/**
 * Markdown for the whole document. `starts[i]` is where block `i`'s text begins in the output (after its
 * `## `/`- ` mark, or -1 for a block that is not written, e.g. an empty paragraph); `maps[i]` maps a character
 * of that block's text to its place in the output, so a selection can be reported in Markdown coordinates.
 */
export function blocksToMarkdownMapped(blocks: Block[]): { markdown: string; starts: number[]; maps: number[][] } {
  let out = '';
  let previous: Block | null = null;
  let counted = 0;
  const starts: number[] = [];
  const maps: number[][] = [];

  for (const block of blocks) {
    let prefix = '';
    let body = '';
    let map: number[] = [];
    if (block.type === 'image') {
      body = `![${block.alt.replace(/[[\]\n]/g, ' ').trim()}](${block.url})`;
    } else if (block.type === 'raw') {
      body = block.text;
    } else {
      if (!block.text.trim()) { starts.push(-1); maps.push([]); continue; }
      const inline = inlineToMarkdown(block.text, block.marks);
      body = block.type === 'quote' ? inline.md.replace(/\n/g, '\n> ') : inline.md;
      map = inline.map;
      counted = block.type === 'number' ? (previous && isTextBlock(previous) && previous.type === 'number' ? counted + 1 : 1) : 0;
      prefix = block.type === 'number' ? `${counted}. ` : PREFIX[block.type];
    }
    const sameList = previous && isTextBlock(previous) && isTextBlock(block) && previous.type === block.type && (block.type === 'bullet' || block.type === 'number' || block.type === 'quote');
    const separator = out === '' ? '' : sameList ? '\n' : '\n\n';
    out += separator;
    starts.push(out.length + prefix.length);
    maps.push(map);
    out += prefix + body;
    previous = block;
  }
  return { markdown: out, starts, maps };
}

export const blocksToMarkdown = (blocks: Block[]) => blocksToMarkdownMapped(blocks).markdown;

/** The document always ends in a text block so there is somewhere to keep typing after a picture. */
export function withTrailingParagraph(blocks: Block[]): Block[] {
  const last = blocks.at(-1);
  return isTextBlock(last) ? blocks : [...blocks, textBlock()];
}

const replaceBlock = (blocks: Block[], id: string, next: Block | Block[]) =>
  blocks.flatMap((block) => (block.id === id ? (Array.isArray(next) ? next : [next]) : [block]));

/**
 * The text of block `id` became `value` (typing, deleting, pasting). The change is found by comparing with the old
 * text, so formats stay where they were; new characters take the format of what they replace or follow, or
 * `pending` when the author toggled bold/italic with nothing selected.
 */
export function changeText(blocks: Block[], id: string, value: string, pending: number | null = null): Block[] {
  return blocks.map((block) => {
    if (block.id !== id || !isTextBlock(block) || block.text === value) return block;
    const old = block.text;
    let prefix = 0;
    const limit = Math.min(old.length, value.length);
    while (prefix < limit && old[prefix] === value[prefix]) prefix++;
    let suffix = 0;
    while (suffix < limit - prefix && old[old.length - 1 - suffix] === value[value.length - 1 - suffix]) suffix++;
    const inserted = value.length - prefix - suffix;
    const removed = old.length - prefix - suffix;
    const inherited = removed > 0 ? block.marks[prefix] ?? 0 : prefix > 0 ? block.marks[prefix - 1] ?? 0 : block.marks[0] ?? 0;
    const flag = pending ?? inherited;
    const marks = [
      ...block.marks.slice(0, prefix),
      ...new Array<number>(Math.max(0, inserted)).fill(flag),
      ...block.marks.slice(old.length - suffix),
    ];
    return { ...block, text: value, marks };
  });
}

/** Sets or clears `flag` on a range: if every character already has it the flag is removed, otherwise added. */
export function toggleMark(blocks: Block[], id: string, start: number, end: number, flag: number): Block[] {
  return blocks.map((block) => {
    if (block.id !== id || !isTextBlock(block) || end <= start) return block;
    const all = block.marks.slice(start, end).every((value) => (value & flag) !== 0);
    const marks = block.marks.map((value, at) => (at >= start && at < end ? (all ? value & ~flag : value | flag) : value));
    return { ...block, marks };
  });
}

/** Active formats at the cursor or over the selection (a flag counts when every selected character has it). */
export function activeMarks(block: Block | undefined, start: number, end: number, pending: number | null): number {
  if (!isTextBlock(block)) return 0;
  if (end > start) return block.marks.slice(start, end).reduce((all, value) => all & value, BOLD | ITALIC);
  if (pending !== null) return pending;
  return start > 0 ? block.marks[start - 1] ?? 0 : 0;
}

/** Turns a block into `type`, or back into a paragraph if it already has that type. */
export function setBlockType(blocks: Block[], id: string, type: TextType): Block[] {
  return blocks.map((block) => (block.id === id && isTextBlock(block) ? { ...block, type: block.type === type ? 'paragraph' : type } : block));
}

/** Enter pressed at `at`: the text after it moves to a new block. Lists continue; an empty list item ends the list. */
export function splitBlock(blocks: Block[], id: string, at: number): { blocks: Block[]; focusId: string; caret: number } {
  const block = blocks.find((item) => item.id === id);
  if (!isTextBlock(block)) return { blocks, focusId: id, caret: 0 };
  if (block.text === '' && (block.type === 'bullet' || block.type === 'number' || block.type === 'quote')) {
    return { blocks: setBlockType(blocks, id, block.type), focusId: id, caret: 0 };
  }
  const continues = block.type === 'bullet' || block.type === 'number' || block.type === 'quote';
  const next = textBlock(continues ? block.type : 'paragraph', block.text.slice(at), block.marks.slice(at));
  const head: TextBlock = { ...block, text: block.text.slice(0, at), marks: block.marks.slice(0, at) };
  return { blocks: replaceBlock(blocks, id, [head, next]), focusId: next.id, caret: 0 };
}

/** Backspace at the very start: a styled block becomes a paragraph; a paragraph joins the text block before it. */
export function backspaceAtStart(blocks: Block[], id: string): { blocks: Block[]; focusId: string; caret: number } {
  const index = blocks.findIndex((item) => item.id === id);
  const block = blocks[index];
  if (!isTextBlock(block)) return { blocks, focusId: id, caret: 0 };
  if (block.type !== 'paragraph') return { blocks: setBlockType(blocks, id, block.type), focusId: id, caret: 0 };
  const before = blocks[index - 1];
  if (isTextBlock(before)) {
    const merged: TextBlock = { ...before, text: before.text + block.text, marks: [...before.marks, ...block.marks] };
    return { blocks: blocks.filter((item) => item.id !== id).map((item) => (item.id === before.id ? merged : item)), focusId: before.id, caret: before.text.length };
  }
  if (before && block.text === '' && blocks.length > 1) {
    // An empty line right after a picture or code block: drop the line, keep the picture.
    return { blocks: withTrailingParagraph(blocks.filter((item) => item.id !== id)), focusId: before.id, caret: 0 };
  }
  return { blocks, focusId: id, caret: 0 };
}

/** Puts a picture after block `afterId` (or at the end) and makes sure there is text after it. */
export function insertImageBlock(blocks: Block[], afterId: string | null, url: string, alt = ''): { blocks: Block[]; imageId: string } {
  const image: ImageBlock = { id: nextId(), type: 'image', url, alt };
  const index = afterId ? blocks.findIndex((block) => block.id === afterId) : -1;
  const at = index === -1 ? blocks.length : index + 1;
  // Inserting after an untouched empty paragraph reuses that line instead of leaving a gap.
  const target = blocks[index];
  const replacesEmpty = isTextBlock(target) && target.type === 'paragraph' && target.text === '' ? index : -1;
  const next = replacesEmpty >= 0 ? [...blocks.slice(0, replacesEmpty), image, ...blocks.slice(replacesEmpty + 1)] : [...blocks.slice(0, at), image, ...blocks.slice(at)];
  return { blocks: withTrailingParagraph(next), imageId: image.id };
}

export function removeBlock(blocks: Block[], id: string): Block[] {
  const next = blocks.filter((block) => block.id !== id);
  return withTrailingParagraph(next.length ? next : [textBlock()]);
}

export function moveBlock(blocks: Block[], id: string, delta: -1 | 1): Block[] {
  const index = blocks.findIndex((block) => block.id === id);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= blocks.length) return blocks;
  const next = [...blocks];
  [next[index], next[target]] = [next[target], next[index]];
  return withTrailingParagraph(next);
}

export function setImageAlt(blocks: Block[], id: string, alt: string): Block[] {
  return blocks.map((block) => (block.id === id && block.type === 'image' ? { ...block, alt } : block));
}

export function setRawText(blocks: Block[], id: string, text: string): Block[] {
  return blocks.map((block) => (block.id === id && block.type === 'raw' ? { ...block, text } : block));
}

/** Number shown next to a numbered item: its position among the numbered blocks directly above it. */
export function numberAt(blocks: Block[], index: number): number {
  let count = 1;
  for (let at = index - 1; at >= 0; at--) {
    const block = blocks[at];
    if (isTextBlock(block) && block.type === 'number') count++;
    else break;
  }
  return count;
}

/** Plain text of the selection in block `id`, for the assistant. */
export function selectedText(blocks: Block[], id: string | null, start: number, end: number): string {
  const block = blocks.find((item) => item.id === id);
  return isTextBlock(block) && end > start ? block.text.slice(start, end) : '';
}

/** Where the cursor ends up after `old` became `value`: right after the changed text. */
export function caretAfterChange(old: string, value: string): number {
  let prefix = 0;
  const limit = Math.min(old.length, value.length);
  while (prefix < limit && old[prefix] === value[prefix]) prefix++;
  let suffix = 0;
  while (suffix < limit - prefix && old[old.length - 1 - suffix] === value[value.length - 1 - suffix]) suffix++;
  return value.length - suffix;
}
