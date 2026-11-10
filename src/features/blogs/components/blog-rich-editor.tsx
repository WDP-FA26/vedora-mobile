import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, type TextInputInstance, View, type TextStyle } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ZoomImage } from '@/shared/components/image-viewer';

import type { useBlogBlocks } from '../hooks/use-blog-blocks';
import { BOLD, ITALIC, isTextBlock, numberAt, type Block, type ImageBlock, type RawBlock, type TextBlock, type TextType } from '../utils/blog-blocks';

type Editor = ReturnType<typeof useBlogBlocks>;
type Theme = ReturnType<typeof useTheme>;
type IconName = SymbolViewProps['name'];

/** Styled children inside a TextInput are how bold/italic show while typing; the web build has no such support. */
const STYLED = Platform.OS !== 'web';
const PLACEHOLDER = 'Bắt đầu bằng câu chuyện, nguyên liệu hoặc cách làm của bạn…';

const isVideo = (url: string) => /\/video\/upload\//.test(url) || /\.(mp4|webm|mov)(\?|#|$)/i.test(url);

/** Consecutive characters with the same format, so each run becomes one styled piece of text. */
function runsOf(block: TextBlock) {
  const runs: { text: string; flag: number }[] = [];
  for (let at = 0; at < block.text.length; at++) {
    const flag = block.marks[at] ?? 0;
    const last = runs.at(-1);
    if (last && last.flag === flag) last.text += block.text[at];
    else runs.push({ text: block.text[at], flag });
  }
  return runs;
}

/** Italic and bold are separate font files, so the format picks the file that has both. */
function runFont(type: TextType, flag: number): TextStyle | null {
  const heading = type.startsWith('h');
  const bold = (flag & BOLD) !== 0 || heading;
  const italic = (flag & ITALIC) !== 0 || type === 'quote';
  if (!(flag & (BOLD | ITALIC))) return null;
  if (heading) return { fontFamily: italic ? Fonts.headingBoldItalic : Fonts.headingBold };
  if (bold) return { fontFamily: italic ? Fonts.sansBoldItalic : Fonts.sansBold };
  return { fontFamily: Fonts.sansItalic };
}

function inputStyle(type: TextType, theme: Theme): TextStyle {
  switch (type) {
    case 'h1': return { fontFamily: Fonts.headingBold, fontSize: 26, lineHeight: 34 };
    case 'h2': return { fontFamily: Fonts.headingBold, fontSize: 21, lineHeight: 29 };
    case 'h3': return { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 26 };
    case 'quote': return { fontFamily: Fonts.sansItalic, fontSize: 16, lineHeight: 26, color: theme.mutedForeground };
    default: return { fontFamily: Fonts.sans, fontSize: 16, lineHeight: 26 };
  }
}

