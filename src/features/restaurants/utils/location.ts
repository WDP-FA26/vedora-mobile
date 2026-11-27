import { z } from 'zod';

export function parseRestaurantCoordinates(text: string) {
  const match = text
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) throw new Error('Nhập vĩ độ, kinh độ, ví dụ: 10.7769, 106.7009');
  const result = z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .safeParse({ latitude: Number(match[1]), longitude: Number(match[2]) });
  if (!result.success)
    throw new Error('Vĩ độ từ -90 đến 90; kinh độ từ -180 đến 180.');
  return result.data;
}
