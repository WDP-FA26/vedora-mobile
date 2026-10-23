import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useVideoPublishStore, type VideoPublishJob } from '../stores/video-publish-store';

function statusText(job: VideoPublishJob) {
  switch (job.status) {
    case 'uploading': return job.progress === null ? 'Đang chuẩn bị tải video…' : `Đang tải video ${Math.round(job.progress)}%`;
    case 'posting': return 'Đang đăng bài…';
    case 'published': return 'Đã đăng video thành công.';
    case 'processing': return 'Đã nhận video, đang được xử lý. Bài sẽ hiện khi xử lý xong.';
    case 'failed': return job.error ?? 'Chưa thể đăng video.';
  }
}

/** Progress of the video being published in the background, shown on the home feed. */
export function VideoPublishBanner({ onRetry, onDismiss }: { onRetry: () => void; onDismiss: (job: VideoPublishJob) => void }) {
  const theme = useTheme();
  const job = useVideoPublishStore((state) => state.job);
  if (!job) return null;

  const active = job.status === 'uploading' || job.status === 'posting';
  const failed = job.status === 'failed';
  const tint = failed ? theme.destructive : theme.primary;
  const percent = job.status === 'uploading' ? job.progress : 100;

  return (
    <View
      accessibilityRole={failed ? 'alert' : 'progressbar'}
      accessibilityValue={percent === null ? undefined : { min: 0, max: 100, now: Math.round(percent) }}
      style={[styles.banner, { backgroundColor: theme.card, borderColor: failed ? theme.destructive : theme.border }]}
    >
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: failed ? theme.muted : theme.secondary }]}>
          {active ? <ActivityIndicator size="small" color={tint} /> : (
            <SymbolView
              name={failed ? { ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' } : { ios: 'checkmark', android: 'check', web: 'check' }}
              size={18}
              tintColor={tint}
            />
          )}
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={[styles.title, { color: theme.foreground }]}>{job.title}</Text>
          <Text numberOfLines={2} style={[styles.status, { color: failed ? theme.destructive : theme.mutedForeground }]}>{statusText(job)}</Text>
        </View>
        {failed ? (
          <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={6} style={[styles.action, { backgroundColor: theme.primary }]}>
            <Text style={[styles.actionText, { color: theme.primaryForeground }]}>Thử lại</Text>
          </Pressable>
        ) : null}
        {!active ? (
          <Pressable accessibilityRole="button" accessibilityLabel={failed ? 'Bỏ video' : 'Ẩn thông báo'} onPress={() => onDismiss(job)} hitSlop={8} style={styles.close}>
            <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={16} tintColor={theme.mutedForeground} />
          </Pressable>
        ) : null}
      </View>
      {active ? (
        <View style={[styles.track, { backgroundColor: theme.muted }]}>
          <View style={[styles.fill, { backgroundColor: theme.primary, width: `${Math.max(3, percent ?? 0)}%` }]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { marginHorizontal: Spacing.three, marginTop: Spacing.two, borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.three, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
  status: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  action: { minHeight: 34, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: Fonts.sansBold, fontSize: 13 },
  close: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
