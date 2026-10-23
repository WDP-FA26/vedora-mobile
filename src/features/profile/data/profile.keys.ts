export const profileKeys = {
  all: ['profile'] as const,
  me: ['profile', 'me'] as const,
  posts: (id: string) => ['profile', 'posts', id] as const,
  detail: (id: string) => ['profile', 'detail', id] as const,
  relationship: (id: string) => ['profile', 'relationship', id] as const,
  followers: (id: string) => ['profile', 'followers', id] as const,
  following: (id: string) => ['profile', 'following', id] as const,
  suggestions: (limit: number) => ['profile', 'suggestions', limit] as const,
};
