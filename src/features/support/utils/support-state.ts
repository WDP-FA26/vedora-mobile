import type { AppealReason, TicketCategory, TicketDetail, TicketStatus } from '../types/support.schema';

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  CONTENT_APPEAL: 'Khiếu nại nội dung', PAYMENT_ISSUE: 'Thanh toán', VERIFICATION: 'Xác minh tài khoản', GENERAL: 'Hỗ trợ chung',
};
export const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Đang xử lý', WAITING_USER: 'Cần bạn phản hồi', RESOLVED: 'Đã giải quyết', CLOSED: 'Đã đóng', WITHDRAWN: 'Đã rút', EXPIRED: 'Hết hạn phản hồi',
};
export const REASON_LABELS: Record<AppealReason, string> = {
  FALSE_POSITIVE: 'Nội dung bị đánh dấu nhầm', CONTEXT_MISUNDERSTOOD: 'Ngữ cảnh bị hiểu sai', NO_MANIPULATION: 'Không có thao túng tương tác', OTHER: 'Lý do khác',
};
export function isTicketActive(status: TicketStatus) {
  return status === 'OPEN' || status === 'WAITING_USER';
}
export function ticketReplyMode(ticket: Pick<TicketDetail, 'status' | 'category' | 'reopenableUntil'>, now = Date.now()): 'reply' | 'reopen' | null {
  if (isTicketActive(ticket.status)) return 'reply';
  if (ticket.category === 'CONTENT_APPEAL' || !ticket.reopenableUntil) return null;
  return Date.parse(ticket.reopenableUntil) > now ? 'reopen' : null;
}
export function supportDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('vi-VN');
}
