import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { PostCard } from '@/features/feed/components/post-card';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { useAuthorPosts, useMyProfile, useProfile } from '../hooks/use-profile';
import { FollowButton } from './follow-button';

/** Another member's profile: header, follow button, counts and their public posts. */
export function PublicProfileScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useSessionStore((state) => state.accessToken);
  const me = useMyProfile(token);
  const profile = useProfile(id);
  const posts = useAuthorPosts(id);
  const items = (posts.data?.items ?? []).filter((post) => post.status === 'PUBLISHED');
  const notFound = profile.error instanceof ApiError && profile.error.status === 404;

  if (me.data?.id === id) return <Redirect href="/me" />;

  const data = profile.data;
  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => (router.canGoBack() ? router.back() : router.replace('/explore'))} hitSlop={10} style={styles.back}>
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={22} tintColor={theme.foreground} />
        </Pressable>
        <View>
          <Text style={[styles.title, { color: theme.foreground }]}>{data?.fullName ?? 'Hồ sơ'}</Text>
          {data ? <Text style={[styles.handle, { color: theme.mutedForeground }]}>@{data.username}</Text> : null}
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {profile.isPending ? <ActivityIndicator color={theme.primary} style={styles.loading} /> : null}
        {profile.isError ? (
          <View style={styles.state}>
            <Text style={[styles.stateTitle, { color: theme.foreground }]}>{notFound ? 'Không tìm thấy hồ sơ' : 'Chưa tải được hồ sơ'}</Text>
            {!notFound ? (
              <Pressable accessibilityRole="button" onPress={() => void profile.refetch()} style={[styles.outline, { borderColor: theme.border }]}>
                <Text style={[styles.outlineText, { color: theme.primary }]}>Thử lại</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {data ? (
          <>
            <View style={[styles.cover, { backgroundColor: theme.secondary }]}>
              {data.coverUrl ? <Image source={{ uri: data.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Ảnh bìa hồ sơ" /> : null}
            </View>
            <View style={[styles.identity, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
              <View style={styles.avatarRow}>
                {data.avatarUrl ? (
                  <Image source={{ uri: data.avatarUrl }} style={[styles.avatar, { backgroundColor: theme.secondary, borderColor: theme.card }]} contentFit="cover" accessibilityLabel={`Ảnh đại diện của ${data.fullName}`} />
                ) : (
                  <View style={[styles.avatar, styles.avatarEmpty, { backgroundColor: theme.secondary, borderColor: theme.card }]}>
                    <Text style={[styles.avatarLetter, { color: theme.primary }]}>{data.fullName.trim().charAt(0).toLocaleUpperCase('vi') || 'V'}</Text>
                  </View>
                )}
                <FollowButton profileId={data.id} />
              </View>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: theme.foreground }]}>{data.fullName}</Text>
                {data.isProfessional ? <SymbolView name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }} size={19} tintColor={theme.primary} /> : null}
              </View>
              <Text style={[styles.handle, { color: theme.mutedForeground }]}>@{data.username}</Text>
              {data.bio ? <Text style={[styles.bio, { color: theme.foreground }]}>{data.bio}</Text> : null}
              <View style={styles.counts}>
                <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/profile/[id]/following', params: { id: data.id } })}>
                  <Text style={[styles.count, { color: theme.foreground }]}><Text style={styles.countNumber}>{data.followingCount}</Text> Đang theo dõi</Text>
                </Pressable>
                <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/profile/[id]/followers', params: { id: data.id } })}>
                  <Text style={[styles.count, { color: theme.foreground }]}><Text style={styles.countNumber}>{data.followerCount}</Text> Người theo dõi</Text>
                </Pressable>
              </View>
            </View>
            <View style={[styles.tab, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
              <Text style={[styles.tabText, { color: theme.primary }]}>Bài viết  {data.postCount}</Text>
            </View>
            {posts.isPending ? <ActivityIndicator color={theme.primary} style={styles.loading} /> : null}
            {posts.isError ? (
              <Pressable accessibilityRole="button" onPress={() => void posts.refetch()} style={styles.state}>
                <Text style={[styles.count, { color: theme.destructive }]}>Không tải được bài viết. Chạm để thử lại.</Text>
              </Pressable>
            ) : null}
            {!posts.isPending && !posts.isError && items.length === 0 ? (
              <Text style={[styles.empty, { color: theme.mutedForeground }]}>Chưa có bài viết công khai.</Text>
            ) : null}
            {items.map((post) => <PostCard key={post.id} post={post} visible />)}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, borderBottomWidth: 1 },
  back: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.headingBold, fontSize: 18 },
  handle: { fontFamily: Fonts.sans, fontSize: 13 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingBottom: Spacing.five },
  loading: { padding: Spacing.four },
  state: { padding: Spacing.four, alignItems: 'center', gap: Spacing.three },
  stateTitle: { fontFamily: Fonts.headingBold, fontSize: 17, textAlign: 'center' },
  outline: { minHeight: 42, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.four, alignItems: 'center', justifyContent: 'center' },
  outlineText: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
  cover: { height: 138, overflow: 'hidden' },
  identity: { borderBottomWidth: 1, paddingHorizontal: Spacing.three, paddingBottom: Spacing.four },
  avatarRow: { marginTop: -38, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  avatar: { width: 86, height: 86, borderRadius: 43, borderWidth: 4 },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontFamily: Fonts.headingExtraBold, fontSize: 32 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.three },
  name: { fontFamily: Fonts.headingExtraBold, fontSize: 22, lineHeight: 30 },
  bio: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21, marginTop: Spacing.three },
  counts: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three, marginTop: Spacing.three },
  count: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  countNumber: { fontFamily: Fonts.sansBold },
  tab: { minHeight: 52, borderBottomWidth: 1, paddingHorizontal: Spacing.three, justifyContent: 'center' },
  tabText: { fontFamily: Fonts.sansBold, fontSize: 14 },
  empty: { fontFamily: Fonts.sans, fontSize: 14, textAlign: 'center', padding: Spacing.five },
});
