import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';

export const APP_ROLES = ['superadmin', 'admin'] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const permissionStatements = {
  ...defaultStatements,
  section: ['read', 'update'],
  area: ['read', 'create', 'update', 'delete'],
  project: ['read', 'create', 'update', 'delete'],
  media: ['read', 'create', 'update', 'delete'],
  message: ['read', 'update', 'delete'],
  settings: ['read', 'update'],
  audit: ['read'],
} as const;

export const ac = createAccessControl(permissionStatements);

export const adminRole = ac.newRole({
  section: ['read', 'update'],
  area: ['read', 'create', 'update', 'delete'],
  project: ['read', 'create', 'update', 'delete'],
  media: ['read', 'create', 'update', 'delete'],
  message: ['read', 'update', 'delete'],
  settings: ['read'],
});

export const superadminRole = ac.newRole({
  ...adminAc.statements,
  section: ['read', 'update'],
  area: ['read', 'create', 'update', 'delete'],
  project: ['read', 'create', 'update', 'delete'],
  media: ['read', 'create', 'update', 'delete'],
  message: ['read', 'update', 'delete'],
  settings: ['read', 'update'],
  audit: ['read'],
});

export type AppResource =
  'section' | 'area' | 'project' | 'media' | 'message' | 'settings' | 'audit' | 'user';

const ROLE_MATRIX: Record<AppRole, Record<AppResource, readonly string[]>> = {
  superadmin: {
    section: ['read', 'update'],
    area: ['read', 'create', 'update', 'delete'],
    project: ['read', 'create', 'update', 'delete'],
    media: ['read', 'create', 'update', 'delete'],
    message: ['read', 'update', 'delete'],
    settings: ['read', 'update'],
    audit: ['read'],
    user: ['list', 'create', 'set-role', 'ban', 'set-password', 'delete'],
  },
  admin: {
    section: ['read', 'update'],
    area: ['read', 'create', 'update', 'delete'],
    project: ['read', 'create', 'update', 'delete'],
    media: ['read', 'create', 'update', 'delete'],
    message: ['read', 'update', 'delete'],
    settings: ['read'],
    audit: [],
    user: [],
  },
};

export function isAppRole(value: unknown): value is AppRole {
  return value === 'superadmin' || value === 'admin';
}

export function roleHasPermission(
  role: unknown,
  resource: AppResource,
  action: string
): boolean {
  if (!isAppRole(role)) return false;
  return ROLE_MATRIX[role][resource].includes(action);
}
