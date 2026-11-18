import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Resolve the same source aliases as Metro, without booting the native runtime.
const sourceRoot = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), sourceRoot).href;
    if ((specifier.startsWith('file:') || specifier.startsWith('.')) && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      if (existsSync(fileURLToPath(url) + '.ts')) specifier = url.href + '.ts';
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(sourceRoot.href) && url.endsWith('.ts')) {
      return { format: 'module', source: stripTypeScriptTypes(readFileSync(fileURLToPath(url), 'utf8'), { mode: 'transform' }), shortCircuit: true };
    }
    return next(url, context);
  },
});

const local = (path) => pathToFileURL(fileURLToPath(new URL(path, sourceRoot))).href;
const requests = [];
let respond;
mock.module(local('shared/api/api-client.ts'), { namedExports: { apiClient: {
  request: async (config) => { requests.push(config); return { data: await respond(config) }; },
  delete: async (url) => { requests.push({ method: 'DELETE', url }); },
} } });
const resets = [], patches = [];
const queryClient = { resetQueries: (config) => { resets.push(config); }, invalidateQueries: () => {} };
mock.module('@tanstack/react-query', { namedExports: {
  useQueryClient: () => queryClient,
  useQuery: (config) => config,
  useInfiniteQuery: (config) => config,
  useMutation: (config) => ({ ...config, isPending: false, mutateAsync: async (input) => {
    const result = await config.mutationFn(input);
    config.onSuccess?.(result);
    return result;
  } }),
} });
mock.module(local('features/feed/hooks/use-feed.ts'), { namedExports: { patchCachedPost: (_client, id, patch) => patches.push({ id, ...patch }) } });
mock.module(local('shared/stores/session-store.ts'), { namedExports: { useSessionStore: (select) => select({ accessToken: 'session' }) } });
mock.module('expo-router', { namedExports: { router: { push: () => {} } } });
let slots = [], slot = 0;
mock.module('react', { namedExports: {
  useState: (initial) => { const index = slot++; if (!(index in slots)) slots[index] = initial; return [slots[index], (value) => { slots[index] = value; }]; },
  useRef: (initial) => { const index = slot++; return slots[index] ??= { current: initial }; },
} });

const { commentSchema, commentFormSchema } = await import('../src/features/posts/types/posts.schema.ts');
const service = await import('../src/features/posts/services/posts.service.ts');
const hooks = await import('../src/features/posts/hooks/use-posts.ts');
const { useCommentDraft, COMMENT_REJECTED_MESSAGE } = await import('../src/features/posts/hooks/use-comment-draft.ts');
const { ApiError } = await import('../src/shared/api/api-error.ts');
const { includeComment } = await import('../src/features/posts/utils/comment-thread.ts');
const { notificationText } = await import('../src/features/notifications/utils/notification-text.ts');

const author = { id: 'a07762f9-d469-4be6-9cb4-4018ed2b92a9', username: 'member', fullName: 'Member', avatarUrl: null };
const root = { id: 'root', postId: author.id, body: 'Root', author, createdAt: '2026-11-19T00:00:00Z', updatedAt: '2026-11-19T00:00:00Z', parentId: null, replyToId: null, replyToAuthor: null, replyCount: 3 };
const reply = { ...root, id: 'reply', parentId: root.id, replyToId: root.id, replyToAuthor: author, replyCount: 0 };
const post = { id: author.id, type: 'BLOG', status: 'PUBLISHED', body: null, publishedAt: null, createdAt: root.createdAt, author, media: [], commentCount: 17, likeCount: 0, repostCount: 0, viewCount: 0, isLiked: false, isReposted: false, isBookmarked: false };
const renderDraft = () => { slot = 0; return useCommentDraft(post.id); };

test('reply payloads preserve thread, exact target and deleted target; drafts trim and cap at 1000', () => {
  assert.equal(commentSchema.parse(reply).parentId, root.id);
  assert.equal(commentSchema.parse({ ...reply, replyToId: null, replyToAuthor: null }).replyToAuthor, null);
  assert.equal(commentSchema.safeParse({ ...root, replyCount: -1 }).success, false);
  assert.equal(commentFormSchema.parse({ body: '  hello  ' }).body, 'hello');
  assert.equal(commentFormSchema.safeParse({ body: ' '.repeat(10) }).success, false);
  assert.equal(commentFormSchema.safeParse({ body: 'a'.repeat(1001) }).success, false);
});

