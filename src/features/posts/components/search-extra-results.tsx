import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';

import { ProfessionalName } from '@/shared/components/professional-name';
import { Fonts } from '@/constants/theme';
import { PostCard } from '@/features/feed/components/post-card';
import { useProfileSearch } from '@/features/profile/hooks/use-profile-search';
import type { ProfileSearchItem } from '@/features/profile/types/profile.schema';
import { RecipeCard } from '@/features/recipes/components/recipe-card';
import { useRecipes } from '@/features/recipes/hooks/use-recipes';
import { RestaurantDish } from '@/features/restaurants/components/restaurant-detail-ui';
import { useDishSearch } from '@/features/restaurants/hooks/use-restaurants';
import type { RestaurantMenuSearchItem } from '@/features/restaurants/types/restaurant.schema';
import { useTheme } from '@/hooks/use-theme';
import { usePostSearch } from '../hooks/use-posts';

export type SearchTab = 'all' | 'people' | 'recipes' | 'dishes' | 'posts';

function SearchState({ q, pending, error, retry, empty }: { q: string; pending: boolean; error: boolean; retry: () => unknown; empty: boolean }) {
  const t = useTheme();
  return <View style={{ padding: 20, alignItems: 'center' }}>{!q ? <Text style={{ color: t.mutedForeground }}>Nhập từ khóa để tìm kiếm.</Text> : pending ? <ActivityIndicator color={t.primary} /> : error ? <Pressable accessibilityRole="button" onPress={() => void retry()}><Text style={{ color: t.destructive }}>Chưa tải được. Chạm để thử lại.</Text></Pressable> : empty ? <Text style={{ color: t.mutedForeground }}>Chưa tìm thấy kết quả phù hợp.</Text> : null}</View>;
}
function Person({ person }: { person: ProfileSearchItem }) {
  const t = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Xem hồ sơ ${person.fullName}`} onPress={() => router.push({ pathname: '/profile/[id]', params: { id: person.id } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderColor: t.border }}>
    {person.avatarUrl ? <Image source={{ uri: person.avatarUrl }} style={{ width: 48, height: 48, borderRadius: 18 }} /> : <View style={{ width: 48, height: 48, borderRadius: 18, backgroundColor: t.secondary, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: t.primary, fontFamily: Fonts.sansBold }}>{person.fullName.charAt(0)}</Text></View>}
    <View style={{ flex: 1, gap: 4 }}><ProfessionalName name={person.fullName} isProfessional={person.isProfessional} textStyle={{ color: t.foreground, fontFamily: Fonts.sansBold }} /><Text style={{ color: t.mutedForeground }}>@{person.username}{person.isFollowing ? ' · Đang theo dõi' : ''}</Text>{person.bio ? <Text numberOfLines={2} style={{ color: t.mutedForeground }}>{person.bio}</Text> : null}</View>
  </Pressable>;
}

function Dish({ dish }: { dish: RestaurantMenuSearchItem }) {
  const t = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`${dish.name}, ${dish.restaurant.name}`} onPress={() => router.push({ pathname: '/restaurants/[id]', params: { id: dish.restaurant.pageUserId } })} style={{ padding: 10 }}><RestaurantDish name={dish.name} image={dish.imageUrl} price={dish.priceVnd} description={dish.description} category={dish.category} available><Text style={{ color: t.primary, fontFamily: Fonts.sansSemibold }}>{dish.restaurant.name}</Text><Text style={{ color: t.mutedForeground }}>{dish.restaurant.address}</Text></RestaurantDish></Pressable>;
}

export function PeopleResults({ q }: { q: string }) {
  const query = useProfileSearch(q);
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  return <FlatList data={items} keyExtractor={(item) => item.id} renderItem={({ item }) => <Person person={item} />} keyboardShouldPersistTaps="handled" onEndReached={() => { if (query.hasNextPage && !query.isFetching && !query.isFetchNextPageError) void query.fetchNextPage(); }} onEndReachedThreshold={0.5} ListEmptyComponent={<SearchState q={q} pending={query.isPending} error={query.isError} retry={query.refetch} empty />} ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator /> : query.isFetchNextPageError ? <SearchState q={q} pending={false} error retry={query.fetchNextPage} empty={false} /> : undefined} />;
}

export function DishResults({ q }: { q: string }) {
  const query = useDishSearch(q);
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  return <FlatList data={items} keyExtractor={(item) => item.id} renderItem={({ item }) => <Dish dish={item} />} keyboardShouldPersistTaps="handled" onEndReached={() => { if (query.hasNextPage && !query.isFetching && !query.isFetchNextPageError) void query.fetchNextPage(); }} onEndReachedThreshold={0.5} ListEmptyComponent={<SearchState q={q} pending={query.isPending} error={query.isError} retry={query.refetch} empty />} ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator /> : query.isFetchNextPageError ? <SearchState q={q} pending={false} error retry={query.fetchNextPage} empty={false} /> : undefined} />;
}

export function AllResults({ q, onTab }: { q: string; onTab: (tab: SearchTab) => void }) {
  const t = useTheme();
  const people = useProfileSearch(q);
  const recipes = useRecipes({ q: q.slice(0, 100), suitableForMe: false }, !!q);
  const dishes = useDishSearch(q);
  const posts = usePostSearch(q);
  if (!q) return <View style={{ padding: 28, gap: 12, alignItems: 'center' }}><Text style={{ fontSize: 38 }}>🥗 🔎</Text><Text style={{ color: t.foreground, fontFamily: Fonts.headingBold, fontSize: 22, textAlign: 'center' }}>Bạn muốn tìm gì hôm nay?</Text><Text style={{ color: t.mutedForeground, textAlign: 'center', lineHeight: 22 }}>Tìm người dùng, công thức, món nhà hàng hoặc bài viết yêu thích.</Text></View>;
  const sections = [
    { key: 'people' as const, title: 'Người dùng', query: people, items: people.data?.pages[0]?.items.slice(0, 3).map((item) => <Person key={item.id} person={item} />) },
    { key: 'recipes' as const, title: 'Công thức', query: recipes, items: recipes.data?.pages[0]?.items.slice(0, 2).map((item) => <View key={item.id} style={{ padding: 12 }}><RecipeCard recipe={item} /></View>) },
    { key: 'dishes' as const, title: 'Món nhà hàng', query: dishes, items: dishes.data?.pages[0]?.items.slice(0, 4).map((item) => <Dish key={item.id} dish={item} />) },
    { key: 'posts' as const, title: 'Bài viết', query: posts, items: posts.data?.pages[0]?.items.filter((item) => item.status === 'PUBLISHED').slice(0, 3).map((item) => <PostCard key={item.id} post={item} visible={false} />) },
  ];
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24, width: '100%', maxWidth: 680, alignSelf: 'center' }}>{sections.map((section) => <View key={section.key} style={{ borderBottomWidth: 8, borderColor: t.secondary }}><View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text accessibilityRole="header" style={{ color: t.foreground, fontFamily: Fonts.headingBold, fontSize: 18 }}>{section.title}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Xem tất cả ${section.title}`} onPress={() => onTab(section.key)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: t.primary }}>Xem tất cả →</Text></Pressable></View>{section.items?.length ? section.items : <SearchState q={q} pending={section.query.isPending} error={section.query.isError} retry={section.query.refetch} empty />}</View>)}</ScrollView>;
}
