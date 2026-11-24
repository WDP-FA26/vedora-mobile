import { ZodError } from 'zod';

import { ApiError } from '@/shared/api/api-error';

export function reportError(error: unknown) {
  if (error instanceof ZodError) return error.issues[0]?.message ?? 'Kiểm tra lại thông tin báo cáo.';
  if (error instanceof ApiError) {
    if (error.code === 'UNKNOWN_ATTACHMENT') return 'Ảnh đã hết hạn hoặc không còn hợp lệ. Gỡ ảnh và chọn lại trước khi gửi.';
    if (error.code === 'ATTACHMENT_LIMIT_REACHED') return 'Bạn đã tải nhiều ảnh chưa gửi. Vui lòng thử lại sau.';
    if (error.code === 'OWN_POST') return 'Bạn không thể báo cáo bài viết của chính mình.';
    if (error.status === 401) return 'Phiên đăng nhập đã thay đổi. Đóng form và đăng nhập lại.';
    if (error.status === 413) return 'Ảnh vượt quá dung lượng cho phép. Hãy chọn ảnh nhỏ hơn.';
    if (error.status === 415) return 'Ảnh không đúng định dạng. Hãy chọn JPG, PNG hoặc WebP.';
    if (error.status === 503) return 'Kho ảnh tạm thời chưa sẵn sàng. Thử lại sau hoặc gỡ ảnh để gửi báo cáo không kèm ảnh.';
    if (error.status === 403 || error.status === 404) return 'Bài viết không còn công khai hoặc bạn không có quyền báo cáo.';
    if (error.status === 429) return 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.';
  }
  return 'Chưa hoàn tất thao tác. Kiểm tra kết nối rồi thử lại; nội dung và ảnh đã tải vẫn được giữ.';
}
