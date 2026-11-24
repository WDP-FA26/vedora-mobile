import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { QueryClient } from '@tanstack/react-query';
import ts from 'typescript';

const sourceRoot = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), sourceRoot).href;
    if ((specifier.startsWith('file:') || specifier.startsWith('.')) && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      for (const ext of ['.ts', '.tsx']) {
        if (existsSync(fileURLToPath(url) + ext)) { specifier = url.href + ext; break; }
      }
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
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const requests = [];
let respond = async () => undefined;
mock.module(local('shared/api/api-client.ts'), { namedExports: { apiClient: {
  delete: async (url) => { requests.push(url); return respond(); },
} } });
mock.module('@tanstack/react-query', { namedExports: {
  useQueryClient: () => client,
  useMutation: (config) => ({ ...config, isPending: false, mutateAsync: async () => {
    const result = await config.mutationFn();
    await config.onSuccess?.(result);
    return result;
  } }),
} });
let slots = [], slot = 0, token = 'session', memberId = 'owner';
mock.module('react', { namedExports: {
  useState: (initial) => { const index = slot++; if (!(index in slots)) slots[index] = initial; return [slots[index], (value) => { slots[index] = value; }]; },
  useRef: (initial) => { const index = slot++; return slots[index] ??= { current: initial }; },
} });
const jsx = (type, props) => ({ type, props });
mock.module('react/jsx-runtime', { namedExports: { jsx, jsxs: jsx, Fragment: 'Fragment' } });
mock.module('react-native', { namedExports: Object.fromEntries([
  ...['Modal', 'Pressable', 'ScrollView', 'Text', 'TextInput', 'View'].map((name) => [name, name]),
  ['StyleSheet', { create: (styles) => styles }], ['Share', { share: async () => {} }],
]) });
mock.module('expo-router', { namedExports: { router: { push: () => {} } } });
mock.module('expo-symbols', { namedExports: { SymbolView: 'SymbolView' } });
mock.module('react-native-safe-area-context', { namedExports: { useSafeAreaInsets: () => ({ bottom: 24 }) } });
mock.module(local('constants/theme.ts'), { namedExports: { Fonts: {}, Radius: {}, Spacing: {} } });
mock.module(local('hooks/use-theme.ts'), { namedExports: { useTheme: () => ({}) } });
mock.module(local('shared/config/env.ts'), { namedExports: { WEB_URL: 'https://example.test' } });
mock.module(local('shared/stores/session-store.ts'), { namedExports: { useSessionStore: (select) => select({ accessToken: token }) } });
mock.module(local('features/profile/hooks/use-profile.ts'), { namedExports: { useMyProfile: () => ({ data: { id: memberId } }) } });
mock.module(local('features/posts/hooks/use-posts.ts'), { namedExports: { useReportPost: () => ({}) } });
mock.module(local('features/messaging/components/share-post-picker.tsx'), { namedExports: { SharePostPicker: 'SharePostPicker' } });

const { deletePost } = await import('../src/features/posts/services/posts.service.ts');
const { useDeletePost } = await import('../src/features/posts/hooks/use-delete-post.ts');
const { PostMenu } = await import('../src/features/posts/components/post-menu.tsx');
const { ApiError } = await import('../src/shared/api/api-error.ts');
const props = { postId: 'post-id', authorId: 'owner', postType: 'POST', returnTo: '/explore' };
const render = (overrides = {}) => { slot = 0; return PostMenu({ ...props, ...overrides }); };
function find(node, predicate) {
  if (Array.isArray(node)) return node.flatMap((child) => find(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...find(node.props?.children, predicate)];
}
const button = (tree, label) => find(tree, (node) => node.type === 'Pressable' && node.props.accessibilityLabel === label)[0];
const flush = () => new Promise((resolve) => setImmediate(resolve));
function reset() { slots = []; requests.length = 0; token = 'session'; memberId = 'owner'; client.clear(); respond = async () => undefined; }

test('post and Blog use their own DELETE endpoints and accept an empty 204 response', async () => {
  reset();
  assert.equal(await deletePost('post-id', 'POST'), undefined);
  assert.equal(await deletePost('blog-id', 'BLOG'), undefined);
  assert.deepEqual(requests, ['/posts/post-id', '/blogs/blog-id']);
  const mutation = useDeletePost('post-id', 'POST');
  assert.equal(mutation.networkMode, 'always');
  assert.equal(mutation.retry, false);
});

test('successful deletion cancels stale detail reads, removes details/comments, resets list cursors and invalidates counts', async () => {
  reset();
  const lists = [['feed', 'posts'], ['my-blogs'], ['bookmarks'], ['post-search', 'soup'], ['profile', 'posts', 'owner'], ['following', 'author-posts', 'owner']];
  for (const key of lists) client.setQueryData(key, { pages: [{ items: [{ id: 'post-id' }], nextCursor: 'post-id' }], pageParams: [null] });
  client.setQueryData(['post', 'post-id'], { id: 'post-id' });
  client.setQueryData(['post', 'post-id', 'comments'], { items: ['comment'] });
  client.setQueryData(['blog', 'post-id'], { id: 'post-id' });
  client.setQueryData(['post', 'other'], { id: 'other' });
  client.setQueryData(['profile', 'me'], { postCount: 9 });
  client.setQueryData(['notifications', 'list'], { items: [] });
  client.setQueryData(['messaging', 'messages', 'chat'], { items: [{ sharedPostId: 'post-id' }] });
  let signal;
  const staleRead = client.fetchQuery({ queryKey: ['post', 'post-id'], queryFn: (context) => { signal = context.signal; return new Promise(() => {}); } }).catch(() => {});
  await useDeletePost('post-id', 'POST').mutateAsync();
  await staleRead;
  assert.equal(signal.aborted, true);
  for (const key of lists) assert.equal(client.getQueryData(key), undefined);
  assert.equal(client.getQueryData(['post', 'post-id']), undefined);
  assert.equal(client.getQueryData(['post', 'post-id', 'comments']), undefined);
  assert.equal(client.getQueryData(['blog', 'post-id']), undefined);
  assert.equal(client.getQueryData(['post', 'other']).id, 'other');
  assert.equal(client.getQueryState(['profile', 'me']).isInvalidated, true);
  assert.equal(client.getQueryState(['notifications', 'list']).isInvalidated, true);
  assert.equal(client.getQueryState(['messaging', 'messages', 'chat']).isInvalidated, true);
});

test('a failed DELETE preserves cached content', async () => {
  reset();
  client.setQueryData(['feed', 'posts'], { items: [{ id: 'post-id' }] });
  respond = async () => { throw new ApiError(403, 'FORBIDDEN', 'Forbidden'); };
  await assert.rejects(useDeletePost('post-id', 'POST').mutateAsync());
  assert.equal(client.getQueryData(['feed', 'posts']).items[0].id, 'post-id');
});

test('guests and other authors never see the delete option', () => {
  reset(); memberId = 'other';
  assert.equal(button(render(), 'Xóa bài viết'), undefined);
  token = null; memberId = 'owner'; slots = [];
  assert.equal(button(render(), 'Xóa bài viết'), undefined);
});

test('a moderation lock hides deletion and blocks an already-open confirmation', async () => {
  reset();
  assert.equal(button(render({ deletionLocked: true }), 'Xóa bài viết'), undefined);
  button(render(), 'Thêm tùy chọn cho bài viết').props.onPress();
  button(render(), 'Xóa bài viết').props.onPress();
  button(render({ deletionLocked: true }), 'Xác nhận xóa bài viết').props.onPress();
  await flush();
  assert.equal(requests.length, 0);
});

test('sharing is hidden for drafts and opens the recipient picker without sending for published posts', () => {
  reset();
  const shareOnly = render({ variant: 'share' });
  assert.ok(button(shareOnly, 'Gửi bài viết qua tin nhắn'));
  assert.equal(find(shareOnly, (node) => node.type === 'Text' && node.props.children === 'Chia sẻ bài viết').length, 0);
  assert.equal(button(shareOnly, 'Xóa bài viết'), undefined);
  assert.equal(button(shareOnly, 'Thêm tùy chọn cho bài viết'), undefined);
  assert.equal(button(render({ canShare: false }), 'Gửi bài viết qua tin nhắn'), undefined);
  button(render(), 'Thêm tùy chọn cho bài viết').props.onPress();
  button(render(), 'Gửi bài viết qua tin nhắn').props.onPress();
  const picker = find(render(), (node) => node.type === 'SharePostPicker')[0];
  assert.equal(picker.props.postId, 'post-id');
  assert.equal(requests.length, 0);
  picker.props.lockRef.current = true;
  find(render(), (node) => node.type === 'Modal')[0].props.onRequestClose();
  assert.equal(find(render(), (node) => node.type === 'Modal')[0].props.visible, true);
  picker.props.lockRef.current = false;
  picker.props.onSent();
  assert.equal(find(render(), (node) => node.type === 'Modal')[0].props.visible, false);
});

test('delete requires confirmation; cancel sends no request; double confirmation sends once and blocks closing while pending', async () => {
  reset();
  button(render(), 'Thêm tùy chọn cho bài viết').props.onPress();
  button(render(), 'Xóa bài viết').props.onPress();
  let tree = render();
  assert.equal(requests.length, 0);
  const cancel = find(tree, (node) => node.type === 'Pressable' && node.props.children?.props?.children === 'Hủy')[0];
  cancel.props.onPress();
  assert.equal(find(render(), (node) => node.type === 'Modal')[0].props.visible, false);
  assert.equal(requests.length, 0);

  button(render(), 'Thêm tùy chọn cho bài viết').props.onPress();
  button(render(), 'Xóa bài viết').props.onPress();
  let finish, deleted = 0;
  respond = () => new Promise((resolve) => { finish = resolve; });
  tree = render({ onDeleted: () => { deleted++; } });
  button(tree, 'Xác nhận xóa bài viết').props.onPress();
  button(tree, 'Xác nhận xóa bài viết').props.onPress();
  find(tree, (node) => node.type === 'Modal')[0].props.onRequestClose();
  assert.equal(find(render(), (node) => node.type === 'Modal')[0].props.visible, true);
  assert.deepEqual(requests, ['/posts/post-id']);
  finish(); await flush();
  assert.equal(deleted, 1);
  assert.equal(find(render(), (node) => node.type === 'Modal')[0].props.visible, false);
});

test('permission, missing Blog and network errors remain visible and allow closing or retrying', async () => {
  for (const error of [new ApiError(403, 'FORBIDDEN', 'Forbidden'), new ApiError(404, 'NOT_FOUND', 'Missing'), new Error('offline')]) {
    reset();
    const blogProps = { postType: 'BLOG', canShare: false, title: 'My draft' };
    button(render(blogProps), 'Thêm tùy chọn cho bài viết').props.onPress();
    button(render(blogProps), 'Xóa Blog').props.onPress();
    respond = async () => { throw error; };
    button(render(blogProps), 'Xác nhận xóa Blog').props.onPress(); await flush();
    const tree = render(blogProps);
    assert.equal(find(tree, (node) => node.props.accessibilityRole === 'alert').length, 1);
    assert.equal(find(tree, (node) => node.type === 'Modal')[0].props.visible, true);
    assert.deepEqual(requests, ['/blogs/post-id']);
    respond = async () => undefined;
    button(tree, 'Xác nhận xóa Blog').props.onPress(); await flush();
    assert.equal(requests.length, 2);
  }
  client.clear();
});
