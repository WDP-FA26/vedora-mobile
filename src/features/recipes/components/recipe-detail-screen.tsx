import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { RecipeNutrition } from '@/features/dietary-profile/components/recipe-nutrition';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ZoomImage } from '@/shared/components/image-viewer';
import { ApiError } from '@/shared/api/api-error';

import { useRecipe } from '../hooks/use-recipes';
import { formatIngredient, recipeMinutes } from '../utils/recipe-format';
import { RecipeSaveButton } from './recipe-save-button';
import { RecipeRating } from './recipe-rating';

export function RecipeDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = useRecipe(id);
  const data = recipe.data;
  const notFound = recipe.error instanceof ApiError && recipe.error.status === 404;
  const minutes = data ? recipeMinutes(data) : null;
  const [failedUrl, setFailedUrl] = useState<string>();

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => (router.canGoBack() ? router.back() : router.replace('/explore'))} hitSlop={10} style={styles.back}>
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
            <View style={styles.body}>
              <View style={[styles.photo, { backgroundColor: theme.secondary }]}>
                {data.imageUrl && data.imageUrl !== failedUrl ? (
                  <ZoomImage source={{ uri: data.imageUrl }} style={styles.image} contentFit="cover" accessibilityLabel={data.title} onError={() => setFailedUrl(data.imageUrl!)} />
                ) : (
                  <View style={[styles.image, styles.imageEmpty]}>
                    <Image source={require('@/assets/branding/tomato-sticker.png')} style={styles.placeholderSticker} contentFit="contain" accessible={false} />
                    <Text style={[styles.kicker, { color: theme.secondaryForeground }]}>MÓN NGON CHỜ BẠN VÀO BẾP</Text>
                  </View>
                )}
              </View>
              <View style={styles.intro}>
                <View style={styles.introCopy}>
                  <Text style={[styles.kicker, { color: theme.primary }]}>CÙNG VÀO BẾP</Text>
                  <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>{data.title}</Text>
                </View>
                <Image source={require('@/assets/branding/carrot-sticker.png')} style={styles.sticker} contentFit="contain" accessible={false} />
              </View>
              <View style={[styles.stats, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {minutes !== null ? <View style={styles.stat}>
                  <SymbolView name={{ ios: 'clock', android: 'schedule', web: 'schedule' }} size={20} tintColor={theme.primary} />
                  <Text style={[styles.statValue, { color: theme.foreground }]}>{minutes} phút</Text>
                  <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>Tổng thời gian</Text>
                </View> : null}
                <View style={styles.stat}>
                  <SymbolView name={{ ios: 'person.2', android: 'group', web: 'group' }} size={20} tintColor={theme.primary} />
                  <Text style={[styles.statValue, { color: theme.foreground }]}>{data.servings} phần</Text>
                  <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>Khẩu phần</Text>
                </View>
                <View style={styles.stat}>
                  <SymbolView name={{ ios: 'leaf', android: 'eco', web: 'eco' }} size={20} tintColor={theme.primary} />
                  <Text style={[styles.statValue, { color: theme.foreground }]}>{data.ingredients.length}</Text>
                  <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>Nguyên liệu</Text>
                </View>
              </View>
              <RecipeSaveButton recipe={data} />
              <RecipeNutrition {...data} />
              {data.post ? (
                <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/posts/[id]', params: { id: data.post!.id } })} style={[styles.author, { backgroundColor: theme.muted }]}>
                  <SymbolView name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }} size={22} tintColor={theme.primary} />
                  <Text style={[styles.link, { color: theme.primary }]}>Công thức từ {data.post.author.fullName}</Text>
                  <SymbolView name={{ ios: 'arrow.up.right', android: 'north_east', web: 'north_east' }} size={17} tintColor={theme.primary} />
                </Pressable>
              ) : null}
              {data.description ? <Text style={[styles.text, { color: theme.foreground }]}>{data.description}</Text> : null}

              {data.conflicts.length > 0 ? (
                <View style={[styles.warning, { borderColor: theme.destructive }]}>
                  <View style={styles.sectionRow}>
                    <SymbolView name={{ ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' }} size={22} tintColor={theme.destructive} />
                    <Text style={[styles.section, styles.flex, { color: theme.destructive }]}>Lưu ý kết hợp nguyên liệu</Text>
                  </View>
                  {data.conflicts.map((conflict) => (
                    <Text key={conflict.ruleId} style={[styles.text, { color: theme.foreground }]}>
                      {conflict.a.name} + {conflict.b.name}: {conflict.reason}
                    </Text>
                  ))}
                </View>
              ) : null}

              <View style={[styles.ingredients, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.sectionRow}>
                  <Image source={require('@/assets/branding/avocado-sticker.png')} style={styles.smallSticker} contentFit="contain" accessible={false} />
                  <View style={styles.flex}>
                    <Text accessibilityRole="header" style={[styles.section, { color: theme.foreground }]}>Chuẩn bị nguyên liệu</Text>
                    <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>Cho {data.servings} khẩu phần</Text>
                  </View>
                </View>
                {data.ingredients.map((item, index) => (
                  <View key={`${item.ingredientId}-${item.name}`} style={[styles.ingredientRow, { borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth, borderTopColor: theme.border }]}>
                    <View style={[styles.ingredientDot, { backgroundColor: theme.primary }]} />
                    <Text style={[styles.text, styles.flex, { color: theme.foreground }]}>{formatIngredient(item)}</Text>
                  </View>
                ))}
                {!data.ingredients.length ? <Text style={[styles.text, { color: theme.mutedForeground }]}>Công thức chưa cập nhật nguyên liệu.</Text> : null}
              </View>
              <View style={styles.instructions}>
                <View style={styles.sectionRow}>
                  <View style={styles.flex}>
                    <Text accessibilityRole="header" style={[styles.section, { color: theme.foreground }]}>Từng bước vào bếp</Text>
                    <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>{data.steps.length} bước thực hiện</Text>
                  </View>
                  <Image source={require('@/assets/branding/tomato-sticker.png')} style={styles.smallSticker} contentFit="contain" accessible={false} />
                </View>
                {data.steps.map((step, index) => (
                  <View key={index} style={[styles.step, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={[styles.stepBadge, { backgroundColor: theme.secondary }]}><Text style={[styles.stepNumber, { color: theme.secondaryForeground }]}>{String(index + 1).padStart(2, '0')}</Text></View>
                    <Text style={[styles.text, styles.flex, { color: theme.foreground }]}>{step}</Text>
                  </View>
                ))}
                {!data.steps.length ? <Text style={[styles.text, { color: theme.mutedForeground }]}>Công thức chưa cập nhật cách nấu.</Text> : null}
              </View>
              <RecipeRating key={data.id} recipeId={data.id} />
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
  back: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: Fonts.headingBold, fontSize: 18 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingBottom: Spacing.five },
  state: { padding: Spacing.five, alignItems: 'center', gap: Spacing.three },
  photo: { borderRadius: Radius['4xl'], overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 4 / 3 },
  imageEmpty: { alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.three },
  placeholderSticker: { width: '45%', height: '60%', transform: [{ rotate: '-8deg' }] },
  body: { padding: Spacing.three, gap: 20 },
  intro: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two },
  introCopy: { flexBasis: 180, flexGrow: 1, flexShrink: 1, gap: Spacing.two },
  kicker: { fontFamily: Fonts.sansBold, fontSize: 11, letterSpacing: 1.2 },
  sticker: { width: 54, height: 72, transform: [{ rotate: '10deg' }] },
  smallSticker: { width: 44, height: 52 },
  ingredients: { padding: Spacing.three, gap: Spacing.two, borderWidth: 1, borderRadius: Radius['3xl'] },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  ingredientDot: { width: 6, height: 6, borderRadius: 3, marginTop: 9 },
  title: { fontFamily: Fonts.headingBold, fontSize: 24, lineHeight: 34 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, borderWidth: 1, borderRadius: Radius['3xl'], padding: Spacing.three },
  stat: { flexGrow: 1, flexBasis: 75, alignItems: 'center', gap: 5 },
  statValue: { fontFamily: Fonts.sansBold, fontSize: 17, lineHeight: 24, textAlign: 'center' },
  statLabel: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20 },
  author: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: 12, minHeight: 48, borderRadius: Radius.xl },
  link: { flex: 1, fontFamily: Fonts.sansSemibold, fontSize: 14, lineHeight: 21 },
  section: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 27 },
  text: { fontFamily: Fonts.sans, fontSize: 16, lineHeight: 26 },
  warning: { borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.three, gap: Spacing.two },
  instructions: { gap: 12 },
  step: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: Radius['3xl'], padding: Spacing.three },
  stepBadge: { minWidth: 36, minHeight: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', padding: Spacing.one },
  stepNumber: { fontFamily: Fonts.sansBold, fontSize: 15, lineHeight: 22 },
  flex: { flex: 1 },
  retry: { minHeight: 44, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.four, alignItems: 'center', justifyContent: 'center' },
  retryText: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
});
