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
let response;
mock.module('expo/fetch', { namedExports: { fetch: async () => response } });
mock.module(local('shared/config/env.ts'), { namedExports: { API_BASE_URL: 'https://example.test' } });
mock.module(local('shared/session/session-manager.ts'), { namedExports: { refreshSession: async () => 'new-token' } });
mock.module(local('shared/stores/session-store.ts'), { namedExports: { useSessionStore: { getState: () => ({ accessToken: 'test-token' }) } } });
const { ApiError } = await import('../src/shared/api/api-error.ts');
const { parseAiStream, requestAiStream, AiStreamParser } = await import('../src/shared/api/ai-stream.ts');
const event = (value) => `data: ${JSON.stringify(value)}\n\n`;

test('backend model error codes inside HTTP 200 streams retain their machine-readable category', () => {
  for (const code of ['MODEL_ERROR', 'RATE_LIMITED']) {
    assert.throws(() => parseAiStream(event({ type: 'error', errorText: code })), (error) => error instanceof ApiError && error.status === null && error.code === code);
  }
});

test('a model error keeps partial streamed text available to the caller', () => {
  const parts = [];
  const parser = new AiStreamParser(undefined, (value) => parts.push(value));
  parser.push(event({ type: 'text-delta', delta: 'Partial answer' }));
  assert.throws(() => parser.push(event({ type: 'error', errorText: 'MODEL_ERROR' })), (error) => error.code === 'MODEL_ERROR');
  assert.equal(parts.at(-1)[0].text, 'Partial answer');
});

test('HTTP validation and unavailable responses preserve their status and code', async () => {
  for (const [status, code] of [[400, 'BAD_REQUEST'], [503, 'SERVICE_UNAVAILABLE']]) {
    response = { status, ok: false, text: async () => JSON.stringify({ statusCode: status, code, message: 'Debug-only detail' }) };
    await assert.rejects(requestAiStream({ url: '/meal-plan/chat', data: {} }), (error) => error instanceof ApiError && error.status === status && error.code === code);
  }
});
