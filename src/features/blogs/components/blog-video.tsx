import { useVideoPlayer, VideoView } from 'expo-video';

export function BlogVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url);
  return <VideoView player={player} nativeControls contentFit="contain" fullscreenOptions={{ enable: true }} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 16 }} />;
}
