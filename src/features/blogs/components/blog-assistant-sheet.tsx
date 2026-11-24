import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Keyboard, Modal, Platform, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { useTheme } from '@/hooks/use-theme';
import { ZoomImage } from '@/shared/components/image-viewer';
import { ChatBubble, ChatStatus } from '@/shared/components/chat/chat-bubble';
import { ChatMarkdown } from '@/shared/components/chat/chat-markdown';
import { ChatComposer } from '@/shared/components/chat/chat-composer';

import type { EditorProposal, useBlogAssistant } from '../hooks/use-blog-assistant';
import { EDITOR_TOOL_NAMES, MAX_ASSISTANT_MESSAGE_LENGTH, type AssistantMessage, type EditorToolName } from '../types/blog-ai.schema';
import { applyEditorTool, describeEditorTool, type ApplyResult } from '../utils/blog-ai-tools';

type Assistant = ReturnType<typeof useBlogAssistant>;

/**
 * Keyboard state for the sheet. On iOS the sheet reaches the bottom of the screen and the keyboard covers it, so
 * `height` is the space to leave (KeyboardAvoidingView measures against the window, not the page sheet, and lifts the
 * input by the wrong amount). Android resizes the dialog itself, so only `open` is tracked there.
 */
function useKeyboard() {
  const [state, setState] = useState({ open: false, height: 0 });
  useEffect(() => {
    if (Platform.OS === 'ios') {
      // Measured from the keyboard's top edge: on hide the frame keeps its height but moves off screen.
      const change = Keyboard.addListener('keyboardWillChangeFrame', (event) => {
        const height = Math.max(0, Dimensions.get('screen').height - event.endCoordinates.screenY);
        setState({ open: height > 0, height });
      });
      const hide = Keyboard.addListener('keyboardWillHide', () => setState({ open: false, height: 0 }));
      return () => { change.remove(); hide.remove(); };
    }
    const show = Keyboard.addListener('keyboardDidShow', () => setState({ open: true, height: 0 }));
    const hide = Keyboard.addListener('keyboardDidHide', () => setState({ open: false, height: 0 }));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return state;
}
type Part = AssistantMessage['parts'][number];
export type EditorApply = Extract<ApplyResult, { ok: true }>;

const SERVER_TOOL_LABEL: Record<string, string> = {
  searchKnowledge: 'Đang tra tài liệu dinh dưỡng…',
  generateImage: 'Đang tạo ảnh…',
  editImage: 'Đang chỉnh ảnh…',
};

/** "16:9" -> 1.78; falls back to a square. */
function ratioOf(value: string | undefined) {
  const [width, height] = (value ?? '').split(':').map(Number);
  return width > 0 && height > 0 ? width / height : 1;
}

const isEditorTool = (name: string): name is EditorToolName => (EDITOR_TOOL_NAMES as string[]).includes(name);
const preview = (text: string, max: number) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);

/** Slide-up chat with the blog assistant; every change it proposes waits for Chấp nhận / Từ chối. */
export function BlogAssistantSheet({ visible, onClose, assistant, title, content, range, onApply }: {
  visible: boolean;
  onClose: () => void;
  assistant: Assistant;
  title: string;
  content: string;
  range: { start: number; end: number };
  onApply: (applied: EditorApply) => void;
}) {
  const theme = useTheme();
  const scroll = useRef<ScrollViewInstance>(null);
  const [draft, setDraft] = useState('');
  const keyboard = useKeyboard();
  const hasSelection = range.end > range.start;
  const { messages, busy, error, quota, proposals } = assistant;
  const left = quota ? Math.max(0, quota.messages.limit - quota.messages.used) : null;
  const waiting = proposals.length > 0;
  const last = messages.at(-1);
  // The indicator stays up for the whole turn: before the first word, while the answer is written, and in the gaps
  // after a tool finishes while the model keeps going. A running server tool shows its own line, and a waiting
  // proposal asks the user instead.
  const lastPart = last?.role === 'assistant' ? last.parts.at(-1) : undefined;
  const toolRunning = !!lastPart && lastPart.type !== 'text' && lastPart.state === 'input-available' && !isEditorTool(lastPart.type.replace(/^tool-/, ''));
  const status = busy && !waiting && !toolRunning ? (lastPart?.type === 'text' && lastPart.text.trim() ? 'Đang viết…' : 'Trợ lý đang soạn…') : null;

  const prompts = hasSelection
    ? ['Viết lại đoạn đã chọn cho mượt hơn', 'Rút gọn đoạn đã chọn', 'Sửa lỗi chính tả đoạn đã chọn']
    : ['Gợi ý tiêu đề hấp dẫn cho bài', 'Viết phần mở đầu cho bài', 'Soát lỗi chính tả và bố cục cả bài'];

  function submit(text = draft) {
    const body = text.trim();
    if (!body || busy || waiting) return;
    setDraft('');
    void assistant.send(body);
  }

  function accept(proposal: EditorProposal) {
    const result = applyEditorTool(proposal.tool, proposal.input, {
      title,
      content,
      cursor: range,
      selection: assistant.selectionAtSend(),
    });
    if (result.ok) {
      onApply(result);
      assistant.resolve(proposal.callId, { applied: true });
    } else {
      assistant.resolve(proposal.callId, result.output);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'} onRequestClose={onClose}>
      {/* The keyboard covers the home indicator / navigation bar, so the bottom inset is dropped while it is open. */}
      <SafeAreaView edges={[...(Platform.OS === 'ios' ? [] : ['top' as const]), ...(keyboard.open ? [] : ['bottom' as const])]} style={[styles.sheet, { backgroundColor: theme.background }]}>
        <View style={[styles.body, { paddingBottom: keyboard.height }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={[styles.mark, { backgroundColor: theme.secondary }]}>
            <SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={20} tintColor={theme.primary} />
          </View>
          <View style={styles.headerCopy}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>Trợ lý viết blog</Text>
            <Text style={[styles.subtitle, { color: left === 0 ? theme.destructive : theme.mutedForeground }]}>
              {left === null ? 'Gợi ý và chỉnh sửa bài viết của bạn' : left === 0 ? 'Đã hết lượt của gói hiện tại' : `Còn ${left} lượt hỏi`}
            </Text>
          </View>
          {messages.length > 0 ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Bắt đầu cuộc trò chuyện mới" disabled={busy} onPress={assistant.reset} style={[styles.round, { backgroundColor: theme.muted, opacity: busy ? 0.5 : 1 }]}>
              <SymbolView name={{ ios: 'arrow.counterclockwise', android: 'refresh', web: 'refresh' }} size={18} tintColor={theme.foreground} />
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng trợ lý" onPress={onClose} style={[styles.round, { backgroundColor: theme.muted }]}>
            <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={18} tintColor={theme.foreground} />
          </Pressable>
        </View>

        <ScrollView ref={scroll} style={styles.flex} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
          <ChatBubble role="assistant" authorLabel="Trợ lý Vedora" avatar={<Sparkle />} text={hasSelection
            ? 'Bạn đang chọn một đoạn trong bài. Hãy cho mình biết muốn sửa đoạn đó thế nào.'
            : 'Mình có thể gợi ý tiêu đề, viết phần mở đầu, chỉnh câu chữ hoặc tạo ảnh cho bài. Mọi thay đổi chỉ áp dụng khi bạn bấm Chấp nhận.'} />
          {messages.length === 0 ? (
            <View style={styles.prompts}>
              {prompts.map((prompt) => (
                <Pressable key={prompt} accessibilityRole="button" disabled={busy || left === 0} onPress={() => submit(prompt)} style={({ pressed }) => [styles.prompt, { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.75 : 1 }]}>
                  <Text style={[styles.promptText, { color: theme.foreground }]}>{prompt}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {messages.map((message) => message.role === 'user' ? (
            <ChatBubble key={message.id} role="user" text={message.parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])).join('\n')} />
          ) : (
            <View key={message.id} style={styles.assistantMessage}>
              {message.parts.map((part, index) => (
                <PartView key={`${message.id}-${index}`} part={part} onAccept={accept} onReject={(proposal) => assistant.resolve(proposal.callId, { applied: false })} disabled={busy} />
              ))}
            </View>
          ))}

          {status ? <ChatStatus>{status}</ChatStatus> : null}
          {error ? (
            <View style={[styles.errorCard, { backgroundColor: theme.muted }]}>
              <Text accessibilityRole="alert" style={[styles.errorText, { color: theme.destructive }]}>{error}</Text>
              {assistant.quotaExceeded ? (
                <Pressable accessibilityRole="button" onPress={() => { onClose(); router.push('/billing'); }} hitSlop={8}>
                  <Text style={[styles.retry, { color: theme.primary }]}>Xem gói</Text>
                </Pressable>
              ) : assistant.canRetry ? (
                <Pressable accessibilityRole="button" onPress={assistant.retry} hitSlop={8}>
                  <Text style={[styles.retry, { color: theme.primary }]}>Thử lại</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        <ChatComposer
          value={draft}
          onChangeText={setDraft}
          onSubmit={() => submit()}
          placeholder={waiting ? 'Chấp nhận hoặc từ chối đề xuất trước' : hasSelection ? 'Bạn muốn sửa đoạn đã chọn thế nào?' : 'Nhờ trợ lý viết hoặc chỉnh bài…'}
          inputLabel="Tin nhắn cho trợ lý viết blog"
          sendLabel="Gửi cho trợ lý"
          inputDisabled={busy || waiting || left === 0}
          maxLength={MAX_ASSISTANT_MESSAGE_LENGTH}
          hint="Trợ lý chỉ đề xuất; bài viết không đổi khi bạn chưa chấp nhận."
        />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function Sparkle() {
  const theme = useTheme();
  return <SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={17} tintColor={theme.primary} />;
}

function PartView({ part, onAccept, onReject, disabled }: { part: Part; onAccept: (proposal: EditorProposal) => void; onReject: (proposal: EditorProposal) => void; disabled: boolean }) {
  const theme = useTheme();
  if (part.type === 'text') {
    return part.text.trim() ? <ChatBubble role="assistant" text={part.text} avatar={<Sparkle />} authorLabel="Trợ lý Vedora" /> : null;
  }
  const name = part.type.replace(/^tool-/, '');

  if (isEditorTool(name)) {
    const proposal: EditorProposal = { callId: part.toolCallId, tool: name, input: part.input };
    const pending = part.state === 'input-available';
    const output = (part.output ?? null) as { applied?: boolean; error?: string; reason?: string } | null;
    return (
      <View style={[styles.proposal, { backgroundColor: theme.card, borderColor: pending ? theme.primary : theme.border }]}>
        <View style={styles.proposalHead}>
          <SymbolView name={{ ios: 'wand.and.stars', android: 'auto_fix_high', web: 'auto_fix_high' }} size={16} tintColor={theme.primary} />
          <Text style={[styles.proposalTitle, { color: theme.foreground }]}>{describeEditorTool(name)}</Text>
        </View>
        <ProposalBody tool={name} input={part.input} />
        {pending ? (
          <View style={styles.proposalActions}>
            <Pressable accessibilityRole="button" disabled={disabled} onPress={() => onReject(proposal)} style={({ pressed }) => [styles.proposalButton, styles.reject, { borderColor: theme.border, opacity: pressed ? 0.8 : 1 }]}>
              <Text style={[styles.proposalButtonText, { color: theme.foreground }]}>Từ chối</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={disabled} onPress={() => onAccept(proposal)} style={({ pressed }) => [styles.proposalButton, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }]}>
              <Text style={[styles.proposalButtonText, { color: theme.primaryForeground }]}>Chấp nhận</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={[styles.outcome, { color: output?.applied ? theme.primary : theme.mutedForeground }]}>
            {output?.applied ? 'Đã áp dụng' : output?.error || output?.reason ? 'Không áp dụng được' : 'Đã từ chối'}
          </Text>
        )}
      </View>
    );
  }

  // Server-side tools run on the API: only their progress and results are shown.
  const output = (part.output ?? null) as { url?: string; error?: string } | null;
  if (part.state === 'input-available') {
    const label = <ChatStatus>{SERVER_TOOL_LABEL[name] ?? 'Đang xử lý…'}</ChatStatus>;
    if (name !== 'generateImage' && name !== 'editImage') return label;
    const input = (part.input ?? {}) as { aspectRatio?: string };
    return (
      <>
        {label}
        <View style={styles.generatedRow}><ImageSkeleton ratio={ratioOf(input.aspectRatio)} /></View>
      </>
    );
  }
  if (output?.url) {
    const input = (part.input ?? {}) as { aspectRatio?: string };
    return (
      <View style={styles.generatedRow}>
        <ZoomImage source={{ uri: output.url }} style={[styles.generated, { aspectRatio: ratioOf(input.aspectRatio) }]} contentFit="cover" accessibilityLabel="Ảnh do trợ lý tạo" />
      </View>
    );
  }
  if (output?.error === 'IMAGE_QUOTA_EXCEEDED') return <Text style={[styles.outcome, { color: theme.mutedForeground }]}>Đã hết lượt tạo ảnh của gói hiện tại. Xem Gói của bạn để biết khi nào có lượt mới.</Text>;
  if (output?.error) return <Text style={[styles.outcome, { color: theme.mutedForeground }]}>Không tạo được ảnh lần này.</Text>;
  return null;
}

/** Placeholder the size of the image being made, with a light band sweeping across it. */
function ImageSkeleton({ ratio }: { ratio: number }) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  // White highlight reads as "light" on both themes; it is toned down on dark so it does not glare.
  const glow = useColorScheme() === 'dark' ? 0.18 : 0.9;
  const [width, setWidth] = useState(0);
  const [sweep] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion || !width) return;
    const loop = Animated.loop(Animated.timing(sweep, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }));
    loop.start();
    return () => { loop.stop(); sweep.setValue(0); };
  }, [reduceMotion, sweep, width]);

  const band = width * 0.45;
  const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-band * 1.5, width + band * 0.5] });

  return (
    <View
      accessible
      accessibilityLabel="Ảnh đang được tạo"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.generated, styles.skeleton, { aspectRatio: ratio, backgroundColor: theme.muted }]}>
      {width && !reduceMotion ? (
        <Animated.View pointerEvents="none" style={[styles.shimmer, { width: band, transform: [{ translateX }, { skewX: '-18deg' }] }]}>
          {/* Three soft steps stand in for a gradient so the band has no hard edge. */}
          <View style={[styles.shimmerStep, { opacity: glow * 0.35 }]} />
          <View style={[styles.shimmerStep, { opacity: glow * 0.7 }]} />
          <View style={[styles.shimmerStep, { opacity: glow * 0.35 }]} />
        </Animated.View>
      ) : null}
      <SymbolView name={{ ios: 'photo', android: 'image', web: 'image' }} size={30} tintColor={theme.mutedForeground} />
    </View>
  );
}

/** One side of a proposed change. Long text is cut at first, with a toggle to read all of it before accepting. */
function DiffBlock({ label, text, tone, markdown }: { label: string; text: string; tone: 'old' | 'new'; markdown: boolean }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 600;
  const shown = long && !expanded ? preview(text, 600) : text;
  return (
    <View style={[styles.diff, { backgroundColor: tone === 'new' ? theme.secondary : theme.muted }]}>
      <Text style={[styles.diffLabel, { color: theme.mutedForeground }]}>{label}</Text>
      {markdown
        ? <ChatMarkdown text={shown} color={theme.foreground} />
        : <Text style={[styles.diffText, { color: theme.foreground }]}>{shown}</Text>}
      {long ? (
        <Pressable accessibilityRole="button" accessibilityLabel={expanded ? 'Thu gọn nội dung' : 'Xem toàn bộ nội dung'} onPress={() => setExpanded(!expanded)} hitSlop={8} style={styles.more}>
          <Text style={[styles.moreText, { color: theme.primary }]}>{expanded ? 'Thu gọn' : 'Xem thêm'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ProposalBody({ tool, input }: { tool: EditorToolName; input: unknown }) {
  const theme = useTheme();
  const data = (input ?? {}) as Record<string, string | undefined>;
  const block = (label: string, text: string | undefined, tone: 'old' | 'new', markdown = true) => (text ? (
    <DiffBlock key={label} label={label} text={text} tone={tone} markdown={markdown} />
  ) : null);

  switch (tool) {
    case 'replaceSelection': return block('Nội dung mới', data.markdown, 'new');
    case 'replaceText': return <>{block('Đoạn cũ', data.find, 'old')}{block('Đoạn mới', data.replace, 'new')}</>;
    case 'insertMarkdown': return block(data.position === 'end' ? 'Thêm vào cuối bài' : data.position === 'after' ? 'Thêm sau đoạn đã nêu' : 'Thêm tại vị trí con trỏ', data.markdown, 'new');
    case 'setTitle': return block('Tiêu đề mới', data.title, 'new', false);
    case 'insertImage': return data.url ? <ZoomImage source={{ uri: data.url }} style={[styles.generated, styles.proposalImage, { backgroundColor: theme.muted }]} contentFit="contain" accessibilityLabel={data.alt || 'Ảnh đề xuất'} /> : null;
  }
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  body: { flex: 1 },
  flex: { flex: 1 },
  header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: Spacing.two + Spacing.one, paddingHorizontal: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  mark: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 24 },
  subtitle: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  messages: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.three, paddingBottom: Spacing.four, gap: Spacing.three },
  prompts: { gap: Spacing.two },
  prompt: { borderWidth: 1, borderRadius: Radius['2xl'], paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + Spacing.one },
  promptText: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20 },
  assistantMessage: { gap: Spacing.two + Spacing.one },
  proposal: { borderWidth: 1.5, borderRadius: Radius['2xl'], padding: Spacing.three, gap: Spacing.two + Spacing.one },
  proposalHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  proposalTitle: { flex: 1, fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 20 },
  diff: { borderRadius: Radius.xl, padding: Spacing.two + Spacing.one, gap: 2 },
  diffLabel: { fontFamily: Fonts.sansBold, fontSize: 11, lineHeight: 15, letterSpacing: 0.6 },
  more: { alignSelf: 'flex-start', paddingVertical: Spacing.one },
  moreText: { fontFamily: Fonts.sansBold, fontSize: 13, lineHeight: 18 },
  diffText: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  proposalActions: { flexDirection: 'row', gap: Spacing.two },
  proposalButton: { flex: 1, minHeight: 42, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  reject: { borderWidth: 1 },
  proposalButtonText: { fontFamily: Fonts.sansBold, fontSize: 14 },
  outcome: { fontFamily: Fonts.sansSemibold, fontSize: 12, lineHeight: 17 },
  generatedRow: { alignSelf: 'stretch' },
  generated: { width: '100%', maxWidth: 360, borderRadius: Radius.xl },
  proposalImage: { height: 200 },
  skeleton: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  shimmer: { position: 'absolute', top: 0, bottom: 0, left: 0, flexDirection: 'row' },
  shimmerStep: { flex: 1, backgroundColor: '#ffffff' },
  errorCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three, borderRadius: Radius.xl, padding: Spacing.three },
  errorText: { flex: 1, fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 19 },
  retry: { fontFamily: Fonts.sansBold, fontSize: 13, lineHeight: 19 },
});
