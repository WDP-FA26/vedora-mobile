import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useSignOut } from '@/features/auth/hooks/use-auth-actions';
import { PostCard } from '@/features/feed/components/post-card';
import { useDietaryRestrictions } from '@/features/meal-plan/hooks/use-meal-plan';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useMyProfile, useProfilePosts } from '../hooks/use-profile';
import { ProfileAvatar } from './profile-avatar';

const MAX_AVOIDED_CHIPS = 6;

function joinedOn(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(date);
}

function confirmSignOut(onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm('Đăng xuất khỏi Vedora?')) onConfirm();
    return;
  }
  Alert.alert('Đăng xuất?', 'Bạn sẽ cần đăng nhập lại để xem hồ sơ của mình.', [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Đăng xuất', style: 'destructive', onPress: onConfirm },
  ]);
}

function HeaderButton({ label, icon, color, onPress, busy }: { label: string; icon: SymbolViewProps['name']; color: string; onPress: () => void; busy?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={busy} onPress={onPress} hitSlop={6} style={({ pressed }) => [styles.headerButton, { backgroundColor: theme.muted, opacity: pressed ? 0.7 : 1 }]}>
      {busy ? <ActivityIndicator size="small" color={color} /> : <SymbolView name={icon} size={20} tintColor={color} />}
    </Pressable>
  );
}

