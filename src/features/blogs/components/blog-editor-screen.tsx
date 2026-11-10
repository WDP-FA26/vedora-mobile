import { Redirect, router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ZoomImage } from '@/shared/components/image-viewer';
import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { useBlog } from '../hooks/use-blog';
import { useBlogAssistant } from '../hooks/use-blog-assistant';
import { useBlogBlocks } from '../hooks/use-blog-blocks';
import { useBlogImage } from '../hooks/use-blog-image';
import { useSaveBlog } from '../hooks/use-my-blogs';
import { blogInputSchema, MAX_BLOG_CONTENT_LENGTH, MAX_BLOG_TITLE_LENGTH, type Blog } from '../types/blogs.schema';
import { BlogAssistantSheet, type EditorApply } from './blog-assistant-sheet';
import { blocksToMarkdown, markdownToBlocks } from '../utils/blog-blocks';
import { BlogMarkdown } from './blog-article';
import { BlogFormatBar, BlogRichEditor } from './blog-rich-editor';

export function BlogEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const token = useSessionStore((state) => state.accessToken);
  const theme = useTheme();
  const blog = useBlog(id ?? '', !!id && !!token);
  if (!token) return <Redirect href={{ pathname: '/login', params: { returnTo: id ? '/blogs' : '/blogs/new' } }} />;
  if (!id) return <BlogEditor key="new" initial={null} />;
  if (blog.isPending) return <SafeAreaView style={[styles.screen, styles.loading, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.primary} /></SafeAreaView>;
  if (!blog.data) return <SafeAreaView style={[styles.screen, styles.loading, { backgroundColor: theme.background }]}>
    <Text style={[styles.copy, { color: theme.destructive }]}>{blog.error instanceof ApiError && blog.error.status === 404 ? 'Blog không tồn tại hoặc bạn không có quyền truy cập.' : 'Chưa tải được blog.'}</Text>
    <Pressable accessibilityRole="button" onPress={() => void blog.refetch()} style={styles.textButton}><Text style={[styles.textButtonLabel, { color: theme.primary }]}>Thử lại</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/blogs')} style={styles.textButton}><Text style={[styles.textButtonLabel, { color: theme.primary }]}>Về Blog của bạn</Text></Pressable>
  </SafeAreaView>;
  return <BlogEditor key={blog.data.id} initial={blog.data} />;
}

