import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { VoiceStatus } from '../services/voice-call';

const STATUS: Record<VoiceStatus, string> = {
  connecting: 'Đang kết nối…', listening: 'Mình đang nghe bạn', speaking: 'Vedora đang nói',
  thinking: 'Đang xử lý yêu cầu…', muted: 'Mic đang tắt', ending: 'Đang chào tạm biệt…',
  ended: 'Cuộc gọi đã kết thúc', error: 'Chưa thể tiếp tục cuộc gọi',
};

type Props = {
  status: VoiceStatus; error: string; reply: string; heard: string; elapsed: number;
  onClose: () => void; onRetry: () => void; onToggleMute: () => void; onInterrupt: () => void;
};

export function VoiceCallControls({ status, error, reply, heard, elapsed, onClose, onRetry, onToggleMute, onInterrupt }: Props) {
  const theme = useTheme();
  const { height, fontScale } = useWindowDimensions();
  const [transcriptExpanded, setTranscriptExpanded] = useState<boolean>();
  const expanded = transcriptExpanded ?? (height >= 740 && fontScale <= 1.2);
  const hasTranscript = !!(heard || reply);
  const finished = status === 'ended' || status === 'error';
  const muted = status === 'muted';
  const connecting = status === 'connecting';
  const canInterrupt = status === 'speaking' || status === 'ending' || muted;
  const hint = finished ? 'Bạn có thể gọi lại khi muốn trò chuyện tiếp.'
    : connecting ? 'Cho phép sử dụng mic khi ứng dụng yêu cầu.'
      : canInterrupt ? 'Chạm “Nói tiếp” để ngắt lời và bật mic.'
        : 'Tối đa 5 phút · Thay đổi được lưu như khi chat';

  return <ScrollView nestedScrollEnabled style={[styles.footer, { maxHeight: height * 0.55, backgroundColor: theme.card, borderColor: theme.border }]} contentContainerStyle={styles.footerContent}>
    <View style={styles.inner}>
      <View style={styles.statusRow}>
        <View style={[styles.statusPill, { backgroundColor: finished ? theme.muted : theme.secondary }]}>
          {connecting ? <ActivityIndicator size="small" color={theme.primary} /> : <SymbolView
            name={status === 'error' ? { ios: 'exclamationmark.circle', android: 'error_outline', web: 'error_outline' }
              : finished ? { ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' }
                : muted ? { ios: 'mic.slash', android: 'mic_off', web: 'mic_off' }
                  : { ios: 'waveform', android: 'graphic_eq', web: 'graphic_eq' }}
            size={19} tintColor={status === 'error' ? theme.destructive : theme.primary} />}
          <Text accessibilityLiveRegion="polite" style={[styles.statusText, { color: status === 'error' ? theme.destructive : theme.foreground }]}>{STATUS[status]}</Text>
        </View>
        <Text accessibilityLabel={`Thời gian cuộc gọi ${Math.floor(elapsed / 60)} phút ${elapsed % 60} giây`} style={[styles.timer, { color: theme.mutedForeground }]}>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</Text>
        {hasTranscript ? <Pressable accessibilityRole="button" accessibilityLabel={expanded ? 'Thu gọn lời thoại' : 'Xem lời thoại'} accessibilityState={{ expanded }}
          onPress={() => setTranscriptExpanded(!expanded)}
          style={({ pressed }) => [styles.transcriptToggle, { backgroundColor: expanded ? theme.secondary : theme.muted, opacity: pressed ? 0.7 : 1 }]}>
          <SymbolView name={expanded ? { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' } : { ios: 'text.bubble', android: 'subtitles', web: 'subtitles' }} size={22} tintColor={theme.primary} />
        </Pressable> : null}
      </View>
      {error || (hasTranscript && expanded) ? <ScrollView style={styles.feedback} contentContainerStyle={styles.feedbackContent} nestedScrollEnabled>
        {error ? <View style={[styles.error, { borderColor: theme.destructive }]}>
          <Text accessibilityRole="alert" style={[styles.message, { color: theme.destructive }]}>{error}</Text>
        </View> : null}
        {hasTranscript && expanded ? <View style={[styles.transcript, { backgroundColor: theme.muted }]}>
          {heard ? <View style={styles.utterance}>
            <Text style={[styles.speaker, { color: theme.mutedForeground }]}>BẠN VỪA NÓI</Text>
            <Text selectable style={[styles.message, { color: theme.foreground }]}>{heard}</Text>
          </View> : null}
          {reply ? <View style={styles.utterance}>
            <Text style={[styles.speaker, { color: theme.primary }]}>VEDORA</Text>
            <Text selectable accessibilityLiveRegion="polite" style={[styles.message, { color: theme.foreground }]}>{reply}</Text>
          </View> : null}
        </View> : null}
      </ScrollView> : null}
      <View style={styles.actions}>
        <View style={styles.action}>
          {finished ? <Pressable accessibilityRole="button" accessibilityLabel="Gọi lại" onPress={onRetry}
            style={({ pressed }) => [styles.roundButton, { backgroundColor: theme.primary, opacity: pressed ? 0.75 : 1 }]}>
            <SymbolView name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} size={25} tintColor={theme.primaryForeground} />
          </Pressable> : <Pressable accessibilityRole="button" accessibilityLabel={muted ? 'Bật mic' : 'Tắt mic'} accessibilityState={{ disabled: connecting, selected: muted }} disabled={connecting} onPress={onToggleMute}
            style={({ pressed }) => [styles.roundButton, { backgroundColor: muted ? theme.muted : theme.secondary, opacity: connecting ? 0.4 : pressed ? 0.7 : 1 }]}>
            <SymbolView name={muted ? { ios: 'mic.slash.fill', android: 'mic_off', web: 'mic_off' } : { ios: 'mic.fill', android: 'mic', web: 'mic' }} size={25} tintColor={theme.primary} />
          </Pressable>}
          <Text style={[styles.actionLabel, { color: theme.foreground }]}>{finished ? 'Gọi lại' : muted ? 'Bật mic' : 'Tắt mic'}</Text>
        </View>
        <View style={styles.action}>
          <Pressable accessibilityRole="button" accessibilityLabel={finished ? 'Đóng cuộc gọi' : 'Kết thúc cuộc gọi'} onPress={onClose}
            style={({ pressed }) => [styles.roundButton, styles.endButton, { backgroundColor: theme.destructive, opacity: pressed ? 0.75 : 1 }]}>
            <SymbolView name={finished ? { ios: 'xmark', android: 'close', web: 'close' } : { ios: 'phone.down.fill', android: 'call_end', web: 'call_end' }} size={27} tintColor="#fffefa" />
          </Pressable>
          <Text style={[styles.actionLabel, { color: theme.foreground }]}>{finished ? 'Đóng' : 'Kết thúc'}</Text>
        </View>
        {!finished ? <View style={styles.action}>
          <Pressable accessibilityRole="button" accessibilityLabel="Ngắt lời trợ lý để nói tiếp" accessibilityState={{ disabled: !canInterrupt }} disabled={!canInterrupt} onPress={onInterrupt}
            style={({ pressed }) => [styles.roundButton, { backgroundColor: theme.secondary, opacity: !canInterrupt ? 0.4 : pressed ? 0.7 : 1 }]}>
            <SymbolView name={{ ios: 'hand.raised.fill', android: 'pan_tool', web: 'pan_tool' }} size={25} tintColor={theme.primary} />
          </Pressable>
          <Text style={[styles.actionLabel, { color: theme.foreground }]}>Nói tiếp</Text>
        </View> : null}
      </View>
      <Text style={[styles.hint, { color: theme.mutedForeground }]}>{hint}</Text>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  footer: { flexGrow: 0, flexShrink: 0, borderWidth: StyleSheet.hairlineWidth, borderBottomWidth: 0, borderTopLeftRadius: Radius['4xl'], borderTopRightRadius: Radius['4xl'] },
  footerContent: { paddingHorizontal: Spacing.three, paddingTop: 12, paddingBottom: Spacing.two },
  inner: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  statusPill: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: 12, paddingVertical: Spacing.two, borderRadius: Radius['2xl'] },
  statusText: { flex: 1, fontFamily: Fonts.sansSemibold, fontSize: 14, lineHeight: 21 },
  timer: { fontFamily: Fonts.mono, fontSize: 12 },
  transcriptToggle: { width: 44, height: 44, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  feedback: { maxHeight: 132, flexGrow: 0 },
  feedbackContent: { gap: Spacing.two },
  error: { borderWidth: 1, borderRadius: Radius.xl, padding: 12 },
  transcript: { borderRadius: Radius['2xl'], padding: 14, gap: 12 },
  utterance: { gap: 4 },
  speaker: { fontFamily: Fonts.sansBold, fontSize: 10, lineHeight: 16, letterSpacing: 1 },
  message: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 22 },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: Spacing.two, paddingTop: 4 },
  action: { flex: 1, maxWidth: 120, alignItems: 'center', gap: Spacing.two },
  roundButton: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  endButton: { width: 64, height: 56 },
  actionLabel: { fontFamily: Fonts.sansSemibold, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  hint: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