export function ProfileScreen() {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  const hydrated = useSessionStore((state) => state.isHydrated);
  const profileQuery = useMyProfile(token);
  const profile = profileQuery.data;
  const dietary = useDietaryRestrictions(token);
  const postsQuery = useProfilePosts(profile?.id, token);
  const signOut = useSignOut();
  const [contentTab, setContentTab] = useState<'posts' | 'videos'>('posts');
  const posts = postsQuery.data?.items ?? [];
  const shownPosts = contentTab === 'videos' ? posts.filter((post) => post.media.some((media) => media.type === 'VIDEO')) : posts;
  const avoided = [...(dietary.data?.groups.map((group) => group.name) ?? []), ...(dietary.data?.ingredients.map((ingredient) => ingredient.name) ?? [])];

  if (!hydrated) return <SafeAreaView edges={['top']} style={[styles.screen, styles.center, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.primary} /></SafeAreaView>;
  if (!token) return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.guest}>
        <Image source={require('@/assets/branding/avocado-sticker.png')} style={styles.guestSticker} contentFit="contain" accessibilityLabel="Hình quả bơ Vedora" />
        <Text style={[styles.title, { color: theme.foreground }]}>Hồ sơ của bạn</Text>
        <Text style={[styles.guestDescription, { color: theme.mutedForeground }]}>Đăng nhập để xem bài viết, video và hồ sơ ăn uống của mình.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/me' } })} style={[styles.primaryButton, { backgroundColor: theme.primary }]}><Text style={[styles.buttonText, { color: theme.primaryForeground }]}>Đăng nhập</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/register', params: { returnTo: '/me' } })} style={[styles.outlineButton, { borderColor: theme.border }]}><Text style={[styles.outlineText, { color: theme.primary }]}>Tạo tài khoản</Text></Pressable>
      </View>
    </SafeAreaView>
  );

  const stats = profile ? [
    { label: 'Bài viết', value: profile.postCount, onPress: () => setContentTab('posts') },
    { label: 'Người theo dõi', value: profile.followerCount, onPress: () => router.push({ pathname: '/profile/[id]/followers', params: { id: profile.id } }) },
    { label: 'Đang theo dõi', value: profile.followingCount, onPress: () => router.push({ pathname: '/profile/[id]/following', params: { id: profile.id } }) },
  ] : [];

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: theme.foreground }]}>Hồ sơ</Text>
          {profile ? <Text numberOfLines={1} style={[styles.handle, { color: theme.mutedForeground }]}>@{profile.username}</Text> : null}
        </View>
        <HeaderButton label="Bài viết đã lưu" icon={{ ios: 'bookmark', android: 'bookmark', web: 'bookmark' }} color={theme.foreground} onPress={() => router.push('/bookmarks')} />
        <HeaderButton label="Đăng xuất" icon={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }} color={theme.destructive} busy={signOut.isPending} onPress={() => confirmSignOut(() => signOut.mutate(undefined, { onSuccess: () => router.replace('/') }))} />
      </View>
      {signOut.isError ? <Text accessibilityRole="alert" style={[styles.helper, styles.signOutError, { color: theme.destructive }]}>Đã thoát trên thiết bị, nhưng chưa thể thu hồi phiên trên máy chủ.</Text> : null}

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {profileQuery.isPending && !profile ? <View style={styles.loading}><ActivityIndicator color={theme.primary} /><Text style={[styles.helper, { color: theme.mutedForeground }]}>Đang tải hồ sơ…</Text></View> : null}
        {!profile && profileQuery.isError ? (
          <View style={[styles.card, styles.state, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <Text style={[styles.stateTitle, { color: theme.foreground }]}>Chưa tải được hồ sơ</Text>
            <Text style={[styles.helper, { color: theme.mutedForeground }]}>Kiểm tra kết nối rồi thử lại nhé.</Text>
            <Pressable accessibilityRole="button" onPress={() => void profileQuery.refetch()} style={[styles.outlineButton, { borderColor: theme.border }]}><Text style={[styles.outlineText, { color: theme.primary }]}>Thử lại</Text></Pressable>
          </View>
        ) : null}

        {profile ? <>
          <View style={[styles.card, styles.hero, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.cover, { backgroundColor: theme.secondary }]}>
              {profile.coverUrl ? <Image source={{ uri: profile.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Ảnh bìa hồ sơ" /> : <><View style={[styles.coverCircle, { borderColor: theme.primary }]} /><View style={[styles.coverDot, { backgroundColor: theme.primary }]} /></>}
            </View>
            <View style={styles.identity}>
              <ProfileAvatar profile={profile} size={96} style={styles.avatar} />
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: theme.foreground }]}>{profile.fullName}</Text>
                {profile.isProfessional ? <SymbolView name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }} size={19} tintColor={theme.primary} /> : null}
              </View>
              <Text style={[styles.handle, { color: theme.mutedForeground }]}>@{profile.username}</Text>
              {profile.isProfessional ? <View style={[styles.badge, { backgroundColor: theme.secondary }]}><Text style={[styles.badgeText, { color: theme.secondaryForeground }]}>Chuyên gia đã xác minh</Text></View> : null}
              <Text style={[styles.bio, { color: profile.bio ? theme.foreground : theme.mutedForeground }]}>{profile.bio || 'Thêm lời giới thiệu để mọi người hiểu hơn về bạn.'}</Text>
              <View style={styles.joinRow}>
                <SymbolView name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }} size={15} tintColor={theme.mutedForeground} />
                <Text style={[styles.helper, { color: theme.mutedForeground }]}>Tham gia {joinedOn(profile.createdAt)}</Text>
              </View>
            </View>

            <View style={[styles.stats, { borderColor: theme.border }]}>
              {stats.map((stat, index) => (
                <Pressable key={stat.label} accessibilityRole="button" accessibilityLabel={`${stat.value} ${stat.label}`} onPress={stat.onPress} style={({ pressed }) => [styles.stat, index > 0 && { borderLeftWidth: 1, borderLeftColor: theme.border }, { opacity: pressed ? 0.6 : 1 }]}>
                  <Text style={[styles.statValue, { color: theme.foreground }]}>{stat.value}</Text>
                  <Text numberOfLines={1} style={[styles.statLabel, { color: theme.mutedForeground }]}>{stat.label}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable accessibilityRole="button" onPress={() => router.push('/edit-profile')} style={({ pressed }) => [styles.editButton, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }]}>
              <SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} size={17} tintColor={theme.primaryForeground} />
              <Text style={[styles.buttonText, { color: theme.primaryForeground }]}>Chỉnh sửa hồ sơ</Text>
            </Pressable>
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel="Xem chi tiết hồ sơ ăn uống" onPress={() => router.push('/dietary-profile')} style={({ pressed }) => [styles.card, styles.dietary, { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.85 : 1 }]}>
            <View style={styles.dietaryTop}>
              <View style={[styles.dietaryIcon, { backgroundColor: theme.secondary }]}>
                <Image source={require('@/assets/branding/avocado-sticker.png')} style={styles.dietarySticker} contentFit="contain" />
              </View>
              <View style={styles.dietaryHeading}>
                <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Hồ sơ ăn uống</Text>
                <Text style={[styles.helper, { color: theme.mutedForeground }]}>Món ăn được gợi ý dựa trên lựa chọn này</Text>
              </View>
              <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={18} tintColor={theme.mutedForeground} />
            </View>
            <View style={styles.dietaryLabelRow}>
              <SymbolView name={{ ios: 'checkmark.shield', android: 'verified_user', web: 'verified_user' }} size={16} tintColor={theme.primary} />
              <Text style={[styles.dietaryLabel, { color: theme.foreground }]}>Không ăn</Text>
            </View>
            {dietary.isPending ? <Text style={[styles.helper, { color: theme.mutedForeground }]}>Đang tải…</Text>
              : dietary.isError ? <Text style={[styles.helper, { color: theme.destructive }]}>Chưa tải được</Text>
              : avoided.length ? (
                <View style={styles.chips}>
                  {avoided.slice(0, MAX_AVOIDED_CHIPS).map((name) => <View key={name} style={[styles.chip, { backgroundColor: theme.muted }]}><Text style={[styles.chipText, { color: theme.foreground }]}>{name}</Text></View>)}
                  {avoided.length > MAX_AVOIDED_CHIPS ? <View style={[styles.chip, { backgroundColor: theme.secondary }]}><Text style={[styles.chipText, { color: theme.secondaryForeground }]}>+{avoided.length - MAX_AVOIDED_CHIPS}</Text></View> : null}
                </View>
              ) : <Text style={[styles.helper, { color: theme.mutedForeground }]}>Chưa khai báo</Text>}
          </Pressable>

          <View style={[styles.segment, { backgroundColor: theme.muted }]}>
            {(['posts', 'videos'] as const).map((tab) => {
              const selected = contentTab === tab;
              return (
                <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setContentTab(tab)} style={[styles.segmentItem, selected && [styles.segmentSelected, { backgroundColor: theme.card }]]}>
                  <SymbolView name={tab === 'posts' ? { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' } : { ios: 'play.rectangle', android: 'smart_display', web: 'smart_display' }} size={16} tintColor={selected ? theme.primary : theme.mutedForeground} />
                  <Text style={[styles.segmentText, { color: selected ? theme.primary : theme.mutedForeground }]}>{tab === 'posts' ? `Bài viết · ${profile.postCount}` : 'Video'}</Text>
                </Pressable>
              );
            })}
          </View>

          {postsQuery.isPending && !posts.length ? <View style={styles.loading}><ActivityIndicator color={theme.primary} /><Text style={[styles.helper, { color: theme.mutedForeground }]}>Đang tải bài viết…</Text></View> : null}
          {postsQuery.isError ? <Pressable accessibilityRole="button" onPress={() => void postsQuery.refetch()} style={[styles.card, styles.state, { borderColor: theme.border, backgroundColor: theme.card }]}><Text style={[styles.helper, { color: theme.destructive }]}>Không tải được bài viết. Chạm để thử lại.</Text></Pressable> : null}
          {!postsQuery.isPending && !postsQuery.isError && shownPosts.length === 0 ? (
            <View style={[styles.card, styles.empty, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.secondary }]}><SymbolView name={contentTab === 'posts' ? { ios: 'leaf', android: 'eco', web: 'eco' } : { ios: 'video', android: 'videocam', web: 'videocam' }} size={25} tintColor={theme.primary} /></View>
              <Text style={[styles.stateTitle, { color: theme.foreground }]}>{contentTab === 'posts' ? 'Chưa có bài viết' : 'Chưa có video đã đăng'}</Text>
              <Text style={[styles.helper, styles.centerText, { color: theme.mutedForeground }]}>{contentTab === 'posts' ? 'Bài đăng công khai sẽ hiện ở đây.' : 'Video trong những bài đăng gần đây sẽ hiện ở đây.'}</Text>
            </View>
          ) : null}
          {contentTab === 'videos' && shownPosts.length > 0 ? <Text style={[styles.helper, styles.videoNote, { color: theme.mutedForeground }]}>Video từ những bài viết gần đây của bạn.</Text> : null}
          {shownPosts.map((post) => <PostCard key={post.id} post={post} visible />)}
        </> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  centerText: { textAlign: 'center' },
  header: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three },
  headerText: { flex: 1, minWidth: 0 },
  headerTitle: { fontFamily: Fonts.headingExtraBold, fontSize: 24, lineHeight: 30 },
  headerButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  signOutError: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingBottom: Spacing.five, gap: Spacing.three },
  handle: { fontFamily: Fonts.sans, fontSize: 13 },
  loading: { padding: Spacing.four, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  helper: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  card: { marginHorizontal: Spacing.three, borderWidth: 1, borderRadius: Radius['3xl'] },
  state: { padding: Spacing.four, alignItems: 'center', gap: Spacing.two },
  stateTitle: { fontFamily: Fonts.headingBold, fontSize: 17, textAlign: 'center' },
  hero: { overflow: 'hidden', paddingBottom: Spacing.three },
  cover: { height: 128, overflow: 'hidden' },
  coverCircle: { width: 200, height: 200, borderRadius: 100, borderWidth: 22, position: 'absolute', right: 28, top: 30, opacity: 0.12 },
  coverDot: { width: 22, height: 22, borderRadius: 11, position: 'absolute', left: '22%', top: 34, opacity: 0.2 },
  identity: { alignItems: 'center', paddingHorizontal: Spacing.three },
  avatar: { marginTop: -48 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, marginTop: Spacing.two },
  name: { fontFamily: Fonts.headingExtraBold, fontSize: 22, lineHeight: 30, textAlign: 'center' },
  badge: { marginTop: Spacing.two, borderRadius: 999, paddingHorizontal: Spacing.two + Spacing.one, paddingVertical: Spacing.half },
  badgeText: { fontFamily: Fonts.sansSemibold, fontSize: 12 },
  bio: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21, marginTop: Spacing.two, textAlign: 'center' },
  joinRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, marginTop: Spacing.two },
  stats: { flexDirection: 'row', marginHorizontal: Spacing.three, marginTop: Spacing.three, borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: Spacing.two },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.one },
  statValue: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 24 },
  statLabel: { fontFamily: Fonts.sans, fontSize: 12 },
  editButton: { marginHorizontal: Spacing.three, marginTop: Spacing.three, minHeight: 46, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  sectionTitle: { fontFamily: Fonts.headingBold, fontSize: 16, lineHeight: 22 },
  dietary: { padding: Spacing.three, gap: Spacing.two },
  dietaryTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  dietaryIcon: { width: 48, height: 48, borderRadius: Radius['2xl'], alignItems: 'center', justifyContent: 'center' },
  dietarySticker: { width: 34, height: 38 },
  dietaryHeading: { flex: 1, minWidth: 0 },
  dietaryLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, marginTop: Spacing.one },
  dietaryLabel: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderRadius: 999, paddingHorizontal: Spacing.two + Spacing.one, paddingVertical: Spacing.one },
  chipText: { fontFamily: Fonts.sansMedium, fontSize: 13 },
  segment: { marginHorizontal: Spacing.three, flexDirection: 'row', borderRadius: Radius.xl, padding: Spacing.one },
  segmentItem: { flex: 1, minHeight: 40, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one },
  segmentSelected: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segmentText: { fontFamily: Fonts.sansBold, fontSize: 14 },
  empty: { minHeight: 200, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.two },
  emptyIcon: { width: 52, height: 52, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  videoNote: { paddingHorizontal: Spacing.three },
  guest: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  guestSticker: { width: 112, height: 112 },
  title: { fontFamily: Fonts.headingBold, fontSize: 23 },
  guestDescription: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  primaryButton: { minWidth: 180, minHeight: 48, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: Fonts.sansBold, fontSize: 14 },
  outlineButton: { minHeight: 42, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  outlineText: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
});
