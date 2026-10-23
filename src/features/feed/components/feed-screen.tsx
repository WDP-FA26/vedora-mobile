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
  useColorScheme,
  type ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";

import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/shared/api/api-error";
import { useSessionStore } from "@/shared/stores/session-store";

import { useSignOut } from "@/features/auth/hooks/use-auth-actions";
import { FollowingScreen } from "@/features/following/components/following-screen";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { useExploreTabBarScroll } from "@/features/navigation/hooks/use-explore-tab-bar-scroll";
import { getShowcasePosts, type ShowcasePost } from "../data/showcase-posts";
import { useComposeActions } from "../hooks/use-compose-actions";
import { useFeed } from "../hooks/use-feed";
import type { FeedFilter, FeedPost } from "../types/feed.schema";
import { ComposeDialog } from "./compose-dialog";
import { PostCard } from "./post-card";
import { ShowcasePostCard } from "./showcase-post-card";

type FeedItem =
  | { key: string; kind: "live"; post: FeedPost }
  | { key: string; kind: "showcase"; post: ShowcasePost };

const filters: { value: FeedFilter | "following"; label: string }[] = [
  { value: "all", label: "Dành cho bạn" },
  { value: "following", label: "Đang theo dõi" },
  { value: "blogs", label: "Blog" },
];
const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

