import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { useRecipeRating } from '../hooks/use-recipe-rating';

function ratingError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'SELF_RATING_NOT_ALLOWED') return 'Bạn không thể đánh giá công thức của chính mình.';
    if (error.code === 'EMAIL_NOT_VERIFIED') return 'Bạn cần xác minh email trước khi đánh giá.';
    if (error.code === 'RATING_CONFLICT') return 'Đánh giá vừa thay đổi. Hãy tải lại điểm trước khi thử lại.';
    if (error.status === 401) return 'Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.';
    if (error.status === 404) return 'Công thức không còn tồn tại.';
  }
  return 'Chưa cập nhật được đánh giá. Kiểm tra kết nối và thử lại.';
}

export function RecipeRating({ recipeId }: { recipeId: string }) {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  const { query, mutation, pending, change } = useRecipeRating(recipeId);
  const data = query.data;
  const mine = data && 'myRating' in data && typeof data.myRating === 'number' ? data.myRating : null;
  const error = mutation.error ?? query.error;
  const needsLogin = !token || (error instanceof ApiError && error.status === 401);
  const disabled = pending || !data || query.isError || query.isFetching;
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>Bạn thấy món này thế nào?</Text>
          <Text style={[styles.text, { color: theme.mutedForeground }]}>Chia sẻ một chút cảm nhận của bạn</Text>
        </View>
        <View style={[styles.ratingIcon, { backgroundColor: theme.secondary }]}>
          <SymbolView name={{ ios: 'star.fill', android: 'star', web: 'star' }} size={24} tintColor={theme.primary} />
        </View>
      </View>
      {query.isPending ? <ActivityIndicator color={theme.primary} /> : null}
      {data ? <View style={[styles.summary, { backgroundColor: theme.muted }]}>
        {data.averageRating === null ? <Text style={[styles.text, { color: theme.mutedForeground }]}>Chưa có đánh giá</Text> : <>
          <Text style={[styles.score, { color: theme.foreground }]}>{data.averageRating.toFixed(1)}<Text style={[styles.scoreUnit, { color: theme.mutedForeground }]}>/5</Text></Text>
          <Text style={[styles.text, { color: theme.mutedForeground }]}>{data.ratingCount} lượt đánh giá</Text>
        </>}
      </View> : null}
      {needsLogin ? (
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/explore' } })} style={styles.action}>
          <Text style={[styles.text, { color: theme.primary }]}>Đăng nhập để đánh giá</Text>
        </Pressable>
      ) : (
        <>
          <Text style={[styles.text, { color: theme.foreground }]}>{mine ? `Bạn đã chấm ${mine}/5 sao. Chọn sao để thay đổi.` : 'Chọn số sao của bạn'}</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Đánh giá ${value} sao`} accessibilityState={{ selected: mine === value, disabled, busy: pending }}
                disabled={disabled} onPress={() => change(value)} style={({ pressed }) => [styles.star, { backgroundColor: mine !== null && value <= mine ? theme.secondary : theme.muted, opacity: disabled || pressed ? 0.5 : 1 }]}>
                <SymbolView name={{ ios: mine !== null && value <= mine ? 'star.fill' : 'star', android: mine !== null && value <= mine ? 'star' : 'star_outline', web: mine !== null && value <= mine ? 'star' : 'star_outline' }} size={30} tintColor={theme.primary} />
              </Pressable>
            ))}
          </View>
          {mine !== null ? <Pressable accessibilityRole="button" disabled={disabled} accessibilityState={{ disabled }} onPress={() => change(null)} style={styles.action}>
            <Text style={[styles.text, { color: theme.destructive, opacity: disabled ? 0.5 : 1 }]}>Gỡ đánh giá của tôi</Text>
          </Pressable> : null}
        </>
      )}
      {pending ? <ActivityIndicator accessibilityLabel="Đang cập nhật đánh giá" color={theme.primary} /> : null}
      {error ? <Text accessibilityRole="alert" style={[styles.text, { color: theme.destructive }]}>{ratingError(error)}</Text> : null}
      {query.isError || (error instanceof ApiError && error.code === 'RATING_CONFLICT') ? <Pressable accessibilityRole="button" disabled={pending || query.isFetching} onPress={() => { mutation.reset(); void query.refetch(); }} style={styles.action}>
        <Text style={[styles.text, { color: theme.primary }]}>Tải lại đánh giá</Text>
      </Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Radius['3xl'], padding: Spacing.three, gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headingCopy: { flex: 1, gap: 4 },
  ratingIcon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 27 },
  summary: { borderRadius: Radius['2xl'], padding: Spacing.three, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  score: { fontFamily: Fonts.headingBold, fontSize: 32, lineHeight: 44 },
  scoreUnit: { fontFamily: Fonts.sansSemibold, fontSize: 16 },
  text: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  stars: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing.one },
  star: { minWidth: 44, minHeight: 48, borderRadius: Radius.xl, justifyContent: 'center', alignItems: 'center' },
  action: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
});
