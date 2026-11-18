import { ApiError } from './api-error';

/** The API stops a text-AI request when the plan's allowance is used up (429) or when the turn can no longer continue (409). */
export const isAiQuotaError = (error: unknown) => error instanceof ApiError && error.status === 429 && error.code === 'AI_QUOTA_EXCEEDED';

/** A message for the quota and request-state errors shared by every text-AI feature, or null for other errors. */
export function aiQuotaMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (isAiQuotaError(error)) return 'Bạn đã hết lượt hỏi trợ lý của gói hiện tại. Xem Gói của bạn để biết thời gian đặt lại hoặc đổi gói.';
  if (error.status !== 409) return null;
  if (error.code === 'AI_REQUEST_EXPIRED') return 'Lượt trao đổi này đã hết hạn. Hãy gửi một câu hỏi mới.';
  if (error.code === 'AI_REQUEST_IN_PROGRESS') return 'Câu hỏi này đang được xử lý. Hãy đợi trợ lý trả lời xong.';
  if (error.code === 'AI_REQUEST_ALREADY_PROCESSED') return 'Câu hỏi này đã được xử lý, lượt dùng không bị trừ thêm. Hãy gửi câu hỏi mới nếu cần.';
  if (error.code === 'IDEMPOTENCY_CONFLICT') return 'Yêu cầu bị trùng mã nhưng khác nội dung. Hãy gửi lại câu hỏi.';
  return null;
}
