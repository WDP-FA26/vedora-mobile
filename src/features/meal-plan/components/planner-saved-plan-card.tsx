import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { weekRange } from '../utils/meal-week';

export function PlannerSavedPlanCard({ weekStart, disabled, onPress }: {
  weekStart: string; disabled: boolean; onPress: () => void;
}) {
  const theme = useTheme();
  const dates = weekRange(weekStart);

  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    accessibilityLabel={`Đã lưu thay đổi vào thực đơn, ${dates}. ${disabled ? 'Tuần ngoài khoảng xem hiện tại.' : 'Xem thực đơn.'}`}
    style={({ pressed }) => [styles.card, { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.85 : 1 }]}>
    <View style={[styles.summary, { backgroundColor: theme.secondary }]}>
      <View accessible={false} importantForAccessibility="no-hide-descendants" style={[styles.stickerFrame, { backgroundColor: theme.card }]}>
        <Image source={require('@/assets/branding/tomato-sticker.png')} contentFit="contain" accessible={false} style={styles.sticker} />
        <View style={[styles.check, { backgroundColor: theme.primary, borderColor: theme.secondary }]}>
          <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={12} tintColor={theme.primaryForeground} />
        </View>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.secondaryForeground }]}>Đã lưu thay đổi</Text>
        <Text style={[styles.dates, { color: theme.secondaryForeground }]}>{dates}</Text>
      </View>
    </View>
    <View style={[styles.action, { borderColor: theme.border }]}>
      <Text style={[styles.actionText, { color: disabled ? theme.mutedForeground : theme.primary }]}>
        {disabled ? 'Tuần ngoài khoảng xem hiện tại' : 'Xem thực đơn'}
      </Text>
      {!disabled ? <SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} size={18} tintColor={theme.primary} /> : null}
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { width: '100%', marginTop: Spacing.one, borderWidth: 1, borderRadius: Radius['2xl'], overflow: 'hidden' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two + Spacing.one },
  stickerFrame: { width: 52, height: 56, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  sticker: { width: 48, height: 52, transform: [{ rotate: '-8deg' }] },
  check: { position: 'absolute', bottom: -3, right: -3, width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0, gap: Spacing.one },
  title: { fontFamily: Fonts.sansBold, fontSize: 15, lineHeight: 21 },
  dates: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  action: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  actionText: { flexShrink: 1, fontFamily: Fonts.sansSemibold, fontSize: 14, lineHeight: 20 },
});
