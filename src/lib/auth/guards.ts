import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { getDb, isDatabaseConfigured } from '@/db';
import { auditLogs } from '@/db/schema';
import { getAuth } from './index';
import {
  isAppRole,
  roleHasPermission,
  type AppResource,
  type AppRole,
} from './permissions';

export interface AuthenticatedActor {
  id: string;
  name: string;
  email: string;
  role: AppRole;
}

export async function getServerActor(): Promise<AuthenticatedActor | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return null;
    const role = session.user.role;
    if (!isAppRole(role)) return null;
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role,
    };
  } catch {
    return null;
  }
}

export type GuardResult =
  { ok: true; actor: AuthenticatedActor } | { ok: false; response: NextResponse };

export async function requireApiPermission(
  resource: AppResource,
  action: string
): Promise<GuardResult> {
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Base de datos no configurada en este entorno.' },
        { status: 503 }
      ),
    };
  }

  const actor = await getServerActor();
  if (!actor) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Autenticación requerida.' }, { status: 401 }),
    };
  }

  if (!roleHasPermission(actor.role, resource, action)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Permisos insuficientes. Esta operación requiere un rol autorizado.',
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true, actor };
}

export async function recordAuditLog(params: {
  actor: AuthenticatedActor;
  action: string;
  resourceType: string;
  resourceId: string;
  summary: string;
}): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db.insert(auditLogs).values({
      actorUserId: params.actor.id,
      actorRole: params.actor.role,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      summary: params.summary,
    });
  } catch (err) {
    console.error('[audit_log_error]', err);
  }
}
