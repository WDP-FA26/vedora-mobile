import { SymbolView } from 'expo-symbols';
import { useMemo, type ReactNode } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function PlannerMessageActions({ children, text, open, disabled, onReveal, onDismiss, onRewind }: {
  children: ReactNode; text: string; open: boolean; disabled: boolean;
  onReveal: () => void; onDismiss: () => void; onRewind: () => void;
}) {
  const theme = useTheme();
  const showIcon = open && !disabled;
  const swipe = useMemo(() => PanResponder.create({
    // Leave vertical gestures to the chat's ScrollView.
    onMoveShouldSetPanResponderCapture: (_event, gesture) => !disabled && Math.abs(gesture.dx) > 16 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
    onPanResponderRelease: (_event, gesture) => {
      if (!disabled && Math.abs(gesture.dx) >= 40 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5) onReveal();
    },
  }), [disabled, onReveal]);

  return <View {...swipe.panHandlers}>
    <Pressable disabled={disabled} onLongPress={onRewind} delayLongPress={400} onPress={onDismiss}
      style={showIcon ? styles.revealedMessage : undefined}
      accessibilityLabel={text} accessibilityHint="Nhấn giữ để quay lại yêu cầu trước đó hoặc vuốt ngang để hiện nút quay lại"
      accessibilityActions={disabled ? [] : [{ name: 'showRewind', label: 'Quay lại yêu cầu trước đó' }]}
      onAccessibilityAction={(event) => { if (!disabled && event.nativeEvent.actionName === 'showRewind') onRewind(); }}>
      {children}
    </Pressable>
    {showIcon ? <Pressable accessibilityRole="button" accessibilityLabel="Quay lại yêu cầu trước đó"
      onPress={onRewind} style={({ pressed }) => [styles.action, { backgroundColor: theme.secondary, borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}>
      <SymbolView name={{ ios: 'arrow.uturn.backward', android: 'undo', web: 'undo' }} size={20} tintColor={theme.primary} />
    </Pressable> : null}
  </View>;
}

const styles = StyleSheet.create({
  revealedMessage: { transform: [{ translateX: -52 }] },
  action: { position: 'absolute', right: 0, top: 0, width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
