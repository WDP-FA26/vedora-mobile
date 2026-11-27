import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import { Fonts, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function RefreshWorkspaceButton({ busy, onPress }: { busy: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Làm mới Trang" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={onPress} style={({ pressed }) => [styles.refresh, { backgroundColor: t.muted, opacity: pressed ? 0.6 : 1 }]}>
      {busy ? <ActivityIndicator size="small" color={t.primary} /> : <SymbolView name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} size={22} tintColor={t.primary} />}
    </Pressable>
  );
}

export function WorkspaceWelcome({ title, description, children }: PropsWithChildren<{ title: string; description: string }>) {
  const t = useTheme();
  return (
    <View style={[styles.welcome, { backgroundColor: t.secondary }]}>
      <View style={styles.welcomeTop}>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: t.secondaryForeground }]}>GÓC NHÀ HÀNG</Text>
          <Text style={[styles.title, { color: t.secondaryForeground }]}>{title}</Text>
        </View>
        <Image source={require('@/assets/branding/tomato-sticker.png')} contentFit="contain" accessible={false} style={styles.sticker} />
      </View>
      <Text style={[styles.description, { color: t.secondaryForeground }]}>{description}</Text>
      {children}
    </View>
  );
}

const STEP_LABELS = ['Nhà hàng', 'Pháp lý', 'Giấy tờ'];
export function ApplicationProgress({ step }: { step: number }) {
  const t = useTheme();
  return (
    <View accessibilityLabel={`Bước ${step} trên 3: ${STEP_LABELS[step - 1]}`} style={styles.progress}>
      {STEP_LABELS.map((label, index) => (
        <View key={label} style={styles.progressItem}>
          {index > 0 && <View accessible={false} style={[styles.stepConnector, styles.connectorLeft, { backgroundColor: index < step ? t.primary : t.border }]} />}
          {index < STEP_LABELS.length - 1 && <View accessible={false} style={[styles.stepConnector, styles.connectorRight, { backgroundColor: index < step - 1 ? t.primary : t.border }]} />}
          <View style={[styles.stepHalo, { backgroundColor: index === step - 1 ? t.secondary : t.background }]}>
          <View style={[styles.stepCircle, { backgroundColor: index < step ? t.primary : t.muted, borderColor: index === step - 1 ? t.primary : t.border }]}>
            {index < step - 1 ? <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={18} tintColor={t.primaryForeground} /> : <Text style={[styles.stepNumber, { color: index < step ? t.primaryForeground : t.mutedForeground }]}>{index + 1}</Text>}
          </View>
          </View>
          <Text style={[styles.stepLabel, index === step - 1 && styles.activeStepLabel, { color: index < step ? t.primary : t.mutedForeground }]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

export function ApplicationIntro({ step }: { step: number }) {
  const t = useTheme();
  return (
    <View style={styles.intro}>
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { color: t.primary }]}>BƯỚC {step} / 3</Text>
        <Text accessibilityRole="header" style={[styles.formTitle, { color: t.foreground }]}>{['Thông tin nhà hàng', 'Thông tin pháp lý', 'Hồ sơ xác minh'][step - 1]}</Text>
        <Text style={[styles.description, { color: t.mutedForeground }]}>{['Thiết lập thông tin hiển thị và địa chỉ nhà hàng.', 'Cung cấp thông tin đúng theo giấy tờ đăng ký.', 'Tải minh chứng và xác nhận thông tin trước khi gửi.'][step - 1]}</Text>
      </View>
      <View style={[styles.introIcon, { backgroundColor: t.secondary }]}>
        <SymbolView name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }} size={26} tintColor={t.primary} />
      </View>
    </View>
  );
}

export function ApplicationField({ label, required, hint, ...props }: TextInputProps & { label: string; required?: boolean; hint?: string }) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 7 }}>
      <Text style={[styles.fieldLabel, { color: t.foreground }]}>{label}{required && <Text style={{ color: t.destructive }}> *</Text>}</Text>
      <TextInput
        {...props}
        accessibilityLabel={`${label}${required ? ', bắt buộc' : ''}`}
        placeholderTextColor={t.mutedForeground}
        onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
        style={[styles.input, { color: t.foreground, backgroundColor: focused ? t.card : t.background, borderColor: focused ? t.primary : t.border, opacity: props.editable === false ? 0.6 : 1 }, props.multiline && { minHeight: 112, textAlignVertical: 'top' }, props.style]}
      />
      {hint && <Text style={[styles.hint, { color: t.mutedForeground }]}>{hint}</Text>}
    </View>
  );
}

