import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useSuggestions } from '../hooks/use-profile';
import type { FollowSuggestion } from '../types/profile.schema';

const REASON_TEXT: Record<FollowSuggestion['reason'], (mutual: number) => string> = {
  FOLLOWS_YOU: () => 'Đang theo dõi bạn',
  MUTUAL: (mutual) => `${mutual} người chung`,
  ACTIVE: () => 'Đang hoạt động',
};

/** Horizontal "who to follow" strip for the top of the Following feed. Hidden for guests and when empty. */
export function SuggestionsRow() {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  const suggestions = useSuggestions(10);
  const items = suggestions.data?.items ?? [];
  if (!token || items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>Gợi ý theo dõi</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {items.map((person) => (
          <View key={person.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Ẩn gợi ý ${person.fullName}`} onPress={() => suggestions.dismiss(person.id)} hitSlop={8} style={styles.dismiss}>
              <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={14} tintColor={theme.mutedForeground} />
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/profile/[id]', params: { id: person.id } })} style={styles.person}>
              {person.avatarUrl ? (
                <Image source={{ uri: person.avatarUrl }} style={[styles.avatar, { backgroundColor: theme.secondary }]} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarEmpty, { backgroundColor: theme.secondary }]}>
                  <Text style={[styles.initial, { color: theme.primary }]}>{person.fullName.trim().charAt(0).toLocaleUpperCase('vi') || 'V'}</Text>
                </View>
              )}
              <Text numberOfLines={1} style={[styles.name, { color: theme.foreground }]}>{person.fullName}</Text>
              <Text numberOfLines={1} style={[styles.reason, { color: theme.mutedForeground }]}>{REASON_TEXT[person.reason](person.mutualCount)}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => suggestions.follow(person.id)} style={[styles.follow, { backgroundColor: theme.primary }]}>
              <Text style={[styles.followText, { color: theme.primaryForeground }]}>Theo dõi</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
      {suggestions.failed ? <Text accessibilityRole="alert" style={[styles.reason, styles.error, { color: theme.destructive }]}>Chưa thực hiện được. Vui lòng thử lại.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: Spacing.three },
  title: { fontFamily: Fonts.headingBold, fontSize: 16, paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  list: { gap: Spacing.two, paddingHorizontal: Spacing.three },
  card: { width: 136, borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.three, alignItems: 'center', gap: Spacing.two },
  dismiss: { position: 'absolute', top: 6, right: 6, zIndex: 1 },
  person: { alignItems: 'center', gap: 2, width: '100%' },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: Fonts.headingBold, fontSize: 22 },
  name: { fontFamily: Fonts.sansSemibold, fontSize: 14, marginTop: Spacing.one, maxWidth: '100%' },
  reason: { fontFamily: Fonts.sans, fontSize: 12, maxWidth: '100%' },
  error: { paddingHorizontal: Spacing.three, paddingTop: Spacing.one },
  follow: { minHeight: 34, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  followText: { fontFamily: Fonts.sansBold, fontSize: 13 },
});
