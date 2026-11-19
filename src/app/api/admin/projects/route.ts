import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { asc, eq } from 'drizzle-orm';
import { requireDb } from '@/db';
import { projects } from '@/db/schema';
import { recordAuditLog, requireApiPermission } from '@/lib/auth/guards';
import { createProjectSchema, updateProjectSchema } from '@/lib/cms/schemas';
import { SITE_CONTENT_CACHE_TAG } from '@/lib/content/queries';

export async function GET() {
  const guard = await requireApiPermission('project', 'read');
  if (!guard.ok) return guard.response;

  const db = requireDb();
  const rows = await db
    .select()
    .from(projects)
    .orderBy(asc(projects.sortOrder), asc(projects.id));
  return NextResponse.json({ projects: rows });
}

export async function POST(request: Request) {
  const guard = await requireApiPermission('project', 'create');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos de proyecto inválidos.', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const db = requireDb();
  const [created] = await db.insert(projects).values(parsed.data).returning();

  await recordAuditLog({
    actor: guard.actor,
    action: 'project.create',
    resourceType: 'projects',
    resourceId: String(created.id),
    summary: `Proyecto creado: ${created.title}`,
  });

  revalidateTag(SITE_CONTENT_CACHE_TAG, 'max');
  revalidatePath('/proyectos');

  return NextResponse.json({ ok: true, project: created }, { status: 201 });
}

export async function PATCH(request: Request) {
  const guard = await requireApiPermission('project', 'update');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos de proyecto inválidos.', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { id, ...fields } = parsed.data;
  const db = requireDb();
  const [updated] = await db
    .update(projects)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 });
  }

  await recordAuditLog({
    actor: guard.actor,
    action: 'project.update',
    resourceType: 'projects',
    resourceId: String(id),
    summary: `Proyecto actualizado: ${updated.title}`,
  });

  revalidateTag(SITE_CONTENT_CACHE_TAG, 'max');
  revalidatePath('/proyectos');

  return NextResponse.json({ ok: true, project: updated });
}

export async function DELETE(request: Request) {
  const guard = await requireApiPermission('project', 'delete');
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }

  const db = requireDb();
  const [deleted] = await db.delete(projects).where(eq(projects.id, id)).returning();
  if (!deleted) {
    return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 });
  }

  await recordAuditLog({
    actor: guard.actor,
    action: 'project.delete',
    resourceType: 'projects',
    resourceId: String(id),
    summary: `Proyecto eliminado: ${deleted.title}`,
  });

  revalidateTag(SITE_CONTENT_CACHE_TAG, 'max');
  revalidatePath('/proyectos');

  return NextResponse.json({ ok: true });
}
