import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useAppealPost, useTicketAction } from '../hooks/use-support';
import { appealReasonSchema, createTicketSchema, MAX_REFERENCE_LENGTH, MAX_SUBJECT_LENGTH, type AppealReason, type ReplyTicketInput, type TicketCategory } from '../types/support.schema';
import { CATEGORY_LABELS, REASON_LABELS, supportDate } from '../utils/support-state';
import { supportError } from '../utils/support-error';
import { SupportMessageForm } from './support-message-form';
import { SupportButton, SupportHero, SupportShell, SupportText, ui } from './support-ui';

export function SupportCreateScreen() {
  const token = useSessionStore((state) => state.accessToken);
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  if (!token) return <Redirect href={{ pathname: '/login', params: { returnTo: '/support' } }} />;
  return <CreateForm key={`${token}:${postId ?? 'general'}`} postId={postId} />;
}
function CreateForm({ postId }: { postId?: string }) {
  const theme = useTheme();
  const action = useTicketAction();
  const [category, setCategory] = useState<TicketCategory>(postId ? 'CONTENT_APPEAL' : 'GENERAL');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [reason, setReason] = useState<AppealReason>('FALSE_POSITIVE');
  const [subject, setSubject] = useState('');
  const [reference, setReference] = useState('');
  const validPostId = z.uuidv4().safeParse(postId).success;
  const post = useAppealPost(postId);
  const appeal = post.data?.appeal;
  async function send(input: ReplyTicketInput) {
    const data = createTicketSchema.parse({
      category, message: input.body ?? '', attachmentIds: input.attachmentIds,
      ...(postId ? { postId, reasonCategory: reason } : { subject, ...(reference.trim() ? { referenceCode: reference.trim() } : {}) }),
    });
    const ticket = await action.mutateAsync({ kind: 'create', input: data });
    router.replace({ pathname: '/support/[id]', params: { id: ticket.id } });
  }
  const fieldStyle = [ui.input, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.background }];
  return <SupportShell title={postId ? 'Khiếu nại nội dung' : 'Tạo yêu cầu hỗ trợ'}>
    <SupportHero compact sticker={postId ? 'tomato' : 'carrot'} title={postId ? 'Cùng xem xét lại nhé' : 'Chúng mình sẵn sàng giúp'} description={postId ? 'Chia sẻ ngữ cảnh để Vedora hiểu rõ nội dung của bạn.' : 'Mô tả một chút để Vedora hỗ trợ bạn đúng việc.'} />
    {postId && (!validPostId || post.isError) ? <SupportText error>{validPostId ? supportError(post.error) : 'Đường dẫn bài viết không hợp lệ.'}</SupportText> : postId && post.isPending ? <ActivityIndicator color={theme.primary} /> : postId && !appeal?.canAppeal ? <>
      <SupportText>Bài hiện không thể tạo khiếu nại mới. Kiểm tra thời hạn và hồ sơ đã gửi.</SupportText>
      {appeal?.activeTicket || appeal?.latestTicket ? <SupportButton label="Xem khiếu nại" onPress={() => router.replace({ pathname: '/support/[id]', params: { id: (appeal.activeTicket ?? appeal.latestTicket)!.id } })} /> : null}
    </> : <>
      {postId ? <>
        <View style={[ui.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[ui.label, { color: theme.mutedForeground }]}>BÀI VIẾT CẦN XEM LẠI</Text>
          <SupportText>{post.data?.blog?.title || post.data?.body || 'Bài viết của bạn'}</SupportText>
          <SupportText muted small>Trong lúc xử lý, bài tạm khóa chỉnh sửa và xóa.{appeal?.deadlineAt ? ` Hạn gửi: ${supportDate(appeal.deadlineAt)}.` : ''}</SupportText>
        </View>
        <View style={[ui.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[ui.heading, { color: theme.foreground }]}>Lý do khiếu nại</Text>
          {appealReasonSchema.options.map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: value === reason, disabled: action.isPending }} disabled={action.isPending} onPress={() => setReason(value)}
            style={[styles.reason, { backgroundColor: value === reason ? theme.secondary : theme.background, borderColor: value === reason ? theme.primary : theme.border }]}>
            <View style={[styles.radio, { borderColor: value === reason ? theme.primary : theme.mutedForeground }]}>{value === reason ? <View style={[styles.radioDot, { backgroundColor: theme.primary }]} /> : null}</View>
            <Text style={[ui.text, { flex: 1, color: theme.foreground }]}>{REASON_LABELS[value]}</Text>
          </Pressable>)}
        </View>
      </> : <>
        <View style={[ui.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[ui.heading, { color: theme.foreground }]}>Thông tin yêu cầu</Text>
          <Text style={[ui.label, { color: theme.foreground }]}>Bạn cần hỗ trợ về</Text>
          <View style={{ gap: 6 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Chủ đề hỗ trợ: ${CATEGORY_LABELS[category]}`} accessibilityState={{ expanded: categoryOpen, disabled: action.isPending }} disabled={action.isPending}
              onPress={() => setCategoryOpen((open) => !open)} style={[...fieldStyle, styles.select, { opacity: action.isPending ? 0.45 : 1 }]}>
              <Text style={[ui.text, { flex: 1, color: theme.foreground }]}>{CATEGORY_LABELS[category]}</Text>
              <SymbolView name={categoryOpen ? { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' } : { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }} size={18} tintColor={theme.mutedForeground} />
            </Pressable>
            {categoryOpen ? <View style={[styles.options, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {(['GENERAL', 'PAYMENT_ISSUE', 'VERIFICATION'] as const).map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: category === value, disabled: action.isPending }} disabled={action.isPending}
                onPress={() => { setCategory(value); setCategoryOpen(false); }} style={({ pressed }) => [styles.option, { backgroundColor: category === value ? theme.secondary : 'transparent', opacity: pressed ? 0.7 : 1 }]}>
                <Text style={[ui.text, { flex: 1, color: category === value ? theme.primary : theme.foreground }]}>{CATEGORY_LABELS[value]}</Text>
                {category === value ? <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={18} tintColor={theme.primary} /> : null}
              </Pressable>)}
            </View> : null}
          </View>
          <Text style={[ui.label, { color: theme.foreground }]}>Tiêu đề <Text style={{ color: theme.destructive }}>*</Text></Text>
          <TextInput accessibilityLabel="Tiêu đề yêu cầu" placeholder="Bạn đang gặp vấn đề gì?" placeholderTextColor={theme.mutedForeground} value={subject} onChangeText={setSubject} maxLength={MAX_SUBJECT_LENGTH} editable={!action.isPending} style={fieldStyle} />
          <Text style={[ui.label, { color: theme.foreground }]}>Mã tham chiếu <Text style={[ui.caption, { color: theme.mutedForeground }]}>(không bắt buộc)</Text></Text>
          <TextInput accessibilityLabel="Mã tham chiếu" placeholder="Ví dụ: mã giao dịch thanh toán" placeholderTextColor={theme.mutedForeground} value={reference} onChangeText={setReference} maxLength={MAX_REFERENCE_LENGTH} editable={!action.isPending} style={fieldStyle} />
        </View>
      </>}
      <SupportMessageForm label={postId ? 'Gửi khiếu nại' : 'Gửi yêu cầu'} title={postId ? 'Giải trình của bạn' : 'Chia sẻ chi tiết'} hint="Mô tả bằng chữ là bắt buộc. Bạn có thể đính kèm ảnh để chúng mình dễ xem xét hơn." pending={action.isPending} onSend={send} />
    </>}
    {postId ? <SupportButton quiet label="Tải lại trạng thái bài" disabled={post.isFetching} onPress={() => void post.refetch()} /> : null}
    <SupportButton quiet label="Xem yêu cầu đã gửi" onPress={() => router.push('/support')} />
  </SupportShell>;
}
const styles = StyleSheet.create({
  select: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  options: { borderWidth: 1, borderRadius: 14, padding: 4, gap: 2 },
  option: { minHeight: 48, padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  reason: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 52, padding: 12, borderWidth: 1, borderRadius: 14 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
});
