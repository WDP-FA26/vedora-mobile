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

export function parseMarkdown(content: string): Block[] {
  const blocks: Block[] = [];
  const lines = content.split(/\r?\n/);
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: InlineNode[][] } | null = null;
  let fence: string[] | null = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ kind: 'paragraph', inline: parseInline(paragraph.join(' ')) });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push({ kind: 'list', ...list });
    list = null;
  };

  for (const line of lines) {
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
    .replace(/\s+/g, ' ')
    .trim();
}
