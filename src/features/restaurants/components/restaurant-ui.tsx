import type { PropsWithChildren } from 'react';
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
        <Action
          label="‹ Quay lại"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/explore')
          }
        />
        <Text
          accessibilityRole="header"
          style={{
            flex: 1,
            color: t.foreground,
            fontSize: 20,
            fontFamily: Fonts.headingBold,
            fontWeight: '700',
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
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        {
          backgroundColor: primary ? t.primary : t.muted,
          opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={{
          color: primary ? t.primaryForeground : t.foreground,
          fontFamily: Fonts.sansSemibold,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Copy>{label}</Copy>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={t.mutedForeground}
        {...props}
        style={[
          ui.input,
          { fontFamily: Fonts.sans },
          {
            color: t.foreground,
            borderColor: t.border,
            backgroundColor: t.card,
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
    <View style={{ gap: 8 }}>
      <Text accessibilityRole="alert" style={{ color: t.destructive }}>
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
export const ui = StyleSheet.create({
  header: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
  },
  body: {
    padding: 16,
    paddingBottom: 48,
    gap: 18,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 46,
    fontSize: 16,
  },
  card: { padding: 16, borderWidth: 1, borderRadius: 18, gap: 12 },
  photo: { width: '100%', height: 160, borderRadius: 12 },
});
