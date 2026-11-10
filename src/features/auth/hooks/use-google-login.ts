import { useMutation } from '@tanstack/react-query';

import { signInWithGoogle } from '../services/google-auth.service';

export function useGoogleLogin() {
  return useMutation({ mutationKey: ['auth', 'google'], mutationFn: signInWithGoogle, retry: false });
}
