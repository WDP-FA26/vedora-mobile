import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { RecipeNutrition } from '@/features/dietary-profile/components/recipe-nutrition';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { Recipe } from '../types/recipe.schema';
import { recipeMinutes } from '../utils/recipe-format';
import { RecipeSaveButton } from './recipe-save-button';

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const theme = useTheme();
  const minutes = recipeMinutes(recipe);
  const [failedUrl, setFailedUrl] = useState<string>();
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Xem công thức ${recipe.title}`}
        onPress={() => router.push({ pathname: '/recipes/[id]', params: { id: recipe.id } })}
        style={({ pressed }) => [styles.open, { opacity: pressed ? 0.8 : 1 }]}
      >
        <View style={styles.photo}>
          {recipe.imageUrl && recipe.imageUrl !== failedUrl ? (
            <Image source={{ uri: recipe.imageUrl }} style={styles.image} contentFit="cover" recyclingKey={recipe.imageUrl} onError={() => setFailedUrl(recipe.imageUrl!)} accessible={false} />
          ) : (
            <View style={[styles.image, styles.imageEmpty, { backgroundColor: theme.secondary }]}>
              <Image source={require('@/assets/branding/tomato-sticker.png')} style={styles.placeholderSticker} contentFit="contain" accessible={false} />
            </View>
          )}
          {minutes !== null ? <View style={[styles.timeBadge, { backgroundColor: theme.card }]}>
            <SymbolView name={{ ios: 'clock', android: 'schedule', web: 'schedule' }} size={15} tintColor={theme.primary} />
            <Text style={[styles.badgeText, { color: theme.foreground }]}>{minutes} phút</Text>
          </View> : null}
        </View>
        <View style={styles.cardCopy}>
          <Text numberOfLines={2} style={[styles.cardTitle, { color: theme.foreground }]}>{recipe.title}</Text>
          <RecipeNutrition {...recipe} />
          <View style={styles.metaRow}>
            <Text style={[styles.sub, { color: theme.mutedForeground }]}>{recipe.servings} phần</Text>
            <Text style={[styles.sub, { color: theme.mutedForeground }]}>{recipe.ingredientCount} nguyên liệu</Text>
          </View>
          {recipe.conflicts.length > 0 ? (
            <Text style={[styles.warning, { color: theme.destructive }]}>{recipe.conflicts.length} cảnh báo kết hợp nguyên liệu</Text>
          ) : null}
          {recipe.post ? <Text numberOfLines={1} style={[styles.sub, { color: theme.mutedForeground }]}>Bởi {recipe.post.author.fullName}</Text> : null}
          <View style={styles.openHint}>
            <Text numberOfLines={1} style={[styles.hintText, { color: theme.primary }]}>Vào bếp thôi</Text>
            <SymbolView name={{ ios: 'arrow.up.right', android: 'north_east', web: 'north_east' }} size={15} tintColor={theme.primary} />
          </View>
        </View>
      </Pressable>
      <View style={styles.save}><RecipeSaveButton recipe={recipe} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  sub: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  card: { flex: 1, borderWidth: 1, borderRadius: Radius['3xl'], overflow: 'hidden' },
  open: { flex: 1 },
  image: { width: '100%', aspectRatio: 4 / 3 },
  imageEmpty: { alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  placeholderSticker: { width: '45%', height: '65%', transform: [{ rotate: '-8deg' }] },
  photo: { position: 'relative' },
  timeBadge: { position: 'absolute', bottom: 10, left: 10, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  badgeText: { fontFamily: Fonts.sansSemibold, fontSize: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.two, rowGap: 2 },
  cardCopy: { padding: 12, gap: Spacing.two },
  cardTitle: { fontFamily: Fonts.headingBold, fontSize: 15, lineHeight: 23 },
  warning: { fontFamily: Fonts.sansSemibold, fontSize: 12, lineHeight: 18 },
  openHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 4 },
  hintText: { fontFamily: Fonts.sansBold, fontSize: 12, lineHeight: 18, flexShrink: 1 },
  save: { paddingHorizontal: 12, paddingBottom: 12 },
});
