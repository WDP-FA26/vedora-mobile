import { router } from "expo-router";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from "react-native";

import { Fonts, Radius, Spacing } from "@/constants/theme";
import { PostCard } from "@/features/feed/components/post-card";
import type { FeedPost } from "@/features/feed/types/feed.schema";
import { SuggestionsRow } from "@/features/profile/components/suggestions-row";
import { useTheme } from "@/hooks/use-theme";

import { useFollowingFeed } from "../hooks/use-following-feed";

const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

/** Content for the Explore "Đang theo dõi" tab. The parent owns the app header. */
export function FollowingScreen({ onScroll }: { onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void }) {
  const theme = useTheme();
  const feed = useFollowingFeed();
  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set());
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<FeedPost>[] }) => {
      setVisibleIds(new Set(viewableItems.map((item) => item.item.id)));
    },
    [],
  );

  return (
    <FlatList
      style={[styles.timeline, { backgroundColor: theme.background }]}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={styles.list}
      data={feed.posts}
      keyExtractor={(post) => post.id}
      extraData={visibleIds}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          visible={visibleIds.size === 0 || visibleIds.has(item.id)}
        />
      )}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      refreshing={Boolean(feed.accessToken) && feed.refreshing}
      onRefresh={feed.accessToken ? feed.refresh : undefined}
      ListHeaderComponent={
        <View>
          <View style={[styles.intro, { backgroundColor: theme.secondary }]}>
            <View style={[styles.introIcon, { backgroundColor: theme.card }]}>
              <SymbolView
                name={{ ios: "person.2.fill", android: "group", web: "group" }}
                size={22}
                tintColor={theme.primary}
              />
            </View>
            <View style={styles.introCopy}>
              <Text style={[styles.introTitle, { color: theme.foreground }]}>Đang theo dõi</Text>
              <Text style={[styles.introDescription, { color: theme.mutedForeground }]}>
                Bài viết mới từ những người bạn quan tâm
              </Text>
            </View>
          </View>

          <SuggestionsRow />

          {feed.authors.length > 0 ? (
            <View style={styles.creators}>
              <View style={styles.sectionTop}>
                <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Người bạn theo dõi</Text>
                <Text style={[styles.sectionCount, { color: theme.mutedForeground }]}>
                  {feed.authors.length} tác giả
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.creatorList}
                accessibilityLabel="Danh sách người đang theo dõi"
              >
                {feed.authors.map((author) => (
                  <View key={author.id} style={styles.creator} accessible accessibilityLabel={`${author.fullName}, @${author.username}`}>
                    {author.avatarUrl ? (
                      <Image source={{ uri: author.avatarUrl }} style={[styles.creatorAvatar, { backgroundColor: theme.secondary }]} contentFit="cover" />
                    ) : (
                      <View style={[styles.creatorAvatar, { backgroundColor: theme.secondary }]}>
                        <Text style={[styles.creatorInitial, { color: theme.primary }]}>
                          {author.fullName.trim().charAt(0).toUpperCase() || "V"}
                        </Text>
                      </View>
                    )}
                    <Text numberOfLines={1} style={[styles.creatorName, { color: theme.foreground }]}>
                      {author.fullName}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {feed.posts.length > 0 ? (
            <View style={[styles.sectionTop, styles.postsTitle]}>
              <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Bài viết gần đây</Text>
            </View>
          ) : null}

          {feed.error && feed.posts.length > 0 ? (
            <View style={[styles.errorBanner, { borderColor: theme.border, backgroundColor: theme.card }]}>
              <Text style={[styles.errorBannerText, { color: theme.foreground }]}>
                Một số bài viết chưa tải được.
              </Text>
              <Pressable accessibilityRole="button" onPress={feed.retry} style={styles.errorRetry}>
                <Text style={[styles.errorRetryText, { color: theme.primary }]}>Thử lại</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View style={[styles.empty, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {!feed.accessToken ? (
            <>
              <SymbolView name={{ ios: "person.crop.circle.badge.plus", android: "person_add", web: "person_add" }} size={34} tintColor={theme.primary} />
              <Text style={[styles.emptyTitle, { color: theme.foreground }]}>Cập nhật từ người bạn quan tâm</Text>
              <Text style={[styles.emptyDescription, { color: theme.mutedForeground }]}>
                Đăng nhập để xem bài viết từ những người bạn theo dõi.
              </Text>
              <Pressable accessibilityRole="button" onPress={() => router.push("/login")} style={[styles.action, { backgroundColor: theme.primary }]}>
                <Text style={[styles.actionText, { color: theme.primaryForeground }]}>Đăng nhập</Text>
              </Pressable>
            </>
          ) : feed.loading ? (
            <>
              <ActivityIndicator size="large" color={theme.primary} accessibilityLabel="Đang tải bài viết" />
              <Text style={[styles.emptyDescription, { color: theme.mutedForeground }]}>Đang tải bài viết mới...</Text>
            </>
          ) : feed.error ? (
            <>
              <SymbolView name={{ ios: "wifi.exclamationmark", android: "wifi_off", web: "wifi_off" }} size={32} tintColor={theme.destructive} />
              <Text style={[styles.emptyTitle, { color: theme.foreground }]}>Chưa tải được bảng tin</Text>
              <Text style={[styles.emptyDescription, { color: theme.mutedForeground }]}>Kiểm tra kết nối rồi thử lại.</Text>
              <Pressable accessibilityRole="button" onPress={feed.retry} style={[styles.action, { backgroundColor: theme.primary }]}>
                <Text style={[styles.actionText, { color: theme.primaryForeground }]}>Thử lại</Text>
              </Pressable>
            </>
          ) : feed.authors.length === 0 ? (
            <>
              <SymbolView name={{ ios: "person.2", android: "group", web: "group" }} size={34} tintColor={theme.primary} />
              <Text style={[styles.emptyTitle, { color: theme.foreground }]}>Chưa theo dõi ai</Text>
              <Text style={[styles.emptyDescription, { color: theme.mutedForeground }]}>
                Khi bạn theo dõi tác giả, chia sẻ mới của họ sẽ xuất hiện ở đây.
              </Text>
            </>
          ) : (
            <>
              <SymbolView name={{ ios: "leaf", android: "eco", web: "eco" }} size={34} tintColor={theme.primary} />
              <Text style={[styles.emptyTitle, { color: theme.foreground }]}>Chưa có bài viết mới</Text>
              <Text style={[styles.emptyDescription, { color: theme.mutedForeground }]}>
                Những người bạn theo dõi chưa có chia sẻ công khai gần đây.
              </Text>
            </>
          )}
        </View>
      }
      ListFooterComponent={feed.hasMoreAuthors ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: feed.loadingMoreAuthors }}
          disabled={feed.loadingMoreAuthors}
          onPress={() => { void feed.loadMoreAuthors(); }}
          style={styles.more}
        >
          {feed.loadingMoreAuthors ? <ActivityIndicator color={theme.primary} /> : null}
          <Text style={[styles.moreText, { color: theme.primary }]}>
            {feed.loadingMoreAuthors ? "Đang tải thêm" : "Tải thêm người theo dõi"}
          </Text>
        </Pressable>
      ) : null}
    />
  );
}

const styles = StyleSheet.create({
  timeline: { flex: 1, width: "100%", maxWidth: 620, alignSelf: "center" },
  list: { flexGrow: 1, paddingBottom: Spacing.five },
  intro: { marginHorizontal: Spacing.three, marginTop: Spacing.three, marginBottom: Spacing.four, borderRadius: Radius["2xl"], padding: Spacing.three, flexDirection: "row", alignItems: "center", gap: Spacing.three },
  introIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  introCopy: { flex: 1 },
  introTitle: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 23 },
  introDescription: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18, marginTop: 2 },
  creators: { paddingBottom: Spacing.three },
  sectionTop: { marginHorizontal: Spacing.three, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.two },
  sectionTitle: { fontFamily: Fonts.headingBold, fontSize: 15 },
  sectionCount: { fontFamily: Fonts.sans, fontSize: 12 },
  creatorList: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, gap: Spacing.three },
  creator: { width: 76, alignItems: "center", gap: Spacing.one },
  creatorAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  creatorInitial: { fontFamily: Fonts.headingBold, fontSize: 20 },
  creatorName: { fontFamily: Fonts.sansMedium, fontSize: 11, textAlign: "center", width: "100%" },
  postsTitle: { paddingTop: Spacing.two, paddingBottom: Spacing.one },
  errorBanner: { margin: Spacing.three, borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.three, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.two },
  errorBannerText: { flex: 1, fontFamily: Fonts.sans, fontSize: 13 },
  errorRetry: { minHeight: 36, justifyContent: "center" },
  errorRetryText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  empty: { marginHorizontal: Spacing.three, marginTop: Spacing.two, padding: Spacing.four, borderWidth: 1, borderRadius: Radius["2xl"], alignItems: "center", gap: Spacing.two },
  emptyTitle: { fontFamily: Fonts.headingBold, fontSize: 17, textAlign: "center" },
  emptyDescription: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20, textAlign: "center" },
  action: { minHeight: 42, marginTop: Spacing.one, borderRadius: Radius.xl, paddingHorizontal: Spacing.four, justifyContent: "center" },
  actionText: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
  more: { flexDirection: "row", minHeight: 56, alignItems: "center", justifyContent: "center", gap: Spacing.two },
  moreText: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
});
