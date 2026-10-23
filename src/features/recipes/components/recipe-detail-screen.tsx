import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';

import { useRecipe } from '../hooks/use-recipes';
import { formatIngredient, recipeMinutes } from '../utils/recipe-format';

export function RecipeDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = useRecipe(id);
  const data = recipe.data;
  const notFound = recipe.error instanceof ApiError && recipe.error.status === 404;
  const minutes = data ? recipeMinutes(data) : null;

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => (router.canGoBack() ? router.back() : router.replace('/recipes'))} hitSlop={10} style={styles.back}>
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={22} tintColor={theme.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.foreground }]}>Công thức</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {recipe.isPending ? <ActivityIndicator color={theme.primary} style={styles.state} /> : null}
        {recipe.isError ? (
          <View style={styles.state}>
            <Text style={[styles.title, { color: theme.foreground }]}>{notFound ? 'Công thức không còn tồn tại' : 'Chưa tải được công thức'}</Text>
            {!notFound ? (
              <Pressable accessibilityRole="button" onPress={() => void recipe.refetch()} style={[styles.retry, { borderColor: theme.border }]}>
                <Text style={[styles.retryText, { color: theme.primary }]}>Thử lại</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {data ? (
          <>
            {data.imageUrl ? <Image source={{ uri: data.imageUrl }} style={styles.image} contentFit="cover" /> : null}
            <View style={styles.body}>
              <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>{data.title}</Text>
              <Text style={[styles.meta, { color: theme.mutedForeground }]}>
                {[minutes !== null ? `${minutes} phút` : null, `${data.servings} khẩu phần`].filter(Boolean).join(' · ')}
              </Text>
              {data.post ? (
                <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/posts/[id]', params: { id: data.post!.id } })}>
                  <Text style={[styles.link, { color: theme.primary }]}>Xem bài viết của {data.post.author.fullName}</Text>
                </Pressable>
              ) : null}
              {data.description ? <Text style={[styles.text, { color: theme.foreground }]}>{data.description}</Text> : null}

              {data.conflicts.length > 0 ? (
                <View style={[styles.warning, { borderColor: theme.destructive }]}>
                  <Text style={[styles.section, { color: theme.destructive }]}>Lưu ý kết hợp nguyên liệu</Text>
                  {data.conflicts.map((conflict) => (
                    <Text key={conflict.ruleId} style={[styles.text, { color: theme.foreground }]}>
                      {conflict.a.name} + {conflict.b.name}: {conflict.reason}
                    </Text>
                  ))}
                </View>
              ) : null}

              <Text style={[styles.section, { color: theme.foreground }]}>Nguyên liệu</Text>
              {data.ingredients.map((item) => (
                <Text key={`${item.ingredientId}-${item.name}`} style={[styles.text, { color: theme.foreground }]}>• {formatIngredient(item)}</Text>
              ))}

              <Text style={[styles.section, { color: theme.foreground }]}>Cách làm</Text>
              {data.steps.map((step, index) => (
                <View key={index} style={styles.step}>
                  <Text style={[styles.stepNumber, { color: theme.primary }]}>{index + 1}.</Text>
                  <Text style={[styles.text, styles.stepText, { color: theme.foreground }]}>{step}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, borderBottomWidth: 1 },
  back: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: Fonts.headingBold, fontSize: 18 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingBottom: Spacing.five },
  state: { padding: Spacing.five, alignItems: 'center', gap: Spacing.three },
  image: { width: '100%', height: 220 },
  body: { padding: Spacing.three, gap: Spacing.two },
  title: { fontFamily: Fonts.headingBold, fontSize: 22, lineHeight: 30 },
  meta: { fontFamily: Fonts.sans, fontSize: 13 },
  link: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
  section: { fontFamily: Fonts.headingBold, fontSize: 17, marginTop: Spacing.three },
  text: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 },
  warning: { borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.three, gap: Spacing.one, marginTop: Spacing.two },
  step: { flexDirection: 'row', gap: Spacing.two },
  stepNumber: { fontFamily: Fonts.sansBold, fontSize: 15, lineHeight: 22 },
  stepText: { flex: 1 },
  retry: { minHeight: 42, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.four, alignItems: 'center', justifyContent: 'center' },
  retryText: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
});