test('replying to a reply POSTs to the chosen reply, GET pagination stays on the root', async () => {
  requests.length = 0;
  respond = async (config) => config.method === 'POST' ? reply : { items: [reply], nextCursor: 'next' };
  await service.createReply(post.id, reply.id, '  response  ');
  assert.equal(requests[0].url, `/posts/${post.id}/comments/reply/replies`);
  assert.deepEqual(requests[0].data, { body: 'response' });
  const abort = new AbortController();
  await service.getReplyPage({ postId: post.id, rootId: root.id, cursor: 'cursor', signal: abort.signal });
  assert.equal(requests[1].url, `/posts/${post.id}/comments/root/replies`);
  assert.deepEqual(requests[1].params, { cursor: 'cursor' });
  assert.equal(requests[1].signal, abort.signal);
});

test('thread queries are isolated and disabled until expanded; retry discards invalid cursors', () => {
  const first = hooks.useReplies(post.id, 'root-a', false);
  const second = hooks.useReplies(post.id, 'root-b', true);
  assert.notDeepEqual(first.queryKey, second.queryKey);
  assert.equal(first.enabled, false);
  assert.equal(second.enabled, true);
  assert.equal(second.initialPageParam, null);
  assert.equal(second.getNextPageParam({ nextCursor: null }), undefined);
  second.restart();
  assert.deepEqual(resets.at(-1), { queryKey: second.queryKey, exact: true });
});

test('deleting a root resets all thread cursors and uses the server total including cascaded replies', async () => {
  resets.length = 0; patches.length = 0;
  respond = async () => post;
  await hooks.useCommentActions(post.id).remove.mutateAsync(root.id);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(resets[0], { queryKey: ['post', post.id, 'comments'] });
  assert.deepEqual(patches[0], { id: post.id, commentCount: 17 });
});

test('notification targets outside loaded pages are included once; reply notifications have a label', () => {
  assert.deepEqual(includeComment([reply], root), [root, reply]);
  assert.deepEqual(includeComment([reply, reply], reply), [reply]);
  assert.deepEqual(includeComment([reply, root], root), [root, reply]);
  assert.equal(notificationText({ type: 'COMMENT_REPLY' }), 'đã trả lời bình luận của bạn');
});

test('draft targets a reply, prevents double send, and retains text and target on moderation/network errors', async () => {
  slots = []; requests.length = 0;
  let draft = renderDraft();
  draft.startReply(reply); draft = renderDraft();
  draft.changeDraft('my response'); draft = renderDraft();
  let finish;
  respond = (config) => config.method === 'POST' ? new Promise((resolve) => { finish = resolve; }) : post;
  const pending = draft.submit();
  await draft.submit();
  draft.changeDraft('should be blocked'); draft.startEdit(root);
  assert.equal(requests.filter((request) => request.method === 'POST').length, 1);
  assert.equal(renderDraft().draft, 'my response');
  finish(reply); await pending;
  draft = renderDraft();
  assert.equal(draft.draft, ''); assert.equal(draft.replyingTo, null);

  draft.startReply(reply); draft = renderDraft(); draft.changeDraft('keep me'); draft = renderDraft();
  respond = async () => { throw new ApiError(422, 'CONTENT_REJECTED', 'rejected'); };
  await draft.submit(); draft = renderDraft();
  assert.equal(draft.error, COMMENT_REJECTED_MESSAGE);
  assert.equal(draft.draft, 'keep me'); assert.equal(draft.replyingTo.id, reply.id);
  respond = async () => { throw new Error('offline'); };
  await draft.submit(); draft = renderDraft();
  assert.ok(draft.error); assert.equal(draft.draft, 'keep me'); assert.equal(draft.replyingTo.id, reply.id);
  draft.cancelEdit(); draft = renderDraft();
  assert.equal(draft.replyingTo, null);
});
