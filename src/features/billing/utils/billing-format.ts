export const planName = (code: 'FREE' | 'PRO' | 'PREMIUM') => ({ FREE: 'Miễn phí', PRO: 'Pro', PREMIUM: 'Premium' })[code];
export const paymentStatus = { PENDING: 'Chờ thanh toán', SUCCEEDED: 'Đã thanh toán', CANCELLED: 'Đã hủy' } as const;
export const money = (value: string) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value));
export const dateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
