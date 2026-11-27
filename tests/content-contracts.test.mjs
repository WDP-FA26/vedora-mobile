import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = new URL('../src/', import.meta.url);
const local = path => new URL(path, root).href;
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), root).href;
  if ((specifier.startsWith('file:') || specifier.startsWith('.')) && context.parentURL) {
    const url = new URL(specifier, context.parentURL);
    for (const ext of ['.ts', '.tsx']) if (existsSync(fileURLToPath(url) + ext)) { specifier = url.href + ext; break; }
  }
  return next(specifier, context);
} });
let request, response, pages = [], configs = [];
mock.module(local('shared/api/api-client.ts'), { exports: { apiClient: { request: async config => { request = config; return { data: typeof response === 'function' ? response(config) : response }; } } } });
mock.module('expo-file-system', { exports: { File: class {}, FileMode: {}, Paths: {}, UploadType: {} } });
mock.module('react-native', { exports: { Platform: { OS: 'android' } } });
mock.module('react', { exports: { useMemo: fn => fn() } });
const session = select => select({ accessToken: 'test-session' });
session.getState = () => ({ accessToken: 'test-session' });
mock.module(local('shared/stores/session-store.ts'), { exports: { useSessionStore: session } });
mock.module(local('shared/stores/reaction-burst-store.ts'), { exports: { showReactionBurst() {} } });
mock.module('@tanstack/react-query', { exports: {
  useQueryClient: () => ({ resetQueries: async () => {} }), useMutation: () => ({}),
  useInfiniteQuery: options => { configs.push(options); return { data: { pages }, hasNextPage: true }; },
} });
const feed = await import('../src/features/feed/services/feed.service.ts');
const compose = await import('../src/features/feed/services/compose.service.ts');
const recipes = await import('../src/features/recipes/services/recipe.service.ts');
const profiles = await import('../src/features/profile/services/profile-search.service.ts');
const blogs = await import('../src/features/blogs/services/blogs.service.ts');
const { blogCoverFromContent } = await import('../src/features/blogs/utils/blog-cover.ts');
const { markdownToBlocks, blocksToMarkdown } = await import('../src/features/blogs/utils/blog-blocks.ts');
const { parseMarkdown } = await import('../src/shared/utils/markdown.ts');
const { useFeed } = await import('../src/features/feed/hooks/use-feed.ts');
const { useFollowingFeed } = await import('../src/features/following/hooks/use-following-feed.ts');
const { feedKeys } = await import('../src/features/feed/data/feed.keys.ts');
const draft = { id: 'draft', kind: 'POST', body: 'Bài chữ từ web', title: '', description: '', version: 2, updatedAt: '', media: [] };

test('personalized and following feed use separate endpoints and preserve opaque cursors', async () => {
  for (const [source, endpoint, cursor] of [['personalized', '/posts/feed', '2.1730000000000'], ['following', '/posts/following', 'server-post-id'], ['public', '/posts', null]]) {
    response = { items: [], nextCursor: null };
    await feed.getFeedPage({ filter: 'all', source, cursor });
    assert.equal(request.url, endpoint); assert.equal(request.params.cursor ?? null, cursor);
    assert.equal(request.params.type, undefined);
  }
  assert.notDeepEqual(feedKeys.list('all', 'personalized'), feedKeys.list('all', 'following'));
  configs = []; useFeed('all', true, 'following');
  assert.equal(configs[0].getNextPageParam({ nextCursor: 'opaque' }), 'opaque');
  assert.equal(configs[0].getNextPageParam({ nextCursor: null }), undefined);
});

test('following keeps backend order and deduplicates overlap across pages without per-author requests', () => {
  const post = (id, author) => ({ id, status: 'PUBLISHED', author: { id: author } });
  pages = [{ items: [post('newest', 'a'), post('middle', 'b')] }, { items: [post('middle', 'b'), post('oldest', 'a')] }];
  const result = useFollowingFeed();
  assert.deepEqual(result.posts.map(item => item.id), ['newest', 'middle', 'oldest']);
  assert.deepEqual(result.authors.map(item => item.id), ['a', 'b']);
  assert.deepEqual(configs.at(-1).queryKey, feedKeys.list('all', 'following'));
});

test('draft listing keeps POST and VIDEO; creating POST sends its kind and retains body', async () => {
  response = { items: [draft, { ...draft, id: 'video', kind: 'VIDEO' }] };
  assert.deepEqual((await compose.getDrafts()).map(item => item.kind), ['POST', 'VIDEO']);
  response = draft;
  assert.equal((await compose.createDraft('draft', 'POST')).body, draft.body);
  assert.deepEqual(request.data, { id: 'draft', kind: 'POST' });
});

test('people search uses numeric-offset cursor strings and optional signed-in relationship data', async () => {
  response = { items: [{ id: 'person', username: 'bep', fullName: 'Bếp', bio: null, avatarUrl: null, coverUrl: null, isProfessional: true, isFollowing: true }], nextCursor: '20' };
  assert.equal((await profiles.searchProfiles('  @bep  ', '20')).items[0].isFollowing, true);
  assert.equal(request.url, '/profiles/search'); assert.deepEqual(request.params, { q: '@bep', cursor: '20', limit: 20 });
});

test('categories read both pages, hide hidden items and forward baseTag with other recipe filters', async () => {
  const category = { id: 'one', name: 'Cơm', baseTag: 'RICE', description: null, icon: 'POT', sortOrder: 2, hidden: false };
  response = config => ({ items: config.params.page === 1 ? [category, { ...category, id: 'hidden', hidden: true }] : [{ ...category, id: 'two', sortOrder: 1 }], meta: { hasNextPage: config.params.page === 1 } });
  assert.deepEqual((await recipes.getRecipeCategories()).map(item => item.id), ['two', 'one']);
  assert.equal(request.params.limit, 50);
  response = config => ({ items: [{ ...category, id: String(config.params.page) }], meta: { hasNextPage: config.params.page < 4 } });
  assert.equal((await recipes.getRecipeCategories()).length, 4);
  response = { items: [], meta: { hasNextPage: false } };
  await recipes.getRecipePage({ filters: { q: '  nấm ', suitableForMe: true, tag: 'RICE' }, page: 1 });
  assert.deepEqual(request.params, { page: 1, limit: 12, q: 'nấm', suitableForMe: true, tag: 'RICE' });
});

test('blog signed video target uses the blog endpoint and Markdown media round-trips between mobile and web', async () => {
  const url = 'https://res.cloudinary.com/demo/video/upload/blog-videos/one.mp4';
  response = { upload: { url: 'https://upload.example.com', fields: { signature: 'signed' }, chunkSize: 100 }, url };
  assert.equal((await blogs.requestBlogVideoUpload()).url, url);
  assert.equal(request.url, '/blogs/videos/uploads'); assert.equal(request.method, 'POST');
  const md = `![Video](${url})\n\n![Bìa](https://storage.test/blogs/cover.jpg)\n\n![Khác](https://storage.test/blogs/other.jpg)`;
  assert.equal(blocksToMarkdown(markdownToBlocks(md)), md);
  assert.equal(parseMarkdown(md)[0].kind, 'video');
  assert.equal(blogCoverFromContent(md), 'https://storage.test/blogs/cover.jpg');
  assert.equal(blogCoverFromContent(`![Video](${url})`), '');
});
