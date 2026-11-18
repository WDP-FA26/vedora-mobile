import { z } from 'zod';

export const MAX_PROOFS = 6;
export const MAX_PROOF_MB = 10;
export const MIN_STATEMENT_LENGTH = 20;
export const MAX_STATEMENT_LENGTH = 2000;

export const verificationRequestSchema = z.object({
  id: z.string(),
  statement: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  reviewNote: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  createdAt: z.string(),
  proofCount: z.number().int().nonnegative(),
});

export const myVerificationSchema = z.object({
  isProfessional: z.boolean(),
  request: verificationRequestSchema.nullable(),
});

export const proofInputSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp'], { error: 'Chọn ảnh JPEG, PNG hoặc WebP.' }),
  sizeBytes: z.number().int().positive('Không đọc được dung lượng ảnh.').max(MAX_PROOF_MB * 1024 * 1024, `Mỗi ảnh không quá ${MAX_PROOF_MB} MB.`),
});

export const proofUploadSchema = z.object({
  id: z.string(),
  upload: z.object({ url: z.string().url(), headers: z.record(z.string(), z.string()) }),
});

export const submitVerificationSchema = z.object({
  statement: z.string().trim().min(MIN_STATEMENT_LENGTH, `Viết ít nhất ${MIN_STATEMENT_LENGTH} ký tự mô tả.`).max(MAX_STATEMENT_LENGTH, `Mô tả tối đa ${MAX_STATEMENT_LENGTH} ký tự.`),
  proofIds: z.array(z.uuidv4()).min(1, 'Thêm ít nhất một ảnh minh chứng.').max(MAX_PROOFS, `Tối đa ${MAX_PROOFS} ảnh minh chứng.`)
    .refine((ids) => new Set(ids).size === ids.length, 'Ảnh minh chứng không được trùng nhau.'),
});

export type MyVerification = z.output<typeof myVerificationSchema>;
export type SubmitVerification = z.output<typeof submitVerificationSchema>;
export type ProofInput = z.output<typeof proofInputSchema>;
