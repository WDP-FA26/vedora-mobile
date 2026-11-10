import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { useBlog } from '../hooks/use-blog';
import { useBlogImage } from '../hooks/use-blog-image';
import { useSaveBlog } from '../hooks/use-my-blogs';
import { blogInputSchema, MAX_BLOG_CONTENT_LENGTH, MAX_BLOG_TITLE_LENGTH, type Blog } from '../types/blogs.schema';
import { BlogMarkdown } from './blog-article';

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
    <Pressable accessibilityRole="button" onPress={() => void blog.refetch()} style={styles.button}><Text style={{ color: theme.primary }}>Thử lại</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/blogs')} style={styles.button}><Text style={{ color: theme.primary }}>Về Blog của bạn</Text></Pressable>
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
  const [content, setContent] = useState(initial?.content ?? '');
  const [cover, setCover] = useState(initial?.blog.coverImageUrl ?? '');
  const [status, setStatus] = useState<Blog['status']>(initial?.status ?? 'DRAFT');
  const [saved, setSaved] = useState({ title: initial?.blog.title ?? '', content: initial?.content ?? '', cover: initial?.blog.coverImageUrl ?? '' });
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [leave, setLeave] = useState<(() => void) | null>(null);
  const [discard, setDiscard] = useState(false);
  const actionLock = useRef(false);
  const dirty = title !== saved.title || content !== saved.content || cover !== saved.cover;
  const busy = save.isPending || image.isPending;
  usePreventRemove(!discard && (dirty || busy), ({ repeat }) => {
    if (!actionLock.current) setLeave(() => repeat);
  });

  function changed() { setNotice(''); setError(''); }

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
      setContent(result.content);
      setCover(result.blog.coverImageUrl ?? '');
      setStatus(result.status);
      setSaved({ title: result.blog.title, content: result.content, cover: result.blog.coverImageUrl ?? '' });
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
        else setContent((current) => `${current}${current ? '\n\n' : ''}![Ảnh trong bài](${url})\n`);
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? 'Không tải được ảnh lên. Vui lòng thử lại.' : caught instanceof Error ? caught.message : 'Không chọn được ảnh.');
    } finally { actionLock.current = false; }
  }

  const inputStyle = [styles.input, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.card }];
  return <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
    <View style={[styles.header, { borderColor: theme.border }]}>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => router.canGoBack() ? router.back() : router.replace('/blogs')} style={styles.button}><Text style={[styles.buttonText, { color: theme.primary }]}>‹ Quay lại</Text></Pressable>
      <Text style={[styles.heading, { color: theme.foreground }]}>{id ? 'Chỉnh sửa blog' : 'Viết blog'}</Text>
    </View>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Text style={[styles.status, { color: theme.primary }]}>{status === 'PUBLISHED' ? 'Đã đăng' : 'Bản nháp'}{dirty ? ' · Chưa lưu thay đổi' : ''}</Text>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => setPreview(!preview)} style={styles.button}><Text style={[styles.buttonText, { color: theme.primary }]}>{preview ? 'Chỉnh sửa' : 'Xem trước'}</Text></Pressable>
        </View>
        {preview ? <>
          {cover ? <Image source={{ uri: cover }} style={styles.cover} contentFit="cover" /> : null}
          <Text style={[styles.title, { color: theme.foreground }]}>{title || 'Tiêu đề blog'}</Text>
          <BlogMarkdown content={content} />
          {!content.trim() ? <Text style={[styles.copy, { color: theme.mutedForeground }]}>Nội dung bài viết sẽ hiển thị ở đây.</Text> : null}
        </> : <>
          <Text style={[styles.label, { color: theme.foreground }]}>Tiêu đề</Text>
          <TextInput accessibilityLabel="Tiêu đề blog" value={title} editable={!busy} onChangeText={(value) => { setTitle(value); changed(); }} maxLength={MAX_BLOG_TITLE_LENGTH} placeholder="Chia sẻ câu chuyện bếp chay…" placeholderTextColor={theme.mutedForeground} style={[inputStyle, styles.titleInput]} multiline />
          <Text style={[styles.counter, { color: theme.mutedForeground }]}>{title.length}/{MAX_BLOG_TITLE_LENGTH}</Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.foreground }]}>Ảnh bìa</Text>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void addImage(true)} style={styles.button}><Text style={[styles.buttonText, { color: theme.primary }]}>Chọn ảnh</Text></Pressable>
          </View>
          {cover ? <View>
            <Image source={{ uri: cover }} style={styles.cover} contentFit="cover" />
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setCover(''); changed(); }} style={styles.button}><Text style={{ color: theme.destructive }}>Bỏ ảnh bìa</Text></Pressable>
          </View> : null}
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.foreground }]}>Nội dung</Text>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void addImage(false)} style={styles.button}><Text style={[styles.buttonText, { color: theme.primary }]}>Thêm ảnh</Text></Pressable>
          </View>
          <Text style={[styles.help, { color: theme.mutedForeground }]}>Dùng ## cho đề mục, **chữ đậm**, *chữ nghiêng* và - cho danh sách. Ảnh được thêm vào cuối bài.</Text>
          <TextInput accessibilityLabel="Nội dung blog" value={content} editable={!busy} onChangeText={(value) => { setContent(value); changed(); }} maxLength={MAX_BLOG_CONTENT_LENGTH} placeholder="Bắt đầu bằng câu chuyện, nguyên liệu hoặc cách làm của bạn…" placeholderTextColor={theme.mutedForeground} style={[inputStyle, styles.editor]} multiline textAlignVertical="top" />
          <Text style={[styles.counter, { color: theme.mutedForeground }]}>{content.length.toLocaleString('vi-VN')}/50.000</Text>
        </>}
        {busy ? <View style={styles.row}><ActivityIndicator color={theme.primary} /><Text style={[styles.copy, { color: theme.mutedForeground }]}>{image.isPending ? 'Đang tải ảnh…' : 'Đang lưu…'}</Text></View> : null}
        {error ? <Text accessibilityRole="alert" style={[styles.copy, { color: theme.destructive }]}>{error}</Text> : null}
        {notice ? <Text accessibilityRole="alert" style={[styles.copy, { color: theme.primary }]}>{notice}</Text> : null}
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void persist(status)} style={[styles.button, styles.outline, { borderColor: theme.border, opacity: busy ? 0.5 : 1 }]}><Text style={[styles.buttonText, { color: theme.primary }]}>{status === 'PUBLISHED' ? 'Lưu thay đổi' : 'Lưu nháp'}</Text></Pressable>
          {status === 'DRAFT' ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => void persist('PUBLISHED')} style={[styles.button, styles.primary, { backgroundColor: theme.primary, opacity: busy ? 0.5 : 1 }]}><Text style={[styles.buttonText, { color: theme.primaryForeground }]}>Đăng blog</Text></Pressable> : <Pressable accessibilityRole="button" disabled={busy} onPress={() => void persist('DRAFT')} style={styles.button}><Text style={[styles.buttonText, { color: theme.primary }]}>Chuyển về nháp</Text></Pressable>}
        </View>
        {id && status === 'PUBLISHED' && !dirty ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => router.push({ pathname: '/posts/[id]', params: { id } })} style={styles.button}><Text style={[styles.buttonText, { color: theme.primary }]}>Xem bài đã đăng →</Text></Pressable> : null}
        <Text style={[styles.help, { color: theme.mutedForeground }]}>Bấm lưu trước khi rời màn hình. Blog chỉ công khai sau khi bạn đăng bài.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
    <Modal visible={!!leave} transparent animationType="fade" onRequestClose={() => setLeave(null)}>
      <View style={styles.overlay}><View style={[styles.dialog, { backgroundColor: theme.card }]}>
        <Text style={[styles.heading, { color: theme.foreground }]}>Bỏ thay đổi chưa lưu?</Text>
        <Text style={[styles.copy, { color: theme.mutedForeground }]}>Nội dung mới chưa được lưu. Bạn có thể ở lại để lưu nháp trước.</Text>
        <Pressable accessibilityRole="button" onPress={() => setLeave(null)} style={[styles.button, styles.primary, { backgroundColor: theme.primary }]}><Text style={[styles.buttonText, { color: theme.primaryForeground }]}>Tiếp tục viết</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => { setDiscard(true); const repeat = leave; setLeave(null); repeat?.(); }} style={styles.button}><Text style={[styles.buttonText, { color: theme.destructive }]}>Bỏ thay đổi</Text></Pressable>
      </View></View>
    </Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 60, borderBottomWidth: 1, paddingHorizontal: Spacing.two, gap: Spacing.two },
  heading: { fontFamily: Fonts.headingBold, fontSize: 20 },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.three, paddingBottom: 40, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, justifyContent: 'space-between' },
  status: { flex: 1, fontFamily: Fonts.sansSemibold, fontSize: 13 },
  label: { fontFamily: Fonts.sansBold, fontSize: 16 },
  copy: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 },
  input: { borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.three, fontFamily: Fonts.sans, fontSize: 16, lineHeight: 25 },
  titleInput: { minHeight: 68, fontFamily: Fonts.headingBold, fontSize: 21 },
  editor: { minHeight: 340 },
  counter: { fontFamily: Fonts.sans, fontSize: 12, alignSelf: 'flex-end' },
  title: { fontFamily: Fonts.headingBold, fontSize: 26, lineHeight: 34 },
  cover: { height: 190, width: '100%', borderRadius: Radius.xl },
  help: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20 },
  button: { minHeight: 44, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.xl },
  buttonText: { fontFamily: Fonts.sansBold, fontSize: 14 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  outline: { borderWidth: 1, flex: 1 },
  primary: { minHeight: 48, flexGrow: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  dialog: { padding: 24, borderRadius: Radius['2xl'], gap: 16, maxWidth: 440, width: '100%', alignSelf: 'center' },
});
