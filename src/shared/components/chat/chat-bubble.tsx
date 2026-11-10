import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const AVATAR_SIZE = 34;
/** Left inset that lines extra content (suggestions, status) up with assistant bubbles. */
export const CHAT_CONTENT_INSET = AVATAR_SIZE + Spacing.two;

type ChatBubbleProps = {
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
  /** Assistant avatar content (mascot). */
  avatar?: ReactNode;
  authorLabel?: string;
  /** Extra content under the bubble, e.g. an action button. */
  footer?: ReactNode;
};

/** One chat message: assistant on the left with avatar and name, user on the right. */
export function ChatBubble({ role, text, streaming, avatar, authorLabel, footer }: ChatBubbleProps) {
  const theme = useTheme();
  const isUser = role === 'user';

  return (
    <View style={[styles.row, isUser && styles.userRow]}>
      {!isUser ? (
        <View style={[styles.avatar, { backgroundColor: theme.secondary }]}>{avatar}</View>
      ) : null}
      <View style={[styles.column, isUser && styles.userColumn]}>
        {!isUser && authorLabel ? (
          <Text style={[styles.author, { color: theme.mutedForeground }]}>{authorLabel}</Text>
        ) : null}
        <View
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
          <Text style={[styles.text, { color: isUser ? theme.primaryForeground : theme.foreground }]}>
            {text}
            {streaming ? ' ▍' : ''}
          </Text>
        </View>
        {footer}
      </View>
    </View>
  );
}

/** Small "assistant is working" line aligned with assistant bubbles. */
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
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  // flexShrink (not flex:1) lets the bubble hug short text while long text wraps at the max width.
  column: { flexShrink: 1, maxWidth: '86%', gap: Spacing.one + Spacing.half, alignItems: 'flex-start' },
  userColumn: { alignItems: 'flex-end', maxWidth: '82%' },
  author: { fontFamily: Fonts.sansSemibold, fontSize: 12, lineHeight: 16, paddingLeft: Spacing.one },
  bubble: {
    borderRadius: Radius['2xl'],
    paddingHorizontal: Spacing.three - Spacing.one,
    paddingVertical: Spacing.two + Spacing.one,
  },
  text: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingLeft: CHAT_CONTENT_INSET,
    minHeight: 28,
  },
  statusText: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
});
