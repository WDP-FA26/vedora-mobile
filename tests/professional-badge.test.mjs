import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'expo-image-picker') return { url: 'data:text/javascript,export async function launchImageLibraryAsync() { return { canceled: true }; }', shortCircuit: true };
    if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), root).href;
    if ((specifier.startsWith('.') || specifier.startsWith('file:')) && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      for (const ext of ['.ts', '.tsx']) if (existsSync(fileURLToPath(url) + ext)) { specifier = url.href + ext; break; }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    const path = new URL(url).pathname;
    if (url.startsWith(root.href) && /\.tsx?$/.test(path)) {
      const source = readFileSync(fileURLToPath(url), 'utf8');
      return { format: 'module', shortCircuit: true, source: path.endsWith('.tsx')
        ? ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
        : stripTypeScriptTypes(source, { mode: 'transform' }) };
    }
    return next(url, context);
  },
});
const jsx = (type, props) => ({ type, props });
mock.module('react/jsx-runtime', { namedExports: { jsx, jsxs: jsx } });
mock.module('react-native', { namedExports: { View: 'View', Text: 'Text', Platform: { OS: 'web' }, StyleSheet: { create: (styles) => styles } } });
mock.module('expo-symbols', { namedExports: { SymbolView: 'SymbolView' } });
let professional;
const invalidations = [];
mock.module('react', { namedExports: { useEffect: (effect) => effect() } });
mock.module('@tanstack/react-query', { namedExports: {
  useQuery: () => ({ data: professional === undefined ? undefined : { isProfessional: professional } }),
  useQueryClient: () => ({ invalidateQueries: (filter) => invalidations.push(filter) }),
  useMutation: () => ({}),
} });
mock.module('expo-file-system', { namedExports: { File: class {} } });
mock.module(new URL('shared/api/upload-image.ts', root).href, { namedExports: { uploadImageToStorage: async () => {} } });
mock.module(new URL('shared/stores/session-store.ts', root).href, { namedExports: { useSessionStore: (select) => select({ accessToken: 'session' }) } });
mock.module(new URL('features/verification/services/verification.service.ts', root).href, { namedExports: { getMyVerification: async () => ({}), requestProofUpload: async () => ({}), submitVerification: async () => ({}) } });

const { ProfessionalBadge, ProfessionalName } = await import('../src/shared/components/professional-name.tsx');
const { BrandColors } = await import('../src/constants/theme.ts');
const { feedPostSchema } = await import('../src/features/feed/types/feed.schema.ts');
const { commentSchema } = await import('../src/features/posts/types/posts.schema.ts');
const { notificationSchema } = await import('../src/features/notifications/types/notification.schema.ts');
const { sharedPostSchema } = await import('../src/features/messaging/types/messaging.schema.ts');
const { useMyVerification } = await import('../src/features/verification/hooks/use-verification.ts');
const author = { id: '11111111-1111-4111-8111-111111111111', username: 'chef', fullName: 'Chef', avatarUrl: null, isProfessional: true };

test('all author contracts retain the server professional flag and never grant it when absent', () => {
  const schemas = [feedPostSchema.shape.author, commentSchema.shape.author, notificationSchema.shape.actor.unwrap(), sharedPostSchema.shape.author];
  for (const schema of schemas) {
    assert.equal(schema.parse(author).isProfessional, true);
    assert.equal(schema.parse({ ...author, isProfessional: false }).isProfessional, false);
    const { isProfessional, ...legacy } = author;
    assert.equal(schema.parse(legacy).isProfessional, false);
    assert.equal(schema.safeParse({ ...author, isProfessional: 'true' }).success, false);
  }
});

test('the badge is blue, accessible and shown only for a verified professional', () => {
  assert.equal(ProfessionalBadge({}), null);
  assert.equal(ProfessionalBadge({ isProfessional: false }), null);
  const badge = ProfessionalBadge({ isProfessional: true, size: 19 });
  assert.equal(badge.props.tintColor, BrandColors.verified);
  assert.equal(badge.props.size, 19);
  assert.equal(badge.props.name.android, 'verified');
  assert.match(badge.props.accessibilityLabel, /Chuyên gia/);
  const name = ProfessionalName({ name: 'Chef', isProfessional: true });
  assert.match(name.props.accessibilityLabel, /Chef, Chuyên gia/);
  assert.equal(name.props.children[0].props.numberOfLines, 1);
  assert.equal(ProfessionalName({ name: 'Member' }).props.accessibilityLabel, 'Member');
});

test('verification changes refresh cached author surfaces for approval and revocation', () => {
  professional = undefined;
  useMyVerification();
  assert.equal(invalidations.length, 0);
  for (const value of [true, false]) {
    professional = value;
    useMyVerification();
    const { predicate } = invalidations.at(-1);
    for (const key of ['profile', 'feed', 'post', 'following', 'messaging', 'notifications', 'post-search', 'bookmarks']) {
      assert.equal(predicate({ queryKey: [key] }), true);
    }
    assert.equal(predicate({ queryKey: ['meal-plan'] }), false);
    assert.equal(predicate({ queryKey: ['billing'] }), false);
  }
});
