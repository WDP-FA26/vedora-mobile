/** A small Markdown reader for blog articles: the blocks and inline marks the editor writes. Raw HTML is never interpreted. */

export type InlineNode =
  | { kind: 'text'; text: string }
  | { kind: 'bold' | 'italic' | 'code'; text: string }
  | { kind: 'link'; text: string; url: string };

export type Block =
  | { kind: 'heading'; level: 1 | 2 | 3; inline: InlineNode[] }
  | { kind: 'paragraph'; inline: InlineNode[] }
  | { kind: 'quote'; inline: InlineNode[] }
  | { kind: 'list'; ordered: boolean; items: InlineNode[][] }
  | { kind: 'code'; text: string }
  | { kind: 'image'; alt: string; url: string }
  | { kind: 'video'; url: string }
  | { kind: 'table'; headers: InlineNode[][]; rows: InlineNode[][][]; alignments: ('left' | 'center' | 'right')[] }
  | { kind: 'rule' };

const IMAGE_LINE = /^\s*!\[([^\]]*)\]\((\S+?)\)\s*$/;
const FENCE = /^\s*(```|~~~)/;
const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`|!?\[[^\]]*\]\([^)\s]+\))/g;

/** Videos are written as image Markdown too (same rule as the web editor). */
const isVideo = (url: string) => /\/video\/upload\//.test(url) || /\.(mp4|webm|mov)(\?|#|$)/i.test(url);

export function safeHttpUrl(url: string): string | null {
  const value = url.trim();
  return /^https?:\/\//i.test(value) ? value : null;
}

function safeLinkUrl(url: string): string | null {
  const value = url.trim();
  return /^(https?:\/\/|mailto:)/i.test(value) ? value : null;
}

export function parseInline(source: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let last = 0;
  for (const match of source.matchAll(INLINE)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > last) nodes.push({ kind: 'text', text: source.slice(last, index) });
    last = index + token.length;

    if (token.startsWith('![')) continue; // inline images are dropped; image lines are blocks
    if (token.startsWith('[')) {
      const parts = /^\[([^\]]*)\]\(([^)\s]+)\)$/.exec(token);
      const url = parts ? safeLinkUrl(parts[2]) : null;
      nodes.push(url && parts ? { kind: 'link', text: parts[1], url } : { kind: 'text', text: parts?.[1] ?? token });
    } else if (token.startsWith('**') || token.startsWith('__')) {
      nodes.push({ kind: 'bold', text: token.slice(2, -2) });
    } else if (token.startsWith('`')) {
      nodes.push({ kind: 'code', text: token.slice(1, -1) });
    } else {
      nodes.push({ kind: 'italic', text: token.slice(1, -1) });
    }
  }
  if (last < source.length) nodes.push({ kind: 'text', text: source.slice(last) });
  return nodes;
}

/** Split table cells without treating an escaped pipe as a column boundary. */
function tableCells(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  const source = line.trim();
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\\' && i + 1 < source.length) {
      const next = source[++i];
      cell += next === '|' ? next : `\\${next}`;
    } else if (source[i] === '|') {
      cells.push(cell.trim()); cell = '';
    } else cell += source[i];
  }
  cells.push(cell.trim());
  if (source.startsWith('|')) cells.shift();
  if (source.endsWith('|') && cells.at(-1) === '') cells.pop();
  return cells;
}