export function ApplicationUpload({ count, max, disabled, onPress }: { count: number; max: number; disabled: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Thêm ảnh minh chứng, đã có ${count} trên ${max} ảnh`} disabled={disabled} style={({ pressed }) => [styles.upload, { borderColor: t.border, backgroundColor: t.background, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 }]} onPress={onPress}>
      <SymbolView name={{ ios: 'square.and.arrow.up', android: 'upload_file', web: 'upload_file' }} size={26} tintColor={t.primary} />
      <Text style={[styles.fieldLabel, { color: t.foreground }]}>{count >= max ? 'Đã đủ số ảnh' : 'Tải ảnh minh chứng'}</Text>
      <Text style={[styles.hint, { color: t.mutedForeground }]}>{count}/{max} ảnh · JPG, PNG, WebP · Tối đa 10 MB/ảnh</Text>
    </Pressable>
  );
}

export function ApplicationSection({ title, description, children }: PropsWithChildren<{ title: string; description?: string }>) {
  const t = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={[styles.sectionHeader, { borderColor: t.border }]}>
        <Text accessibilityRole="header" style={[styles.sectionTitle, { color: t.foreground }]}>{title}</Text>
        {description && <Text style={[styles.description, { color: t.mutedForeground }]}>{description}</Text>}
      </View>
      {children}
    </View>
  );
}

export function ApplicationConsent({ label, checked, disabled, onPress }: { label: string; checked: boolean; disabled: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked, disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.consent, { backgroundColor: checked ? t.secondary : t.card, borderColor: checked ? t.primary : t.border, opacity: disabled || pressed ? 0.6 : 1 }]}>
      <SymbolView name={checked ? { ios: 'checkmark.square.fill', android: 'check_box', web: 'check_box' } : { ios: 'square', android: 'check_box_outline_blank', web: 'check_box_outline_blank' }} size={24} tintColor={t.primary} />
      <Text style={[styles.consentText, { color: t.foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  refresh: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  welcome: { padding: 20, borderRadius: Radius['4xl'], gap: 12 },
  welcomeTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, gap: 6 },
  eyebrow: { fontFamily: Fonts.sansBold, fontSize: 11, letterSpacing: 1.4 },
  title: { fontFamily: Fonts.headingBold, fontSize: 22, lineHeight: 32 },
  sticker: { width: 64, height: 72 },
  description: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  progress: { flexDirection: 'row', paddingVertical: 12 },
  progressItem: { flex: 1, gap: 8, alignItems: 'center' },
  stepConnector: { position: 'absolute', top: 23, height: 3, width: '50%' },
  connectorLeft: { left: 0 },
  connectorRight: { right: 0 },
  stepHalo: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  stepCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepNumber: { fontFamily: Fonts.sansBold, fontSize: 16 },
  stepLabel: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  activeStepLabel: { fontFamily: Fonts.sansBold },
  section: { padding: 18, borderRadius: 16, borderWidth: 1, gap: 20 },
  sectionHeader: { gap: 6, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  sectionTitle: { fontFamily: Fonts.sansBold, fontSize: 17 },
  consent: { padding: 14, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  consentText: { flex: 1, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  introIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  formTitle: { fontFamily: Fonts.headingBold, fontSize: 23, lineHeight: 32 },
  fieldLabel: { fontFamily: Fonts.sansSemibold, fontSize: 15 },
  input: { fontFamily: Fonts.sans, fontSize: 16, minHeight: 52, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderRadius: 10 },
  hint: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  upload: { alignItems: 'center', gap: 8, padding: 18, borderWidth: 1, borderStyle: 'dashed', borderRadius: 16 },
});
