import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { Recipe } from '../types/recipe.schema';
import { recipeMinutes } from '../utils/recipe-format';
import { RecipeSaveButton } from './recipe-save-button';

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const theme = useTheme();
  const minutes = recipeMinutes(recipe);
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Xem công thức ${recipe.title}`}
        onPress={() => router.push({ pathname: '/recipes/[id]', params: { id: recipe.id } })}
      >
        <View style={styles.photo}>
          {recipe.imageUrl ? (
            <Image source={{ uri: recipe.imageUrl }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={[styles.image, styles.imageEmpty, { backgroundColor: theme.secondary }]}>
              <Image source={require('@/assets/branding/tomato-sticker.png')} style={styles.placeholderSticker} contentFit="contain" accessible={false} />
              <Text style={[styles.sub, { color: theme.mutedForeground }]}>Một món ngon đang chờ bạn</Text>
            </View>
          )}
          {minutes !== null ? <View style={[styles.timeBadge, { backgroundColor: theme.card }]}>
            <SymbolView name={{ ios: 'clock', android: 'schedule', web: 'schedule' }} size={15} tintColor={theme.primary} />
            <Text style={[styles.badgeText, { color: theme.foreground }]}>{minutes} phút</Text>
          </View> : null}
        </View>
        <View style={styles.cardCopy}>
          <Text style={[styles.cardTitle, { color: theme.foreground }]}>{recipe.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}><SymbolView name={{ ios: 'person.2', android: 'group', web: 'group' }} size={16} tintColor={theme.mutedForeground} /><Text style={[styles.sub, { color: theme.mutedForeground }]}>{recipe.servings} khẩu phần</Text></View>
            <View style={styles.metaItem}><SymbolView name={{ ios: 'carrot', android: 'grocery', web: 'grocery' }} size={16} tintColor={theme.mutedForeground} /><Text style={[styles.sub, { color: theme.mutedForeground }]}>{recipe.ingredientCount} nguyên liệu</Text></View>
          </View>
          {recipe.conflicts.length > 0 ? (
            <Text style={[styles.warning, { color: theme.destructive }]}>{recipe.conflicts.length} cảnh báo kết hợp nguyên liệu</Text>
          ) : null}
          {recipe.post ? <Text style={[styles.sub, { color: theme.mutedForeground }]}>Bởi {recipe.post.author.fullName}</Text> : null}
        </View>
      </Pressable>
      <View style={styles.save}><RecipeSaveButton recipe={recipe} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  sub: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  card: { borderWidth: 1, borderRadius: Radius['2xl'], overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 16 / 9 },
  imageEmpty: { alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  placeholderSticker: { width: 78, height: 78 },
  photo: { position: 'relative' },
  timeBadge: { position: 'absolute', bottom: 12, left: 12, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  badgeText: { fontFamily: Fonts.sansSemibold, fontSize: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  cardCopy: { padding: Spacing.three, gap: Spacing.two },
  cardTitle: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 27 },
  warning: { fontFamily: Fonts.sansSemibold, fontSize: 12 },
  save: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
});
