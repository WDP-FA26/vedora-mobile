import { requestJson } from '@/shared/api/request-json';

import { myVerificationSchema, proofInputSchema, proofUploadSchema, submitVerificationSchema, verificationRequestSchema, type ProofInput, type SubmitVerification } from '../types/verification.schema';

export function getMyVerification(signal?: AbortSignal) {
  return requestJson(myVerificationSchema, { method: 'GET', url: '/verification/me', signal });
}

export function requestProofUpload(input: ProofInput) {
  return requestJson(proofUploadSchema, { method: 'POST', url: '/verification/proofs/uploads', data: proofInputSchema.parse(input) });
}

export function submitVerification(input: SubmitVerification) {
  return requestJson(verificationRequestSchema, { method: 'POST', url: '/verification/requests', data: submitVerificationSchema.parse(input) });
}
