import { z } from 'zod';
import { apiClient } from '@/shared/api/api-client';
import { requestJson } from '@/shared/api/request-json';
import * as s from '../types/restaurant.schema';

const idPath = (id: string) => encodeURIComponent(z.uuid().parse(id));
export function getRestaurants(
  location: s.LngLat | null,
  signal?: AbortSignal
) {
  return requestJson(s.restaurantPinListSchema, {
    url: '/restaurants',
    params: location
      ? { userLng: location.longitude, userLat: location.latitude }
      : {},
    signal,
  });
}
export function searchDishes(
  q: string,
  cursor: string | null,
  signal?: AbortSignal
) {
  return requestJson(s.restaurantMenuSearchPageSchema, {
    url: '/restaurants/menu/search',
    params: { q, cursor: cursor ?? undefined, limit: 15 },
    signal,
  });
}
export function getMenu(id: string, managed: boolean, signal?: AbortSignal) {
  return requestJson(s.restaurantMenuListSchema, {
    url: `/${managed ? 'workspaces' : 'restaurants'}/${idPath(id)}/menu`,
    signal,
  });
}
export function getReviews(
  id: string,
  sort: string,
  page: number,
  signal?: AbortSignal
) {
  return requestJson(s.restaurantReviewPageSchema, {
    url: `/restaurants/${idPath(id)}/reviews`,
    params: { sort, page, limit: 10 },
    signal,
  });
}
export function saveReview(id: string, input: s.RestaurantReviewFormInput) {
  return requestJson(s.restaurantReviewMutationResponseSchema, {
    method: 'PUT',
    url: `/restaurants/${idPath(id)}/reviews/me`,
    data: s.restaurantReviewFormSchema.parse(input),
  });
}
export function deleteReview(id: string) {
  return requestJson(s.restaurantReviewSummarySchema, {
    method: 'DELETE',
    url: `/restaurants/${idPath(id)}/reviews/me`,
  });
}
export function getMyWorkspaces(signal?: AbortSignal) {
  return requestJson(s.workspaceListSchema, {
    url: '/workspaces/mine',
    signal,
  });
}
export function getWorkspace(id: string, signal?: AbortSignal) {
  return requestJson(s.workspaceDetailSchema, {
    url: `/workspaces/${idPath(id)}`,
    signal,
  });
}
export async function saveApplication(input: unknown, resubmit?: string) {
  const { VN_WARDS } = await import('../data/vn-wards');
  const { proofs, location, otherPlatformUrls, legal, ...rest } =
    s.workspaceFormSchema.parse(input);
  if (!VN_WARDS[rest.provinceCode].some(([code]) => code === rest.wardCode))
    throw new Error('Phường/xã không thuộc tỉnh đã chọn.');
  return requestJson(s.workspaceDetailSchema, {
    method: 'POST',
    url: resubmit ? `/workspaces/${idPath(resubmit)}/resubmit` : '/workspaces',
    data: {
      ...rest,
      ...location,
      proofIds: proofs.map((proof) => proof.id),
      otherPlatformUrls: otherPlatformUrls.map(({ url }) => url),
      legal: {
        ...legal,
        legalName: legal.entityType === 'INDIVIDUAL' ? null : legal.legalName,
      },
    },
  });
}
export function updateDetails(id: string, input: s.RestaurantDetailsFormInput) {
  const { location, ...rest } = s.restaurantDetailsFormSchema.parse(input);
  return requestJson(s.workspaceDetailSchema, {
    method: 'PATCH',
    url: `/workspaces/${idPath(id)}/details`,
    data: { ...rest, ...location },
  });
}
export function addMember(id: string, username: string) {
  return requestJson(s.workspaceDetailSchema, {
    method: 'POST',
    url: `/workspaces/${idPath(id)}/members`,
    data: s.addMemberFormSchema.parse({ username }),
  });
}
export async function removeMember(id: string, userId: string) {
  await apiClient.delete(`/workspaces/${idPath(id)}/members/${idPath(userId)}`);
}
export function saveDish(
  id: string,
  input: s.MenuItemFormInput & { position?: number },
  itemId?: string
) {
  const { priceText, ...rest } = s.menuItemFormSchema.parse(input);
  return requestJson(s.restaurantMenuItemSchema, {
    method: itemId ? 'PATCH' : 'POST',
    url: `/workspaces/${idPath(id)}/menu${itemId ? `/${idPath(itemId)}` : ''}`,
    data: {
      ...rest,
      priceVnd: priceText === '' ? null : Number(priceText),
      ...(input.position === undefined
        ? {}
        : { position: z.number().int().min(0).parse(input.position) }),
    },
  });
}
export async function deleteDish(id: string, itemId: string) {
  await apiClient.delete(`/workspaces/${idPath(id)}/menu/${idPath(itemId)}`);
}
export const imageInputSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  sizeBytes: z.number().int().min(1),
});
export function requestImage(
  input: z.infer<typeof imageInputSchema>,
  workspaceId?: string,
  kind?: string
) {
  const data = imageInputSchema
    .extend({
      sizeBytes: z
        .number()
        .int()
        .min(1)
        .max(
          (workspaceId ? 5 : 10) * 1024 * 1024,
          'Ảnh vượt quá dung lượng cho phép'
        ),
    })
    .parse(input);
  if (workspaceId)
    return requestJson(s.menuImageUploadSchema, {
      method: 'POST',
      url: `/workspaces/${idPath(workspaceId)}/menu/image-uploads`,
      data,
    });
  return requestJson(s.workspaceProofUploadSchema, {
    method: 'POST',
    url: '/workspaces/proofs/uploads',
    data: {
      ...data,
      kind: z
        .enum([
          'ID_FRONT',
          'ID_BACK',
          'STOREFRONT',
          'BUSINESS_LICENSE',
          'FOOD_SAFETY',
          'MENU',
          'OTHER',
        ])
        .parse(kind),
    },
  });
}
