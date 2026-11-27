import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { MessageButton } from '@/features/messaging/components/message-button';
import { useSessionStore } from '@/shared/stores/session-store';
import {
  useMenu,
  useMyWorkspaces,
} from '../hooks/use-restaurants';
import { RestaurantMap } from './restaurant-map';
import { RestaurantDish, RestaurantHero, RestaurantQuickAction } from './restaurant-detail-ui';
import { RestaurantReviews } from './restaurant-reviews';
import {
  Action,
  Body,
  Busy,
  Card,
  Copy,
  Notice,
  RestaurantShell,
  RestaurantEmptyState,
  RestaurantSectionHeading,
  RestaurantTabs,
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
  const [tab, setTab] = useState<'menu' | 'about' | 'reviews'>('menu');
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
            <RestaurantHero name={p.fullName} username={p.username} cover={p.coverUrl} avatar={p.avatarUrl} bio={p.bio} rating={place?.averageRating} reviewCount={place?.reviewCount} />
              {place && (
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
              )}
              <Notice error={linkError} />
              <View style={ui.row}>
                <Action
                  label="Bài đăng"
                  icon={{ ios: 'text.bubble', android: 'article', web: 'article' }}
                  onPress={() =>
                    router.push({ pathname: '/profile/[id]', params: { id } })
                  }
                />
                <MessageButton userId={id} />
                {managed && (
                  <Action
                    label="Quản lý Trang"
                    icon={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }}
                    onPress={() =>
                      router.push({
                        pathname: '/pages/[id]',
                        params: { id: managed.id },
                      })
                    }
                  />
                )}
              </View>
            <RestaurantTabs selected={tab} onChange={setTab} items={[
              { value: 'menu', label: 'Thực đơn', count: menu.data?.items.length },
              { value: 'about', label: 'Thông tin' },
              { value: 'reviews', label: 'Đánh giá', count: place?.reviewCount },
            ]} />
            <View style={[styles.panel, tab !== 'menu' && styles.hidden]}>
            <RestaurantSectionHeading title="Hôm nay ăn gì?" description="Chọn một món chay ngon, dành một bữa nhẹ lành." sticker="carrot" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
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
            </ScrollView>
            {menu.isPending && <Busy />}
            <Notice error={menu.error} retry={() => void menu.refetch()} />
            {menu.data?.items
              .filter(
                (dish) =>
                  category === null || (dish.category ?? 'Khác') === category
              )
              .map((dish) => (
                <RestaurantDish key={dish.id} name={dish.name} image={dish.imageUrl} price={dish.priceVnd} available={dish.isAvailable} description={dish.description} category={dish.category} />
              ))}
            {menu.data?.items.length === 0 && (
              <RestaurantEmptyState title="Quán đang chuẩn bị thực đơn" description="Bạn có thể nhắn tin cho quán để hỏi món đang phục vụ nhé." />
            )}
            </View>
            <View style={[styles.panel, tab !== 'about' && styles.hidden]}>
              {place && <Card>
                <RestaurantSectionHeading title="Hẹn bạn tại quán" description="Lưu lại địa chỉ cho bữa chay tiếp theo." sticker="avocado" />
                {p.bio && <Copy>{p.bio}</Copy>}
                <Copy>{place.address}</Copy>
                {place.phone && <Copy>Điện thoại: {place.phone}</Copy>}
                {place.website && <Copy>Website: {place.website}</Copy>}
                {tab === 'about' && <RestaurantMap point={place} />}
              </Card>}
            </View>
            <View style={[styles.panel, tab !== 'reviews' && styles.hidden]}>
            {place && (
              <RestaurantReviews
                key={`${id}:${userId ?? 'guest'}`}
                id={id}
                managed={!!managed}
              />
            )}
            </View>
          </>
        )}
      </Body>
    </RestaurantShell>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 18 },
  hidden: { display: 'none' },
  categories: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
});
