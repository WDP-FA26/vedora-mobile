import { router } from 'expo-router';
import { useSessionStore } from '@/shared/stores/session-store';
import { useMyWorkspaces } from '../hooks/use-restaurants';
import { usePageAccount } from '../hooks/use-page-account';
import { RefreshWorkspaceButton, WorkspaceWelcome } from './workspace-ui';
import { WorkspacePageCard } from './workspace-cards';
import {
  Action,
  Body,
  Busy,
  Notice,
  RestaurantShell,
  RestaurantEmptyState,
  RestaurantSectionHeading,
} from './restaurant-ui';

export function PagesScreen() {
  const token = useSessionStore((state) => state.accessToken);
  const actor = useSessionStore((state) => state.actor);
  const pages = useMyWorkspaces();
  const account = usePageAccount();
  return (
    <RestaurantShell title="Nhà hàng của tôi" action={token ? <RefreshWorkspaceButton busy={pages.isFetching} onPress={() => void pages.refetch()} /> : undefined}>
      <Body>
        {!token ? (
          <RestaurantEmptyState title="Chào người chủ quán tương lai" description="Đăng nhập để tạo Trang, giới thiệu quán chay và quản lý đội ngũ của bạn." sticker="tomato">
            <Action
              primary
              label="Đăng nhập"
              onPress={() =>
                router.push({
                  pathname: '/login',
                  params: { returnTo: '/pages' },
                })
              }
            />
          </RestaurantEmptyState>
        ) : (
          <>
            {actor ? (
              <WorkspaceWelcome title="Chăm chút từng góc nhỏ của quán" description="Bạn đang dùng danh tính Trang nhà hàng. Chuyển về cá nhân nếu muốn đăng ký thêm một Trang mới.">
                <Action
                  label={`Về @${actor.username}`}
                  disabled={account.isPending}
                  onPress={() => account.mutate(null)}
                />
                <Notice error={account.error} />
              </WorkspaceWelcome>
            ) : (
              <WorkspaceWelcome title="Mang quán chay của bạn đến gần mọi người" description="Tạo Trang để giới thiệu quán, chia sẻ menu và cùng đội ngũ chăm sóc khách hàng.">
              <Action
                primary
                label="Đăng ký nhà hàng"
                icon={{ ios: 'plus', android: 'add', web: 'add' }}
                onPress={() => router.push('/pages/new')}
              />
              </WorkspaceWelcome>
            )}
            {pages.isPending && <Busy />}
            <Notice error={pages.error} retry={() => void pages.refetch()} />
            {pages.data?.length === 0 && (
              <RestaurantEmptyState title="Quán của bạn bắt đầu từ đây" description="Các Trang bạn sở hữu hoặc được mời quản lý sẽ xuất hiện tại đây." sticker="tomato" />
            )}
            {!!pages.data?.length && <RestaurantSectionHeading title={`Trang của bạn · ${pages.data.length}`} description="Chọn một nhà hàng để cập nhật thông tin và chăm sóc Trang." />}
            {pages.data?.map((page) => (
              <WorkspacePageCard key={page.id} page={page} onPress={() =>
                    router.push({
                      pathname: '/pages/[id]',
                      params: { id: page.id },
                    })
                  } />
            ))}
          </>
        )}
      </Body>
    </RestaurantShell>
  );
}
