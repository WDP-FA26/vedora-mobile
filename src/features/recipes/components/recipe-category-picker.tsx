import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRecipeCategories } from '../hooks/use-recipes';
import type { RecipeTag } from '../types/recipe.schema';

const stickers: Record<RecipeTag, string> = { SOUP: '🥣', SALAD: '🥗', RICE: '🍚', NOODLES: '🍜', STIR_FRY: '🍳', BREAD: '🥖', DESSERT: '🍰', DRINK: '🥤', SNACK: '🍪' };

export function RecipeCategoryPicker({ value, onChange }: { value: string | null; onChange: (id: string | null, tag: RecipeTag | null) => void }) {
  const theme = useTheme();
  const categories = useRecipeCategories();
  if (categories.isPending) return <ActivityIndicator color={theme.primary} />;
  if (categories.isError) return <Pressable accessibilityRole="button" onPress={() => void categories.refetch()} style={{ paddingVertical: 12 }}><Text style={{ color: theme.destructive }}>Chưa tải được danh mục. Thử lại</Text></Pressable>;
  return <View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }} accessibilityLabel="Danh mục công thức">
    {[{ id: null, name: 'Tất cả', baseTag: null }, ...categories.data].map((item) => <Pressable key={item.id ?? 'all'} accessibilityRole="button" accessibilityState={{ selected: value === item.id }} onPress={() => onChange(item.id, item.baseTag)} style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 24, borderWidth: 1, justifyContent: 'center', backgroundColor: value === item.id ? theme.primary : theme.card, borderColor: value === item.id ? theme.primary : theme.border }}><Text style={{ fontFamily: Fonts.sansSemibold, color: value === item.id ? theme.primaryForeground : theme.foreground }}>{item.baseTag ? `${stickers[item.baseTag]} ` : '✨ '}{item.name}</Text></Pressable>)}
  </ScrollView></View>;
}
