import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Fonts } from '@/constants/theme';
import { MAX_POST_BODY_LENGTH, MAX_POST_BODY_WORDS, postWordCount } from '@/features/posts/types/post-edit.schema';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';
import { usePostComposer } from '../hooks/use-post-composer';
import { getDraft } from '../services/compose.service';
import type { PostDraft } from '../types/compose.schema';
import { VideoFileList } from './video-file-list';

export function PostComposeScreen() {
  const { draftId } = useLocalSearchParams<{ draftId?: string }>();
  const token = useSessionStore((state) => state.accessToken);
  const valid = !draftId || z.uuidv4().safeParse(draftId).success;
  const query = useQuery({ queryKey: ['post-drafts', draftId], queryFn: ({ signal }) => getDraft(draftId!, signal), enabled: !!draftId && valid && !!token });
  const t = useTheme();
  if (!token || !valid || (draftId && !query.data)) return <SafeAreaView style={{ flex: 1, padding: 24, gap: 16, backgroundColor: t.background }}>
    {draftId && valid && token && query.isPending ? <ActivityIndicator color={t.primary} /> : <Text style={{ color: t.foreground }}>{!token ? 'Hãy đăng nhập để viết bài.' : 'Chưa mở được bản nháp.'}</Text>}
    <Pressable accessibilityRole="button" onPress={() => !token ? router.push('/login') : void query.refetch()} style={{ padding: 14 }}><Text style={{ color: t.primary }}>{!token ? 'Đăng nhập' : 'Thử lại'}</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ padding: 14 }}><Text style={{ color: t.primary }}>Quay lại</Text></Pressable>
  </SafeAreaView>;
  if (query.data && query.data.kind !== 'POST') return <SafeAreaView><Text>Hãy mở bản nháp video trong Tạo nội dung.</Text><Pressable onPress={() => router.back()}><Text>Quay lại</Text></Pressable></SafeAreaView>;
  return <PostComposer key={draftId ?? 'new'} initial={query.data ?? null} />;
}

function PostComposer({ initial }: { initial: PostDraft | null }) {
  const t = useTheme();
  const form = usePostComposer(initial);
  const [leaving, setLeaving] = useState(false);
  const busy = form.busy || form.files.picking;
  const disablePrevention = usePreventRemove(!leaving && (form.dirty || busy), ({ repeat }) => {
    if (busy) return;
    const leave = () => { setLeaving(true); repeat(); };
    if (Platform.OS === 'web') { if (window.confirm('Rời trang và bỏ phần chưa lưu? Chọn Hủy để lưu nháp trước.')) leave(); }
    else Alert.alert('Bạn chưa lưu bản nháp', 'Lưu nháp để tiếp tục viết sau, hoặc bỏ thay đổi.', [{ text: 'Viết tiếp', style: 'cancel' }, { text: 'Lưu nháp', onPress: () => void form.persist(false) }, { text: 'Bỏ thay đổi', style: 'destructive', onPress: leave }]);
  });
  async function publish() {
    const result = await form.persist(true);
    if (result) { setLeaving(true); disablePrevention(); router.replace({ pathname: '/posts/[id]', params: { id: result.id } }); }
  }
  return <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderColor: t.border }}><Pressable accessibilityRole="button" disabled={busy} onPress={() => router.back()} style={{ minHeight: 52, justifyContent: 'center', paddingRight: 20 }}><Text style={{ color: t.primary }}>‹ Quay lại</Text></Pressable><Text style={{ flex: 1, fontFamily: Fonts.headingBold, fontSize: 20, color: t.foreground }}>{initial ? 'Sửa bản nháp' : 'Chia sẻ bài viết'}</Text></View>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 16, width: '100%', maxWidth: 680, alignSelf: 'center' }}>
      <View style={{ padding: 18, borderRadius: 22, backgroundColor: t.secondary, gap: 8 }}><Text style={{ fontSize: 30 }}>🌱 ✍️</Text><Text style={{ color: t.foreground, fontFamily: Fonts.headingBold, fontSize: 22 }}>Một câu chuyện từ bếp của bạn</Text><Text style={{ color: t.mutedForeground }}>Viết bài chữ, đính kèm tối đa 4 video hoặc lưu nháp để đăng sau.</Text></View>
      <TextInput accessibilityLabel="Nội dung bài viết mới" value={form.body} onChangeText={form.setBody} editable={!busy} multiline maxLength={MAX_POST_BODY_LENGTH} placeholder="Hôm nay bạn muốn chia sẻ điều gì?" placeholderTextColor={t.mutedForeground} style={{ minHeight: 180, fontFamily: Fonts.sans, color: t.foreground, backgroundColor: t.card, borderRadius: 20, borderWidth: 1, borderColor: t.border, padding: 16, textAlignVertical: 'top', fontSize: 16, lineHeight: 25 }} />
      <Text style={{ color: postWordCount(form.body) > MAX_POST_BODY_WORDS ? t.destructive : t.mutedForeground }}>{form.body.length}/{MAX_POST_BODY_LENGTH} ký tự · {postWordCount(form.body)}/{MAX_POST_BODY_WORDS} từ</Text>
      {form.kept.map((media, i) => <View key={media.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, backgroundColor: t.card }}><Text style={{ flex: 1, color: media.status === 'FAILED' ? t.destructive : t.foreground }}>🎬 Video {i + 1} · {media.status === 'FAILED' ? 'Lỗi xử lý — hãy gỡ và chọn lại' : media.status === 'READY' ? 'Sẵn sàng' : 'Đang xử lý'}</Text><Pressable accessibilityRole="button" disabled={busy} onPress={() => form.removeMedia(media.id)} style={{ padding: 12 }}><Text style={{ color: t.destructive }}>Gỡ</Text></Pressable></View>)}
      <VideoFileList entries={form.files.entries} disabled={busy} onRemove={form.files.remove} />
      <Pressable accessibilityRole="button" disabled={busy || form.kept.length + form.files.entries.length >= 4} onPress={() => void form.files.pick(4 - form.kept.length - form.files.entries.length).catch((error: unknown) => form.setError(error instanceof Error ? error.message : 'Chưa chọn được video.'))} style={{ padding: 16, borderRadius: 18, borderWidth: 1, borderColor: t.border }}><Text style={{ color: t.primary, fontFamily: Fonts.sansBold }}>＋ Thêm video ({form.kept.length + form.files.entries.length}/4)</Text></Pressable>
      {form.error || form.notice ? <Text accessibilityRole={form.error ? 'alert' : undefined} style={{ color: form.error ? t.destructive : t.primary }}>{form.error || form.notice}</Text> : null}
    </ScrollView>
    <View style={{ flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderColor: t.border }}>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void form.persist(false)} style={{ flex: 1, minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 16, backgroundColor: t.secondary }}><Text style={{ color: t.primary, fontFamily: Fonts.sansBold }}>{busy ? 'Đang lưu…' : 'Lưu nháp'}</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void publish()} style={{ flex: 1, minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 16, backgroundColor: t.primary, opacity: busy ? 0.5 : 1 }}><Text style={{ color: t.primaryForeground, fontFamily: Fonts.sansBold }}>Đăng bài</Text></Pressable>
    </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
