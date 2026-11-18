import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { Message } from '../types/messaging.schema';

export function SharedPostCard({ message }: { message: Message }) {
  const theme = useTheme();
  const post = message.sharedPost;
  if (!post) return <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}><Text style={[styles.excerpt, { color: theme.mutedForeground }]}>Bài viết không còn khả dụng</Text></View>;
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={`Mở ${post.type === 'BLOG' ? 'Blog' : 'bài viết'} của ${post.author.fullName}`}
      onPress={() => router.push({ pathname: '/posts/[id]', params: { id: post.id } })}
      style={({ pressed }) => [styles.card, { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}>
      {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={styles.image} contentFit="cover" accessibilityLabel="Ảnh bài viết được chia sẻ" /> : null}
      <Text numberOfLines={1} style={[styles.author, { color: theme.mutedForeground }]}>{post.author.fullName} · {post.type === 'BLOG' ? 'Blog' : 'Bài viết'}</Text>
      {post.title ? <Text numberOfLines={2} style={[styles.title, { color: theme.foreground }]}>{post.title}</Text> : null}
      {post.excerpt ? <Text numberOfLines={3} style={[styles.excerpt, { color: theme.foreground }]}>{post.excerpt}</Text> : null}
      <Text style={[styles.author, { color: theme.primary }]}>Xem bài viết ›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 260, maxWidth: '100%', borderWidth: 1, borderRadius: Radius.xl, overflow: 'hidden', padding: Spacing.two + Spacing.one, gap: Spacing.two },
  image: { width: '100%', height: 136, borderRadius: Radius.lg },
  author: { fontFamily: Fonts.sansSemibold, fontSize: 12, lineHeight: 18 },
  title: { fontFamily: Fonts.sansBold, fontSize: 15, lineHeight: 22 },
  excerpt: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
});
