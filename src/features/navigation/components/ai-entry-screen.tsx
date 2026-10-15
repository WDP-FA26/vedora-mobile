import { SymbolView } from "expo-symbols";
import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandColors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Entry point only: mobile has no connected assistant service yet. */
export function AiEntryScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView edges={["top"]} style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>VEDORA AI</Text>
          <Text style={[styles.pageTitle, { color: theme.foreground }]}>Trợ lý của bạn</Text>
          <Text style={[styles.pageSubtitle, { color: theme.mutedForeground }]}>
            Một góc nhỏ dành cho những câu hỏi về bữa ăn và dinh dưỡng thực vật.
          </Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <View style={styles.heroIcon}>
              <SymbolView name={{ ios: "sparkles", android: "auto_awesome", web: "auto_awesome" }} size={20} tintColor={BrandColors.forest} />
            </View>
            <Text style={styles.heroTitle}>Hỏi Vedora về bữa ăn của bạn</Text>
            <Text style={styles.heroSubtitle}>
              Gợi ý món, đổi nguyên liệu và tìm hiểu cách ăn uống phù hợp.
            </Text>
          </View>
          <Image
            source={require("@/assets/branding/tomato-sticker.png")}
            style={styles.sticker}
            resizeMode="contain"
            accessibilityLabel="Hình cà chua Vedora"
          />
        </View>

        <View style={[styles.statusCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.statusIcon, { backgroundColor: theme.secondary }]}>
            <SymbolView name={{ ios: "bubble.left.and.bubble.right", android: "forum", web: "forum" }} size={24} tintColor={theme.primary} />
          </View>
          <View style={styles.statusText}>
            <Text style={[styles.statusTitle, { color: theme.foreground }]}>Trò chuyện trên mobile đang được hoàn thiện</Text>
            <Text style={[styles.statusDescription, { color: theme.mutedForeground }]}>
              Ứng dụng chưa kết nối chức năng chat AI. Khi sẵn sàng, bạn sẽ đặt câu hỏi trực tiếp tại đây.
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/explore")}
          style={({ pressed }) => [styles.exploreButton, { borderColor: theme.border, backgroundColor: theme.card, opacity: pressed ? 0.75 : 1 }]}
        >
          <Text style={[styles.exploreButtonText, { color: theme.primary }]}>Khám phá cộng đồng</Text>
          <SymbolView name={{ ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" }} size={18} tintColor={theme.primary} />
        </Pressable>
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
  pageSubtitle: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 },
  hero: {
    backgroundColor: BrandColors.forest,
    borderRadius: Radius["3xl"],
    minHeight: 195,
    padding: Spacing.four,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "flex-end",
  },
  heroCopy: { flex: 1, alignSelf: "stretch", justifyContent: "space-between", paddingRight: Spacing.two },
  heroIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#e9f3e3", alignItems: "center", justifyContent: "center" },
  heroTitle: { fontFamily: Fonts.headingBold, fontSize: 21, lineHeight: 29, color: "#fffefa" },
  heroSubtitle: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18, color: "#e3f1de" },
  sticker: { width: 88, height: 110, marginBottom: -10, marginRight: -4 },
  statusCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: Radius["2xl"],
    padding: Spacing.three,
    gap: Spacing.three,
  },
  statusIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  statusText: { flex: 1, gap: Spacing.one },
  statusTitle: { fontFamily: Fonts.headingBold, fontSize: 15, lineHeight: 22 },
  statusDescription: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  exploreButton: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.three,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exploreButtonText: { fontFamily: Fonts.sansSemibold, fontSize: 15 },
});
