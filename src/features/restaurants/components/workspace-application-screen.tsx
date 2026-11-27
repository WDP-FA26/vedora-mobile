import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSessionStore } from '@/shared/stores/session-store';
import { useTheme } from '@/hooks/use-theme';
import { Fonts } from '@/constants/theme';
import { VN_WARDS } from '../data/vn-wards';
import { useWorkspace } from '../hooks/use-restaurants';
import { useWorkspaceApplication } from '../hooks/use-workspace-application';
import type {
  WorkspaceDetail,
  WorkspaceFormInput,
} from '../types/restaurant.schema';
import {
  BUSINESS_FORM_LABELS,
  BUSINESS_FORMS,
  LEGAL_ENTITY_TYPES,
  LEGAL_ENTITY_VIEWS,
  PROOF_KINDS,
  PROOF_KIND_VIEWS,
  VEGETARIAN_LEVEL_LABELS,
  VEGETARIAN_LEVELS,
  VN_PROVINCES,
  VN_PROVINCES_BY_NAME,
  requiredProofKinds,
} from '../utils/onboarding';
import { ChoiceField } from './choice-field';
import { LocationField } from './location-field';
import { ApplicationConsent, ApplicationField as Field, ApplicationIntro, ApplicationProgress, ApplicationSection, ApplicationUpload } from './workspace-ui';
import {
  Action,
  Body,
  Busy,
  Copy,
  Notice,
  RestaurantShell,
  ui,
} from './restaurant-ui';

