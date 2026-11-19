import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { TraceIcon, TraceStatus, TraceStep } from '../utils/planner-trace';

const ICONS: Record<TraceIcon | 'think', SymbolViewProps['name']> = {
  book: { ios: 'book', android: 'menu_book', web: 'menu_book' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  calendar: { ios: 'calendar.badge.checkmark', android: 'event_available', web: 'event_available' },
  tool: { ios: 'wrench.and.screwdriver', android: 'build', web: 'build' },
  think: { ios: 'brain', android: 'psychology', web: 'psychology' },
};

/** The assistant's steps (tool calls) above its reply, like the web; `thinking` adds a row while it works between steps. */
export function PlannerTrace({ steps, thinking }: { steps: TraceStep[]; thinking: boolean }) {
  if (steps.length === 0 && !thinking) return null;
  return (
    <View style={styles.trace} accessibilityLiveRegion="polite">
      {steps.map(({ key, ...step }) => <TraceLine key={key} {...step} />)}
      {thinking ? <TraceLine status="running" icon="think" title="Đang suy nghĩ…" /> : null}
    </View>
  );
}

function TraceLine({ status, icon, title, description }: { status: TraceStatus; icon: TraceIcon | 'think'; title: string; description?: string }) {
  const theme = useTheme();
  const color = status === 'error' ? theme.destructive : theme.mutedForeground;
  return (
    <View style={styles.line} accessible accessibilityLabel={description ? `${title}, ${description}` : title}>
      {status === 'running'
        ? <ActivityIndicator size="small" color={theme.primary} style={styles.icon} />
        : <SymbolView name={ICONS[icon]} size={15} tintColor={color} style={styles.icon} />}
      <Text style={[styles.title, { color }]}>
        {title}
        {description ? <Text style={{ color: theme.mutedForeground }}> · {description}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  trace: { gap: Spacing.one, paddingLeft: Spacing.one },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  icon: { width: 18, height: 18 },
  title: { flexShrink: 1, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
});
