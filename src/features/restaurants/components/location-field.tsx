import { useState } from 'react';
import { Platform, View } from 'react-native';
import type { LngLat } from '../types/restaurant.schema';
import {
  useRestaurantAddressAt,
  useRestaurantAddressSearch,
  useRestaurantLocation,
} from '../hooks/use-restaurants';
import { parseRestaurantCoordinates } from '../utils/location';
import { RestaurantMap } from './restaurant-map';
import { Action, Copy, Field, Notice } from './restaurant-ui';

export function LocationField({
  value,
  onChange,
  disabled,
  address,
  onAddressChange,
}: {
  value: LngLat | null;
  onChange: (value: LngLat) => void;
  disabled?: boolean;
  address?: string;
  onAddressChange?: (address: string) => void;
}) {
  const locate = useRestaurantLocation();
  const search = useRestaurantAddressSearch();
  const reverse = useRestaurantAddressAt();
  const [coordinateText, setCoordinateText] = useState<string | null>(null);
  const [coordinateError, setCoordinateError] = useState<unknown>(null);
  const busy = locate.isPending || search.isPending || reverse.isPending;
  const clearErrors = () => {
    setCoordinateError(null);
    locate.reset();
    search.reset();
    reverse.reset();
  };
  const pick = (point: LngLat) => {
    setCoordinateText(null);
    clearErrors();
    onChange(point);
  };
  return (
    <View style={{ gap: 10 }}>
      <Copy>
        {disabled
          ? 'Vị trí nhà hàng'
          : 'Chạm hoặc kéo ghim đến đúng vị trí quán.'}
      </Copy>
      <RestaurantMap
        point={value}
        editable={!disabled && !busy}
        onPick={pick}
      />
      {value && (
        <Copy>
          {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
        </Copy>
      )}
      {!disabled && (
        <>
          <Action
            label={
              locate.isPending ? 'Đang lấy vị trí…' : 'Dùng vị trí hiện tại'
            }
            disabled={busy}
            onPress={() => {
              clearErrors();
              locate.mutate(undefined, { onSuccess: pick });
            }}
          />
          <Field
            label="Tọa độ (vĩ độ, kinh độ)"
            value={
              coordinateText ??
              (value ? `${value.latitude}, ${value.longitude}` : '')
            }
            onChangeText={setCoordinateText}
            editable={!busy}
            autoCapitalize="none"
            placeholder="10.7769, 106.7009"
          />
          <Action
            label="Áp dụng tọa độ"
            disabled={busy}
            onPress={() => {
              clearErrors();
              try {
                pick(
                  parseRestaurantCoordinates(
                    coordinateText ??
                      (value ? `${value.latitude}, ${value.longitude}` : '')
                  )
                );
              } catch (error) {
                setCoordinateError(error);
              }
            }}
          />
          {Platform.OS !== 'web' && address !== undefined && (
            <>
              <Action
                label={
                  search.isPending
                    ? 'Đang tìm địa chỉ…'
                    : 'Tìm vị trí từ địa chỉ đã nhập'
                }
                disabled={busy || address.trim().length < 3}
                onPress={() => {
                  clearErrors();
                  search.mutate(address);
                }}
              />
              {search.data?.map((point, index) => (
                <Action
                  key={`${point.latitude},${point.longitude}`}
                  label={`Chọn kết quả ${index + 1} · ${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`}
                  disabled={busy}
                  onPress={() => {
                    pick(point);
                    search.reset();
                  }}
                />
              ))}
              {value && onAddressChange && (
                <Action
                  label={
                    reverse.isPending
                      ? 'Đang lấy địa chỉ…'
                      : 'Điền địa chỉ từ ghim'
                  }
                  disabled={busy}
                  onPress={() => {
                    clearErrors();
                    reverse.mutate(value, { onSuccess: onAddressChange });
                  }}
                />
              )}
            </>
          )}
        </>
      )}
      <Notice
        error={coordinateError ?? locate.error ?? search.error ?? reverse.error}
      />
    </View>
  );
}
