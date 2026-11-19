import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { asc, eq } from 'drizzle-orm';
import { requireDb } from '@/db';
import { actionAreas } from '@/db/schema';
import { recordAuditLog, requireApiPermission } from '@/lib/auth/guards';
import { createActionAreaSchema, updateActionAreaSchema } from '@/lib/cms/schemas';
import { SITE_CONTENT_CACHE_TAG } from '@/lib/content/queries';

export async function GET() {
  const guard = await requireApiPermission('area', 'read');
  if (!guard.ok) return guard.response;

  const db = requireDb();
  const rows = await db
    .select()
    .from(actionAreas)
    .orderBy(asc(actionAreas.sortOrder), asc(actionAreas.id));

  return NextResponse.json({ actionAreas: rows });
}

export async function POST(request: Request) {
  const guard = await requireApiPermission('area', 'create');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = createActionAreaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos de área de acción inválidos.', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const db = requireDb();
  const existing = await db
    .select({ id: actionAreas.id })
    .from(actionAreas)
    .where(eq(actionAreas.slug, parsed.data.slug))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: 'Ya existe un área de acción con ese slug.' },
      { status: 409 }
    );
  }

  const [created] = await db.insert(actionAreas).values(parsed.data).returning();

  await recordAuditLog({
    actor: guard.actor,
    action: 'area.create',
    resourceType: 'action_areas',
    resourceId: String(created.id),
    summary: `Área de acción creada: ${created.title}`,
  });

  revalidateTag(SITE_CONTENT_CACHE_TAG, 'max');
  revalidatePath('/');

  return NextResponse.json({ ok: true, actionArea: created }, { status: 201 });
}

export async function PATCH(request: Request) {
  const guard = await requireApiPermission('area', 'update');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = updateActionAreaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos de área de acción inválidos.', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { id, ...fields } = parsed.data;
  const db = requireDb();

  if (fields.slug) {
    const conflict = await db
      .select({ id: actionAreas.id })
      .from(actionAreas)
      .where(eq(actionAreas.slug, fields.slug))
      .limit(1);
    if (conflict.length > 0 && conflict[0].id !== id) {
      return NextResponse.json(
        { error: 'Otro elemento ya utiliza ese slug.' },
        { status: 409 }
      );
    }
  }

  const [updated] = await db
    .update(actionAreas)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(actionAreas.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Área de acción no encontrada.' }, { status: 404 });
  }

  await recordAuditLog({
    actor: guard.actor,
    action: 'area.update',
    resourceType: 'action_areas',
    resourceId: String(id),
    summary: `Área de acción actualizada: ${updated.title}`,
  });

  revalidateTag(SITE_CONTENT_CACHE_TAG, 'max');
  revalidatePath('/');

  return NextResponse.json({ ok: true, actionArea: updated });
}

export async function DELETE(request: Request) {
  const guard = await requireApiPermission('area', 'delete');
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }

  const db = requireDb();
  const [deleted] = await db
    .delete(actionAreas)
    .where(eq(actionAreas.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: 'Área de acción no encontrada.' }, { status: 404 });
  }

  await recordAuditLog({
    actor: guard.actor,
    action: 'area.delete',
    resourceType: 'action_areas',
    resourceId: String(id),
    summary: `Área de acción eliminada: ${deleted.title}`,
  });

  revalidateTag(SITE_CONTENT_CACHE_TAG, 'max');
  revalidatePath('/');

  return NextResponse.json({ ok: true });
}
