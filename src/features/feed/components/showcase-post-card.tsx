import { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";

import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import type { ShowcasePost, ShowcaseTone } from "../data/showcase-posts";

const toneColors: Record<ShowcaseTone, { light: string; dark: string; ink: string }> = {
  basil: { light: "#c9ebd3", dark: "#244631", ink: "#3b8b59" },
  sage: { light: "#d9efe8", dark: "#244139", ink: "#538c76" },
  tomato: { light: "#fbd9d1", dark: "#51322e", ink: "#b77565" },
  grain: { light: "#f8e8c7", dark: "#4c4029", ink: "#a78c5a" },
  beet: { light: "#f1d6e5", dark: "#4d2d42", ink: "#a36c8a" },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatCount(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function ShowcasePostCard({ post }: { post: ShowcasePost }) {
  const theme = useTheme();
  const dark = useColorScheme() === "dark";
  const avatarTone = toneColors[post.author.tone];

  return (
    <View style={[styles.post, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.postRow}>
        <View
          accessible
          accessibilityLabel={post.author.name}
          style={[styles.avatar, { backgroundColor: dark ? avatarTone.dark : avatarTone.light }]}
        >
          <Text style={[styles.avatarInitials, { color: dark ? theme.foreground : avatarTone.ink }]}>
            {post.author.initials}
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.authorLine}>
            <Text numberOfLines={1} style={[styles.authorName, { color: theme.foreground }]}>
              {post.author.name}
            </Text>
            {post.author.verified ? (
              <View accessible accessibilityLabel="Tài khoản đã xác minh" style={styles.verified}>
                <Text style={styles.verifiedCheck}>✓</Text>
              </View>
            ) : null}
          </View>
          <Text numberOfLines={1} style={[styles.meta, { color: theme.mutedForeground }]}>
            @{post.author.handle} · {formatDate(post.publishedAt)}
          </Text>

          <Text style={[styles.body, { color: theme.foreground }]}>
            {post.body}
            {post.tags.length > 0 ? (
              <Text style={{ color: theme.primary }}> {post.tags.map((tag) => `#${tag}`).join(" ")}</Text>
            ) : null}
          </Text>

          {post.kind === "video" ? (
            <PastelMedia
              tone={post.video.tone}
              kind="video"
              label={post.video.caption}
              duration={post.video.duration}
              dark={dark}
            />
          ) : null}

          {post.kind === "article" ? (
            <View style={[styles.articleCard, { borderColor: theme.border }]}>
              <PastelMedia
                tone={post.article.tone}
                kind="article"
                label={post.article.title}
                dark={dark}
                flush
              />
              <View style={[styles.articleCopy, { backgroundColor: theme.card }]}>
                <Text style={[styles.articleTitle, { color: theme.foreground }]}>
                  {post.article.title}
                </Text>
                <Text style={[styles.articleSource, { color: theme.mutedForeground }]}>
                  {post.article.source}
                </Text>
              </View>
            </View>
          ) : null}

          {post.kind === "photo" ? (
            <View style={[styles.photoGrid, { borderColor: theme.border }]}>
              {post.photos.map((photo) => (
                <View key={photo.alt} style={styles.photoCell}>
                  <PastelMedia
                    tone={photo.tone}
                    kind="photo"
                    label={photo.alt}
                    dark={dark}
                    photoCount={post.photos.length}
                    flush
                  />
                </View>
              ))}
            </View>
          ) : null}

          <View style={[styles.stats, { borderTopColor: theme.border }]}>
            <Stat name={{ ios: "bubble.left", android: "chat_bubble", web: "chat_bubble" }} count={post.stats.comments} color={theme.mutedForeground} label="bình luận" />
            <Stat name={{ ios: "arrow.2.squarepath", android: "repeat", web: "repeat" }} count={post.stats.reposts} color={theme.mutedForeground} label="đăng lại" />
            <Stat name={{ ios: "leaf", android: "eco", web: "eco" }} count={post.stats.sprouts} color={theme.mutedForeground} label="thả mầm" />
            <Stat name={{ ios: "chart.bar", android: "bar_chart", web: "bar_chart" }} count={post.stats.views} color={theme.mutedForeground} label="lượt xem" />
          </View>
        </View>
      </View>
    </View>
  );
}

function PastelMedia({ tone, kind, label, duration, dark, photoCount, flush = false }: {
  tone: ShowcaseTone;
  kind: "video" | "article" | "photo";
  label: string;
  duration?: string;
  dark: boolean;
  photoCount?: number;
  flush?: boolean;
}) {
  const color = toneColors[tone];
  const symbol = kind === "video"
    ? { ios: "play.rectangle", android: "smart_display", web: "smart_display" } as const
    : kind === "article"
      ? { ios: "doc.text", android: "description", web: "description" } as const
      : { ios: "photo", android: "image", web: "image" } as const;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={kind === "video" ? `${label}, thời lượng ${duration}` : label}
      style={[
        styles.media,
        kind === "photo" ? (photoCount === 1 ? styles.singlePhoto : styles.pairedPhoto) : styles.landscape,
        { backgroundColor: dark ? color.dark : color.light },
        !flush && styles.standaloneMedia,
      ]}
    >
      <View style={[styles.softCircle, { backgroundColor: dark ? "#ffffff0a" : "#ffffff42" }]} />
      <SymbolView name={symbol} size={30} tintColor={dark ? "#ffffff88" : color.ink} />
      {kind === "video" ? (
        <>
          <View style={styles.videoCaption}>
            <SymbolView name={{ ios: "play.rectangle", android: "smart_display", web: "smart_display" }} size={13} tintColor="#255d32" />
            <Text style={styles.videoCaptionText}>{label}</Text>
          </View>
          <View style={styles.durationPill}>
            <Text style={styles.durationText}>{duration}</Text>
          </View>
        </>
      ) : null}
      {kind === "photo" ? (
        <View style={styles.photoCaption}>
          <Text numberOfLines={1} style={styles.photoCaptionText}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Stat({ name, count, color, label }: {
  name: ComponentProps<typeof SymbolView>["name"];
  count: number;
  color: string;
  label: string;
}) {
  return (
    <View accessible accessibilityLabel={`${formatCount(count)} ${label}`} style={styles.stat}>
      <SymbolView name={name} size={15} tintColor={color} />
      <Text style={[styles.statText, { color }]}>{formatCount(count)}</Text>
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
  postRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.two },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontFamily: Fonts.sansSemibold, fontSize: 12 },
  content: { flex: 1, minWidth: 0 },
  authorLine: { flexDirection: "row", alignItems: "center", gap: 5 },
  authorName: { flexShrink: 1, fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 20 },
  verified: { width: 15, height: 15, borderRadius: 8, backgroundColor: "#255d32", alignItems: "center", justifyContent: "center" },
  verifiedCheck: { color: "#ffffff", fontSize: 10, lineHeight: 14, fontFamily: Fonts.sansBold },
  meta: { fontFamily: Fonts.sans, fontSize: 11, lineHeight: 16 },
  body: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21, marginTop: Spacing.two },
  media: { width: "100%", overflow: "hidden", alignItems: "center", justifyContent: "center" },
  standaloneMedia: { marginTop: Spacing.three, borderRadius: Radius.xl },
  landscape: { aspectRatio: 16 / 9 },
  singlePhoto: { aspectRatio: 16 / 10 },
  pairedPhoto: { aspectRatio: 4 / 5 },
  softCircle: { position: "absolute", width: "65%", aspectRatio: 1, borderRadius: 999, top: "-35%", right: "-18%" },
  videoCaption: { position: "absolute", top: 10, left: 10, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#fffefaef", borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  videoCaptionText: { color: "#14261a", fontFamily: Fonts.sansSemibold, fontSize: 10 },
  durationPill: { position: "absolute", right: 8, bottom: 8, backgroundColor: "#14261acc", borderRadius: Radius.sm, paddingHorizontal: 7, paddingVertical: 4 },
  durationText: { color: "#ffffff", fontFamily: Fonts.sansSemibold, fontSize: 10 },
  articleCard: { marginTop: Spacing.three, borderWidth: 1, borderRadius: Radius.xl, overflow: "hidden" },
  articleCopy: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.two },
  articleTitle: { fontFamily: Fonts.headingBold, fontSize: 13, lineHeight: 18 },
  articleSource: { fontFamily: Fonts.sans, fontSize: 11, lineHeight: 16, marginTop: 2 },
  photoGrid: { marginTop: Spacing.three, borderWidth: 1, borderRadius: Radius.xl, overflow: "hidden", flexDirection: "row", gap: 2 },
  photoCell: { flex: 1, minWidth: 0 },
  photoCaption: { position: "absolute", left: 7, right: 7, bottom: 7, backgroundColor: "#fffefadf", borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 4 },
  photoCaptionText: { color: "#14261a", fontFamily: Fonts.sansSemibold, fontSize: 10 },
  stats: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, marginTop: Spacing.three, paddingTop: Spacing.two },
  stat: { minWidth: 38, flexDirection: "row", alignItems: "center", gap: 3 },
  statText: { fontFamily: Fonts.sansMedium, fontSize: 11 },
});
