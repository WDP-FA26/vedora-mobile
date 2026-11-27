import type { ActivityLevel, BiologicalSex, BmiCategory, BodyFeeling, NutritionGoal } from '../types/nutrition.schema';
import type { NutritionPillar } from '../types/nutrition-pillar.schema';

export const pillarLabels: Record<NutritionPillar, { label: string; short: string }> = {
  PLANT_PROTEIN: { label: 'Đạm thực vật', short: 'Đạm' },
  FIBER_VEG: { label: 'Chất xơ & rau củ', short: 'Xơ' },
  HEALTHY_FAT: { label: 'Chất béo tốt', short: 'Béo tốt' },
  IRON_RICH: { label: 'Giàu sắt', short: 'Sắt' },
  CALCIUM_RICH: { label: 'Giàu canxi', short: 'Canxi' },
};

export const sexLabels: Record<BiologicalSex, string> = { FEMALE: 'Nữ', MALE: 'Nam', OTHER: 'Khác' };

export const activityLabels: Record<ActivityLevel, { label: string; hint: string }> = {
  SEDENTARY: { label: 'Ít vận động', hint: 'Làm việc văn phòng, ít đi lại' },
  LIGHT: { label: 'Vận động nhẹ', hint: 'Đi bộ, việc nhà, tập 1–2 buổi/tuần' },
  MODERATE: { label: 'Vận động vừa', hint: 'Tập thể thao 3–5 buổi/tuần' },
  ACTIVE: { label: 'Năng động', hint: 'Vận động nặng hoặc tập hằng ngày' },
};

export const goalLabels: Record<NutritionGoal, { label: string; hint: string }> = {
  LOSE_WEIGHT: { label: 'Giảm cân nhẹ nhàng', hint: 'Thâm hụt vừa phải (~350 kcal/ngày), ưu tiên bữa tối thanh nhẹ' },
  MAINTAIN: { label: 'Giữ dáng & cân bằng', hint: 'Duy trì mức năng lượng cân bằng và đủ 5 nhóm chất chay' },
  GAIN_WEIGHT: { label: 'Tăng cân lành mạnh', hint: 'Thêm bữa phụ hoặc ghép món giàu đạm & béo tốt để không đầy bụng' },
};

export const bmiLabels: Record<BmiCategory, { label: string; description: string }> = {
  UNDERWEIGHT: { label: 'Cần bồi bổ', description: 'Cơ thể đang cần thêm năng lượng dự trữ (< 18,5)' },
  NORMAL: { label: 'Cân đối', description: 'Vùng BMI hài hòa theo chuẩn Châu Á (18,5 – 22,9)' },
  OVERWEIGHT: { label: 'Hơi dư năng lượng', description: 'Trên mốc cân đối nhẹ theo chuẩn Châu Á (23,0 – 24,9)' },
  OBESE: { label: 'Ưu tiên nhẹ bụng', description: 'Nên ưu tiên thực đơn thanh đạm, giàu xơ & đạm thực vật (>= 25,0)' },
};

export const feelingLabels: Record<BodyFeeling, string> = { ENERGETIC: 'Đủ sức', NORMAL: 'Bình thường', TIRED: 'Hơi mệt', BLOATED: 'Đầy bụng' };
