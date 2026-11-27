import { router } from 'expo-router';
import { useSessionStore } from '@/shared/stores/session-store';
import { useMyWorkspaces } from '../hooks/use-restaurants';
import { usePageAccount } from '../hooks/use-page-account';
import { WORKSPACE_STATUS_LABELS } from '../types/restaurant.schema';
import { RefreshWorkspaceButton, WorkspaceWelcome } from './workspace-ui';
import {
  Action,
  Body,
  Busy,
  Card,
  Copy,
  Heading,
  Notice,
  RestaurantShell,
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
          <>
            <Copy>Đăng nhập để mở và quản lý nhà hàng của bạn.</Copy>
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
          </>
        ) : (
          <>
            {actor ? (
              <>
                <Copy>
                  Bạn đang dùng tài khoản Trang. Chuyển về cá nhân để đăng ký
                  nhà hàng mới.
                </Copy>
                <Action
                  label={`Về @${actor.username}`}
                  disabled={account.isPending}
                  onPress={() => account.mutate(null)}
                />
                <Notice error={account.error} />
              </>
            ) : (
              <WorkspaceWelcome title="Mang quán chay của bạn đến gần mọi người" description="Tạo Trang để giới thiệu quán, chia sẻ menu và cùng đội ngũ chăm sóc khách hàng.">
              <Action
                primary
                label="＋ Đăng ký nhà hàng"
                onPress={() => router.push('/pages/new')}
              />
              <Copy>Chuẩn bị thông tin quán và ảnh giấy tờ để đăng ký trong 3 bước.</Copy>
              </WorkspaceWelcome>
            )}
            {pages.isPending && <Busy />}
            <Notice error={pages.error} retry={() => void pages.refetch()} />
            {pages.data?.length === 0 && (
              <Copy>Bạn chưa sở hữu hoặc quản lý Trang nhà hàng nào.</Copy>
            )}
            {pages.data?.map((page) => (
              <Card key={page.id}>
                <Heading>{page.name}</Heading>
                <Copy>
                  @{page.username} ·{' '}
                  {page.role === 'OWNER' ? 'Chủ trang' : 'Quản lý'}
                </Copy>
                <Copy>
                  {WORKSPACE_STATUS_LABELS[page.status]} · {page.address}
                </Copy>
                {page.status === 'REJECTED' && (
                  <Copy>{page.reviewNote ?? 'Đơn chưa được duyệt.'}</Copy>
                )}
                <Action
                  label="Quản lý Trang"
                  onPress={() =>
                    router.push({
                      pathname: '/pages/[id]',
                      params: { id: page.id },
                    })
                  }
                />
              </Card>
            ))}
          </>
        )}
      </Body>
    </RestaurantShell>
  );
}
