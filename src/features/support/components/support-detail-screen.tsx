import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { useTheme } from '@/hooks/use-theme';
import { ZoomImage } from '@/shared/components/image-viewer';
import { useSessionStore } from '@/shared/stores/session-store';

import { useTicket, useTicketAction } from '../hooks/use-support';
import type { ReplyTicketInput } from '../types/support.schema';
import { supportError } from '../utils/support-error';
import { CATEGORY_LABELS, isTicketActive, supportDate, ticketReplyMode } from '../utils/support-state';
import { SupportMessageForm } from './support-message-form';
import { SupportButton, SupportHero, SupportShell, SupportStatusBadge, SupportText, ui } from './support-ui';

export function SupportDetailScreen() {
  const token = useSessionStore((state) => state.accessToken);
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!token) return <Redirect href={{ pathname: '/login', params: { returnTo: '/support' } }} />;
  if (!z.uuidv4().safeParse(id).success) return <SupportShell title="Yêu cầu hỗ trợ"><SupportText error>Đường dẫn yêu cầu không hợp lệ.</SupportText></SupportShell>;
  return <TicketConversation key={`${token}:${id}`} id={id} />;
}
function TicketConversation({ id }: { id: string }) {
  const theme = useTheme();
  const query = useTicket(id);
  const action = useTicketAction();
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [error, setError] = useState('');
  const withdrawing = useRef(false);
  const { refetch } = query;
  useFocusEffect(useCallback(() => { void refetch(); }, [refetch]));
  const ticket = query.data;
  const mode = ticket ? ticketReplyMode(ticket) : null;
  async function reply(input: ReplyTicketInput) {
    setError('');
    await action.mutateAsync({ kind: 'reply', id, input });
  }
  async function withdraw() {
    if (action.isPending || withdrawing.current) return;
    withdrawing.current = true;
    setError('');
    try { await action.mutateAsync({ kind: 'withdraw', id }); setConfirmWithdraw(false); }
    catch (error) { setError(supportError(error)); }
    finally { withdrawing.current = false; }
  }
  return <SupportShell title={ticket?.code ?? 'Yêu cầu hỗ trợ'}>
    {query.isPending ? <ActivityIndicator color={theme.primary} /> : null}
    {query.isError ? <SupportText error>{supportError(query.error)}</SupportText> : null}
    {ticket ? <>
      <View style={[ui.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <View style={ui.between}>
          <SupportText muted small>{CATEGORY_LABELS[ticket.category]}</SupportText>
          <SupportStatusBadge status={ticket.status} />
        </View>
        <Text accessibilityRole="header" style={[ui.heading, { color: theme.foreground }]}>{ticket.subject}</Text>
        <SupportText muted small>Tạo lúc {supportDate(ticket.createdAt)}</SupportText>
        {ticket.referenceCode ? <SupportText muted small>Mã tham chiếu: {ticket.referenceCode}</SupportText> : null}
        {ticket.autoCloseAt ? <View style={[styles.note, { backgroundColor: theme.secondary }]}><SupportText small>Vedora đang chờ bạn. Phản hồi trước {supportDate(ticket.autoCloseAt)} để yêu cầu không tự hết hạn nhé.</SupportText></View> : null}
        {ticket.resolutionNote ? <View style={[styles.note, { backgroundColor: theme.secondary }]}><SupportText>Kết quả: {ticket.resolutionNote}</SupportText></View> : null}
        {ticket.appeal?.outcome ? <SupportText>{ticket.appeal.outcome === 'APPROVED' ? 'Khiếu nại được chấp nhận.' : 'Khiếu nại không được chấp nhận.'}</SupportText> : null}
      </View>
      {ticket.appeal ? <View style={[ui.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Text style={[ui.label, { color: theme.mutedForeground }]}>NỘI DUNG ĐƯỢC XEM XÉT</Text>
        <SupportText>Nội dung bị xử lý: {ticket.appeal.postSnapshot.title || ticket.appeal.postSnapshot.excerpt || 'Bài viết'}</SupportText>
        {ticket.appeal.postSnapshot.reason ? <SupportText>Lý do: {ticket.appeal.postSnapshot.reason}</SupportText> : null}
        {ticket.post ? <SupportButton secondary label="Mở bài viết" onPress={() => router.push({ pathname: '/posts/[id]', params: { id: ticket.post!.id } })} /> : <SupportText>Bài viết không còn truy cập được. Lịch sử yêu cầu vẫn được giữ.</SupportText>}
      </View> : null}
      <View style={ui.between}>
        <Text accessibilityRole="header" style={[ui.heading, { color: theme.foreground }]}>Cuộc trò chuyện</Text>
        <SupportButton quiet label={query.isRefetching ? 'Đang tải…' : 'Làm mới'} icon={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} disabled={query.isRefetching} onPress={() => void query.refetch()} />
      </View>
      {ticket.messages.filter((message) => !message.isInternal).map((message) => <View key={message.id} style={[ui.card, styles.message, message.senderRole === 'ADMIN' ? styles.fromVedora : styles.fromUser, { borderColor: theme.border, backgroundColor: message.senderRole === 'ADMIN' ? theme.card : theme.secondary }]}>
        <Text style={[ui.label, { color: theme.primary }]}>{message.senderRole === 'ADMIN' ? 'Vedora · Đội ngũ hỗ trợ' : 'Bạn'}</Text>
        {message.body ? <SupportText>{message.body}</SupportText> : null}
        {message.attachments.length ? <View style={ui.row}>{message.attachments.map((image, index) => <ZoomImage key={image.id} source={{ uri: image.url }} contentFit="cover" accessibilityLabel={`Ảnh đính kèm ${index + 1}`} style={styles.attachment} />)}</View> : null}
        <SupportText muted small>{supportDate(message.createdAt)}</SupportText>
      </View>)}
      {mode ? <SupportMessageForm label={mode === 'reopen' ? 'Gửi & mở lại yêu cầu' : 'Gửi phản hồi'} pending={action.isPending} onSend={reply}>
        {mode === 'reopen' && ticket.reopenableUntil ? <SupportText>Bạn có thể mở lại bằng cách phản hồi trước {supportDate(ticket.reopenableUntil)}.</SupportText> : null}
      </SupportMessageForm> : <SupportHero compact sticker="tomato" title="Trao đổi đã khép lại" description="Yêu cầu đã kết thúc. Bạn vẫn có thể xem lại toàn bộ cuộc trò chuyện tại đây." />}
      {error ? <SupportText error>{error}</SupportText> : null}
      {isTicketActive(ticket.status) ? confirmWithdraw ? <View style={[ui.card, { borderColor: theme.destructive }]}>
        <SupportText>Rút yêu cầu này? Vedora sẽ dừng xử lý. Nếu đây là khiếu nại, bài được mở khóa sửa/xóa theo trạng thái hiện tại; số lần rút và thời hạn gửi lại vẫn do hệ thống giới hạn.</SupportText>
        <SupportButton destructive label={action.isPending ? 'Đang rút…' : 'Xác nhận rút yêu cầu'} disabled={action.isPending} onPress={() => void withdraw()} />
        <SupportButton secondary label="Hủy" disabled={action.isPending} onPress={() => setConfirmWithdraw(false)} />
      </View> : <SupportButton quiet destructive label="Rút yêu cầu" disabled={action.isPending} onPress={() => setConfirmWithdraw(true)} /> : null}
    </> : null}
    {query.isError ? <SupportButton secondary label="Thử tải lại" disabled={query.isRefetching} onPress={() => void query.refetch()} /> : null}
    <SupportButton quiet label="Về danh sách yêu cầu" onPress={() => router.push('/support')} />
  </SupportShell>;
}
const styles = StyleSheet.create({
  note: { padding: 12, borderRadius: 14 },
  message: { maxWidth: '94%', gap: 8 },
  fromVedora: { alignSelf: 'flex-start', borderTopLeftRadius: 6 },
  fromUser: { alignSelf: 'flex-end', borderTopRightRadius: 6 },
  attachment: { width: '47%', minWidth: 80, maxWidth: 160, aspectRatio: 1, borderRadius: 12 },
});
