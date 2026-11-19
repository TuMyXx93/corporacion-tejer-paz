import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { and, desc, eq, isNull, or } from 'drizzle-orm';
import { requireDb } from '@/db';
import { session, user } from '@/db/schema';
import { getAuth } from '@/lib/auth';
import { recordAuditLog, requireApiPermission } from '@/lib/auth/guards';
import { createAdminUserSchema, updateAdminUserSchema } from '@/lib/cms/schemas';

async function countActiveSuperadmins() {
  const db = requireDb();
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(
      and(eq(user.role, 'superadmin'), or(eq(user.banned, false), isNull(user.banned)))
    );
  return rows.length;
}

export async function GET() {
  const guard = await requireApiPermission('user', 'list');
  if (!guard.ok) return guard.response;

  const db = requireDb();
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  return NextResponse.json({ users: rows });
}

export async function POST(request: Request) {
  const guard = await requireApiPermission('user', 'create');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = createAdminUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos de usuario inválidos.', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const db = requireDb();
  const normalizedEmail = parsed.data.email.toLowerCase();
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: 'Ya existe una cuenta registrada con ese correo.' },
      { status: 409 }
    );
  }

  const auth = getAuth();
  const created = await auth.api.signUpEmail({
    body: {
      name: parsed.data.name,
      email: normalizedEmail,
      password: parsed.data.password,
    },
  });

  if (!created?.user?.id) {
    return NextResponse.json({ error: 'No se pudo crear el usuario.' }, { status: 500 });
  }

  const [saved] = await db
    .update(user)
    .set({ role: parsed.data.role, emailVerified: true })
    .where(eq(user.id, created.user.id))
    .returning({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      createdAt: user.createdAt,
    });

  await recordAuditLog({
    actor: guard.actor,
    action: 'user.create',
    resourceType: 'user',
    resourceId: created.user.id,
    summary: `Usuario creado (${parsed.data.role}): ${normalizedEmail}`,
  });

  return NextResponse.json(
    {
      ok: true,
      user: saved,
    },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = updateAdminUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Actualización de usuario inválida.', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const requiredAction = parsed.data.newPassword
    ? 'set-password'
    : parsed.data.banned !== undefined
      ? 'ban'
      : 'set-role';

  const guard = await requireApiPermission('user', requiredAction);
  if (!guard.ok) return guard.response;

  const isSelf = parsed.data.userId === guard.actor.id;
  if (isSelf && (parsed.data.role !== undefined || parsed.data.banned !== undefined)) {
    return NextResponse.json(
      { error: 'No puedes modificar tu propio rol ni desactivar tu propia cuenta.' },
      { status: 400 }
    );
  }

  const db = requireDb();
  const [targetUser] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
    })
    .from(user)
    .where(eq(user.id, parsed.data.userId))
    .limit(1);

  if (!targetUser) {
    return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
  }

  const targetIsActiveSuperadmin = targetUser.role === 'superadmin' && !targetUser.banned;
  const wouldRemoveSuperadminPrivilege =
    parsed.data.role === 'admin' || parsed.data.banned === true;

  if (targetIsActiveSuperadmin && wouldRemoveSuperadminPrivilege) {
    const activeCount = await countActiveSuperadmins();
    if (activeCount <= 1) {
      return NextResponse.json(
        { error: 'No puedes degradar ni suspender al último superadministrador activo.' },
        { status: 400 }
      );
    }
  }

  const updates: Partial<typeof user.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.role !== undefined) updates.role = parsed.data.role;
  if (parsed.data.banned !== undefined) {
    updates.banned = parsed.data.banned;
    if (!parsed.data.banned) {
      updates.banReason = null;
    }
  }
  if (parsed.data.banReason !== undefined) updates.banReason = parsed.data.banReason;

  const [updated] = await db
    .update(user)
    .set(updates)
    .where(eq(user.id, parsed.data.userId))
    .returning({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      createdAt: user.createdAt,
    });

  if (parsed.data.banned === true) {
    await db.delete(session).where(eq(session.userId, parsed.data.userId));
  }

  if (parsed.data.newPassword) {
    const auth = getAuth();
    await auth.api.setUserPassword({
      body: {
        userId: parsed.data.userId,
        newPassword: parsed.data.newPassword,
      },
      headers: await headers(),
    });
  }

  const changeParts: string[] = [];
  if (parsed.data.name !== undefined) changeParts.push(`nombre="${updated.name}"`);
  if (parsed.data.role !== undefined) changeParts.push(`rol=${updated.role}`);
  if (parsed.data.banned !== undefined) {
    changeParts.push(parsed.data.banned ? 'suspendido' : 'reactivado');
  }
  if (parsed.data.newPassword) changeParts.push('contraseña restablecida');

  await recordAuditLog({
    actor: guard.actor,
    action: parsed.data.newPassword ? 'user.set_password' : 'user.update',
    resourceType: 'user',
    resourceId: updated.id,
    summary: `Usuario ${updated.email} actualizado (${changeParts.join(', ') || 'sin cambios'})`,
  });

  return NextResponse.json({ ok: true, user: updated });
}

export async function DELETE(request: Request) {
  const guard = await requireApiPermission('user', 'delete');
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const targetId = searchParams.get('id')?.trim() ?? '';
  if (!targetId) {
    return NextResponse.json({ error: 'ID de usuario inválido.' }, { status: 400 });
  }

  if (targetId === guard.actor.id) {
    return NextResponse.json(
      { error: 'No puedes eliminar tu propia cuenta activa.' },
      { status: 400 }
    );
  }

  const db = requireDb();
  const [targetUser] = await db
    .select({
      id: user.id,
      email: user.email,
      role: user.role,
      banned: user.banned,
    })
    .from(user)
    .where(eq(user.id, targetId))
    .limit(1);

  if (!targetUser) {
    return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
  }

  if (targetUser.role === 'superadmin' && !targetUser.banned) {
    const activeCount = await countActiveSuperadmins();
    if (activeCount <= 1) {
      return NextResponse.json(
        { error: 'No puedes eliminar al último superadministrador activo.' },
        { status: 400 }
      );
    }
  }

  await db.delete(session).where(eq(session.userId, targetId));
  await db.delete(user).where(eq(user.id, targetId));

  await recordAuditLog({
    actor: guard.actor,
    action: 'user.delete',
    resourceType: 'user',
    resourceId: targetId,
    summary: `Cuenta eliminada: ${targetUser.email} (${targetUser.role})`,
  });

  return NextResponse.json({ ok: true });
}
