import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { AxiosError } from 'axios';

const root = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), root).href;
    if (specifier.startsWith('file:') && existsSync(fileURLToPath(specifier) + '.ts')) specifier += '.ts';
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(root.href) && url.endsWith('.ts')) {
      return { format: 'module', shortCircuit: true, source: stripTypeScriptTypes(readFileSync(new URL(url), 'utf8'), { mode: 'transform' }) };
    }
    return next(url, context);
  },
});
const { ApiError, toApiError } = await import('../src/shared/api/api-error.ts');
const { authErrorMessage } = await import('../src/features/auth/utils/auth-errors.ts');

test('network failures and timeouts show a connection message throughout auth', () => {
  for (const code of ['ERR_NETWORK', 'ECONNABORTED']) {
    const error = toApiError(new AxiosError('Transport error', code));
    for (const action of ['login', 'register', 'verify', 'resend', 'reset']) {
      assert.equal(authErrorMessage(error, action), 'Không thể kết nối máy chủ. Kiểm tra mạng rồi thử lại sau.');
    }
  }
});

test('HTTP responses keep their existing auth messages', () => {
  assert.equal(authErrorMessage(new ApiError(401, undefined, 'Unauthorized'), 'login'), 'Tên đăng nhập hoặc mật khẩu không đúng.');
  assert.equal(authErrorMessage(new ApiError(400, 'CAPTCHA_FAILED', 'Invalid token'), 'login'), 'Xác minh bảo mật không hợp lệ hoặc đã hết hạn. Vui lòng xác minh lại.');
  assert.equal(authErrorMessage(new ApiError(429, undefined, 'Too many requests'), 'login'), 'Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.');
  assert.equal(authErrorMessage(new ApiError(500, undefined, 'Internal error'), 'login'), 'Có lỗi xảy ra. Vui lòng thử lại.');
});
