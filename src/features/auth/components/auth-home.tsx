import { router } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandColors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { AuthButton } from "./auth-ui";

export function AuthHome() {
  const theme = useTheme();

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
            Chào mừng đến Vedora
          </Text>
          <Text style={[styles.description, { color: theme.mutedForeground }]}>
            Đăng nhập hoặc tạo tài khoản để bắt đầu.
          </Text>
          <AuthButton label="Khám phá bài viết" onPress={() => router.push('/explore')} />
          <AuthButton label="Đăng nhập" onPress={() => router.push('/login')} secondary />
          <AuthButton
            label="Tạo tài khoản"
            onPress={() => router.push("/register")}
            secondary
          />
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
