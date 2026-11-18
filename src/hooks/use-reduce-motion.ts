import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** True while the system "Reduce motion" setting is on; decorative animations should stop. */
export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);
  return reduceMotion;
}
