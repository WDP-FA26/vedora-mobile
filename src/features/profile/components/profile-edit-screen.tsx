import { Redirect, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useMyProfile, useUpdateMyProfile } from '../hooks/use-profile';
import { profileEditSchema, type Profile } from '../types/profile.schema';
import { ProfileImagesEditor, UsernameEditor } from './profile-account-editor';

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View>
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>{title}</Text>
        {description ? <Text style={[styles.hint, { color: theme.mutedForeground }]}>{description}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function BasicInfoForm({ profile, token }: { profile: Profile; token: string }) {
  const theme = useTheme();
  const update = useUpdateMyProfile(token);
  const [fullName, setFullName] = useState(profile.fullName);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const dirty = fullName.trim() !== profile.fullName || bio.trim() !== (profile.bio ?? '');

  async function save() {
    setSaved(false);
    const parsed = profileEditSchema.safeParse({ fullName, bio });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Thông tin chưa hợp lệ.'); return; }
    setError('');
    try {
      await update.mutateAsync(parsed.data);
      setSaved(true);
    } catch {
      setError('Không lưu được hồ sơ. Nội dung vừa nhập vẫn còn để bạn thử lại.');
    }
  }

  return (
    <View style={styles.form}>
      <Text style={[styles.label, { color: theme.foreground }]}>Tên hiển thị</Text>
      <TextInput accessibilityLabel="Tên hiển thị" value={fullName} onChangeText={(value) => { setFullName(value); setSaved(false); }} maxLength={100} style={[styles.input, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.background }]} />
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.foreground }]}>Giới thiệu</Text>
        <Text style={[styles.hint, { color: theme.mutedForeground }]}>{bio.length}/500</Text>
      </View>
      <TextInput accessibilityLabel="Giới thiệu" value={bio} onChangeText={(value) => { setBio(value); setSaved(false); }} maxLength={500} multiline textAlignVertical="top" placeholder="Chia sẻ đôi chút về bạn và thói quen ăn uống…" placeholderTextColor={theme.mutedForeground} style={[styles.input, styles.bioInput, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.background }]} />
      {error ? <Text accessibilityRole="alert" style={[styles.hint, { color: theme.destructive }]}>{error}</Text> : null}
      {saved ? <Text style={[styles.hint, { color: theme.primary }]}>Đã lưu thông tin hồ sơ.</Text> : null}
      <Pressable accessibilityRole="button" disabled={update.isPending || !dirty} onPress={() => void save()} style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: update.isPending || !dirty ? 0.5 : 1 }]}>
        <Text style={[styles.buttonText, { color: theme.primaryForeground }]}>{update.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}</Text>
      </Pressable>
    </View>
  );
}

/** Sub-screen of the Me tab: photos, public info and username, each saved on its own. */
export function ProfileEditScreen() {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  const hydrated = useSessionStore((state) => state.isHydrated);
  const profileQuery = useMyProfile(token);
  const profile = profileQuery.data;

  if (hydrated && !token) return <Redirect href="/me" />;

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => (router.canGoBack() ? router.back() : router.replace('/me'))} hitSlop={10} style={[styles.back, { backgroundColor: theme.muted }]}>
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={20} tintColor={theme.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: theme.foreground }]}>Chỉnh sửa hồ sơ</Text>
      </View>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {!profile && (profileQuery.isPending || !hydrated) ? <ActivityIndicator color={theme.primary} style={styles.loading} /> : null}
          {!profile && profileQuery.isError ? (
            <View style={styles.state}>
              <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Chưa tải được hồ sơ</Text>
              <Pressable accessibilityRole="button" onPress={() => void profileQuery.refetch()} style={[styles.outlineButton, { borderColor: theme.border }]}><Text style={[styles.buttonText, { color: theme.primary }]}>Thử lại</Text></Pressable>
            </View>
          ) : null}
          {profile && token ? <>
            <Section title="Ảnh hồ sơ" description="Ảnh đại diện tỉ lệ 1:1, ảnh bìa tỉ lệ 3:1.">
              <ProfileImagesEditor profile={profile} />
            </Section>
            <Section title="Thông tin công khai" description="Hiển thị trên hồ sơ và bài viết của bạn.">
              <BasicInfoForm key={profile.id} profile={profile} token={token} />
            </Section>
            <Section title="Tài khoản">
              <UsernameEditor profile={profile} />
            </Section>
          </> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three, borderBottomWidth: 1 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.headingBold, fontSize: 18 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three },
  loading: { padding: Spacing.four },
  state: { padding: Spacing.four, alignItems: 'center', gap: Spacing.three },
  section: { borderWidth: 1, borderRadius: Radius['3xl'], padding: Spacing.three, gap: Spacing.three },
  sectionTitle: { fontFamily: Fonts.headingBold, fontSize: 16, lineHeight: 22 },
  form: { gap: Spacing.two },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
  hint: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, fontFamily: Fonts.sans, fontSize: 15 },
  bioInput: { minHeight: 110, paddingTop: Spacing.two + Spacing.one },
  primaryButton: { marginTop: Spacing.one, minHeight: 46, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  outlineButton: { minHeight: 42, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: Fonts.sansBold, fontSize: 14 },
});
