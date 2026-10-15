import { SymbolView } from "expo-symbols";
import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Entry point only: no mobile meal-planner request or saved-plan service is wired yet. */
export function MealPlanEntryScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView edges={["top"]} style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>BỮA ĂN MỖI NGÀY</Text>
          <Text style={[styles.pageTitle, { color: theme.foreground }]}>Lên thực đơn</Text>
          <Text style={[styles.pageSubtitle, { color: theme.mutedForeground }]}>
            Chuẩn bị cho một tuần ăn uống gọn gàng và nhiều cảm hứng hơn.
          </Text>
        </View>

        <View style={[styles.hero, { backgroundColor: theme.secondary }]}>
          <View style={styles.heroCopy}>
            <View style={[styles.heroIcon, { backgroundColor: theme.card }]}>
              <SymbolView name={{ ios: "calendar", android: "calendar_month", web: "calendar_month" }} size={23} tintColor={theme.primary} />
            </View>
            <Text style={[styles.heroTitle, { color: theme.foreground }]}>Một tuần, nhiều món ngon</Text>
            <Text style={[styles.heroSubtitle, { color: theme.mutedForeground }]}>
              Lập kế hoạch bữa ăn theo ngày, nguyên liệu đang có và cách ăn của bạn.
            </Text>
          </View>
          <Image
            source={require("@/assets/branding/carrot-sticker.png")}
            style={styles.sticker}
            resizeMode="contain"
            accessibilityLabel="Hình cà rốt Vedora"
          />
        </View>

        <View style={[styles.statusCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.statusIcon, { backgroundColor: theme.secondary }]}>
            <SymbolView name={{ ios: "calendar.badge.clock", android: "event_note", web: "event_note" }} size={24} tintColor={theme.primary} />
          </View>
          <View style={styles.statusText}>
            <Text style={[styles.statusTitle, { color: theme.foreground }]}>Thực đơn trên mobile đang được hoàn thiện</Text>
            <Text style={[styles.statusDescription, { color: theme.mutedForeground }]}>
              Ứng dụng chưa tải hoặc lưu thực đơn từ tài khoản của bạn. Dữ liệu bữa ăn sẽ xuất hiện tại đây sau khi tính năng được kết nối.
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/recipes")}
          style={({ pressed }) => [styles.recipeButton, { backgroundColor: theme.primary, opacity: pressed ? 0.82 : 1 }]}
        >
          <SymbolView name={{ ios: "book.closed", android: "menu_book", web: "menu_book" }} size={18} tintColor={theme.primaryForeground} />
          <Text style={[styles.recipeButtonText, { color: theme.primaryForeground }]}>Xem công thức</Text>
          <SymbolView name={{ ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" }} size={17} tintColor={theme.primaryForeground} />
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
    minHeight: 198,
    padding: Spacing.four,
    borderRadius: Radius["3xl"],
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "flex-end",
  },
  heroCopy: { flex: 1, alignSelf: "stretch", justifyContent: "space-between", paddingRight: Spacing.one },
  heroIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  heroTitle: { fontFamily: Fonts.headingBold, fontSize: 20, lineHeight: 28 },
  heroSubtitle: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  sticker: { width: 100, height: 120, marginRight: -8, marginBottom: -15 },
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
  recipeButton: {
    minHeight: 50,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.three,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
  },
  recipeButtonText: { fontFamily: Fonts.sansSemibold, fontSize: 15 },
});
