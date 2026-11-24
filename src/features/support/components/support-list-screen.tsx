import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useTickets } from '../hooks/use-support';
import { ticketStatusSchema, type TicketStatus } from '../types/support.schema';
import { supportError } from '../utils/support-error';
import { CATEGORY_LABELS, supportDate } from '../utils/support-state';
import { SupportButton, SupportChip, SupportHero, SupportShell, SupportStatusBadge, SupportText, ui } from './support-ui';

export function SupportListScreen() {
  const token = useSessionStore((state) => state.accessToken);
  if (!token) return <Redirect href={{ pathname: '/login', params: { returnTo: '/support' } }} />;
  return <TicketList key={token} />;
}
function TicketList() {
  const theme = useTheme();
  const [status, setStatus] = useState<TicketStatus>();
  const list = useTickets(status);
  const { refetch } = list;
  useFocusEffect(useCallback(() => { void refetch(); }, [refetch]));
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  return <SupportShell title="Hỗ trợ & khiếu nại" scroll={false}>
    <FlatList data={items} keyExtractor={(ticket) => ticket.id} contentContainerStyle={ui.content} showsVerticalScrollIndicator={false}
      ListHeaderComponent={<View style={ui.section}>
        <SupportHero title="Vedora luôn lắng nghe" description="Cần một chút trợ giúp? Kể cho chúng mình nhé." />
        <SupportButton label="Tạo yêu cầu hỗ trợ" icon={{ ios: 'plus.circle', android: 'add_circle', web: 'add_circle' }} onPress={() => router.push('/support/new')} />
        <SupportText muted small>Với nội dung bị xử lý, bạn có thể gửi khiếu nại ngay trên bài viết hoặc Blog của mình.</SupportText>
        <View style={ui.between}>
          <Text style={[ui.heading, { color: theme.foreground }]}>Yêu cầu của bạn</Text>
          <SupportButton quiet disabled={list.isRefetching} label={list.isRefetching ? 'Đang tải…' : 'Làm mới'} icon={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} onPress={() => void list.refetch()} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <SupportChip selected={!status} label="Tất cả" onPress={() => setStatus(undefined)} />
          {ticketStatusSchema.options.map((value) => <SupportChip key={value} selected={status === value} label={FILTER_LABELS[value]} onPress={() => setStatus(value)} />)}
        </ScrollView>
        {list.isPending ? <ActivityIndicator color={theme.primary} /> : null}
        {list.isError ? <SupportText error>{supportError(list.error)}</SupportText> : null}
      </View>}
      ListEmptyComponent={!list.isPending && !list.isError ? <View style={[ui.card, { borderStyle: 'dashed', borderColor: theme.border }]}>
        <SupportHero compact sticker="carrot" title="Chưa có yêu cầu nào" description="Các trao đổi với Vedora sẽ được lưu tại đây để bạn dễ theo dõi." />
      </View> : undefined}
      renderItem={({ item: ticket }) => <Pressable accessibilityRole="button" accessibilityLabel={`${ticket.code}. ${ticket.subject}. Xem trao đổi`}
        onPress={() => router.push({ pathname: '/support/[id]', params: { id: ticket.id } })}
        style={({ pressed }) => [ui.card, { borderColor: ticket.status === 'WAITING_USER' ? theme.primary : theme.border, backgroundColor: theme.card, opacity: pressed ? 0.75 : 1 }]}>
        <View style={ui.between}>
          <Text style={[styles.code, { color: theme.mutedForeground }]}>{ticket.code}</Text>
          <SupportStatusBadge status={ticket.status} />
        </View>
        <Text style={[ui.heading, { color: theme.foreground }]}>{ticket.subject}</Text>
        <SupportText muted small>{CATEGORY_LABELS[ticket.category]} · {supportDate(ticket.updatedAt)}</SupportText>
        {ticket.autoCloseAt ? <View style={[styles.deadline, { backgroundColor: theme.secondary }]}><SupportText small>Phản hồi trước {supportDate(ticket.autoCloseAt)}</SupportText></View> : null}
        <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
          <Text style={[ui.label, { color: theme.primary }]}>Xem trao đổi</Text>
          <SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} size={17} tintColor={theme.primary} />
        </View>
      </Pressable>}
      ListFooterComponent={list.hasNextPage ? <SupportButton secondary label={list.isFetchingNextPage ? 'Đang tải…' : 'Xem thêm'} disabled={list.isFetchingNextPage} onPress={() => void list.fetchNextPage()} /> : undefined}
    />
  </SupportShell>;
}

const FILTER_LABELS: Record<TicketStatus, string> = { OPEN: 'Đang xử lý', WAITING_USER: 'Cần phản hồi', RESOLVED: 'Đã giải quyết', CLOSED: 'Đã đóng', WITHDRAWN: 'Đã rút', EXPIRED: 'Hết hạn' };
const styles = StyleSheet.create({
  filters: { gap: 8, paddingBottom: 4 }, code: { fontSize: 12, letterSpacing: 0.5 },
  cardFooter: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deadline: { padding: 10, borderRadius: 12 },
});