export function FeedScreen() {
  const theme = useTheme();
  const isDark = useColorScheme() === "dark";
  const accessToken = useSessionStore((state) => state.accessToken);
  const displayName = useSessionStore((state) => state.displayName);
  const signOut = useSignOut();
  const compose = useComposeActions();
  const [filter, setFilter] = useState<FeedFilter | "following">("all");
  const [accountOpen, setAccountOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<"choose" | "video">("choose");
  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set());
  const { onScroll: onHomeScroll, reset: resetHomeScroll } = useExploreTabBarScroll();
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<FeedItem>[] }) => {
      setVisibleIds(new Set(viewableItems.map((item) => item.item.key)));
    },
    [],
  );
  const apiFilter = filter === "following" ? "all" : filter;
  const feed = useFeed(apiFilter, filter !== "following");
  const staleCursor = feed.isFetchNextPageError && feed.error instanceof ApiError && feed.error.status === 400;
  const posts =
    feed.data?.pages.flatMap((page) =>
      page.items.filter((post) => post.status === "PUBLISHED"),
    ) ?? [];
  const showcase = feed.data && posts.length === 0 && !feed.hasNextPage
    ? getShowcasePosts(apiFilter)
    : [];
  const items: FeedItem[] = [
    ...posts.map((post) => ({ key: `live:${post.id}`, kind: "live" as const, post })),
    ...showcase.map((post) => ({ key: `showcase:${post.id}`, kind: "showcase" as const, post })),
  ];

  function openComposer(mode: "choose" | "video") {
    if (!accessToken) {
      router.push({ pathname: "/login", params: { returnTo: "/explore" } });
      return;
    }
    setComposerMode(mode);
    setComposerOpen(true);
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        <View style={styles.headerTop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mở menu tài khoản"
            accessibilityState={{ expanded: accountOpen }}
            onPress={() => setAccountOpen((open) => !open)}
            style={[styles.accountAvatar, { backgroundColor: theme.secondary, borderColor: theme.border }]}
          >
            <Text style={[styles.accountInitial, { color: theme.secondaryForeground }]}>
              {displayName?.trim().charAt(0).toUpperCase() || "V"}
            </Text>
          </Pressable>
          <View style={[styles.wordmarkFrame, isDark && styles.wordmarkDark]}>
            <Image
              source={require("@/assets/branding/logo.png")}
              style={styles.wordmark}
              resizeMode="contain"
              accessibilityLabel="Vedora"
            />
          </View>
          <NotificationBell />
        </View>
        {accountOpen ? (
          <View style={[styles.accountMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.menuTitle, { color: theme.foreground }]}>
              {accessToken ? displayName || "Tài khoản Vedora" : "Chào bạn đến Vedora"}
            </Text>
            <Text style={[styles.menuDescription, { color: theme.mutedForeground }]}>
              {accessToken ? "Đang xem trang Khám phá" : "Đăng nhập để thả mầm và lưu bài viết"}
            </Text>
            {accessToken ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: signOut.isPending }}
                disabled={signOut.isPending}
                onPress={() => { setAccountOpen(false); signOut.mutate(); }}
                style={[styles.menuAction, { backgroundColor: theme.secondary }]}
              >
                <Text style={[styles.menuActionText, { color: theme.secondaryForeground }]}>
                  {signOut.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.guestActions}>
                <Pressable accessibilityRole="button" onPress={() => router.push("/login")} style={[styles.menuAction, { backgroundColor: theme.primary }]}>
                  <Text style={[styles.menuActionText, { color: theme.primaryForeground }]}>Đăng nhập</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => router.push("/register")} style={[styles.menuAction, { backgroundColor: theme.secondary }]}>
                  <Text style={[styles.menuActionText, { color: theme.secondaryForeground }]}>Tạo tài khoản</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : null}
        {signOut.isError ? (
          <Text accessibilityRole="alert" style={[styles.signOutError, { color: theme.destructive }]}>
            Đã thoát trên thiết bị, nhưng chưa thể thu hồi phiên trên máy chủ.
          </Text>
        ) : null}
        <View style={styles.filters} accessibilityRole="tablist">
          {filters.map((item) => (
            <Pressable
              key={item.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: filter === item.value }}
              onPress={() => {
                resetHomeScroll();
                setFilter(item.value);
              }}
              style={[styles.filter, { borderBottomColor: filter === item.value ? theme.primary : "transparent" }]}
            >
              <Text style={[styles.filterText, { color: filter === item.value ? theme.primary : theme.mutedForeground }]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {filter === "following" ? <FollowingScreen onScroll={onHomeScroll} /> : <FlatList
        key={filter}
        style={styles.timeline}
        onScroll={onHomeScroll}
        scrollEventThrottle={16}
        data={items}
        keyExtractor={(item) => item.key}
        extraData={visibleIds}
        renderItem={({ item }) => item.kind === "live" ? (
          <PostCard post={item.post} visible={visibleIds.size === 0 || visibleIds.has(item.key)} />
        ) : <ShowcasePostCard post={item.post} />}
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
        ListHeaderComponent={
          <View>
            <View style={[styles.composer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.composerTop}>
                <View style={[styles.composerAvatar, { backgroundColor: theme.secondary }]}>
                  <Text style={[styles.composerInitial, { color: theme.secondaryForeground }]}>{displayName?.trim().charAt(0).toUpperCase() || "V"}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tạo nội dung"
                  onPress={() => openComposer("choose")}
                  style={[styles.composerPrompt, { backgroundColor: theme.background, borderColor: theme.border }]}
                >
                  <Text numberOfLines={1} style={[styles.composerPromptText, { color: theme.mutedForeground }]}>Chia sẻ cách nấu món chay của bạn</Text>
                </Pressable>
              </View>
              <View style={[styles.composerBottom, { borderTopColor: theme.border }]}>
                <Pressable accessibilityRole="button" onPress={() => openComposer("video")} style={styles.videoShortcut}>
                  <SymbolView name={{ ios: "video", android: "videocam", web: "videocam" }} size={18} tintColor={theme.primary} />
                  <Text style={[styles.videoShortcutText, { color: theme.primary }]}>Thêm video</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => openComposer("choose")} style={styles.videoShortcut}>
                  <SymbolView name={{ ios: "square.and.pencil", android: "edit", web: "edit" }} size={17} tintColor={theme.primary} />
                  <Text style={[styles.videoShortcutText, { color: theme.primary }]}>Tạo nội dung</Text>
                </Pressable>
              </View>
            </View>
            {items.length > 0 && feed.isError && !feed.isFetchNextPageError ? (
              <Pressable accessibilityRole="button" onPress={() => { void feed.restart(); }} style={[styles.banner, { backgroundColor: theme.secondary }]}>
                <Text style={[styles.bannerText, { color: theme.secondaryForeground }]}>Chưa tải được bài mới. Chạm để thử lại.</Text>
              </Pressable>
            ) : null}
          </View>
        }
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
      />}
      <ComposeDialog
        visible={composerOpen}
        initialMode={composerMode}
        authorName={displayName}
        onClose={() => { compose.discardDraftUpload(); setComposerOpen(false); }}
        onPickVideo={compose.pickVideo}
        onRemoveVideo={compose.removeVideo}
        onPublishVideo={compose.publishVideo}
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
    minHeight: 58,
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  accountInitial: { fontFamily: Fonts.headingBold, fontSize: 16 },
  wordmarkFrame: { paddingHorizontal: 3, paddingVertical: 2, borderRadius: Radius.md },
  wordmarkDark: { backgroundColor: "#fffefa" },
  wordmark: { width: 105, height: 38 },
  headerSpacer: { width: 40, height: 40 },
  accountMenu: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius["2xl"],
    padding: Spacing.three,
    gap: Spacing.one,
  },
  menuTitle: { fontFamily: Fonts.headingBold, fontSize: 15 },
  menuDescription: { fontFamily: Fonts.sans, fontSize: 13 },
  guestActions: { flexDirection: "row", gap: Spacing.two, marginTop: Spacing.two },
  menuAction: {
    alignSelf: "flex-start",
    borderRadius: Radius.xl,
    minHeight: 38,
    paddingHorizontal: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.two,
  },
  menuActionText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  signOutError: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.two, fontFamily: Fonts.sans, fontSize: 12 },
  filters: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    flexDirection: "row",
    paddingHorizontal: Spacing.two,
  },
  filter: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    paddingHorizontal: Spacing.one,
  },
  filterText: { fontFamily: Fonts.sansSemibold, fontSize: 14, textAlign: "center" },
  timeline: { width: "100%", maxWidth: 620, alignSelf: "center" },
  list: {
    width: "100%",
    paddingBottom: Spacing.five,
    flexGrow: 1,
  },
  composer: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius["2xl"],
    padding: Spacing.three,
  },
  composerTop: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  composerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  composerInitial: { fontFamily: Fonts.headingBold, fontSize: 16 },
  composerPrompt: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: Spacing.three,
    justifyContent: "center",
  },
  composerPromptText: { fontFamily: Fonts.sans, fontSize: 13 },
  composerBottom: {
    borderTopWidth: 1,
    marginTop: Spacing.three,
    paddingTop: Spacing.two,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  videoShortcut: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: Spacing.two },
  videoShortcutText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
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
