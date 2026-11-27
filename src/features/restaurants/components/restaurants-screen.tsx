import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  useDishSearch,
  useRestaurantLocation,
  useRestaurants,
} from '../hooks/use-restaurants';
import type { LngLat } from '../types/restaurant.schema';
import { RestaurantMap } from './restaurant-map';
import { DiscoveryFilter, DiscoveryHeading, DiscoveryRestaurantCard, DiscoveryWelcome } from './restaurant-discovery-ui';
import {
  Action,
  Busy,
  Card,
  Copy,
  Heading,
  Notice,
  RestaurantShell,
  ui,
} from './restaurant-ui';

export function RestaurantsScreen() {
  const theme = useTheme();
  const [q, setQ] = useState('');
  const [location, setLocation] = useState<LngLat | null>(null);
  const [map, setMap] = useState(false);
  const restaurants = useRestaurants(location);
  const dishes = useDishSearch(q);
  const locate = useRestaurantLocation();
  const items = (restaurants.data?.items ?? []).filter(
    (r) =>
      r.name
        .toLocaleLowerCase('vi')
        .includes(q.trim().toLocaleLowerCase('vi')) ||
      r.address
        .toLocaleLowerCase('vi')
        .includes(q.trim().toLocaleLowerCase('vi'))
  );
  const open = (id: string) =>
    router.push({ pathname: '/restaurants/[id]', params: { id } });
  return (
    <RestaurantShell
      title="Nhà hàng chay"
      action={
        <Action label="Trang của tôi" onPress={() => router.push('/pages')} />
      }
    >
      <FlatList
        data={items}
        keyExtractor={(r) => r.pageUserId}
        contentContainerStyle={[ui.body, { maxWidth: 680, gap: 20 }]}
        keyboardShouldPersistTaps="handled"
        refreshing={restaurants.isRefetching}
        onRefresh={() => void restaurants.refetch()}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <DiscoveryWelcome />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, paddingHorizontal: 14 }}>
            <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} size={21} tintColor={theme.mutedForeground} />
            <TextInput
              accessibilityLabel="Tìm nhà hàng, địa chỉ hoặc món ăn"
              placeholder="Tên quán, địa chỉ hoặc món chay…"
              placeholderTextColor={theme.mutedForeground}
              value={q}
              onChangeText={setQ}
              returnKeyType="search"
              style={{ flex: 1, minHeight: 54, color: theme.foreground, fontFamily: Fonts.sans, fontSize: 15 }}
            />
            {q.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Xóa tìm kiếm" hitSlop={8} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }} onPress={() => setQ('')}><SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }} size={20} tintColor={theme.mutedForeground} /></Pressable>}
            </View>
            <View style={ui.row}>
              <DiscoveryFilter
                active={!!location}
                icon={{ ios: 'location', android: 'near_me', web: 'near_me' }}
                label={
                  location
                    ? 'Gần bạn · Bỏ chọn'
                    : locate.isPending
                      ? 'Đang định vị…'
                      : 'Gần tôi nhất'
                }
                disabled={locate.isPending}
                onPress={() =>
                  location
                    ? setLocation(null)
                    : locate.mutate(undefined, { onSuccess: setLocation })
                }
              />
              <DiscoveryFilter
                active={map}
                icon={{ ios: 'map', android: 'map', web: 'map' }}
                label={map ? 'Ẩn bản đồ' : 'Xem bản đồ'}
                onPress={() => setMap(!map)}
              />
            </View>
            <Notice error={locate.error} />
            {map && (
              <RestaurantMap
                restaurants={items}
                point={location}
                onSelect={open}
              />
            )}
            <Notice
              error={restaurants.error}
              retry={() => void restaurants.refetch()}
            />
            {restaurants.isPending && <Busy />}
            {q.trim() !== '' && (
              <>
                <Heading>Món ăn trong menu</Heading>
                {dishes.isFetching && <Busy />}
                <Notice
                  error={dishes.error}
                  retry={() => void dishes.refetch()}
                />
                {dishes.data?.pages
                  .flatMap((p) => p.items)
                  .map((dish) => (
                    <Card key={dish.id}>
                      {dish.imageUrl && (
                        <Image
                          source={dish.imageUrl}
                          style={ui.photo}
                          contentFit="cover"
                        />
                      )}
                      <Heading>{dish.name}</Heading>
                      <Copy>
                        {dish.priceVnd === null
                          ? 'Liên hệ giá'
                          : `${dish.priceVnd.toLocaleString('vi-VN')} đ`}{' '}
                        · {dish.category ?? 'Món ăn'}
                      </Copy>
                      <Copy>
                        {dish.restaurant.name} · {dish.restaurant.address}
                      </Copy>
                      <Action
                        label="Xem nhà hàng"
                        onPress={() => open(dish.restaurant.pageUserId)}
                      />
                    </Card>
                  ))}
                {dishes.data?.pages[0]?.items.length === 0 && (
                  <Copy>Chưa tìm thấy món phù hợp.</Copy>
                )}
                {dishes.hasNextPage && (
                  <Action
                    label="Tải thêm món"
                    disabled={dishes.isFetchingNextPage}
                    onPress={() => void dishes.fetchNextPage()}
                  />
                )}
              </>
            )}
            <DiscoveryHeading count={items.length}>
              {q.trim() ? 'Quán phù hợp với bạn' : location ? 'Nhà hàng gần bạn' : 'Khám phá các quán chay'}
            </DiscoveryHeading>
            {restaurants.data?.truncated && (
              <Copy>Đang hiển thị giới hạn nhà hàng đầu tiên từ máy chủ.</Copy>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <DiscoveryRestaurantCard
            restaurant={item}
            onOpen={() => open(item.pageUserId)}
          />
        )}
        ListEmptyComponent={
          !restaurants.isPending && !restaurants.error ? (
            <View style={{ alignItems: 'center', padding: 24, gap: 12 }}>
              <Image source={require('@/assets/branding/carrot-sticker.png')} contentFit="contain" accessible={false} style={{ width: 72, height: 88 }} />
              <Text style={{ color: theme.foreground, fontFamily: Fonts.sansBold, fontSize: 17 }}>Chưa tìm thấy quán phù hợp</Text>
              <Copy>Thử tên quán, khu vực hoặc một món chay khác nhé.</Copy>
              {q.trim() !== '' && <Action label="Xem tất cả nhà hàng" onPress={() => setQ('')} />}
            </View>
          ) : undefined
        }
      />
    </RestaurantShell>
  );
}
