import { useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
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
import {
  Action,
  Busy,
  Card,
  confirmRestaurant,
  Copy,
  Field,
  Heading,
  Notice,
  ui,
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
      <Heading>Quản lý thực đơn</Heading>
      {!approved ? (
        <Copy>Bạn có thể thêm món sau khi Trang được duyệt.</Copy>
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
              onPress={() => setEditing('new')}
            />
          )}
          {menu.isPending && <Busy />}
          <Notice
            error={menu.error ?? remove.error}
            retry={() => void menu.refetch()}
          />
          {menu.data?.items.length === 0 && <Copy>Chưa có món ăn nào.</Copy>}
          {menu.data?.items.map((dish) => (
            <Card key={dish.id}>
              {dish.imageUrl && (
                <Image
                  source={dish.imageUrl}
                  style={ui.photo}
                  contentFit="cover"
                />
              )}
              <Heading>{dish.name}</Heading>
              <Copy>
                {dish.category ?? 'Chưa phân loại'} ·{' '}
                {dish.priceVnd === null
                  ? 'Liên hệ giá'
                  : `${dish.priceVnd.toLocaleString('vi-VN')} đ`}{' '}
                · {dish.isAvailable ? 'Đang phục vụ' : 'Tạm hết'} · Vị trí{' '}
                {dish.position}
              </Copy>
              <View style={ui.row}>
                <Action
                  label="Sửa món"
                  disabled={!!editing || remove.isPending}
                  onPress={() => setEditing(dish)}
                />
                <Action
                  label="Xóa món"
                  disabled={!!editing || remove.isPending}
                  onPress={() =>
                    confirmRestaurant(`Xóa món ${dish.name}?`, () =>
                      remove.mutate(dish.id)
                    )
                  }
                />
              </View>
            </Card>
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
      <Heading>{dish ? 'Sửa món ăn' : 'Món ăn mới'}</Heading>
      <Field
        label="Tên món"
        value={v.name}
        onChangeText={(name) => patch({ name })}
        maxLength={120}
        editable={!busy}
      />
      <Field
        label="Mô tả"
        value={v.description}
        onChangeText={(description) => patch({ description })}
        maxLength={600}
        multiline
        editable={!busy}
      />
      <Field
        label="Danh mục (Khai vị, Món chính, Đồ uống…)"
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
      <Action
        label={v.isAvailable ? '☑ Đang phục vụ' : '☐ Tạm hết món'}
        onPress={() => patch({ isAvailable: !v.isAvailable })}
        disabled={busy}
      />
      {v.imageUrl && (
        <>
          <Image source={v.imageUrl} style={ui.photo} contentFit="cover" />
          <Action
            label="Gỡ ảnh"
            disabled={busy}
            onPress={() => patch({ imageUrl: null })}
          />
        </>
      )}
      <Copy>Ảnh JPG, PNG hoặc WebP, tối đa 5 MB.</Copy>
      <Action
        label={image.isPending ? 'Đang tải ảnh…' : 'Chọn ảnh món ăn'}
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
