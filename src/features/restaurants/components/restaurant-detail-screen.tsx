import { useState } from 'react';
import { View } from 'react-native';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { MessageButton } from '@/features/messaging/components/message-button';
import { useSessionStore } from '@/shared/stores/session-store';
import {
  useMenu,
  useMyWorkspaces,
  useRestaurantMutation,
  useReviews,
} from '../hooks/use-restaurants';
import { deleteReview, saveReview } from '../services/restaurant.service';
import type {
  RestaurantReviewFormInput,
  RestaurantReviewSort,
} from '../types/restaurant.schema';
import { RestaurantMap } from './restaurant-map';
import { RestaurantDish, RestaurantHero, RestaurantQuickAction, RestaurantRatingBar } from './restaurant-detail-ui';
import {
  Action,
  Body,
  Busy,
  Card,
  confirmRestaurant,
  Copy,
  Field,
  Heading,
  Notice,
  RestaurantShell,
  ui,
} from './restaurant-ui';

export function RestaurantDetailScreen() {
  const userId = useSessionStore((state) => state.userId);
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useProfile(id);
  const menu = useMenu(id);
  const mine = useMyWorkspaces();
  const p = profile.data;
  const place = p?.restaurant;
  const [category, setCategory] = useState<string | null>(null);
  const categories = [
    ...new Set(menu.data?.items.map((item) => item.category ?? 'Khác')),
  ];
  const [linkError, setLinkError] = useState<unknown>(null);
  const openUrl = (url: string) => {
    setLinkError(null);
    void Linking.openURL(url).catch(setLinkError);
  };
  const managed = mine.data?.find((w) => w.pageUserId === id);
  return (
    <RestaurantShell title={p?.fullName ?? 'Nhà hàng'}>
      <Body>
        {profile.isPending && <Busy />}
        <Notice error={profile.error} retry={() => void profile.refetch()} />
        {p && (
          <>
            <RestaurantHero name={p.fullName} username={p.username} cover={p.coverUrl} avatar={p.avatarUrl} bio={p.bio} />
            <Card>
              {place && (
                <>
                  <Heading>Ghé thăm nhà hàng</Heading>
                  <Copy>{place.address}</Copy>
                  <Copy>
                    ★ {place.averageRating?.toFixed(1) ?? 'Chưa có đánh giá'} ·{' '}
                    {place.reviewCount} đánh giá
                  </Copy>
                  <View style={ui.row}>
                    <RestaurantQuickAction
                      label="Chỉ đường"
                      icon={{ ios: 'location.fill', android: 'directions', web: 'directions' }}
                      onPress={() =>
                        openUrl(
                          `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
                        )
                      }
                    />
                    {place.phone && (
                      <RestaurantQuickAction
                        label="Gọi điện"
                        icon={{ ios: 'phone', android: 'call', web: 'call' }}
                        onPress={() =>
                          openUrl(`tel:${place.phone!.replace(/[^0-9+]/g, '')}`)
                        }
                      />
                    )}
                    {place.website && /^https?:\/\//.test(place.website) && (
                      <RestaurantQuickAction
                        label="Website"
                        icon={{ ios: 'globe', android: 'language', web: 'language' }}
                        onPress={() => openUrl(place.website!)}
                      />
                    )}
                  </View>
                  <RestaurantMap point={place} />
                  <Notice error={linkError} />
                </>
              )}
              <View style={ui.row}>
                <Action
                  label="Bài đăng của nhà hàng"
                  onPress={() =>
                    router.push({ pathname: '/profile/[id]', params: { id } })
                  }
                />
                <MessageButton userId={id} />
                {managed && (
                  <Action
                    label="Quản lý Trang"
                    onPress={() =>
                      router.push({
                        pathname: '/pages/[id]',
                        params: { id: managed.id },
                      })
                    }
                  />
                )}
              </View>
            </Card>
            <Heading>Thực đơn của quán</Heading>
            <Copy>Khám phá hương vị chay theo từng danh mục.</Copy>
            <View style={ui.row}>
              <Action
                label="Tất cả"
                primary={category === null}
                onPress={() => setCategory(null)}
              />
              {categories.map((c) => (
                <Action
                  key={c}
                  label={c}
                  primary={category === c}
                  onPress={() => setCategory(c)}
                />
              ))}
            </View>
            {menu.isPending && <Busy />}
            <Notice error={menu.error} retry={() => void menu.refetch()} />
            {menu.data?.items
              .filter(
                (dish) =>
                  category === null || (dish.category ?? 'Khác') === category
              )
              .map((dish) => (
                <RestaurantDish key={dish.id} name={dish.name} image={dish.imageUrl} price={dish.priceVnd} available={dish.isAvailable} description={dish.description} />
              ))}
            {menu.data?.items.length === 0 && (
              <Copy>Nhà hàng chưa cập nhật thực đơn.</Copy>
            )}
            {place && (
              <Reviews
                key={`${id}:${userId ?? 'guest'}`}
                id={id}
                managed={!!managed}
              />
            )}
          </>
        )}
      </Body>
    </RestaurantShell>
  );
}
function Reviews({ id, managed }: { id: string; managed: boolean }) {
  const token = useSessionStore((state) => state.accessToken);
  const actor = useSessionStore((state) => state.actor);
  const [sort, setSort] = useState<RestaurantReviewSort>('newest');
  const reviews = useReviews(id, sort);
  const data = reviews.data?.pages[0];
  const save = useRestaurantMutation((input: RestaurantReviewFormInput) =>
    saveReview(id, input)
  );
  const remove = useRestaurantMutation(() => deleteReview(id));
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const busy = save.isPending || remove.isPending;
  return (
    <View style={{ gap: 16 }}>
      <Heading>Đánh giá nhà hàng</Heading>
      {reviews.isPending && <Busy />}
      <Notice error={reviews.error} retry={() => void reviews.refetch()} />
      {data && (
        <>
          <Card>
          <Heading>
            ★ {data.summary.averageRating?.toFixed(1) ?? '—'} ·{' '}
            {data.summary.reviewCount} đánh giá
          </Heading>
          {[5, 4, 3, 2, 1].map((star) => (
            <RestaurantRatingBar key={star} star={star} total={data.summary.reviewCount} count={data.summary.breakdown[String(star) as keyof typeof data.summary.breakdown]} />
          ))}
          </Card>
          {!token ? (
            <Action
              label="Đăng nhập để đánh giá"
              onPress={() =>
                router.push({
                  pathname: '/login',
                  params: { returnTo: `/restaurants/${id}` },
                })
              }
            />
          ) : actor ? (
            <Copy>Chuyển về tài khoản cá nhân để đánh giá.</Copy>
          ) : managed ? (
            <Copy>Bạn không thể đánh giá nhà hàng mình quản lý.</Copy>
          ) : (
            <Card>
              {data.myReview && (
                <>
                  <Heading>Đánh giá của bạn · {data.myReview.rating} ★</Heading>
                  <Copy>{data.myReview.comment}</Copy>
                </>
              )}
              {!editing ? (
                <Action
                  label={data.myReview ? 'Sửa đánh giá' : 'Viết đánh giá'}
                  onPress={() => {
                    setRating(data.myReview?.rating ?? 5);
                    setComment(data.myReview?.comment ?? '');
                    setEditing(true);
                  }}
                />
              ) : (
                <>
                  <Copy>Chọn số sao</Copy>
                  <View style={ui.row}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Action
                        key={star}
                        primary={rating === star}
                        label={`${star} ★`}
                        disabled={busy}
                        onPress={() => setRating(star)}
                      />
                    ))}
                  </View>
                  <Field
                    label="Nhận xét (tối đa 1000 ký tự)"
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    maxLength={1000}
                    editable={!busy}
                  />
                  <View style={ui.row}>
                    <Action
                      primary
                      label={save.isPending ? 'Đang lưu…' : 'Lưu đánh giá'}
                      disabled={busy}
                      onPress={() =>
                        save.mutate(
                          { rating, comment },
                          { onSuccess: () => setEditing(false) }
                        )
                      }
                    />
                    <Action
                      label="Hủy"
                      disabled={busy}
                      onPress={() => setEditing(false)}
                    />
                  </View>
                </>
              )}
              {data.myReview && (
                <Action
                  label="Xóa đánh giá của tôi"
                  disabled={busy}
                  onPress={() =>
                    confirmRestaurant('Xóa đánh giá của bạn?', () =>
                      remove.mutate(undefined, {
                        onSuccess: () => setEditing(false),
                      })
                    )
                  }
                />
              )}
              <Notice error={save.error ?? remove.error} />
            </Card>
          )}
          <View style={ui.row}>
            {(['newest', 'highest', 'lowest'] as const).map((value, i) => (
              <Action
                key={value}
                primary={sort === value}
                label={['Mới nhất', 'Sao cao nhất', 'Sao thấp nhất'][i]}
                onPress={() => setSort(value)}
              />
            ))}
          </View>
          {reviews.data?.pages
            .flatMap((page) => page.items)
            .map((review) => (
              <Card key={review.id}>
                <Heading>
                  {review.author.fullName}
                  {review.author.isProfessional ? ' · Chuyên gia' : ''}
                </Heading>
                <Copy>
                  {review.rating} ★ ·{' '}
                  {new Date(review.updatedAt).toLocaleDateString('vi-VN')}
                </Copy>
                {review.comment && <Copy>{review.comment}</Copy>}
                <Action
                  label={`Xem @${review.author.username}`}
                  onPress={() =>
                    router.push({
                      pathname: '/profile/[id]',
                      params: { id: review.author.id },
                    })
                  }
                />
              </Card>
            ))}
          {data.items.length === 0 && (
            <Copy>Chưa có đánh giá. Hãy chia sẻ trải nghiệm của bạn.</Copy>
          )}
          {reviews.hasNextPage && (
            <Action
              label="Tải thêm đánh giá"
              disabled={reviews.isFetchingNextPage}
              onPress={() => void reviews.fetchNextPage()}
            />
          )}
        </>
      )}
    </View>
  );
}