function BlogEditor({ initial }: { initial: Blog | null }) {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  const save = useSaveBlog();
  const image = useBlogImage();
  const [id, setId] = useState(initial?.id ?? null);
  const [title, setTitle] = useState(initial?.blog.title ?? '');
  const [cover, setCover] = useState(initial?.blog.coverImageUrl ?? '');
  const [status, setStatus] = useState<Blog['status']>(initial?.status ?? 'DRAFT');
  // The saved text is compared in the form the editor writes, so opening a blog never shows "unsaved".
  const [saved, setSaved] = useState(() => ({ title: initial?.blog.title ?? '', content: blocksToMarkdown(markdownToBlocks(initial?.content ?? '')), cover: initial?.blog.coverImageUrl ?? '' }));
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [leave, setLeave] = useState<(() => void) | null>(null);
  const [discard, setDiscard] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const actionLock = useRef(false);
  const changed = useCallback(() => { setNotice(''); setError(''); }, []);
  const editor = useBlogBlocks(initial?.content ?? '', changed);
  const content = editor.markdown;
  const assistant = useBlogAssistant({ blogId: id, getEditor: () => ({ title, content, range: editor.markdownRange() }) });
  const dirty = title !== saved.title || content !== saved.content || cover !== saved.cover;
  const busy = save.isPending || image.isPending;
  usePreventRemove(!discard && (dirty || busy), ({ repeat }) => {
    if (!actionLock.current) setLeave(() => repeat);
  });

  /** A change the assistant proposed and the user accepted. */
  function applyAssistant(result: EditorApply) {
    setTitle(result.title);
    editor.replaceAll(result.content);
  }

  async function persist(nextStatus: Blog['status']) {
    if (actionLock.current) return;
    const input = blogInputSchema.safeParse({ title, content, coverImageUrl: cover.trim() || null, status: nextStatus });
    if (!input.success) { setError(input.error.issues[0]?.message ?? 'Kiểm tra lại nội dung.'); return; }
    if (!token) { setError('Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.'); return; }
    actionLock.current = true;
    setError(''); setNotice('');
    try {
      const result = await save.mutateAsync({ id, input: input.data });
      setId(result.id);
      setTitle(result.blog.title);
      // Keep the editor as it is (and the cursor in it) unless the server stored something different.
      const stored = result.content === content ? content : blocksToMarkdown(markdownToBlocks(result.content));
      if (result.content !== content) editor.replaceAll(result.content);
      setCover(result.blog.coverImageUrl ?? '');
      setStatus(result.status);
      setSaved({ title: result.blog.title, content: stored, cover: result.blog.coverImageUrl ?? '' });
      setNotice(result.status === 'PUBLISHED' ? 'Đã lưu và đăng blog.' : 'Đã lưu bản nháp.');
    } catch (caught) {
      setError(caught instanceof ApiError && caught.code === 'BLOG_CONTENT_REQUIRED' ? 'Hãy viết nội dung trước khi đăng.'
        : caught instanceof ApiError && caught.status === 404 ? 'Blog không còn tồn tại hoặc bạn không có quyền sửa.'
        : caught instanceof ApiError && caught.status === 401 ? 'Phiên đăng nhập đã hết hạn. Nội dung vẫn được giữ trên màn hình.'
        : 'Chưa lưu được blog. Nội dung vẫn được giữ, hãy thử lại.');
    } finally { actionLock.current = false; }
  }

  async function addImage(asCover: boolean) {
    if (actionLock.current) return;
    actionLock.current = true;
    changed();
    try {
      const url = await image.mutateAsync();
      if (url) {
        if (asCover) setCover(url);
        else editor.addImage(url);
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? 'Không tải được ảnh lên. Vui lòng thử lại.' : caught instanceof Error ? caught.message : 'Không chọn được ảnh.');
    } finally { actionLock.current = false; }
  }

  const published = status === 'PUBLISHED';
  const feedback = error || notice;

  return <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" disabled={busy} onPress={() => router.canGoBack() ? router.back() : router.replace('/blogs')} style={[styles.round, { backgroundColor: theme.muted }]}>
        <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={20} tintColor={theme.foreground} />
      </Pressable>
      <View style={styles.headerCopy}>
        <Text accessibilityRole="header" numberOfLines={1} style={[styles.heading, { color: theme.foreground }]}>{id ? 'Chỉnh sửa blog' : 'Viết blog'}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: published ? theme.primary : theme.chart3 }]} />
          <Text style={[styles.statusText, { color: theme.mutedForeground }]}>{published ? 'Đã đăng' : 'Bản nháp'}{dirty ? ' · Chưa lưu' : ''}</Text>
        </View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Mở trợ lý viết blog" disabled={busy} onPress={() => setAssistantOpen(true)} style={({ pressed }) => [styles.assist, { backgroundColor: theme.secondary, opacity: busy ? 0.5 : pressed ? 0.8 : 1 }]}>
        <SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={16} tintColor={theme.primary} />
        <Text style={[styles.assistText, { color: theme.secondaryForeground }]}>Trợ lý</Text>
      </Pressable>
      {id && published && !dirty ? (
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => router.push({ pathname: '/posts/[id]', params: { id } })} style={[styles.viewButton, { backgroundColor: theme.secondary }]}>
          <Text style={[styles.viewText, { color: theme.secondaryForeground }]}>Xem bài</Text>
        </Pressable>
      ) : null}
    </View>

    <View accessibilityRole="tablist" style={[styles.segment, { backgroundColor: theme.muted }]}>
      {([false, true] as const).map((isPreview) => {
        const selected = preview === isPreview;
        return (
          <Pressable key={String(isPreview)} accessibilityRole="tab" accessibilityState={{ selected }} disabled={busy} onPress={() => setPreview(isPreview)} style={[styles.segmentItem, { backgroundColor: selected ? theme.card : 'transparent' }]}>
            <SymbolView name={isPreview ? { ios: 'eye', android: 'visibility', web: 'visibility' } : { ios: 'square.and.pencil', android: 'edit', web: 'edit' }} size={16} tintColor={selected ? theme.primary : theme.mutedForeground} />
            <Text style={[styles.segmentText, { color: selected ? theme.primary : theme.mutedForeground }]}>{isPreview ? 'Xem trước' : 'Soạn thảo'}</Text>
          </Pressable>
        );
      })}
    </View>

    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {preview ? <>
          {cover ? <ZoomImage source={{ uri: cover }} style={styles.cover} contentFit="cover" accessibilityLabel="Ảnh bìa" /> : null}
          <Text style={[styles.previewTitle, { color: theme.foreground }]}>{title || 'Tiêu đề blog'}</Text>
          {content.trim() ? <BlogMarkdown content={content} /> : <Text style={[styles.copy, { color: theme.mutedForeground }]}>Nội dung bài viết sẽ hiển thị ở đây.</Text>}
        </> : <>
          {cover ? (
            <View style={styles.coverWrap}>
              <ZoomImage source={{ uri: cover }} style={styles.cover} contentFit="cover" accessibilityLabel="Ảnh bìa" />
              <View style={styles.coverActions}>
                <Pressable accessibilityRole="button" disabled={busy} onPress={() => void addImage(true)} style={styles.coverButton}><Text style={styles.coverButtonText}>Đổi ảnh</Text></Pressable>
                <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setCover(''); changed(); }} style={styles.coverButton}><Text style={styles.coverButtonText}>Gỡ</Text></Pressable>
              </View>
            </View>
          ) : (
            <Pressable accessibilityRole="button" accessibilityLabel="Thêm ảnh bìa" disabled={busy} onPress={() => void addImage(true)} style={({ pressed }) => [styles.coverEmpty, { borderColor: theme.border, backgroundColor: theme.card, opacity: pressed ? 0.8 : 1 }]}>
              <View style={[styles.coverIcon, { backgroundColor: theme.secondary }]}><SymbolView name={{ ios: 'photo', android: 'image', web: 'image' }} size={22} tintColor={theme.primary} /></View>
              <Text style={[styles.coverTitle, { color: theme.foreground }]}>Thêm ảnh bìa</Text>
              <Text style={[styles.coverHint, { color: theme.mutedForeground }]}>JPEG, PNG, WebP hoặc GIF, tối đa 5 MB</Text>
            </Pressable>
          )}

          <TextInput
            accessibilityLabel="Tiêu đề blog"
            value={title}
            editable={!busy}
            onChangeText={(value) => { setTitle(value); changed(); }}
            maxLength={MAX_BLOG_TITLE_LENGTH}
            placeholder="Tiêu đề blog"
            placeholderTextColor={theme.mutedForeground}
            style={[styles.titleInput, { color: theme.foreground, borderBottomColor: theme.border }]}
            multiline
            numberOfLines={1}
          />
          <Text style={[styles.counter, { color: title.length > MAX_BLOG_TITLE_LENGTH - 20 ? theme.destructive : theme.mutedForeground }]}>{title.length}/{MAX_BLOG_TITLE_LENGTH}</Text>

          <View style={styles.body}>
            <BlogRichEditor editor={editor} disabled={busy} />
          </View>
          <Text style={[styles.counter, { color: content.length > MAX_BLOG_CONTENT_LENGTH ? theme.destructive : theme.mutedForeground }]}>{content.length.toLocaleString('vi-VN')}/50.000 ký tự</Text>
        </>}
      </ScrollView>

      {preview ? null : <BlogFormatBar editor={editor} disabled={busy} onImage={() => void addImage(false)} />}

      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <View style={styles.footerInner}>
          {busy ? (
            <View style={styles.feedback}><ActivityIndicator size="small" color={theme.primary} /><Text style={[styles.feedbackText, { color: theme.mutedForeground }]}>{image.isPending ? 'Đang tải ảnh…' : 'Đang lưu…'}</Text></View>
          ) : feedback ? (
            <Text accessibilityRole="alert" style={[styles.feedbackText, styles.feedbackCenter, { color: error ? theme.destructive : theme.primary }]}>{feedback}</Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void persist(status)} style={({ pressed }) => [styles.action, styles.actionOutline, { borderColor: theme.border, opacity: busy ? 0.5 : pressed ? 0.8 : 1 }]}>
              <Text style={[styles.actionText, { color: theme.primary }]}>{published ? 'Lưu thay đổi' : 'Lưu nháp'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void persist(published ? 'DRAFT' : 'PUBLISHED')} style={({ pressed }) => [styles.action, published ? styles.actionOutline : styles.actionPrimary, published ? { borderColor: theme.border } : { backgroundColor: theme.primary }, { opacity: busy ? 0.5 : pressed ? 0.85 : 1 }]}>
              <Text style={[styles.actionText, { color: published ? theme.foreground : theme.primaryForeground }]}>{published ? 'Chuyển về nháp' : 'Đăng blog'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>

    <BlogAssistantSheet visible={assistantOpen} onClose={() => setAssistantOpen(false)} assistant={assistant} title={title} content={content} range={editor.markdownRange()} onApply={applyAssistant} />

    <Modal visible={!!leave} transparent animationType="fade" onRequestClose={() => setLeave(null)}>
      <View style={styles.overlay}><View style={[styles.dialog, { backgroundColor: theme.card }]}>
        <Text style={[styles.dialogTitle, { color: theme.foreground }]}>Bỏ thay đổi chưa lưu?</Text>
        <Text style={[styles.copy, { color: theme.mutedForeground }]}>Nội dung mới chưa được lưu. Bạn có thể ở lại để lưu nháp trước.</Text>
        <Pressable accessibilityRole="button" onPress={() => setLeave(null)} style={[styles.action, styles.actionPrimary, { backgroundColor: theme.primary }]}><Text style={[styles.actionText, { color: theme.primaryForeground }]}>Tiếp tục viết</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => { setDiscard(true); const repeat = leave; setLeave(null); repeat?.(); }} style={styles.textButton}><Text style={[styles.textButtonLabel, { color: theme.destructive }]}>Bỏ thay đổi</Text></Pressable>
      </View></View>
    </Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { justifyContent: 'center', alignItems: 'center', gap: Spacing.three, padding: Spacing.four },
  copy: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 },
  textButton: { minHeight: 44, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  textButtonLabel: { fontFamily: Fonts.sansBold, fontSize: 14 },

  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  round: { width: 40, height: 40, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0 },
  heading: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 25 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one + Spacing.half },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  assist: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: Spacing.one + Spacing.half, borderRadius: Radius['4xl'], paddingHorizontal: Spacing.three - Spacing.one },
  assistText: { fontFamily: Fonts.sansBold, fontSize: 13 },
  viewButton: { minHeight: 36, borderRadius: Radius['4xl'], paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  viewText: { fontFamily: Fonts.sansBold, fontSize: 13 },

  segment: { flexDirection: 'row', marginHorizontal: Spacing.three, marginTop: Spacing.three, padding: 4, borderRadius: Radius.xl },
  segmentItem: { flex: 1, minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two, borderRadius: Radius.lg },
  segmentText: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 20 },

  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three },
  cover: { width: '100%', aspectRatio: 16 / 9, borderRadius: Radius['2xl'] },
  coverWrap: { position: 'relative' },
  coverActions: { position: 'absolute', top: Spacing.two, right: Spacing.two, flexDirection: 'row', gap: Spacing.two },
  coverButton: { minHeight: 34, borderRadius: Radius['4xl'], paddingHorizontal: Spacing.three, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  coverButtonText: { color: '#fffefa', fontFamily: Fonts.sansBold, fontSize: 12 },
  coverEmpty: { width: '100%', aspectRatio: 16 / 7, borderRadius: Radius['2xl'], borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: Spacing.one, padding: Spacing.three },
  coverIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.one },
  coverTitle: { fontFamily: Fonts.sansBold, fontSize: 15, lineHeight: 21 },
  coverHint: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },

  titleInput: { fontFamily: Fonts.headingBold, fontSize: 24, lineHeight: 32, paddingVertical: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth },
  counter: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17, alignSelf: 'flex-end', marginTop: -Spacing.two },
  body: { minHeight: 280 },
  editorCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius['2xl'], overflow: 'hidden' },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, padding: Spacing.one + Spacing.half, borderBottomWidth: StyleSheet.hairlineWidth },
  tool: { width: 40, height: 40, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  toolDivider: { width: StyleSheet.hairlineWidth, height: 22, marginHorizontal: Spacing.one },
  editor: { minHeight: 320, padding: Spacing.three, fontFamily: Fonts.sans, fontSize: 16, lineHeight: 26 },
  editorCounter: { marginTop: 0, paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  help: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  previewTitle: { fontFamily: Fonts.headingBold, fontSize: 26, lineHeight: 34 },

  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, paddingTop: Spacing.two + Spacing.one, paddingBottom: Spacing.two + Spacing.one },
  footerInner: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: Spacing.two },
  feedback: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  feedbackText: { fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 19 },
  feedbackCenter: { textAlign: 'center' },
  actions: { flexDirection: 'row', gap: Spacing.two },
  action: { flex: 1, minHeight: 48, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three },
  actionOutline: { borderWidth: 1 },
  actionPrimary: {},
  actionText: { fontFamily: Fonts.sansBold, fontSize: 15, lineHeight: 21 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: Spacing.four },
  dialog: { padding: Spacing.four, borderRadius: Radius['3xl'], gap: Spacing.three, maxWidth: 440, width: '100%', alignSelf: 'center' },
  dialogTitle: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 25 },
});
