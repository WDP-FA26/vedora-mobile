import { useCallback, useMemo, useRef, useState } from 'react';

import {
  activeMarks,
  backspaceAtStart,
  BOLD,
  caretAfterChange,
  blocksToMarkdownMapped,
  changeText,
  insertImageBlock,
  isTextBlock,
  ITALIC,
  markdownToBlocks,
  moveBlock,
  removeBlock,
  selectedText,
  setBlockType,
  setImageAlt,
  setRawText,
  splitBlock,
  toggleMark,
  type Block,
  type TextType,
} from '../utils/blog-blocks';

export type Focus = { id: string; start: number; end: number };
type Forced = { id: string; start: number; end: number };

/**
 * Editor state for the block-based blog editor: the blocks, which block and range have focus, a bold/italic
 * choice made with nothing selected (applies to the next typed text), and the Markdown the blocks stand for.
 */
export function useBlogBlocks(initialMarkdown: string, onEdit: () => void) {
  const [blocks, setBlocks] = useState<Block[]>(() => markdownToBlocks(initialMarkdown));
  const [focus, setFocus] = useState<Focus | null>(null);
  const [pending, setPending] = useState<{ flags: number; at: number } | null>(null);
  const [forced, setForced] = useState<Forced | undefined>();
  const [focusRequest, setFocusRequest] = useState<{ id: string; token: number } | null>(null);
  // Bumped when a block's native text may hold something the blocks do not (the Enter that was just turned into a new block).
  const [resets, setResets] = useState<Record<string, number>>({});
  // The text inputs by block, so focus can move to a block that stays before the one being removed (keeps the keyboard up).
  const inputs = useRef(new Map<string, { focus: () => void }>());
  const register = useCallback((id: string, input: { focus: () => void } | null) => {
    if (input) inputs.current.set(id, input);
    else inputs.current.delete(id);
  }, []);
  const mapped = useMemo(() => blocksToMarkdownMapped(blocks), [blocks]);

  const requestFocus = useCallback((id: string, caret: number) => {
    setForced({ id, start: caret, end: caret });
    // The caret is already where it should be, so the input may report no selection change: remember it here.
    setFocus({ id, start: caret, end: caret });
    setFocusRequest((current) => ({ id, token: (current?.token ?? 0) + 1 }));
  }, []);

  const update = useCallback((next: Block[]) => {
    setBlocks(next);
    onEdit();
  }, [onEdit]);

  const type = useCallback((id: string, value: string) => {
    const block = blocks.find((item) => item.id === id);
    if (!isTextBlock(block)) return;
    const flags = pending?.flags ?? null;
    const grewLines = value.split('\n').length > block.text.split('\n').length;
    if (grewLines) {
      // Enter: the new line break becomes a new block; everything else in the change is applied first.
      let at = 0;
      while (at < block.text.length && block.text[at] === value[at]) at++;
      const cleaned = value.slice(0, at) + value.slice(at + 1);
      const edited = changeText(blocks, id, cleaned, flags);
      const next = splitBlock(edited, id, at);
      setResets((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
      update(next.blocks);
      requestFocus(next.focusId, next.caret);
    } else {
      update(changeText(blocks, id, value, flags));
      // The platform also reports the cursor, but not always right after typing, so it is worked out here too.
      const caret = caretAfterChange(block.text, value);
      setFocus({ id, start: caret, end: caret });
    }
    setPending(null);
  }, [blocks, pending, requestFocus, update]);

  const select = useCallback((id: string, start: number, end: number) => {
    setFocus({ id, start, end });
    setForced(undefined);
    setPending((current) => (current && current.at === start && start === end ? current : null));
  }, []);

  /** Enter: splits the block at the caret (the key does not type a line break, so the input needs no repair). */
  const enter = useCallback((id: string) => {
    const block = blocks.find((item) => item.id === id);
    if (!isTextBlock(block)) return;
    const at = focus?.id === id ? focus : { start: block.text.length, end: block.text.length };
    const flags = pending?.flags ?? null;
    const edited = at.end > at.start ? changeText(blocks, id, block.text.slice(0, at.start) + block.text.slice(at.end), flags) : blocks;
    const next = splitBlock(edited, id, at.start);
    update(next.blocks);
    requestFocus(next.focusId, next.caret);
    setPending(null);
  }, [blocks, focus, pending, requestFocus, update]);

  const backspaceAtBlockStart = useCallback((id: string) => {
    const next = backspaceAtStart(blocks, id);
    if (next.blocks !== blocks) {
      // Focus the block that stays first: removing the focused input would close the keyboard.
      inputs.current.get(next.focusId)?.focus();
      update(next.blocks);
      requestFocus(next.focusId, next.caret);
    }
  }, [blocks, requestFocus, update]);

  const focusedBlock = focus ? blocks.find((item) => item.id === focus.id) : undefined;
  const marks = activeMarks(focusedBlock, focus?.start ?? 0, focus?.end ?? 0, pending?.flags ?? null);

  /** Bold or italic: applies to the selection, or to what is typed next when nothing is selected. */
  const toggleFormat = useCallback((flag: typeof BOLD | typeof ITALIC) => {
    if (!focus || !isTextBlock(focusedBlock)) return;
    if (focus.end > focus.start) {
      update(toggleMark(blocks, focus.id, focus.start, focus.end, flag));
      // Restyling the text can reset the cursor, so the selection is put back.
      setForced({ id: focus.id, start: focus.start, end: focus.end });
    } else {
      setPending({ flags: marks ^ flag, at: focus.start });
    }
  }, [blocks, focus, focusedBlock, marks, update]);

  const setType = useCallback((blockType: TextType) => {
    const target = focus ? focus.id : blocks.findLast((item) => isTextBlock(item))?.id;
    if (!target) return;
    update(setBlockType(blocks, target, blockType));
    requestFocus(target, focus?.start ?? 0);
  }, [blocks, focus, requestFocus, update]);

  const addImage = useCallback((url: string) => {
    const result = insertImageBlock(blocks, focus?.id ?? null, url);
    update(result.blocks);
  }, [blocks, focus, update]);

  const replaceAll = useCallback((markdown: string) => {
    setBlocks(markdownToBlocks(markdown));
    setFocus(null);
    setPending(null);
    onEdit();
  }, [onEdit]);

  /** Where the cursor or selection sits in the Markdown (the end of the post when nothing is focused). */
  const markdownRange = useCallback((): { start: number; end: number } => {
    const index = focus ? blocks.findIndex((item) => item.id === focus.id) : -1;
    const base = index >= 0 ? mapped.starts[index] : -1;
    const map = index >= 0 ? mapped.maps[index] : [];
    if (!focus || base < 0 || map.length === 0) return { start: mapped.markdown.length, end: mapped.markdown.length };
    return { start: base + (map[focus.start] ?? 0), end: base + (map[focus.end] ?? 0) };
  }, [blocks, focus, mapped]);

  return {
    blocks,
    markdown: mapped.markdown,
    focus,
    forced,
    focusRequest,
    resets,
    marks,
    blockType: isTextBlock(focusedBlock) ? focusedBlock.type : null,
    type,
    select,
    register,
    enter,
    backspaceAtBlockStart,
    toggleFormat,
    setType,
    addImage,
    replaceAll,
    markdownRange,
    selectionText: () => selectedText(blocks, focus?.id ?? null, focus?.start ?? 0, focus?.end ?? 0),
    setAlt: (id: string, alt: string) => update(setImageAlt(blocks, id, alt)),
    setRaw: (id: string, text: string) => update(setRawText(blocks, id, text)),
    remove: (id: string) => update(removeBlock(blocks, id)),
    move: (id: string, delta: -1 | 1) => update(moveBlock(blocks, id, delta)),
    clearFocus: () => setFocus(null),
  };
}
