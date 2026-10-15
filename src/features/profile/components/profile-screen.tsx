import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useSignOut } from '@/features/auth/hooks/use-auth-actions';
import { PostCard } from '@/features/feed/components/post-card';
import { useDietaryRestrictions } from '@/features/meal-plan/hooks/use-meal-plan';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useMyProfile, useProfilePosts, useUpdateMyProfile } from '../hooks/use-profile';
import { profileEditSchema, type Profile } from '../types/profile.schema';

function joinedOn(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(date);
}

function Avatar({ profile }: { profile: Profile }) {
  const theme = useTheme();
  return profile.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={[styles.avatar, { backgroundColor: theme.secondary, borderColor: theme.card }]} contentFit="cover" accessibilityLabel={`Ảnh đại diện của ${profile.fullName}`} />
    : <View style={[styles.avatar, styles.avatarEmpty, { backgroundColor: theme.secondary, borderColor: theme.card }]}><Text style={[styles.avatarLetter, { color: theme.primary }]}>{profile.fullName.trim().charAt(0).toLocaleUpperCase('vi') || 'V'}</Text></View>;
}

export function ProfileScreen() {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  const hydrated = useSessionStore((state) => state.isHydrated);
  const profileQuery = useMyProfile(token);
  const profile = profileQuery.data;
  const dietary = useDietaryRestrictions(token);
  const postsQuery = useProfilePosts(profile?.id, token);
  const update = useUpdateMyProfile(token);
  const signOut = useSignOut();
  const [contentTab, setContentTab] = useState<'posts' | 'videos'>('posts');
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [editError, setEditError] = useState('');
  const posts = postsQuery.data?.items ?? [];
  const shownPosts = contentTab === 'videos' ? posts.filter((post) => post.media.some((media) => media.type === 'VIDEO')) : posts;
  const avoided = [...(dietary.data?.groups.map((group) => group.name) ?? []), ...(dietary.data?.ingredients.map((ingredient) => ingredient.name) ?? [])];

  function openEditor() {
    if (!profile) return;
    setFullName(profile.fullName);
    setBio(profile.bio ?? '');
    setEditError('');
    setEditing(true);
  }

  async function saveEditor() {
    const parsed = profileEditSchema.safeParse({ fullName, bio });
    if (!parsed.success) { setEditError(parsed.error.issues[0]?.message ?? 'Thông tin chưa hợp lệ.'); return; }
    if (!profile) return;
    if (parsed.data.fullName === profile.fullName && parsed.data.bio === (profile.bio ?? '')) {
      setEditing(false);
      return;
    }
    setEditError('');
    try {
      await update.mutateAsync(parsed.data);
      setEditing(false);
    } catch {
      setEditError('Không lưu được hồ sơ. Nội dung vừa nhập vẫn còn để bạn thử lại.');
    }
  }

  if (!hydrated) return <SafeAreaView edges={['top']} style={[styles.screen, styles.center, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.primary} /></SafeAreaView>;
  if (!token) return <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}><View style={styles.guest}>
    <Image source={require('@/assets/branding/avocado-sticker.png')} style={styles.guestSticker} contentFit="contain" accessibilityLabel="Hình quả bơ Vedora" />
    <Text style={[styles.title, { color: theme.foreground }]}>Hồ sơ của bạn</Text>
    <Text style={[styles.guestDescription, { color: theme.mutedForeground }]}>Đăng nhập để xem bài viết, video và hồ sơ ăn uống của mình.</Text>
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/me' } })} style={[styles.primaryButton, { backgroundColor: theme.primary }]}><Text style={[styles.buttonText, { color: theme.primaryForeground }]}>Đăng nhập</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/register', params: { returnTo: '/me' } })} style={[styles.outlineButton, { borderColor: theme.border }]}><Text style={[styles.outlineText, { color: theme.primary }]}>Tạo tài khoản</Text></Pressable>
  </View></SafeAreaView>;

  return <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={[styles.topBar, { backgroundColor: theme.card, borderColor: theme.border }]}><View><Text style={[styles.topTitle, { color: theme.foreground }]}>Hồ sơ</Text>{profile ? <Text style={[styles.handle, { color: theme.mutedForeground }]}>@{profile.username}</Text> : null}</View></View>
      {profileQuery.isPending && !profile ? <View style={styles.loading}><ActivityIndicator color={theme.primary} /><Text style={[styles.helper, { color: theme.mutedForeground }]}>Đang tải hồ sơ…</Text></View> : null}
      {!profile && profileQuery.isError ? <View style={[styles.state, { borderColor: theme.border, backgroundColor: theme.card }]}><Text style={[styles.stateTitle, { color: theme.foreground }]}>Chưa tải được hồ sơ</Text><Text style={[styles.helper, { color: theme.mutedForeground }]}>Kiểm tra kết nối rồi thử lại nhé.</Text><Pressable accessibilityRole="button" onPress={() => void profileQuery.refetch()} style={[styles.outlineButton, { borderColor: theme.border }]}><Text style={[styles.outlineText, { color: theme.primary }]}>Thử lại</Text></Pressable></View> : null}
      {profile ? <>
        <View style={[styles.cover, { backgroundColor: theme.secondary }]}>
          {profile.coverUrl ? <Image source={{ uri: profile.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Ảnh bìa hồ sơ" /> : <><View style={[styles.coverCircle, { borderColor: theme.primary }]} /><View style={[styles.coverDot, { backgroundColor: theme.primary }]} /></>}
        </View>
        <View style={[styles.identity, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View style={styles.avatarRow}><Avatar profile={profile} /><Pressable accessibilityRole="button" onPress={openEditor} style={[styles.editButton, { borderColor: theme.border }]}><Text style={[styles.editButtonText, { color: theme.primary }]}>Chỉnh sửa hồ sơ</Text></Pressable></View>
          <View style={styles.nameRow}><Text style={[styles.name, { color: theme.foreground }]}>{profile.fullName}</Text>{profile.isProfessional ? <SymbolView name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }} size={19} tintColor={theme.primary} /> : null}</View>
          <Text style={[styles.handle, { color: theme.mutedForeground }]}>@{profile.username}</Text>
          <Text style={[styles.bio, { color: profile.bio ? theme.foreground : theme.mutedForeground }]}>{profile.bio || 'Thêm lời giới thiệu để mọi người hiểu hơn về bạn.'}</Text>
          <View style={styles.joinRow}><SymbolView name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }} size={16} tintColor={theme.mutedForeground} /><Text style={[styles.helper, { color: theme.mutedForeground }]}>Tham gia {joinedOn(profile.createdAt)}</Text></View>
          <View style={styles.counts}><Text style={[styles.helper, { color: theme.foreground }]}><Text style={styles.countNumber}>{profile.followingCount}</Text> Đang theo dõi</Text><Text style={[styles.helper, { color: theme.foreground }]}><Text style={styles.countNumber}>{profile.followerCount}</Text> Người theo dõi</Text></View>
          {profile.isProfessional ? <View style={styles.professional}><SymbolView name={{ ios: 'checkmark.seal', android: 'verified', web: 'verified' }} size={17} tintColor={theme.primary} /><Text style={[styles.helper, { color: theme.primary }]}>Tài khoản chuyên gia đã xác minh</Text></View> : null}
        </View>

        {editing ? <View style={[styles.editCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Chỉnh sửa hồ sơ</Text>
          <Text style={[styles.fieldLabel, { color: theme.foreground }]}>Tên hiển thị</Text><TextInput accessibilityLabel="Tên hiển thị" value={fullName} onChangeText={setFullName} maxLength={100} style={[styles.input, { color: theme.foreground, borderColor: theme.border }]} />
          <Text style={[styles.fieldLabel, { color: theme.foreground }]}>Giới thiệu</Text><TextInput accessibilityLabel="Giới thiệu" value={bio} onChangeText={setBio} maxLength={500} multiline textAlignVertical="top" style={[styles.input, styles.bioInput, { color: theme.foreground, borderColor: theme.border }]} />
          <Text style={[styles.helper, { color: theme.mutedForeground }]}>{bio.length}/500 ký tự</Text>
          {editError ? <Text accessibilityRole="alert" style={[styles.helper, { color: theme.destructive }]}>{editError}</Text> : null}
          <View style={styles.editActions}><Pressable accessibilityRole="button" disabled={update.isPending} onPress={() => setEditing(false)} style={[styles.outlineButton, { borderColor: theme.border }]}><Text style={[styles.outlineText, { color: theme.foreground }]}>Hủy</Text></Pressable><Pressable accessibilityRole="button" disabled={update.isPending} onPress={() => void saveEditor()} style={[styles.smallPrimary, { backgroundColor: theme.primary, opacity: update.isPending ? 0.6 : 1 }]}><Text style={[styles.buttonText, { color: theme.primaryForeground }]}>{update.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}</Text></Pressable></View>
        </View> : null}

        <Pressable accessibilityRole="button" accessibilityLabel="Xem hồ sơ ăn uống" onPress={() => router.push('/dietary-profile')} style={[styles.dietaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.dietaryTop}><Image source={require('@/assets/branding/avocado-sticker.png')} style={styles.dietarySticker} contentFit="contain" /><View style={styles.flex}><Text style={[styles.sectionTitle, { color: theme.foreground }]}>Hồ sơ ăn uống</Text><Text style={[styles.helper, { color: theme.mutedForeground }]}>Thông tin giúp Vedora gợi ý món phù hợp</Text></View><SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} size={18} tintColor={theme.primary} /></View>
          {dietary.isPending ? <Text style={[styles.helper, { color: theme.mutedForeground }]}>Đang tải thực phẩm cần tránh…</Text> : dietary.isError ? <Text style={[styles.helper, { color: theme.destructive }]}>Chưa tải được thông tin ăn uống. Chạm để thử lại.</Text> : <View style={[styles.avoidSummary, { backgroundColor: theme.secondary }]}><Text style={[styles.avoidLabel, { color: theme.primary }]}>THỰC PHẨM CẦN TRÁNH</Text><Text numberOfLines={2} style={[styles.helper, { color: theme.foreground }]}>{avoided.length ? avoided.join(', ') : 'Chưa khai báo'}</Text></View>}
        </Pressable>

        <View style={[styles.tabBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {(['posts', 'videos'] as const).map((tab) => <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: contentTab === tab }} onPress={() => setContentTab(tab)} style={[styles.tab, { borderBottomColor: contentTab === tab ? theme.primary : 'transparent' }]}><Text style={[styles.tabText, { color: contentTab === tab ? theme.primary : theme.mutedForeground }]}>{tab === 'posts' ? `Bài viết  ${profile.postCount}` : 'Video của tôi'}</Text></Pressable>)}
        </View>
        {postsQuery.isPending && !posts.length ? <View style={styles.loading}><ActivityIndicator color={theme.primary} /><Text style={[styles.helper, { color: theme.mutedForeground }]}>Đang tải bài viết…</Text></View> : null}
        {postsQuery.isError ? <Pressable accessibilityRole="button" onPress={() => void postsQuery.refetch()} style={[styles.state, { borderColor: theme.border, backgroundColor: theme.card }]}><Text style={[styles.helper, { color: theme.destructive }]}>Không tải được bài viết. Chạm để thử lại.</Text></Pressable> : null}
        {!postsQuery.isPending && !postsQuery.isError && shownPosts.length === 0 ? <View style={[styles.empty, { backgroundColor: theme.card }]}><View style={[styles.emptyIcon, { backgroundColor: theme.muted }]}><SymbolView name={contentTab === 'posts' ? { ios: 'leaf', android: 'eco', web: 'eco' } : { ios: 'video', android: 'videocam', web: 'videocam' }} size={25} tintColor={theme.primary} /></View><Text style={[styles.stateTitle, { color: theme.foreground }]}>{contentTab === 'posts' ? 'Chưa có bài viết' : 'Chưa có video đã đăng'}</Text><Text style={[styles.helper, { color: theme.mutedForeground }]}>{contentTab === 'posts' ? 'Bài đăng công khai sẽ hiện ở đây.' : 'Video trong những bài đăng gần đây sẽ hiện ở đây.'}</Text></View> : null}
        {contentTab === 'videos' && shownPosts.length > 0 ? <Text style={[styles.helper, styles.videoNote, { color: theme.mutedForeground }]}>Video từ những bài viết gần đây của bạn.</Text> : null}
        {shownPosts.map((post) => <PostCard key={post.id} post={post} visible />)}
        <Pressable accessibilityRole="button" disabled={signOut.isPending} onPress={() => signOut.mutate(undefined, { onSuccess: () => router.replace('/') })} style={[styles.signOut, { borderColor: theme.border }]}><SymbolView name={{ ios: 'arrow.right.square', android: 'logout', web: 'logout' }} size={20} tintColor={theme.destructive} /><Text style={[styles.signOutText, { color: theme.destructive }]}>{signOut.isPending ? 'Đang đăng xuất…' : 'Đăng xuất'}</Text></Pressable>
        {signOut.isError ? <Text accessibilityRole="alert" style={[styles.helper, { color: theme.destructive }]}>Đã thoát trên thiết bị, nhưng chưa thể thu hồi phiên trên máy chủ.</Text> : null}
      </> : null}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, flex: { flex: 1 }, center: { alignItems: 'center', justifyContent: 'center' }, content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingBottom: Spacing.five }, topBar: { minHeight: 56, borderBottomWidth: 1, justifyContent: 'center', paddingHorizontal: Spacing.three }, topTitle: { fontFamily: Fonts.headingBold, fontSize: 18 }, handle: { fontFamily: Fonts.sans, fontSize: 13 }, loading: { padding: Spacing.four, flexDirection: 'row', alignItems: 'center', gap: Spacing.two }, helper: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 }, state: { borderWidth: 1, borderRadius: Radius['2xl'], margin: Spacing.three, padding: Spacing.four, alignItems: 'center', gap: Spacing.two }, stateTitle: { fontFamily: Fonts.headingBold, fontSize: 18, textAlign: 'center' },
  cover: { height: 138, overflow: 'hidden' }, coverCircle: { width: 200, height: 200, borderRadius: 100, borderWidth: 22, position: 'absolute', right: 28, top: 42, opacity: 0.12 }, coverDot: { width: 22, height: 22, borderRadius: 11, position: 'absolute', left: '42%', top: 40, opacity: 0.2 }, identity: { borderBottomWidth: 1, paddingHorizontal: Spacing.three, paddingBottom: Spacing.four }, avatarRow: { marginTop: -38, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, avatar: { width: 86, height: 86, borderRadius: 43, borderWidth: 4 }, avatarEmpty: { alignItems: 'center', justifyContent: 'center' }, avatarLetter: { fontFamily: Fonts.headingExtraBold, fontSize: 32 }, editButton: { marginBottom: Spacing.two, minHeight: 38, borderRadius: 19, borderWidth: 1, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' }, editButtonText: { fontFamily: Fonts.sansBold, fontSize: 13 }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.three }, name: { fontFamily: Fonts.headingExtraBold, fontSize: 22, lineHeight: 30 }, bio: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21, marginTop: Spacing.three }, joinRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.three }, counts: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three, marginTop: Spacing.three }, countNumber: { fontFamily: Fonts.sansBold }, professional: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.three },
  editCard: { margin: Spacing.three, borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.three, gap: Spacing.two }, sectionTitle: { fontFamily: Fonts.headingBold, fontSize: 16, lineHeight: 23 }, fieldLabel: { fontFamily: Fonts.sansSemibold, fontSize: 13 }, input: { minHeight: 44, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, fontFamily: Fonts.sans, fontSize: 14 }, bioInput: { minHeight: 100, paddingTop: Spacing.two }, editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two }, smallPrimary: { minHeight: 42, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  dietaryCard: { margin: Spacing.three, borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.three, gap: Spacing.two }, dietaryTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two }, dietarySticker: { width: 52, height: 60 }, avoidSummary: { borderRadius: Radius.xl, padding: Spacing.three, gap: Spacing.one }, avoidLabel: { fontFamily: Fonts.sansBold, fontSize: 10, letterSpacing: 1 }, tabBar: { flexDirection: 'row', borderTopWidth: 5, borderBottomWidth: 1, paddingHorizontal: Spacing.three, gap: Spacing.four }, tab: { minHeight: 52, borderBottomWidth: 2, justifyContent: 'center' }, tabText: { fontFamily: Fonts.sansBold, fontSize: 14 }, empty: { minHeight: 210, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.two }, emptyIcon: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, videoNote: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three }, signOut: { margin: Spacing.three, minHeight: 48, borderWidth: 1, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two }, signOutText: { fontFamily: Fonts.sansBold, fontSize: 14 },
  guest: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.three }, guestSticker: { width: 112, height: 112 }, title: { fontFamily: Fonts.headingBold, fontSize: 23 }, guestDescription: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21, textAlign: 'center' }, primaryButton: { minWidth: 180, minHeight: 48, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' }, buttonText: { fontFamily: Fonts.sansBold, fontSize: 14 }, outlineButton: { minHeight: 42, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' }, outlineText: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
});
