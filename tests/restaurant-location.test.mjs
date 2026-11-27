import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

globalThis.locationFixture = {
  granted: true,
  points: [],
  addresses: [],
  called: 0,
};
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'react-native')
      return {
        url: 'data:text/javascript,export const Platform={OS:"android"}',
        shortCircuit: true,
      };
    if (specifier === 'expo-location')
      return {
        url:
          'data:text/javascript,' +
          encodeURIComponent(`
    export const Accuracy={Balanced:3};
    export const requestForegroundPermissionsAsync=async()=>({granted:globalThis.locationFixture.granted});
    export const getCurrentPositionAsync=async()=>{globalThis.locationFixture.called++;return {coords:{latitude:10,longitude:106}}};
    export const geocodeAsync=async()=>globalThis.locationFixture.points;
    export const reverseGeocodeAsync=async()=>globalThis.locationFixture.addresses;
  `),
        shortCircuit: true,
      };
    if (specifier.startsWith('.') && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      if (existsSync(fileURLToPath(url) + '.ts')) specifier = url.href + '.ts';
    }
    return next(specifier, context);
  },
});
const api =
  await import('../src/features/restaurants/services/restaurant-location.service.ts');
test('denied location permissions never start a GPS read; granted permissions return coordinates', async () => {
  globalThis.locationFixture.granted = false;
  await assert.rejects(api.locateRestaurant(), /quyền vị trí/);
  assert.equal(globalThis.locationFixture.called, 0);
  globalThis.locationFixture.granted = true;
  assert.deepEqual(await api.locateRestaurant(), {
    latitude: 10,
    longitude: 106,
  });
});
test('address search handles short queries, missing results and permission denial', async () => {
  await assert.rejects(api.searchRestaurantAddress('a'), /Nhập địa chỉ/);
  await assert.rejects(
    api.searchRestaurantAddress('12 Nguyễn Huệ'),
    /Không tìm thấy/
  );
  globalThis.locationFixture.points = [
    { latitude: 10, longitude: 106, accuracy: 20 },
  ];
  assert.deepEqual(await api.searchRestaurantAddress('12 Nguyễn Huệ'), [
    { latitude: 10, longitude: 106 },
  ]);
  globalThis.locationFixture.granted = false;
  await assert.rejects(
    api.searchRestaurantAddress('12 Nguyễn Huệ'),
    /quyền vị trí/
  );
  globalThis.locationFixture.granted = true;
});
test('reverse geocoding returns formatted address or deduplicates native address parts', async () => {
  const point = { latitude: 10, longitude: 106 };
  await assert.rejects(api.restaurantAddressAt(point), /Không tìm thấy/);
  globalThis.locationFixture.addresses = [
    { formattedAddress: '12 Nguyễn Huệ, Hồ Chí Minh' },
  ];
  assert.equal(
    await api.restaurantAddressAt(point),
    '12 Nguyễn Huệ, Hồ Chí Minh'
  );
  globalThis.locationFixture.addresses = [
    { name: 'Nguyễn Huệ', street: 'Nguyễn Huệ', city: 'Hồ Chí Minh' },
  ];
  assert.equal(await api.restaurantAddressAt(point), 'Nguyễn Huệ, Hồ Chí Minh');
});
