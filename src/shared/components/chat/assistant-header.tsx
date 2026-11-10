import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AssistantHeaderProps = {
  /** Mascot/avatar content; it is centred inside a fixed round slot. */
  avatar: ReactNode;
  title: string;
  subtitle: string;
  /** Optional trailing control (icon button, call-to-action). */
  action?: ReactNode;
};

export const HEADER_AVATAR_SIZE = 48;

/** Shared header of the Trợ lý Vedora chat screens: avatar | title + subtitle | trailing action. */
export function AssistantHeader({ avatar, title, subtitle, action }: AssistantHeaderProps) {
  const theme = useTheme();
  return (
    <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      <View style={[styles.avatar, { backgroundColor: theme.secondary }]}>{avatar}</View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.title, { color: theme.foreground }]}>
          {title}
        </Text>
        <Text numberOfLines={2} style={[styles.subtitle, { color: theme.mutedForeground }]}>
          {subtitle}
        </Text>
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: HEADER_AVATAR_SIZE,
    height: HEADER_AVATAR_SIZE,
    borderRadius: HEADER_AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  copy: { flex: 1, minWidth: 0, justifyContent: 'center' },
  title: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 24 },
  subtitle: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
  action: { flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
});
