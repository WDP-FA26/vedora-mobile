import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const sourceRoot = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), sourceRoot).href;
    if ((specifier.startsWith('file:') || specifier.startsWith('.')) && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      for (const ext of ['.ts', '.tsx']) if (existsSync(fileURLToPath(url) + ext)) { specifier = url.href + ext; break; }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    const pathname = new URL(url).pathname;
    if (url.startsWith(sourceRoot.href) && /\.tsx?$/.test(pathname)) {
      const source = readFileSync(fileURLToPath(url), 'utf8');
      return { format: 'module', shortCircuit: true, source: pathname.endsWith('.tsx')
        ? ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
        : stripTypeScriptTypes(source, { mode: 'transform' }) };
    }
    return next(url, context);
  },
});
const local = (path) => new URL(path, sourceRoot).href;
const requests = [], invalidations = [], navigations = [];
let respond;
mock.module(local('shared/api/api-client.ts'), { namedExports: { apiClient: { request: async (config) => {
  requests.push(config); return { data: await respond(config) };
} } } });
const emptyPage = { items: [], nextCursor: null };
let friends = [], requestsBox = [], following = [];
const pageQuery = (items) => ({ data: { pages: [{ ...emptyPage, items }] }, isPending: false, hasNextPage: false });
mock.module('@tanstack/react-query', { namedExports: {
  useQueryClient: () => ({ invalidateQueries: (filter) => { invalidations.push(filter); } }),
  useInfiniteQuery: (config) => pageQuery(config.queryKey.at(-1) === 'friends' ? friends : requestsBox),
  useQuery: () => ({}),
  useMutation: (config) => ({ mutateAsync: async (input) => {
    const result = await config.mutationFn(input); await config.onSuccess?.(result, input); return result;
  } }),
} });
mock.module(local('features/profile/hooks/use-profile.ts'), { namedExports: { useProfileList: () => pageQuery(following) } });
mock.module(local('features/profile/components/profile-avatar.tsx'), { namedExports: { ProfileAvatar: 'ProfileAvatar' } });
mock.module(local('shared/stores/session-store.ts'), { namedExports: { useSessionStore: (select) => select({ accessToken: 'session' }) } });
let slots = [], slot = 0;
mock.module('react', { namedExports: {
  useState: (initial) => { const index = slot++; if (!(index in slots)) slots[index] = initial; return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
} });
const jsx = (type, props) => ({ type, props });
mock.module('react/jsx-runtime', { namedExports: { jsx, jsxs: jsx, Fragment: 'Fragment' } });
mock.module('react-native', { namedExports: Object.fromEntries([
  ...['ActivityIndicator', 'FlatList', 'Pressable', 'Text', 'TextInput', 'View'].map((name) => [name, name]),
  ['StyleSheet', { create: (value) => value, hairlineWidth: 1 }],
]) });
mock.module('expo-router', { namedExports: { router: { push: (target) => navigations.push(target) } } });
mock.module('expo-image', { namedExports: { Image: 'Image' } });
mock.module(local('constants/theme.ts'), { namedExports: { Fonts: {}, Radius: {}, Spacing: {} } });
mock.module(local('hooks/use-theme.ts'), { namedExports: { useTheme: () => ({}) } });
mock.module(local('shared/components/professional-name.tsx'), { namedExports: { ProfessionalName: 'ProfessionalName' } });

const { messageSchema } = await import('../src/features/messaging/types/messaging.schema.ts');
const { sharePost } = await import('../src/features/messaging/services/messaging.service.ts');
const { shareRecipients } = await import('../src/features/messaging/utils/share-recipients.ts');
const { messagingErrorText } = await import('../src/features/messaging/utils/messaging.ts');
const { SharePostPicker } = await import('../src/features/messaging/components/share-post-picker.tsx');
const { SharedPostCard } = await import('../src/features/messaging/components/shared-post-card.tsx');
const postId = '11111111-1111-4111-8111-111111111111';
const clientMessageId = '22222222-2222-4222-8222-222222222222';
const peer = { id: 'bob', username: 'bob', fullName: 'Đặng Bình', avatarUrl: null, isProfessional: false };
const conversation = { id: 'chat', peer, canSend: true };
const baseMessage = { id: 'message', conversationId: 'chat', senderId: 'me', recipientId: 'bob', clientMessageId, sequence: 1, body: 'Shared a post', createdAt: '2026-11-19T01:00:00Z' };
const sharedPost = { id: postId, type: 'BLOG', title: 'Cooking', excerpt: '<b>Plain text</b>', imageUrl: null, author: peer };
const result = { conversationId: 'chat', message: { ...baseMessage, sharedPostId: postId, sharedPost } };
function reset() {
  slots = []; slot = 0; requests.length = 0; navigations.length = 0; invalidations.length = 0;
  friends = [conversation]; requestsBox = []; following = [];
  respond = async (config) => config.method === 'GET' ? { peer, conversationId: 'chat', canSend: true, box: 'friends', followsPeer: false, peerFollowsYou: false } : result;
}
function find(node, predicate) {
  if (Array.isArray(node)) return node.flatMap((child) => find(child, predicate));
  if (!node || typeof node !== 'object') return [];
  const children = node.type === 'FlatList' ? [node.props.data.map((item) => node.props.renderItem({ item })), node.props.ListFooterComponent] : node.props?.children;
  return [...(predicate(node) ? [node] : []), ...find(children, predicate)];
}
const flush = () => new Promise((resolve) => setImmediate(resolve));
const textOf = (tree) => find(tree, (node) => node.type === 'Text').flatMap((node) => node.props.children).join(' ');
function picker() {
  const lock = { current: false }, attempts = { current: {} };
  let sent = 0;
  const render = () => { slot = 0; return SharePostPicker({ postId, selfId: 'me', lockRef: lock, attemptsRef: attempts, onSent: () => sent++ }); };
  const send = () => find(render(), (node) => node.type === 'Pressable' && node.props.accessibilityLabel?.startsWith('Gửi bài viết'))[0];
  return { render, send, lock, attempts, sent: () => sent };
}

test('message contract keeps shared cards, handles legacy text and unavailable posts', () => {
  assert.equal(messageSchema.parse(baseMessage).sharedPostId, null);
  assert.equal(messageSchema.parse(result.message).sharedPost.excerpt, '<b>Plain text</b>');
  const hidden = messageSchema.parse({ ...result.message, sharedPost: null });
  const tree = SharedPostCard({ message: hidden });
  assert.match(textOf(tree), /không còn khả dụng/);
  assert.equal(find(tree, (node) => node.type === 'Pressable').length, 0);
  const card = SharedPostCard({ message: messageSchema.parse(result.message) });
  assert.match(textOf(card), /<b>Plain text<\/b>/);
  card.props.onPress();
  assert.deepEqual(navigations.at(-1), { pathname: '/posts/[id]', params: { id: postId } });
});

test('share service uses dedicated endpoints and only validated IDs, never preview/body', async () => {
  reset();
  await sharePost({ conversationId: 'chat', userId: 'bob', postId, clientMessageId, body: 'forged', title: 'forged' });
  assert.equal(requests[0].url, '/messaging/conversations/chat/shared-posts');
  assert.deepEqual(requests[0].data, { postId, clientMessageId });
  await sharePost({ userId: 'bob', postId, clientMessageId });
  assert.equal(requests[1].url, '/messaging/users/bob/shared-posts');
  assert.throws(() => sharePost({ userId: 'bob', postId: 'bad', clientMessageId }));
});

test('recipient merge deduplicates, keeps server permission, excludes self and filters Vietnamese names', () => {
  const people = shareRecipients([{ ...conversation, canSend: false }], [peer, { ...peer, id: 'me' }, { ...peer, id: 'new' }], 'me', 'dang binh');
  assert.equal(people.length, 2);
  assert.equal(people.find(({ peer }) => peer.id === 'bob').canSend, false);
  assert.equal(people.find(({ peer }) => peer.id === 'new').canSend, true);
  assert.equal(shareRecipients([conversation], [peer], 'me', 'nobody').length, 0);
});

test('picker locks double taps, keeps retry UUID after response loss and opens chat only on success', async () => {
  reset(); const ui = picker();
  let release;
  respond = async (config) => {
    if (config.method === 'GET') return { peer, conversationId: 'chat', canSend: true, box: 'friends', followsPeer: false, peerFollowsYou: false };
    return new Promise((resolve, reject) => { release = { resolve, reject }; });
  };
  const button = ui.send(); button.props.onPress(); button.props.onPress(); await flush();
  assert.equal(requests.length, 2); assert.equal(ui.send().props.disabled, true);
  assert.equal(navigations.length, 0);
  const firstId = requests[1].data.clientMessageId;
  release.reject(new Error('response lost')); await flush();
  assert.equal(ui.lock.current, false); assert.match(textOf(ui.render()), /Chưa chia sẻ/);
  ui.send().props.onPress(); await flush();
  assert.equal(requests[3].data.clientMessageId, firstId);
  release.resolve(result); await flush();
  assert.equal(ui.sent(), 1); assert.equal(Object.keys(ui.attempts.current).length, 0);
  assert.deepEqual(navigations.at(-1), { pathname: '/messages/[id]', params: { id: 'chat' } });
  assert.deepEqual(invalidations, [{ queryKey: ['messaging'] }]);
});

test('picker rechecks permissions and does not send when follow/acceptance permission was lost', async () => {
  reset(); const ui = picker();
  respond = async () => ({ peer, conversationId: 'chat', canSend: false, box: 'requests', followsPeer: false, peerFollowsYou: false });
  ui.send().props.onPress(); await flush();
  assert.equal(requests.length, 1); assert.equal(navigations.length, 0);
  assert.match(textOf(ui.render()), /chấp nhận lời mời/);
  friends = [{ ...conversation, canSend: false }];
  assert.equal(ui.send().props.disabled, true);
});

test('unavailable post error is explicit and keeps the picker for retry', async () => {
  reset(); const ui = picker(); const get = respond;
  respond = async (config) => { if (config.method === 'GET') return get(config); throw { status: 404, code: 'SHARED_POST_UNAVAILABLE' }; };
  ui.send().props.onPress(); await flush();
  assert.match(textOf(ui.render()), /Bài viết không còn khả dụng/);
  assert.equal(ui.sent(), 0); assert.equal(navigations.length, 0);
  assert.match(messagingErrorText({ code: 'MESSAGE_ID_CONFLICT' }), /nội dung khác/);
});
