import { router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import type { FeedPost } from '@/features/feed/types/feed.schema';
import { VideoFileList } from '@/features/feed/components/video-file-list';
import { useVideoFiles } from '@/features/feed/hooks/use-video-files';
import { discardVideoUpload, requestVideoUpload } from '@/features/feed/services/compose.service';
import { useMyProfile } from '@/features/profile/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { usePost } from '../hooks/use-posts';
import { useUpdatePost } from '../hooks/use-update-post';
import { MAX_POST_BODY_LENGTH, MAX_POST_BODY_WORDS, postEditFormSchema, postWordCount } from '../types/post-edit.schema';
import { postEditError } from '../utils/post-edit-error';
import { canEditPost } from '../utils/post-status';

function back() {
  if (router.canGoBack()) router.back();
  else router.replace('/explore');
}

function EditState({ message, loading = false, retry }: { message: string; loading?: boolean; retry?: () => void }) {
  const theme = useTheme();
  return <SafeAreaView style={[styles.screen, styles.state, { backgroundColor: theme.background }]}>
    {loading ? <ActivityIndicator color={theme.primary} /> : null}
    <Text accessibilityRole={loading ? undefined : 'alert'} style={[styles.label, { color: theme.foreground }]}>{message}</Text>
    {retry ? <Pressable accessibilityRole="button" onPress={retry} style={styles.button}><Text style={[styles.buttonText, { color: theme.primary }]}>Thử lại</Text></Pressable> : null}
    <Pressable accessibilityRole="button" onPress={back} style={styles.button}><Text style={[styles.buttonText, { color: theme.primary }]}>Quay lại</Text></Pressable>
  </SafeAreaView>;
}

export function PostEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useSessionStore((state) => state.accessToken);
  if (!z.uuidv4().safeParse(id).success) return <EditState message="Không tìm thấy bài viết hợp lệ." />;
  if (!token) return <EditState message="Hãy đăng nhập trước khi sửa bài viết." />;
  return <PostEditLoader postId={id} token={token} />;
}

function PostEditLoader({ postId, token }: { postId: string; token: string }) {
  const query = usePost(postId);
  const me = useMyProfile(token);
  if (query.isPending || me.isPending) return <EditState message="Đang tải bài viết…" loading />;
  if (query.isError || me.isError || !query.data || !me.data) {
    return <EditState message={query.error instanceof ApiError && query.error.status === 404 ? 'Bài viết không còn tồn tại hoặc bạn không có quyền xem.' : 'Chưa tải được bài viết hoặc hồ sơ của bạn.'} retry={() => { void query.refetch(); void me.refetch(); }} />;
  }
  if (me.data.id !== query.data.author.id) return <EditState message="Bạn chỉ có thể sửa bài viết của mình." />;
  if (!canEditPost(query.data)) return <EditState message="Bài viết đang xử lý, đã bị gỡ hoặc có khiếu nại đang mở nên chưa thể sửa." />;
  return <PostEditForm key={`${postId}:${me.data.id}`} post={query.data} />;
}

