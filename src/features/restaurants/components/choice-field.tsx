import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Fonts } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { Action, Field, Heading } from './restaurant-ui';

export function ChoiceField({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const theme = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: theme.foreground, fontFamily: Fonts.sansSemibold, fontSize: 14 }}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${options.find(([id]) => id === value)?.[1] ?? 'Chọn'}`}
        accessibilityState={{ disabled: !!disabled, expanded: open }}
        disabled={disabled}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, borderRadius: 14, padding: 14, minHeight: 50, opacity: disabled ? 0.45 : pressed ? 0.7 : 1 })}
        onPress={() => {
          setQ('');
          setOpen(true);
        }}
      >
        <Text style={{ flex: 1, color: value ? theme.foreground : theme.mutedForeground, fontFamily: Fonts.sansSemibold, fontSize: 15 }}>{options.find(([id]) => id === value)?.[1] ?? 'Chọn một mục'}</Text>
        <SymbolView name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }} size={20} tintColor={theme.mutedForeground} />
      </Pressable>
      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: theme.background,
            padding: 16,
            gap: 12,
          }}
        >
          <Heading>{label}</Heading>
          <Action label="Đóng" onPress={() => setOpen(false)} />
          <Field label="Tìm kiếm lựa chọn" value={q} onChangeText={setQ} />
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={options.filter(([id, name]) =>
              `${id} ${name}`
                .toLocaleLowerCase('vi')
                .includes(q.toLocaleLowerCase('vi'))
            )}
            keyExtractor={([id]) => id}
            renderItem={({ item: [id, name] }) => (
              <View style={{ marginBottom: 8 }}>
                <Action
                  label={name}
                  primary={id === value}
                  onPress={() => {
                    onChange(id);
                    setOpen(false);
                  }}
                />
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
