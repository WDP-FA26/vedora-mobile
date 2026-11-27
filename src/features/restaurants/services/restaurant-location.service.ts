import { Platform } from 'react-native';
import type { LngLat } from '../types/restaurant.schema';

async function locationModule() {
  try {
    return await import('expo-location');
  } catch {
    throw new Error('Chưa mở được tính năng vị trí. Hãy cập nhật Expo Go hoặc chọn ghim trên bản đồ.');
  }
}
async function withDeadline<T>(operation: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error('Chưa lấy được vị trí. Hãy thử lại hoặc nhập tọa độ.')
            ),
          20000
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
async function requirePermission(
  location: Awaited<ReturnType<typeof locationModule>>
) {
  const permission = await location.requestForegroundPermissionsAsync();
  if (!permission.granted)
    throw new Error(
      'Chưa được cấp quyền vị trí. Bạn có thể bật quyền trong Cài đặt hoặc chọn ghim trên bản đồ.'
    );
}
export async function locateRestaurant(): Promise<LngLat> {
  const location = await locationModule();
  await requirePermission(location);
  const result = await withDeadline(() =>
    location.getCurrentPositionAsync({ accuracy: location.Accuracy.Balanced })
  );
  return {
    longitude: result.coords.longitude,
    latitude: result.coords.latitude,
  };
}
export async function searchRestaurantAddress(
  address: string
): Promise<LngLat[]> {
  if (address.trim().length < 3)
    throw new Error('Nhập địa chỉ nhà hàng trước khi tìm vị trí.');
  const location = await locationModule();
  if (Platform.OS === 'android') await requirePermission(location);
  const points = await withDeadline(() =>
    location.geocodeAsync(address.trim())
  );
  if (!points.length)
    throw new Error(
      'Không tìm thấy địa chỉ. Hãy nhập đầy đủ tỉnh, thành phố hoặc chọn ghim trên bản đồ.'
    );
  return points.map(({ longitude, latitude }) => ({ longitude, latitude }));
}
export async function restaurantAddressAt(point: LngLat): Promise<string> {
  const location = await locationModule();
  if (Platform.OS === 'android') await requirePermission(location);
  const [result] = await withDeadline(() =>
    location.reverseGeocodeAsync(point)
  );
  if (!result) throw new Error('Không tìm thấy địa chỉ tại ghim này.');
  const address =
    result.formattedAddress ??
    [
      result.name,
      result.street,
      result.district,
      result.city,
      result.region,
      result.country,
    ]
      .filter((part, index, parts) => part && parts.indexOf(part) === index)
      .join(', ');
  if (!address) throw new Error('Không tìm thấy địa chỉ tại ghim này.');
  return address;
}
