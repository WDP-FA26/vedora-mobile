import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { ZoomImage } from '@/shared/components/image-viewer';

import { MAX_ATTACHMENTS, MAX_ATTACHMENT_MB } from '../types/support.schema';
import { SupportButton, SupportText, ui } from './support-ui';

export type PendingAttachment = { id: string; uri: string };
export function SupportAttachments({ images, busy, onAdd, onRemove }: { images: PendingAttachment[]; busy: boolean; onAdd: () => void; onRemove: (id: string) => void }) {
  const theme = useTheme();
  return <View style={{ gap: 8 }}>
    <Text style={[ui.label, { color: theme.foreground }]}>Ảnh đính kèm · {images.length}/{MAX_ATTACHMENTS}</Text>
    <SupportText muted small>JPG, PNG, WebP · Tối đa {MAX_ATTACHMENT_MB} MB/ảnh</SupportText>
    <View style={styles.grid}>{images.map((image, index) => <View key={image.id} style={styles.item}>
      <ZoomImage source={{ uri: image.uri }} style={[styles.image, { backgroundColor: theme.muted }]} contentFit="cover" accessibilityLabel={`Ảnh đính kèm ${index + 1}`} />
      <SupportButton quiet destructive disabled={busy} label={`Gỡ ảnh ${index + 1}`} onPress={() => onRemove(image.id)} />
    </View>)}
      {images.length < MAX_ATTACHMENTS ? <Pressable accessibilityRole="button" accessibilityLabel="Thêm ảnh đính kèm" accessibilityState={{ disabled: busy }} disabled={busy} onPress={onAdd}
        style={({ pressed }) => [styles.upload, { backgroundColor: theme.background, borderColor: theme.border, opacity: busy ? 0.45 : pressed ? 0.7 : 1 }]}>
        <SymbolView name={{ ios: 'photo.badge.plus', android: 'add_photo_alternate', web: 'add_photo_alternate' }} size={26} tintColor={theme.primary} />
        <Text style={[ui.label, { color: theme.primary, textAlign: 'center' }]}>{busy ? 'Đang xử lý…' : 'Thêm ảnh'}</Text>
      </Pressable> : null}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  item: { width: '47%', gap: 2 }, image: { width: '100%', aspectRatio: 1.2, borderRadius: 14 },
  upload: { width: '47%', minHeight: 100, borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, padding: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
});
