import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { useRecipeFavorite } from '../hooks/use-recipes';
import type { Recipe } from '../types/recipe.schema';

export function RecipeSaveButton({ recipe }: { recipe: Recipe }) {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  const favorite = useRecipeFavorite(recipe.id);
  const saved = !!token && recipe.isFavorite;
  const label = saved ? 'Bỏ lưu công thức' : 'Lưu công thức';
  const error = favorite.error;
  const needsLogin = error instanceof ApiError && error.status === 401;
  return (
    <View style={styles.group}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label} ${recipe.title}`}
        accessibilityState={{ selected: saved, disabled: favorite.pending, busy: favorite.pending }}
        disabled={favorite.pending}
        onPress={() => {
          if (!token || needsLogin) {
            router.push({ pathname: '/login', params: { returnTo: '/recipes' } });
            return;
          }
          favorite.toggle(saved);
        }}
        style={({ pressed }) => [styles.button, { backgroundColor: saved ? theme.primary : theme.card, borderColor: saved ? theme.primary : theme.border, opacity: favorite.pending || pressed ? 0.65 : 1 }]}>
        {favorite.pending ? <ActivityIndicator size="small" color={saved ? theme.primaryForeground : theme.primary} /> : (
          <SymbolView name={{ ios: saved ? 'bookmark.fill' : 'bookmark', android: saved ? 'bookmark_added' : 'bookmark_add', web: saved ? 'bookmark_added' : 'bookmark_add' }} size={21} tintColor={saved ? theme.primaryForeground : theme.primary} />
        )}
        <Text style={[styles.label, { color: saved ? theme.primaryForeground : theme.primary }]}>{favorite.pending ? 'Đang cập nhật…' : saved ? 'Đã lưu' : 'Lưu công thức'}</Text>
      </Pressable>
      {favorite.isError ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.destructive }]}>
        {needsLogin ? 'Phiên đăng nhập đã hết. Bấm nút lưu để đăng nhập lại.' : error instanceof ApiError && error.status === 404 ? 'Công thức không còn tồn tại.' : 'Chưa cập nhật được. Kiểm tra kết nối và thử lại.'}
      </Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.one },
  button: { minHeight: 44, borderWidth: 1, borderRadius: Radius.xl, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  label: { fontFamily: Fonts.sansSemibold, fontSize: 14, flexShrink: 1 },
  error: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
});
