import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { requireDb } from '@/db';
import { contactMessages } from '@/db/schema';
import { requireApiPermission } from '@/lib/auth/guards';
import { updateMessageStatusSchema } from '@/lib/cms/schemas';

export async function GET() {
  const guard = await requireApiPermission('message', 'read');
  if (!guard.ok) return guard.response;

  const db = requireDb();
  const rows = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt))
    .limit(100);

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

  return NextResponse.json({ ok: true, message: updated });
}
