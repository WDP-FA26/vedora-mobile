import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useBlog } from '../hooks/use-blog';
import { parseMarkdown, type Block, type InlineNode } from '../utils/markdown';

type Theme = ReturnType<typeof useTheme>;

function openUrl(url: string) {
  void Linking.openURL(url).catch(() => undefined);
}

function Inline({ nodes, theme }: { nodes: InlineNode[]; theme: Theme }) {
  return (
    <>
      {nodes.map((node, index) => {
        switch (node.kind) {
          case 'bold':
            return <Text key={index} style={{ fontFamily: Fonts.sansBold }}>{node.text}</Text>;
          case 'italic':
            return <Text key={index} style={{ fontStyle: 'italic' }}>{node.text}</Text>;
          case 'code':
            return <Text key={index} style={{ fontFamily: Fonts.mono, fontSize: 14, backgroundColor: theme.secondary }}>{node.text}</Text>;
          case 'link':
            return <Text key={index} accessibilityRole="link" onPress={() => openUrl(node.url)} style={{ color: theme.primary, textDecorationLine: 'underline' }}>{node.text}</Text>;
          default:
            return <Text key={index}>{node.text}</Text>;
        }
      })}
    </>
  );
}

function BlogImage({ url, alt }: { url: string; alt: string }) {
  const theme = useTheme();
  const [ratio, setRatio] = useState(16 / 10);
  return (
    <Image
      source={{ uri: url }}
      accessibilityLabel={alt || 'Ảnh trong bài viết'}
      contentFit="cover"
      onLoad={(event) => {
        const { width, height } = event.source;
        if (width > 0 && height > 0) setRatio(width / height);
      }}
      style={[styles.image, { aspectRatio: ratio, backgroundColor: theme.secondary }]}
    />
  );
}

function BlockView({ block, theme }: { block: Block; theme: Theme }) {
  switch (block.kind) {
    case 'heading':
      return (
        <Text accessibilityRole="header" style={[styles.heading, block.level === 1 ? styles.h1 : block.level === 2 ? styles.h2 : styles.h3, { color: theme.foreground }]}>
          <Inline nodes={block.inline} theme={theme} />
        </Text>
      );
    case 'paragraph':
      return (
        <Text style={[styles.paragraph, { color: theme.foreground }]}>
          <Inline nodes={block.inline} theme={theme} />
        </Text>
      );
    case 'quote':
      return (
        <View style={[styles.quote, { borderLeftColor: theme.primary }]}>
          <Text style={[styles.paragraph, { color: theme.mutedForeground }]}>
            <Inline nodes={block.inline} theme={theme} />
          </Text>
        </View>
      );
    case 'list':
      return (
        <View style={styles.list}>
          {block.items.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={[styles.paragraph, styles.marker, { color: theme.mutedForeground }]}>{block.ordered ? `${index + 1}.` : '•'}</Text>
              <Text style={[styles.paragraph, styles.listText, { color: theme.foreground }]}>
                <Inline nodes={item} theme={theme} />
              </Text>
            </View>
          ))}
        </View>
      );
    case 'code':
      return (
        <View style={[styles.code, { backgroundColor: theme.secondary }]}>
          <Text selectable style={[styles.codeText, { color: theme.foreground }]}>{block.text}</Text>
        </View>
      );
    case 'image':
      return <BlogImage url={block.url} alt={block.alt} />;
    case 'video':
      return (
        <Pressable accessibilityRole="link" onPress={() => openUrl(block.url)} style={[styles.videoLink, { borderColor: theme.border, backgroundColor: theme.secondary }]}>
          <Text style={[styles.videoText, { color: theme.primary }]}>Xem video trong bài</Text>
        </Pressable>
      );
    default:
      return <View style={[styles.rule, { backgroundColor: theme.border }]} />;
  }
}

/** A blog's title and full article. Feed items carry only a summary, so the Markdown loads from `GET /blogs/:id`. */
export function BlogArticle({ blogId, title }: { blogId: string; title: string }) {
  const theme = useTheme();
  const blog = useBlog(blogId);
  const blocks = useMemo(() => (blog.data ? parseMarkdown(blog.data.content) : []), [blog.data]);

  return (
    <View style={styles.article}>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>{title}</Text>
      {blog.isPending ? <ActivityIndicator color={theme.primary} accessibilityLabel="Đang tải nội dung blog" style={styles.loading} /> : null}
      {blog.isError ? (
        <View style={styles.state}>
          <Text accessibilityRole="alert" style={[styles.error, { color: theme.destructive }]}>Chưa tải được nội dung blog.</Text>
          <Pressable accessibilityRole="button" onPress={() => void blog.refetch()} style={[styles.retry, { borderColor: theme.border }]}>
            <Text style={[styles.retryText, { color: theme.primary }]}>Thử lại</Text>
          </Pressable>
        </View>
      ) : null}
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} theme={theme} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  article: { marginTop: Spacing.three, gap: Spacing.three },
  title: { fontFamily: Fonts.headingBold, fontSize: 24, lineHeight: 32 },
  loading: { padding: Spacing.four },
  state: { alignItems: 'flex-start', gap: Spacing.two },
  error: { fontFamily: Fonts.sans, fontSize: 14 },
  retry: { minHeight: 40, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  retryText: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
  heading: { fontFamily: Fonts.headingBold, marginTop: Spacing.two },
  h1: { fontSize: 22, lineHeight: 30 },
  h2: { fontSize: 20, lineHeight: 28 },
  h3: { fontSize: 17, lineHeight: 25 },
  paragraph: { fontFamily: Fonts.sans, fontSize: 16, lineHeight: 26 },
  quote: { borderLeftWidth: 3, paddingLeft: Spacing.three },
  list: { gap: Spacing.one },
  listItem: { flexDirection: 'row', gap: Spacing.two },
  marker: { minWidth: 20 },
  listText: { flex: 1 },
  code: { borderRadius: Radius.lg, padding: Spacing.three },
  codeText: { fontFamily: Fonts.mono, fontSize: 13, lineHeight: 20 },
  image: { width: '100%', borderRadius: Radius['2xl'] },
  videoLink: { minHeight: 48, borderWidth: 1, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  videoText: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
  rule: { height: StyleSheet.hairlineWidth, width: '100%' },
});
