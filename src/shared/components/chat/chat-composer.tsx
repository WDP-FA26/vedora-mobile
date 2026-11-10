import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChatComposerProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  inputLabel: string;
  sendLabel: string;
  /** Blocks typing as well as sending. */
  inputDisabled?: boolean;
  /** Blocks only sending. */
  sendDisabled?: boolean;
  maxLength?: number;
  onFocus?: TextInputProps['onFocus'];
  hint?: string;
};

const CONTROL_SIZE = 40;
const INPUT_MIN_HEIGHT = CONTROL_SIZE;
const INPUT_MAX_HEIGHT = 120;

/** Bottom message bar: input and round send button share one centred row and grow upward together. */
export function ChatComposer({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  inputLabel,
  sendLabel,
  inputDisabled,
  sendDisabled,
  maxLength,
  onFocus,
  hint,
}: ChatComposerProps) {
  const theme = useTheme();
  const blocked = !!inputDisabled || !!sendDisabled || !value.trim();
  // iOS keeps a multiline input at its old height after the text is cleared in code (e.g. after sending),
  // so the height follows the measured content and snaps back to one line whenever the box is empty.
  const [contentHeight, setContentHeight] = useState(INPUT_MIN_HEIGHT);
  const inputHeight = value ? Math.min(Math.max(contentHeight, INPUT_MIN_HEIGHT), INPUT_MAX_HEIGHT) : INPUT_MIN_HEIGHT;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
      <View style={[styles.box, { backgroundColor: theme.muted, borderColor: theme.border }]}>
        <TextInput
          accessibilityLabel={inputLabel}
          editable={!inputDisabled}
          maxLength={maxLength}
          multiline
          onChangeText={onChangeText}
          onFocus={onFocus}
          onContentSizeChange={(event) => setContentHeight(Math.ceil(event.nativeEvent.contentSize.height))}
          scrollEnabled={inputHeight >= INPUT_MAX_HEIGHT}
          placeholder={placeholder}
          placeholderTextColor={theme.mutedForeground}
          style={[styles.input, { color: theme.foreground, height: inputHeight }]}
          value={value}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={sendLabel}
          accessibilityState={{ disabled: blocked }}
          disabled={blocked}
          onPress={onSubmit}
          style={[styles.send, { backgroundColor: blocked ? theme.mutedForeground : theme.primary, opacity: blocked ? 0.45 : 1 }]}>
          <SymbolView
            name={{ ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' }}
            size={18}
            tintColor={theme.primaryForeground}
          />
        </Pressable>
      </View>
      {hint ? <Text style={[styles.hint, { color: theme.mutedForeground }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two + Spacing.one,
    paddingBottom: Spacing.two + Spacing.one,
    gap: Spacing.two,
  },
  box: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius['3xl'],
    padding: Spacing.one,
    paddingLeft: Spacing.three,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingTop: 10,
    paddingBottom: 10,
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 20,
    textAlignVertical: 'center',
  },
  send: {
    width: CONTROL_SIZE,
    height: CONTROL_SIZE,
    borderRadius: CONTROL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    textAlign: 'center',
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 16,
  },
});
