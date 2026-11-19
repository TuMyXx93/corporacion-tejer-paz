import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { requireDb } from '@/db';
import { user } from '@/db/schema';
import { getAuth } from '@/lib/auth';
import { recordAuditLog, requireApiPermission } from '@/lib/auth/guards';
import { createAdminUserSchema, updateAdminUserSchema } from '@/lib/cms/schemas';

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

  await db
    .update(user)
    .set({ role: parsed.data.role, emailVerified: true })
    .where(eq(user.id, created.user.id));

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
      user: {
        id: created.user.id,
        name: parsed.data.name,
        email: normalizedEmail,
        role: parsed.data.role,
      },
    },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
  const guard = await requireApiPermission('user', 'set-role');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = updateAdminUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Actualización de usuario inválida.', details: parsed.error.issues },
      { status: 400 }
    );
  }

  if (parsed.data.userId === guard.actor.id) {
    return NextResponse.json(
      { error: 'No puedes modificar tu propio rol ni desactivar tu propia cuenta.' },
      { status: 400 }
    );
  }

  const db = requireDb();
  const updates: Partial<typeof user.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (parsed.data.role !== undefined) updates.role = parsed.data.role;
  if (parsed.data.banned !== undefined) updates.banned = parsed.data.banned;
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
    });

  if (!updated) {
    return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
  }

  await recordAuditLog({
    actor: guard.actor,
    action: 'user.update',
    resourceType: 'user',
    resourceId: updated.id,
    summary: `Usuario actualizado (${updated.role}, banned=${String(updated.banned)})`,
  });

  return NextResponse.json({ ok: true, user: updated });
}
