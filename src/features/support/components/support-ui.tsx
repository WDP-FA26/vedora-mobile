import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TicketStatus } from '../types/support.schema';
import { STATUS_LABELS } from '../utils/support-state';

export function SupportShell({ title, children, scroll = true }: { title: string; children: ReactNode; scroll?: boolean }) {
  const theme = useTheme();
  return <SafeAreaView style={[ui.screen, { backgroundColor: theme.background }]}>
    <View style={[ui.header, { borderBottomColor: theme.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.canGoBack() ? router.back() : router.replace('/support')} style={[ui.back, { backgroundColor: theme.muted }]}>
        <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={20} tintColor={theme.foreground} />
      </Pressable>
      <Text accessibilityRole="header" style={[ui.title, { color: theme.foreground }]}>{title}</Text>
      <View style={ui.backSpace} />
    </View>
    <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}>{children}</ScrollView> : children}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export function SupportButton({ label, onPress, disabled, secondary, destructive, quiet, icon }: { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean; destructive?: boolean; quiet?: boolean; icon?: SymbolViewProps['name'] }) {
  const theme = useTheme();
  const color = destructive && (secondary || quiet) ? theme.destructive : quiet ? theme.primary : secondary ? theme.foreground : theme.primaryForeground;
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [ui.button, { backgroundColor: quiet ? 'transparent' : secondary ? theme.muted : destructive ? theme.destructive : theme.primary, opacity: disabled ? 0.45 : pressed ? 0.7 : 1 }]}>
    {icon ? <SymbolView name={icon} size={18} tintColor={color} /> : null}
    <Text style={[ui.buttonText, { color }]}>{label}</Text>
  </Pressable>;
}
export function SupportText({ children, error = false, muted = false, small = false }: { children: ReactNode; error?: boolean; muted?: boolean; small?: boolean }) {
  const theme = useTheme();
  return <Text accessibilityRole={error ? 'alert' : undefined} selectable style={[ui.text, small && ui.caption, { color: error ? theme.destructive : muted ? theme.mutedForeground : theme.foreground }]}>{children}</Text>;
}
export function SupportHero({ title, description, sticker = 'avocado', compact = false }: { title: string; description: string; sticker?: 'avocado' | 'tomato' | 'carrot'; compact?: boolean }) {
  const theme = useTheme();
  const source = sticker === 'tomato' ? require('@/assets/branding/tomato-sticker.png') : sticker === 'carrot' ? require('@/assets/branding/carrot-sticker.png') : require('@/assets/branding/avocado-sticker.png');
  return <View style={[ui.hero, { backgroundColor: theme.secondary }]}>
    <View style={[ui.heroArt, compact && ui.heroArtSmall]}>
      <View style={[ui.stickerCircle, { backgroundColor: BrandColors.cream }]} />
      <Image source={source} contentFit="contain" accessible={false} style={[ui.sticker, compact && ui.stickerSmall]} />
    </View>
    <View style={ui.flex}>
      <Text style={[compact ? ui.heading : ui.heroTitle, { color: theme.secondaryForeground }]}>{title}</Text>
      <Text style={[ui.heroDescription, { color: theme.secondaryForeground }]}>{description}</Text>
    </View>
  </View>;
}
export function SupportChip({ label, selected, onPress, disabled }: { label: string; selected: boolean; onPress: () => void; disabled?: boolean }) {
  const theme = useTheme();
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected, disabled: !!disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [ui.chip, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.secondary : theme.card, opacity: disabled ? 0.45 : pressed ? 0.7 : 1 }]}>
    <Text style={[ui.chipText, { color: selected ? theme.primary : theme.mutedForeground }]}>{label}</Text>
  </Pressable>;
}
export function SupportStatusBadge({ status }: { status: TicketStatus }) {
  const theme = useTheme();
  const needsReply = status === 'WAITING_USER';
  const color = needsReply ? theme.foreground : status === 'OPEN' || status === 'RESOLVED' ? theme.primary : theme.mutedForeground;
  return <View style={[ui.badge, { backgroundColor: needsReply ? theme.accent : theme.muted }]}>
    <View style={[ui.statusDot, { backgroundColor: needsReply ? theme.chart3 : color }]} />
    <Text style={[ui.badgeText, { color }]}>{STATUS_LABELS[status]}</Text>
  </View>;
}
export const ui = StyleSheet.create({
  screen: { flex: 1 }, header: { paddingHorizontal: Spacing.three, paddingVertical: 10, flexDirection: 'row', gap: 12, alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, backSpace: { width: 44 },
  title: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 24, flex: 1, textAlign: 'center' },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.three, paddingBottom: 40, gap: Spacing.three },
  card: { padding: 18, borderWidth: 1, borderRadius: Radius['3xl'], gap: 12 },
  text: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 }, heading: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 24 },
  caption: { fontSize: 13, lineHeight: 19 }, label: { fontFamily: Fonts.sansSemibold, fontSize: 14, lineHeight: 20 },
  button: { minHeight: 48, borderRadius: Radius.xl, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: Fonts.sansBold, fontSize: 14, textAlign: 'center', flexShrink: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  between: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  flex: { flex: 1, minWidth: 0, gap: 6 }, section: { gap: 12 },
  input: { borderWidth: 1, borderRadius: Radius.xl, padding: 14, fontFamily: Fonts.sans, fontSize: 16, lineHeight: 23, minHeight: 50 },
  multiline: { minHeight: 148, textAlignVertical: 'top' },
  hero: { borderRadius: Radius['4xl'], paddingHorizontal: 16, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroTitle: { fontFamily: Fonts.headingBold, fontSize: 20, lineHeight: 29 }, heroDescription: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  heroArt: { width: 76, height: 94, alignItems: 'center', justifyContent: 'center' }, heroArtSmall: { width: 54, height: 66 },
  stickerCircle: { position: 'absolute', width: '100%', aspectRatio: 1, borderRadius: 100 },
  sticker: { width: 84, height: 104, transform: [{ rotate: '-8deg' }] }, stickerSmall: { width: 64, height: 76 },
  chip: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 24, borderWidth: 1, justifyContent: 'center' },
  chipText: { fontFamily: Fonts.sansSemibold, fontSize: 13, lineHeight: 20 },
  badge: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, maxWidth: '100%' },
  badgeText: { fontFamily: Fonts.sansSemibold, fontSize: 12, lineHeight: 18, flexShrink: 1 }, statusDot: { width: 6, height: 6, borderRadius: 3 },
});
