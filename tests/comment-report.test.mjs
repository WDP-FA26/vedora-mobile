import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), root).href;
    if ((specifier.startsWith('file:') || specifier.startsWith('.')) && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      for (const ext of ['.ts', '.tsx']) if (existsSync(fileURLToPath(url) + ext)) { specifier = url.href + ext; break; }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(root.href) && /\.tsx?$/.test(new URL(url).pathname)) {
      const source = readFileSync(fileURLToPath(url), 'utf8');
      return { format: 'module', shortCircuit: true, source: new URL(url).pathname.endsWith('.tsx') ? ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText : stripTypeScriptTypes(source, { mode: 'transform' }) };
    }
    return next(url, context);
  },
});
const local = p => new URL(p, root).href;
let slots = [], slot = 0, token = 'one', calls = [], response, failure, duringRequest = () => {}, onStream, effectCleanup, requestGate;
const routes = [], reads = [], invalidations = [];
const session = selector => selector({ accessToken: token }); session.getState = () => ({ accessToken: token });
mock.module(local('shared/stores/session-store.ts'), { namedExports: { useSessionStore: session } });
mock.module(local('shared/api/api-client.ts'), { namedExports: { apiClient: { request: async config => { calls.push(config); await requestGate; duringRequest(); if (failure) throw failure; return { data: response }; } } } });
const client = { invalidateQueries: config => { invalidations.push(config); return Promise.resolve(); }, setQueryData() {} };
mock.module('@tanstack/react-query', { namedExports: { useQueryClient: () => client, useMutation: config => ({ ...config, isPending: false, mutateAsync: config.mutationFn }) } });
mock.module('react', { namedExports: {
  useState: initial => { const index = slot++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
  useRef: initial => { const index = slot++; return slots[index] ??= { current: initial }; },
  useEffect: callback => { effectCleanup = callback(); },
} });
const jsx = (type, props) => ({ type, props });
mock.module('react/jsx-runtime', { namedExports: { jsx, jsxs: jsx, Fragment: 'Fragment' } });
mock.module('react-native', { namedExports: {
  ...Object.fromEntries(['Modal', 'Pressable', 'ScrollView', 'Text', 'TextInput', 'View', 'FlatList', 'ActivityIndicator'].map(name => [name, name])),
  StyleSheet: { create: v => v }, AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) },
} });
mock.module('expo-symbols', { namedExports: { SymbolView: 'SymbolView' } });
mock.module('expo-image', { namedExports: { Image: 'Image' } });
mock.module('expo-router', { namedExports: { router: { push: route => routes.push(route) } } });
mock.module('react-native-safe-area-context', { namedExports: { useSafeAreaInsets: () => ({ bottom: 12 }), SafeAreaView: 'SafeAreaView' } });
mock.module(local('hooks/use-theme.ts'), { namedExports: { useTheme: () => ({}) } });
mock.module(local('shared/components/professional-name.tsx'), { namedExports: { ProfessionalName: 'ProfessionalName' } });
mock.module(local('features/notifications/hooks/use-notifications.ts'), { namedExports: {
  useNotifications: () => ({ data: { pages: [{ items: [] }] } }), useUnreadCount: () => ({ data: 0 }), useMarkRead: () => ({ mutate: id => reads.push(id) }), useMarkAllRead: () => ({}),
} });
mock.module(local('features/notifications/services/notification.service.ts'), { namedExports: {
  readNotificationStream: config => { onStream = config; return new Promise(() => {}); }, StreamAuthError: class extends Error {},
} });
const schema = await import('../src/features/posts/types/posts.schema.ts');
const { reportComment } = await import('../src/features/posts/services/comment-report.service.ts');
const { useReportComment } = await import('../src/features/posts/hooks/use-report-comment.ts');
const { CommentReportButton } = await import('../src/features/posts/components/comment-report-button.tsx');
const { NotificationsScreen } = await import('../src/features/notifications/components/notifications-screen.tsx');
const { notificationText } = await import('../src/features/notifications/utils/notification-text.ts');
const { COMMENT_NOTIFICATION_TYPES, isCommentCacheKey } = await import('../src/features/notifications/utils/comment-notification.ts');
const { useNotificationStream } = await import('../src/features/notifications/hooks/use-notification-stream.ts');
const { ApiError } = await import('../src/shared/api/api-error.ts');
const id = '00000000-0000-4000-8000-000000000001';
const commentId = '00000000-0000-4000-8000-000000000002';
const receipt = { id, postId: id, commentId, reason: 'SPAM', details: null, status: 'PENDING', createdAt: '2026-11-25T00:00:00Z' };
const render = () => { slot = 0; return CommentReportButton({ postId: id, commentId, body: 'Nội dung bình luận' }); };
function find(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => find(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...find(node.props?.children, predicate)];
}
const button = (tree, label) => find(tree, node => node.type === 'Pressable' && node.props.accessibilityLabel === label)[0];
const flush = () => new Promise(resolve => setImmediate(resolve));
function reset() { slots = []; token = 'one'; calls = []; response = receipt; failure = undefined; requestGate = undefined; duringRequest = () => {}; routes.length = 0; reads.length = 0; invalidations.length = 0; }

