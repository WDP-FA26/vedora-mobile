import { useMemo } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { parseMarkdown, type Block, type InlineNode } from '@/shared/utils/markdown';

type Theme = ReturnType<typeof useTheme>;

const openUrl = (url: string) => { void Linking.openURL(url).catch(() => undefined); };

function Inline({ nodes, theme }: { nodes: InlineNode[]; theme: Theme }) {
  return (
    <>
      {nodes.map((node, index) => {
        switch (node.kind) {
          case 'bold': return <Text key={index} style={styles.bold}>{node.text}</Text>;
          case 'italic': return <Text key={index} style={styles.italic}>{node.text}</Text>;
          case 'code': return <Text key={index} style={[styles.inlineCode, { backgroundColor: theme.secondary }]}>{node.text}</Text>;
          case 'link': return <Text key={index} accessibilityRole="link" onPress={() => openUrl(node.url)} style={{ color: theme.primary, textDecorationLine: 'underline' }}>{node.text}</Text>;
          default: return <Text key={index}>{node.text}</Text>;
        }
      })}
    </>
  );
}

function BlockView({ block, color, theme }: { block: Block; color: string; theme: Theme }) {
  switch (block.kind) {
    case 'heading':
      return <Text style={[styles.text, styles.heading, { color }]}><Inline nodes={block.inline} theme={theme} /></Text>;
    case 'paragraph':
      return <Text style={[styles.text, { color }]}><Inline nodes={block.inline} theme={theme} /></Text>;
    case 'quote':
      return (
        <View style={[styles.quote, { borderLeftColor: theme.primary }]}>
          <Text style={[styles.text, { color: theme.mutedForeground }]}><Inline nodes={block.inline} theme={theme} /></Text>
        </View>
      );
    case 'list':
      return (
        <View style={styles.list}>
          {block.items.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={[styles.text, styles.marker, { color: theme.mutedForeground }]}>{block.ordered ? `${index + 1}.` : '•'}</Text>
              <Text style={[styles.text, styles.listText, { color }]}><Inline nodes={item} theme={theme} /></Text>
            </View>
          ))}
        </View>
      );
    case 'code':
      return (
        <View style={[styles.code, { backgroundColor: theme.secondary }]}>
          <Text selectable style={[styles.codeText, { color }]}>{block.text}</Text>
        </View>
      );
    case 'table':
      return (
        <ScrollView horizontal nestedScrollEnabled style={styles.tableScroll} accessibilityLabel="Bảng dữ liệu, vuốt ngang để xem thêm cột">
          <View style={[styles.table, { borderColor: theme.mutedForeground, width: block.headers.length * TABLE_COLUMN_WIDTH + 2 }]}>
            {[block.headers, ...block.rows].map((row, rowIndex) => (
              <View key={rowIndex} style={[styles.tableRow, rowIndex === 0 && { backgroundColor: theme.secondary }]}>
                {row.map((cell, column) => (
                  <View key={column} style={[styles.tableCell, { borderColor: theme.mutedForeground }, column > 0 && styles.cellBorder, rowIndex > 0 && styles.cellTop]}>
                    <Text selectable accessibilityRole={rowIndex === 0 ? 'header' : undefined}
                      style={[styles.text, { color, textAlign: block.alignments[column] }, rowIndex === 0 && styles.bold]}>
                      <Inline nodes={cell} theme={theme} />
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      );
    case 'image':
      return block.alt ? <Text style={[styles.text, { color: theme.mutedForeground }]}>{block.alt}</Text> : null;
    case 'video':
      return null;
    default:
      return <View style={[styles.rule, { backgroundColor: theme.border }]} />;
  }
}

/** An assistant answer written in Markdown, shown as formatted text instead of ##, ** and - characters. */
export function ChatMarkdown({ text, color, cursor }: { text: string; color: string; cursor?: boolean }) {
  const theme = useTheme();
  const blocks = useMemo(() => parseMarkdown(text, { tables: true, preserveLineBreaks: true }), [text]);
  return (
    <View style={styles.root}>
      {blocks.map((block, index) => <BlockView key={index} block={block} color={color} theme={theme} />)}
      {cursor ? <Text style={[styles.text, { color }]}>▍</Text> : null}
    </View>
  );
}

const TABLE_COLUMN_WIDTH = 144;

const styles = StyleSheet.create({
  root: { gap: Spacing.two, maxWidth: '100%' },
  tableScroll: { maxWidth: '100%', flexGrow: 0 },
  table: { borderWidth: 1, borderRadius: 0, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', alignItems: 'stretch', gap: 0 },
  tableCell: { width: TABLE_COLUMN_WIDTH, flexShrink: 0, padding: Spacing.two, justifyContent: 'center' },
  cellBorder: { borderLeftWidth: 1 },
  cellTop: { borderTopWidth: 1 },
  text: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 },
  heading: { fontFamily: Fonts.headingBold, fontSize: 16, lineHeight: 24 },
  bold: { fontFamily: Fonts.sansBold },
  italic: { fontFamily: Fonts.sansItalic },
  inlineCode: { fontFamily: Fonts.mono, fontSize: 13 },
  quote: { borderLeftWidth: 3, paddingLeft: Spacing.two + Spacing.one },
  list: { gap: Spacing.one },
  listItem: { flexDirection: 'row', gap: Spacing.two },
  marker: { minWidth: 18 },
  listText: { flex: 1, minWidth: 0 },
  code: { borderRadius: Radius.lg, padding: Spacing.two + Spacing.one },
  codeText: { fontFamily: Fonts.mono, fontSize: 13, lineHeight: 19 },
  rule: { height: StyleSheet.hairlineWidth, width: '100%' },
});
