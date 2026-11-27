import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandColors, Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';
import { useRestaurantMutation, useReviews } from '../hooks/use-restaurants';
import { deleteReview, saveReview } from '../services/restaurant.service';
import {
  MAX_REVIEW_COMMENT_LENGTH,
  type RestaurantReviewFormInput,
  type RestaurantReviewSort,
} from '../types/restaurant.schema';
import { RestaurantRatingBar } from './restaurant-detail-ui';
import { Action, Busy, confirmRestaurant, Copy, Field, Heading, Notice, ui } from './restaurant-ui';

const ratingLabels = ['Rất không hài lòng', 'Chưa hài lòng', 'Bình thường', 'Hài lòng', 'Rất hài lòng'];

function ReviewStars({ rating }: { rating: number }) {
  const t = useTheme();
  return (
    <View accessible accessibilityLabel={`${rating} trên 5 sao`} style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <SymbolView
          key={star}
          name={{
            ios: star <= rating ? 'star.fill' : star - 0.5 <= rating ? 'star.leadinghalf.filled' : 'star',
            android: star <= rating ? 'star' : star - 0.5 <= rating ? 'star_half' : 'star_outline',
            web: star <= rating ? 'star' : star - 0.5 <= rating ? 'star_half' : 'star_outline',
          }}
          size={16}
          tintColor={star - 0.5 <= rating ? BrandColors.orange : t.mutedForeground}
        />
      ))}
    </View>
  );
}

