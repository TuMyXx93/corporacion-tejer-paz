'use client';

import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';
import { ac, adminRole, superadminRole } from './permissions';

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac,
      roles: {
        superadmin: superadminRole,
        admin: adminRole,
      },
    } as Parameters<typeof adminClient>[0]),
  ],
});

export const { signIn, signOut, useSession } = authClient;
