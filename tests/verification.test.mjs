import assert from 'node:assert/strict';
import { test } from 'node:test';

import { myVerificationSchema, proofInputSchema, submitVerificationSchema } from '../src/features/verification/types/verification.schema.ts';
import { canSubmitVerification, verificationLabel } from '../src/features/verification/utils/verification-state.ts';
import { authReturnTo } from '../src/features/auth/utils/return-to.ts';

const proofId = '9ad64a35-cead-483b-8322-a0c9aaf26c32';
const request = {
  id: 'request-1', statement: 'Tôi là đầu bếp với 10 năm kinh nghiệm.', status: 'PENDING',
  reviewNote: null, reviewedAt: null, createdAt: '2026-11-19T00:00:00.000Z', proofCount: 1,
};

test('submission validates trimmed statement, proof count and unique UUIDs', () => {
  const parse = (statement, proofIds = [proofId]) => submitVerificationSchema.safeParse({ statement, proofIds });
  assert.equal(parse(`  ${'a'.repeat(20)}  `).data.statement.length, 20);
  assert.ok(parse('a'.repeat(2000)).success);
  assert.equal(parse('a'.repeat(19)).success, false);
  assert.equal(parse('a'.repeat(2001)).success, false);
  assert.equal(parse(' '.repeat(20)).success, false);
  assert.equal(parse(request.statement, []).success, false);
  assert.equal(parse(request.statement, [proofId, proofId]).success, false);
  assert.equal(parse(request.statement, ['bad-id']).success, false);
  const ids = Array.from({ length: 7 }, (_, i) => `9ad64a35-cead-483b-8322-a0c9aaf26c3${i}`);
  assert.ok(parse(request.statement, ids.slice(0, 6)).success);
  assert.equal(parse(request.statement, ids).success, false);
});

test('proof validation accepts only supported images of 1 byte through 10 MB', () => {
  for (const contentType of ['image/jpeg', 'image/png', 'image/webp']) {
    assert.ok(proofInputSchema.safeParse({ contentType, sizeBytes: 10 * 1024 * 1024 }).success);
  }
  for (const input of [
    { contentType: 'image/gif', sizeBytes: 1024 },
    { contentType: 'application/pdf', sizeBytes: 1024 },
    { contentType: 'image/jpeg', sizeBytes: 0 },
    { contentType: 'image/jpeg', sizeBytes: 10 * 1024 * 1024 + 1 },
  ]) assert.equal(proofInputSchema.safeParse(input).success, false);
});

test('only server professional flag grants badge; pending requests cannot be submitted again', () => {
  const fresh = myVerificationSchema.parse({ isProfessional: false, request: null });
  assert.ok(canSubmitVerification(fresh));
  assert.equal(verificationLabel(fresh), 'Xác minh chuyên gia');
  const pending = myVerificationSchema.parse({ isProfessional: false, request });
  assert.equal(canSubmitVerification(pending), false);
  assert.match(verificationLabel(pending), /chờ duyệt/);
  const rejected = myVerificationSchema.parse({ isProfessional: false, request: { ...request, status: 'REJECTED', reviewNote: 'Ảnh chưa rõ' } });
  assert.ok(canSubmitVerification(rejected));
  assert.equal(rejected.request.reviewNote, 'Ảnh chưa rõ');
  const approved = myVerificationSchema.parse({ isProfessional: true, request: { ...request, status: 'APPROVED' } });
  assert.equal(canSubmitVerification(approved), false);
  assert.equal(verificationLabel(approved), 'Chuyên gia đã xác minh');
  assert.notEqual(verificationLabel({ ...approved, isProfessional: false }), 'Chuyên gia đã xác minh');
});

test('login returns to verification and rejects external destinations', () => {
  assert.equal(authReturnTo('/verification'), '/verification');
  assert.equal(authReturnTo('https://example.com'), '/explore');
});
