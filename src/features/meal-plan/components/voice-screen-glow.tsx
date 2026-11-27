import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

import { BrandColors } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/use-reduce-motion';

const colors = [BrandColors.leaf, BrandColors.teal, BrandColors.aqua, BrandColors.plum, BrandColors.orange, BrandColors.leaf];
const horizontal = `linear-gradient(90deg, ${colors.join(', ')})`;
const vertical = `linear-gradient(180deg, ${colors.join(', ')})`;
const aura = (vertical: boolean) => [BrandColors.teal, BrandColors.plum, BrandColors.orange].map((color, index) =>
  `radial-gradient(ellipse at ${vertical ? `0% ${20 + index * 30}%` : `${20 + index * 30}% 0%`}, ${color}80 0%, ${color}00 70%)`).join(', ');

/** Thin moving gradients keep the working signal at the edges and leave the UI touchable. */
export function VoiceScreenGlow({ active }: { active: boolean }) {
  const reduceMotion = useReduceMotion();
  const { width, height } = useWindowDimensions();
  const [phase] = useState(() => new Animated.Value(0));
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const fade = Animated.timing(opacity, { toValue: active ? 1 : 0, duration: reduceMotion ? 0 : 360, useNativeDriver: true, isInteraction: false });
    fade.start();
    return () => fade.stop();
  }, [active, opacity, reduceMotion]);
  useEffect(() => {
    phase.setValue(0);
    if (!active || reduceMotion) return;
    const motion = Animated.loop(Animated.sequence([
      Animated.timing(phase, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
      Animated.timing(phase, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
    ]));
    motion.start();
    return () => motion.stop();
  }, [active, phase, reduceMotion]);
  const translateX = phase.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.2, width * 0.2] });
  const translateY = phase.interpolate({ inputRange: [0, 1], outputRange: [-height * 0.2, height * 0.2] });
  const breathe = phase.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.9] });
  return <Animated.View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, styles.overlay, { opacity }]}>
    {(['top', 'bottom'] as const).map((edge) => <View key={edge} style={[styles.horizontalEdge, styles[edge]]}>
      <Animated.View style={[styles.horizontalBand, { transform: [{ translateX }] }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundImage: aura(false), opacity: breathe }]} />
        <View style={[styles.horizontalLine, { backgroundImage: horizontal }]} />
      </Animated.View>
    </View>)}
    {(['left', 'right'] as const).map((edge) => <View key={edge} style={[styles.verticalEdge, styles[edge]]}>
      <Animated.View style={[styles.verticalBand, { transform: [{ translateY }] }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundImage: aura(true), opacity: breathe }]} />
        <View style={[styles.verticalLine, { backgroundImage: vertical }]} />
      </Animated.View>
    </View>)}
  </Animated.View>;
}

const styles = StyleSheet.create({
  overlay: { overflow: 'hidden', zIndex: 20 },
  horizontalEdge: { position: 'absolute', left: 0, right: 0, height: 32, overflow: 'hidden' },
  verticalEdge: { position: 'absolute', top: 0, bottom: 0, width: 24, overflow: 'hidden' },
  top: { top: 0 },
  bottom: { bottom: 0, transform: [{ rotate: '180deg' }] },
  left: { left: 0 },
  right: { right: 0, transform: [{ rotate: '180deg' }] },
  horizontalBand: { position: 'absolute', left: '-50%', width: '200%', height: '100%' },
  verticalBand: { position: 'absolute', top: '-50%', height: '200%', width: '100%' },
  horizontalLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  verticalLine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 2 },
});
