import { ApiError } from '@/shared/api/api-error';

import type { MealLogEntry } from '../types/meal-log.schema';

export const vn = (value: number) => value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });

/** "450 kcal", or "~450 kcal" for an AI estimate, which is only approximate. */
export function caloriesLabel(entry: Pick<MealLogEntry, 'calories' | 'calorieSource'>) {
  if (entry.calories === null) return 'Chưa có kcal';
  return `${entry.calorieSource === 'WEB_ESTIMATE' ? '~' : ''}${vn(entry.calories)} kcal`;
}

/** "1", "1,5"; empty or not a number gives null. At most two decimals, as the API takes. */
export function parseDecimal(value: string) {
  const trimmed = value.trim().replace(',', '.');
  const parsed = trimmed ? Number(trimmed) : NaN;
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
}

export function mealLogErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'MEAL_LOG_LOCKED') return 'Ngày này đã khóa, không ghi hay xóa được nữa. Chỉ ghi được hôm nay và vài ngày gần đây.';
    if (error.code === 'MEAL_LOG_FULL') return 'Bữa này đã đủ số món tối đa. Hãy xóa bớt một món trước.';
    if (error.status === 409) return 'Món này đã được ghi ở bữa này. Hãy tăng khẩu phần thay vì ghi thêm lần nữa.';
    if (error.code === 'AI_QUOTA_EXCEEDED') return 'Bạn đã dùng hết lượt AI trong kỳ này. Hãy tự nhập kcal.';
    if (error.status === 429) return 'Bạn thao tác hơi nhanh. Hãy thử lại sau ít giây.';
    if (error.status === 503) return 'AI đang bận. Hãy thử lại sau hoặc tự nhập kcal.';
  }
  return 'Không thực hiện được. Hãy kiểm tra kết nối rồi thử lại.';
}
