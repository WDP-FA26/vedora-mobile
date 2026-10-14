import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { FeedPost } from '../types/feed.schema';

type VideoMedia = FeedPost['media'][number];

export function FeedVideo({ media, visible }: { media: VideoMedia; visible: boolean }) {
  const theme = useTheme();
  const [opened, setOpened] = useState(false);
  const playbackId = media.status === 'READY' ? media.playbackId : null;

  if (!playbackId) {
    return (
      <View style={[styles.placeholder, { backgroundColor: theme.muted }]}>
        <Text style={[styles.placeholderText, { color: theme.mutedForeground }]}>Video chưa sẵn sàng</Text>
      </View>
    );
  }

  if (opened) {
    return <PlayingVideo playbackId={playbackId} visible={visible} onClose={() => setOpened(false)} />;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Phát video"
      onPress={() => setOpened(true)}
      style={styles.poster}>
      <Image source={{ uri: `https://image.mux.com/${encodeURIComponent(playbackId)}/thumbnail.jpg?width=800` }} style={styles.media} contentFit="cover" />
      <View style={styles.playBadge}><Text style={styles.playGlyph}>▶</Text></View>
    </Pressable>
  );
}

function PlayingVideo({ playbackId, visible, onClose }: { playbackId: string; visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const player = useVideoPlayer({ uri: `https://stream.mux.com/${encodeURIComponent(playbackId)}.m3u8`, contentType: 'hls' }, (instance) => {
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

  return <VideoView player={player} nativeControls contentFit="contain" style={styles.media} />;
}

const styles = StyleSheet.create({
  poster: { width: '100%', aspectRatio: 16 / 9, borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: '#17251a' },
  media: { width: '100%', aspectRatio: 16 / 9, borderRadius: Radius.xl, backgroundColor: '#17251a' },
  playBadge: { position: 'absolute', alignSelf: 'center', top: '40%', width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(20,38,26,0.82)', alignItems: 'center', justifyContent: 'center' },
  playGlyph: { fontSize: 21, color: '#fffefa', marginLeft: 3 },
  placeholder: { width: '100%', aspectRatio: 16 / 9, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', padding: Spacing.three },
  placeholderText: { fontFamily: Fonts.sansSemibold, textAlign: 'center' },
});