export function WorkspaceApplicationScreen() {
  const { resubmit } = useLocalSearchParams<{ resubmit?: string }>();
  const token = useSessionStore((state) => state.accessToken);
  const actor = useSessionStore((state) => state.actor);
  const userId = useSessionStore((state) => state.userId);
  const workspace = useWorkspace(resubmit ?? '');
  return (
    <RestaurantShell
      title={resubmit ? 'Sửa và gửi lại đơn' : 'Đăng ký nhà hàng'}
    >
      {!token || actor ? (
        <Body>
          <Copy>Vui lòng dùng tài khoản cá nhân để đăng ký.</Copy>
          <Action
            label="Về Trang của tôi"
            onPress={() => router.replace('/pages')}
          />
        </Body>
      ) : resubmit && workspace.isPending ? (
        <Busy />
      ) : resubmit &&
        (workspace.error ||
          workspace.data?.role !== 'OWNER' ||
          workspace.data?.status !== 'REJECTED') ? (
        <Body>
          <Copy>Chỉ chủ Trang bị từ chối có thể gửi lại đơn.</Copy>
          <Notice error={workspace.error} />
        </Body>
      ) : (
        <ApplicationForm
          key={`${userId}:${resubmit ?? 'new'}`}
          workspace={workspace.data}
        />
      )}
    </RestaurantShell>
  );
}
function ApplicationForm({ workspace }: { workspace?: WorkspaceDetail }) {
  const theme = useTheme();
  const form = useWorkspaceApplication(workspace);
  const { values: v, patch, step } = form;
  const [platformText, setPlatformText] = useState(
    v.otherPlatformUrls.map(({ url }) => url).join('\n')
  );
  const busy = form.save.isPending || form.upload.isPending;
  const text = (
    key:
      | 'name'
      | 'username'
      | 'bio'
      | 'address'
      | 'phone'
      | 'website'
      | 'statement',
    label: string,
    multiline = false,
    maxLength?: number
  ) => (
    <Field
      label={label}
      required={key === 'name' || key === 'username' || key === 'address' || key === 'phone'}
      hint={key === 'bio' ? `${v.bio.length}/500 ký tự · Bạn có món đặc trưng nào muốn giới thiệu?` : undefined}
      value={v[key]}
      onChangeText={(value) => patch({ [key]: value })}
      editable={!busy}
      multiline={multiline}
      maxLength={maxLength}
      autoCapitalize={
        key === 'username' || key === 'website' ? 'none' : 'sentences'
      }
      autoCorrect={key !== 'username' && key !== 'website'}
      keyboardType={key === 'phone' ? 'phone-pad' : key === 'website' ? 'url' : 'default'}
      placeholder={key === 'name' ? 'Ví dụ: Bếp Chay An Nhiên' : key === 'username' ? 'bepchayannhien' : key === 'website' ? 'https://ten-quan.vn' : undefined}
    />
  );
  const legalText = (
    key: keyof Omit<WorkspaceFormInput['legal'], 'entityType'>,
    label: string,
    maxLength = 300
  ) => (
    <Field
      label={label}
      required
      value={v.legal[key]}
      editable={!busy}
      onChangeText={(value) => patch({ legal: { ...v.legal, [key]: value } })}
      maxLength={maxLength}
      autoCapitalize={key === 'contactEmail' ? 'none' : 'sentences'}
      keyboardType={key === 'contactEmail' ? 'email-address' : key === 'taxCode' && v.legal.entityType === 'INDIVIDUAL' ? 'number-pad' : 'default'}
    />
  );
  return (
    <View style={styles.screen}>
    <ScrollView key={step} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formBody}>
      <ApplicationProgress step={step} />
      <ApplicationIntro step={step} />
      <Copy>Các mục có dấu * là thông tin bắt buộc.</Copy>
      {workspace && (
        <Copy>
          {workspace.reviewNote} Khi gửi lại, hãy tải lại đầy đủ ảnh minh chứng.
        </Copy>
      )}
      {step === 1 && (
        <>
          <ApplicationSection title="Thông tin hiển thị" description="Tên và lời giới thiệu sẽ hiển thị trên Trang nhà hàng.">
          {text('name', 'Tên nhà hàng', false, 100)}
          {text('username', 'Tên đăng nhập Trang', false, 30)}
          <Copy>Dùng chữ không dấu, số hoặc dấu gạch dưới để mọi người dễ tìm thấy Trang.</Copy>
          {text('bio', 'Giới thiệu', true, 500)}
          </ApplicationSection>
          <ApplicationSection title="Địa chỉ và vị trí" description="Điền địa chỉ và đặt ghim chính xác trên bản đồ.">
          <ChoiceField
            label="Tỉnh/Thành phố"
            value={v.provinceCode}
            options={VN_PROVINCES_BY_NAME.map((code) => [
              code,
              VN_PROVINCES[code],
            ])}
            onChange={(code) => patch({ provinceCode: code, wardCode: '' })}
            disabled={busy}
          />
          <ChoiceField
            label="Phường/Xã"
            value={v.wardCode}
            options={VN_WARDS[v.provinceCode as keyof typeof VN_WARDS] ?? []}
            onChange={(wardCode) => patch({ wardCode })}
            disabled={busy || !v.provinceCode}
          />
          {text('address', 'Địa chỉ đầy đủ', false, 300)}
          <LocationField
            address={v.address}
            onAddressChange={(address) => patch({ address })}
            value={v.location ?? null}
            onChange={(location) => patch({ location })}
            disabled={busy}
          />
          </ApplicationSection>
          <ApplicationSection title="Ẩm thực và liên hệ" description="Thêm cách liên hệ để thực khách dễ kết nối với quán.">
          <ChoiceField
            label="Hình thức kinh doanh"
            value={v.businessForm}
            options={BUSINESS_FORMS.map((value) => [
              value,
              BUSINESS_FORM_LABELS[value],
            ])}
            onChange={(value) =>
              patch({
                businessForm: value as WorkspaceFormInput['businessForm'],
              })
            }
            disabled={busy}
          />
          <ChoiceField
            label="Loại ẩm thực"
            value={v.vegetarianLevel}
            options={VEGETARIAN_LEVELS.map((value) => [
              value,
              VEGETARIAN_LEVEL_LABELS[value],
            ])}
            onChange={(value) =>
              patch({
                vegetarianLevel: value as WorkspaceFormInput['vegetarianLevel'],
              })
            }
            disabled={busy}
          />
          {text('phone', 'Số điện thoại để xác minh', false, 30)}
          {text('website', 'Website (không bắt buộc)', false, 300)}
          <Field
            label="Link các nền tảng khác (mỗi dòng một link, tối đa 5)"
            multiline
            autoCapitalize="none"
            keyboardType="url"
            placeholder="https://facebook.com/ten-quan"
            editable={!busy}
            value={platformText}
            onChangeText={(text) => {
              setPlatformText(text);
              patch({
                otherPlatformUrls: text
                  .split('\n')
                  .filter((url) => url.trim())
                  .map((url) => ({ url })),
              });
            }}
          />
          </ApplicationSection>
        </>
      )}
      {step === 2 && (
        <ApplicationSection title="Thông tin pháp lý" description="Điền thông tin trùng khớp với giấy tờ bạn sẽ tải lên ở bước tiếp theo.">
          <ChoiceField
            label="Loại hình pháp lý"
            value={v.legal.entityType}
            options={LEGAL_ENTITY_TYPES.map((value) => [
              value,
              LEGAL_ENTITY_VIEWS[value].label,
            ])}
            onChange={(value) =>
              patch({
                legal: {
                  ...v.legal,
                  entityType:
                    value as WorkspaceFormInput['legal']['entityType'],
                },
              })
            }
            disabled={busy}
          />
          <Copy>
            {LEGAL_ENTITY_VIEWS[v.legal.entityType].description}{' '}
            {LEGAL_ENTITY_VIEWS[v.legal.entityType].taxCodeHint}
          </Copy>
          {legalText(
            'taxCode',
            v.legal.entityType === 'INDIVIDUAL' ? 'Số CCCD' : 'Mã số thuế',
            20
          )}
          {v.legal.entityType !== 'INDIVIDUAL' &&
            legalText(
              'legalName',
              LEGAL_ENTITY_VIEWS[v.legal.entityType].legalNameLabel!,
              200
            )}
          {legalText(
            'legalAddress',
            LEGAL_ENTITY_VIEWS[v.legal.entityType].legalAddressLabel
          )}
          {legalText(
            'representativeName',
            LEGAL_ENTITY_VIEWS[v.legal.entityType].representativeLabel,
            100
          )}
          {legalText('contactEmail', 'Email liên hệ')}
        </ApplicationSection>
      )}
      {step === 3 && (
        <>
          <Copy>
            Ảnh JPG, PNG hoặc WebP, tối đa 10 MB/ảnh và 10 ảnh/đơn. Giấy tờ chỉ
            dùng để xét duyệt.
          </Copy>
          {PROOF_KINDS.map((kind) => (
            <ApplicationSection key={kind} title={`${PROOF_KIND_VIEWS[kind].label} · ${requiredProofKinds(v.legal.entityType).includes(kind) ? 'Bắt buộc' : 'Tùy chọn'}`} description={PROOF_KIND_VIEWS[kind].hint}>
              <Copy>{v.proofs.filter((proof) => proof.kind === kind).length}/{PROOF_KIND_VIEWS[kind].max} ảnh đã thêm</Copy>
              {v.proofs
                .filter((proof) => proof.kind === kind)
                .map((proof) => (
                  <View key={proof.id} style={{ gap: 8 }}>
                    <Image
                      source={proof.uri}
                      style={ui.photo}
                      contentFit="contain"
                    />
                    <Action
                      label="Xóa ảnh"
                      disabled={busy}
                      onPress={() =>
                        patch({
                          proofs: v.proofs.filter((p) => p.id !== proof.id),
                        })
                      }
                    />
                  </View>
                ))}
              <ApplicationUpload
                count={v.proofs.filter((p) => p.kind === kind).length}
                max={PROOF_KIND_VIEWS[kind].max}
                disabled={
                  busy ||
                  v.proofs.filter((p) => p.kind === kind).length >=
                    PROOF_KIND_VIEWS[kind].max ||
                  v.proofs.length >= 10
                }
                onPress={() => void form.addProof(kind)}
              />
            </ApplicationSection>
          ))}
          {text(
            'statement',
            'Ghi chú cho người xét duyệt (không bắt buộc)',
            true,
            2000
          )}
          <ApplicationConsent
            label="Tôi xác nhận thông tin là chính xác"
            checked={v.confirmsAccuracy}
            disabled={busy}
            onPress={() => patch({ confirmsAccuracy: !v.confirmsAccuracy })}
          />
          <ApplicationConsent
            label="Tôi đồng ý để Vedora dùng giấy tờ cho việc xét duyệt"
            checked={v.consentsToReview}
            disabled={busy}
            onPress={() => patch({ consentsToReview: !v.consentsToReview })}
          />
        </>
      )}
      {form.upload.isPending && <Busy />}
    </ScrollView>
      <View style={[styles.footer, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <View style={styles.footerInner}>
        <Notice error={form.error ?? form.save.error} />
        <Text style={[styles.footerHint, { color: theme.mutedForeground }]}>{step < 3 ? `Tiếp theo: ${step === 1 ? 'Thông tin pháp lý' : 'Hồ sơ xác minh'}` : 'Hồ sơ sẽ được xét duyệt trước khi hiển thị công khai.'}</Text>
        <View style={styles.footerActions}>
        {step > 1 && (
          <View style={styles.backAction}>
          <Action
            label="Quay lại"
            disabled={busy}
            onPress={() => {
              form.setError(null);
              form.setStep(step - 1);
            }}
          />
          </View>
        )}
        <View style={styles.nextAction}>
        {step < 3 ? (
          <Action
            primary
            label="Tiếp tục →"
            disabled={busy}
            onPress={form.next}
          />
        ) : (
          <Action
            primary
            label={form.save.isPending ? 'Đang gửi…' : 'Gửi xét duyệt'}
            disabled={busy}
            onPress={() =>
              form.save.mutate(v, {
                onSuccess: (page) =>
                  router.replace({
                    pathname: '/pages/[id]',
                    params: { id: page.id },
                  }),
              })
            }
          />
        )}
        </View>
        </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  formBody: { padding: 16, paddingBottom: 28, gap: 22, width: '100%', maxWidth: 680, alignSelf: 'center' },
  footer: { paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth },
  footerInner: { width: '100%', maxWidth: 648, alignSelf: 'center', gap: 10 },
  footerActions: { flexDirection: 'row', gap: 12 },
  backAction: { flex: 1 },
  nextAction: { flex: 2 },
  footerHint: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
});
