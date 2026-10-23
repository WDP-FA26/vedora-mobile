import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useMyProfile, useProfileList } from '../hooks/use-profile';
import type { ProfileListKind } from '../types/profile.schema';
import { FollowButton } from './follow-button';

const TITLES: Record<ProfileListKind, string> = { followers: 'Người theo dõi', following: 'Đang theo dõi' };

/** Followers / following of a profile, loaded a page at a time. */
export function ProfileListScreen({ kind }: { kind: ProfileListKind }) {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useSessionStore((state) => state.accessToken);
  const me = useMyProfile(token);
  const list = useProfileList(id, kind);
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => (router.canGoBack() ? router.back() : router.replace('/explore'))} hitSlop={10} style={styles.back}>
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={22} tintColor={theme.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: theme.foreground }]}>{TITLES[kind]}</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onEndReached={() => { if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage(); }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={list.isPending ? <ActivityIndicator color={theme.primary} style={styles.state} /> : list.isError ? (
          <Pressable accessibilityRole="button" onPress={() => void list.refetch()} style={styles.state}>
            <Text style={[styles.sub, { color: theme.destructive }]}>Không tải được danh sách. Chạm để thử lại.</Text>
          </Pressable>
        ) : <Text style={[styles.sub, styles.state, { color: theme.mutedForeground }]}>Chưa có ai trong danh sách này.</Text>}
        ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator color={theme.primary} style={styles.state} /> : null}
        renderItem={({ item }) => (
          <View style={[styles.row, { borderBottomColor: theme.border }]}>
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.id } })} style={styles.person}>
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={[styles.avatar, { backgroundColor: theme.secondary }]} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarEmpty, { backgroundColor: theme.secondary }]}>
                  <Text style={[styles.initial, { color: theme.primary }]}>{item.fullName.trim().charAt(0).toLocaleUpperCase('vi') || 'V'}</Text>
                </View>
              )}
              <View style={styles.names}>
                <Text numberOfLines={1} style={[styles.name, { color: theme.foreground }]}>{item.fullName}</Text>
                <Text numberOfLines={1} style={[styles.sub, { color: theme.mutedForeground }]}>@{item.username}</Text>
              </View>
            </Pressable>
            {me.data?.id !== item.id ? <FollowButton profileId={item.id} /> : null}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, borderBottomWidth: 1 },
  back: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.headingBold, fontSize: 18 },
  list: { width: '100%', maxWidth: 680, alignSelf: 'center' },
  state: { padding: Spacing.five, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth },
  person: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minWidth: 0 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: Fonts.headingBold, fontSize: 18 },
  names: { flex: 1, minWidth: 0 },
  name: { fontFamily: Fonts.sansSemibold, fontSize: 15 },
  sub: { fontFamily: Fonts.sans, fontSize: 13 },
});
