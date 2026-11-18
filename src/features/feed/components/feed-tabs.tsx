import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type FeedTab = 'all' | 'following' | 'recipes' | 'blogs';

type Item = { key: FeedTab | 'video'; label: string };

/** Order of the tab row. "Video" opens the reels screen instead of switching the list. */
const ITEMS: Item[] = [
  { key: 'all', label: 'Dành cho bạn' },
  { key: 'following', label: 'Theo dõi' },
  { key: 'recipes', label: 'Công thức' },
  { key: 'video', label: 'Video' },
  { key: 'blogs', label: 'Blog' },
];

/** The nudge that shows the row can be swiped runs once per app launch. */
let hinted = false;
const EDGE = 6;
const CUE_WIDTH = 40;

/**
 * Tab row that scrolls sideways when the labels do not fit. A chevron on the side that has more tabs (tap to scroll),
 * a one-time nudge on first view, and scrolling the chosen tab into view tell people the row can be swiped.
 */
export function FeedTabs({ value, onSelect, onVideo }: { value: FeedTab; onSelect: (tab: FeedTab) => void; onVideo: () => void }) {
  const theme = useTheme();
  const scroll = useRef<ScrollViewInstance>(null);
  const positions = useRef(new Map<string, { x: number; width: number }>());
  const [viewport, setViewport] = useState(0);
  const [content, setContent] = useState(0);
  const [offset, setOffset] = useState(0);

  const moreRight = content - viewport - offset > EDGE;
  const moreLeft = offset > EDGE;

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => setOffset(event.nativeEvent.contentOffset.x), []);

  const reveal = useCallback((key: string) => {
    const spot = positions.current.get(key);
    if (!spot || !viewport) return;
    scroll.current?.scrollTo({ x: Math.max(0, spot.x + spot.width / 2 - viewport / 2), animated: true });
  }, [viewport]);

  // Bring the selected tab into view, e.g. after tapping one that is cut off at the edge.
  useEffect(() => { reveal(value); }, [reveal, value]);

  // First time the row overflows: slide it a little and back so it is clear it moves.
  const overflowing = content > viewport + EDGE && viewport > 0;
  useEffect(() => {
    if (!overflowing || hinted) return;
    hinted = true;
    const out = setTimeout(() => scroll.current?.scrollTo({ x: 56, animated: true }), 700);
    const back = setTimeout(() => scroll.current?.scrollTo({ x: 0, animated: true }), 1300);
    return () => { clearTimeout(out); clearTimeout(back); };
  }, [overflowing]);

  const nudge = (direction: 1 | -1) => scroll.current?.scrollTo({ x: Math.max(0, offset + direction * viewport * 0.6), animated: true });

  const onLayoutItem = (key: string) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    positions.current.set(key, { x, width });
  };

  return (
    <View style={styles.wrap} onLayout={(event) => setViewport(event.nativeEvent.layout.width)}>
      <ScrollView
        ref={scroll}
        horizontal
        accessibilityRole="tablist"
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onContentSizeChange={(width) => setContent(width)}
        contentContainerStyle={styles.row}>
        {ITEMS.map((item) => {
          const selected = item.key === value;
          const isVideo = item.key === 'video';
          return (
            <Pressable
              key={item.key}
              accessibilityRole={isVideo ? 'button' : 'tab'}
              accessibilityLabel={isVideo ? 'Xem video dạng lướt' : item.label}
              accessibilityState={isVideo ? undefined : { selected }}
              onLayout={onLayoutItem(item.key)}
              onPress={() => (isVideo ? onVideo() : onSelect(item.key as FeedTab))}
              style={[styles.tab, { borderBottomColor: selected ? theme.primary : 'transparent' }]}>
              {isVideo ? (
                <View style={styles.videoLabel}>
                  <SymbolView name={{ ios: 'play.circle.fill', android: 'play_circle', web: 'play_circle' }} size={17} tintColor={theme.primary} />
                  <Text numberOfLines={1} style={[styles.text, { color: theme.primary }]}>{item.label}</Text>
                </View>
              ) : (
                <Text numberOfLines={1} style={[styles.text, { color: selected ? theme.primary : theme.mutedForeground }]}>{item.label}</Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
      {moreLeft ? <Cue side="left" onPress={() => nudge(-1)} /> : null}
      {moreRight ? <Cue side="right" onPress={() => nudge(1)} /> : null}
    </View>
  );
}

/** Edge marker: solid enough to cut the last label off cleanly, with a chevron that scrolls the row when tapped. */
function Cue({ side, onPress }: { side: 'left' | 'right'; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={side === 'right' ? 'Xem thêm mục bên phải' : 'Xem mục bên trái'}
      onPress={onPress}
      style={[styles.cue, side === 'right' ? styles.cueRight : styles.cueLeft, { backgroundColor: theme.background }]}>
      <SymbolView
        name={side === 'right' ? { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' } : { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
        size={15}
        tintColor={theme.mutedForeground}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  row: { paddingHorizontal: Spacing.two, gap: Spacing.one },
  tab: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, paddingHorizontal: Spacing.three },
  videoLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one + Spacing.half },
  text: { fontFamily: Fonts.sansSemibold, fontSize: 14, textAlign: 'center' },
  cue: { position: 'absolute', top: 0, bottom: 2, width: CUE_WIDTH, alignItems: 'center', justifyContent: 'center', opacity: 0.94 },
  cueRight: { right: 0, paddingLeft: Spacing.one },
  cueLeft: { left: 0, paddingRight: Spacing.one },
});
