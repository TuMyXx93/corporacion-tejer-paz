import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { requireDb } from '@/db';
import { contactMessages } from '@/db/schema';
import { recordAuditLog, requireApiPermission } from '@/lib/auth/guards';
import { updateMessageStatusSchema } from '@/lib/cms/schemas';

export async function GET() {
  const guard = await requireApiPermission('message', 'read');
  if (!guard.ok) return guard.response;

  const db = requireDb();
  const rows = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt))
    .limit(200);

  return NextResponse.json({ messages: rows });
}

export async function PATCH(request: Request) {
  const guard = await requireApiPermission('message', 'update');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = updateMessageStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Estado de mensaje inválido.', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const db = requireDb();
  const [updated] = await db
    .update(contactMessages)
    .set({ status: parsed.data.status })
    .where(eq(contactMessages.id, parsed.data.id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Mensaje no encontrado.' }, { status: 404 });
  }

  await recordAuditLog({
    actor: guard.actor,
    action: 'message.update',
    resourceType: 'contact_messages',
    resourceId: String(updated.id),
    summary: `Estado de mensaje actualizado a "${updated.status}" (${updated.subject})`,
  });

  return NextResponse.json({ ok: true, message: updated });
}

export async function DELETE(request: Request) {
  const guard = await requireApiPermission('message', 'delete');
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }

  const db = requireDb();
  const [deleted] = await db
    .delete(contactMessages)
    .where(eq(contactMessages.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: 'Mensaje no encontrado.' }, { status: 404 });
  }

  await recordAuditLog({
    actor: guard.actor,
    action: 'message.delete',
    resourceType: 'contact_messages',
    resourceId: String(id),
    summary: `Mensaje eliminado de bandeja: ${deleted.subject}`,
  });

  return NextResponse.json({ ok: true });
}
