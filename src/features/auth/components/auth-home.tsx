import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandColors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const BANNER_URI = "https://i.pinimg.com/736x/b3/37/2d/b3372d4bd8515bfeb7cfe8fc203fed74.jpg";

export function AuthHome() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const bannerHeight = Math.max(300, Math.round(height * 0.5));

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <ScrollView
        bounces={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.four }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bannerWrap}>
          <View style={[styles.banner, { height: bannerHeight, backgroundColor: BrandColors.forest }]}>
            <Image
              source={{ uri: BANNER_URI }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              accessibilityLabel="Ảnh bìa Vedora"
              transition={250}
            />
            <View style={styles.shade} />
            <View style={[styles.bannerCopy, { paddingTop: insets.top + Spacing.three }]}>
              <Image
                source={require("@/assets/branding/logo-mark.png")}
                style={styles.mark}
                contentFit="contain"
                accessibilityLabel="Vedora"
              />
              <View style={styles.bannerText}>
                <Text accessibilityRole="header" style={styles.title}>Ăn sạch, Sống xanh.</Text>
                <Text style={styles.intro}>Kết nối và chia sẻ hành trình của bạn.</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <View style={styles.heading}>
            <Text style={[styles.cardTitle, { color: theme.foreground }]}>Chào mừng đến Vedora</Text>
            <Text style={[styles.description, { color: theme.mutedForeground }]}>
              Đăng nhập hoặc tạo tài khoản để bắt đầu.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Khám phá bài viết"
            onPress={() => router.push("/explore")}
            style={({ pressed }) => [styles.primary, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={[styles.primaryText, { color: theme.primaryForeground }]}>Khám phá bài viết</Text>
            <SymbolView
              name={{ ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" }}
              size={20}
              tintColor={theme.primaryForeground}
            />
          </Pressable>

          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.mutedForeground }]}>hoặc</Text>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
          </View>

          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đăng nhập"
              onPress={() => router.push("/login")}
              style={({ pressed }) => [styles.outline, { borderColor: theme.primary, opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.outlineText, { color: theme.primary }]}>Đăng nhập</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tạo tài khoản"
              onPress={() => router.push("/register")}
              style={({ pressed }) => [styles.tonal, { backgroundColor: theme.secondary, opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.tonalText, { color: theme.secondaryForeground }]}>Tạo tài khoản</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, alignItems: "center" },
  bannerWrap: { width: "100%" },
  banner: {
    width: "100%",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  shade: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 45, 24, 0.42)" },
  bannerCopy: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "space-between",
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  mark: { width: 56, height: 56 },
  bannerText: { gap: Spacing.one },
  title: { fontFamily: Fonts.headingExtraBold, fontSize: 32, lineHeight: 42, color: "#fffefa" },
  intro: { fontFamily: Fonts.sans, fontSize: 16, lineHeight: 24, color: "#fffefa" },
  actions: {
    width: "100%",
    maxWidth: 520,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  heading: { gap: Spacing.one },
  cardTitle: { fontFamily: Fonts.headingBold, fontSize: 22 },
  description: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 23 },
  primary: {
    minHeight: 56,
    borderRadius: Radius["3xl"],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
  },
  primaryText: { fontFamily: Fonts.sansBold, fontSize: 16 },
  divider: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontFamily: Fonts.sans, fontSize: 13 },
  row: { flexDirection: "row", gap: Spacing.two },
  outline: {
    flex: 1,
    minHeight: 52,
    borderRadius: Radius["3xl"],
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineText: { fontFamily: Fonts.sansBold, fontSize: 15 },
  tonal: { flex: 1, minHeight: 52, borderRadius: Radius["3xl"], alignItems: "center", justifyContent: "center" },
  tonalText: { fontFamily: Fonts.sansBold, fontSize: 15 },
});
