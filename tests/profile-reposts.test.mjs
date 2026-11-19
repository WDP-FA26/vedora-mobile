import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { QueryClient } from '@tanstack/react-query';
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
    const pathname = new URL(url).pathname;
    if (url.startsWith(root.href) && /\.tsx?$/.test(pathname)) {
      const source = readFileSync(fileURLToPath(url), 'utf8');
      return { format: 'module', shortCircuit: true, source: pathname.endsWith('.tsx')
        ? ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
        : stripTypeScriptTypes(source, { mode: 'transform' }) };
    }
    return next(url, context);
  },
});
const local = (path) => new URL(path, root).href;
const id = '11111111-1111-4111-8111-111111111111';
let token = 'account', response = { items: [], nextCursor: null };
const requests = [], resets = [];
const client = new QueryClient();
const resetQueries = client.resetQueries.bind(client);
client.resetQueries = (filter) => { resets.push(filter.queryKey); return resetQueries(filter); };
mock.module(local('shared/api/api-client.ts'), { namedExports: { apiClient: { request: async (config) => { requests.push(config); return { data: response }; } } } });
mock.module(local('shared/api/upload-image.ts'), { namedExports: { uploadImageToStorage: async () => {} } });
mock.module(local('shared/stores/session-store.ts'), { namedExports: {
  useSessionStore: Object.assign((select) => select({ accessToken: token }), { getState: () => ({ accessToken: token }) }),
} });
mock.module(local('shared/stores/reaction-burst-store.ts'), { namedExports: { showReactionBurst: () => {} } });
mock.module('@tanstack/react-query', { namedExports: {
  useInfiniteQuery: (config) => config, useQuery: (config) => config,
  useMutation: (config) => config, useQueryClient: () => client,
} });
const jsx = (type, props) => ({ type, props });
mock.module('react/jsx-runtime', { namedExports: { jsx, jsxs: jsx, Fragment: 'Fragment' } });
mock.module('react-native', { namedExports: { ActivityIndicator: 'ActivityIndicator', Pressable: 'Pressable', Text: 'Text', View: 'View', StyleSheet: { create: (styles) => styles } } });
mock.module(local('hooks/use-theme.ts'), { namedExports: { useTheme: () => ({}) } });
mock.module(local('features/feed/components/post-card.tsx'), { namedExports: { PostCard: 'PostCard' } });

const { getProfileReposts } = await import('../src/features/profile/services/profile.service.ts');
const { useProfileReposts } = await import('../src/features/profile/hooks/use-profile.ts');
const { useFeedActions } = await import('../src/features/feed/hooks/use-feed.ts');
const { ProfileReposts } = await import('../src/features/profile/components/profile-reposts.tsx');
const { profileKeys } = await import('../src/features/profile/data/profile.keys.ts');
const { feedPostSchema } = await import('../src/features/feed/types/feed.schema.ts');
const post = feedPostSchema.parse({ id, type: 'POST', status: 'PUBLISHED', body: 'original', publishedAt: null, createdAt: '',
  author: { id, username: 'author', fullName: 'Original author', isProfessional: true }, media: [],
  commentCount: 0, likeCount: 1, isLiked: true, repostCount: 2, isReposted: false, isBookmarked: false, viewCount: 0 });
