import { useRef, type RefObject } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollViewInstance } from 'react-native';

export function useVoiceScroll(ref: RefObject<ScrollViewInstance | null>) {
  const position = useRef({ y: 0, height: 0, content: 0 });
  const onScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    position.current = { y: nativeEvent.contentOffset.y, height: nativeEvent.layoutMeasurement.height, content: nativeEvent.contentSize.height };
  };
  return {
    props: {
      onScroll, scrollEventThrottle: 100,
      onLayout: (event: LayoutChangeEvent) => { position.current.height = event.nativeEvent.layout.height; },
      onContentSizeChange: (_width: number, height: number) => { position.current.content = height; },
    },
    reset() { position.current = { y: 0, height: 0, content: 0 }; },
    read() {
      const { y, height, content } = position.current;
      const max = Math.max(0, content - height);
      return { percent: max ? Math.round(Math.max(0, Math.min(1, y / max)) * 100) : 0, atTop: y <= 4, atBottom: y >= max - 4 };
    },
    move(direction: 'top' | 'bottom' | 'up' | 'down') {
      const { y, height, content } = position.current;
      if (direction === 'bottom') ref.current?.scrollToEnd({ animated: true });
      else ref.current?.scrollTo({ y: direction === 'top' ? 0 : Math.max(0, Math.min(content - height, y + height * (direction === 'down' ? 0.7 : -0.7))), animated: true });
    },
  };
}
