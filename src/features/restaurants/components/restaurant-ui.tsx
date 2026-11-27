import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useTheme } from '@/hooks/use-theme';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/shared/api/api-error';
import { ZodError } from 'zod';

export function restaurantError(error: unknown): string {
  if (error instanceof ZodError)
    return error.issues[0]?.message ?? 'Kiểm tra lại thông tin.';
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      PAGE_SESSION_NOT_ALLOWED: 'Hãy chuyển về tài khoản cá nhân để thực hiện.',
      APPLICATION_PENDING: 'Bạn đã có đơn nhà hàng đang chờ duyệt.',
      MISSING_PROOF: 'Chưa đủ các loại ảnh minh chứng bắt buộc.',
      FILE_TOO_LARGE: 'Ảnh vượt quá dung lượng cho phép.',
      PROOF_LIMIT_REACHED: 'Đã đạt giới hạn ảnh tải lên. Hãy dùng ảnh đã tải hoặc thử lại sau.',
      WORKSPACE_NOT_REVIEWABLE: 'Trạng thái đơn đã thay đổi. Hãy làm mới Trang trước khi gửi lại.',
      LOCKED_AFTER_APPROVAL:
        'Địa chỉ đã xác minh không thể thay đổi. Hãy liên hệ hỗ trợ.',
      USERNAME_TAKEN: 'Tên đăng nhập đã được dùng.',
      WORKSPACE_OWNER_REQUIRED: 'Chỉ chủ trang có quyền thực hiện.',
      ALREADY_MEMBER: 'Tài khoản này đã là thành viên.',
      WORKSPACE_NOT_APPROVED: 'Trang cần được duyệt trước.',
      NOT_FOUND: 'Không tìm thấy dữ liệu hoặc bạn không còn quyền truy cập.',
      PROOF_NOT_UPLOADED: 'Ảnh minh chứng chưa tải xong. Hãy chọn lại ảnh.',
      SELF_RATING_NOT_ALLOWED: 'Bạn không thể đánh giá nhà hàng mình quản lý.',
      PERSONAL_SESSION_REQUIRED:
        'Hãy chuyển về tài khoản cá nhân để thực hiện.',
    };
    return messages[error.code ?? ''] ?? error.message;
  }
  return error instanceof Error
    ? error.message
    : 'Chưa thực hiện được. Vui lòng thử lại.';
}
export function confirmRestaurant(title: string, action: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(title)) action();
  } else
    Alert.alert(title, undefined, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đồng ý', style: 'destructive', onPress: action },
    ]);
}
export function RestaurantShell({
  title,
  children,
  action,
}: PropsWithChildren<{ title: string; action?: React.ReactNode }>) {
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <View style={[ui.header, { borderColor: t.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          style={({ pressed }) => [ui.back, { backgroundColor: t.muted, opacity: pressed ? 0.6 : 1 }]}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/explore')
          }
        >
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={21} tintColor={t.foreground} />
        </Pressable>
        <Text
          accessibilityRole="header"
          style={{
            flex: 1,
            color: t.foreground,
            fontSize: 17,
            fontFamily: Fonts.headingBold,
          }}
        >
          {title}
        </Text>
        {action}
      </View>
      {children}
    </SafeAreaView>
  );
}
export function Body({ children }: PropsWithChildren) {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={ui.body}
    >
      {children}
    </ScrollView>
  );
}
export function Heading({ children }: PropsWithChildren) {
  const t = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{ color: t.foreground, fontSize: 20, fontFamily: Fonts.headingBold }}
    >
      {children}
    </Text>
  );
}
export function Copy({ children }: PropsWithChildren) {
  const t = useTheme();
  return (
    <Text style={{ color: t.mutedForeground, fontSize: 15, lineHeight: 22, fontFamily: Fonts.sans }}>
      {children}
    </Text>
  );
}
export function Action({
  label,
  onPress,
  disabled,
  primary = false,
  danger = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
  icon?: SymbolViewProps['name'];
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        {
          backgroundColor: primary ? t.primary : t.muted,
          borderColor: primary ? t.primary : danger ? `${t.destructive}40` : t.border,
          opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
        },
      ]}
    >
      {icon && <SymbolView name={icon} size={19} tintColor={danger ? t.destructive : primary ? t.primaryForeground : t.primary} />}
      <Text
        style={{
          color: danger ? t.destructive : primary ? t.primaryForeground : t.foreground,
          fontFamily: Fonts.sansSemibold,
          fontSize: 15,
          textAlign: 'center',
          flexShrink: 1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: Fonts.sansSemibold, fontSize: 14, color: t.foreground }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={t.mutedForeground}
        {...props}
        onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
        style={[
          ui.input,
          { fontFamily: Fonts.sans },
          {
            color: t.foreground,
            borderColor: focused ? t.primary : t.border,
            backgroundColor: props.editable === false ? t.muted : t.background,
          },
          props.multiline && { minHeight: 90, textAlignVertical: 'top' },
          props.style,
        ]}
      />
    </View>
  );
}
export function Notice({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  const t = useTheme();
  return error ? (
    <View style={[ui.notice, { backgroundColor: `${t.destructive}0d`, borderColor: `${t.destructive}35` }]}>
      <Text accessibilityRole="alert" style={{ color: t.destructive, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 }}>
        {restaurantError(error)}
      </Text>
      {retry && <Action label="Thử lại" onPress={retry} />}
    </View>
  ) : null;
}
export function Busy() {
  const t = useTheme();
  return <ActivityIndicator style={{ padding: 20 }} color={t.primary} />;
}
export function Card({ children }: PropsWithChildren) {
  const t = useTheme();
  return (
    <View style={[ui.card, { backgroundColor: t.card, borderColor: t.border }]}>
      {children}
    </View>
  );
}

const stickers = {
  tomato: require('@/assets/branding/tomato-sticker.png'),
  carrot: require('@/assets/branding/carrot-sticker.png'),
  avocado: require('@/assets/branding/avocado-sticker.png'),
};

export function RestaurantSectionHeading({ title, description, sticker }: { title: string; description?: string; sticker?: keyof typeof stickers }) {
  return (
    <View style={ui.sectionHeading}>
      <View style={{ flex: 1, gap: 5 }}>
        <Heading>{title}</Heading>
        {description && <Copy>{description}</Copy>}
      </View>
      {sticker && <Image source={stickers[sticker]} contentFit="contain" accessible={false} style={ui.sectionSticker} />}
    </View>
  );
}

export function RestaurantEmptyState({ title, description, sticker = 'carrot', children }: PropsWithChildren<{ title: string; description: string; sticker?: keyof typeof stickers }>) {
  const t = useTheme();
  return (
    <View style={[ui.empty, { backgroundColor: t.card, borderColor: t.border }]}>
      <Image source={stickers[sticker]} contentFit="contain" accessible={false} style={ui.emptySticker} />
      <Text style={{ color: t.foreground, fontFamily: Fonts.sansBold, fontSize: 18, textAlign: 'center' }}>{title}</Text>
      <Text style={{ color: t.mutedForeground, fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 360 }}>{description}</Text>
      {children}
    </View>
  );
}

export function RestaurantTabs<T extends string>({ items, selected, onChange }: { items: readonly { value: T; label: string; count?: number }[]; selected: T; onChange: (value: T) => void }) {
  const t = useTheme();
  return (
    <ScrollView horizontal accessibilityRole="tablist" style={ui.tabStrip} showsHorizontalScrollIndicator={false} contentContainerStyle={ui.tabs}>
      {items.map((item) => (
        <Pressable key={item.value} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: selected === item.value }} onPress={() => onChange(item.value)} style={({ pressed }) => [ui.tab, { backgroundColor: selected === item.value ? t.primary : t.card, borderColor: selected === item.value ? t.primary : t.border, opacity: pressed ? 0.7 : 1 }]}>
          <Text style={{ fontFamily: Fonts.sansSemibold, fontSize: 14, color: selected === item.value ? t.primaryForeground : t.mutedForeground }}>{item.label}</Text>
          {item.count !== undefined && <Text style={{ fontFamily: Fonts.sansBold, fontSize: 12, color: selected === item.value ? t.primaryForeground : t.primary }}>{item.count}</Text>}
        </Pressable>
      ))}
    </ScrollView>
  );
}

export const ui = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: {
    padding: 16,
    paddingBottom: 48,
    gap: 22,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    minHeight: 52,
    fontSize: 16,
  },
  card: { padding: 18, borderWidth: 1, borderRadius: 24, gap: 16 },
  photo: { width: '100%', height: 190, borderRadius: 16 },
  notice: { padding: 14, gap: 10, borderWidth: 1, borderRadius: 16 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionSticker: { width: 52, height: 64, transform: [{ rotate: '8deg' }] },
  empty: { padding: 24, borderWidth: 1, borderRadius: 24, alignItems: 'center', gap: 12 },
  emptySticker: { width: 72, height: 88 },
  tabs: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  tabStrip: { flexGrow: 0, flexShrink: 0 },
  tab: { minHeight: 46, borderRadius: 16, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