/** The blocks of the post: text you type into, pictures you see, and code the editor leaves alone. */
export function BlogRichEditor({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  const { blocks } = editor;
  return (
    <View style={styles.blocks}>
      {blocks.map((block, index) => {
        if (block.type === 'image') return <ImageView key={block.id} block={block} index={index} count={blocks.length} editor={editor} disabled={disabled} />;
        if (block.type === 'raw') return <RawView key={block.id} block={block} editor={editor} disabled={disabled} />;
        return <TextView key={`${block.id}:${editor.resets[block.id] ?? 0}`} block={block} index={index} placeholder={blocks.length === 1 && block.text === '' ? PLACEHOLDER : undefined} editor={editor} disabled={disabled} />;
      })}
    </View>
  );
}

function TextView({ block, index, placeholder, editor, disabled }: { block: TextBlock; index: number; placeholder?: string; editor: Editor; disabled: boolean }) {
  const theme = useTheme();
  const input = useRef<TextInputInstance>(null);
  const { focus, forced, focusRequest } = editor;
  const mine = focus?.id === block.id;
  const caretAtStart = mine && focus.start === 0 && focus.end === 0;
  const base = inputStyle(block.type, theme);
  const plain = !STYLED || block.text === '';
  const token = focusRequest?.id === block.id ? focusRequest.token : 0;

  useEffect(() => {
    if (token > 0) input.current?.focus();
  }, [token]);

  const { register } = editor;
  useEffect(() => {
    register(block.id, input.current);
    return () => register(block.id, null);
  }, [block.id, register]);

  const prefix = block.type === 'bullet' ? '•' : block.type === 'number' ? `${numberAt(editor.blocks, index)}.` : null;

  return (
    <View style={[styles.textRow, block.type.startsWith('h') && index > 0 && styles.heading, block.type === 'quote' && [styles.quote, { borderLeftColor: theme.primary }]]}>
      {prefix ? <Text style={[styles.prefix, { color: theme.mutedForeground }]}>{prefix}</Text> : null}
      <TextInput
        ref={input}
        accessibilityLabel={block.type === 'paragraph' ? 'Nội dung blog' : 'Nội dung blog, khối đặc biệt'}
        editable={!disabled}
        multiline
        submitBehavior="submit"
        onSubmitEditing={() => editor.enter(block.id)}
        scrollEnabled={false}
        placeholder={placeholder ?? (block.type === 'paragraph' ? undefined : block.type.startsWith('h') ? 'Đề mục' : 'Nhập nội dung')}
        placeholderTextColor={theme.mutedForeground}
        selection={forced?.id === block.id ? { start: forced.start, end: forced.end } : undefined}
        onChangeText={(value) => editor.type(block.id, value)}
        onSelectionChange={(event) => editor.select(block.id, event.nativeEvent.selection.start, event.nativeEvent.selection.end)}
        onFocus={() => { if (focus?.id !== block.id) editor.select(block.id, 0, 0); }}
        onKeyPress={(event) => { if (event.nativeEvent.key === 'Backspace' && caretAtStart) editor.backspaceAtBlockStart(block.id); }}
        style={[styles.input, base, { color: block.type === 'quote' ? theme.mutedForeground : theme.foreground }]}
        {...(plain ? { value: block.text } : {})}>
        {plain ? null : runsOf(block).map((run, position) => (
          <Text
            key={`${position}-${run.flag}`}
            style={runFont(block.type, run.flag)}>
            {run.text}
          </Text>
        ))}
      </TextInput>
    </View>
  );
}

function RawView({ block, editor, disabled }: { block: RawBlock; editor: Editor; disabled: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.raw, { backgroundColor: theme.muted }]}>
      <TextInput
        accessibilityLabel="Đoạn mã hoặc nội dung giữ nguyên"
        editable={!disabled}
        multiline
        scrollEnabled={false}
        value={block.text}
        onChangeText={(value) => editor.setRaw(block.id, value)}
        style={[styles.rawInput, { color: theme.foreground }]}
      />
    </View>
  );
}

function ImageView({ block, index, count, editor, disabled }: { block: ImageBlock; index: number; count: number; editor: Editor; disabled: boolean }) {
  const theme = useTheme();
  const [ratio, setRatio] = useState(16 / 10);
  const video = isVideo(block.url);

  return (
    <View style={styles.imageBlock}>
      <View>
        {video ? (
          <View style={[styles.video, { backgroundColor: theme.muted }]}>
            <SymbolView name={{ ios: 'play.rectangle.fill', android: 'smart_display', web: 'smart_display' }} size={28} tintColor={theme.primary} />
            <Text style={[styles.videoText, { color: theme.mutedForeground }]}>Video trong bài (xem ở bản xem trước)</Text>
          </View>
        ) : (
          <ZoomImage
            source={{ uri: block.url }}
            accessibilityLabel={block.alt || 'Ảnh trong bài viết'}
            contentFit="cover"
            onLoad={(event) => {
              const { width, height } = event.source;
              if (width > 0 && height > 0) setRatio(width / height);
            }}
            style={[styles.image, { aspectRatio: ratio, backgroundColor: theme.secondary }]}
          />
        )}
        <View style={styles.imageTools}>
          <MiniButton label="Chuyển ảnh lên" icon={{ ios: 'chevron.up', android: 'keyboard_arrow_up', web: 'keyboard_arrow_up' }} disabled={disabled || index === 0} onPress={() => editor.move(block.id, -1)} />
          <MiniButton label="Chuyển ảnh xuống" icon={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }} disabled={disabled || index >= count - 2} onPress={() => editor.move(block.id, 1)} />
          <MiniButton label="Xóa ảnh" icon={{ ios: 'trash', android: 'delete', web: 'delete' }} danger disabled={disabled} onPress={() => editor.remove(block.id)} />
        </View>
      </View>
      <TextInput
        accessibilityLabel="Chú thích ảnh"
        editable={!disabled}
        value={block.alt}
        onChangeText={(value) => editor.setAlt(block.id, value)}
        placeholder="Thêm chú thích (không bắt buộc)"
        placeholderTextColor={theme.mutedForeground}
        style={[styles.caption, { color: theme.mutedForeground }]}
      />
    </View>
  );
}

function MiniButton({ label, icon, onPress, disabled, danger }: { label: string; icon: IconName; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} hitSlop={4} style={({ pressed }) => [styles.mini, { opacity: disabled ? 0.35 : pressed ? 0.7 : 1 }]}>
      <SymbolView name={icon} size={16} tintColor={danger ? '#ff9a92' : '#fffefa'} />
    </Pressable>
  );
}

