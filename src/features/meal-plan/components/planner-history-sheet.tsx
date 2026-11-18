import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, FlatList, Modal, PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { plainText } from '@/features/blogs/utils/markdown';

import { useMealPlanner } from '../hooks/meal-planner-provider';
import { useDeletePlannerThread, usePlannerThreads } from '../hooks/use-meal-plan';
import type { PlannerThreadSummary } from '../types/meal-plan.schema';

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

/** Left drawer of saved conversations with Trợ lý Vedora: tap one to reopen it, or delete it. */
export function PlannerHistorySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const theme = useTheme();
  const planner = useMealPlanner();
  const list = usePlannerThreads(planner.token, open);
  const remove = useDeletePlannerThread();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(width * 0.85, 360);
  const [x] = useState(() => new Animated.Value(-panelWidth));
  // Stays mounted while the close animation runs.
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (!mounted) return;
    Animated.timing(x, { toValue: open ? 0 : -panelWidth, duration: open ? 240 : 200, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      .start(({ finished }) => { if (finished && !open) setMounted(false); });
  }, [open, mounted, panelWidth, x]);

  // Swipe left on the panel to close; mostly-vertical moves stay with the list.
  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, g) => g.dx < -10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderMove: (_event, g) => x.setValue(Math.min(0, g.dx)),
    onPanResponderRelease: (_event, g) => {
      if (g.dx < -panelWidth / 3 || g.vx < -0.5) onClose();
      else Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
    },
    onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start(),
  }), [x, panelWidth, onClose]);

  async function pick(thread: PlannerThreadSummary) {
    if (openingId) return;
    setOpeningId(thread.id);
    try {
      await planner.openThread(thread.id);
      onClose();
    } catch {
      Alert.alert('Chưa mở được cuộc trò chuyện', 'Kiểm tra kết nối rồi thử lại.');
    } finally {
      setOpeningId(null);
    }
  }

  function confirmDelete(thread: PlannerThreadSummary) {
    Alert.alert('Xóa cuộc trò chuyện?', `"${thread.title}" và toàn bộ tin nhắn sẽ bị xóa, không khôi phục được.`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => remove.mutate(thread.id, {
          onSuccess: () => { if (thread.id === planner.threadId) planner.startNewChat(); },
          onError: () => Alert.alert('Chưa xóa được', 'Kiểm tra kết nối rồi thử lại.'),
        }),
      },
    ]);
  }

  return (
    <Modal visible={mounted} transparent statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: x.interpolate({ inputRange: [-panelWidth, 0], outputRange: [0, 1], extrapolate: 'clamp' }) }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Đóng lịch sử" />
        </Animated.View>
        <Animated.View
          {...swipe.panHandlers}
          accessibilityViewIsModal
          style={[styles.panel, { width: panelWidth, backgroundColor: theme.card, borderRightColor: theme.border, transform: [{ translateX: x }] }]}>
          <SafeAreaView edges={['top', 'bottom', 'left']} style={styles.inner}>
            <View style={styles.header}>
              <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>Lịch sử trò chuyện</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} hitSlop={10} style={styles.close}>
                <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={18} tintColor={theme.mutedForeground} />
              </Pressable>
            </View>
            {list.isPending ? (
              <ActivityIndicator color={theme.primary} style={styles.state} />
            ) : list.isError ? (
              <Pressable accessibilityRole="button" onPress={() => void list.refetch()} style={styles.state}>
                <Text style={[styles.sub, { color: theme.mutedForeground }]}>Chưa tải được lịch sử.</Text>
                <Text style={[styles.link, { color: theme.primary }]}>Thử lại</Text>
              </Pressable>
            ) : (
              <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                onEndReached={() => { if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage(); }}
                ListEmptyComponent={<Text style={[styles.sub, styles.state, { color: theme.mutedForeground }]}>Chưa có cuộc trò chuyện nào được lưu.</Text>}
                ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator color={theme.primary} style={styles.state} /> : undefined}
                renderItem={({ item }) => {
                  const current = item.id === planner.threadId;
                  return (
                    <View style={[styles.row, { borderBottomColor: theme.border, backgroundColor: current ? theme.secondary : 'transparent' }]}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${item.title}${current ? ', đang mở' : ''}`}
                        accessibilityState={{ disabled: planner.busy, busy: openingId === item.id }}
                        disabled={planner.busy || !!openingId}
                        onPress={() => void pick(item)}
                        style={({ pressed }) => [styles.copy, { opacity: pressed ? 0.6 : 1 }]}>
                        <Text numberOfLines={1} style={[styles.rowTitle, { color: theme.foreground }]}>{plainText(item.title)}</Text>
                        {item.lastMessagePreview ? (
                          <Text numberOfLines={2} style={[styles.sub, { color: theme.mutedForeground }]}>{plainText(item.lastMessagePreview)}</Text>
                        ) : null}
                        <Text style={[styles.meta, { color: theme.mutedForeground }]}>
                          {current ? 'Đang mở · ' : ''}{formatTime(item.lastMessageAt)}
                        </Text>
                      </Pressable>
                      {openingId === item.id ? <ActivityIndicator color={theme.primary} /> : (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Xóa ${item.title}`}
                          disabled={planner.busy || remove.isPending}
                          onPress={() => confirmDelete(item)}
                          hitSlop={8}
                          style={styles.delete}>
                          <SymbolView name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={18} tintColor={theme.mutedForeground} />
                        </Pressable>
                      )}
                    </View>
                  );
                }}
              />
            )}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.4)' },
  panel: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRightWidth: StyleSheet.hairlineWidth, borderTopRightRadius: Radius['2xl'], borderBottomRightRadius: Radius['2xl'], overflow: 'hidden' },
  inner: { flex: 1, paddingTop: Spacing.two },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  title: { flex: 1, fontFamily: Fonts.headingBold, fontSize: 17 },
  close: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  state: { padding: Spacing.five, alignItems: 'center', gap: Spacing.two, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  copy: { flex: 1, minHeight: 56, paddingVertical: Spacing.three, gap: 2 },
  rowTitle: { fontFamily: Fonts.sansSemibold, fontSize: 15, lineHeight: 20 },
  sub: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
  meta: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 16 },
  link: { fontFamily: Fonts.sansBold, fontSize: 13 },
  delete: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
});
