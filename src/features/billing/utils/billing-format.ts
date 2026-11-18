export const planName = (code: 'FREE' | 'PLUS' | 'PRO' | 'PREMIUM') => ({ FREE: 'Miễn phí', PLUS: 'Plus', PRO: 'Pro', PREMIUM: 'Premium (gói cũ)' })[code];
/** The name the plan had when it was bought, so old purchases keep their old name. */
export const purchasedName = (payment: { planCode: 'PLUS' | 'PRO' | 'PREMIUM'; purchasedPlanName?: string }) => payment.purchasedPlanName || planName(payment.planCode);
export const paymentStatus = { PENDING: 'Chờ thanh toán', SUCCEEDED: 'Đã thanh toán', CANCELLED: 'Đã hủy' } as const;
export const money = (value: string) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value));
export const dateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
