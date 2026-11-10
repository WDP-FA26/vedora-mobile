import { Image } from "expo-image";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";

import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { plainText } from "@/features/blogs/utils/markdown";
import { useSessionStore } from "@/shared/stores/session-store";

import { PostMenu } from "@/features/posts/components/post-menu";

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

function hashtagNodes(text: string, color: string, keyPrefix: string) {
  return text.split(/(#[^\s#]+)/g).map((part, index) => (
    <Text key={`${keyPrefix}${index}`} style={part.startsWith("#") ? { color } : undefined}>{part}</Text>
  ));
}

/**
 * A video post is saved as "title, blank line, description". The title is its own bold block and the
 * description sits right under it, so the blank line no longer shows as an empty row. Other posts are one block.
 */
function splitBody(body: string, isVideoPost: boolean) {
  if (!isVideoPost) return { title: null, description: body };
  const firstBreak = body.indexOf("\n");
  const titleEnd = firstBreak < 0 ? body.length : firstBreak;
  return { title: body.slice(0, titleEnd).trim(), description: body.slice(titleEnd).trim() };
}

export function PostCard({
  post,
  visible,
  detail = false,
  blogContent,
}: {
  post: FeedPost;
  visible: boolean;
  /** Rendered inside the post detail screen: no navigation to itself. */
  detail?: boolean;
  /** Detail screen only: the full article shown in place of the blog summary card. */
  blogContent?: ReactNode;
}) {
  const theme = useTheme();
  const dark = useColorScheme() === "dark";
  const accessToken = useSessionStore((state) => state.accessToken);
  const { like, bookmark, repost } = useFeedActions(post.id);
  const [expanded, setExpanded] = useState(false);
  const body = post.body?.trim() ?? "";
  const canExpand = body.length > 240 || body.split("\n").length > 5;
  const videos = post.media.filter((media) => media.type === "VIDEO");
  const imageCount = post.media.filter((media) => media.type === "IMAGE").length;
  const { title, description } = splitBody(body, videos.length > 0);
  const descriptionNodes = hashtagNodes(description, theme.primary, "d");

  function requireLogin(action: () => void) {
    if (accessToken) action();
    else router.push({ pathname: "/login", params: { returnTo: "/explore" } });
  }

  function openDetail() {
    if (!detail) router.push({ pathname: "/posts/[id]", params: { id: post.id } });
  }

  function openAuthor() {
    router.push({ pathname: "/profile/[id]", params: { id: post.author.id } });
  }

  return (
    <View
      style={[
        styles.post,
        { backgroundColor: theme.card, borderBottomColor: theme.border },
      ]}
    >
      <View style={styles.authorRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Xem hồ sơ ${post.author.fullName}`} onPress={openAuthor} style={styles.authorLink}>
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
        </Pressable>
        {post.type === "BLOG" ? (
          <View style={[styles.typePill, { backgroundColor: theme.secondary }]}>
            <SymbolView name={{ ios: "book.closed", android: "menu_book", web: "menu_book" }} size={14} tintColor={theme.primary} />
            <Text style={[styles.typeText, { color: theme.primary }]}>Blog</Text>
          </View>
        ) : null}
        <PostMenu postId={post.id} authorId={post.author.id} returnTo="/explore" />
      </View>

      <View style={styles.postContent}>
      {body && canExpand && !detail ? (
        <View>
          <Pressable onPress={openDetail} accessibilityRole="link" accessibilityLabel="Xem chi tiết bài viết">
            {title ? <Text numberOfLines={expanded ? undefined : 2} style={[styles.body, styles.videoTitle, { color: theme.foreground }]}>{title}</Text> : null}
            {description ? (
              <Text
                numberOfLines={expanded ? undefined : 4}
                style={[styles.body, title ? styles.videoDescription : null, { color: theme.foreground }]}
              >
                {descriptionNodes}
              </Text>
            ) : null}
          </Pressable>
          <Pressable
            onPress={() => setExpanded((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={expanded ? "Thu gọn bài viết" : "Xem thêm bài viết"}
            hitSlop={8}
          >
            <Text style={[styles.expand, { color: theme.primary }]}>
              {expanded ? "Thu gọn" : "Xem thêm"}
            </Text>
          </Pressable>
        </View>
      ) : body ? (
        <Pressable onPress={openDetail} disabled={detail} accessibilityRole={detail ? undefined : "link"} accessibilityLabel={detail ? undefined : "Xem chi tiết bài viết"}>
          {title ? <Text style={[styles.body, styles.videoTitle, { color: theme.foreground }]}>{title}</Text> : null}
          {description ? (
            <Text style={[styles.body, title ? styles.videoDescription : null, { color: theme.foreground }]}>
              {descriptionNodes}
            </Text>
          ) : null}
        </Pressable>
      ) : null}

      {post.blog && detail && blogContent ? blogContent : post.blog ? (
        <Pressable
          onPress={openDetail}
          disabled={detail}
          accessibilityRole={detail ? undefined : "link"}
          accessibilityLabel={detail ? undefined : `Xem chi tiết blog ${post.blog.title}`}
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
          ) : (
            <View style={[styles.blogPlaceholder, { backgroundColor: dark ? "#51322e" : "#f9d8ce" }]}>
              <SymbolView name={{ ios: "doc.text", android: "article", web: "article" }} size={30} tintColor={dark ? "#f0b6a9" : "#a87868"} />
            </View>
          )}
          <View style={styles.blogCopy}>
            <Text style={[styles.blogTitle, { color: theme.foreground }]}>
              {post.blog.title}
            </Text>
            {post.blog.excerpt ? (
              <Text
                numberOfLines={detail ? undefined : 2}
                style={[styles.excerpt, { color: theme.mutedForeground }]}
              >
                {plainText(post.blog.excerpt)}
              </Text>
            ) : null}
            {post.blog.recipes.length > 0 ? (
              <Text style={[styles.recipeCount, { color: theme.primary }]}>
                {post.blog.recipes.length} công thức liên quan
              </Text>
            ) : null}
          </View>
        </Pressable>
      ) : null}

      {videos.length > 0 || imageCount > 0 ? (
        <View style={styles.mediaGroup}>
          {videos.map((media) => (
            <FeedVideo key={media.id} media={media} visible={visible} />
          ))}
          {imageCount > 0 ? (
            <View accessible accessibilityLabel={`${imageCount} ảnh đính kèm chưa thể hiển thị`} style={[styles.imageUnavailable, { borderColor: theme.border, backgroundColor: theme.secondary }]}>
              <SymbolView name={{ ios: "photo", android: "image", web: "image" }} size={28} tintColor={theme.primary} />
              <Text style={[styles.imageUnavailableText, { color: theme.foreground }]}>Không thể hiển thị ảnh đính kèm</Text>
              {imageCount > 1 ? <Text style={[styles.imageUnavailableCount, { color: theme.mutedForeground }]}>{imageCount} ảnh</Text> : null}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.actions, { borderTopColor: theme.border }]} accessibilityRole="toolbar">
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
        <Pressable accessibilityRole="button" accessibilityLabel={`${post.commentCount} bình luận`} onPress={openDetail} style={styles.actionButton}>
          <SymbolView name={{ ios: "bubble.left", android: "chat_bubble", web: "chat_bubble" }} size={19} tintColor={theme.mutedForeground} />
          <Text style={[styles.stat, { color: theme.mutedForeground }]}>{formatCount(post.commentCount)}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={post.isReposted ? `Bỏ đăng lại, ${post.repostCount} lượt` : `Đăng lại, ${post.repostCount} lượt`}
          accessibilityState={{ selected: post.isReposted, disabled: repost.isPending }}
          disabled={repost.isPending}
          onPress={() => requireLogin(() => repost.mutate(!post.isReposted))}
          style={styles.actionButton}
        >
          <SymbolView name={{ ios: "arrow.2.squarepath", android: "repeat", web: "repeat" }} size={20} tintColor={post.isReposted ? theme.primary : theme.mutedForeground} />
          <Text style={[styles.stat, { color: post.isReposted ? theme.primary : theme.mutedForeground }]}>{formatCount(post.repostCount)}</Text>
        </Pressable>
        <View accessible accessibilityLabel={`${post.viewCount} lượt xem`} style={styles.statGroup}>
          <SymbolView name={{ ios: "chart.bar", android: "bar_chart", web: "bar_chart" }} size={18} tintColor={theme.mutedForeground} />
          <Text style={[styles.stat, { color: theme.mutedForeground }]}>{formatCount(post.viewCount)}</Text>
        </View>
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
      {like.isError || bookmark.isError || repost.isError ? (
        <Text
          accessibilityRole="alert"
          style={[styles.actionError, { color: theme.destructive }]}
        >
          Không thể cập nhật bài viết. Vui lòng thử lại.
        </Text>
      ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  post: {
    width: "100%",
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
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
  authorLink: { flex: 1, flexDirection: "row", alignItems: "center", gap: Spacing.two, minWidth: 0 },
  authorDetails: { flex: 1, minWidth: 0 },
  postContent: { marginLeft: 52 },
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
  body: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22, marginTop: Spacing.three },
  videoTitle: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 24 },
  videoDescription: { marginTop: Spacing.half },
  expand: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 13,
    marginTop: Spacing.one,
  },
  blogCard: { borderWidth: 1, borderRadius: Radius["2xl"], overflow: "hidden", marginTop: Spacing.three },
  blogCover: { width: "100%", aspectRatio: 1.91 },
  blogPlaceholder: { width: "100%", aspectRatio: 1.91, alignItems: "center", justifyContent: "center" },
  blogCopy: { padding: Spacing.three, gap: Spacing.one },
  blogTitle: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 24 },
  excerpt: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  recipeCount: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 12,
    marginTop: Spacing.one,
  },
  mediaGroup: { gap: Spacing.two, marginTop: Spacing.three },
  imageUnavailable: { width: "100%", aspectRatio: 16 / 10, borderRadius: Radius["2xl"], borderWidth: 1, alignItems: "center", justifyContent: "center", gap: Spacing.one },
  imageUnavailableText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  imageUnavailableCount: { fontFamily: Fonts.sans, fontSize: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.three, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.one },
  statGroup: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: Spacing.one },
  actionButton: {
    minWidth: 40,
    minHeight: 40,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.one,
  },
  stat: { fontFamily: Fonts.sansMedium, fontSize: 12 },
  actionError: { fontFamily: Fonts.sans, fontSize: 12, paddingBottom: Spacing.two },
});
