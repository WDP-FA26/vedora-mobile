import { useState } from 'react';
import { VN_WARDS } from '../data/vn-wards';
import { saveApplication } from '../services/restaurant.service';
import {
  workspaceFormSchema,
  type WorkspaceDetail,
  type WorkspaceFormInput,
  type LngLat,
} from '../types/restaurant.schema';
import { PROOF_KIND_VIEWS, type ProofKind } from '../utils/onboarding';
import { useRestaurantImage, useRestaurantMutation } from './use-restaurants';

export type WorkspaceApplicationDraft = Omit<
  WorkspaceFormInput,
  'provinceCode' | 'location'
> & { provinceCode: string; location: LngLat | null };

export function useWorkspaceApplication(workspace?: WorkspaceDetail) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<unknown>(null);
  const [values, setValues] = useState<WorkspaceApplicationDraft>(() => ({
    name: workspace?.name ?? '',
    username: workspace?.username ?? '',
    bio: workspace?.bio ?? '',
    address: workspace?.address ?? '',
    location: workspace
      ? { longitude: workspace.longitude, latitude: workspace.latitude }
      : null,
    provinceCode: workspace?.provinceCode ?? '',
    wardCode: workspace?.wardCode ?? '',
    businessForm: workspace?.businessForm ?? 'RESTAURANT',
    vegetarianLevel: workspace?.vegetarianLevel ?? 'VEGAN',
    phone: workspace?.phone ?? '',
    website: workspace?.website ?? '',
    otherPlatformUrls:
      workspace?.otherPlatformUrls.map((url) => ({ url })) ?? [],
    legal: {
      entityType: workspace?.legal?.entityType ?? 'INDIVIDUAL',
      taxCode: workspace?.legal?.taxCode ?? '',
      legalName: workspace?.legal?.legalName ?? '',
      legalAddress: workspace?.legal?.legalAddress ?? '',
      representativeName: workspace?.legal?.representativeName ?? '',
      contactEmail: workspace?.legal?.contactEmail ?? '',
    },
    statement: workspace?.statement ?? '',
    proofs: [],
    confirmsAccuracy: false,
    consentsToReview: false,
  }));
  const save = useRestaurantMutation((input: WorkspaceApplicationDraft) =>
    saveApplication(input, workspace?.id)
  );
  const upload = useRestaurantImage();
  const patch = (input: Partial<WorkspaceApplicationDraft>) =>
    setValues((previous) => ({ ...previous, ...input }));
  function next() {
    setError(null);
    const result = workspaceFormSchema.safeParse(values);
    const fields =
      step === 1
        ? [
            'name',
            'username',
            'bio',
            'address',
            'location',
            'provinceCode',
            'wardCode',
            'businessForm',
            'vegetarianLevel',
            'phone',
            'website',
            'otherPlatformUrls',
          ]
        : ['legal'];
    const issue = result.success
      ? undefined
      : result.error.issues.find((issue) =>
          fields.includes(String(issue.path[0]))
        );
    if (issue) {
      setError(new Error(issue.message));
      return;
    }
    if (
      step === 1 &&
      !VN_WARDS[values.provinceCode as keyof typeof VN_WARDS]?.some(
        ([id]) => id === values.wardCode
      )
    ) {
      setError(new Error('Chọn phường/xã thuộc tỉnh đã chọn.'));
      return;
    }
    setStep(step + 1);
  }
  async function addProof(kind: ProofKind) {
    setError(null);
    if (
      values.proofs.length >= 10 ||
      values.proofs.filter((proof) => proof.kind === kind).length >=
        PROOF_KIND_VIEWS[kind].max
    ) {
      setError(new Error('Đã đủ số ảnh loại này. Xóa ảnh cũ để thay thế.'));
      return;
    }
    try {
      const image = await upload.mutateAsync(kind);
      if (image)
        setValues((previous) => ({
          ...previous,
          proofs: [...previous.proofs, { kind, id: image.id, uri: image.uri }],
        }));
    } catch (error) {
      setError(error);
    }
  }
  return {
    values,
    patch,
    step,
    setStep,
    next,
    error,
    setError,
    save,
    upload,
    addProof,
  };
}
