import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { QueryClient } from '@tanstack/react-query';
import ts from 'typescript';

const root = new URL('../src/', import.meta.url);
const local = path => new URL(path, root).href;
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
      const source = readFileSync(new URL(url), 'utf8');
      return { format: 'module', shortCircuit: true, source: url.endsWith('.tsx')
        ? ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
        : stripTypeScriptTypes(source, { mode: 'transform' }) };
    }
    return next(url, context);
  },
});

const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const media = n => ({ id: id(n), type: 'VIDEO', status: 'READY', failureReason: null, playbackUrl: 'https://example.com/video.m3u8', posterUrl: null, durationSec: 12, aspectRatio: '9:16' });
const post = (status = 'PUBLISHED') => ({ id: id(1), type: 'POST', status, body: 'Nội dung cũ', publishedAt: '', createdAt: '', author: { id: id(2), username: 'owner', fullName: 'Owner' }, media: [media(3), media(4)], commentCount: 0, likeCount: 0, isLiked: false, repostCount: 0, isReposted: false, isBookmarked: false, viewCount: 0 });
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
let slots = [], slot = 0, token = 'owner-session', pending = false, response = post('PROCESSING'), failure, gate;
let routeId = id(1), ownerId = id(2), queryPost = post(), prevented, prevention, disabledPrevention = 0;
const requests = [], routes = [], alerts = [];
mock.module(local('shared/api/api-client.ts'), { namedExports: { apiClient: { request: async config => {
  requests.push(config); await gate; if (failure) throw failure; return { data: response };
} } } });
mock.module('@tanstack/react-query', { namedExports: {
  useQueryClient: () => client,
  useMutation: config => ({ isPending: pending, ...config, mutateAsync: async input => {
    const data = await config.mutationFn(input); await config.onSuccess?.(data); return data;
  } }),
} });
const session = select => select({ accessToken: token });
session.getState = () => ({ accessToken: token });
mock.module(local('shared/stores/session-store.ts'), { namedExports: { useSessionStore: session } });
mock.module('react', { namedExports: {
  useState: initial => { const index = slot++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
  useRef: initial => { const index = slot++; return slots[index] ??= { current: initial }; },
} });
const jsx = (type, props) => ({ type, props });
mock.module('react/jsx-runtime', { namedExports: { jsx, jsxs: jsx, Fragment: 'Fragment' } });
mock.module('react-native', { namedExports: {
  ...Object.fromEntries(['ActivityIndicator', 'KeyboardAvoidingView', 'Pressable', 'ScrollView', 'Text', 'TextInput', 'View'].map(x => [x, x])),
  StyleSheet: { create: value => value }, Platform: { OS: 'ios' }, Alert: { alert: (...args) => alerts.push(args) },
} });
mock.module('expo-router', { namedExports: {
  router: { replace: value => routes.push(value), canGoBack: () => true, back: () => routes.push('back') },
  useLocalSearchParams: () => ({ id: routeId }),
  usePreventRemove: (enabled, callback) => { prevented = enabled; prevention = callback; return () => { disabledPrevention++; }; },
} });
mock.module('expo-image', { namedExports: { Image: 'Image' } });
mock.module('expo-symbols', { namedExports: { SymbolView: 'SymbolView' } });
mock.module('react-native-safe-area-context', { namedExports: { SafeAreaView: 'SafeAreaView' } });
mock.module(local('hooks/use-theme.ts'), { namedExports: { useTheme: () => ({}) } });
mock.module(local('features/profile/hooks/use-profile.ts'), { namedExports: { useMyProfile: () => ({ data: { id: ownerId } }) } });
mock.module(local('features/posts/hooks/use-posts.ts'), { namedExports: { usePost: () => ({ data: queryPost, refetch() {} }) } });

const { postEditFormSchema, postUpdateSchema } = await import('../src/features/posts/types/post-edit.schema.ts');
const { updatePost } = await import('../src/features/posts/services/posts.service.ts');
const { useUpdatePost } = await import('../src/features/posts/hooks/use-update-post.ts');
const { canEditPost } = await import('../src/features/posts/utils/post-status.ts');
const { PostEditScreen, PostEditForm } = await import('../src/features/posts/components/post-edit-screen.tsx');
const { ApiError } = await import('../src/shared/api/api-error.ts');
const { postEditError } = await import('../src/features/posts/utils/post-edit-error.ts');
const render = () => { slot = 0; return PostEditForm({ post: queryPost }); };
function find(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => find(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...find(node.props?.children, predicate)];
}
const text = tree => find(tree, node => node.type === 'Text').flatMap(node => node.props.children).join(' ');
const input = tree => find(tree, node => node.type === 'TextInput')[0];
const button = (tree, label) => find(tree, node => node.type === 'Pressable' && (node.props.accessibilityLabel === label || text(node) === label))[0];
const flush = () => new Promise(resolve => setImmediate(resolve));
function reset() {
  slots = []; token = 'owner-session'; pending = false; response = post('PROCESSING'); queryPost = post(); routeId = id(1); ownerId = id(2);
  failure = undefined; gate = undefined; client.clear(); requests.length = 0; routes.length = 0; alerts.length = 0; disabledPrevention = 0;
}

test('validates BE text/word/video limits, uniqueness and an empty post', () => {
  assert.deepEqual(postEditFormSchema.parse({ body: '  Mới  ', mediaIds: [] }), { body: 'Mới', mediaIds: [] });
  assert.equal(postEditFormSchema.safeParse({ body: '', mediaIds: [id(3)] }).success, true);
  for (const values of [
    { body: ' ', mediaIds: [] }, { body: 'x'.repeat(2001), mediaIds: [] }, { body: 'từ '.repeat(251), mediaIds: [] },
    { body: '', mediaIds: [id(3), id(3)] }, { body: '', mediaIds: ['bad'] }, { body: '', mediaIds: [3, 4, 5, 6, 7].map(id) },
  ]) assert.equal(postEditFormSchema.safeParse(values).success, false);
  assert.equal(postEditFormSchema.safeParse({ body: 'từ '.repeat(250), mediaIds: [] }).success, true);
  assert.equal(postEditFormSchema.safeParse({ body: 'x'.repeat(2000), mediaIds: [] }).success, true);
  assert.equal(postUpdateSchema.safeParse({}).success, false);
  assert.equal(postUpdateSchema.safeParse({ body: 'ok', status: 'PUBLISHED' }).success, false);
});

test('PATCH validates ID/input/response and omits mediaIds when only editing text', async () => {
  reset();
  const result = await updatePost(id(1), { body: '  Mới  ' });
  assert.equal(result.status, 'PROCESSING');
  assert.deepEqual(requests[0], { method: 'PATCH', url: `/posts/${id(1)}`, data: { body: 'Mới' } });
  assert.throws(() => updatePost('bad', { body: 'new' }));
  assert.throws(() => updatePost(id(1), {}));
  assert.equal(requests.length, 1);
  response = { id: id(1) };
  await assert.rejects(updatePost(id(1), { body: 'new' }));
});

test('edit eligibility mirrors BE, including held/failed posts, and locks removed/appealed/Blog', () => {
  for (const status of ['PUBLISHED', 'PENDING_REVIEW', 'REJECTED', 'FAILED']) assert.equal(canEditPost(post(status)), true);
  for (const status of ['DRAFT', 'PROCESSING', 'REMOVED']) assert.equal(canEditPost(post(status)), false);
  assert.equal(canEditPost({ ...post(), type: 'BLOG' }), false);
  assert.equal(canEditPost({ ...post(), appeal: { activeTicket: { id: id(8) } } }), false);
});

test('direct edit routes reject invalid IDs, guests, non-owners and locked posts', () => {
  reset(); routeId = 'bad'; assert.equal(PostEditScreen().props.message, 'Không tìm thấy bài viết hợp lệ.');
  routeId = id(1); token = null; assert.match(PostEditScreen().props.message, /đăng nhập/);
  token = 'owner-session'; ownerId = id(9);
  let loader = PostEditScreen(); assert.match(loader.type(loader.props).props.message, /của mình/);
  ownerId = id(2); queryPost = post('PROCESSING');
  loader = PostEditScreen(); assert.match(loader.type(loader.props).props.message, /chưa thể sửa/);
  queryPost = post(); loader = PostEditScreen(); assert.equal(loader.type(loader.props).type, PostEditForm);
});

test('save cancels stale reads, replaces detail, resets public lists/cursors and invalidates shared snapshots', async () => {
  reset();
  const lists = [['feed', 'all'], ['bookmarks'], ['post-search', 'soup'], ['profile', 'posts', id(2)], ['profile', 'reposts', id(2)], ['following', 'author-posts', id(2)]];
  for (const key of lists) client.setQueryData(key, { pages: [{ items: [post()], nextCursor: 'old' }], pageParams: [null] });
  client.setQueryData(['post', id(1)], post());
  client.setQueryData(['post', id(1), 'comments'], { items: ['keep comment cache'] });
  client.setQueryData(['profile', 'me'], { postCount: 3 });
  client.setQueryData(['messaging', 'messages', 'chat'], { items: [] });
  let signal;
  const oldRead = client.fetchQuery({ queryKey: ['post', id(1)], queryFn: context => { signal = context.signal; return new Promise(() => {}); } }).catch(() => {});
  const mutation = useUpdatePost(id(1));
  assert.equal(mutation.networkMode, 'always'); assert.equal(mutation.retry, false);
  await mutation.mutateAsync({ body: 'Mới' }); await oldRead;
  assert.equal(signal.aborted, true);
  assert.equal(client.getQueryData(['post', id(1)]).status, 'PROCESSING');
  assert.deepEqual(client.getQueryData(['post', id(1), 'comments']), { items: ['keep comment cache'] });
  for (const key of lists) assert.equal(client.getQueryData(key), undefined);
  assert.equal(client.getQueryState(['profile', 'me']).isInvalidated, true);
  assert.equal(client.getQueryState(['messaging', 'messages', 'chat']).isInvalidated, true);
});

test('session changes and response identity mismatches never populate the new account cache', async () => {
  reset(); const mutation = useUpdatePost(id(1)); token = 'another-session';
  await assert.rejects(mutation.mutateAsync({ body: 'Mới' })); assert.equal(requests.length, 0);
  reset(); let release; gate = new Promise(resolve => { release = resolve; });
  const flight = useUpdatePost(id(1)).mutateAsync({ body: 'Mới' }); token = 'another-session'; release();
  await assert.rejects(flight); assert.equal(client.getQueryData(['post', id(1)]), undefined);
  reset(); response = { ...post(), id: id(9) };
  await assert.rejects(useUpdatePost(id(1)).mutateAsync({ body: 'Mới' })); assert.equal(client.getQueryData(['post', id(1)]), undefined);
});

test('form preloads content, saves text without touching video, then opens moderated detail', async () => {
  reset(); let tree = render(); assert.equal(input(tree).props.value, 'Nội dung cũ');
  assert.equal(button(tree, 'Lưu thay đổi bài viết').props.disabled, true);
  input(tree).props.onChangeText('  Nội dung mới  '); tree = render();
  assert.equal(prevented, true); button(tree, 'Lưu thay đổi bài viết').props.onPress(); await flush();
  assert.deepEqual(requests[0].data, { body: 'Nội dung mới' });
  assert.deepEqual(routes.at(-1), { pathname: '/posts/[id]', params: { id: id(1) } });
  assert.equal(disabledPrevention, 1);
});

test('video reordering/removal only takes effect on save and sends the final ordered list', async () => {
  reset(); button(render(), 'Đưa video 2 lên trước').props.onPress();
  assert.equal(requests.length, 0);
  button(render(), 'Gỡ video 2').props.onPress();
  button(render(), 'Lưu thay đổi bài viết').props.onPress(); await flush();
  assert.deepEqual(requests[0].data, { mediaIds: [id(4)] });
  reset(); button(render(), 'Gỡ video 1').props.onPress(); button(render(), 'Gỡ video 1').props.onPress();
  input(render()).props.onChangeText(' '); button(render(), 'Lưu thay đổi bài viết').props.onPress(); await flush();
  assert.equal(requests.length, 0); assert.match(text(render()), /ít nhất một video/);
});

test('failed save preserves input, blocks duplicate requests and disables fields while pending', async () => {
  reset(); let release; gate = new Promise(resolve => { release = resolve; }); failure = new ApiError(null, undefined, 'offline');
  input(render()).props.onChangeText('Giữ nội dung này');
  const saveButton = button(render(), 'Lưu thay đổi bài viết'); saveButton.props.onPress(); saveButton.props.onPress();
  assert.equal(requests.length, 1); pending = true;
  assert.equal(input(render()).props.editable, false); assert.equal(button(render(), 'Hủy sửa bài viết').props.disabled, true);
  release(); await flush(); pending = false;
  assert.equal(input(render()).props.value, 'Giữ nội dung này'); assert.match(text(render()), /Không thể kết nối/); assert.equal(routes.length, 0);
});

test('leaving a dirty form asks for confirmation; cancel keeps changes and discard resumes navigation', () => {
  reset(); input(render()).props.onChangeText('Chưa lưu'); render(); let repeats = 0;
  prevention({ repeat: () => repeats++ });
  const actions = alerts.at(-1)[2]; assert.equal(actions[0].style, 'cancel'); assert.equal(repeats, 0);
  assert.equal(input(render()).props.value, 'Chưa lưu'); actions[1].onPress(); assert.equal(repeats, 1);
  render(); assert.equal(prevented, false);
});

test('BE refusal messages distinguish permissions, processing, appeals and missing content', () => {
  for (const [status, code, expected] of [[403, undefined, /của mình/], [409, 'POST_NOT_EDITABLE', /đang xử lý/], [409, 'APPEAL_IN_PROGRESS', /khiếu nại/], [404, undefined, /không còn tồn tại/], [400, 'EMPTY_POST', /ít nhất một video/]]) {
    assert.match(postEditError(new ApiError(status, code, 'server internals')), expected);
  }
});
