export const postsKeys = {
  comments: (postId: string) => ['post', postId, 'comments'] as const,
};
