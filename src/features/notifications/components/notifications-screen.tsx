import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useMarkAllRead, useMarkRead, useNotifications, useUnreadCount } from '../hooks/use-notifications';
import type { AppNotification } from '../types/notification.schema';
import { NOTIFICATION_TEXT } from '../utils/notification-text';

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

export function NotificationsScreen() {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  const list = useNotifications();
  const unread = useUnreadCount();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  function open(item: AppNotification) {
    if (!item.readAt) markRead.mutate(item.id);
    if (item.type === 'FOLLOW' || !item.postId) router.push({ pathname: '/profile/[id]', params: { id: item.actor.id } });
    else router.push({ pathname: '/posts/[id]', params: { id: item.postId } });
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => (router.canGoBack() ? router.back() : router.replace('/explore'))} hitSlop={10} style={styles.back}>
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={22} tintColor={theme.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: theme.foreground }]}>Thông báo</Text>
        {token && (unread.data ?? 0) > 0 ? (
          <Pressable accessibilityRole="button" disabled={markAll.isPending} onPress={() => markAll.mutate()}>
            <Text style={[styles.action, { color: theme.primary }]}>Đọc tất cả</Text>
          </Pressable>
        ) : null}
      </View>
      {!token ? (
        <View style={styles.state}>
          <Text style={[styles.sub, { color: theme.mutedForeground }]}>Đăng nhập để xem thông báo của bạn.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/explore' } })} style={[styles.login, { backgroundColor: theme.primary }]}>
            <Text style={[styles.loginText, { color: theme.primaryForeground }]}>Đăng nhập</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReached={() => { if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage(); }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={list.isPending ? <ActivityIndicator color={theme.primary} style={styles.state} /> : list.isError ? (
            <Pressable accessibilityRole="button" onPress={() => void list.refetch()} style={styles.state}>
              <Text style={[styles.sub, { color: theme.destructive }]}>Không tải được thông báo. Chạm để thử lại.</Text>
            </Pressable>
          ) : <Text style={[styles.sub, styles.state, { color: theme.mutedForeground }]}>Chưa có thông báo nào.</Text>}
          ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator color={theme.primary} style={styles.state} /> : null}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => open(item)}
              style={[styles.row, { borderBottomColor: theme.border, backgroundColor: item.readAt ? theme.background : theme.secondary }]}
            >
              {item.actor.avatarUrl ? (
                <Image source={{ uri: item.actor.avatarUrl }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarEmpty, { backgroundColor: theme.card }]}>
                  <Text style={[styles.initial, { color: theme.primary }]}>{item.actor.fullName.trim().charAt(0).toLocaleUpperCase('vi') || 'V'}</Text>
                </View>
              )}
              <View style={styles.copy}>
                <Text style={[styles.text, { color: theme.foreground }]}>
                  <Text style={styles.bold}>{item.actor.fullName}</Text> {NOTIFICATION_TEXT[item.type]}
                </Text>
                <Text style={[styles.sub, { color: theme.mutedForeground }]}>{formatTime(item.createdAt)}</Text>
              </View>
              {!item.readAt ? <View accessibilityLabel="Chưa đọc" style={[styles.dot, { backgroundColor: theme.primary }]} /> : null}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, borderBottomWidth: 1 },
  back: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: Fonts.headingBold, fontSize: 18 },
  action: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  list: { width: '100%', maxWidth: 680, alignSelf: 'center' },
  state: { padding: Spacing.five, alignItems: 'center', gap: Spacing.three, textAlign: 'center' },
  login: { minHeight: 44, borderRadius: Radius.xl, paddingHorizontal: Spacing.four, alignItems: 'center', justifyContent: 'center' },
  loginText: { fontFamily: Fonts.sansBold, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: Fonts.headingBold, fontSize: 18 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  text: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20 },
  bold: { fontFamily: Fonts.sansBold },
  sub: { fontFamily: Fonts.sans, fontSize: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
