import { useCallback, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { useTabBarVisibilityStore } from '../stores/tab-bar-visibility-store';

const HIDE_DISTANCE = 20;
const SHOW_DISTANCE = 12;
const TOP_DISTANCE = 16;
const LAYOUT_SETTLE_MS = 160;

export function useExploreTabBarScroll() {
  const setVisible = useTabBarVisibilityStore((state) => state.setVisible);
  const anchor = useRef(0);
  const lastVisibilityChange = useRef(0);

  const reset = useCallback(() => {
    anchor.current = 0;
    lastVisibilityChange.current = 0;
    setVisible(true);
  }, [setVisible]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = Math.max(0, event.nativeEvent.contentOffset.y);

    if (offset <= TOP_DISTANCE) {
      anchor.current = offset;
      setVisible(true);
      return;
    }

    // Ignore offset corrections while the list resizes after the tab bar changes.
    if (Date.now() - lastVisibilityChange.current < LAYOUT_SETTLE_MS) {
      anchor.current = offset;
      return;
    }

    const distance = offset - anchor.current;
    if (distance >= HIDE_DISTANCE) {
      if (useTabBarVisibilityStore.getState().visible) {
        setVisible(false);
        lastVisibilityChange.current = Date.now();
      }
      anchor.current = offset;
    } else if (distance <= -SHOW_DISTANCE) {
      if (!useTabBarVisibilityStore.getState().visible) {
        setVisible(true);
        lastVisibilityChange.current = Date.now();
      }
      anchor.current = offset;
    }
  }, [setVisible]);

  return { onScroll, reset };
}