export function parseMarkdown(content: string, options: { tables?: boolean; preserveLineBreaks?: boolean } = {}): Block[] {
  const blocks: Block[] = [];
  const lines = content.split(/\r?\n/);
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: InlineNode[][] } | null = null;
  let fence: string[] | null = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ kind: 'paragraph', inline: parseInline(paragraph.join(options.preserveLineBreaks ? '\n' : ' ')) });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push({ kind: 'list', ...list });
    list = null;
  };

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (FENCE.test(line)) {
      if (fence) {
        blocks.push({ kind: 'code', text: fence.join('\n') });
        fence = null;
      } else {
        flushParagraph();
        flushList();
        fence = [];
      }
      continue;
    }
    if (fence) {
      fence.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (trimmed === '') {
      flushParagraph();
      flushList();
      continue;
    }

    if (options.tables && line.includes('|')) {
      // AI answers can separate table rows with blank lines; leave surrounding paragraphs alone.
      let separatorIndex = index + 1;
      while (separatorIndex < lines.length && !lines[separatorIndex].trim()) separatorIndex++;
      const headers = tableCells(line);
      const separators = tableCells(lines[separatorIndex] ?? '');
      if (headers.length > 0 && headers.length === separators.length && separators.every((cell) => /^:?-{3,}:?$/.test(cell))) {
        flushParagraph(); flushList();
        const rows: InlineNode[][][] = [];
        index = separatorIndex;
        for (;;) {
          let rowIndex = index + 1;
          while (rowIndex < lines.length && !lines[rowIndex].trim()) rowIndex++;
          const row = lines[rowIndex];
          if (!row?.includes('|') || FENCE.test(row) || /^(?:#{1,6}\s|>\s|[-*+]\s|\d+[.)]\s)/.test(row.trim())) break;
          // A second table starts a new block instead of becoming rows in this one.
          let next = rowIndex + 1;
          while (next < lines.length && !lines[next].trim()) next++;
          const nextCells = tableCells(lines[next] ?? '');
          const cells = tableCells(row);
          if (nextCells.length === cells.length && nextCells.every((cell) => /^:?-{3,}:?$/.test(cell))) break;
          index = rowIndex;
          rows.push(headers.map((_, column) => parseInline(cells[column] ?? '')));
        }
        blocks.push({ kind: 'table', headers: headers.map(parseInline), rows,
          alignments: separators.map((cell) => cell.endsWith(':') ? (cell.startsWith(':') ? 'center' : 'right') : 'left') });
        continue;
      }
    }

    const image = IMAGE_LINE.exec(line);
    const imageUrl = image ? safeHttpUrl(image[2]) : null;
    if (image && imageUrl) {
      flushParagraph();
      flushList();
      blocks.push(isVideo(imageUrl) ? { kind: 'video', url: imageUrl } : { kind: 'image', alt: image[1], url: imageUrl });
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'heading', level: Math.min(heading[1].length, 3) as 1 | 2 | 3, inline: parseInline(heading[2]) });
      continue;
    }

    if (/^([-*_])(\s*\1){2,}$/.test(trimmed)) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'rule' });
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(trimmed);
    if (quote) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'quote', inline: parseInline(quote[1]) });
      continue;
    }

    const item = /^(?:([-*+])|(\d+)[.)])\s+(.*)$/.exec(trimmed);
    if (item) {
      flushParagraph();
      const ordered = item[2] !== undefined;
      if (list && list.ordered !== ordered) flushList();
      list ??= { ordered, items: [] };
      list.items.push(parseInline(item[3]));
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  if (fence) blocks.push({ kind: 'code', text: fence.join('\n') });
  flushParagraph();
  flushList();
  return blocks;
}

/**
 * Flattens Markdown to plain text for previews (feed card, blog list), where the API's `excerpt` is the
 * source text cut at a fixed length: headings, emphasis, lists, quotes, links, images and code lose their
 * marks, and a mark cut off at the end of the preview is dropped too.
 */
export function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?(```|$)/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/(^|\s)#{1,6}(?=\s|$)/g, ' ')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*([-*+]|\d+[.)])\s+/gm, '')
    .replace(/^\s*([-*_]\s*){3,}$/gm, ' ')
    .replace(/(\*\*|__|~~)/g, '')
    .replace(/(^|[\s(])[*_]+(?=\S)/g, '$1')
    .replace(/(\S)[*_]+(?=[\s).,;:!?]|$)/g, '$1')
    .replace(/`+/g, '')
    // A `*` bullet left mid-line when the source's line breaks were already collapsed (chat previews);
    // `+` and `-` stay because "đậu + gạo" and "A - B" are ordinary text.
    .replace(/(^|\s)\*(?=\s|$)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
