import { useEvent, useEventListener } from 'expo';
import { Image } from 'expo-image';
import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View, type FlatListProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';
import { useSessionStore } from '@/shared/stores/session-store';

import { useFeed, useFeedActions } from '../hooks/use-feed';
import type { FeedPost } from '../types/feed.schema';

type Reel = { post: FeedPost; media: FeedPost['media'][number]; playbackUrl: string };
type IconName = SymbolViewProps['name'];
type ViewableChange = Parameters<NonNullable<FlatListProps<Reel>['onViewableItemsChanged']>>[0];

const WHITE = '#fffefa';
const VIEWABILITY = { itemVisiblePercentThreshold: 80 };
/** Keep loading while fewer than this many videos are ahead of the one being watched. */
const PREFETCH_AHEAD = 3;

const formatCount = (value: number) => new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

/** Posts with at least one ready video; the API has no video-only filter, so pages are filtered here. */
function toReels(posts: FeedPost[]): Reel[] {
  return posts.flatMap((post) => {
    if (post.status !== 'PUBLISHED') return [];
    const media = post.media.find((item) => item.type === 'VIDEO' && item.status === 'READY' && item.playbackUrl);
    return media?.playbackUrl ? [{ post, media, playbackUrl: media.playbackUrl }] : [];
  });
}

