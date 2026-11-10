import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Modal, Platform, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ZoomImage } from '@/shared/components/image-viewer';
import { ChatBubble, ChatStatus } from '@/shared/components/chat/chat-bubble';
import { ChatComposer } from '@/shared/components/chat/chat-composer';

import type { EditorProposal, useBlogAssistant } from '../hooks/use-blog-assistant';
import { EDITOR_TOOL_NAMES, MAX_ASSISTANT_MESSAGE_LENGTH, type AssistantMessage, type EditorToolName } from '../types/blog-ai.schema';
import { applyEditorTool, describeEditorTool, type ApplyResult } from '../utils/blog-ai-tools';

type Assistant = ReturnType<typeof useBlogAssistant>;

/**
 * Keyboard height for iOS, where the sheet reaches the bottom of the screen and the keyboard covers it.
 * KeyboardAvoidingView measures against the window rather than the sheet, so it lifts the input by the wrong
 * amount inside a page sheet. Android resizes the dialog itself, so nothing is added there.
 */
function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const show = Keyboard.addListener('keyboardWillChangeFrame', (event) => setHeight(Math.max(0, event.endCoordinates.height)));
    const hide = Keyboard.addListener('keyboardWillHide', () => setHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return height;
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
  const keyboardHeight = useKeyboardHeight();
  const hasSelection = range.end > range.start;
  const { messages, busy, error, quota, proposals } = assistant;
  const left = quota ? Math.max(0, quota.messages.limit - quota.messages.used) : null;
  const waiting = proposals.length > 0;
  const last = messages.at(-1);
  const starting = busy && last?.role === 'assistant' && last.parts.length === 0;

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
      <SafeAreaView edges={Platform.OS === 'ios' ? (keyboardHeight > 0 ? [] : ['bottom']) : ['top', 'bottom']} style={[styles.sheet, { backgroundColor: theme.background }]}>
        <View style={[styles.body, { paddingBottom: keyboardHeight }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={[styles.mark, { backgroundColor: theme.secondary }]}>
            <SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={20} tintColor={theme.primary} />
          </View>
          <View style={styles.headerCopy}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>Trợ lý viết blog</Text>
            <Text style={[styles.subtitle, { color: left === 0 ? theme.destructive : theme.mutedForeground }]}>
              {left === null ? 'Gợi ý và chỉnh sửa bài viết của bạn' : left === 0 ? 'Đã hết lượt hôm nay' : `Còn ${left} lượt hôm nay`}
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

          {starting ? <ChatStatus>Trợ lý đang soạn…</ChatStatus> : null}
          {busy && !starting && last?.role === 'assistant' && proposals.length === 0 && last.parts.at(-1)?.type === 'text' ? <ChatStatus>Đang viết…</ChatStatus> : null}
          {error ? (
            <View style={[styles.errorCard, { backgroundColor: theme.muted }]}>
              <Text accessibilityRole="alert" style={[styles.errorText, { color: theme.destructive }]}>{error}</Text>
              {assistant.canRetry ? (
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
    return <ChatStatus>{SERVER_TOOL_LABEL[name] ?? 'Đang xử lý…'}</ChatStatus>;
  }
  if (output?.url) {
    const input = (part.input ?? {}) as { aspectRatio?: string };
    return (
      <View style={styles.generatedRow}>
        <ZoomImage source={{ uri: output.url }} style={[styles.generated, { aspectRatio: ratioOf(input.aspectRatio) }]} contentFit="cover" accessibilityLabel="Ảnh do trợ lý tạo" />
      </View>
    );
  }
  if (output?.error) return <Text style={[styles.outcome, { color: theme.mutedForeground }]}>Không tạo được ảnh lần này.</Text>;
  return null;
}

function ProposalBody({ tool, input }: { tool: EditorToolName; input: unknown }) {
  const theme = useTheme();
  const data = (input ?? {}) as Record<string, string | undefined>;
  const block = (label: string, text: string | undefined, tone: 'old' | 'new') => (text ? (
    <View style={[styles.diff, { backgroundColor: tone === 'new' ? theme.secondary : theme.muted }]}>
      <Text style={[styles.diffLabel, { color: theme.mutedForeground }]}>{label}</Text>
      <Text style={[styles.diffText, { color: theme.foreground }]}>{preview(text, 600)}</Text>
    </View>
  ) : null);

  switch (tool) {
    case 'replaceSelection': return block('Nội dung mới', data.markdown, 'new');
    case 'replaceText': return <>{block('Đoạn cũ', data.find, 'old')}{block('Đoạn mới', data.replace, 'new')}</>;
    case 'insertMarkdown': return block(data.position === 'end' ? 'Thêm vào cuối bài' : data.position === 'after' ? 'Thêm sau đoạn đã nêu' : 'Thêm tại vị trí con trỏ', data.markdown, 'new');
    case 'setTitle': return block('Tiêu đề mới', data.title, 'new');
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
  prompts: { gap: Spacing.two, paddingLeft: 42 },
  prompt: { borderWidth: 1, borderRadius: Radius['2xl'], paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + Spacing.one },
  promptText: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20 },
  assistantMessage: { gap: Spacing.two + Spacing.one },
  proposal: { marginLeft: 42, borderWidth: 1.5, borderRadius: Radius['2xl'], padding: Spacing.three, gap: Spacing.two + Spacing.one },
  proposalHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  proposalTitle: { flex: 1, fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 20 },
  diff: { borderRadius: Radius.xl, padding: Spacing.two + Spacing.one, gap: 2 },
  diffLabel: { fontFamily: Fonts.sansBold, fontSize: 11, lineHeight: 15, letterSpacing: 0.6 },
  diffText: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  proposalActions: { flexDirection: 'row', gap: Spacing.two },
  proposalButton: { flex: 1, minHeight: 42, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  reject: { borderWidth: 1 },
  proposalButtonText: { fontFamily: Fonts.sansBold, fontSize: 14 },
  outcome: { fontFamily: Fonts.sansSemibold, fontSize: 12, lineHeight: 17 },
  // Rows that hold an image leave room for the avatar column; the image itself never exceeds its parent's width.
  generatedRow: { paddingLeft: 42 },
  generated: { width: '100%', maxWidth: 360, borderRadius: Radius.xl },
  proposalImage: { height: 200 },
  errorCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three, borderRadius: Radius.xl, padding: Spacing.three },
  errorText: { flex: 1, fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 19 },
  retry: { fontFamily: Fonts.sansBold, fontSize: 13, lineHeight: 19 },
});
