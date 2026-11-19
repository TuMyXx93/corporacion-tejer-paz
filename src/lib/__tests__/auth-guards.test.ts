import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockHeaders,
  mockIsDatabaseConfigured,
  mockGetDb,
  mockGetSession,
  mockInsertValues,
} = vi.hoisted(() => ({
  mockHeaders: vi.fn(async () => new Headers()),
  mockIsDatabaseConfigured: vi.fn(() => true),
  mockGetDb: vi.fn(),
  mockGetSession: vi.fn(),
  mockInsertValues: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: mockHeaders,
}));

vi.mock('@/db', () => ({
  isDatabaseConfigured: mockIsDatabaseConfigured,
  getDb: mockGetDb,
}));

vi.mock('@/db/schema', () => ({
  auditLogs: { name: 'audit_logs' },
}));

vi.mock('@/lib/auth', () => ({
  getAuth: () => ({
    api: {
      getSession: mockGetSession,
    },
  }),
}));

import { getServerActor, recordAuditLog, requireApiPermission } from '@/lib/auth/guards';

describe('Server Auth & RBAC Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDatabaseConfigured.mockReturnValue(true);
  });

  it('returns null from getServerActor when DB is unconfigured, session missing, invalid role, or error', async () => {
    mockIsDatabaseConfigured.mockReturnValueOnce(false);
    expect(await getServerActor()).toBeNull();

    mockGetSession.mockResolvedValueOnce(null);
    expect(await getServerActor()).toBeNull();

    mockGetSession.mockResolvedValueOnce({
      user: { id: 'u1', name: 'Guest', email: 'g@test.org', role: 'viewer' },
    });
    expect(await getServerActor()).toBeNull();

    mockGetSession.mockResolvedValueOnce({
      user: {
        id: 'u-banned',
        name: 'Suspended',
        email: 's@test.org',
        role: 'admin',
        banned: true,
      },
    });
    expect(await getServerActor()).toBeNull();

    mockGetSession.mockRejectedValueOnce(new Error('session failure'));
    expect(await getServerActor()).toBeNull();
  });

  it('returns typed AuthenticatedActor when valid session exists', async () => {
    mockGetSession.mockResolvedValueOnce({
      user: {
        id: 'u-super',
        name: 'Super Admin',
        email: 'super@tejerpaz.org',
        role: 'superadmin',
      },
    });

    const actor = await getServerActor();
    expect(actor).toEqual({
      id: 'u-super',
      name: 'Super Admin',
      email: 'super@tejerpaz.org',
      role: 'superadmin',
    });
  });

  it('returns 503 when DB is unconfigured and 401 when unauthenticated', async () => {
    mockIsDatabaseConfigured.mockReturnValueOnce(false);
    const dbMissing = await requireApiPermission('project', 'read');
    expect(dbMissing.ok).toBe(false);
    if (!dbMissing.ok) {
      expect(dbMissing.response.status).toBe(503);
    }

    mockGetSession.mockResolvedValueOnce(null);
    const unauth = await requireApiPermission('project', 'read');
    expect(unauth.ok).toBe(false);
    if (!unauth.ok) {
      expect(unauth.response.status).toBe(401);
    }
  });

  it('enforces 403 for admin on restricted superadmin resources and allows permitted mutations', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'u-adm', name: 'Editor', email: 'adm@tejerpaz.org', role: 'admin' },
    });

    const deniedSettings = await requireApiPermission('settings', 'update');
    expect(deniedSettings.ok).toBe(false);
    if (!deniedSettings.ok) {
      expect(deniedSettings.response.status).toBe(403);
    }

    const deniedUsers = await requireApiPermission('user', 'list');
    expect(deniedUsers.ok).toBe(false);
    if (!deniedUsers.ok) {
      expect(deniedUsers.response.status).toBe(403);
    }

    const allowedProject = await requireApiPermission('project', 'update');
    expect(allowedProject.ok).toBe(true);
    if (allowedProject.ok) {
      expect(allowedProject.actor.role).toBe('admin');
    }
  });

  it('allows superadmin on user management and safely handles audit logging', async () => {
    mockGetSession.mockResolvedValueOnce({
      user: {
        id: 'u-sup',
        name: 'Root',
        email: 'root@tejerpaz.org',
        role: 'superadmin',
      },
    });
    const allowedUserCreate = await requireApiPermission('user', 'create');
    expect(allowedUserCreate.ok).toBe(true);

    // No-op when DB is null
    mockGetDb.mockReturnValueOnce(null);
    await expect(
      recordAuditLog({
        actor: {
          id: 'u-sup',
          name: 'Root',
          email: 'root@tejerpaz.org',
          role: 'superadmin',
        },
        action: 'user.create',
        resourceType: 'user',
        resourceId: 'u-new',
        summary: 'Test no-op',
      })
    ).resolves.toBeUndefined();

    // Inserts when DB is present
    mockInsertValues.mockResolvedValueOnce(undefined);
    mockGetDb.mockReturnValueOnce({
      insert: () => ({ values: mockInsertValues }),
    });
    await recordAuditLog({
      actor: {
        id: 'u-sup',
        name: 'Root',
        email: 'root@tejerpaz.org',
        role: 'superadmin',
      },
      action: 'settings.update',
      resourceType: 'site_settings',
      resourceId: 'default',
      summary: 'Updated settings',
    });
    expect(mockInsertValues).toHaveBeenCalledTimes(1);

    // Catches DB errors without crashing request
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockInsertValues.mockRejectedValueOnce(new Error('db write error'));
    mockGetDb.mockReturnValueOnce({
      insert: () => ({ values: mockInsertValues }),
    });
    await expect(
      recordAuditLog({
        actor: {
          id: 'u-sup',
          name: 'Root',
          email: 'root@tejerpaz.org',
          role: 'superadmin',
        },
        action: 'settings.update',
        resourceType: 'site_settings',
        resourceId: 'default',
        summary: 'Should not throw',
      })
    ).resolves.toBeUndefined();
    errSpy.mockRestore();
  });
});
