export const postsKeys = {
  comments: (postId: string) => ['post', postId, 'comments'] as const,
  bookmarks: ['bookmarks'] as const,
  search: (q: string) => ['post-search', q] as const,
};