function find(node, type) {
  if (node == null || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap((child) => find(child, type));
  return [...(node.type === type ? [node] : []), ...find(node.props.children, type)];
}
const defaults = { data: { pages: [] }, isPending: false, isError: false, isFetchNextPageError: false, hasNextPage: false, isFetching: false };
const render = (query = {}) => ProfileReposts({ query: { ...defaults, ...query }, ownerName: 'Viewer', onPostLayout: () => () => {} });

test('public repost endpoint preserves viewer states, original author, server cursor and abort signal', async () => {
  requests.length = 0;
  const signal = new AbortController().signal;
  response = { items: [post], nextCursor: '22222222-2222-4222-8222-222222222222' };
  assert.deepEqual(await getProfileReposts(id, null, signal), response);
  assert.equal(requests[0].url, `/posts/reposted-by/${id}`);
  assert.deepEqual(requests[0].params, { limit: 20 });
  assert.equal(requests[0].signal, signal);
  assert.equal(requests[0].headers, undefined);
  assert.equal(response.items[0].isReposted, false); // Profile owner's repost is not the viewer's repost.
  await getProfileReposts(id, response.nextCursor, signal);
  assert.equal(requests[1].params.cursor, response.nextCursor);
  assert.throws(() => getProfileReposts('invalid', null));
  response = { items: [{}], nextCursor: null };
  await assert.rejects(getProfileReposts(id, null));
});

test('guest reads are enabled and pagination follows cursor even for an empty page', async () => {
  token = null;
  const config = useProfileReposts(id);
  assert.equal(config.enabled, true);
  assert.equal(useProfileReposts(undefined).enabled, false);
  assert.equal(useProfileReposts(id, false).enabled, false);
  assert.equal(config.initialPageParam, null);
  const cursor = '22222222-2222-4222-8222-222222222222';
  assert.equal(config.getNextPageParam({ items: [], nextCursor: cursor }), cursor);
  assert.equal(config.getNextPageParam({ items: [post], nextCursor: null }), undefined);
  response = { items: [], nextCursor: cursor };
  await config.queryFn({ pageParam: cursor });
  assert.equal(requests.at(-1).params.cursor, cursor);
});

test('repost changes reset profile list order and patch all cached post copies', async () => {
  token = 'account'; client.clear(); resets.length = 0;
  client.setQueryData(['feed', 'all'], { pages: [{ items: [post], nextCursor: null }], pageParams: [null] });
  client.setQueryData(profileKeys.reposts(id), { pages: [{ items: [post], nextCursor: id }], pageParams: [null] });
  const action = useFeedActions(id).repost;
  const context = action.onMutate(true);
  await action.onSuccess({ isReposted: true, repostCount: 3 }, true, context);
  assert.equal(client.getQueryData(['feed', 'all']).pages[0].items[0].isReposted, true);
  assert.equal(client.getQueryData(['feed', 'all']).pages[0].items[0].repostCount, 3);
  assert.deepEqual(resets, [profileKeys.repostsAll]);
  resets.length = 0;
  token = 'another-account';
  await action.onSuccess({ isReposted: false, repostCount: 2 }, false, context);
  assert.equal(resets.length, 0);
  assert.equal(client.getQueryData(['feed', 'all']).pages[0].items[0].isReposted, true);
  token = 'account';
  const cancelQueries = client.cancelQueries;
  client.cancelQueries = async () => { token = 'new-session-during-cancel'; };
  await action.onSuccess({ isReposted: false, repostCount: 2 }, false, context);
  client.cancelQueries = cancelQueries;
  assert.equal(resets.length, 0);
  assert.equal(client.getQueryData(['feed', 'all']).pages[0].items[0].isReposted, true);
});

test('UI keeps the original author and deduplicates pages without losing Blog posts', () => {
  const blog = { ...post, id: '22222222-2222-4222-8222-222222222222', type: 'BLOG' };
  const tree = render({ data: { pages: [{ items: [post] }, { items: [post, blog] }] } });
  const cards = find(tree, 'PostCard');
  assert.equal(cards.length, 2);
  assert.equal(cards[0].props.post.author.fullName, 'Original author');
  assert.equal(cards[0].props.post.author.isProfessional, true);
  assert.equal(cards[1].props.post.type, 'BLOG');
  assert.equal(typeof cards[0].props.onLayout, 'function');
});

test('an empty page with a cursor still offers load more; terminal empty state and loading differ', () => {
  let count = 0;
  const tree = render({ hasNextPage: true, fetchNextPage: () => count++ });
  const buttons = find(tree, 'Pressable');
  assert.equal(buttons.length, 1); buttons[0].props.onPress();
  assert.equal(count, 1);
  assert.ok(!find(tree, 'Text').some((node) => node.props.children === 'Chưa có bài đăng lại công khai.'));
  assert.ok(find(render(), 'Text').some((node) => node.props.children === 'Chưa có bài đăng lại công khai.'));
  assert.equal(find(render({ isPending: true }), 'ActivityIndicator').length, 1);
  assert.equal(find(render({ hasNextPage: true, isFetching: true }), 'Pressable')[0].props.disabled, true);
});

test('first-page and next-page failures expose separate retry actions', () => {
  let first = 0, next = 0;
  find(render({ isError: true, refetch: () => first++ }), 'Pressable')[0].props.onPress();
  find(render({ isError: true, isFetchNextPageError: true, hasNextPage: true, fetchNextPage: () => next++ }), 'Pressable')[0].props.onPress();
  assert.equal(first, 1); assert.equal(next, 1);
});
