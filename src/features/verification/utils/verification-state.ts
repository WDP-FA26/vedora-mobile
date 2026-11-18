import type { MyVerification } from '../types/verification.schema';

export function canSubmitVerification(data: MyVerification) {
  return !data.isProfessional && data.request?.status !== 'PENDING';
}

export function verificationLabel(data: MyVerification) {
  if (data.isProfessional) return 'Chuyên gia đã xác minh';
  switch (data.request?.status) {
    case 'PENDING': return 'Yêu cầu đang chờ duyệt';
    case 'REJECTED': return 'Yêu cầu chưa được duyệt';
    case 'APPROVED': return 'Yêu cầu đã được duyệt';
    default: return 'Xác minh chuyên gia';
  }
}
