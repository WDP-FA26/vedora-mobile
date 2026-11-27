import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { router, useLocalSearchParams } from 'expo-router';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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
} from '../types/restaurant.schema';
import { REJECT_REASON_LABELS } from '../utils/onboarding';
import { canRemoveWorkspaceMember } from '../utils/permissions';
import { LocationField } from './location-field';
import { MenuManager } from './menu-manager';
import { RefreshWorkspaceButton } from './workspace-ui';
import { WorkspaceIdentity } from './workspace-cards';
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
  RestaurantSectionHeading,
  RestaurantTabs,
} from './restaurant-ui';

export function WorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useWorkspace(id);
  const page = query.data;
  const actor = useSessionStore((state) => state.actor);
  const userId = useSessionStore((state) => state.userId);
  const account = usePageAccount();
  const [tab, setTab] = useState<'overview' | 'menu' | 'members'>('overview');
  return (
    <RestaurantShell title="Quản lý Trang" action={<RefreshWorkspaceButton busy={query.isFetching} onPress={() => void query.refetch()} />}>
      <Body>
        {query.isPending && <Busy />}
        <Notice error={query.error} retry={() => void query.refetch()} />
        {page && (
          <>
            <WorkspaceIdentity page={page}>
              {page.status === 'APPROVED' && page.pageUserId && (
                <Action label="Xem Trang công khai" icon={{ ios: 'arrow.up.right', android: 'open_in_new', web: 'open_in_new' }} onPress={() => router.push({ pathname: '/restaurants/[id]', params: { id: page.pageUserId! } })} />
              )}
            </WorkspaceIdentity>
            <RestaurantTabs selected={tab} onChange={setTab} items={[
              { value: 'overview', label: 'Tổng quan' },
              { value: 'menu', label: 'Thực đơn' },
              { value: 'members', label: 'Đội ngũ', count: page.members.length },
            ]} />
            <View style={[styles.panel, tab !== 'overview' && styles.hidden]}>
            <Card>
              {page.status === 'PENDING' && (
                <>
                <RestaurantSectionHeading title="Hồ sơ đang được xét duyệt" sticker="avocado" />
                <Copy>
                  Đã gửi {page.proofCount} ảnh minh chứng. Nhà hàng sẽ xuất hiện
                  công khai sau khi quản trị viên duyệt.
                </Copy>
                </>
              )}
              {page.status === 'REJECTED' && (
                <>
                  <RestaurantSectionHeading title="Cần cập nhật hồ sơ" description="Xem phản hồi để hoàn thiện đơn đăng ký của quán." sticker="carrot" />
                  <Copy>
                    {page.rejectReason
                      ? REJECT_REASON_LABELS[page.rejectReason]
                      : 'Đơn chưa được duyệt.'}{' '}
                    {page.reviewNote}
                  </Copy>
                  {page.role === 'OWNER' && !actor && (
                    <Action
                      primary
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
                  <RestaurantSectionHeading title={userId === page.pageUserId ? 'Bạn đang dùng Trang nhà hàng' : 'Sẵn sàng đón khách'} description="Quản lý hình ảnh, chia sẻ câu chuyện và kết nối với khách dưới tên quán." sticker="tomato" />
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
                  {userId === page.pageUserId && (
                    <Action
                      label="Sửa tên, giới thiệu và ảnh Trang"
                      icon={{ ios: 'square.and.pencil', android: 'edit', web: 'edit' }}
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
            <DetailsForm key={`${id}:${page.status}`} page={page} active={tab === 'overview'} />
            </View>
            <View style={[styles.panel, tab !== 'menu' && styles.hidden]}>
            <MenuManager id={id} approved={page.status === 'APPROVED'} />
            </View>
            <View style={[styles.panel, tab !== 'members' && styles.hidden]}>
            <Members page={page} />
            </View>
          </>
        )}
      </Body>
    </RestaurantShell>
  );
}
function DetailsForm({ page, active }: { page: WorkspaceDetail; active: boolean }) {
  const theme = useTheme();
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
      <RestaurantSectionHeading title="Địa chỉ & liên hệ" description="Giúp khách dễ tìm đường và kết nối với quán." />
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
        mapVisible={active}
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
        placeholder="Số điện thoại của quán"
      />
      <Field
        label="Website"
        value={v.website}
        onChangeText={(website) => patch({ website })}
        maxLength={300}
        editable={!save.isPending}
        autoCapitalize="none"
        keyboardType="url"
        placeholder="https://ten-quan.vn"
      />
      <Action
        primary
        label={save.isPending ? 'Đang lưu…' : 'Lưu liên hệ'}
        disabled={save.isPending}
        onPress={() => save.mutate(v, { onSuccess: () => setSaved(true) })}
      />
      {saved && <Text accessibilityLiveRegion="polite" style={[styles.saved, { color: theme.primary }]}>Đã lưu thông tin nhà hàng.</Text>}
      <Notice error={save.error} />
    </Card>
  );
}
function Members({ page }: { page: WorkspaceDetail }) {
  const theme = useTheme();
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
    <View style={styles.panel}>
      <RestaurantSectionHeading title="Đội ngũ của quán" description="Cùng nhau chăm sóc Trang và cập nhật thực đơn mỗi ngày." sticker="avocado" />
      <Card>
      {page.members.map((member) => (
        <View key={member.userId} style={[styles.member, { borderColor: theme.border }]}>
          <View style={styles.memberIdentity}>
            <View style={[styles.memberAvatar, { backgroundColor: theme.secondary }]}>
              {member.avatarUrl ? <Image source={member.avatarUrl} contentFit="cover" style={StyleSheet.absoluteFill} accessibilityLabel={`Ảnh ${member.fullName}`} /> : <SymbolView name={{ ios: 'person.fill', android: 'person', web: 'person' }} size={24} tintColor={theme.primary} />}
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[styles.memberName, { color: theme.foreground }]}>{member.fullName}</Text>
              <Text style={[styles.memberMeta, { color: theme.mutedForeground }]}>@{member.username}</Text>
              <Text style={[styles.memberRole, { color: theme.primary }]}>{member.role === 'OWNER' ? 'Chủ Trang' : 'Quản lý'}</Text>
            </View>
          </View>
          {canRemoveWorkspaceMember(page, member, userId, actor?.id) && (
            <Action
              label={member.userId === personId ? 'Rời Trang' : 'Xóa quản lý'}
              danger
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
        </View>
      ))}
      <Copy>Chủ Trang có quyền thêm và xóa quản lý. Quản lý có thể rời Trang từ tài khoản cá nhân.</Copy>
      </Card>
      {page.role === 'OWNER' && page.status === 'APPROVED' && (
        <Card>
          <Heading>Mời thêm quản lý</Heading>
          <Copy>Nhập tên đăng nhập Vedora của người bạn muốn cùng quản lý quán.</Copy>
          <Field
            label="Tên đăng nhập người quản lý mới"
            value={username}
            onChangeText={setUsername}
            editable={!busy}
            autoCapitalize="none"
            placeholder="ten_dang_nhap"
            autoCorrect={false}
          />
          <Action
            label="Thêm quản lý"
            primary
            icon={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }}
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

const styles = StyleSheet.create({
  panel: { gap: 20 },
  hidden: { display: 'none' },
  member: { gap: 12, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  memberIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberAvatar: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  memberName: { fontFamily: Fonts.sansBold, fontSize: 16 },
  memberMeta: { fontFamily: Fonts.sans, fontSize: 13 },
  memberRole: { fontFamily: Fonts.sansSemibold, fontSize: 12 },
  saved: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
});
