import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { admin as adminPlugin } from 'better-auth/plugins/admin';
import { requireDb } from '@/db';
import * as schema from '@/db/schema';
import { resolveAuthBaseUrl, resolveTrustedOrigins } from './origins';
import { ac, adminRole, superadminRole } from './permissions';

function createAuthInstance() {
  const db = requireDb();

  return betterAuth({
    appName: 'Corporación Tejer Paz',
    baseURL: resolveAuthBaseUrl(),
    trustedOrigins: resolveTrustedOrigins(),
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      autoSignIn: false,
    },
    plugins: [
      adminPlugin({
        ac,
        defaultRole: 'admin',
        adminRoles: ['superadmin'],
        roles: {
          superadmin: superadminRole,
          admin: adminRole,
        },
      }),
      nextCookies(),
    ],
  });
}

type AuthInstance = ReturnType<typeof createAuthInstance>;
let cachedAuth: AuthInstance | null = null;

export function getAuth(): AuthInstance {
  if (!cachedAuth) {
    cachedAuth = createAuthInstance();
  }
  return cachedAuth;
}
