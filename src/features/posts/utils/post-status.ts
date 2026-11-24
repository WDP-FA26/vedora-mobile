import type { PostModeration } from '@/shared/types/post-moderation.schema';

export const POST_STATUS_LABELS: Record<PostModeration['status'], string> = {
  DRAFT: 'Bản nháp', PROCESSING: 'Đang xử lý', PUBLISHED: 'Đã đăng', FAILED: 'Xử lý thất bại',
  PENDING_REVIEW: 'Chờ duyệt', REJECTED: 'Không được duyệt', REMOVED: 'Đã gỡ',
};

export function isPostProcessing(status: PostModeration['status']) {
  return status === 'PROCESSING' || status === 'PENDING_REVIEW';
}

export function isPostEditLocked(post: PostModeration) {
  return post.status === 'REMOVED' || !!post.appeal?.activeTicket;
}
