import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { useTheme } from '@/hooks/use-theme';
import { useReactionBurstStore, type ReactionKind } from '@/shared/stores/reaction-burst-store';

/** Colour of a liked heart, shared by the buttons and the burst. */
export const HEART_COLOR = '#ff3040';

/** Mounted once at the root; shows the reaction requested through `showReactionBurst`. */
export function ReactionBurstHost() {
  const burst = useReactionBurstStore((state) => state.burst);
  const reduceMotion = useReduceMotion();

  // The button already changes state, so the burst is pure decoration and is skipped with reduced motion.
  if (!burst || reduceMotion) return null;
  return (
    <View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={styles.host}>
      <Burst key={burst.id} id={burst.id} kind={burst.kind} />
    </View>
  );
}

/** Instagram-style pop: springs in with a little overshoot, holds, then floats up and fades. */
function Burst({ id, kind }: { id: number; kind: ReactionKind }) {
  const theme = useTheme();
  const [scale] = useState(() => new Animated.Value(0));
  const [opacity] = useState(() => new Animated.Value(1));
  const [lift] = useState(() => new Animated.Value(0));
  const [spin] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
        Animated.timing(spin, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.delay(320),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(lift, { toValue: -48, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.7, duration: 220, useNativeDriver: true }),
      ]),
    ]);
    animation.start(({ finished }) => { if (finished) useReactionBurstStore.getState().clear(id); });
    return () => animation.stop();
  }, [id, lift, opacity, scale, spin]);

  const transform = [
    { translateY: lift },
    { scale },
    ...(kind === 'repost' ? [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '0deg'] }) }] : []),
  ];

  return (
    <Animated.View style={[styles.shadow, { opacity, transform }]}>
      {kind === 'like' ? (
        <SymbolView name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} size={112} tintColor={HEART_COLOR} />
      ) : (
        <View style={[styles.repost, { backgroundColor: theme.primary }]}>
          <SymbolView name={{ ios: 'arrow.2.squarepath', android: 'repeat', web: 'repeat' }} size={56} tintColor={theme.primaryForeground} />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  shadow: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  repost: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center' },
});