export function RestaurantReviews({ id, managed }: { id: string; managed: boolean }) {
  const t = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  const actor = useSessionStore((state) => state.actor);
  const [sort, setSort] = useState<RestaurantReviewSort>('newest');
  const reviews = useReviews(id, sort);
  const data = reviews.data?.pages[0];
  const save = useRestaurantMutation((input: RestaurantReviewFormInput) => saveReview(id, input));
  const remove = useRestaurantMutation(() => deleteReview(id));
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [focused, setFocused] = useState(false);
  const busy = save.isPending || remove.isPending;

  return (
    <View style={styles.section}>
      <View style={styles.intro}>
        <Text style={[styles.eyebrow, { color: t.primary }]}>GÓC TRẢI NGHIỆM</Text>
        <Heading>Đánh giá nhà hàng</Heading>
        <Copy>Những chia sẻ giúp bạn chọn điểm hẹn chay tiếp theo.</Copy>
      </View>
      {reviews.isPending && <Busy />}
      <Notice error={reviews.error} retry={() => void reviews.refetch()} />
      {data && (
        <>
          <View style={[styles.panel, { backgroundColor: t.card, borderColor: t.border }]}>
            <View style={styles.summary}>
              <View style={styles.scoreBlock}>
                <View style={styles.scoreLine}>
                  <Text style={[styles.score, { color: t.foreground }]}>{data.summary.averageRating?.toFixed(1) ?? '—'}</Text>
                  <Text style={[styles.meta, { color: t.mutedForeground }]}>/ 5</Text>
                </View>
                <ReviewStars rating={data.summary.averageRating ?? 0} />
                <Text style={[styles.meta, { color: t.mutedForeground }]}>{data.summary.reviewCount.toLocaleString('vi-VN')} đánh giá</Text>
              </View>
              <View style={styles.distribution}>
                {([5, 4, 3, 2, 1] as const).map((star) => (
                  <RestaurantRatingBar key={star} star={star} total={data.summary.reviewCount} count={data.summary.breakdown[star]} />
                ))}
              </View>
            </View>
          </View>

          {!token ? (
            <View style={[styles.panel, { backgroundColor: t.secondary, borderColor: t.secondary }]}>
              <Text style={[styles.title, { color: t.foreground }]}>Bạn đã ghé quán?</Text>
              <Copy>Đăng nhập và chia sẻ trải nghiệm của bạn cùng cộng đồng.</Copy>
              <Action primary label="Đăng nhập để đánh giá" onPress={() => router.push({ pathname: '/login', params: { returnTo: `/restaurants/${id}` } })} />
            </View>
          ) : actor || managed ? (
            <View style={[styles.permission, { backgroundColor: t.muted }]}>
              <SymbolView name={{ ios: 'info.circle', android: 'info', web: 'info' }} size={20} tintColor={t.mutedForeground} />
              <View style={styles.flex}><Copy>{actor ? 'Chuyển về tài khoản cá nhân để đánh giá.' : 'Bạn không thể đánh giá nhà hàng mình quản lý.'}</Copy></View>
            </View>
          ) : (
            <View style={[styles.panel, { backgroundColor: t.card, borderColor: editing ? t.primary : t.border }]}>
              <View style={styles.editorHeading}>
                <View style={[styles.iconTile, { backgroundColor: t.secondary }]}>
                  <SymbolView name={{ ios: 'square.and.pencil', android: 'rate_review', web: 'rate_review' }} size={22} tintColor={t.primary} />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.title, { color: t.foreground }]}>{data.myReview ? 'Đánh giá của bạn' : 'Chia sẻ trải nghiệm'}</Text>
                  <Text style={[styles.meta, { color: t.mutedForeground }]}>{editing ? 'Bạn cảm thấy thế nào về quán?' : data.myReview ? 'Cảm ơn bạn đã chia sẻ cùng cộng đồng.' : 'Một nhận xét nhỏ, một gợi ý hữu ích.'}</Text>
                </View>
              </View>
              {!editing ? (
                <>
                  {data.myReview && (
                    <View style={styles.intro}>
                      <ReviewStars rating={data.myReview.rating} />
                      {!!data.myReview.comment && <Text style={[styles.comment, { color: t.foreground }]}>{data.myReview.comment}</Text>}
                    </View>
                  )}
                  <Action primary={!data.myReview} label={data.myReview ? 'Sửa đánh giá' : 'Viết đánh giá'} disabled={busy} onPress={() => {
                    setRating(data.myReview?.rating ?? 5);
                    setComment(data.myReview?.comment ?? '');
                    save.reset();
                    remove.reset();
                    setEditing(true);
                  }} />
                </>
              ) : (
                <>
                  <View style={[styles.ratingPicker, { backgroundColor: t.muted }]}>
                    <View accessibilityRole="radiogroup" accessibilityLabel="Chọn số sao" style={styles.starChoices}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Pressable
                          key={star}
                          accessibilityRole="radio"
                          accessibilityLabel={`${star} sao, ${ratingLabels[star - 1]}`}
                          accessibilityState={{ checked: rating === star, disabled: busy }}
                          disabled={busy}
                          onPress={() => setRating(star)}
                          style={({ pressed }) => [styles.starChoice, { opacity: busy ? 0.45 : pressed ? 0.6 : 1 }]}
                        >
                          <SymbolView name={{ ios: star <= rating ? 'star.fill' : 'star', android: star <= rating ? 'star' : 'star_outline', web: star <= rating ? 'star' : 'star_outline' }} size={30} tintColor={star <= rating ? BrandColors.orange : t.mutedForeground} />
                        </Pressable>
                      ))}
                    </View>
                    <Text accessibilityLiveRegion="polite" style={[styles.ratingLabel, { color: t.foreground }]}>{ratingLabels[rating - 1]}</Text>
                  </View>
                  <Field
                    label="Nhận xét của bạn (không bắt buộc)"
                    placeholder="Món ăn, không gian hay điều khiến bạn nhớ về quán…"
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    maxLength={MAX_REVIEW_COMMENT_LENGTH}
                    editable={!busy}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={[styles.commentInput, { backgroundColor: t.background, borderColor: focused ? t.primary : t.border }]}
                  />
                  <Text style={[styles.counter, { color: t.mutedForeground }]}>{comment.length}/{MAX_REVIEW_COMMENT_LENGTH} ký tự</Text>
                  <View style={ui.row}>
                    <Action primary label={save.isPending ? 'Đang lưu…' : 'Lưu đánh giá'} disabled={busy} onPress={() => save.mutate({ rating, comment }, { onSuccess: () => setEditing(false) })} />
                    <Action label="Hủy" disabled={busy} onPress={() => setEditing(false)} />
                  </View>
                </>
              )}
              {data.myReview && (
                <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => confirmRestaurant('Xóa đánh giá của bạn?', () => remove.mutate(undefined, { onSuccess: () => setEditing(false) }))} style={({ pressed }) => [styles.deleteAction, { opacity: busy ? 0.45 : pressed ? 0.6 : 1 }]}>
                  <SymbolView name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={17} tintColor={t.destructive} />
                  <Text style={[styles.actionLabel, { color: t.destructive }]}>{remove.isPending ? 'Đang xóa…' : 'Xóa đánh giá'}</Text>
                </Pressable>
              )}
              <Notice error={save.error ?? remove.error} />
            </View>
          )}

          <View style={styles.intro}>
            <Text accessibilityRole="header" style={[styles.title, { color: t.foreground }]}>Cộng đồng nói gì?</Text>
            <View style={styles.sorts}>
              {(['newest', 'highest', 'lowest'] as const).map((value, i) => (
                <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: sort === value }} onPress={() => setSort(value)} style={({ pressed }) => [styles.sort, { backgroundColor: sort === value ? t.secondary : t.card, borderColor: sort === value ? t.primary : t.border, opacity: pressed ? 0.65 : 1 }]}>
                  <Text style={[styles.actionLabel, { color: sort === value ? t.primary : t.mutedForeground }]}>{['Mới nhất', 'Sao cao nhất', 'Sao thấp nhất'][i]}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          {reviews.data?.pages.flatMap((page) => page.items).map((review) => (
            <View key={review.id} style={[styles.panel, { backgroundColor: t.card, borderColor: t.border }]}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Xem hồ sơ ${review.author.fullName}, @${review.author.username}`} onPress={() => router.push({ pathname: '/profile/[id]', params: { id: review.author.id } })} style={({ pressed }) => [styles.authorRow, { opacity: pressed ? 0.65 : 1 }]}>
                <View style={[styles.avatar, { backgroundColor: t.secondary }]}>
                  {review.author.avatarUrl ? <Image source={review.author.avatarUrl} contentFit="cover" style={StyleSheet.absoluteFill} accessible={false} /> : <Text style={[styles.initial, { color: t.primary }]}>{review.author.fullName.trim().charAt(0).toLocaleUpperCase('vi-VN')}</Text>}
                </View>
                <View style={styles.flex}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.authorName, { color: t.foreground }]}>{review.author.fullName}</Text>
                    {review.author.isProfessional && <View style={[styles.badge, { backgroundColor: t.secondary }]}><Text style={[styles.badgeLabel, { color: t.secondaryForeground }]}>Chuyên gia</Text></View>}
                  </View>
                  <Text style={[styles.meta, { color: t.mutedForeground }]}>@{review.author.username}</Text>
                </View>
                <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={18} tintColor={t.mutedForeground} />
              </Pressable>
              <View style={styles.reviewMeta}>
                <ReviewStars rating={review.rating} />
                <Text style={[styles.meta, { color: t.mutedForeground }]}>{new Date(review.updatedAt).toLocaleDateString('vi-VN')}</Text>
              </View>
              {!!review.comment && <Text style={[styles.comment, { color: t.foreground }]}>{review.comment}</Text>}
            </View>
          ))}
          {data.items.length === 0 && (
            <View style={[styles.empty, { backgroundColor: t.muted }]}>
              <View style={[styles.emptyIcon, { backgroundColor: t.card }]}><SymbolView name={{ ios: 'text.bubble', android: 'chat_bubble_outline', web: 'chat_bubble_outline' }} size={26} tintColor={t.primary} /></View>
              <Text style={[styles.title, { color: t.foreground, textAlign: 'center' }]}>Câu chuyện đầu tiên đang chờ bạn</Text>
              <Text style={[styles.emptyCopy, { color: t.mutedForeground }]}>Chưa có đánh giá. Chia sẻ cảm nhận sau khi ghé quán nhé.</Text>
            </View>
          )}
          {reviews.hasNextPage && <Action label={reviews.isFetchingNextPage ? 'Đang tải…' : 'Xem thêm đánh giá'} disabled={reviews.isFetchingNextPage} onPress={() => void reviews.fetchNextPage()} />}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 16, paddingTop: 12 },
  intro: { gap: 8 },
  eyebrow: { fontFamily: Fonts.sansBold, fontSize: 12, letterSpacing: 1.6 },
  panel: { padding: 18, gap: 14, borderWidth: 1, borderRadius: 22 },
  summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 24 },
  scoreBlock: { flexGrow: 1, flexBasis: 100, alignItems: 'center', gap: 8 },
  scoreLine: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  score: { fontFamily: Fonts.headingBold, fontSize: 44, lineHeight: 58, letterSpacing: -2 },
  distribution: { flexGrow: 2, flexBasis: 150, gap: 9 },
  stars: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  title: { fontFamily: Fonts.headingBold, fontSize: 16, lineHeight: 24 },
  meta: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20, flexShrink: 1 },
  permission: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16, borderRadius: 16 },
  flex: { flex: 1, minWidth: 0, gap: 3 },
  editorHeading: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  iconTile: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ratingPicker: { alignItems: 'center', gap: 4, padding: 12, borderRadius: 16 },
  starChoices: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  starChoice: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
  ratingLabel: { fontFamily: Fonts.sansSemibold, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  commentInput: { minHeight: 120, lineHeight: 24, borderRadius: 16 },
  counter: { textAlign: 'right', fontFamily: Fonts.sans, fontSize: 12, marginTop: -8 },
  deleteAction: { flexDirection: 'row', gap: 6, alignItems: 'center', alignSelf: 'flex-start', minHeight: 44 },
  actionLabel: { fontFamily: Fonts.sansSemibold, fontSize: 13, lineHeight: 20 },
  sorts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sort: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center', borderWidth: 1, borderRadius: 24 },
  authorRow: { flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 44 },
  avatar: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: Fonts.headingBold, fontSize: 19 },
  nameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  authorName: { fontFamily: Fonts.sansBold, fontSize: 16, lineHeight: 23, flexShrink: 1 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeLabel: { fontFamily: Fonts.sansSemibold, fontSize: 11, lineHeight: 16 },
  reviewMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  comment: { fontFamily: Fonts.sans, fontSize: 16, lineHeight: 25 },
  empty: { padding: 24, gap: 10, borderRadius: 22, alignItems: 'center' },
  emptyIcon: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyCopy: { textAlign: 'center', fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 },
});
