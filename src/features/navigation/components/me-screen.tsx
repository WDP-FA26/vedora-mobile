import { SymbolView } from "expo-symbols";
import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSignOut } from "@/features/auth/hooks/use-auth-actions";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useSessionStore } from "@/shared/stores/session-store";

/** Shows only the account fields currently available in the session. */
export function MeScreen() {
  const theme = useTheme();
  const accessToken = useSessionStore((state) => state.accessToken);
  const displayName = useSessionStore((state) => state.displayName);
  const signOut = useSignOut();
  const name = displayName?.trim() || "Thành viên Vedora";

  return (
    <SafeAreaView edges={["top"]} style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>GÓC CỦA BẠN</Text>
          <Text style={[styles.pageTitle, { color: theme.foreground }]}>Tôi</Text>
        </View>

        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>{accessToken ? name.charAt(0).toUpperCase() : "V"}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={[styles.profileName, { color: theme.foreground }]}>{accessToken ? name : "Chào bạn đến Vedora"}</Text>
            <Text style={[styles.profileDetail, { color: theme.mutedForeground }]}>
              {accessToken ? "Tài khoản Vedora" : "Đăng nhập để tiếp tục hành trình ăn xanh"}
            </Text>
          </View>
          <Image source={require("@/assets/branding/avocado-sticker.png")} style={styles.sticker} resizeMode="contain" accessibilityLabel="Hình quả bơ Vedora" />
        </View>

        {accessToken ? (
          <>
            <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.infoIcon, { backgroundColor: theme.secondary }]}>
                <SymbolView name={{ ios: "person.crop.circle", android: "account_circle", web: "account_circle" }} size={24} tintColor={theme.primary} />
              </View>
              <View style={styles.infoText}>
                <Text style={[styles.infoTitle, { color: theme.foreground }]}>Hồ sơ cá nhân</Text>
                <Text style={[styles.infoDescription, { color: theme.mutedForeground }]}>
                  Chi tiết hồ sơ và bài viết của bạn đang được đưa lên ứng dụng mobile.
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: signOut.isPending }}
              disabled={signOut.isPending}
              onPress={() => signOut.mutate(undefined, { onSuccess: () => router.replace("/") })}
              style={({ pressed }) => [styles.signOutButton, { borderColor: theme.border, backgroundColor: theme.card, opacity: signOut.isPending ? 0.55 : pressed ? 0.75 : 1 }]}
            >
              <SymbolView name={{ ios: "arrow.right.square", android: "logout", web: "logout" }} size={20} tintColor={theme.destructive} />
              <Text style={[styles.signOutText, { color: theme.destructive }]}>{signOut.isPending ? "Đang đăng xuất..." : "Đăng xuất"}</Text>
            </Pressable>
            {signOut.isError ? (
              <Text accessibilityRole="alert" style={[styles.error, { color: theme.destructive }]}>
                Đã thoát trên thiết bị, nhưng chưa thể thu hồi phiên trên máy chủ.
              </Text>
            ) : null}
          </>
        ) : (
          <View style={[styles.guestCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.guestTitle, { color: theme.foreground }]}>Bắt đầu hành trình của bạn</Text>
            <Text style={[styles.guestDescription, { color: theme.mutedForeground }]}>
              Đăng nhập để lưu bài viết và dùng những tính năng dành riêng cho bạn.
            </Text>
            <Pressable accessibilityRole="button" onPress={() => router.push("/login")} style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 }]}>
              <Text style={[styles.primaryButtonText, { color: theme.primaryForeground }]}>Đăng nhập</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push("/register")} style={styles.registerButton}>
              <Text style={[styles.registerText, { color: theme.primary }]}>Tạo tài khoản</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  heading: { gap: Spacing.one },
  eyebrow: { fontFamily: Fonts.sansBold, fontSize: 11, letterSpacing: 1.8 },
  pageTitle: { fontFamily: Fonts.headingBold, fontSize: 27, lineHeight: 36 },
  profileCard: {
    minHeight: 106,
    borderRadius: Radius["3xl"],
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.three,
    gap: Spacing.three,
    overflow: "hidden",
  },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: Fonts.headingBold, fontSize: 22 },
  profileText: { flex: 1, gap: Spacing.one },
  profileName: { fontFamily: Fonts.headingBold, fontSize: 16, lineHeight: 23 },
  profileDetail: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
  sticker: { width: 52, height: 61, marginRight: -2 },
  infoCard: { borderWidth: 1, borderRadius: Radius["2xl"], padding: Spacing.three, flexDirection: "row", alignItems: "flex-start", gap: Spacing.three },
  infoIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  infoText: { flex: 1, gap: Spacing.one },
  infoTitle: { fontFamily: Fonts.headingBold, fontSize: 15 },
  infoDescription: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  signOutButton: { minHeight: 50, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: Spacing.two },
  signOutText: { fontFamily: Fonts.sansSemibold, fontSize: 15 },
  error: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18, textAlign: "center" },
  guestCard: { borderWidth: 1, borderRadius: Radius["2xl"], padding: Spacing.four, gap: Spacing.two },
  guestTitle: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 25 },
  guestDescription: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21, marginBottom: Spacing.two },
  primaryButton: { minHeight: 48, borderRadius: Radius.xl, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { fontFamily: Fonts.sansSemibold, fontSize: 15 },
  registerButton: { minHeight: 40, alignItems: "center", justifyContent: "center" },
  registerText: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
});