const TOOLS: { key: string; label: string; icon: IconName }[] = [
  { key: 'h2', label: 'Đề mục', icon: { ios: 'textformat.size', android: 'title', web: 'title' } },
  { key: 'bold', label: 'Chữ đậm', icon: { ios: 'bold', android: 'format_bold', web: 'format_bold' } },
  { key: 'italic', label: 'Chữ nghiêng', icon: { ios: 'italic', android: 'format_italic', web: 'format_italic' } },
  { key: 'bullet', label: 'Danh sách', icon: { ios: 'list.bullet', android: 'format_list_bulleted', web: 'format_list_bulleted' } },
  { key: 'number', label: 'Danh sách đánh số', icon: { ios: 'list.number', android: 'format_list_numbered', web: 'format_list_numbered' } },
  { key: 'quote', label: 'Trích dẫn', icon: { ios: 'text.quote', android: 'format_quote', web: 'format_quote' } },
];

/** Formatting bar kept above the keyboard: acts on the selected text, or on the line being typed. */
export function BlogFormatBar({ editor, disabled, onImage }: { editor: Editor; disabled: boolean; onImage: () => void }) {
  const theme = useTheme();
  const enabled = !disabled && editor.focus !== null;
  const activeKey = (key: string) =>
    key === 'bold' ? (editor.marks & BOLD) !== 0
      : key === 'italic' ? (editor.marks & ITALIC) !== 0
        : key === 'h2' ? editor.blockType === 'h2' || editor.blockType === 'h1' || editor.blockType === 'h3'
          : editor.blockType === key;

  function press(key: string) {
    if (key === 'bold') editor.toggleFormat(BOLD);
    else if (key === 'italic') editor.toggleFormat(ITALIC);
    else editor.setType(key as TextType);
  }

  return (
    <View style={[styles.bar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
      <View style={styles.barInner}>
        {TOOLS.map((tool) => {
          const active = activeKey(tool.key);
          return (
            <Pressable
              key={tool.key}
              accessibilityRole="button"
              accessibilityLabel={tool.label}
              accessibilityState={{ selected: active, disabled: !enabled }}
              disabled={!enabled}
              onPress={() => press(tool.key)}
              style={({ pressed }) => [styles.tool, { backgroundColor: active ? theme.secondary : pressed ? theme.muted : 'transparent', opacity: enabled ? 1 : 0.4 }]}>
              <SymbolView name={tool.icon} size={19} tintColor={active ? theme.primary : theme.foreground} />
            </Pressable>
          );
        })}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Pressable accessibilityRole="button" accessibilityLabel="Chèn ảnh vào bài" disabled={disabled} onPress={onImage} style={({ pressed }) => [styles.tool, { backgroundColor: pressed ? theme.muted : 'transparent', opacity: disabled ? 0.4 : 1 }]}>
          <SymbolView name={{ ios: 'photo.badge.plus', android: 'add_photo_alternate', web: 'add_photo_alternate' }} size={20} tintColor={theme.primary} />
        </Pressable>
      </View>
    </View>
  );
}

export type { Block };
export { isTextBlock };

const styles = StyleSheet.create({
  blocks: { gap: 0 },
  textRow: { flexDirection: 'row', alignItems: 'flex-start' },
  quote: { borderLeftWidth: 3, paddingLeft: Spacing.three, marginVertical: Spacing.one },
  prefix: { width: 26, fontFamily: Fonts.sans, fontSize: 16, lineHeight: 26, paddingVertical: Spacing.half },
  input: { flex: 1, minWidth: 0, paddingVertical: Spacing.half, paddingHorizontal: 0 },
  heading: { marginTop: Spacing.two },
  raw: { borderRadius: Radius.xl, padding: Spacing.three },
  rawInput: { fontFamily: Fonts.mono, fontSize: 13, lineHeight: 20 },
  imageBlock: { gap: Spacing.one + Spacing.half, marginVertical: Spacing.two },
  image: { width: '100%', borderRadius: Radius.xl },
  video: { height: 120, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  videoText: { fontFamily: Fonts.sans, fontSize: 13 },
  imageTools: { position: 'absolute', top: Spacing.two, right: Spacing.two, flexDirection: 'row', gap: Spacing.one + Spacing.half },
  mini: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  caption: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19, textAlign: 'center', paddingVertical: Spacing.one },
  bar: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one + Spacing.half },
  barInner: { width: '100%', maxWidth: 720, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tool: { width: 42, height: 40, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  divider: { width: StyleSheet.hairlineWidth, height: 22 },
});
