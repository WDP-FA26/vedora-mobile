import type { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function AuthScreen({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          <View style={styles.brandLogoFrame}>
            <Image source={require('@/assets/branding/logo.png')} style={styles.brandLogo} resizeMode="contain" accessibilityLabel="Vedora" />
          </View>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.foreground }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>{subtitle}</Text>
            <View style={styles.form}>{children}</View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthField({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.foreground }]}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        style={[styles.input, { color: theme.foreground, borderColor: error ? theme.destructive : theme.input, backgroundColor: theme.background }]}
        placeholderTextColor={theme.mutedForeground}
      />
      {error ? <Text style={[styles.error, { color: theme.destructive }]}>{error}</Text> : null}
    </View>
  );
}

export function AuthButton({ label, onPress, pending = false, disabled = false, secondary = false }: {
  label: string;
  onPress: () => void;
  pending?: boolean;
  disabled?: boolean;
  secondary?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || pending}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: secondary ? theme.secondary : theme.primary, opacity: disabled || pending ? 0.55 : pressed ? 0.8 : 1 },
      ]}>
      {pending ? <ActivityIndicator color={secondary ? theme.secondaryForeground : theme.primaryForeground} /> : null}
      <Text style={[styles.buttonText, { color: secondary ? theme.secondaryForeground : theme.primaryForeground }]}>{label}</Text>
    </Pressable>
  );
}

export function AuthLink({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={styles.link}>
      <Text style={[styles.linkText, { color: theme.primary }]}>{label}</Text>
    </Pressable>
  );
}

export function AuthMessage({ message, error = false }: { message: string; error?: boolean }) {
  const theme = useTheme();
  return <Text accessibilityRole="alert" style={[styles.message, { color: error ? theme.destructive : theme.mutedForeground }]}>{message}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.four, paddingVertical: Spacing.five },
  brandLogoFrame: { backgroundColor: '#fffefa', borderRadius: Radius['2xl'], paddingHorizontal: Spacing.three, marginBottom: Spacing.four },
  brandLogo: { width: 190, height: 70 },
  card: { width: '100%', maxWidth: 440, padding: Spacing.four, borderWidth: 1, borderRadius: Radius['3xl'], gap: Spacing.two },
  title: { fontFamily: Fonts.headingBold, fontSize: 25, lineHeight: 34 },
  subtitle: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 23 },
  form: { gap: Spacing.three, marginTop: Spacing.three },
  field: { gap: Spacing.one },
  label: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
  input: { height: 48, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, fontFamily: Fonts.sans, fontSize: 16 },
  error: { fontFamily: Fonts.sans, fontSize: 13 },
  button: { minHeight: 48, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.three },
  buttonText: { fontFamily: Fonts.sansSemibold, fontSize: 16 },
  link: { alignSelf: 'center', padding: Spacing.one },
  linkText: { fontFamily: Fonts.sansSemibold, fontSize: 14, textAlign: 'center' },
  message: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
