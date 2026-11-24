export const COMMENT_NOTIFICATION_TYPES = [
  'COMMENT_REMOVED', 'COMMENT_REMOVED_BY_POST_OWNER', 'COMMENT_THREAD_REMOVED',
  'COMMENT_REPORT_RESOLVED', 'COMMENT_REPORT_DISMISSED',
] as const;

export function isCommentNotification(type: string) {
  return COMMENT_NOTIFICATION_TYPES.some((value) => value === type);
}

/** The deleted comment has no link. Refresh every surface that embeds its count or thread. */
export function isCommentCacheKey(queryKey: readonly unknown[]) {
  return ['post', 'feed', 'profile', 'following', 'bookmarks', 'post-search', 'blog', 'my-blogs'].includes(String(queryKey[0]));
}