export function PostEditForm({ post }: { post: FeedPost }) {
  const theme = useTheme();
  const [original] = useState(post);
  const [body, setBody] = useState(post.body ?? '');
  const [mediaIds, setMediaIds] = useState(post.media.map((item) => item.id));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const submitting = useRef(false);
  const save = useUpdatePost(post.id);
  const videos = useVideoFiles(discardVideoUpload);
  const [uploading, setUploading] = useState(false);
  const bodyChanged = body.trim() !== (original.body ?? '').trim();
  const mediaChanged = mediaIds.join(',') !== original.media.map((item) => item.id).join(',') || videos.entries.length > 0;
  const dirty = bodyChanged || mediaChanged;
  const busy = save.isPending || uploading || videos.picking;
  const disablePrevention = usePreventRemove(!saved && (dirty || busy), ({ repeat }) => {
    if (submitting.current || save.isPending) return;
    const discard = () => { setSaved(true); repeat(); };
    if (Platform.OS === 'web') {
      if (window.confirm('Bỏ thay đổi chưa lưu?')) discard();
    } else Alert.alert('Bỏ thay đổi chưa lưu?', 'Nội dung vừa chỉnh sẽ không được lưu.', [
      { text: 'Tiếp tục chỉnh sửa', style: 'cancel' },
      { text: 'Bỏ thay đổi', style: 'destructive', onPress: discard },
    ]);
  });

  function moveVideo(index: number, offset: number) {
    if (busy || index + offset < 0 || index + offset >= mediaIds.length) return;
    const next = [...mediaIds];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    setMediaIds(next);
  }

  async function submit() {
    if (submitting.current || busy || !dirty) return;
    if (!canEditPost(post)) { setError('Bài viết chưa thể sửa. Hãy tải lại để kiểm tra trạng thái.'); return; }
    const parsed = postEditFormSchema.safeParse({ body, mediaIds: [...mediaIds, ...videos.entries.map((entry) => entry.id)] });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Kiểm tra lại nội dung.'); return; }
    submitting.current = true;
    setUploading(true);
    setError('');
    try {
      const added = videos.entries.length ? await videos.uploadAll(async () => {
        const target = await requestVideoUpload();
        return { id: target.media.id, upload: target.upload };
      }) : [];
      await save.mutateAsync({
        ...(bodyChanged ? { body: parsed.data.body } : {}),
        ...(mediaChanged ? { mediaIds: [...mediaIds, ...added] } : {}),
      });
      videos.commit(added);
      setSaved(true);
      disablePrevention();
      router.replace({ pathname: '/posts/[id]', params: { id: post.id } });
    } catch (caught) { setError(postEditError(caught)); }
    finally { submitting.current = false; setUploading(false); }
  }

  return <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Hủy sửa bài viết" disabled={busy} onPress={back} style={styles.back}>
        <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={22} tintColor={theme.foreground} />
      </Pressable>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>Sửa bài viết</Text>
    </View>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={[styles.notice, { backgroundColor: theme.secondary }]}>
          <Text style={[styles.helper, { color: theme.secondaryForeground }]}>Sau khi lưu, bài viết sẽ được kiểm duyệt lại và có thể tạm ẩn khỏi bảng tin. Bạn có thể theo dõi trạng thái tại chi tiết bài viết.</Text>
        </View>
        <Text style={[styles.label, { color: theme.foreground }]}>Nội dung bài viết</Text>
        <TextInput accessibilityLabel="Nội dung bài viết" value={body} onChangeText={setBody} editable={!busy} multiline maxLength={MAX_POST_BODY_LENGTH}
          placeholder="Chia sẻ nội dung của bạn…" placeholderTextColor={theme.mutedForeground}
          style={[styles.input, { borderColor: theme.border, color: theme.foreground, backgroundColor: theme.card }]} />
        <Text style={[styles.counter, { color: postWordCount(body) > MAX_POST_BODY_WORDS ? theme.destructive : theme.mutedForeground }]}>{body.length}/{MAX_POST_BODY_LENGTH} ký tự · {postWordCount(body)}/{MAX_POST_BODY_WORDS} từ</Text>
        {original.media.length ? <>
          <Text style={[styles.label, { color: theme.foreground }]}>Video đính kèm ({mediaIds.length})</Text>
          <Text style={[styles.helper, { color: theme.mutedForeground }]}>Gỡ, đổi thứ tự hoặc thêm video mới. Thay đổi chỉ áp dụng khi lưu bài viết.</Text>
          {mediaIds.map((id, index) => {
            const media = original.media.find((item) => item.id === id)!;
            return <View key={id} style={[styles.video, { borderColor: theme.border, backgroundColor: theme.card }]}>
              {media.posterUrl ? <Image source={{ uri: media.posterUrl }} contentFit="cover" style={styles.poster} accessible={false} /> : <View style={[styles.poster, { backgroundColor: theme.secondary }]} />}
              <View style={styles.videoInfo}><Text style={[styles.label, { color: theme.foreground }]}>Video {index + 1}</Text>
                {media.status === 'FAILED' ? <Text style={[styles.helper, { color: theme.destructive }]}>Video bị lỗi</Text> : null}
                <View style={styles.videoActions}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Đưa video ${index + 1} lên trước`} disabled={busy || index === 0} onPress={() => moveVideo(index, -1)} style={[styles.videoButton, { opacity: busy || index === 0 ? 0.4 : 1 }]}><Text style={[styles.buttonText, { color: theme.primary }]}>Lên</Text></Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Đưa video ${index + 1} xuống sau`} disabled={busy || index === mediaIds.length - 1} onPress={() => moveVideo(index, 1)} style={[styles.videoButton, { opacity: busy || index === mediaIds.length - 1 ? 0.4 : 1 }]}><Text style={[styles.buttonText, { color: theme.primary }]}>Xuống</Text></Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Gỡ video ${index + 1}`} disabled={busy} onPress={() => setMediaIds((ids) => ids.filter((value) => value !== id))} style={styles.videoButton}><Text style={[styles.buttonText, { color: theme.destructive }]}>Gỡ</Text></Pressable>
                </View>
              </View>
            </View>;
          })}
          {mediaChanged ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => setMediaIds(original.media.map((item) => item.id))} style={styles.button}><Text style={[styles.buttonText, { color: theme.primary }]}>Khôi phục danh sách video</Text></Pressable> : null}
        </> : null}
        <VideoFileList entries={videos.entries} disabled={busy} onRemove={videos.remove} />
        <Pressable accessibilityRole="button" disabled={busy || mediaIds.length + videos.entries.length >= 4} onPress={() => void videos.pick(4 - mediaIds.length - videos.entries.length).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Chưa chọn được video.'))} style={[styles.button, { borderWidth: 1, borderColor: theme.border, borderRadius: Radius.xl }]}><Text style={[styles.buttonText, { color: theme.primary }]}>＋ Thêm video ({mediaIds.length + videos.entries.length}/4)</Text></Pressable>
        {error ? <Text accessibilityRole="alert" style={[styles.helper, { color: theme.destructive }]}>{error}</Text> : null}
      </ScrollView>
      <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
        <Pressable accessibilityRole="button" disabled={busy} onPress={back} style={styles.button}><Text style={[styles.buttonText, { color: theme.mutedForeground }]}>Hủy</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Lưu thay đổi bài viết" accessibilityState={{ disabled: !dirty || busy, busy }} disabled={!dirty || busy} onPress={() => void submit()} style={[styles.save, { backgroundColor: theme.primary, opacity: !dirty || busy ? 0.5 : 1 }]}>
          <Text style={[styles.buttonText, { color: theme.primaryForeground }]}>{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, state: { justifyContent: 'center', alignItems: 'center', padding: Spacing.four, gap: Spacing.three },
  header: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderBottomWidth: 1, paddingHorizontal: Spacing.three },
  back: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.headingBold, fontSize: 19 }, label: { fontFamily: Fonts.sansSemibold, fontSize: 15, lineHeight: 22 },
  helper: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 22 }, counter: { fontFamily: Fonts.sans, fontSize: 12, textAlign: 'right' },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.five },
  notice: { padding: Spacing.three, borderRadius: Radius.xl },
  input: { minHeight: 190, borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.three, fontFamily: Fonts.sans, fontSize: 16, lineHeight: 24, textAlignVertical: 'top' },
  video: { flexDirection: 'row', gap: Spacing.three, borderWidth: 1, padding: Spacing.two, borderRadius: Radius.xl },
  poster: { width: 64, height: 86, borderRadius: Radius.lg }, videoInfo: { flex: 1, minWidth: 0 }, videoActions: { flexDirection: 'row', flexWrap: 'wrap' },
  videoButton: { minWidth: 48, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.two },
  footer: { borderTopWidth: 1, flexDirection: 'row', gap: Spacing.three, padding: Spacing.three },
  button: { minWidth: 64, minHeight: 48, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: Fonts.sansSemibold, fontSize: 15 },
  save: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: Spacing.three, borderRadius: Radius.xl },
});
