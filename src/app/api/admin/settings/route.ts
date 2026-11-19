import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { eq } from 'drizzle-orm';
import { requireDb } from '@/db';
import { siteSettings } from '@/db/schema';
import { recordAuditLog, requireApiPermission } from '@/lib/auth/guards';
import { updateSiteSettingsSchema } from '@/lib/cms/schemas';
import { SITE_CONTENT_CACHE_TAG } from '@/lib/content/queries';

export async function GET() {
  const guard = await requireApiPermission('settings', 'read');
  if (!guard.ok) return guard.response;

  const db = requireDb();
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 'default'))
    .limit(1);

  return NextResponse.json({ settings: row ?? null });
}

export async function PATCH(request: Request) {
  // Strictly superadmin only (enforced by RBAC matrix: settings:update)
  const guard = await requireApiPermission('settings', 'update');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = updateSiteSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Configuración institucional inválida.', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const db = requireDb();

  await db
    .insert(siteSettings)
    .values({
      id: 'default',
      ...d,
      updatedByUserId: guard.actor.id,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: {
        ...d,
        updatedByUserId: guard.actor.id,
        updatedAt: new Date(),
      },
    });

  await recordAuditLog({
    actor: guard.actor,
    action: 'settings.update',
    resourceType: 'site_settings',
    resourceId: 'default',
    summary: 'Configuración global institucional actualizada',
  });

  revalidateTag(SITE_CONTENT_CACHE_TAG, 'max');
  revalidatePath('/');
  revalidatePath('/proyectos');

  return NextResponse.json({ ok: true });
}
