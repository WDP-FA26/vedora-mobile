import assert from 'node:assert/strict';
import test from 'node:test';

import { blogInputSchema, blogPageSchema } from '../src/features/blogs/types/blogs.schema.ts';

const draft = { title: '  Bếp chay  ', content: '', coverImageUrl: null, status: 'DRAFT' };

test('drafts may be empty, but publishing requires non-whitespace content', () => {
  assert.equal(blogInputSchema.parse(draft).title, 'Bếp chay');
  assert.equal(blogInputSchema.safeParse({ ...draft, title: '   ' }).success, false);
  assert.equal(blogInputSchema.safeParse({ ...draft, status: 'PUBLISHED', content: ' \n ' }).success, false);
  const content = '## Nguyên liệu\n\n- Đậu hũ\n- Nấm';
  assert.equal(blogInputSchema.parse({ ...draft, content, status: 'PUBLISHED' }).content, content);
});

test('blog requests respect the backend title and content limits', () => {
  assert.equal(blogInputSchema.safeParse({ ...draft, title: 'a'.repeat(150), content: 'a'.repeat(50_000) }).success, true);
  assert.equal(blogInputSchema.safeParse({ ...draft, title: 'a'.repeat(151) }).success, false);
  assert.equal(blogInputSchema.safeParse({ ...draft, content: 'a'.repeat(50_001) }).success, false);
});

test('covers accept uploaded HTTP(S) URLs and reject executable or local URLs', () => {
  for (const coverImageUrl of ['https://cdn.example.com/blog.jpg', 'http://storage.local/blog.jpg', null]) {
    assert.equal(blogInputSchema.safeParse({ ...draft, coverImageUrl }).success, true);
  }
  for (const coverImageUrl of ['javascript:alert(1)', 'file:///private/image.jpg', 'data:image/png;base64,abc', 'not-a-url']) {
    assert.equal(blogInputSchema.safeParse({ ...draft, coverImageUrl }).success, false);
  }
});

test('private list responses have cursor and creation date, without full content', () => {
  const item = { id: 'blog-1', status: 'DRAFT', createdAt: '2026-11-06T00:00:00Z', blog: { title: 'Bếp chay', coverImageUrl: null, excerpt: '' } };
  assert.equal(blogPageSchema.parse({ items: [item], nextCursor: 'blog-1' }).items[0].id, 'blog-1');
  assert.equal(blogPageSchema.safeParse({ items: [{ ...item, status: 'FAILED' }], nextCursor: null }).success, false);
});
