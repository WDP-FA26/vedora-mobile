import { editorToolSchemas, type EditorToolName, type EditorToolOutput } from '../types/blog-ai.schema';

export const MAX_CONTENT = 50_000;
export const MAX_TITLE = 150;

export type EditorState = {
  title: string;
  content: string;
  /** Cursor, or the selected range, in the body. */
  cursor: { start: number; end: number };
  /** The range that was selected when the request was sent, with its text. */
  selection: { start: number; end: number; text: string } | null;
};

export type ApplyResult =
  | { ok: true; title: string; content: string; cursor: { start: number; end: number } }
  | { ok: false; output: EditorToolOutput };

const fail = (error: NonNullable<EditorToolOutput['error']>, reason?: string): ApplyResult => ({ ok: false, output: { applied: false, error, ...(reason ? { reason } : {}) } });
const tooLong: ApplyResult = { ok: false, output: { applied: false, reason: 'Bài viết sẽ vượt quá 50.000 ký tự.' } };

function occurrences(text: string, needle: string) {
  if (!needle) return [];
  const found: number[] = [];
  let index = text.indexOf(needle);
  while (index !== -1) {
    found.push(index);
    index = text.indexOf(needle, index + needle.length);
  }
  return found;
}

/** Puts a block at `index` with a blank line on each side so it never glues onto neighbouring text. */
function insertBlock(content: string, index: number, block: string) {
  const before = content.slice(0, index);
  const after = content.slice(index);
  const lead = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
  const trail = after && !after.startsWith('\n\n') ? (after.startsWith('\n') ? '\n' : '\n\n') : after ? '' : '\n';
  const insertedEnd = before.length + lead.length + block.length;
  return { content: `${before}${lead}${block}${trail}${after}`, cursor: { start: insertedEnd, end: insertedEnd } };
}

function place(state: EditorState, block: string, position: 'cursor' | 'end' | 'after', afterText?: string): ApplyResult {
  let index: number;
  if (position === 'end') index = state.content.length;
  else if (position === 'cursor') index = state.cursor.start;
  else {
    const found = occurrences(state.content, afterText ?? '');
    if (found.length === 0) return fail('NOT_FOUND');
    if (found.length > 1) return fail('AMBIGUOUS');
    index = found[0] + (afterText ?? '').length;
  }
  const next = insertBlock(state.content, index, block);
  if (next.content.length > MAX_CONTENT) return tooLong;
  return { ok: true, title: state.title, ...next };
}

function replaceRange(state: EditorState, start: number, end: number, replacement: string): ApplyResult {
  const content = `${state.content.slice(0, start)}${replacement}${state.content.slice(end)}`;
  if (content.length > MAX_CONTENT) return tooLong;
  const cursor = start + replacement.length;
  return { ok: true, title: state.title, content, cursor: { start: cursor, end: cursor } };
}

/** The Markdown an image tool inserts. Brackets in the caption would break the syntax, so they are dropped. */
export function imageMarkdown(url: string, alt: string) {
  return `![${alt.replace(/[[\]\n]/g, ' ').trim()}](${url})`;
}

/** Applies one accepted editor-tool call to the editor state; never touches state itself. */
export function applyEditorTool(name: EditorToolName, rawInput: unknown, state: EditorState): ApplyResult {
  const parsed = editorToolSchemas[name].safeParse(rawInput);
  if (!parsed.success) return { ok: false, output: { applied: false, reason: 'Đề xuất của trợ lý không hợp lệ.' } };

  switch (name) {
    case 'replaceSelection': {
      const { markdown } = parsed.data as { markdown: string };
      const selection = state.selection;
      if (!selection || !selection.text) return fail('NO_SELECTION');
      if (state.content.slice(selection.start, selection.end) !== selection.text) return fail('STALE');
      return replaceRange(state, selection.start, selection.end, markdown);
    }
    case 'replaceText': {
      const { find, replace } = parsed.data as { find: string; replace: string };
      const found = occurrences(state.content, find);
      if (found.length === 0) return fail('NOT_FOUND');
      if (found.length > 1) return fail('AMBIGUOUS');
      return replaceRange(state, found[0], found[0] + find.length, replace);
    }
    case 'insertMarkdown': {
      const { markdown, position, after } = parsed.data as { markdown: string; position: 'cursor' | 'end' | 'after'; after?: string };
      return place(state, markdown.trim(), position, after);
    }
    case 'setTitle': {
      const { title } = parsed.data as { title: string };
      const next = title.trim();
      if (!next || next.length > MAX_TITLE) return { ok: false, output: { applied: false, reason: 'Tiêu đề phải từ 1 đến 150 ký tự.' } };
      return { ok: true, title: next, content: state.content, cursor: state.cursor };
    }
    case 'insertImage': {
      const { url, alt, position, after, replaces } = parsed.data as { url: string; alt: string; position: 'cursor' | 'end' | 'after'; after?: string; replaces?: string };
      const markdown = imageMarkdown(url, alt);
      if (replaces) {
        const pattern = new RegExp(`!\\[[^\\]]*\\]\\(${replaces.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
        const found = [...state.content.matchAll(pattern)];
        if (found.length === 0) return fail('NOT_FOUND');
        if (found.length > 1) return fail('AMBIGUOUS');
        const start = found[0].index ?? 0;
        return replaceRange(state, start, start + found[0][0].length, markdown);
      }
      return place(state, markdown, position, after);
    }
  }
}

/** Short, readable description of what a proposal does, for the confirmation card. */
export function describeEditorTool(name: EditorToolName): string {
  switch (name) {
    case 'replaceSelection': return 'Thay đoạn bạn đã chọn';
    case 'replaceText': return 'Sửa một đoạn trong bài';
    case 'insertMarkdown': return 'Thêm nội dung vào bài';
    case 'setTitle': return 'Đổi tiêu đề';
    case 'insertImage': return 'Chèn ảnh vào bài';
  }
}
