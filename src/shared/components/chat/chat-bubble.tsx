import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ChatMarkdown } from './chat-markdown';

const AVATAR_SIZE = 34;

type ChatBubbleProps = {
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
  /** Assistant avatar content (mascot). */
  avatar?: ReactNode;
  authorLabel?: string;
  /** Extra content above the bubble, e.g. the assistant's steps. */
  header?: ReactNode;
  /** Extra content under the bubble, e.g. an action button. */
  footer?: ReactNode;
};

/** Assistant identity sits above its full-width answer; user messages stay on the right. */
export function ChatBubble({ role, text, streaming, avatar, authorLabel, header, footer }: ChatBubbleProps) {
  const theme = useTheme();
  const isUser = role === 'user';

  return (
    <View style={[styles.row, isUser && styles.userRow]}>
      <View style={[styles.column, isUser ? styles.userColumn : styles.assistantColumn]}>
        {!isUser && (avatar || authorLabel) ? (
          <View style={styles.identity}>
            {avatar ? <View style={[styles.avatar, { backgroundColor: theme.secondary }]}>{avatar}</View> : null}
            {authorLabel ? <Text style={[styles.author, { color: theme.mutedForeground }]}>{authorLabel}</Text> : null}
          </View>
        ) : null}
        {header}
        {isUser || text ? <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: theme.primary, borderBottomRightRadius: Radius.sm }
              : {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  borderWidth: 1,
                  borderTopLeftRadius: Radius.sm,
                },
          ]}>
          {isUser ? (
            <Text style={[styles.text, { color: theme.primaryForeground }]}>{text}</Text>
          ) : (
            <ChatMarkdown text={text} color={theme.foreground} cursor={streaming} />
          )}
        </View> : null}
        {footer}
      </View>
    </View>
  );
}

/** Small "assistant is working" line aligned with the answer's left edge. */
export function ChatStatus({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <View style={styles.status}>
      <ActivityIndicator size="small" color={theme.primary} />
      <Text style={[styles.statusText, { color: theme.mutedForeground }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  userRow: { justifyContent: 'flex-end' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  column: { minWidth: 0, gap: Spacing.one + Spacing.half },
  // Keep both answer edges on the content gutters, without a reserved avatar column.
  assistantColumn: { flex: 1, alignItems: 'stretch' },
  userColumn: { flexShrink: 1, alignItems: 'flex-end', maxWidth: '82%' },
  author: { flexShrink: 1, fontFamily: Fonts.sansSemibold, fontSize: 12, lineHeight: 16 },
  bubble: {
    maxWidth: '100%',
    borderRadius: Radius['2xl'],
    paddingHorizontal: Spacing.three - Spacing.one,
    paddingVertical: Spacing.two + Spacing.one,
  },
  text: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 28,
  },
  statusText: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
});
