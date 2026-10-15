import { View } from 'react-native';

/** The small sprout mascot used by Vedora's web assistant, drawn with native views. */
export function SproutPet({ size = 72, accessible = true }: { size?: number; accessible?: boolean }) {
  const s = (value: number) => value * size / 64;
  const absolute = (left: number, top: number, width: number, height: number) => ({
    position: 'absolute' as const,
    left: s(left),
    top: s(top),
    width: s(width),
    height: s(height),
  });

  return (
    <View
      accessible={accessible}
      accessibilityRole="image"
      accessibilityLabel="Trợ lý hạt đậu mầm Vedora"
      style={{ width: size, height: s(72) }}
    >
      <View style={[absolute(30.7, 8, 2.6, 18), { backgroundColor: '#255d32', borderRadius: s(2) }]} />
      <View style={[absolute(16, 5, 18, 10), { backgroundColor: '#75b65c', borderRadius: s(12), transform: [{ rotate: '24deg' }] }]} />
      <View style={[absolute(30, 5, 18, 10), { backgroundColor: '#66aa53', borderRadius: s(12), transform: [{ rotate: '-24deg' }] }]} />
      <View style={[absolute(8, 24, 48, 44), {
        backgroundColor: '#93d671',
        borderRadius: s(24),
        shadowColor: '#255d32',
        shadowOpacity: 0.15,
        shadowRadius: s(3),
        shadowOffset: { width: 0, height: s(2) },
        elevation: 2,
      }]} />
      <View style={[absolute(17, 42, 30, 22), { backgroundColor: '#c7eaa4', borderRadius: s(16) }]} />
      <View style={[absolute(13.5, 44.5, 7, 7), { backgroundColor: '#efaaa3', opacity: 0.7, borderRadius: s(4) }]} />
      <View style={[absolute(43.5, 44.5, 7, 7), { backgroundColor: '#efaaa3', opacity: 0.7, borderRadius: s(4) }]} />
      <View style={[absolute(22.5, 38.5, 5, 7), { backgroundColor: '#263227', borderRadius: s(3) }]} />
      <View style={[absolute(36.5, 38.5, 5, 7), { backgroundColor: '#263227', borderRadius: s(3) }]} />
      <View style={[absolute(23.4, 39.1, 1.7, 1.7), { backgroundColor: '#fff', borderRadius: s(1) }]} />
      <View style={[absolute(37.4, 39.1, 1.7, 1.7), { backgroundColor: '#fff', borderRadius: s(1) }]} />
      <View style={[absolute(28, 49, 8, 4), {
        borderBottomWidth: s(2),
        borderBottomColor: '#263227',
        borderBottomLeftRadius: s(6),
        borderBottomRightRadius: s(6),
      }]} />
    </View>
  );
}
