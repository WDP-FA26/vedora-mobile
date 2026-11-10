import { Image, type ImageProps } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Modal, PanResponder, type PanResponderInstance, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';

const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_MS = 280;
const DISMISS_DISTANCE = 120;
const WHITE = '#fffefa';

type Callbacks = {
  /** True while the page is zoomed in, so the gallery stops paging. */
  onZoomChange: (zoomed: boolean) => void;
  onClose: () => void;
  /** 0 at rest, up to 1 while the image is dragged away to dismiss. */
  onDrag: (progress: number) => void;
};
type Mode = 'none' | 'pinch' | 'pan' | 'dismiss';

const touchDistance = (touches: readonly { pageX: number; pageY: number }[]) =>
  Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Pinch to zoom, drag to pan while zoomed, double tap to toggle zoom, and drag down to dismiss at rest.
 * Built on PanResponder and Animated so it behaves the same on iOS, Android and web without native modules.
 */
class ZoomModel {
  readonly scale = new Animated.Value(1);
  readonly tx = new Animated.Value(0);
  readonly ty = new Animated.Value(0);
  readonly responder: PanResponderInstance;
  private size = { width: 0, height: 0 };
  private current = 1;
  private x = 0;
  private y = 0;
  private startDistance = 0;
  private startScale = 1;
  private startX = 0;
  private startY = 0;
  private lastTap = 0;
  private moved = false;
  private mode: Mode = 'none';
  private callbacks: Callbacks = { onZoomChange: () => undefined, onClose: () => undefined, onDrag: () => undefined };

  constructor() {
    this.responder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // At rest the gallery may take horizontal swipes; once zoomed this page keeps the gesture.
      onPanResponderTerminationRequest: () => this.current <= 1.01 && this.mode !== 'dismiss',
      onPanResponderGrant: () => {
        this.mode = 'none';
        this.moved = false;
        this.startDistance = 0;
        this.startX = this.x;
        this.startY = this.y;
      },
      onPanResponderMove: (event, gesture) => this.move(event.nativeEvent.touches, gesture.dx, gesture.dy),
      onPanResponderRelease: (_event, gesture) => this.release(gesture.dy, gesture.vy),
      onPanResponderTerminate: () => this.release(0, 0),
    });
  }

  setCallbacks(callbacks: Callbacks) {
    this.callbacks = callbacks;
  }

  setSize(width: number, height: number) {
    this.size = { width, height };
  }

  /** Back to the untouched state, e.g. when the page is no longer on screen. */
  reset(animated = false) {
    this.apply(1, 0, 0, animated);
  }

  private apply(scale: number, x: number, y: number, animated: boolean) {
    const wasZoomed = this.current > 1.01;
    this.current = scale;
    this.x = x;
    this.y = y;
    if (animated) {
      Animated.parallel([
        Animated.spring(this.scale, { toValue: scale, useNativeDriver: true, bounciness: 0 }),
        Animated.spring(this.tx, { toValue: x, useNativeDriver: true, bounciness: 0 }),
        Animated.spring(this.ty, { toValue: y, useNativeDriver: true, bounciness: 0 }),
      ]).start();
    } else {
      this.scale.setValue(scale);
      this.tx.setValue(x);
      this.ty.setValue(y);
    }
    const zoomed = scale > 1.01;
    if (zoomed !== wasZoomed) this.callbacks.onZoomChange(zoomed);
  }

  private bounds(scale: number) {
    return { x: (this.size.width * (scale - 1)) / 2, y: (this.size.height * (scale - 1)) / 2 };
  }

  private move(touches: readonly { pageX: number; pageY: number }[], dx: number, dy: number) {
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) this.moved = true;

    if (touches.length >= 2) {
      this.mode = 'pinch';
      const distance = touchDistance(touches);
      if (!this.startDistance) {
        this.startDistance = distance;
        this.startScale = this.current;
      }
      const next = clamp((this.startScale * distance) / this.startDistance, 0.8, MAX_SCALE);
      this.current = next;
      this.scale.setValue(next);
      return;
    }
    if (this.mode === 'pinch') return;

    if (this.current > 1.01) {
      this.mode = 'pan';
      const limit = this.bounds(this.current);
      this.x = clamp(this.startX + dx, -limit.x, limit.x);
      this.y = clamp(this.startY + dy, -limit.y, limit.y);
      this.tx.setValue(this.x);
      this.ty.setValue(this.y);
      return;
    }
    if (this.mode === 'dismiss' || (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.5)) {
      this.mode = 'dismiss';
      this.ty.setValue(dy);
      this.callbacks.onDrag(Math.min(1, Math.abs(dy) / 300));
    }
  }

  private release(dy: number, vy: number) {
    const mode = this.mode;
    this.mode = 'none';
    this.startDistance = 0;

    if (mode === 'pinch') {
      if (this.current < 1.05) this.apply(1, 0, 0, true);
      else {
        const limit = this.bounds(this.current);
        this.apply(this.current, clamp(this.x, -limit.x, limit.x), clamp(this.y, -limit.y, limit.y), true);
      }
      return;
    }
    if (mode === 'dismiss') {
      if (Math.abs(dy) > DISMISS_DISTANCE || Math.abs(vy) > 0.9) this.callbacks.onClose();
      else {
        this.callbacks.onDrag(0);
        Animated.spring(this.ty, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
      }
      return;
    }
    if (mode === 'none' && !this.moved) {
      const now = Date.now();
      if (now - this.lastTap < DOUBLE_TAP_MS) {
        this.lastTap = 0;
        if (this.current > 1.01) this.apply(1, 0, 0, true);
        else this.apply(DOUBLE_TAP_SCALE, 0, 0, true);
      } else {
        this.lastTap = now;
      }
    }
  }
}

