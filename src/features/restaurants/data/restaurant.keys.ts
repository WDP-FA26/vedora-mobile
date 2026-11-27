export const restaurantKeys = {
  all: ['restaurants'] as const,
  list: (location: unknown) => ['restaurants', 'list', location] as const,
  search: (q: string) => ['restaurants', 'search', q] as const,
  menu: (id: string, managed = false) =>
    ['restaurants', 'menu', id, managed] as const,
  reviews: (id: string, sort: string, token: string | null) =>
    ['restaurants', 'reviews', id, sort, token] as const,
  mine: ['restaurants', 'mine'] as const,
  workspace: (id: string) => ['restaurants', 'workspace', id] as const,
};
