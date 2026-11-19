import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useRecipe } from '@/features/recipes/hooks/use-recipes';
import { useTheme } from '@/hooks/use-theme';
import { ZoomImage } from '@/shared/components/image-viewer';

/** AI previews only carry a recipe reference; saved dishes already include their photo. */
export function MealRecipePhoto({ recipe }: { recipe: { id: string; title: string; imageUrl?: string | null } }) {
  const theme = useTheme();
  const detail = useRecipe(recipe.id, recipe.imageUrl === undefined);
  const url = recipe.imageUrl === undefined ? detail.data?.imageUrl : recipe.imageUrl;
  const [failedUrl, setFailedUrl] = useState<string>();
  if (url && url !== failedUrl) {
    return <ZoomImage source={{ uri: url }} style={styles.photo} contentFit="cover" accessibilityLabel={`Ảnh món ${recipe.title}`} onError={() => setFailedUrl(url)} />;
  }
  return (
    <View style={[styles.photo, styles.placeholder, { backgroundColor: theme.secondary }]}>
      {detail.isFetching && recipe.imageUrl === undefined ? <ActivityIndicator color={theme.primary} accessibilityLabel="Đang tải ảnh món ăn" /> : (
        <Image source={require('@/assets/branding/tomato-sticker.png')} style={styles.sticker} contentFit="contain" accessible={false} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { width: 56, height: 56, borderRadius: Radius.lg },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  sticker: { width: 32, height: 36 },
});