test('comment report has text-only contract, optional OTHER details and bounded trimmed text', async () => {
  reset();
  assert.ok(schema.commentReportFormSchema.safeParse({ reason: 'OTHER', details: '' }).success);
  for (const input of [{ reason: 'bad', details: '' }, { reason: 'SPAM', details: 'a'.repeat(501) }, { reason: 'SPAM', details: '', evidenceIds: [id] }]) assert.equal(schema.commentReportFormSchema.safeParse(input).success, false);
  await reportComment(id, commentId, { reason: 'SPAM', details: ' Chi tiết ' });
  assert.equal(calls[0].url, `/posts/${id}/comments/${commentId}/report`);
  assert.deepEqual(calls[0].data, { reason: 'SPAM', details: 'Chi tiết' });
  await reportComment(id, commentId, { reason: 'SPAM', details: '' });
  assert.deepEqual(calls[1].data, { reason: 'SPAM' });
  response = { ...receipt, commentId: 'invalid' };
  await assert.rejects(reportComment(id, commentId, { reason: 'SPAM', details: '' }));
});
test('mutation never retries or submits for a changed session, and discards a response from the old session', async () => {
  reset(); const mutation = useReportComment(id, commentId);
  assert.equal(mutation.retry, false); assert.equal(mutation.networkMode, 'always'); token = 'two';
  await assert.rejects(mutation.mutationFn({ reason: 'SPAM', details: '' }), error => error.code === 'SESSION_CHANGED');
  assert.equal(calls.length, 0); token = 'one'; duringRequest = () => { token = 'two'; };
  await assert.rejects(mutation.mutationFn({ reason: 'SPAM', details: '' }), error => error.code === 'SESSION_CHANGED');
});
function openAndChoose() {
  button(render(), 'Báo cáo bình luận').props.onPress();
  find(render(), node => node.props?.accessibilityRole === 'radio')[0].props.onPress();
}
test('form requires a reason, keeps input after errors, treats duplicate as received, and resets on close', async () => {
  reset(); button(render(), 'Báo cáo bình luận').props.onPress();
  button(render(), 'Gửi báo cáo bình luận').props.onPress(); await flush(); assert.equal(calls.length, 0);
  find(render(), node => node.props?.accessibilityRole === 'radio')[0].props.onPress();
  find(render(), node => node.type === 'TextInput')[0].props.onChangeText('Giữ nội dung');
  failure = new Error('offline'); button(render(), 'Gửi báo cáo bình luận').props.onPress(); await flush();
  assert.equal(find(render(), node => node.type === 'TextInput')[0].props.value, 'Giữ nội dung');
  assert.equal(find(render(), node => node.props?.accessibilityRole === 'alert').length, 1);
  failure = new ApiError(409, 'ALREADY_REPORTED', 'Duplicate');
  button(render(), 'Gửi báo cáo bình luận').props.onPress(); await flush();
  assert.equal(find(render(), node => node.type === 'Text' && node.props.children === 'Đã tiếp nhận báo cáo').length, 1);
  button(render(), 'Đóng báo cáo bình luận').props.onPress(); button(render(), 'Báo cáo bình luận').props.onPress();
  assert.equal(find(render(), node => node.type === 'TextInput')[0].props.value, '');
});
test('double submit sends once and closing is blocked until the request settles', async () => {
  reset(); openAndChoose(); let finish;
  requestGate = new Promise(resolve => { finish = resolve; });
  const tree = render();
  button(tree, 'Gửi báo cáo bình luận').props.onPress(); button(tree, 'Gửi báo cáo bình luận').props.onPress();
  find(tree, node => node.type === 'Modal')[0].props.onRequestClose();
  assert.equal(calls.length, 1); assert.equal(find(render(), node => node.type === 'Modal')[0].props.visible, true);
  finish(); await flush();
  button(render(), 'Đóng báo cáo bình luận').props.onPress();
  assert.equal(find(render(), node => node.type === 'Modal')[0].props.visible, false);
});
test('all five moderation notifications open public post/Blog view, stay put without post, and mark read', () => {
  reset(); const flat = find(NotificationsScreen(), node => node.type === 'FlatList')[0];
  for (const type of COMMENT_NOTIFICATION_TYPES) {
    const item = { id: type, type, actor: null, postId: id, postType: 'BLOG', commentId: null, note: 'Trích đoạn', reason: 'SPAM', readAt: null, createdAt: receipt.createdAt };
    assert.doesNotMatch(notificationText(item), /có thông báo mới/); assert.match(notificationText(item), /Trích đoạn/);
    flat.props.renderItem({ item }).props.onPress(); assert.deepEqual(routes.at(-1), { pathname: '/posts/[id]', params: { id } });
    const count = routes.length;
    flat.props.renderItem({ item: { ...item, postId: null } }).props.onPress(); assert.equal(routes.length, count); assert.equal(reads.at(-1), type);
  }
  assert.doesNotMatch(notificationText({ type: 'COMMENT_THREAD_REMOVED', reason: 'SPAM' }), /spam|vi phạm/i);
  assert.doesNotMatch(notificationText({ type: 'COMMENT_REMOVED_BY_POST_OWNER', reason: 'SPAM' }), /spam|vi phạm/i);
});
test('SSE and reconnect refresh comment threads/count surfaces; unrelated notifications do not', () => {
  reset(); useNotificationStream(); onStream.onOpen();
  assert.ok(invalidations.some(config => config.predicate?.({ queryKey: ['post', id, 'comments'] })));
  for (const type of COMMENT_NOTIFICATION_TYPES) { invalidations.length = 0; onStream.onNotification({ id: type, type }); assert.equal(invalidations.length, 1); }
  invalidations.length = 0; onStream.onNotification({ id: 'like', type: 'LIKE' }); assert.equal(invalidations.length, 0);
  for (const name of ['post', 'feed', 'blog', 'profile', 'bookmarks', 'post-search', 'following', 'my-blogs']) assert.equal(isCommentCacheKey([name]), true);
  assert.equal(isCommentCacheKey(['billing']), false); effectCleanup();
});
