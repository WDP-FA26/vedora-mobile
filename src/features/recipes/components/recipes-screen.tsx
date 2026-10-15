import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { showcasePosts, type ShowcasePost } from "@/features/feed/data/showcase-posts";

type VideoPost = Extract<ShowcasePost, { kind: "video" }>;
type Topic = "all" | "tofu" | "miso";

type RecipeIdea = {
  post: VideoPost;
  title: string;
  topic: Exclude<Topic, "all">;
  illustration: number;
  lightTint: string;
  darkTint: string;
};

const topics: { id: Topic; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "tofu", label: "Đậu hũ" },
  { id: "miso", label: "Miso" },
];

// These are the same illustrative video posts as the web Explore recipe tab.
// The public API has no recipe collection route; these cards never mutate server data.
const recipeIdeas: RecipeIdea[] = showcasePosts
  .filter((post): post is VideoPost => post.kind === "video")
  .flatMap<RecipeIdea>((post) => {
    if (post.id === "showcase-marcus") {
      return [{
        post,
        title: "Đậu hũ giòn sốt maple-tahini",
        topic: "tofu" as const,
        illustration: require("@/assets/branding/tomato-sticker.png"),
        lightTint: "#f8e8c7",
        darkTint: "#4c4029",
      }];
    }
    if (post.id === "showcase-kenji") {
      return [{
        post,
        title: "Miso trắng từ đậu gà",
        topic: "miso" as const,
        illustration: require("@/assets/branding/avocado-sticker.png"),
        lightTint: "#f1d6e5",
        darkTint: "#4d2d42",
      }];
    }
    return [];
  });

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase("vi-VN");
}

