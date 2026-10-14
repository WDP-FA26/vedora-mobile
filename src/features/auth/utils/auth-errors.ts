import { ApiError } from '@/shared/api/api-error';

export function authErrorMessage(error: unknown, action: 'login' | 'register' | 'verify' | 'resend'): string {
  if (!(error instanceof ApiError)) return 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.';
  if (error.code === 'VERIFY_LIMIT_REACHED') return 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại ngày mai.';
  if (error.code === 'RESEND_LIMIT_REACHED') return 'Đã hết lượt gửi mã trong một giờ. Vui lòng thử lại sau.';
  if (error.status === 400 && action === 'verify') return 'Mã xác minh không đúng hoặc đã hết hạn.';
  if (error.status === 401 && action === 'login') return 'Tên đăng nhập hoặc mật khẩu không đúng.';
  if (error.status === 409 && action === 'register') return 'Tên đăng nhập hoặc email đã được sử dụng.';
  if (error.status === 503 && action === 'resend') return 'Chưa thể gửi email. Vui lòng thử lại sau.';
  if (error.status === 429) return 'Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.';
  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}
