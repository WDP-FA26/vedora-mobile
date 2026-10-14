import { router } from "expo-router";
import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandColors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { clearSession } from "@/shared/session/session-manager";
import { useSessionStore } from "@/shared/stores/session-store";

import { logout } from "../services/auth.service";
import { AuthButton, AuthMessage } from "./auth-ui";

export function AuthHome() {
  const theme = useTheme();
  const accessToken = useSessionStore((state) => state.accessToken);
  const refreshToken = useSessionStore((state) => state.refreshToken);
  const displayName = useSessionStore((state) => state.displayName);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError("");
    const results = await Promise.allSettled([
      clearSession(),
      refreshToken ? logout(refreshToken) : Promise.resolve(),
    ]);
    if (results.some((result) => result.status === "rejected")) {
      setSignOutError(
        "Đã thoát trên thiết bị, nhưng chưa thể thu hồi phiên trên máy chủ.",
      );
    }
    setSigningOut(false);
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: BrandColors.forest }]}>
          <Image
            source={require("@/assets/branding/logo-mark.png")}
            style={styles.heroMark}
            resizeMode="contain"
            accessibilityLabel="Vedora"
          />
          <Text style={styles.title}>Ăn sạch, Sống xanh.</Text>
          <Text style={styles.intro}>
            Kết nối và chia sẻ hành trình của bạn.
          </Text>
        </View>
        <View style={styles.stickers}>
          <Image
            source={require("@/assets/branding/tomato-sticker.png")}
            style={styles.sticker}
            resizeMode="contain"
            accessibilityLabel="Hình cà chua Vedora"
          />
          <Image
            source={require("@/assets/branding/carrot-sticker.png")}
            style={styles.sticker}
            resizeMode="contain"
            accessibilityLabel="Hình cà rốt Vedora"
          />
          <Image
            source={require("@/assets/branding/avocado-sticker.png")}
            style={styles.sticker}
            resizeMode="contain"
            accessibilityLabel="Hình quả bơ Vedora"
          />
        </View>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.foreground }]}>
            {accessToken
              ? `Xin chào, ${displayName ?? "bạn"}!`
              : "Chào mừng đến Vedora"}
          </Text>
          <Text style={[styles.description, { color: theme.mutedForeground }]}>
            {accessToken
              ? "Bạn đã đăng nhập thành công."
              : "Đăng nhập hoặc tạo tài khoản để bắt đầu."}
          </Text>
          {signOutError && !accessToken ? (
            <AuthMessage message={signOutError} error />
          ) : null}
          {accessToken ? (
            <AuthButton
              label="Đăng xuất"
              onPress={() => {
                void signOut();
              }}
              pending={signingOut}
              secondary
            />
          ) : (
            <>
              <AuthButton
                label="Đăng nhập"
                onPress={() => router.push("/login")}
              />
              <AuthButton
                label="Tạo tài khoản"
                onPress={() => router.push("/register")}
                secondary
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.four,
    gap: Spacing.four,
  },
  hero: {
    width: "100%",
    maxWidth: 520,
    padding: Spacing.five,
    borderRadius: Radius["3xl"],
    gap: Spacing.two,
  },
  heroMark: { width: 62, height: 62, marginBottom: Spacing.two },
  stickers: {
    width: "100%",
    maxWidth: 520,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  sticker: { width: 72, height: 72 },
  title: {
    fontFamily: Fonts.headingExtraBold,
    fontSize: 29,
    lineHeight: 39,
    color: "#fffefa",
  },
  intro: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: "#fffefa",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    padding: Spacing.four,
    borderRadius: Radius["3xl"],
    borderWidth: 1,
    gap: Spacing.three,
  },
  cardTitle: { fontFamily: Fonts.headingBold, fontSize: 20 },
  description: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 23 },
});
