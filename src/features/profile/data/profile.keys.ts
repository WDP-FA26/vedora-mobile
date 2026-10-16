export const profileKeys = {
  all: ['profile'] as const,
  me: ['profile', 'me'] as const,
  posts: (id: string) => ['profile', 'posts', id] as const,
};
