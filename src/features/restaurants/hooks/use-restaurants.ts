import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { uploadImageToStorage } from '@/shared/api/upload-image';
import { useSessionStore } from '@/shared/stores/session-store';
import { getSessionRevision } from '@/shared/session/session-manager';
import { restaurantKeys as k } from '../data/restaurant.keys';
import * as api from '../services/restaurant.service';
import {
  locateRestaurant,
  restaurantAddressAt,
  searchRestaurantAddress,
} from '../services/restaurant-location.service';
import type { LngLat, RestaurantReviewSort } from '../types/restaurant.schema';

export function useRestaurants(location: LngLat | null) {
  return useQuery({
    queryKey: k.list(location),
    queryFn: ({ signal }) => api.getRestaurants(location, signal),
  });
}
export function useDishSearch(text: string) {
  const [q, setQ] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setQ(text.trim()), 350);
    return () => clearTimeout(timer);
  }, [text]);
  return useInfiniteQuery({
    queryKey: k.search(q),
    queryFn: ({ pageParam, signal }) => api.searchDishes(q, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: q.length > 0,
  });
}
export function useMenu(id: string, managed = false, enabled = true) {
  return useQuery({
    queryKey: k.menu(id, managed),
    queryFn: ({ signal }) => api.getMenu(id, managed, signal),
    enabled: !!id && enabled,
  });
}
export function useReviews(id: string, sort: RestaurantReviewSort) {
  const token = useSessionStore((state) => state.accessToken);
  return useInfiniteQuery({
    queryKey: k.reviews(id, sort, token),
    queryFn: ({ pageParam, signal }) =>
      api.getReviews(id, sort, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.hasNextPage ? last.meta.page + 1 : undefined,
    enabled: !!id,
  });
}
export function useMyWorkspaces() {
  const token = useSessionStore((state) => state.accessToken);
  return useQuery({
    queryKey: k.mine,
    queryFn: ({ signal }) => api.getMyWorkspaces(signal),
    enabled: !!token,
  });
}
export function useWorkspace(id: string) {
  const token = useSessionStore((state) => state.accessToken);
  return useQuery({
    queryKey: k.workspace(id),
    queryFn: ({ signal }) => api.getWorkspace(id, signal),
    enabled: !!id && !!token,
  });
}
/** Never write results from a previous identity back into the new account's cache. */
export function useRestaurantMutation<T, R>(action: (input: T) => Promise<R>) {
  const client = useQueryClient();
  const token = useSessionStore((state) => state.accessToken);
  const revision = getSessionRevision();
  return useMutation({
    mutationFn: (input: T) => {
      if (
        !token ||
        !useSessionStore.getState().accessToken ||
        getSessionRevision() !== revision
      )
        return Promise.reject(
          new Error('Phiên đã thay đổi. Vui lòng thử lại.')
        );
      return action(input);
    },
    retry: false,
    networkMode: 'always',
    onSuccess: () => {
      if (
        useSessionStore.getState().accessToken &&
        getSessionRevision() === revision
      ) {
        void client.invalidateQueries({ queryKey: k.all });
        void client.invalidateQueries({ queryKey: ['profile'] });
      }
    },
  });
}
export function useRestaurantImage(workspaceId?: string) {
  return useMutation({
    retry: false,
    networkMode: 'always',
    mutationFn: async (kind?: string) => {
      const revision = getSessionRevision();
      if (!useSessionStore.getState().accessToken)
        throw new Error('Vui lòng đăng nhập lại.');
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
      if (picked.canceled) return null;
      const image = picked.assets[0];
      const input = api.imageInputSchema.parse({
        contentType: image.mimeType ?? image.file?.type,
        sizeBytes:
          image.fileSize ??
          image.file?.size ??
          (Platform.OS !== 'web' ? new File(image.uri).size : 0),
      });
      if (getSessionRevision() !== revision)
        throw new Error('Phiên đã thay đổi. Vui lòng chọn lại ảnh.');
      const target = await api.requestImage(input, workspaceId, kind);
      await uploadImageToStorage(target.upload, image, input.contentType);
      if (getSessionRevision() !== revision)
        throw new Error('Phiên đã thay đổi. Vui lòng chọn lại ảnh.');
      return {
        id: 'id' in target ? target.id : '',
        uri: image.uri,
        url: 'url' in target ? target.url : '',
      };
    },
  });
}
export function useRestaurantLocation() {
  return useMutation({
    retry: false,
    networkMode: 'always',
    mutationFn: locateRestaurant,
  });
}
export function useRestaurantAddressSearch() {
  return useMutation({
    retry: false,
    networkMode: 'always',
    mutationFn: searchRestaurantAddress,
  });
}
export function useRestaurantAddressAt() {
  return useMutation({
    retry: false,
    networkMode: 'always',
    mutationFn: restaurantAddressAt,
  });
}
