import { useCallback, useRef, useState, type ReactElement } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { TurnstileChallenge } from './turnstile-challenge';

type Pending = { resolve: (token: string) => void; reject: (error: Error) => void };

/** Imperative Turnstile: `request()` opens a modal challenge and resolves with a fresh token. Render `element` once. */
export function useTurnstilePrompt(): { request: () => Promise<string>; element: ReactElement } {
  const theme = useTheme();
  const pending = useRef<Pending | null>(null);
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [failure, setFailure] = useState<string | null>(null);

  const request = useCallback(() => new Promise<string>((resolve, reject) => {
    pending.current?.reject(new Error('cancelled'));
    pending.current = { resolve, reject };
    setFailure(null);
    setAttempt((value) => value + 1);
    setOpen(true);
  }), []);

  function finish(token: string) {
    const current = pending.current;
    pending.current = null;
    setOpen(false);
    current?.resolve(token);
  }

  function cancel() {
    const current = pending.current;
    pending.current = null;
    setOpen(false);
    current?.reject(new Error('cancelled'));
  }

  const element = (
    <Modal visible={open} transparent animationType="fade" onRequestClose={cancel}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.foreground }]}>Xác minh bảo mật</Text>
          <TurnstileChallenge key={attempt} onToken={finish} onFailure={setFailure} />
          {failure ? <Text style={[styles.error, { color: theme.destructive }]}>{failure}</Text> : null}
          <View style={styles.actions}>
            {failure ? (
              <Pressable accessibilityRole="button" onPress={() => { setFailure(null); setAttempt((value) => value + 1); }}>
                <Text style={[styles.action, { color: theme.primary }]}>Thử lại</Text>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" onPress={cancel}>
              <Text style={[styles.action, { color: theme.mutedForeground }]}>Hủy</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  return { request, element };
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  sheet: { borderRadius: 16, borderWidth: 1, padding: 20, gap: 12 },
  title: { fontSize: 17, fontWeight: '700' },
  error: { fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20 },
  action: { fontSize: 15, fontWeight: '600' },
});
