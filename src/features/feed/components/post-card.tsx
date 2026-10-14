import { Image } from "expo-image";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useSessionStore } from "@/shared/stores/session-store";

import { useFeedActions } from "../hooks/use-feed";
import type { FeedPost } from "../types/feed.schema";
import { FeedVideo } from "./feed-video";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function PostCard({
  post,
  visible,
}: {
  post: FeedPost;
  visible: boolean;
}) {
  const theme = useTheme();
  const accessToken = useSessionStore((state) => state.accessToken);
  const { like, bookmark } = useFeedActions(post.id);
  const [expanded, setExpanded] = useState(false);
  const body = post.body?.trim() ?? "";
  const canExpand = body.length > 240 || body.split("\n").length > 5;
  const videos = post.media.filter((media) => media.type === "VIDEO");

  function requireLogin(action: () => void) {
    if (accessToken) action();
    else router.push({ pathname: "/login", params: { returnTo: "/explore" } });
  }

  return (
    <View
      style={[
        styles.post,
        { backgroundColor: theme.card, borderBottomColor: theme.border },
      ]}
    >
      <View style={styles.authorRow}>
        {post.author.avatarUrl ? (
          <Image
            source={{ uri: post.author.avatarUrl }}
            style={[styles.avatar, { backgroundColor: theme.secondary }]}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.secondary }]}>
            <Text
              style={[styles.initial, { color: theme.secondaryForeground }]}
            >
              {post.author.fullName.trim().charAt(0).toUpperCase() || "V"}
            </Text>
          </View>
        )}
        <View style={styles.authorDetails}>
          <Text
            numberOfLines={1}
            style={[styles.authorName, { color: theme.foreground }]}
          >
            {post.author.fullName}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.meta, { color: theme.mutedForeground }]}
          >
            @{post.author.username} ·{" "}
            {formatDate(post.publishedAt ?? post.createdAt)}
          </Text>
        </View>
        {post.type === "BLOG" ? (
          <View style={[styles.typePill, { backgroundColor: theme.secondary }]}>
            <SymbolView name={{ ios: "book.closed", android: "menu_book", web: "menu_book" }} size={14} tintColor={theme.primary} />
            <Text style={[styles.typeText, { color: theme.primary }]}>Blog</Text>
          </View>
        ) : null}
      </View>

      {body && canExpand ? (
        <Pressable
          onPress={() => setExpanded((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel={
            expanded ? "Thu gọn bài viết" : "Xem thêm bài viết"
          }
        >
          <Text
            numberOfLines={expanded ? undefined : 4}
            style={[styles.body, { color: theme.foreground }]}
          >
            {body}
          </Text>
          <Text style={[styles.expand, { color: theme.primary }]}>
            {expanded ? "Thu gọn" : "Xem thêm"}
          </Text>
        </Pressable>
      ) : body ? (
        <Text style={[styles.body, { color: theme.foreground }]}>{body}</Text>
      ) : null}

      {post.blog ? (
        <View
          style={[
            styles.blogCard,
            { borderColor: theme.border, backgroundColor: theme.background },
          ]}
        >
          {post.blog.coverImageUrl ? (
            <Image
              source={{ uri: post.blog.coverImageUrl }}
              style={styles.blogCover}
              contentFit="cover"
            />
          ) : null}
          <View style={styles.blogCopy}>
            <Text style={[styles.blogTitle, { color: theme.foreground }]}>
              {post.blog.title}
            </Text>
            {post.blog.excerpt ? (
              <Text
                numberOfLines={2}
                style={[styles.excerpt, { color: theme.mutedForeground }]}
              >
                {post.blog.excerpt}
              </Text>
            ) : null}
            {post.blog.recipes.length > 0 ? (
              <Text style={[styles.recipeCount, { color: theme.primary }]}>
                {post.blog.recipes.length} công thức liên quan
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {videos.length > 0 ? (
        <View style={styles.mediaGroup}>
          {videos.map((media) => (
            <FeedVideo key={media.id} media={media} visible={visible} />
          ))}
        </View>
      ) : null}

      <View style={styles.actions} accessibilityRole="toolbar">
        <View accessible accessibilityLabel={`${post.commentCount} bình luận`} style={styles.statGroup}>
          <SymbolView name={{ ios: "bubble.left", android: "chat_bubble", web: "chat_bubble" }} size={19} tintColor={theme.mutedForeground} />
          <Text style={[styles.stat, { color: theme.mutedForeground }]}>{formatCount(post.commentCount)}</Text>
        </View>
        <View accessible accessibilityLabel={`${post.repostCount} lượt đăng lại`} style={styles.statGroup}>
          <SymbolView name={{ ios: "arrow.2.squarepath", android: "repeat", web: "repeat" }} size={20} tintColor={theme.mutedForeground} />
          <Text style={[styles.stat, { color: theme.mutedForeground }]}>{formatCount(post.repostCount)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            post.isLiked
              ? `Bỏ thả mầm, ${post.likeCount} lượt`
              : `Thả mầm, ${post.likeCount} lượt`
          }
          accessibilityState={{
            selected: post.isLiked,
            disabled: like.isPending,
          }}
          disabled={like.isPending}
          onPress={() => requireLogin(() => like.mutate(!post.isLiked))}
          style={styles.actionButton}
        >
          <SymbolView name={{ ios: post.isLiked ? "leaf.fill" : "leaf", android: "eco", web: "eco" }} size={21} tintColor={post.isLiked ? theme.primary : theme.mutedForeground} />
          <Text style={[styles.stat, { color: post.isLiked ? theme.primary : theme.mutedForeground }]}>{formatCount(post.likeCount)}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            post.isBookmarked ? "Bỏ lưu bài viết" : "Lưu bài viết"
          }
          accessibilityState={{
            selected: post.isBookmarked,
            disabled: bookmark.isPending,
          }}
          disabled={bookmark.isPending}
          onPress={() =>
            requireLogin(() => bookmark.mutate(!post.isBookmarked))
          }
          style={styles.actionButton}
        >
          <SymbolView name={{ ios: post.isBookmarked ? "bookmark.fill" : "bookmark", android: "bookmark", web: "bookmark" }} size={20} tintColor={post.isBookmarked ? theme.primary : theme.mutedForeground} />
        </Pressable>
      </View>
      {like.isError || bookmark.isError ? (
        <Text
          accessibilityRole="alert"
          style={[styles.actionError, { color: theme.destructive }]}
        >
          Không thể cập nhật bài viết. Vui lòng thử lại.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  post: {
    width: "100%",
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  authorRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontFamily: Fonts.headingBold, fontSize: 19 },
  authorDetails: { flex: 1, minWidth: 0 },
  authorName: { fontFamily: Fonts.sansSemibold, fontSize: 15, lineHeight: 21 },
  meta: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  typeText: { fontFamily: Fonts.sansSemibold, fontSize: 11 },
  body: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 23, marginTop: Spacing.three },
  expand: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 13,
    marginTop: Spacing.one,
  },
  blogCard: { borderWidth: 1, borderRadius: Radius.xl, overflow: "hidden", marginTop: Spacing.three },
  blogCover: { width: "100%", aspectRatio: 16 / 9 },
  blogCopy: { padding: Spacing.three, gap: Spacing.one },
  blogTitle: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 24 },
  excerpt: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  recipeCount: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 12,
    marginTop: Spacing.one,
  },
  mediaGroup: { gap: Spacing.two, marginTop: Spacing.three },
  actions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.two },
  statGroup: { minHeight: 40, minWidth: 48, flexDirection: "row", alignItems: "center", gap: Spacing.one },
  actionButton: {
    minWidth: 48,
    minHeight: 40,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.one,
  },
  stat: { fontFamily: Fonts.sansMedium, fontSize: 12 },
  actionError: { fontFamily: Fonts.sans, fontSize: 12, paddingBottom: Spacing.two },
});
