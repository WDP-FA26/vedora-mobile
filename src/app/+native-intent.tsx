import { googleNativeIntent } from '@/features/auth/services/google-auth.service';

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return googleNativeIntent(path);
}
