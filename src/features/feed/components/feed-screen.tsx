import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandColors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/shared/api/api-error";
import { useSessionStore } from "@/shared/stores/session-store";

import { useSignOut } from "@/features/auth/hooks/use-auth-actions";
import { useFeed } from "../hooks/use-feed";
import type { FeedFilter, FeedPost } from "../types/feed.schema";
import { PostCard } from "./post-card";

const filters: { value: FeedFilter; label: string }[] = [
  { value: "all", label: "Dành cho bạn" },
  { value: "posts", label: "Bài ngắn" },
  { value: "blogs", label: "Blog" },
];
const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

export function FeedScreen() {
  const theme = useTheme();
  const accessToken = useSessionStore((state) => state.accessToken);
  const signOut = useSignOut();
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set());
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<FeedPost>[] }) => {
      setVisibleIds(new Set(viewableItems.map((item) => item.item.id)));
    },
    [],
  );
  const feed = useFeed(filter);
  const staleCursor = feed.isFetchNextPageError && feed.error instanceof ApiError && feed.error.status === 400;
  const posts =
    feed.data?.pages.flatMap((page) =>
      page.items.filter((post) => post.status === "PUBLISHED"),
    ) ?? [];

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.border, backgroundColor: theme.card },
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <View style={styles.logoFrame}>
              <Image
                source={require("@/assets/branding/logo-mark.png")}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="Vedora"
              />
            </View>
            <View>
              <Text style={[styles.eyebrow, { color: theme.primary }]}>VEDORA</Text>
              <Text style={[styles.heading, { color: theme.foreground }]}>Khám phá</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessToken ? "Đăng xuất" : "Mở tài khoản"}
            accessibilityState={{ disabled: signOut.isPending }}
            disabled={signOut.isPending}
            onPress={() => {
              if (accessToken) signOut.mutate();
              else router.push("/");
            }}
            style={[styles.accountButton, { borderColor: theme.border }]}
          >
            <Text style={[styles.accountText, { color: theme.foreground }]}>
              {accessToken ? "Đăng xuất" : "Tài khoản"}
            </Text>
          </Pressable>
        </View>
        {signOut.isError ? (
          <Text accessibilityRole="alert" style={{ color: theme.destructive }}>
            Đã thoát trên thiết bị, nhưng chưa thể thu hồi phiên trên máy chủ.
          </Text>
        ) : null}
        <View style={styles.filters} accessibilityRole="tablist">
          {filters.map((item) => (
            <Pressable
              key={item.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: filter === item.value }}
              onPress={() => setFilter(item.value)}
              style={[styles.filter, {
                borderBottomColor: filter === item.value ? theme.primary : "transparent",
              }]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: filter === item.value ? theme.foreground : theme.mutedForeground,
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        key={filter}
        style={styles.timeline}
        data={posts}
        keyExtractor={(post) => post.id}
        extraData={visibleIds}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            visible={visibleIds.size === 0 || visibleIds.has(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (
            feed.hasNextPage &&
            !feed.isFetchingNextPage &&
            !feed.isFetchNextPageError &&
            !feed.isRefetching
          )
            void feed.fetchNextPage();
        }}
        refreshing={feed.isRefetching && !feed.isFetchingNextPage}
        onRefresh={() => {
          void feed.restart();
        }}
        ListHeaderComponent={posts.length > 0 && feed.isError && !feed.isFetchNextPageError ? (
          <Pressable accessibilityRole="button" onPress={() => { void feed.restart(); }} style={[styles.banner, { backgroundColor: theme.secondary }]}>
            <Text style={[styles.bannerText, { color: theme.secondaryForeground }]}>Chưa tải được bài mới. Chạm để thử lại.</Text>
          </Pressable>
        ) : null}
        ListEmptyComponent={
          <View
            style={[
              styles.empty,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            {feed.isPending ? (
              <ActivityIndicator
                accessibilityLabel="Đang tải bài viết"
                size="large"
                color={theme.primary}
              />
            ) : feed.isError ? (
              <>
                <Text style={[styles.emptyTitle, { color: theme.foreground }]}>
                  Không tải được bảng tin
                </Text>
                <Text
                  style={[
                    styles.emptyDescription,
                    { color: theme.mutedForeground },
                  ]}
                >
                  Kiểm tra kết nối rồi thử lại.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void feed.restart();
                  }}
                  style={[styles.retry, { backgroundColor: theme.primary }]}
                >
                  <Text
                    style={[
                      styles.retryText,
                      { color: theme.primaryForeground },
                    ]}
                  >
                    Thử lại
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Image
                  source={require("@/assets/branding/avocado-sticker.png")}
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
                <Text style={[styles.emptyTitle, { color: theme.foreground }]}>
                  {filter === "blogs"
                    ? "Chưa có blog công khai"
                    : "Chưa có bài viết công khai"}
                </Text>
                <Text
                  style={[
                    styles.emptyDescription,
                    { color: theme.mutedForeground },
                  ]}
                >
                  Hãy quay lại sau để xem chia sẻ mới từ cộng đồng Vedora.
                </Text>
              </>
            )}
          </View>
        }
        ListFooterComponent={
          posts.length > 0 &&
          (feed.hasNextPage || feed.isFetchNextPageError) ? (
            <Pressable
              accessibilityRole="button"
              disabled={feed.isFetchingNextPage}
              onPress={() => {
                if (staleCursor) void feed.restart();
                else void feed.fetchNextPage();
              }}
              style={styles.footer}
            >
              {feed.isFetchingNextPage ? (
                <ActivityIndicator color={theme.primary} />
              ) : null}
              <Text style={[styles.footerText, { color: theme.primary }]}>
                {feed.isFetchNextPageError
                  ? staleCursor
                    ? "Danh sách đã thay đổi · Tải lại"
                    : "Tải tiếp thất bại · Thử lại"
                  : feed.isFetchingNextPage
                    ? "Đang tải thêm"
                    : "Tải thêm bài viết"}
              </Text>
            </Pressable>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: 64,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  logoFrame: {
    width: 40,
    height: 40,
    backgroundColor: BrandColors.forest,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 28, height: 28 },
  eyebrow: { fontFamily: Fonts.sansBold, fontSize: 10, letterSpacing: 1.5, lineHeight: 13 },
  accountButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: 38,
    justifyContent: "center",
  },
  accountText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  heading: { fontFamily: Fonts.headingBold, fontSize: 20, lineHeight: 26 },
  filters: { flexDirection: "row" },
  filter: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
    paddingHorizontal: Spacing.one,
  },
  filterText: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
  timeline: { width: "100%", maxWidth: 620, alignSelf: "center" },
  list: {
    width: "100%",
    paddingBottom: Spacing.five,
    flexGrow: 1,
  },
  empty: {
    marginTop: Spacing.five,
    marginHorizontal: Spacing.three,
    padding: Spacing.four,
    borderWidth: 1,
    borderRadius: Radius["2xl"],
    alignItems: "center",
    gap: Spacing.two,
  },
  emptyImage: { width: 110, height: 110 },
  emptyTitle: {
    fontFamily: Fonts.headingBold,
    fontSize: 17,
    textAlign: "center",
  },
  emptyDescription: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  retry: {
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    marginTop: Spacing.two,
  },
  retryText: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
  footer: {
    minHeight: 54,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.two,
  },
  footerText: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
  banner: { padding: Spacing.three, margin: Spacing.three, borderRadius: Radius.xl },
  bannerText: { fontFamily: Fonts.sansSemibold, textAlign: "center", fontSize: 13 },
});
