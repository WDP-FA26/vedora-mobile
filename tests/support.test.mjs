import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const sourceRoot = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'expo-image-picker') return { url: 'data:text/javascript,export const launchImageLibraryAsync = async () => globalThis.__supportTestPick();', shortCircuit: true };
    if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), sourceRoot).href;
    if ((specifier.startsWith('file:') || specifier.startsWith('.')) && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      for (const ext of ['.ts', '.tsx']) if (existsSync(fileURLToPath(url) + ext)) { specifier = url.href + ext; break; }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(sourceRoot.href) && /\.tsx?$/.test(new URL(url).pathname)) {
      const source = readFileSync(fileURLToPath(url), 'utf8');
      return { format: 'module', shortCircuit: true, source: url.endsWith('.tsx')
        ? ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
        : stripTypeScriptTypes(source, { mode: 'transform' }) };
    }
    return next(url, context);
  },
});
const local = (path) => new URL(path, sourceRoot).href;
let requests = [], response, currentToken = 'owner', picked;
const cached = [], invalidations = [], routes = [], reads = [];
const client = { setQueryData: (...args) => cached.push(args), invalidateQueries: (config) => { invalidations.push(config); return Promise.resolve(); } };
const sessionStore = (select) => select({ accessToken: currentToken });
sessionStore.getState = () => ({ accessToken: currentToken });
mock.module(local('shared/api/api-client.ts'), { namedExports: { apiClient: { request: async (config) => { requests.push(config); return { data: response }; } } } });
mock.module(local('shared/stores/session-store.ts'), { namedExports: { useSessionStore: sessionStore } });
mock.module(local('shared/api/upload-image.ts'), { namedExports: { uploadImageToStorage: async () => {} } });
mock.module('@tanstack/react-query', { namedExports: { useInfiniteQuery: (value) => value, useQuery: (value) => value, useMutation: (value) => value, useQueryClient: () => client } });
globalThis.__supportTestPick = () => typeof picked === 'function' ? picked() : picked;
mock.module('expo-file-system', { namedExports: { File: class {} } });
mock.module('expo-router', { namedExports: { router: { push: (route) => routes.push(route), canGoBack: () => false, replace: (route) => routes.push(route) } } });
mock.module('expo-image', { namedExports: { Image: 'Image' } });
mock.module('expo-symbols', { namedExports: { SymbolView: 'SymbolView' } });
mock.module('react-native-safe-area-context', { namedExports: { SafeAreaView: 'SafeAreaView' } });
mock.module('react-native', { namedExports: { Platform: { OS: 'web' }, ActivityIndicator: 'ActivityIndicator', FlatList: 'FlatList', Pressable: 'Pressable', View: 'View', Text: 'Text', StyleSheet: { create: (v) => v } } });
mock.module(local('hooks/use-theme.ts'), { namedExports: { useTheme: () => ({ primary: '#123' }) } });
mock.module(local('features/notifications/hooks/use-notifications.ts'), { namedExports: {
  useNotifications: () => ({ data: { pages: [{ items: [] }] } }), useUnreadCount: () => ({ data: 0 }),
  useMarkRead: () => ({ mutate: (id) => reads.push(id) }), useMarkAllRead: () => ({}),
} });
const jsx = (type, props) => ({ type, props });
mock.module('react/jsx-runtime', { namedExports: { jsx, jsxs: jsx } });

