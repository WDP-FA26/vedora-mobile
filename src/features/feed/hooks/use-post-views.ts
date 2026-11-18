import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, type FlatListProps, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { useSessionStore } from '@/shared/stores/session-store';

import { recordPostViews } from '../services/post-view.service';
import type { FeedPost } from '../types/feed.schema';
import { createPostViewTracker, isPostVisible } from './post-view-tracker';

export function usePostViews(enabled = true) {
  const focused = useIsFocused();
  const [tracker] = useState(() => createPostViewTracker(recordPostViews));
  useEffect(() => {
    const activate = () => tracker.setActive(enabled && focused && AppState.currentState === 'active' &&
      (Platform.OS !== 'web' || document.visibilityState === 'visible'));
    activate();
    const change = AppState.addEventListener('change', activate);
    const blur = AppState.addEventListener('blur', () => tracker.setActive(false));
    const focus = AppState.addEventListener('focus', activate);
    if (Platform.OS === 'web') document.addEventListener('visibilitychange', activate);
    return () => {
      tracker.setActive(false); change.remove(); blur.remove(); focus.remove();
      if (Platform.OS === 'web') document.removeEventListener('visibilitychange', activate);
    };
  }, [enabled, focused, tracker]);
  useEffect(() => useSessionStore.subscribe((state, previous) => {
    if (state.accessToken !== previous.accessToken) tracker.reset();
  }), [tracker]);
  useEffect(() => () => tracker.dispose(), [tracker]);
  return tracker.update;
}

/** Stable callbacks for FlatList; use alongside playback viewability rather than counting renders. */
export function usePostViewability<T>(postOf: (item: T) => Pick<FeedPost, 'id' | 'status'> | null, enabled = true, scope = '') {
  const update = usePostViews(enabled);
  useEffect(() => update([]), [scope, update]);
  const onViewableItemsChanged = useCallback(({ viewableItems }: Parameters<NonNullable<FlatListProps<T>['onViewableItemsChanged']>>[0]) => {
    update(viewableItems.flatMap(({ item, isViewable }) => {
      const post = postOf(item);
      return isViewable && post?.status === 'PUBLISHED' ? [post.id] : [];
    }));
  }, [postOf, update]);
  return { onViewableItemsChanged, viewabilityConfig: POST_VIEWABILITY };
}
const POST_VIEWABILITY = { viewAreaCoveragePercentThreshold: 50 };
export const feedPostOf = (post: FeedPost) => post;

/** ScrollView children report positions in its content coordinates (profiles and post detail). */
export function useScrollPostViews(posts: readonly FeedPost[], enabled = true) {
  const update = usePostViews(enabled);
  const geometry = useRef({ offset: 0, height: 0, posts: new Map<string, { y: number; height: number }>() });
  const refresh = () => {
    const { posts, offset, height } = geometry.current;
    update([...posts].filter(([, rect]) => isPostVisible(rect.y, rect.height, offset, height)).map(([id]) => id));
  };
  useEffect(() => {
    const ids = new Set(posts.filter((post) => post.status === 'PUBLISHED').map((post) => post.id));
    const { posts: measured, offset, height } = geometry.current;
    for (const id of measured.keys()) if (!ids.has(id)) measured.delete(id);
    update([...measured].filter(([, rect]) => isPostVisible(rect.y, rect.height, offset, height)).map(([id]) => id));
  }, [posts, update]);
  return {
    onLayout: (event: LayoutChangeEvent) => { geometry.current.height = event.nativeEvent.layout.height; refresh(); },
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      geometry.current.offset = event.nativeEvent.contentOffset.y; geometry.current.height = event.nativeEvent.layoutMeasurement.height; refresh();
    },
    onPostLayout: (post: FeedPost) => (event: LayoutChangeEvent) => {
      if (post.status === 'PUBLISHED') geometry.current.posts.set(post.id, event.nativeEvent.layout);
      else geometry.current.posts.delete(post.id);
      refresh();
    },
  };
}
