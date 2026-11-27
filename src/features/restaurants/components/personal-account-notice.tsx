import { router } from 'expo-router';
import { usePageAccount } from '../hooks/use-page-account';
import { Action, Body, Notice, RestaurantEmptyState, RestaurantShell } from './restaurant-ui';

export function PersonalAccountNotice() {
  const account = usePageAccount();
  return (
    <RestaurantShell title="Tài khoản cá nhân">
      <Body>
        <RestaurantEmptyState title="Một góc riêng dành cho bạn" description="Chuyển về tài khoản cá nhân để dùng trợ lý, thực đơn và hồ sơ ăn uống của bạn." sticker="avocado">
        <Action
          primary
          label={account.isPending ? 'Đang chuyển…' : 'Về tài khoản cá nhân'}
          disabled={account.isPending}
          onPress={() => account.mutate(null)}
        />
        <Action
          label="Quản lý Trang nhà hàng"
          onPress={() => router.push('/pages')}
        />
        <Notice error={account.error} />
        </RestaurantEmptyState>
      </Body>
    </RestaurantShell>
  );
}
