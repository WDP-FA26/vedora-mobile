import { ApiError } from '@/shared/api/api-error';

export function postEditError(error: unknown) {
  if (!(error instanceof ApiError)) return 'Chưa lưu được bài viết. Vui lòng thử lại.';
  if (error.code === 'APPEAL_IN_PROGRESS') return 'Bài viết đang có khiếu nại chưa kết thúc nên chưa thể sửa.';
  if (error.code === 'POST_NOT_EDITABLE') return 'Bài viết đang xử lý hoặc đã bị gỡ. Hãy tải lại trước khi sửa.';
  if (error.code === 'EMPTY_POST') return 'Bài viết cần có nội dung hoặc ít nhất một video.';
  if (error.code === 'MEDIA_UNAVAILABLE') return 'Video không còn khả dụng. Hãy tải lại bài viết để kiểm tra.';
  if (error.status === 401) return 'Phiên đăng nhập đã thay đổi hoặc hết hạn. Hãy đăng nhập lại.';
  if (error.status === 403) return 'Bạn chỉ có thể sửa bài viết của mình.';
  if (error.status === 404) return 'Bài viết không còn tồn tại hoặc bạn không có quyền xem.';
  if (error.status === 400) return 'Nội dung chưa hợp lệ. Hãy kiểm tra độ dài và danh sách video.';
  if (error.status === 429) return 'Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.';
  if (error.status === null) return 'Không thể kết nối máy chủ. Nội dung bạn sửa vẫn được giữ để thử lại.';
  return 'Chưa lưu được bài viết. Nội dung bạn sửa vẫn được giữ để thử lại.';
}
