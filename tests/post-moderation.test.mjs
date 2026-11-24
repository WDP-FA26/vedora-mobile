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
let response, lastRequest;
mock.module(local('shared/api/api-client.ts'), { namedExports: { apiClient: { request: async (config) => { lastRequest = config; return { data: response }; } } } });
mock.module(local('hooks/use-theme.ts'), { namedExports: { useTheme: () => ({ foreground: '#111', mutedForeground: '#555', destructive: '#900', muted: '#eee', border: '#ccc' }) } });
const routes = [];
mock.module('expo-router', { namedExports: { router: { push: (route) => routes.push(route) } } });
mock.module('react-native', { namedExports: { View: 'View', Text: 'Text', Pressable: 'Pressable', StyleSheet: { create: (value) => value } } });
const jsx = (type, props) => ({ type, props });
mock.module('react/jsx-runtime', { namedExports: { jsx, jsxs: jsx } });
mock.module('@tanstack/react-query', { namedExports: { useQuery: (config) => config, useInfiniteQuery: (config) => config, useMutation: (config) => config, useQueryClient: () => ({}) } });
mock.module(local('features/feed/hooks/use-feed.ts'), { namedExports: { patchCachedPost: () => {} } });
mock.module(local('shared/stores/session-store.ts'), { namedExports: { useSessionStore: (select) => select({ accessToken: 'session' }) } });
const { postStatusSchema } = await import('../src/shared/types/post-moderation.schema.ts');
const { feedPostSchema } = await import('../src/features/feed/types/feed.schema.ts');
const { blogSchema, blogPageSchema, blogInputSchema } = await import('../src/features/blogs/types/blogs.schema.ts');
const { saveBlog } = await import('../src/features/blogs/services/blogs.service.ts');
const { useBlog } = await import('../src/features/blogs/hooks/use-blog.ts');
const { useMyBlogs } = await import('../src/features/blogs/hooks/use-my-blogs.ts');
const { usePost } = await import('../src/features/posts/hooks/use-posts.ts');
const { isPostEditLocked, POST_STATUS_LABELS } = await import('../src/features/posts/utils/post-status.ts');
const { PostModerationNotice } = await import('../src/features/posts/components/post-moderation-notice.tsx');
const id = '00000000-0000-4000-8000-000000000001';
const blog = (status) => ({ id, status, content: 'Article', updatedAt: '', blog: { title: 'Soup', coverImageUrl: null, excerpt: 'Soup' } });
const post = (status) => ({ id, status, type: 'POST', body: 'Hello', blog: null, publishedAt: null, createdAt: '', author: { id, username: 'owner', fullName: 'Owner' }, media: [], commentCount: 0, likeCount: 0, isLiked: false, repostCount: 0, isReposted: false, isBookmarked: false, viewCount: 0 });
function flatten(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(flatten).join(' ');
  return typeof node === 'object' ? flatten(node.props?.children) : String(node);
}
test('every backend state parses in posts, Blog detail and mixed private lists; write status stays restricted', () => {
  for (const status of postStatusSchema.options) {
    assert.equal(feedPostSchema.parse(post(status)).status, status);
    assert.equal(blogSchema.parse(blog(status)).status, status);
    assert.ok(POST_STATUS_LABELS[status]);
  }
  const items = postStatusSchema.options.map((status) => ({ ...blog(status), createdAt: '' }));
  assert.equal(blogPageSchema.parse({ items, nextCursor: null }).items.length, 7);
  assert.equal(blogInputSchema.safeParse({ ...blog('PROCESSING'), title: 'Soup', coverImageUrl: null }).success, false);
});
test('publishing accepts PROCESSING, PENDING_REVIEW and REJECTED as saved responses, not request failures', async () => {
  for (const status of ['PROCESSING', 'PENDING_REVIEW', 'REJECTED']) {
    response = blog(status);
    const result = await saveBlog(null, { title: 'Soup', content: 'Article', coverImageUrl: null, status: 'PUBLISHED' });
    assert.equal(result.status, status); assert.equal(lastRequest.data.status, 'PUBLISHED');
    assert.equal(lastRequest.method, 'POST');
  }
});
test('moderation evidence survives parsing and stays plain selectable text, including video timestamps', () => {
  const finding = { field: 'transcript', quote: '<script>alert(1)</script>', reason: 'Policy detail', reasonText: 'Category', mediaId: id, seconds: 12 };
  const data = feedPostSchema.parse({ ...post('REJECTED'), moderationVerdict: 'spam', moderationReason: 'Reason from server', moderationFindings: [finding] });
  assert.deepEqual(data.moderationFindings[0], finding);
  const rendered = PostModerationNotice({ post: data });
  assert.ok(flatten(rendered).includes(finding.quote)); assert.ok(flatten(rendered).includes('12'));
  assert.equal(PostModerationNotice({ post: post('PUBLISHED') }), null);
  assert.equal(PostModerationNotice({ post: post('DRAFT') }), null);
  assert.ok(flatten(PostModerationNotice({ post: { ...post('REMOVED'), removalReason: 'Removal detail' } })).includes('Removal detail'));
});
test('appeal and removed posts lock editing, while a rejected post without an active appeal can be corrected', () => {
  assert.equal(isPostEditLocked(post('REJECTED')), false);
  assert.equal(isPostEditLocked(post('REMOVED')), true);
  assert.equal(isPostEditLocked(feedPostSchema.parse({ ...post('REJECTED'), appeal: { activeTicket: { id } } })), true);
});
test('polling follows only unfinished states and stops at a terminal state', () => {
  for (const status of postStatusSchema.options) {
    const expected = ['PROCESSING', 'PENDING_REVIEW'].includes(status) ? 5000 : false;
    assert.equal(usePost(id).refetchInterval({ state: { data: post(status) } }), expected);
    assert.equal(useBlog(id).refetchInterval({ state: { data: blog(status) } }), expected);
    assert.equal(useMyBlogs().refetchInterval({ state: { data: { pages: [{ items: [blog(status)] }] } } }), expected);
  }
  assert.equal(usePost(id).refetchInterval({ state: {} }), false);
});

test('appeal actions use server eligibility and open the correct post or existing ticket', () => {
  const actions = (node) => {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(actions);
    return [...(node.type === 'Pressable' ? [node] : []), ...actions(node.props?.children)];
  };
  const eligible = feedPostSchema.parse({ ...post('REJECTED'), appeal: { activeTicket: null, latestTicket: null, canAppeal: true, deadlineAt: '2026-11-30T00:00:00Z', blockedReason: null } });
  const create = actions(PostModerationNotice({ post: eligible }));
  assert.equal(create.length, 1); create[0].props.onPress();
  assert.deepEqual(routes.at(-1), { pathname: '/support/new', params: { postId: id } });
  const pending = { ...eligible, appeal: { ...eligible.appeal, activeTicket: { id: 'ticket-active' }, canAppeal: false } };
  const existing = actions(PostModerationNotice({ post: pending }));
  assert.equal(existing.length, 1); existing[0].props.onPress();
  assert.deepEqual(routes.at(-1), { pathname: '/support/[id]', params: { id: 'ticket-active' } });
  const expired = { ...eligible, appeal: { activeTicket: null, canAppeal: false, blockedReason: 'APPEAL_WINDOW_EXPIRED' } };
  assert.equal(actions(PostModerationNotice({ post: expired })).length, 0);
  assert.match(flatten(PostModerationNotice({ post: expired })), /hết thời hạn/);
  assert.equal(actions(PostModerationNotice({ post: post('REJECTED') })).length, 0);
});
