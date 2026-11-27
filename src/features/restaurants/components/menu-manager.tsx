import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  useMenu,
  useRestaurantImage,
  useRestaurantMutation,
} from '../hooks/use-restaurants';
import { deleteDish, saveDish } from '../services/restaurant.service';
import type {
  MenuItemFormInput,
  RestaurantMenuItem,
} from '../types/restaurant.schema';
import { RestaurantDish } from './restaurant-detail-ui';
import {
  Action,
  Busy,
  Card,
  confirmRestaurant,
  Copy,
  Field,
  Notice,
  ui,
  RestaurantEmptyState,
  RestaurantSectionHeading,
} from './restaurant-ui';

export function MenuManager({
  id,
  approved,
}: {
  id: string;
  approved: boolean;
}) {
  const menu = useMenu(id, true, approved);
  const [editing, setEditing] = useState<RestaurantMenuItem | 'new' | null>(
    null
  );
  const remove = useRestaurantMutation((itemId: string) =>
    deleteDish(id, itemId)
  );
  return (
    <View style={{ gap: 14 }}>
      <RestaurantSectionHeading title="Thực đơn của quán" description="Một chiếc menu chỉn chu, thêm một lý do để khách ghé thăm." sticker="carrot" />
      {!approved ? (
        <RestaurantEmptyState title="Thực đơn sẽ sớm sẵn sàng" description="Bạn có thể thêm món và ảnh món ăn ngay sau khi Trang được duyệt." sticker="avocado" />
      ) : (
        <>
          {editing ? (
            <DishForm
              key={editing === 'new' ? 'new' : editing.id}
              id={id}
              dish={editing === 'new' ? undefined : editing}
              onClose={() => setEditing(null)}
            />
          ) : (
            <Action
              primary
              label="Thêm món ăn"
              icon={{ ios: 'plus', android: 'add', web: 'add' }}
              onPress={() => setEditing('new')}
            />
          )}
          {menu.isPending && <Busy />}
          <Notice
            error={menu.error ?? remove.error}
            retry={() => void menu.refetch()}
          />
          {menu.data?.items.length === 0 && !editing && <RestaurantEmptyState title="Món đầu tiên của quán là gì?" description="Thêm tên món, một bức ảnh ngon mắt và giá để khách dễ chọn bữa." />}
          {menu.data?.items.map((dish) => (
            <RestaurantDish key={dish.id} name={dish.name} image={dish.imageUrl} price={dish.priceVnd} available={dish.isAvailable} description={dish.description} category={dish.category}>
              <View style={ui.row}>
                <Action
                  label="Sửa món"
                  icon={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                  disabled={!!editing || remove.isPending}
                  onPress={() => setEditing(dish)}
                />
                <Action
                  label="Xóa món"
                  danger
                  icon={{ ios: 'trash', android: 'delete_outline', web: 'delete_outline' }}
                  disabled={!!editing || remove.isPending}
                  onPress={() =>
                    confirmRestaurant(`Xóa món ${dish.name}?`, () =>
                      remove.mutate(dish.id)
                    )
                  }
                />
              </View>
            </RestaurantDish>
          ))}
        </>
      )}
    </View>
  );
}
function DishForm({
  id,
  dish,
  onClose,
}: {
  id: string;
  dish?: RestaurantMenuItem;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [v, setV] = useState<MenuItemFormInput>({
    name: dish?.name ?? '',
    description: dish?.description ?? '',
    category: dish?.category ?? '',
    priceText: dish?.priceVnd?.toString() ?? '',
    imageUrl: dish?.imageUrl ?? null,
    isAvailable: dish?.isAvailable ?? true,
  });
  const [position, setPosition] = useState(dish?.position.toString() ?? '');
  const save = useRestaurantMutation(
    (input: MenuItemFormInput & { position?: number }) =>
      saveDish(id, input, dish?.id)
  );
  const image = useRestaurantImage(id);
  const busy = save.isPending || image.isPending;
  const patch = (values: Partial<MenuItemFormInput>) =>
    setV((previous) => ({ ...previous, ...values }));
  return (
    <Card>
      <RestaurantSectionHeading title={dish ? 'Chỉnh sửa món ăn' : 'Thêm một món ngon'} description="Thông tin rõ ràng giúp khách dễ chọn món hơn." />
      <Field
        label="Tên món"
        value={v.name}
        onChangeText={(name) => patch({ name })}
        maxLength={120}
        editable={!busy}
        placeholder="Ví dụ: Cơm sen rau củ"
      />
      <Field
        label="Mô tả"
        value={v.description}
        onChangeText={(description) => patch({ description })}
        maxLength={600}
        multiline
        editable={!busy}
        placeholder="Hương vị, nguyên liệu và điểm đặc biệt của món…"
      />
      <Field
        label="Danh mục"
        placeholder="Khai vị, Món chính, Đồ uống…"
        value={v.category}
        onChangeText={(category) => patch({ category })}
        maxLength={60}
        editable={!busy}
      />
      <Field
        label="Giá (VND, để trống nếu liên hệ)"
        value={v.priceText}
        keyboardType="number-pad"
        onChangeText={(priceText) => patch({ priceText })}
        editable={!busy}
      />
      <Field
        label="Thứ tự hiển thị (số nguyên từ 0)"
        value={position}
        keyboardType="number-pad"
        onChangeText={setPosition}
        editable={!busy}
      />
      <View style={[styles.availability, { backgroundColor: theme.muted }]}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.label, { color: theme.foreground }]}>{v.isAvailable ? 'Đang phục vụ' : 'Tạm hết món'}</Text>
          <Text style={[styles.hint, { color: theme.mutedForeground }]}>Tắt khi quán chưa thể phục vụ món này.</Text>
        </View>
        <Switch accessibilityLabel="Đang phục vụ món ăn" value={v.isAvailable} disabled={busy} onValueChange={(isAvailable) => patch({ isAvailable })} trackColor={{ false: theme.border, true: theme.primary }} />
      </View>
      {v.imageUrl && (
        <>
          <Image source={v.imageUrl} style={ui.photo} contentFit="cover" accessibilityLabel="Ảnh món ăn đã chọn" />
          <Action
            label="Gỡ ảnh"
            danger
            disabled={busy}
            onPress={() => patch({ imageUrl: null })}
          />
        </>
      )}
      <Copy>Ảnh JPG, PNG hoặc WebP, tối đa 5 MB.</Copy>
      <Action
        label={image.isPending ? 'Đang tải ảnh…' : 'Chọn ảnh món ăn'}
        icon={{ ios: 'photo.badge.plus', android: 'add_photo_alternate', web: 'add_photo_alternate' }}
        disabled={busy}
        onPress={() =>
          image.mutate(undefined, {
            onSuccess: (result) => {
              if (result) patch({ imageUrl: result.url });
            },
          })
        }
      />
      <Notice error={save.error ?? image.error} />
      <View style={ui.row}>
        <Action
          primary
          label={save.isPending ? 'Đang lưu…' : 'Lưu món'}
          disabled={busy}
          onPress={() =>
            save.mutate(
              {
                ...v,
                ...(position.trim() === ''
                  ? {}
                  : {
                      position: /^\d+$/.test(position) ? Number(position) : NaN,
                    }),
              },
              { onSuccess: onClose }
            )
          }
        />
        <Action label="Hủy" disabled={busy} onPress={onClose} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  availability: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, gap: 12 },
  label: { fontFamily: Fonts.sansSemibold, fontSize: 15 },
  hint: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
});
