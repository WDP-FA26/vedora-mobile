import { ZodError } from 'zod';

import { ApiError } from '@/shared/api/api-error';

const ERRORS: Record<string, string> = {
  POST_NOT_APPEALABLE: 'Bài này không thuộc trường hợp được khiếu nại.',
  APPEAL_IN_PROGRESS: 'Bài đã có khiếu nại đang xử lý. Mở danh sách hỗ trợ để xem.',
  APPEAL_WINDOW_EXPIRED: 'Đã hết thời hạn gửi khiếu nại cho lần xử lý này.',
  ALREADY_APPEALED: 'Khiếu nại cho lần xử lý này đã được xem xét.',
  WITHDRAWAL_LIMIT_REACHED: 'Đã đạt giới hạn rút khiếu nại cho lần xử lý này.',
  TICKET_LIMIT_REACHED: 'Bạn đang có quá nhiều yêu cầu mở. Chờ xử lý rồi thử lại.',
  TICKET_WAIT_FOR_ADMIN: 'Bạn đã gửi nhiều phản hồi liên tiếp. Hãy chờ Vedora trả lời.',
  TICKET_MESSAGE_LIMIT_REACHED: 'Yêu cầu đã đạt giới hạn trao đổi.',
  TICKET_ALREADY_CLOSED: 'Yêu cầu đã kết thúc. Tải lại để xem trạng thái mới nhất.',
  TICKET_REOPEN_WINDOW_EXPIRED: 'Đã hết thời hạn mở lại. Bạn có thể tạo yêu cầu mới.',
  ATTACHMENT_NOT_UPLOADED: 'Ảnh chưa được kho lưu trữ xác nhận. Đợi một chút rồi gửi lại.',
  ATTACHMENT_LIMIT_REACHED: 'Bạn đã tải quá nhiều ảnh chưa gửi. Hãy thử lại sau.',
  UNKNOWN_ATTACHMENT: 'Ảnh đã hết hạn hoặc đã được gửi. Tải lại yêu cầu để xác nhận kết quả; nếu chưa có, gỡ ảnh và chọn lại.',
  FILE_TOO_LARGE: 'Ảnh vượt quá dung lượng BE cho phép. Hãy chọn ảnh nhỏ hơn.',
};
export function supportError(error: unknown) {
  if (error instanceof ZodError) return error.issues[0]?.message ?? 'Kiểm tra lại nội dung.';
  if (error instanceof ApiError) {
    if (error.code && ERRORS[error.code]) return ERRORS[error.code];
    if (error.status === 403) return 'Bạn không có quyền thao tác với yêu cầu hoặc bài viết này.';
    if (error.status === 404) return 'Yêu cầu hoặc bài viết không tồn tại hoặc không còn truy cập được.';
    if (error.status === 429) return 'Bạn thao tác quá nhanh. Hãy thử lại sau.';
    if (error.status === 503) return 'Dịch vụ hỗ trợ hoặc kho ảnh tạm thời chưa sẵn sàng.';
    if (error.status === 400 || error.status === 409) return 'Dữ liệu hoặc trạng thái đã thay đổi. Tải lại để kiểm tra trước khi gửi lại.';
    if (!error.status || error.status >= 500) return 'Chưa xác nhận được kết quả. Tải lại danh sách hoặc yêu cầu trước khi gửi lại để tránh gửi trùng. Nội dung đang soạn vẫn được giữ.';
  }
  return 'Chưa hoàn tất thao tác. Kiểm tra kết nối rồi thử lại; nội dung đang soạn vẫn được giữ.';
}
