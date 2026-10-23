import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';

import { useChangeUsername, useProfileImage, type PickedImage } from '../hooks/use-profile';
import { usernameSchema, type ImageKind, type Profile } from '../types/profile.schema';

const ASPECT: Record<ImageKind, [number, number]> = { AVATAR: [1, 1], COVER: [3, 1] };
const LABEL: Record<ImageKind, string> = { AVATAR: 'ảnh đại diện', COVER: 'ảnh bìa' };

/** Avatar / cover / username controls shown inside the profile editor. */
export function ProfileAccountEditor({ profile }: { profile: Profile }) {
  const theme = useTheme();
  const images = useProfileImage();
  const rename = useChangeUsername();
  const [username, setUsername] = useState(profile.username);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSaved, setUsernameSaved] = useState(false);

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
      {(['AVATAR', 'COVER'] as const).map((kind) => {
        const has = kind === 'AVATAR' ? !!profile.avatarUrl : !!profile.coverUrl;
        return (
          <View key={kind} style={styles.row}>
            <Text style={[styles.label, { color: theme.foreground }]}>{kind === 'AVATAR' ? 'Ảnh đại diện' : 'Ảnh bìa'}</Text>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" disabled={images.pending} onPress={() => void pick(kind)} style={[styles.button, { borderColor: theme.border, opacity: images.pending ? 0.5 : 1 }]}>
                <Text style={[styles.buttonText, { color: theme.primary }]}>{has ? 'Đổi ảnh' : 'Thêm ảnh'}</Text>
              </Pressable>
              {has ? (
                <Pressable accessibilityRole="button" accessibilityLabel={`Xóa ${LABEL[kind]}`} disabled={images.pending} onPress={() => images.remove.mutate(kind)} style={[styles.button, { borderColor: theme.border, opacity: images.pending ? 0.5 : 1 }]}>
                  <Text style={[styles.buttonText, { color: theme.destructive }]}>Xóa</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}
      {images.pending ? <Text style={[styles.hint, { color: theme.mutedForeground }]}>Đang cập nhật ảnh…</Text> : null}
      {images.errorMessage && !images.pending ? <Text accessibilityRole="alert" style={[styles.hint, { color: theme.destructive }]}>{images.errorMessage}</Text> : null}

      <Text style={[styles.label, { color: theme.foreground }]}>Tên đăng nhập</Text>
      <TextInput
        accessibilityLabel="Tên đăng nhập"
        value={username}
        onChangeText={(value) => { setUsername(value); setUsernameSaved(false); }}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={30}
        style={[styles.input, { color: theme.foreground, borderColor: theme.border }]}
      />
      {usernameError ? <Text accessibilityRole="alert" style={[styles.hint, { color: theme.destructive }]}>{usernameError}</Text> : null}
      {usernameSaved ? <Text style={[styles.hint, { color: theme.primary }]}>Đã đổi tên đăng nhập.</Text> : null}
      <Pressable accessibilityRole="button" disabled={rename.isPending} onPress={() => void saveUsername()} style={[styles.button, styles.usernameButton, { borderColor: theme.border, opacity: rename.isPending ? 0.5 : 1 }]}>
        <Text style={[styles.buttonText, { color: theme.primary }]}>{rename.isPending ? 'Đang đổi…' : 'Đổi tên đăng nhập'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  actions: { flexDirection: 'row', gap: Spacing.two },
  label: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  button: { minHeight: 38, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  usernameButton: { alignSelf: 'flex-start' },
  buttonText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  hint: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  input: { minHeight: 44, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, fontFamily: Fonts.sans, fontSize: 14 },
});