const schema = await import('../src/features/support/types/support.schema.ts');
const { ticketReplyMode, isTicketActive } = await import('../src/features/support/utils/support-state.ts');
const api = await import('../src/features/support/services/support.service.ts');
const hooks = await import('../src/features/support/hooks/use-support.ts');
const { notificationSchema } = await import('../src/features/notifications/types/notification.schema.ts');
const { notificationText } = await import('../src/features/notifications/utils/notification-text.ts');
const { NotificationsScreen } = await import('../src/features/notifications/components/notifications-screen.tsx');
const { authReturnTo } = await import('../src/features/auth/utils/return-to.ts');
const id = '00000000-0000-4000-8000-000000000001';
const date = '2026-11-25T00:00:00.000Z';
const ticket = {
  id, code: 'TKT-ABCDEF', category: 'GENERAL', subject: 'Hỗ trợ', status: 'OPEN', appeal: null,
  referenceCode: null, lastMessageAt: date, lastMessageByRole: 'USER', messageCount: 1,
  waitingUserSince: null, autoCloseAt: null, resolvedAt: null, resolutionNote: null, createdAt: date, updatedAt: date,
  messages: [{ id, ticketId: id, sender: null, senderRole: 'USER', kind: 'MESSAGE', isInternal: false, body: 'Nội dung', attachments: [{ id, url: 'https://storage.test/signed', contentType: 'image/png', sizeBytes: 20 }], createdAt: date }],
  post: null, reopenableUntil: null,
};
test('creation validates category-specific fields, trims text, bounds and unique image IDs', () => {
  const general = { category: 'GENERAL', subject: ' Tiêu đề ', message: ' Nội dung ', attachmentIds: [id] };
  assert.equal(schema.createTicketSchema.parse(general).subject, 'Tiêu đề');
  assert.equal(schema.createTicketSchema.parse(general).message, 'Nội dung');
  for (const category of ['GENERAL', 'PAYMENT_ISSUE', 'VERIFICATION']) {
    assert.ok(schema.createTicketSchema.safeParse({ ...general, category }).success);
    assert.equal(schema.createTicketSchema.safeParse({ ...general, category, subject: ' ' }).success, false);
  }
  assert.ok(schema.createTicketSchema.safeParse({ category: 'CONTENT_APPEAL', postId: id, message: 'Xem lại', reasonCategory: 'FALSE_POSITIVE' }).success);
  assert.equal(schema.createTicketSchema.safeParse({ category: 'CONTENT_APPEAL', message: 'Xem lại' }).success, false);
  for (const patch of [{ message: ' ' }, { message: 'a'.repeat(2001) }, { subject: 'a'.repeat(151) }, { referenceCode: 'a'.repeat(101) }, { attachmentIds: [id, id] }, { attachmentIds: ['bad-id'] }]) {
    assert.equal(schema.createTicketSchema.safeParse({ ...general, ...patch }).success, false);
  }
  const ids = Array.from({ length: 5 }, (_, i) => `00000000-0000-4000-8000-00000000000${i}`);
  assert.ok(schema.createTicketSchema.safeParse({ ...general, attachmentIds: ids.slice(0, 4) }).success);
  assert.equal(schema.createTicketSchema.safeParse({ ...general, attachmentIds: ids }).success, false);
});
test('reply allows text or images while create still requires initial text; no blank body is sent', () => {
  assert.equal(schema.replyTicketSchema.safeParse({ body: ' ', attachmentIds: [] }).success, false);
  assert.deepEqual(schema.replyTicketSchema.parse({ body: ' ', attachmentIds: [id] }), { body: undefined, attachmentIds: [id] });
  assert.equal(schema.replyTicketSchema.parse({ body: ' Reply ' }).body, 'Reply');
  assert.equal(schema.createTicketSchema.safeParse({ category: 'GENERAL', subject: 'Title', message: '', attachmentIds: [id] }).success, false);
});
test('attachments reject unsupported formats and sizes; response retains signed URL and metadata', () => {
  for (const contentType of ['image/jpeg', 'image/png', 'image/webp']) assert.ok(schema.attachmentInputSchema.safeParse({ contentType, sizeBytes: 10485760 }).success);
  for (const input of [{ contentType: 'image/gif', sizeBytes: 1 }, { contentType: 'image/jpeg', sizeBytes: 0 }, { contentType: 'image/jpeg', sizeBytes: 10485761 }]) assert.equal(schema.attachmentInputSchema.safeParse(input).success, false);
  assert.equal(schema.ticketDetailSchema.parse(ticket).messages[0].attachments[0].url, 'https://storage.test/signed');
});
test('active tickets can reply/withdraw; only non-appeals reopen before server deadline', () => {
  const now = Date.parse(date);
  for (const status of schema.ticketStatusSchema.options) {
    const data = { ...ticket, status };
    assert.equal(isTicketActive(status), ['OPEN', 'WAITING_USER'].includes(status));
    assert.equal(ticketReplyMode(data, now), isTicketActive(status) ? 'reply' : null);
    if (!isTicketActive(status)) {
      assert.equal(ticketReplyMode({ ...data, reopenableUntil: new Date(now + 1).toISOString() }, now), 'reopen');
      assert.equal(ticketReplyMode({ ...data, reopenableUntil: date }, now), null);
      assert.equal(ticketReplyMode({ ...data, category: 'CONTENT_APPEAL', reopenableUntil: new Date(now + 1).toISOString() }, now), null);
    }
  }
});
test('services follow controller contracts and validate inputs before HTTP', async () => {
  requests = []; response = ticket;
  await api.createTicket({ category: 'GENERAL', subject: ' Title ', message: ' Message ', attachmentIds: [id] });
  assert.equal(requests.at(-1).url, '/support/tickets'); assert.equal(requests.at(-1).data.message, 'Message');
  await api.replyTicket(id, { body: ' ', attachmentIds: [id] });
  assert.equal(requests.at(-1).url, `/support/tickets/${id}/messages`); assert.equal(JSON.parse(JSON.stringify(requests.at(-1).data)).body, undefined);
  await api.withdrawTicket(id); assert.equal(requests.at(-1).url, `/support/tickets/${id}/withdraw`);
  const signal = new AbortController().signal;
  response = { items: [ticket], meta: { page: 2, hasNextPage: true } };
  await api.getTickets(2, 'WAITING_USER', signal);
  assert.deepEqual(requests.at(-1).params, { page: 2, limit: 20, status: 'WAITING_USER' }); assert.equal(requests.at(-1).signal, signal);
  const count = requests.length;
  assert.throws(() => api.replyTicket('bad', { body: 'Hi' }));
  assert.throws(() => api.createTicket({ category: 'GENERAL', message: 'Hi' }));
  assert.equal(requests.length, count);
});
test('mutation updates detail, invalidates post/Blog rights, disables automatic retries and ignores changed sessions', async () => {
  currentToken = 'owner'; response = ticket; cached.length = 0; invalidations.length = 0;
  const mutation = hooks.useTicketAction();
  assert.equal(mutation.retry, false); assert.equal(mutation.networkMode, 'always');
  const result = await mutation.mutationFn({ kind: 'withdraw', id });
  mutation.onSuccess(result); mutation.onSettled();
  assert.deepEqual(cached[0][0], ['support', 'detail', id]);
  for (const key of ['support', 'post', 'feed', 'profile', 'blog', 'my-blogs', 'notifications']) assert.ok(invalidations[0].predicate({ queryKey: [key] }));
  assert.equal(invalidations[0].predicate({ queryKey: ['billing'] }), false);
  currentToken = 'other'; const count = requests.length;
  await assert.rejects(() => mutation.mutationFn({ kind: 'withdraw', id }), { code: 'SESSION_CHANGED' });
  mutation.onSuccess(ticket); mutation.onSettled();
  assert.equal(requests.length, count); assert.equal(cached.length, 1); assert.equal(invalidations.length, 1);
  currentToken = 'owner';
});
test('canceled picker and session change during picker do not create uploads', async () => {
  currentToken = 'owner'; const upload = hooks.useSupportUpload(); const count = requests.length;
  picked = { canceled: true };
  assert.equal(await upload.mutationFn(), null);
  picked = () => { currentToken = 'other'; return { canceled: false, assets: [{ uri: 'blob:image' }] }; };
  await assert.rejects(() => upload.mutationFn(), { code: 'SESSION_CHANGED' });
  assert.equal(requests.length, count); currentToken = 'owner';
});
function find(node, type) {
  if (!node || typeof node !== 'object') return null;
  if (node.type === type) return node;
  for (const child of [node.props?.children].flat(Infinity)) { const result = find(child, type); if (result) return result; }
  return null;
}
test('ticket notifications retain ticketId, show distinct text and open ticket before post/profile', () => {
  const flat = find(NotificationsScreen(), 'FlatList');
  for (const type of ['SUPPORT_TICKET_REPLIED', 'SUPPORT_TICKET_RESOLVED', 'SUPPORT_TICKET_CLOSED', 'SUPPORT_TICKET_EXPIRED', 'SUPPORT_TICKET_REMINDER', 'POST_RESTORED']) {
    const item = notificationSchema.parse({ id: type, type, actor: null, postId: id, postType: 'BLOG', ticketId: id, createdAt: date, readAt: null });
    assert.equal(item.ticketId, id); assert.doesNotMatch(notificationText(item), /có thông báo mới/);
    flat.props.renderItem({ item }).props.onPress();
    assert.deepEqual(routes.at(-1), { pathname: '/support/[id]', params: { id } }); assert.equal(reads.at(-1), type);
  }
  assert.equal(authReturnTo('/support'), '/support'); assert.equal(authReturnTo('//evil.test/support'), '/explore');
});
