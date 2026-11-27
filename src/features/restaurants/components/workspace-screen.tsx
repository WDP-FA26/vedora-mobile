import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSessionStore } from '@/shared/stores/session-store';
import { usePageAccount } from '../hooks/use-page-account';
import { useRestaurantMutation, useWorkspace } from '../hooks/use-restaurants';
import {
  addMember,
  removeMember,
  updateDetails,
} from '../services/restaurant.service';
import {
  type RestaurantDetailsFormInput,
  type WorkspaceDetail,
  WORKSPACE_STATUS_LABELS,
} from '../types/restaurant.schema';
import { REJECT_REASON_LABELS } from '../utils/onboarding';
import { canRemoveWorkspaceMember } from '../utils/permissions';
import { LocationField } from './location-field';
import { MenuManager } from './menu-manager';
import { RefreshWorkspaceButton } from './workspace-ui';
import {
  Action,
  Body,
  Busy,
  Card,
  confirmRestaurant,
  Copy,
  Field,
  Heading,
  Notice,
  RestaurantShell,
} from './restaurant-ui';

export function WorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useWorkspace(id);
  const page = query.data;
  const actor = useSessionStore((state) => state.actor);
  const userId = useSessionStore((state) => state.userId);
  const account = usePageAccount();
  return (
    <RestaurantShell title={page?.name ?? 'Quản lý nhà hàng'} action={<RefreshWorkspaceButton busy={query.isFetching} onPress={() => void query.refetch()} />}>
      <Body>
        {query.isPending && <Busy />}
        <Notice error={query.error} retry={() => void query.refetch()} />
        {page && (
          <>
            <Card>
              <Heading>{page.name}</Heading>
              <Copy>
                @{page.username} · {WORKSPACE_STATUS_LABELS[page.status]} ·{' '}
                {page.role === 'OWNER' ? 'Chủ trang' : 'Quản lý'}
              </Copy>
              {page.status === 'PENDING' && (
                <Copy>
                  Đã gửi {page.proofCount} ảnh minh chứng. Nhà hàng sẽ xuất hiện
                  công khai sau khi quản trị viên duyệt.
                </Copy>
              )}
              {page.status === 'REJECTED' && (
                <>
                  <Copy>
                    {page.rejectReason
                      ? REJECT_REASON_LABELS[page.rejectReason]
                      : 'Đơn chưa được duyệt.'}{' '}
                    {page.reviewNote}
                  </Copy>
                  {page.role === 'OWNER' && !actor && (
                    <Action
                      label="Sửa và gửi lại đơn"
                      onPress={() =>
                        router.push({
                          pathname: '/pages/new',
                          params: { resubmit: id },
                        })
                      }
                    />
                  )}
                  {actor && <Copy>Về tài khoản cá nhân để gửi lại đơn.</Copy>}
                </>
              )}
              {page.status === 'APPROVED' && page.pageUserId && (
                <>
                  <Action
                    primary
                    label={
                      account.isPending
                        ? 'Đang chuyển…'
                        : userId === page.pageUserId
                          ? `Về @${actor?.username ?? 'cá nhân'}`
                          : 'Dùng tài khoản Trang'
                    }
                    disabled={account.isPending}
                    onPress={() =>
                      account.mutate(
                        userId === page.pageUserId ? null : page.pageUserId,
                        { onSuccess: () => router.replace('/me') }
                      )
                    }
                  />
                  <Action
                    label="Xem nhà hàng công khai"
                    onPress={() =>
                      router.push({
                        pathname: '/restaurants/[id]',
                        params: { id: page.pageUserId! },
                      })
                    }
                  />
                  {userId === page.pageUserId && (
                    <Action
                      label="Sửa tên, giới thiệu và ảnh Trang"
                      onPress={() => router.push('/edit-profile')}
                    />
                  )}
                  <Copy>
                    Dùng tài khoản Trang để sửa hồ sơ, đăng bài và trả lời tin
                    nhắn dưới tên nhà hàng.
                  </Copy>
                </>
              )}
              <Notice error={account.error} />
            </Card>
            <MenuManager id={id} approved={page.status === 'APPROVED'} />
            <DetailsForm key={`${id}:${page.status}`} page={page} />
            <Members page={page} />
          </>
        )}
      </Body>
    </RestaurantShell>
  );
}
function DetailsForm({ page }: { page: WorkspaceDetail }) {
  const [v, setV] = useState<RestaurantDetailsFormInput>({
    address: page.address,
    location: { longitude: page.longitude, latitude: page.latitude },
    phone: page.phone ?? '',
    website: page.website ?? '',
  });
  const save = useRestaurantMutation((input: RestaurantDetailsFormInput) =>
    updateDetails(page.id, input)
  );
  const [saved, setSaved] = useState(false);
  const locked = page.status === 'APPROVED';
  const patch = (value: Partial<RestaurantDetailsFormInput>) => {
    setSaved(false);
    setV((previous) => ({ ...previous, ...value }));
  };
  return (
    <Card>
      <Heading>Địa chỉ và liên hệ</Heading>
      {locked && (
        <Copy>
          Địa chỉ và vị trí được khóa sau khi duyệt để bảo vệ thông tin đã xác
          minh.
        </Copy>
      )}
      <Field
        label="Địa chỉ"
        value={v.address}
        maxLength={300}
        onChangeText={(address) => patch({ address })}
        editable={!locked && !save.isPending}
      />
      <LocationField
        address={v.address}
        onAddressChange={(address) => patch({ address })}
        value={v.location}
        onChange={(location) => patch({ location })}
        disabled={locked || save.isPending}
      />
      <Field
        label="Số điện thoại"
        value={v.phone}
        onChangeText={(phone) => patch({ phone })}
        maxLength={30}
        editable={!save.isPending}
        keyboardType="phone-pad"
      />
      <Field
        label="Website"
        value={v.website}
        onChangeText={(website) => patch({ website })}
        maxLength={300}
        editable={!save.isPending}
        autoCapitalize="none"
      />
      <Action
        primary
        label={save.isPending ? 'Đang lưu…' : 'Lưu liên hệ'}
        disabled={save.isPending}
        onPress={() => save.mutate(v, { onSuccess: () => setSaved(true) })}
      />
      {saved && <Copy>Đã lưu thông tin nhà hàng.</Copy>}
      <Notice error={save.error} />
    </Card>
  );
}
function Members({ page }: { page: WorkspaceDetail }) {
  const [username, setUsername] = useState('');
  const userId = useSessionStore((state) => state.userId);
  const actor = useSessionStore((state) => state.actor);
  const personId = actor?.id ?? userId;
  const add = useRestaurantMutation((username: string) =>
    addMember(page.id, username)
  );
  const remove = useRestaurantMutation((id: string) =>
    removeMember(page.id, id)
  );
  const busy = add.isPending || remove.isPending;
  return (
    <View style={{ gap: 14 }}>
      <Heading>Thành viên quản lý</Heading>
      <Copy>
        Chủ Trang được thêm/xóa quản lý. Quản lý có thể rời Trang từ tài khoản
        cá nhân.
      </Copy>
      {page.members.map((member) => (
        <Card key={member.userId}>
          <Heading>{member.fullName}</Heading>
          <Copy>
            @{member.username} ·{' '}
            {member.role === 'OWNER' ? 'Chủ Trang' : 'Quản lý'}
          </Copy>
          {canRemoveWorkspaceMember(page, member, userId, actor?.id) && (
            <Action
              label={member.userId === personId ? 'Rời Trang' : 'Xóa quản lý'}
              disabled={busy}
              onPress={() =>
                confirmRestaurant(
                  member.userId === personId
                    ? 'Rời Trang nhà hàng?'
                    : `Xóa @${member.username} khỏi Trang?`,
                  () =>
                    remove.mutate(member.userId, {
                      onSuccess: () => {
                        if (member.userId === personId)
                          router.replace('/pages');
                      },
                    })
                )
              }
            />
          )}
        </Card>
      ))}
      {page.role === 'OWNER' && page.status === 'APPROVED' && (
        <Card>
          <Field
            label="Tên đăng nhập người quản lý mới"
            value={username}
            onChangeText={setUsername}
            editable={!busy}
            autoCapitalize="none"
          />
          <Action
            label="Thêm quản lý"
            disabled={busy || !username.trim()}
            onPress={() =>
              add.mutate(username, { onSuccess: () => setUsername('') })
            }
          />
        </Card>
      )}
      <Notice error={add.error ?? remove.error} />
    </View>
  );
}