export function RecipesScreen() {
  const theme = useTheme();
  const isDark = useColorScheme() === "dark";
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<Topic>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visibleIdeas = useMemo(() => {
    const needle = normalize(query.trim());
    return recipeIdeas.filter((idea) => {
      if (topic !== "all" && idea.topic !== topic) return false;
      if (!needle) return true;
      return normalize([
        idea.title,
        idea.post.body,
        idea.post.author.name,
        ...idea.post.tags,
      ].join(" ")).includes(needle);
    });
  }, [query, topic]);

  return (
    <SafeAreaView edges={["top"]} style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          <View style={styles.headingRow}>
            <View style={[styles.headingIcon, { backgroundColor: theme.secondary }]}>
              <SymbolView
                name={{ ios: "book.closed", android: "menu_book", web: "menu_book" }}
                size={23}
                tintColor={theme.primary}
              />
            </View>
            <View style={styles.headingCopy}>
              <Text accessibilityRole="header" style={[styles.heading, { color: theme.foreground }]}>Công thức</Text>
              <Text style={[styles.headingSub, { color: theme.mutedForeground }]}>Khám phá món chay cùng cộng đồng</Text>
            </View>
          </View>

          <View style={[styles.hero, { backgroundColor: isDark ? "#1b4729" : "#255d32" }]}>
            <View style={styles.heroDecoration} />
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>GÓC BẾP VEDORA</Text>
              <Text style={styles.heroTitle}>Hôm nay nấu gì?</Text>
              <Text style={styles.heroDescription}>Tìm cảm hứng từ những món ăn và mẹo bếp được chia sẻ.</Text>
            </View>
            <Image
              source={require("@/assets/branding/carrot-sticker.png")}
              resizeMode="contain"
              accessibilityLabel="Hình minh họa củ cà rốt Vedora"
              style={styles.heroSticker}
            />
          </View>

          <View style={[styles.search, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <SymbolView
              name={{ ios: "magnifyingglass", android: "search", web: "search" }}
              size={19}
              tintColor={theme.mutedForeground}
            />
            <TextInput
              accessibilityLabel="Tìm công thức theo món hoặc nguyên liệu"
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm món hoặc nguyên liệu..."
              placeholderTextColor={theme.mutedForeground}
              returnKeyType="search"
              autoCapitalize="none"
              style={[styles.searchInput, { color: theme.foreground }]}
            />
            {query.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Xóa nội dung tìm kiếm"
                onPress={() => setQuery("")}
                style={styles.clearSearch}
              >
                <SymbolView
                  name={{ ios: "xmark.circle.fill", android: "cancel", web: "cancel" }}
                  size={19}
                  tintColor={theme.mutedForeground}
                />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topicRow}
            accessibilityRole="tablist"
          >
            {topics.map((item) => {
              const selected = topic === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Lọc ${item.label}`}
                  onPress={() => setTopic(item.id)}
                  style={[
                    styles.topic,
                    { backgroundColor: selected ? theme.primary : theme.card, borderColor: selected ? theme.primary : theme.border },
                  ]}
                >
                  <Text style={[styles.topicText, { color: selected ? theme.primaryForeground : theme.foreground }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.sectionHeading}>
            <Text accessibilityRole="header" style={[styles.sectionTitle, { color: theme.foreground }]}>Món được chia sẻ</Text>
            <Text style={[styles.sectionCount, { color: theme.mutedForeground }]}>{visibleIdeas.length} món</Text>
          </View>

          {visibleIdeas.length > 0 ? (
            <View style={styles.cards}>
              {visibleIdeas.map((idea) => (
                <RecipeIdeaCard
                  key={idea.post.id}
                  idea={idea}
                  isDark={isDark}
                  expanded={expandedId === idea.post.id}
                  onToggle={() => setExpandedId((id) => id === idea.post.id ? null : idea.post.id)}
                />
              ))}
            </View>
          ) : (
            <View style={[styles.empty, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <SymbolView
                name={{ ios: "fork.knife", android: "restaurant", web: "restaurant" }}
                size={28}
                tintColor={theme.primary}
              />
              <Text style={[styles.emptyTitle, { color: theme.foreground }]}>Chưa tìm thấy món phù hợp</Text>
              <Text style={[styles.emptyDescription, { color: theme.mutedForeground }]}>Thử từ khóa khác hoặc xem tất cả món.</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => { setQuery(""); setTopic("all"); }}
                style={[styles.resetButton, { backgroundColor: theme.secondary }]}
              >
                <Text style={[styles.resetText, { color: theme.secondaryForeground }]}>Xem tất cả</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RecipeIdeaCard({ idea, isDark, expanded, onToggle }: {
  idea: RecipeIdea;
  isDark: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.cardVisual, { backgroundColor: isDark ? idea.darkTint : idea.lightTint }]}>
        <View style={styles.cardVisualCircle} />
        <Image source={idea.illustration} resizeMode="contain" style={styles.cardSticker} />
        <View style={styles.cardVisualLabel}>
          <SymbolView name={{ ios: "sparkles", android: "auto_awesome", web: "auto_awesome" }} size={14} tintColor="#255d32" />
          <Text style={styles.cardVisualLabelText}>Ý tưởng nấu ăn</Text>
        </View>
      </View>
      <View style={styles.cardCopy}>
        <View style={styles.cardMetaRow}>
          <View style={[styles.authorAvatar, { backgroundColor: theme.secondary }]}>
            <Text style={[styles.authorInitials, { color: theme.primary }]}>{idea.post.author.initials}</Text>
          </View>
          <View style={styles.authorCopy}>
            <Text numberOfLines={1} style={[styles.authorName, { color: theme.foreground }]}>{idea.post.author.name}</Text>
            <Text style={[styles.authorHandle, { color: theme.mutedForeground }]}>@{idea.post.author.handle}</Text>
          </View>
        </View>
        <Text style={[styles.cardTitle, { color: theme.foreground }]}>{idea.title}</Text>
        <Text numberOfLines={expanded ? undefined : 3} style={[styles.cardBody, { color: theme.mutedForeground }]}>{idea.post.body}</Text>
        <View style={styles.tagRow}>
          {idea.post.tags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: theme.secondary }]}>
              <Text style={[styles.tagText, { color: theme.primary }]}>#{tag}</Text>
            </View>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={expanded ? `Thu gọn chia sẻ ${idea.title}` : `Đọc chia sẻ ${idea.title}`}
          onPress={onToggle}
          style={[styles.readButton, { borderTopColor: theme.border }]}
        >
          <Text style={[styles.readButtonText, { color: theme.primary }]}>{expanded ? "Thu gọn" : "Đọc chia sẻ"}</Text>
          <SymbolView
            name={{ ios: expanded ? "chevron.up" : "arrow.right", android: expanded ? "expand_less" : "arrow_forward", web: expanded ? "expand_less" : "arrow_forward" }}
            size={17}
            tintColor={theme.primary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: Spacing.four },
  inner: { width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: Spacing.three },
  headingRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two, paddingTop: Spacing.three, paddingBottom: Spacing.three },
  headingIcon: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  headingCopy: { flex: 1, minWidth: 0 },
  heading: { fontFamily: Fonts.headingBold, fontSize: 23, lineHeight: 31 },
  headingSub: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
  hero: { minHeight: 166, borderRadius: Radius["3xl"], overflow: "hidden", flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.three, paddingVertical: Spacing.three },
  heroDecoration: { position: "absolute", width: 190, height: 190, borderRadius: 95, right: -36, top: -92, backgroundColor: "#ffffff11" },
  heroCopy: { flex: 1, zIndex: 1, paddingRight: Spacing.one },
  heroEyebrow: { color: "#a9f4ef", fontFamily: Fonts.sansBold, fontSize: 10, letterSpacing: 1.5 },
  heroTitle: { color: "#fffefa", fontFamily: Fonts.headingBold, fontSize: 21, lineHeight: 29, marginTop: Spacing.two },
  heroDescription: { color: "#e4f1dc", fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19, marginTop: Spacing.one },
  heroSticker: { width: 88, height: 116, marginRight: -10 },
  search: { marginTop: Spacing.three, minHeight: 48, borderWidth: 1, borderRadius: Radius.xl, flexDirection: "row", alignItems: "center", gap: Spacing.two, paddingLeft: Spacing.three, paddingRight: Spacing.two },
  searchInput: { flex: 1, minWidth: 0, minHeight: 46, fontFamily: Fonts.sans, fontSize: 14, paddingVertical: 0 },
  clearSearch: { minWidth: 36, minHeight: 36, alignItems: "center", justifyContent: "center" },
  topicRow: { gap: Spacing.two, paddingTop: Spacing.three, paddingBottom: Spacing.two },
  topic: { minHeight: 37, borderRadius: 20, borderWidth: 1, paddingHorizontal: Spacing.three, alignItems: "center", justifyContent: "center" },
  topicText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  sectionHeading: { marginTop: Spacing.three, marginBottom: Spacing.two, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 23 },
  sectionCount: { fontFamily: Fonts.sans, fontSize: 12 },
  cards: { gap: Spacing.three },
  card: { borderWidth: 1, borderRadius: Radius["2xl"], overflow: "hidden" },
  cardVisual: { height: 142, alignItems: "center", justifyContent: "center" },
  cardVisualCircle: { position: "absolute", width: 210, height: 210, borderRadius: 105, right: -15, top: -88, backgroundColor: "#ffffff32" },
  cardSticker: { width: 96, height: 112 },
  cardVisualLabel: { position: "absolute", top: Spacing.two, left: Spacing.two, flexDirection: "row", gap: 5, alignItems: "center", borderRadius: 16, paddingHorizontal: Spacing.two, paddingVertical: 5, backgroundColor: "#fffefaec" },
  cardVisualLabelText: { color: "#255d32", fontFamily: Fonts.sansSemibold, fontSize: 11 },
  cardCopy: { padding: Spacing.three },
  cardMetaRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  authorAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  authorInitials: { fontFamily: Fonts.sansBold, fontSize: 10 },
  authorCopy: { flex: 1, minWidth: 0 },
  authorName: { fontFamily: Fonts.sansSemibold, fontSize: 12, lineHeight: 17 },
  authorHandle: { fontFamily: Fonts.sans, fontSize: 11, lineHeight: 15 },
  cardTitle: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 24, marginTop: Spacing.two },
  cardBody: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19, marginTop: Spacing.one },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one, marginTop: Spacing.two },
  tag: { borderRadius: 14, paddingHorizontal: Spacing.two, paddingVertical: 4 },
  tagText: { fontFamily: Fonts.sansMedium, fontSize: 11 },
  readButton: { minHeight: 43, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: Spacing.three, borderTopWidth: 1, paddingTop: Spacing.two },
  readButtonText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  empty: { borderWidth: 1, borderRadius: Radius["2xl"], padding: Spacing.four, alignItems: "center", gap: Spacing.two },
  emptyTitle: { fontFamily: Fonts.headingBold, fontSize: 16, textAlign: "center" },
  emptyDescription: { fontFamily: Fonts.sans, fontSize: 13, textAlign: "center" },
  resetButton: { borderRadius: 20, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, marginTop: Spacing.one },
  resetText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
});
