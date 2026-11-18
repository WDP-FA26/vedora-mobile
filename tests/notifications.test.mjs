import assert from 'node:assert/strict';
import { test } from 'node:test';

import { notificationPageSchema, notificationSchema } from '../src/features/notifications/types/notification.schema.ts';

const base = {
  id: 'notification-1', type: 'LIKE',
  actor: { id: 'member-1', username: 'member', fullName: 'Thành viên', avatarUrl: null },
  postId: 'post-1', commentId: null, readAt: null, createdAt: '2026-11-18T00:00:00.000Z',
};
const systemTypes = [
  'POST_PENDING_REVIEW', 'POST_APPROVED', 'POST_REJECTED', 'POST_REMOVED',
  'REPORT_RESOLVED', 'REPORT_DISMISSED', 'REPORTED_POST_REMOVED',
];

test('mixed API page and individual SSE payloads accept system notifications with no actor', () => {
  const items = [base, ...systemTypes.map((type) => ({
    ...base, id: type, type, actor: null, postType: 'BLOG',
    reason: 'spam', reasonText: 'Spam', note: 'Nội dung mẫu',
    postId: type.endsWith('REMOVED') ? null : base.postId,
  }))];
  assert.equal(notificationPageSchema.parse({ items, nextCursor: null }).items.length, 8);
  for (const item of items) {
    const parsed = notificationSchema.parse(JSON.parse(JSON.stringify(item)));
    assert.equal(parsed.actor?.fullName ?? 'Vedora', item.actor ? 'Thành viên' : 'Vedora');
  }
  assert.equal(notificationSchema.safeParse({ ...base, type: 'NEW_SERVER_TYPE', actor: null }).success, true);
  assert.equal(notificationSchema.safeParse({ ...base, actor: { id: 'broken' } }).success, false);
});