function ZoomPage({ uri, width, height, active, onZoomChange, onClose, onDrag }: {
  uri: string; width: number; height: number; active: boolean;
} & Callbacks) {
  const [model] = useState(() => new ZoomModel());
  model.setSize(width, height);

  useEffect(() => {
    model.setCallbacks({ onZoomChange, onClose, onDrag });
  });
  // A page that scrolls out of view starts fresh next time.
  useEffect(() => {
    if (!active) model.reset();
  }, [active, model]);

  return (
    <View style={{ width, height }}>
      <Animated.View
        {...model.responder.panHandlers}
        style={{ width, height, transform: [{ translateX: model.tx }, { translateY: model.ty }, { scale: model.scale }] }}>
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" accessibilityLabel="Ảnh phóng to" />
      </Animated.View>
    </View>
  );
}

/** Full-screen gallery. Closes with the X, the system back gesture or by dragging the image down. */
export function ImageViewer({ images, initialIndex = 0, onClose }: { images: string[]; initialIndex?: number; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const [backdrop] = useState(() => new Animated.Value(1));
  const list = useRef<FlatList<string>>(null);

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root} onLayout={(event) => setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdrop }]} />
        {size.width > 0 ? (
          <FlatList
            ref={list}
            data={images}
            horizontal
            pagingEnabled
            scrollEnabled={!zoomed && images.length > 1}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(uri, position) => `${position}-${uri}`}
            initialScrollIndex={Math.min(initialIndex, images.length - 1)}
            getItemLayout={(_, position) => ({ length: size.width, offset: size.width * position, index: position })}
            onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / size.width))}
            renderItem={({ item, index: position }) => (
              <ZoomPage
                uri={item}
                width={size.width}
                height={size.height}
                active={position === index}
                onZoomChange={setZoomed}
                onClose={onClose}
                onDrag={(progress) => backdrop.setValue(1 - progress * 0.75)}
              />
            )}
          />
        ) : null}
        <View pointerEvents="box-none" style={[styles.top, { paddingTop: insets.top + 8 }]}>
          {images.length > 1 ? <Text style={styles.counter}>{index + 1}/{images.length}</Text> : <View />}
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng ảnh" onPress={onClose} hitSlop={8} style={({ pressed }) => [styles.close, { opacity: pressed ? 0.7 : 1 }]}>
            <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={18} tintColor={WHITE} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

type ZoomImageProps = ImageProps & {
  /** Larger or original image to open; defaults to the image's own `source.uri`. */
  zoomUri?: string;
  /** Every image of a set (post, article), to swipe between in the viewer. */
  gallery?: string[];
};

function uriOf(source: ImageProps['source']): string | null {
  if (typeof source === 'object' && source !== null && !Array.isArray(source) && 'uri' in source && typeof source.uri === 'string') return source.uri;
  return null;
}

/**
 * Drop-in for expo-image's `Image`: tapping opens the picture full screen with zoom. The wrapper takes over
 * `style` (size, radius, margins) and the image fills it. Images without a remote URI stay plain.
 */
export function ZoomImage({ zoomUri, gallery, style, accessibilityLabel, ...props }: ZoomImageProps) {
  const [open, setOpen] = useState(false);
  const uri = zoomUri ?? uriOf(props.source);
  if (!uri) return <Image style={style} accessibilityLabel={accessibilityLabel} {...props} />;
  const images = gallery?.length ? gallery : [uri];
  const start = Math.max(0, images.indexOf(uri));

  return (
    <>
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={accessibilityLabel ? `Phóng to ảnh: ${accessibilityLabel}` : 'Phóng to ảnh'}
        onPress={() => setOpen(true)}
        style={[style as never, styles.frame]}>
        <Image {...props} style={StyleSheet.absoluteFill} accessible={false} />
      </Pressable>
      {open ? <ImageViewer images={images} initialIndex={start} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { backgroundColor: '#000' },
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  counter: { color: WHITE, fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 20, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4, overflow: 'hidden' },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  frame: { overflow: 'hidden' },
});
