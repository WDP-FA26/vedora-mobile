import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';

import { useChangeUsername, useProfileImage, type PickedImage } from '../hooks/use-profile';
import { usernameSchema, type ImageKind, type Profile } from '../types/profile.schema';
import { ProfileAvatar } from './profile-avatar';

const ASPECT: Record<ImageKind, [number, number]> = { AVATAR: [1, 1], COVER: [3, 1] };
const LABEL: Record<ImageKind, string> = { AVATAR: 'ảnh đại diện', COVER: 'ảnh bìa' };

/** Cover and avatar previews with change / remove controls. */
export function ProfileImagesEditor({ profile }: { profile: Profile }) {
  const theme = useTheme();
  const images = useProfileImage();

  async function pick(kind: ImageKind) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: ASPECT[kind],
      quality: 0.9,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const image: PickedImage = {
      uri: asset.uri,
      contentType: asset.mimeType || asset.file?.type || 'image/jpeg',
      sizeBytes: asset.fileSize ?? asset.file?.size ?? 0,
      file: asset.file,
    };
    images.upload.mutate({ kind, image });
  }

  function controls(kind: ImageKind) {
    const has = kind === 'AVATAR' ? !!profile.avatarUrl : !!profile.coverUrl;
    return (
      <View style={styles.controlRow}>
        <Text style={[styles.label, styles.grow, { color: theme.foreground }]}>{kind === 'AVATAR' ? 'Ảnh đại diện' : 'Ảnh bìa'}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`${has ? 'Đổi' : 'Thêm'} ${LABEL[kind]}`} disabled={images.pending} onPress={() => void pick(kind)} style={[styles.chipButton, { backgroundColor: theme.secondary, opacity: images.pending ? 0.5 : 1 }]}>
          <SymbolView name={{ ios: 'camera', android: 'photo_camera', web: 'photo_camera' }} size={15} tintColor={theme.secondaryForeground} />
          <Text style={[styles.buttonText, { color: theme.secondaryForeground }]}>{has ? 'Đổi ảnh' : 'Thêm ảnh'}</Text>
        </Pressable>
        {has ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Xóa ${LABEL[kind]}`} disabled={images.pending} onPress={() => images.remove.mutate(kind)} style={[styles.iconButton, { borderColor: theme.border, opacity: images.pending ? 0.5 : 1 }]}>
            <SymbolView name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={16} tintColor={theme.destructive} />
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View>
        <View style={[styles.cover, { backgroundColor: theme.secondary }]}>
          {profile.coverUrl ? <Image source={{ uri: profile.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Ảnh bìa hiện tại" /> : null}
          {images.pending ? <View style={[StyleSheet.absoluteFill, styles.busy]}><ActivityIndicator color="#fff" /></View> : null}
        </View>
        <ProfileAvatar profile={profile} size={76} style={styles.avatar} />
      </View>
      {controls('AVATAR')}
      {controls('COVER')}
      {images.pending ? <Text style={[styles.hint, { color: theme.mutedForeground }]}>Đang cập nhật ảnh…</Text> : null}
      {images.errorMessage && !images.pending ? <Text accessibilityRole="alert" style={[styles.hint, { color: theme.destructive }]}>{images.errorMessage}</Text> : null}
    </View>
  );
}

/** Username field with its own save action (`PATCH /users/:id`). */
export function UsernameEditor({ profile }: { profile: Profile }) {
  const theme = useTheme();
  const rename = useChangeUsername();
  const [username, setUsername] = useState(profile.username);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSaved, setUsernameSaved] = useState(false);
  const unchanged = username.trim().toLowerCase() === profile.username;

  async function saveUsername() {
    setUsernameSaved(false);
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) {
      setUsernameError(parsed.error.issues[0]?.message ?? 'Tên đăng nhập chưa hợp lệ.');
      return;
    }
    if (parsed.data === profile.username) return;
    setUsernameError('');
    try {
      await rename.mutateAsync({ userId: profile.id, username: parsed.data });
      setUsername(parsed.data);
      setUsernameSaved(true);
    } catch (error) {
      setUsernameError(error instanceof ApiError && error.status === 409
        ? 'Tên đăng nhập này đã được sử dụng.'
        : 'Không đổi được tên đăng nhập. Vui lòng thử lại.');
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.foreground }]}>Tên đăng nhập</Text>
      <View style={[styles.inputRow, { borderColor: usernameError ? theme.destructive : theme.border, backgroundColor: theme.background }]}>
        <Text style={[styles.prefix, { color: theme.mutedForeground }]}>@</Text>
        <TextInput
          accessibilityLabel="Tên đăng nhập"
          value={username}
          onChangeText={(value) => { setUsername(value); setUsernameSaved(false); }}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={30}
          style={[styles.input, { color: theme.foreground }]}
        />
      </View>
      <Text style={[styles.hint, { color: theme.mutedForeground }]}>Chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang.</Text>
      {usernameError ? <Text accessibilityRole="alert" style={[styles.hint, { color: theme.destructive }]}>{usernameError}</Text> : null}
      {usernameSaved ? <Text style={[styles.hint, { color: theme.primary }]}>Đã đổi tên đăng nhập.</Text> : null}
      <Pressable accessibilityRole="button" disabled={rename.isPending || unchanged} onPress={() => void saveUsername()} style={[styles.outlineButton, { borderColor: theme.border, opacity: rename.isPending || unchanged ? 0.5 : 1 }]}>
        <Text style={[styles.buttonText, { color: theme.primary }]}>{rename.isPending ? 'Đang đổi…' : 'Đổi tên đăng nhập'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  grow: { flex: 1 },
  cover: { height: 104, borderRadius: Radius['2xl'], overflow: 'hidden' },
  busy: { backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  avatar: { marginTop: -38, marginLeft: Spacing.three },
  controlRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  chipButton: { minHeight: 36, borderRadius: 999, paddingHorizontal: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  iconButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
  buttonText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  hint: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  inputRow: { minHeight: 46, borderWidth: 1, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three },
  prefix: { fontFamily: Fonts.sansSemibold, fontSize: 15, marginRight: Spacing.half },
  input: { flex: 1, minHeight: 44, fontFamily: Fonts.sans, fontSize: 15 },
  outlineButton: { alignSelf: 'flex-start', minHeight: 40, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
});
