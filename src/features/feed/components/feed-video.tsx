import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { FeedPost } from '../types/feed.schema';

type VideoMedia = FeedPost['media'][number];
type Frame = { width: number; height: number };

const DEFAULT_RATIO = 16 / 9;
const MIN_RATIO = 9 / 16;
const MAX_RATIO = 16 / 9;
/** Videos stay small inside a post: at most this tall and this share of the post's width. */
const MAX_HEIGHT = 240;
const MAX_WIDTH_SHARE = 0.85;

/** Width / height from the API's "w:h" string, clamped so a tall video cannot fill the whole screen. */
function videoRatio(aspectRatio: string | null) {
  const [width, height] = (aspectRatio ?? '').split(':').map(Number);
  if (!width || !height) return DEFAULT_RATIO;
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, width / height));
}

function fitFrame(available: number, ratio: number): Frame {
  const height = Math.min(MAX_HEIGHT, (available * MAX_WIDTH_SHARE) / ratio);
  return { width: height * ratio, height };
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return null;
  const rounded = Math.max(0, Math.round(seconds));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}

export function FeedVideo({ media, visible }: { media: VideoMedia; visible: boolean }) {
  const theme = useTheme();
  const [opened, setOpened] = useState(false);
  const [available, setAvailable] = useState(0);
  const playbackUrl = media.status === 'READY' ? media.playbackUrl : null;
  const duration = formatDuration(media.durationSec);
  const frame = fitFrame(available, videoRatio(media.aspectRatio));

  if (!playbackUrl) {
    return (
      <View style={[styles.placeholder, { backgroundColor: theme.muted }]}>
        <SymbolView name={{ ios: 'video', android: 'videocam', web: 'videocam' }} size={22} tintColor={theme.mutedForeground} />
        <Text style={[styles.placeholderText, { color: theme.mutedForeground }]}>
          {media.status === 'FAILED' ? 'Video không khả dụng' : 'Video đang được xử lý'}
        </Text>
      </View>
    );
  }

  return (
    <View onLayout={(event) => setAvailable(event.nativeEvent.layout.width)}>
      {available > 0 && opened ? (
        <PlayingVideo playbackUrl={playbackUrl} frame={frame} visible={visible} onClose={() => setOpened(false)} />
      ) : null}
      {available > 0 && !opened ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Phát video" onPress={() => setOpened(true)} style={[styles.media, frame]}>
          <Image source={media.posterUrl ? { uri: media.posterUrl } : undefined} style={frame} contentFit="cover" />
          <View style={styles.kindBadge}>
            <SymbolView name={{ ios: 'video', android: 'videocam', web: 'videocam' }} size={12} tintColor={theme.primary} />
            <Text style={styles.kindText}>Video</Text>
          </View>
          <View style={styles.playBadge}><Text style={styles.playGlyph}>▶</Text></View>
          {duration ? (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{duration}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
}

function PlayingVideo({ playbackUrl, frame, visible, onClose }: { playbackUrl: string; frame: Frame; visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const player = useVideoPlayer({ uri: playbackUrl, contentType: 'hls' }, (instance) => {
    instance.play();
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  useEffect(() => {
    if (!visible) player.pause();
  }, [player, visible]);

  if (status === 'error') {
    return (
      <Pressable accessibilityRole="button" onPress={onClose} style={[styles.placeholder, { backgroundColor: theme.muted }]}>
        <Text style={[styles.placeholderText, { color: theme.mutedForeground }]}>Không phát được video. Chạm để thử lại.</Text>
      </Pressable>
    );
  }

  return <VideoView player={player} nativeControls contentFit="contain" style={[styles.media, frame]} />;
}

const styles = StyleSheet.create({
  media: { borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: '#17251a' },
  playBadge: { position: 'absolute', alignSelf: 'center', top: '40%', width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(20,38,26,0.82)', alignItems: 'center', justifyContent: 'center' },
  playGlyph: { fontSize: 18, color: '#fffefa', marginLeft: 3 },
  placeholder: { width: '85%', height: 96, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', gap: Spacing.one, padding: Spacing.three },
  placeholderText: { fontFamily: Fonts.sansSemibold, fontSize: 13, textAlign: 'center' },
  kindBadge: { position: 'absolute', top: Spacing.two, left: Spacing.two, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Radius.lg, backgroundColor: 'rgba(255,254,250,0.94)', flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  kindText: { fontFamily: Fonts.sansSemibold, fontSize: 11, color: '#14261a' },
  durationBadge: { position: 'absolute', right: Spacing.two, bottom: Spacing.two, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Radius.md, backgroundColor: 'rgba(20,38,26,0.82)' },
  durationText: { color: '#fffefa', fontFamily: Fonts.sansSemibold, fontSize: 11 },
});
