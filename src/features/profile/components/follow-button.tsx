import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useFollow, useRelationship } from '../hooks/use-profile';

/** Follow / unfollow for another profile. Guests are sent to sign in and return to the profile. */
export function FollowButton({ profileId }: { profileId: string }) {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  const relationship = useRelationship(profileId, token);
  const follow = useFollow(profileId);
  const following = relationship.data?.isFollowing ?? false;

  function press() {
    if (!token) {
      router.push({ pathname: '/login', params: { returnTo: '/explore' } });
      return;
    }
    follow.mutate(!following);
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: following, disabled: follow.isPending || (!!token && relationship.isPending) }}
      disabled={follow.isPending || (!!token && relationship.isPending)}
      onPress={press}
      style={[styles.button, following
        ? { borderColor: theme.border, borderWidth: 1, backgroundColor: 'transparent' }
        : { backgroundColor: theme.primary }]}
    >
      <Text style={[styles.text, { color: following ? theme.foreground : theme.primaryForeground }]}>
        {following ? 'Đang theo dõi' : 'Theo dõi'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 38, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: Fonts.sansBold, fontSize: 13 },
});
