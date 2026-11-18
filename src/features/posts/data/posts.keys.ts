export const postsKeys = {
  comments: (postId: string) => ['post', postId, 'comments'] as const,
  replies: (postId: string, rootId: string) => ['post', postId, 'comments', 'replies', rootId] as const,
  comment: (postId: string, commentId: string) => ['post', postId, 'comments', 'detail', commentId] as const,
  bookmarks: ['bookmarks'] as const,
  search: (q: string) => ['post-search', q] as const,
};
