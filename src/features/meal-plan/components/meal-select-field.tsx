import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Option<T extends string> = { value: T; label: string; description?: string; disabled?: boolean };

/** Inline expansion keeps selectors usable inside both the meal sheet and the live Voice modal. */
export function MealSelectField<T extends string>({ label, options, values, onChange, multiple, disabled, placeholder = 'Chọn một mục', summary }: {
  label: string;
  options: readonly Option<T>[];
  values: readonly T[];
  onChange: (values: T[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  placeholder?: string;
  summary?: string;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const expanded = open && !disabled;
  const selected = options.filter((option) => values.includes(option.value));
  const available = options.filter((option) => !option.disabled);
  const valueLabel = summary ?? (selected.length ? selected.map((option) => option.label).join(', ') : placeholder);
  function select(value: T) {
    onChange(multiple ? values.includes(value) ? values.filter((item) => item !== value) : [...values, value] : [value]);
    if (!multiple) setOpen(false);
  }
  return <View style={styles.group}>
    <Text style={[styles.label, { color: theme.foreground }]}>{label}</Text>
    <View style={[styles.field, { backgroundColor: theme.card, borderColor: expanded ? theme.primary : theme.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${valueLabel}`} accessibilityHint={multiple ? 'Mở danh sách để chọn nhiều mục' : 'Mở danh sách lựa chọn'} accessibilityState={{ disabled: !!disabled, expanded }} disabled={disabled} onPress={() => setOpen(!open)} style={({ pressed }) => [styles.trigger, { opacity: disabled ? 0.5 : pressed ? 0.75 : 1 }]}>
        <View style={styles.flex}>
          <Text numberOfLines={2} style={[styles.value, { color: selected.length ? theme.foreground : theme.mutedForeground }]}>{valueLabel}</Text>
          {multiple ? <Text style={[styles.hint, { color: theme.mutedForeground }]}>Có thể chọn nhiều mục</Text> : null}
        </View>
        {multiple ? <View style={[styles.count, { backgroundColor: theme.secondary }]}><Text style={[styles.label, { color: theme.primary }]}>{selected.length}</Text></View> : null}
        <SymbolView name={{ ios: expanded ? 'chevron.up' : 'chevron.down', android: expanded ? 'expand_less' : 'expand_more', web: expanded ? 'expand_less' : 'expand_more' }} size={20} tintColor={theme.primary} />
      </Pressable>
      {expanded ? <View style={[styles.menu, { borderTopColor: theme.border }]}>
        {multiple ? <View style={[styles.tools, { borderBottomColor: theme.border }]}>
          <Pressable accessibilityRole="button" disabled={!available.length} onPress={() => onChange(available.map((option) => option.value))} style={styles.tool}><Text style={[styles.label, { color: theme.primary }]}>Chọn tất cả</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={!values.length} onPress={() => onChange([])} style={[styles.tool, { opacity: values.length ? 1 : 0.4 }]}><Text style={[styles.label, { color: theme.mutedForeground }]}>Bỏ chọn</Text></Pressable>
        </View> : null}
        {options.map((option) => {
          const checked = values.includes(option.value);
          return <Pressable key={option.value} accessibilityRole={multiple ? 'checkbox' : 'radio'} accessibilityLabel={option.label} accessibilityState={{ checked, disabled: !!option.disabled }} disabled={option.disabled} onPress={() => select(option.value)} style={({ pressed }) => [styles.option, { backgroundColor: checked ? theme.secondary : pressed ? theme.muted : theme.card, opacity: option.disabled ? 0.4 : 1 }]}>
            <View style={[styles.check, { borderRadius: multiple ? 7 : 12, borderColor: checked ? theme.primary : theme.border, backgroundColor: checked ? theme.primary : theme.card }]}>{checked ? <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={15} tintColor={theme.primaryForeground} /> : null}</View>
            <View style={styles.flex}><Text style={[styles.value, { color: theme.foreground }]}>{option.label}</Text>{option.description ? <Text style={[styles.hint, { color: theme.mutedForeground }]}>{option.description}</Text> : null}</View>
          </Pressable>;
        })}
        {multiple ? <Pressable accessibilityRole="button" accessibilityLabel={`Xong chọn ${label.toLowerCase()}`} onPress={() => setOpen(false)} style={[styles.done, { borderTopColor: theme.border }]}><Text style={[styles.label, { color: theme.primary }]}>Xong · {selected.length} mục đã chọn</Text><SymbolView name={{ ios: 'chevron.up', android: 'expand_less', web: 'expand_less' }} size={18} tintColor={theme.primary} /></Pressable> : null}
      </View> : null}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  group: { gap: 8 }, flex: { flex: 1, gap: 3 },
  label: { fontFamily: Fonts.sansSemibold, fontSize: 14, lineHeight: 20 },
  value: { fontFamily: Fonts.sansSemibold, fontSize: 16, lineHeight: 23 },
  hint: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  field: { borderWidth: 1, borderRadius: Radius.xl, overflow: 'hidden' },
  trigger: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three },
  count: { minWidth: 28, minHeight: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  menu: { borderTopWidth: StyleSheet.hairlineWidth },
  tools: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  tool: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  option: { minHeight: 52, paddingHorizontal: Spacing.three, paddingVertical: 10, gap: Spacing.three, flexDirection: 'row', alignItems: 'center' },
  check: { width: 24, height: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  done: { minHeight: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.three, borderTopWidth: StyleSheet.hairlineWidth },
});
