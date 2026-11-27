import { Pressable, Text, View } from 'react-native';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { VideoFile } from '../hooks/use-video-files';

export function VideoFileList({ entries, disabled, onRemove }: { entries: VideoFile[]; disabled: boolean; onRemove: (id: string) => void }) {
  const t = useTheme();
  return <View style={{ gap: 8 }}>{entries.map((entry, index) => <View key={entry.id} style={{ borderRadius: 18, borderWidth: 1, borderColor: entry.error ? t.destructive : t.border, backgroundColor: t.card, padding: 14, gap: 8 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={{ fontSize: 24 }}>🎬</Text><Text numberOfLines={2} style={{ flex: 1, color: t.foreground, fontFamily: Fonts.sansSemibold }}>{index + 1}. {entry.video.fileName}</Text><Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={`Gỡ video ${index + 1}`} onPress={() => onRemove(entry.id)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 }}><Text style={{ color: t.destructive }}>Gỡ</Text></Pressable></View>
    <Text accessibilityLiveRegion="polite" style={{ color: entry.error ? t.destructive : t.mutedForeground }}>{entry.error ?? (entry.uploaded ? 'Đã tải lên' : entry.progress !== null ? `Đang tải ${Math.round(entry.progress)}%` : 'Sẵn sàng tải khi lưu bài')}</Text>
  </View>)}</View>;
}