/** Full-screen vertical video feed: swipe up for the next video, tap to pause, actions on the right. */
export function VideoReelsScreen() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const feed = useFeed('posts');
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;
  const reels = useMemo(() => toReels(feed.data?.pages.flatMap((page) => page.items) ?? []), [feed.data]);
  const [height, setHeight] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const currentId = activeId ?? reels[0]?.post.id ?? null;
  const currentIndex = Math.max(0, reels.findIndex((reel) => reel.post.id === currentId));

  // Viewability callbacks must keep one identity for the life of the list.
  const onViewableItemsChanged = useCallback(({ viewableItems }: ViewableChange) => {
    const first = viewableItems.find((token) => token.isViewable && token.item);
    if (first?.item) setActiveId(first.item.post.id);
  }, []);

  // Few videos in a page, or the viewer is close to the end: fetch more until the API runs out.
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && reels.length - currentIndex <= PREFETCH_AHEAD) void fetchNextPage();
  }, [currentIndex, fetchNextPage, hasNextPage, isFetchingNextPage, reels.length]);

  return (
    <View style={styles.screen} onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>
      <StatusBar style="light" />
      {height > 0 && reels.length > 0 ? (
        <FlatList
          data={reels}
          keyExtractor={(reel) => reel.post.id}
          renderItem={({ item }) => (
            <ReelItem reel={item} height={height} active={item.post.id === currentId && focused} muted={muted} bottomInset={insets.bottom} />
          )}
          pagingEnabled
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={VIEWABILITY}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews
        />
      ) : feed.isPending ? (
        <View style={styles.centered}><ActivityIndicator color={WHITE} /></View>
      ) : feed.isError ? (
        <View style={styles.centered}>
          <Text style={styles.centerTitle}>Chưa tải được video</Text>
          <Pressable accessibilityRole="button" onPress={() => void feed.refetch()} style={styles.retry}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : height > 0 ? (
        <View style={styles.centered}>
          <Text style={styles.centerTitle}>{hasNextPage || isFetchingNextPage ? 'Đang tìm video…' : 'Chưa có video nào'}</Text>
          <Text style={styles.centerText}>Video mới của cộng đồng sẽ hiện ở đây.</Text>
        </View>
      ) : null}

      <View pointerEvents="box-none" style={[styles.topBar, { paddingTop: insets.top + Spacing.two }]}>
        <RoundButton
          label="Đóng"
          icon={{ ios: 'xmark', android: 'close', web: 'close' }}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/explore'))}
        />
        <Text accessibilityRole="header" style={styles.topTitle}>Video</Text>
        <RoundButton
          label={muted ? 'Bật tiếng' : 'Tắt tiếng'}
          icon={muted ? { ios: 'speaker.slash.fill', android: 'volume_off', web: 'volume_off' } : { ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' }}
          onPress={() => setMuted((value) => !value)}
        />
      </View>
    </View>
  );
}

function RoundButton({ label, icon, onPress }: { label: string; icon: IconName; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} style={({ pressed }) => [styles.round, { opacity: pressed ? 0.7 : 1 }]}>
      <SymbolView name={icon} size={20} tintColor={WHITE} />
    </Pressable>
  );
}

function ReelItem({ reel, height, active, muted, bottomInset }: { reel: Reel; height: number; active: boolean; muted: boolean; bottomInset: number }) {
  const { post, media } = reel;
  const accessToken = useSessionStore((state) => state.accessToken);
  const { like, bookmark, repost } = useFeedActions(post.id);
  const [expanded, setExpanded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const body = post.body?.trim() ?? '';
  const [ratioWidth, ratioHeight] = (media.aspectRatio ?? '').split(':').map(Number);
  // Portrait videos fill the screen; landscape ones keep their whole frame.
  const fit = ratioWidth && ratioHeight && ratioWidth / ratioHeight > 0.8 ? 'contain' : 'cover';

  // A video that leaves the screen starts from the top next time and shows its poster again.
  const [wasActive, setWasActive] = useState(active);
  if (wasActive !== active) {
    setWasActive(active);
    if (!active) { setPaused(false); setStarted(false); }
  }

  function requireLogin(action: () => void) {
    if (accessToken) action();
    else router.push({ pathname: '/login', params: { returnTo: '/explore' } });
  }

  return (
    <View style={{ height }}>
      {!started ? <Image source={media.posterUrl ? { uri: media.posterUrl } : undefined} style={StyleSheet.absoluteFill} contentFit={fit} /> : null}
      {active ? <ReelPlayer url={reel.playbackUrl} fit={fit} muted={muted} paused={paused} onStarted={() => setStarted(true)} /> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={paused ? 'Phát video' : 'Tạm dừng video'}
        onPress={() => setPaused((value) => !value)}
        style={StyleSheet.absoluteFill}>
        {paused ? <View style={styles.pauseBadge}><SymbolView name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }} size={34} tintColor={WHITE} /></View> : null}
      </Pressable>

      <View pointerEvents="box-none" style={[styles.overlay, { paddingBottom: bottomInset + Spacing.four }]}>
        <View pointerEvents="box-none" style={styles.info}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Xem hồ sơ ${post.author.fullName}`} onPress={() => router.push({ pathname: '/profile/[id]', params: { id: post.author.id } })} style={styles.author}>
            <ProfileAvatar profile={{ fullName: post.author.fullName, avatarUrl: post.author.avatarUrl ?? null }} size={36} style={styles.avatar} />
            <Text numberOfLines={1} style={styles.authorName}>{post.author.fullName}</Text>
          </Pressable>
          {body ? (
            <Pressable accessibilityRole="button" accessibilityLabel={expanded ? 'Thu gọn mô tả' : 'Xem thêm mô tả'} onPress={() => setExpanded((value) => !value)}>
              <Text numberOfLines={expanded ? 8 : 2} style={styles.caption}>{body}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.actions}>
          <ReelAction
            label={post.isLiked ? 'Bỏ thả mầm' : 'Thả mầm'}
            icon={{ ios: post.isLiked ? 'leaf.fill' : 'leaf', android: 'eco', web: 'eco' }}
            count={post.likeCount}
            active={post.isLiked}
            disabled={like.isPending}
            onPress={() => requireLogin(() => like.mutate(!post.isLiked))}
          />
          <ReelAction
            label="Bình luận"
            icon={{ ios: 'bubble.left.fill', android: 'chat_bubble', web: 'chat_bubble' }}
            count={post.commentCount}
            onPress={() => router.push({ pathname: '/posts/[id]', params: { id: post.id } })}
          />
          <ReelAction
            label={post.isReposted ? 'Bỏ đăng lại' : 'Đăng lại'}
            icon={{ ios: 'arrow.2.squarepath', android: 'repeat', web: 'repeat' }}
            count={post.repostCount}
            active={post.isReposted}
            disabled={repost.isPending}
            onPress={() => requireLogin(() => repost.mutate(!post.isReposted))}
          />
          <ReelAction
            label={post.isBookmarked ? 'Bỏ lưu' : 'Lưu'}
            icon={{ ios: post.isBookmarked ? 'bookmark.fill' : 'bookmark', android: 'bookmark', web: 'bookmark' }}
            active={post.isBookmarked}
            disabled={bookmark.isPending}
            onPress={() => requireLogin(() => bookmark.mutate(!post.isBookmarked))}
          />
        </View>
      </View>
    </View>
  );
}

function ReelAction({ label, icon, count, active, disabled, onPress }: {
  label: string; icon: IconName; count?: number; active?: boolean; disabled?: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count === undefined ? label : `${label}, ${count} lượt`}
      accessibilityState={{ selected: !!active, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.action, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={[styles.actionIcon, active && styles.actionIconActive]}>
        <SymbolView name={icon} size={24} tintColor={active ? '#75b65c' : WHITE} />
      </View>
      {count !== undefined ? <Text style={styles.actionCount}>{formatCount(count)}</Text> : null}
    </Pressable>
  );
}

function setPlayerMuted(player: VideoPlayer, muted: boolean) {
  player.muted = muted;
}

/** One live player, mounted only for the video on screen so memory stays flat however far you scroll. */
function ReelPlayer({ url, fit, muted, paused, onStarted }: { url: string; fit: 'cover' | 'contain'; muted: boolean; paused: boolean; onStarted: () => void }) {
  const player = useVideoPlayer({ uri: url, contentType: 'hls' }, (instance) => {
    instance.loop = true;
    instance.timeUpdateEventInterval = 0.25;
    instance.play();
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { currentTime } = useEvent(player, 'timeUpdate', { currentTime: 0, bufferedPosition: 0, currentLiveTimestamp: null, currentOffsetFromLive: null });

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (isPlaying) onStarted();
  });

  useEffect(() => {
    setPlayerMuted(player, muted);
  }, [muted, player]);

  useEffect(() => {
    if (paused) player.pause();
    else player.play();
  }, [paused, player]);

  const duration = player.duration;
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <>
      <VideoView player={player} nativeControls={false} contentFit={fit} style={StyleSheet.absoluteFill} pointerEvents="none" />
      {status === 'loading' ? <View pointerEvents="none" style={styles.loading}><ActivityIndicator color={WHITE} /></View> : null}
      {status === 'error' ? <View pointerEvents="none" style={styles.loading}><Text style={styles.centerText}>Không phát được video này</Text></View> : null}
      <View pointerEvents="none" style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  centered: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.four },
  centerTitle: { color: WHITE, fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 24, textAlign: 'center' },
  centerText: { color: 'rgba(255,254,250,0.75)', fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  retry: { minHeight: 44, borderRadius: Radius.xl, backgroundColor: WHITE, paddingHorizontal: Spacing.four, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#14261a', fontFamily: Fonts.sansBold, fontSize: 15 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  topTitle: { color: WHITE, fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 24, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.38)', alignItems: 'center', justifyContent: 'center' },
  pauseBadge: { position: 'absolute', alignSelf: 'center', top: '45%', width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  overlay: { ...StyleSheet.absoluteFill, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.three },
  info: { flex: 1, minWidth: 0, gap: Spacing.two, paddingRight: Spacing.three },
  author: { alignSelf: 'flex-start', maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  avatar: { borderWidth: 1.5, borderColor: WHITE },
  authorName: { flexShrink: 1, color: WHITE, fontFamily: Fonts.sansBold, fontSize: 15, lineHeight: 21, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
  caption: { color: WHITE, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
  actions: { alignItems: 'center', gap: Spacing.three },
  action: { alignItems: 'center', gap: 2, minWidth: 48 },
  actionIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,0,0,0.38)', alignItems: 'center', justifyContent: 'center' },
  actionIconActive: { backgroundColor: 'rgba(255,254,250,0.18)' },
  actionCount: { color: WHITE, fontFamily: Fonts.sansSemibold, fontSize: 12, lineHeight: 16, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3 },
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'rgba(255,254,250,0.25)' },
  progressFill: { height: 3, backgroundColor: WHITE },
});
