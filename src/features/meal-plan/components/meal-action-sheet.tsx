import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function MealActionSheet({ title, subtitle, onClose, busy, children, footer }: { title: string; subtitle?: string; onClose: () => void; busy?: boolean; children: ReactNode; footer?: ReactNode }) {
  const theme = useTheme();
  return <Modal visible animationType="slide" onRequestClose={() => { if (!busy) onClose(); }}>
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.heading, { borderBottomColor: theme.border }]}><View style={[styles.flex, { gap: 4 }]}><Text style={[styles.kicker, { color: theme.primary }]}>THỰC ĐƠN CỦA BẠN</Text><Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>{title}</Text>{subtitle ? <Text style={[styles.text, { color: theme.mutedForeground }]}>{subtitle}</Text> : null}</View><Pressable accessibilityRole="button" accessibilityLabel="Đóng" accessibilityState={{ disabled: !!busy }} disabled={busy} onPress={onClose} style={[styles.close, { backgroundColor: theme.muted, opacity: busy ? 0.45 : 1 }]}><SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={20} tintColor={theme.foreground} /></Pressable></View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>{children}</ScrollView>{footer ? <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>{footer}</View> : null}</KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
export function ActionButton({ label, onPress, disabled, selected, destructive, primary, icon }: { label: string; onPress: () => void; disabled?: boolean; selected?: boolean; destructive?: boolean; primary?: boolean; icon?: ReactNode }) {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled, selected: !!selected }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, primary && styles.primaryButton, { borderColor: primary || selected ? theme.primary : theme.border, backgroundColor: primary ? theme.primary : selected ? theme.secondary : theme.card, opacity: disabled ? 0.45 : pressed ? 0.7 : 1 }]}>{icon}<Text style={[styles.label, primary && styles.primaryLabel, { color: primary ? theme.primaryForeground : destructive ? theme.destructive : selected ? theme.primary : theme.foreground }]}>{label}</Text></Pressable>;
}
export function ActionText({ children, error }: { children: ReactNode; error?: boolean }) {
  const theme = useTheme();
  return <Text accessibilityLiveRegion={error ? 'polite' : 'none'} style={[styles.text, { color: error ? theme.destructive : theme.mutedForeground }]}>{children}</Text>;
}
export const actionStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'center' },
  group: { gap: Spacing.two },
  input: { minHeight: 48, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.three, fontFamily: Fonts.sans, fontSize: 15 },
  title: { fontFamily: Fonts.sansBold, fontSize: 16 },
});
const styles = StyleSheet.create({
  screen: { flex: 1 }, flex: { flex: 1 },
  heading: { padding: Spacing.four, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth },
  kicker: { fontFamily: Fonts.sansBold, fontSize: 11, letterSpacing: 1.3 },
  close: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: Spacing.four, gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  content: { padding: Spacing.four, paddingBottom: 48, gap: Spacing.four },
  title: { fontFamily: Fonts.sansBold, fontSize: 23 },
  text: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  label: { flexShrink: 1, fontFamily: Fonts.sansBold, fontSize: 14, textAlign: 'center' },
  primaryButton: { minHeight: 52, borderRadius: Radius.xl },
  primaryLabel: { fontSize: 16, lineHeight: 23 },
  button: { flexDirection: 'row', gap: 6, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
});
