import 'client-only';

import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';

export const { signIn, signUp, signOut, useSession, forgetPassword, resetPassword, admin } = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
    sendResetPasswordEmail: true,
  },
  plugins: [adminClient()],
});
